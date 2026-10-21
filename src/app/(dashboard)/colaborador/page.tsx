import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { readDb } from "@/db/local-store";
import { AppShell } from "@/components/shared/app-shell";
import { ColaboradorDashboardView } from "@/features/accreditation/colaborador-dashboard-view";

export default async function ColaboradorPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const db = readDb();

  // Enriquecer projetos com membros, status e assinaturas
  const projects = db.projects.map((p) => {
    const expositorMemberships = db.projectMembers.filter(
      (pm) => pm.projectId === p.id && pm.memberRole === "EXPOSITOR"
    );
    const expositores = expositorMemberships
      .map((pm) => db.users.find((u) => u.id === pm.userId))
      .filter((u): u is NonNullable<typeof u> => Boolean(u));

    const avaliadorMemberships = db.projectMembers.filter(
      (pm) => pm.projectId === p.id && pm.memberRole === "AVALIADOR"
    );
    const avaliadores = avaliadorMemberships
      .map((pm) => {
        const u = db.users.find((user) => user.id === pm.userId);
        if (!u) return null;
        const hasEvaluated = db.evaluations.some(
          (e) => e.projectId === p.id && e.evaluatorId === u.id
        );
        return {
          id: u.id,
          name: u.name,
          isAccredited: u.isAccredited,
          hasEvaluated,
        };
      })
      .filter((a): a is NonNullable<typeof a> => Boolean(a));

    const signedByUser = p.accreditedByUserId
      ? db.users.find((u) => u.id === p.accreditedByUserId)?.name || null
      : null;

    return {
      ...p,
      expositores: expositores.map((e) => ({
        id: e.id,
        name: e.name,
        username: e.username,
      })),
      avaliadores,
      signedByUser,
    };
  });

  const evaluators = db.users
    .filter((u) => u.role === "AVALIADOR")
    .map((u) => {
      const assignedCount = db.projectMembers.filter(
        (pm) => pm.userId === u.id && pm.memberRole === "AVALIADOR"
      ).length;
      const completedCount = db.evaluations.filter(
        (e) => e.evaluatorId === u.id
      ).length;
      return {
        id: u.id,
        name: u.name,
        username: u.username,
        isAccredited: u.isAccredited,
        accreditationUnlocked: u.accreditationUnlocked,
        savedSignatureData: u.savedSignatureData,
        accreditationSignature: u.accreditationSignature,
        accreditedAt: u.accreditedAt,
        assignedCount,
        completedCount,
      };
    });

  const visitors = db.users
    .filter((u) => u.role === "VISITANTE")
    .map((v) => {
      const stamps = db.passportStamps.filter((s) => s.visitorId === v.id);
      const activeStamps = stamps.filter((s) => !s.isSpent).length;
      const spentStamps = stamps.filter((s) => s.isSpent).length;
      return {
        id: v.id,
        name: v.name,
        username: v.username,
        visitorShortCode: v.visitorShortCode || "V-0000",
        activeStamps,
        spentStamps,
        totalStamps: stamps.length,
      };
    });

  return (
    <AppShell
      hideHeader
      user={{
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        isAccredited: user.isAccredited,
      }}
    >
      <ColaboradorDashboardView
        currentUser={{
          id: user.id,
          name: user.name,
        }}
        projects={projects}
        evaluators={evaluators}
        visitors={visitors}
        rewards={db.rewards}
      />
    </AppShell>
  );
}
