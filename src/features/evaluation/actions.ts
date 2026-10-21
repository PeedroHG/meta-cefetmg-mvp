"use server";

import { revalidatePath } from "next/cache";
import { mutateDb } from "@/db/local-store";
import { getCurrentUser } from "@/lib/session";

export async function submitProjectEvaluationAction(payload: {
  projectId: string;
  scoreLogbook: number;
  scoreRelevance: number;
  scoreMethodology: number;
  scorePresentation: number;
  scoreStand: number;
  feedbackNotes: string;
  signatureData?: string;
}): Promise<{
  success: boolean;
  error?: string;
  totalScore?: number;
}> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "AVALIADOR" && user.role !== "MASTER")) {
    return {
      success: false,
      error: "Apenas Avaliadores oficiais podem registrar avaliações.",
    };
  }

  let errorMsg: string | null = null;
  let calculatedTotal = 0;

  mutateDb((state) => {
    const evaluator = state.users.find((u) => u.id === user.id);
    const project = state.projects.find((p) => p.id === payload.projectId);

    if (!evaluator || !project) {
      errorMsg = "Projeto ou avaliador não encontrado.";
      return;
    }

    // Regra de Bloqueio 1: Avaliador precisa estar CREDENCIADO
    if (!evaluator.isAccredited) {
      errorMsg =
        "Bloqueado: Você precisa realizar seu Credenciamento na Recepção antes de avaliar projetos.";
      return;
    }

    // Regra de Bloqueio 2: Projeto precisa estar CREDENCIADO
    if (!project.isAccredited) {
      errorMsg =
        "Bloqueado: A equipe deste projeto ainda não realizou o Credenciamento na Recepção.";
      return;
    }

    // Verificar vínculo na banca (ou permitir se for Master)
    const isAssigned =
      user.role === "MASTER" ||
      state.projectMembers.some(
        (pm) =>
          pm.projectId === project.id &&
          pm.userId === evaluator.id &&
          pm.memberRole === "AVALIADOR"
      );

    if (!isAssigned) {
      errorMsg = "Este projeto não faz parte da sua carteira de avaliação.";
      return;
    }

    // Verificar duplicidade UNIQUE(project_id, evaluator_id)
    const existing = state.evaluations.find(
      (ev) => ev.projectId === project.id && ev.evaluatorId === evaluator.id
    );
    if (existing) {
      errorMsg = "Você já avaliou este projeto anteriormente.";
      return;
    }

    const finalSignature =
      payload.signatureData || evaluator.savedSignatureData;
    if (!finalSignature) {
      errorMsg = "Confirme sua assinatura digital para encerrar a avaliação.";
      return;
    }

    calculatedTotal =
      Number(payload.scoreLogbook) +
      Number(payload.scoreRelevance) +
      Number(payload.scoreMethodology) +
      Number(payload.scorePresentation) +
      Number(payload.scoreStand);

    state.evaluations.push({
      id: `eval-${Date.now()}`,
      projectId: project.id,
      evaluatorId: evaluator.id,
      scoreLogbook: payload.scoreLogbook,
      scoreRelevance: payload.scoreRelevance,
      scoreMethodology: payload.scoreMethodology,
      scorePresentation: payload.scorePresentation,
      scoreStand: payload.scoreStand,
      totalScore: calculatedTotal,
      feedbackNotes: payload.feedbackNotes.trim(),
      signatureData: finalSignature,
      createdAt: new Date().toISOString(),
    });
  });

  if (errorMsg) {
    return { success: false, error: errorMsg };
  }

  revalidatePath("/");
  return {
    success: true,
    totalScore: calculatedTotal,
  };
}
