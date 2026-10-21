"use server";

import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import {
  readDb,
  mutateDb,
  resetDbToSeed,
  type UserRecord,
} from "@/db/local-store";
import type { UserRole } from "@/db/schema";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  getCurrentUser,
} from "@/lib/session";
import { ROLE_META_CONFIG } from "@/lib/utils";

async function setSessionCookieForUser(user: UserRecord) {
  const token = await createSessionToken({
    userId: user.id,
    role: user.role,
    username: user.username,
    name: user.name,
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function loginAction(formData: {
  username: string;
  password: string;
}): Promise<{
  success: boolean;
  error?: string;
  redirectTo?: string;
}> {
  const db = readDb();
  const cleanUser = formData.username.trim().toLowerCase();

  const user = db.users.find(
    (u) => u.username.toLowerCase() === cleanUser
  );

  if (!user) {
    return {
      success: false,
      error: "Usuário, matrícula ou e-mail não encontrado.",
    };
  }

  const isPasswordValid =
    bcrypt.compareSync(formData.password, user.passwordHash) ||
    (user.tempPasswordHint && formData.password === user.tempPasswordHint);

  if (!isPasswordValid) {
    return {
      success: false,
      error: "Senha incorreta. Para contas de demonstração, use 'meta2026' ou a senha provisória.",
    };
  }

  await setSessionCookieForUser(user);

  if (user.mustChangePassword || !user.onboardingCompleted) {
    return {
      success: true,
      redirectTo: "/primeiro-acesso",
    };
  }

  return {
    success: true,
    redirectTo: ROLE_META_CONFIG[user.role].defaultRoute,
  };
}

export async function registerVisitorAction(formData: {
  name: string;
  username: string;
  password: string;
  selectedTagIds: string[];
}): Promise<{
  success: boolean;
  error?: string;
  redirectTo?: string;
}> {
  const cleanEmail = formData.username.trim().toLowerCase();
  if (!formData.name.trim() || !cleanEmail || formData.password.length < 4) {
    return {
      success: false,
      error: "Preencha seu nome, e-mail/usuário e uma senha de pelo menos 4 caracteres.",
    };
  }

  let createdUser: UserRecord | null = null;
  let duplicateError = false;

  mutateDb((state) => {
    const exists = state.users.some(
      (u) => u.username.toLowerCase() === cleanEmail
    );
    if (exists) {
      duplicateError = true;
      return;
    }

    const shortNum = Math.floor(1000 + Math.random() * 9000);
    const newUser: UserRecord = {
      id: `user-vis-${Date.now()}`,
      username: cleanEmail,
      name: formData.name.trim(),
      passwordHash: bcrypt.hashSync(formData.password, 8),
      role: "VISITANTE",
      mustChangePassword: false,
      tempPasswordHint: null,
      isAccredited: true,
      accreditationUnlocked: true,
      savedSignatureData: null,
      accreditationSignature: null,
      accreditedAt: new Date().toISOString(),
      onboardingCompleted: true,
      visitorShortCode: `V-${shortNum}`,
      createdAt: new Date().toISOString(),
    };

    state.users.push(newUser);

    for (const tagId of formData.selectedTagIds) {
      state.visitorInterests.push({
        id: `vi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        visitorId: newUser.id,
        tagId,
      });
    }

    createdUser = newUser;
  });

  if (duplicateError || !createdUser) {
    return {
      success: false,
      error: "Este e-mail ou usuário já está cadastrado.",
    };
  }

  await setSessionCookieForUser(createdUser);
  revalidatePath("/");
  return {
    success: true,
    redirectTo: "/visitante",
  };
}

export async function completeOnboardingAction(payload: {
  newPassword?: string;
  signatureData?: string | null;
  selectedTagIds?: string[];
}): Promise<{
  success: boolean;
  error?: string;
  redirectTo?: string;
}> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sessão expirada." };
  }

  if (currentUser.mustChangePassword) {
    if (!payload.newPassword || payload.newPassword.length < 4) {
      return {
        success: false,
        error: "Defina uma nova senha definitiva com pelo menos 4 caracteres.",
      };
    }
  }

  if (
    currentUser.role === "AVALIADOR" &&
    !currentUser.savedSignatureData &&
    !payload.signatureData
  ) {
    return {
      success: false,
      error: "Como Avaliador, desenhe sua assinatura no Canvas para usar com 1 clique nos estandes.",
    };
  }

  let updatedRole: UserRole = currentUser.role;

  mutateDb((state) => {
    const user = state.users.find((u) => u.id === currentUser.id);
    if (!user) return;

    if (payload.newPassword && payload.newPassword.length >= 4) {
      user.passwordHash = bcrypt.hashSync(payload.newPassword, 8);
      user.mustChangePassword = false;
      user.tempPasswordHint = null;
    }

    if (payload.signatureData) {
      user.savedSignatureData = payload.signatureData;
    }

    if (user.role === "VISITANTE" && payload.selectedTagIds) {
      state.visitorInterests = state.visitorInterests.filter(
        (vi) => vi.visitorId !== user.id
      );
      for (const tagId of payload.selectedTagIds) {
        state.visitorInterests.push({
          id: `vi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          visitorId: user.id,
          tagId,
        });
      }
    }

    user.onboardingCompleted = true;
    updatedRole = user.role;
  });

  revalidatePath("/");
  return {
    success: true,
    redirectTo: ROLE_META_CONFIG[updatedRole].defaultRoute,
  };
}

export async function switchDemoRoleAction(role: UserRole): Promise<{
  success: boolean;
  redirectTo?: string;
}> {
  const db = readDb();
  const preferredMap: Record<UserRole, string> = {
    MASTER: "user-master-1",
    COLABORADOR: "user-colab-1",
    EXPOSITOR: "user-exp-1",
    AVALIADOR: "user-aval-1",
    VISITANTE: "user-vis-1",
  };

  const targetUser =
    db.users.find((u) => u.id === preferredMap[role]) ||
    db.users.find((u) => u.role === role);

  if (!targetUser) {
    return { success: false };
  }

  await setSessionCookieForUser(targetUser);
  revalidatePath("/");
  return {
    success: true,
    redirectTo: ROLE_META_CONFIG[role].defaultRoute,
  };
}

export async function switchSpecificDemoUserAction(userId: string): Promise<{
  success: boolean;
  redirectTo?: string;
}> {
  const db = readDb();
  const targetUser = db.users.find((u) => u.id === userId);
  if (!targetUser) return { success: false };

  await setSessionCookieForUser(targetUser);
  revalidatePath("/");

  if (targetUser.mustChangePassword || !targetUser.onboardingCompleted) {
    return { success: true, redirectTo: "/primeiro-acesso" };
  }
  return {
    success: true,
    redirectTo: ROLE_META_CONFIG[targetUser.role].defaultRoute,
  };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  revalidatePath("/");
  return { success: true, redirectTo: "/login" };
}

export async function resetDemoDatabaseAction() {
  resetDbToSeed();
  revalidatePath("/");
  return { success: true };
}
