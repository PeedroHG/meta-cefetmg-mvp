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

  const projects = db.projects.map((p) => {
    const expositores = db.projectMembers
      .filter((pm) => pm.projectId === p.id && pm.memberRole === "EXPOSITOR")
      .map((pm) => db.users.find((u) => u.id === pm.userId))
      .filter((u): u is NonNullable<typeof u> => Boolean(u));

    const avaliadores = db.projectMembers
      .filter((pm) => pm.projectId === p.id && pm.memberRole === "AVALIADOR")
      .map((pm) => {
        const avalUser = db.users.find((u) => u.id === pm.userId);
        const hasEvaluated = db.evaluations.some(
          (ev) => ev.projectId === p.id && ev.evaluatorId === pm.userId
        );
        return {
          id: pm.userId,
          name: avalUser?.name || "Avaliador",
          isAccredited: avalUser?.isAccredited ?? false,
          hasEvaluated,
        };
      });

    const signedByUser = p.accreditedByUserId
      ? db.users.find((u) => u.id === p.accreditedByUserId)?.name || "Expositor"
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
    .map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      isAccredited: u.isAccredited,
      accreditationUnlocked: u.accreditationUnlocked,
      savedSignatureData: u.savedSignatureData,
      accreditationSignature: u.accreditationSignature,
      accreditedAt: u.accreditedAt,
    }));

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
      user={{
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        isAccredited: user.isAccredited,
      }}
    >
      <ColaboradorDashboardView
        projects={projects}
        evaluators={evaluators}
        visitors={visitors}
        rewards={db.rewards}
      />
    </AppShell>
  );
}
