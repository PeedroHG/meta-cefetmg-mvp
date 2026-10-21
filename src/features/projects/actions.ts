"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import {
  mutateDb,
  type ProjectRecord,
  type UserRecord,
} from "@/db/local-store";
import { getCurrentUser } from "@/lib/session";

export interface ProvisionedCredential {
  name: string;
  username: string;
  role: "EXPOSITOR" | "AVALIADOR" | "COLABORADOR";
  tempPassword: string;
  isNew: boolean;
}

function makeDefaultProjectStampSvg(label: string, code: string) {
  const cleanLabel = label.slice(0, 11).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1565C0" />
        <stop offset="100%" stop-color="#D81B60" />
      </linearGradient>
    </defs>
    <circle cx="80" cy="80" r="72" fill="url(#g)" stroke="#ffffff" stroke-width="4" stroke-dasharray="6 4"/>
    <text x="80" y="46" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="10" font-weight="700">35ª META • CEFET-MG</text>
    <text x="80" y="86" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="800">${cleanLabel}</text>
    <text x="80" y="116" text-anchor="middle" fill="#ffffff" font-family="monospace" font-size="13" font-weight="700">#${code}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export async function createProjectWithAutoProvisionAction(payload: {
  title: string;
  sigaaCode: string;
  standLocation: string;
  shift: "Manhã" | "Tarde" | "Integral";
  bio?: string;
  tagIds: string[];
  expositoresNames: string[]; // formato: "Nome Completo <usuario>" ou apenas "Nome Completo"
  avaliadoresNames: string[];
}): Promise<{
  success: boolean;
  error?: string;
  project?: ProjectRecord;
  provisionedCredentials?: ProvisionedCredential[];
}> {
  const user = await getCurrentUser();
  if (!user || user.role !== "MASTER") {
    return {
      success: false,
      error: "Permissão negada: apenas o Organizador Master pode criar projetos e definir vínculos.",
    };
  }

  if (!payload.title.trim() || !payload.standLocation.trim()) {
    return {
      success: false,
      error: "Informe o título oficial do projeto e a localização do estande.",
    };
  }

  const provisioned: ProvisionedCredential[] = [];
  let createdProject: ProjectRecord | undefined;

  mutateDb((state) => {
    // Gerar Código Curto Numérico Único de 4 dígitos
    let shortCode = String(Math.floor(1000 + Math.random() * 9000));
    while (state.projects.some((p) => p.shortCode === shortCode)) {
      shortCode = String(Math.floor(1000 + Math.random() * 9000));
    }

    const sigaaCode =
      payload.sigaaCode.trim() || `META2026-SIGAA-${shortCode}`;

    const projectId = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newProj: ProjectRecord = {
      id: projectId,
      sigaaCode,
      shortCode,
      title: payload.title.trim(),
      standLocation: payload.standLocation.trim(),
      shift: payload.shift,
      bio:
        payload.bio?.trim() ||
        "Projeto científico e tecnológico selecionado para a 35ª META — CEFET-MG.",
      logoUrl: null,
      stampImageUrl: makeDefaultProjectStampSvg(payload.title.trim(), shortCode),
      isAccredited: false,
      accreditationUnlocked: false,
      accreditationSignature: null,
      accreditedByUserId: null,
      accreditedAt: null,
      activeStampToken: String(Math.floor(100000 + Math.random() * 900000)),
      stampTokenExpiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    state.projects.unshift(newProj);
    createdProject = newProj;

    // Vincular Tags
    for (const tagId of payload.tagIds) {
      state.projectTags.push({
        id: `pt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        projectId,
        tagId,
      });
    }

    // Helper para auto-provisionar ou vincular usuário
    const ensureAndLinkUser = (
      rawEntry: string,
      memberRole: "EXPOSITOR" | "AVALIADOR"
    ) => {
      const clean = rawEntry.trim();
      if (!clean) return;

      // Extrair username ou gerar automaticamente a partir do nome
      const slug = clean
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, ".")
        .replace(/^\.|\.$|/g, "");

      let targetUser = state.users.find(
        (u) =>
          u.username.toLowerCase() === clean.toLowerCase() ||
          u.name.toLowerCase() === clean.toLowerCase() ||
          u.username.toLowerCase() === slug
      );

      let isNew = false;
      let tempPassword =
        targetUser?.tempPasswordHint || "meta2026 (Já cadastrado)";

      if (!targetUser) {
        isNew = true;
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        tempPassword =
          memberRole === "AVALIADOR"
            ? `AVAL-${randomDigits}`
            : `META-${randomDigits}`;

        const newUser: UserRecord = {
          id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          username: slug || `usuario.${randomDigits}`,
          name: clean,
          passwordHash: bcrypt.hashSync(tempPassword, 8),
          role: memberRole,
          mustChangePassword: true,
          tempPasswordHint: tempPassword,
          isAccredited: false,
          accreditationUnlocked: false,
          savedSignatureData: null,
          accreditationSignature: null,
          accreditedAt: null,
          onboardingCompleted: false,
          visitorShortCode: null,
          createdAt: new Date().toISOString(),
        };
        state.users.push(newUser);
        targetUser = newUser;
      }

      const alreadyLinked = state.projectMembers.some(
        (pm) =>
          pm.projectId === projectId &&
          pm.userId === targetUser!.id &&
          pm.memberRole === memberRole
      );

      if (!alreadyLinked) {
        state.projectMembers.push({
          id: `pm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          projectId,
          userId: targetUser.id,
          memberRole,
        });
      }

      provisioned.push({
        name: targetUser.name,
        username: targetUser.username,
        role: memberRole,
        tempPassword,
        isNew,
      });
    };

    for (const exp of payload.expositoresNames) {
      ensureAndLinkUser(exp, "EXPOSITOR");
    }
    for (const aval of payload.avaliadoresNames) {
      ensureAndLinkUser(aval, "AVALIADOR");
    }
  });

  revalidatePath("/");
  return {
    success: true,
    project: createdProject,
    provisionedCredentials: provisioned,
  };
}

export async function importSigaaBatchAction(
  rows: {
    title: string;
    sigaaCode: string;
    standLocation: string;
    shift: "Manhã" | "Tarde" | "Integral";
    tagsText: string;
    expositoresText: string;
    avaliadoresText: string;
  }[]
): Promise<{
  success: boolean;
  error?: string;
  importedCount?: number;
  provisionedCredentials?: ProvisionedCredential[];
}> {
  const user = await getCurrentUser();
  if (!user || user.role !== "MASTER") {
    return {
      success: false,
      error: "Apenas o Organizador Master pode importar planilhas SIGAA.",
    };
  }

  const allProvisioned: ProvisionedCredential[] = [];
  let count = 0;

  for (const row of rows) {
    if (!row.title?.trim()) continue;
    const res = await createProjectWithAutoProvisionAction({
      title: row.title,
      sigaaCode: row.sigaaCode,
      standLocation: row.standLocation || "Pátio Central • Bloco A",
      shift: row.shift || "Manhã",
      tagIds: ["tag-ia", "tag-robotica"],
      expositoresNames: row.expositoresText
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean),
      avaliadoresNames: row.avaliadoresText
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean),
    });

    if (res.success) {
      count++;
      if (res.provisionedCredentials) {
        allProvisioned.push(...res.provisionedCredentials);
      }
    }
  }

  revalidatePath("/");
  return {
    success: true,
    importedCount: count,
    provisionedCredentials: allProvisioned,
  };
}

export async function createInternalStaffUserAction(payload: {
  name: string;
  username: string;
  role: "COLABORADOR" | "AVALIADOR" | "EXPOSITOR";
}): Promise<{
  success: boolean;
  error?: string;
  credential?: ProvisionedCredential;
}> {
  const user = await getCurrentUser();
  if (!user || user.role !== "MASTER") {
    return { success: false, error: "Apenas o Organizador Master pode criar usuários." };
  }

  let createdCred: ProvisionedCredential | undefined;
  let dupError = false;

  mutateDb((state) => {
    const cleanUsername = payload.username.trim().toLowerCase();
    if (state.users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      dupError = true;
      return;
    }

    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const tempPassword = `META-${randomDigits}`;
    const newUser: UserRecord = {
      id: `user-${Date.now()}`,
      username: cleanUsername,
      name: payload.name.trim(),
      passwordHash: bcrypt.hashSync(tempPassword, 8),
      role: payload.role,
      mustChangePassword: true,
      tempPasswordHint: tempPassword,
      isAccredited: payload.role === "COLABORADOR",
      accreditationUnlocked: payload.role === "COLABORADOR",
      savedSignatureData: null,
      accreditationSignature: null,
      accreditedAt: payload.role === "COLABORADOR" ? new Date().toISOString() : null,
      onboardingCompleted: false,
      visitorShortCode: null,
      createdAt: new Date().toISOString(),
    };
    state.users.unshift(newUser);
    createdCred = {
      name: newUser.name,
      username: newUser.username,
      role: payload.role,
      tempPassword,
      isNew: true,
    };
  });

  if (dupError) {
    return { success: false, error: "Este login já está em uso." };
  }

  revalidatePath("/");
  return { success: true, credential: createdCred };
}

export async function updateProjectStandByExpositorAction(payload: {
  projectId: string;
  bio: string;
  stampLabel?: string;
  stampPrimaryColor?: string;
  stampSecondaryColor?: string;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "EXPOSITOR" && user.role !== "MASTER")) {
    return {
      success: false,
      error: "Apenas expositores vinculados ao projeto podem personalizar o estande.",
    };
  }

  let allowed = false;
  mutateDb((state) => {
    const proj = state.projects.find((p) => p.id === payload.projectId);
    if (!proj) return;

    const isMember =
      user.role === "MASTER" ||
      state.projectMembers.some(
        (pm) =>
          pm.projectId === proj.id &&
          pm.userId === user.id &&
          pm.memberRole === "EXPOSITOR"
      );
    if (!isMember) return;

    allowed = true;
    proj.bio = payload.bio.trim();

    if (payload.stampLabel && payload.stampPrimaryColor && payload.stampSecondaryColor) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${payload.stampPrimaryColor}" />
            <stop offset="100%" stop-color="${payload.stampSecondaryColor}" />
          </linearGradient>
        </defs>
        <circle cx="80" cy="80" r="72" fill="url(#g)" stroke="#ffffff" stroke-width="4" stroke-dasharray="6 4"/>
        <circle cx="80" cy="80" r="60" fill="none" stroke="#ffffff" stroke-opacity="0.6" stroke-width="1.5"/>
        <text x="80" y="46" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="10" font-weight="700" letter-spacing="1.5">35ª META • CEFET-MG</text>
        <text x="80" y="86" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="17" font-weight="800">${payload.stampLabel.toUpperCase().slice(0, 12)}</text>
        <rect x="46" y="102" width="68" height="22" rx="11" fill="#0F172A" fill-opacity="0.35"/>
        <text x="80" y="117" text-anchor="middle" fill="#ffffff" font-family="monospace" font-size="12" font-weight="700">#${proj.shortCode}</text>
      </svg>`;
      proj.stampImageUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }
  });

  if (!allowed) {
    return {
      success: false,
      error: "Você não possui vínculo como expositor deste projeto.",
    };
  }

  revalidatePath("/");
  return { success: true };
}
