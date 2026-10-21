"use server";

import { revalidatePath } from "next/cache";
import { mutateDb } from "@/db/local-store";
import { getCurrentUser } from "@/lib/session";

export async function unlockProjectAccreditationAction(projectId: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "COLABORADOR" && user.role !== "MASTER")) {
    return {
      success: false,
      error: "Apenas Colaboradores ou o Organizador Master podem liberar o credenciamento.",
    };
  }

  mutateDb((state) => {
    const project = state.projects.find((p) => p.id === projectId);
    if (project) {
      project.accreditationUnlocked = true;
    }
  });

  revalidatePath("/");
  return { success: true };
}

export async function signProjectAccreditationAction(payload: {
  projectId: string;
  signatureData: string;
  exhibitorUserId?: string;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Sessão inválida." };
  }

  let errorMsg: string | null = null;

  mutateDb((state) => {
    const project = state.projects.find((p) => p.id === payload.projectId);
    if (!project) {
      errorMsg = "Projeto não encontrado.";
      return;
    }

    const isStaff = user.role === "COLABORADOR" || user.role === "MASTER";
    const isTeamMember = state.projectMembers.some(
      (pm) =>
        pm.projectId === project.id &&
        pm.userId === user.id &&
        pm.memberRole === "EXPOSITOR"
    );

    if (!isStaff && !isTeamMember) {
      errorMsg = "Você não faz parte da equipe deste projeto.";
      return;
    }

    if (!isStaff && !project.accreditationUnlocked) {
      errorMsg =
        "Aguarde o Colaborador liberar a assinatura no balcão de credenciamento.";
      return;
    }

    project.isAccredited = true;
    project.accreditationUnlocked = true;
    project.accreditationSignature = payload.signatureData;
    project.accreditedByUserId = payload.exhibitorUserId || user.id;
    project.accreditedAt = new Date().toISOString();
  });

  if (errorMsg) {
    return { success: false, error: errorMsg };
  }

  revalidatePath("/");
  return { success: true };
}

export async function unlockEvaluatorAccreditationAction(evaluatorId: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "COLABORADOR" && user.role !== "MASTER")) {
    return {
      success: false,
      error: "Apenas Colaboradores ou Master podem liberar o credenciamento.",
    };
  }

  mutateDb((state) => {
    const evaluator = state.users.find((u) => u.id === evaluatorId);
    if (evaluator) {
      evaluator.accreditationUnlocked = true;
    }
  });

  revalidatePath("/");
  return { success: true };
}

export async function signEvaluatorAccreditationAction(payload: {
  evaluatorId: string;
  signatureData?: string;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Não autenticado." };
  }

  let errorMsg: string | null = null;

  mutateDb((state) => {
    const evaluator = state.users.find((u) => u.id === payload.evaluatorId);
    if (!evaluator) {
      errorMsg = "Avaliador não encontrado.";
      return;
    }

    const isStaff = user.role === "COLABORADOR" || user.role === "MASTER";
    const isSelf = user.id === evaluator.id;

    if (!isStaff && !isSelf) {
      errorMsg = "Operação não autorizada.";
      return;
    }

    if (!isStaff && !evaluator.accreditationUnlocked) {
      errorMsg = "Aguarde a recepção liberar sua assinatura de credenciamento.";
      return;
    }

    const finalSignature =
      payload.signatureData || evaluator.savedSignatureData;
    if (!finalSignature) {
      errorMsg = "Desenhe ou selecione uma assinatura válida.";
      return;
    }

    evaluator.isAccredited = true;
    evaluator.accreditationUnlocked = true;
    evaluator.accreditationSignature = finalSignature;
    if (!evaluator.savedSignatureData) {
      evaluator.savedSignatureData = finalSignature;
    }
    evaluator.accreditedAt = new Date().toISOString();
  });

  if (errorMsg) {
    return { success: false, error: errorMsg };
  }

  revalidatePath("/");
  return { success: true };
}
