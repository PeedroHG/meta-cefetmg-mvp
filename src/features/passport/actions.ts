"use server";

import { revalidatePath } from "next/cache";
import { mutateDb, type ProjectRecord } from "@/db/local-store";
import { getCurrentUser } from "@/lib/session";
import { generateDynamicStampCode } from "@/lib/utils";

export async function refreshProjectStampTokenAction(projectId: string): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Não autenticado." };

  let newToken = "";
  mutateDb((state) => {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;
    const generated = generateDynamicStampCode(project.id);
    newToken = generated.code;
    project.activeStampToken = newToken;
    project.stampTokenExpiresAt = new Date(Date.now() + 60 * 1000).toISOString();
  });

  revalidatePath("/");
  return { success: true, token: newToken };
}

export async function collectProjectStampAction(payload: {
  codeOrToken: string;
  likedProject?: boolean;
}): Promise<{
  success: boolean;
  error?: string;
  project?: ProjectRecord;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Faça login para coletar selos." };
  }

  const cleanInput = payload.codeOrToken
    .trim()
    .replace(/^#|^S-/i, "")
    .trim();

  let errorMsg: string | null = null;
  let collectedProject: ProjectRecord | undefined;

  mutateDb((state) => {
    // Aceita: token dinâmico atual, activeStampToken salvo no projeto, ou shortCode na demonstração
    const targetProject = state.projects.find((p) => {
      const dynamicNow = generateDynamicStampCode(p.id).code;
      return (
        p.activeStampToken === cleanInput ||
        dynamicNow === cleanInput ||
        p.shortCode === cleanInput ||
        `META_STAMP:${p.id}:${p.activeStampToken}` === cleanInput
      );
    });

    if (!targetProject) {
      errorMsg =
        "Código de selo inválido ou expirado. Confira os dígitos exibidos na tela do Expositor.";
      return;
    }

    // Constraint UNIQUE(visitor_id, project_id): máximo 1 selo por projeto
    const alreadyHas = state.passportStamps.some(
      (s) => s.visitorId === user.id && s.projectId === targetProject.id
    );

    if (alreadyHas) {
      errorMsg = `Você já coletou o selo do projeto "${targetProject.title}" (#${targetProject.shortCode})!`;
      return;
    }

    state.passportStamps.unshift({
      id: `stamp-${Date.now()}`,
      visitorId: user.id,
      projectId: targetProject.id,
      isSpent: false,
      redemptionId: null,
      likedProject: payload.likedProject ?? true,
      collectedAt: new Date().toISOString(),
    });

    collectedProject = targetProject;
  });

  if (errorMsg) {
    return { success: false, error: errorMsg };
  }

  revalidatePath("/");
  return {
    success: true,
    project: collectedProject,
  };
}

export async function toggleFavoriteStampProjectAction(stampId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false };

  mutateDb((state) => {
    const stamp = state.passportStamps.find(
      (s) => s.id === stampId && s.visitorId === user.id
    );
    if (stamp) {
      stamp.likedProject = !stamp.likedProject;
    }
  });

  revalidatePath("/");
  return { success: true };
}

/**
 * Troca de Selos por Brinde operada pelo Colaborador:
 * Debita os N selos ativos mais antigos do visitante e os transforma em
 * isSpent = true (Preto e Branco com carimbo "TROCA REALIZADA"), sem apagá-los da coleção!
 */
export async function redeemRewardWithStampsAction(payload: {
  visitorIdentifier: string; // id, visitorShortCode (V-3590) ou username
  rewardId: string;
}): Promise<{
  success: boolean;
  error?: string;
  visitorName?: string;
  rewardName?: string;
  stampsDebited?: number;
  remainingActiveStamps?: number;
}> {
  const staff = await getCurrentUser();
  if (!staff || (staff.role !== "COLABORADOR" && staff.role !== "MASTER")) {
    return {
      success: false,
      error: "Apenas Colaboradores ou o Organizador Master podem debitar selos por brindes.",
    };
  }

  const cleanId = payload.visitorIdentifier.trim().toLowerCase();
  let errorMsg: string | null = null;
  let visitorNameOut = "";
  let rewardNameOut = "";
  let stampsDebitedOut = 0;
  let remainingActiveStampsOut = 0;
  let completed = false;

  mutateDb((state) => {
    const visitor = state.users.find(
      (u) =>
        u.role === "VISITANTE" &&
        (u.id.toLowerCase() === cleanId ||
          u.username.toLowerCase() === cleanId ||
          (u.visitorShortCode && u.visitorShortCode.toLowerCase() === cleanId) ||
          u.name.toLowerCase().includes(cleanId))
    );

    if (!visitor) {
      errorMsg =
        "Visitante não encontrado. Verifique o código da carteira (ex: V-3590) ou o e-mail.";
      return;
    }

    const reward = state.rewards.find((r) => r.id === payload.rewardId);
    if (!reward) {
      errorMsg = "Brinde selecionado não encontrado.";
      return;
    }

    if (reward.stockQuantity <= 0) {
      errorMsg = `O brinde "${reward.name}" está esgotado no momento.`;
      return;
    }

    // Buscar selos ATIVOS (coloridos, isSpent = false) ordenados pelos mais antigos
    const activeStamps = state.passportStamps
      .filter((s) => s.visitorId === visitor.id && !s.isSpent)
      .sort(
        (a, b) =>
          new Date(a.collectedAt).getTime() - new Date(b.collectedAt).getTime()
      );

    if (activeStamps.length < reward.stampCost) {
      errorMsg = `Saldo insuficiente: ${visitor.name} possui ${activeStamps.length} selo(s) ativo(s), mas "${reward.name}" exige ${reward.stampCost} selos.`;
      return;
    }

    const redemptionId = `redemp-${Date.now()}`;
    const stampsToSpend = activeStamps.slice(0, reward.stampCost);

    for (const st of stampsToSpend) {
      st.isSpent = true;
      st.redemptionId = redemptionId;
    }

    reward.stockQuantity -= 1;

    state.rewardRedemptions.unshift({
      id: redemptionId,
      visitorId: visitor.id,
      rewardId: reward.id,
      collaboratorId: staff.id,
      stampsDebited: reward.stampCost,
      redeemedAt: new Date().toISOString(),
    });

    visitorNameOut = visitor.name;
    rewardNameOut = reward.name;
    stampsDebitedOut = reward.stampCost;
    remainingActiveStampsOut = activeStamps.length - reward.stampCost;
    completed = true;
  });

  if (errorMsg || !completed) {
    return { success: false, error: errorMsg || "Falha ao resgatar brinde." };
  }

  revalidatePath("/");
  return {
    success: true,
    visitorName: visitorNameOut,
    rewardName: rewardNameOut,
    stampsDebited: stampsDebitedOut,
    remainingActiveStamps: remainingActiveStampsOut,
  };
}
