import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { readDb } from "@/db/local-store";
import { AppShell } from "@/components/shared/app-shell";
import { ExpositorDashboardView } from "@/features/projects/expositor-dashboard-view";

export default async function ExpositorPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const db = readDb();

  // Buscar o projeto vinculado a este expositor (ou fallback para proj-1 na demonstração)
  const myMembership = db.projectMembers.find(
    (pm) => pm.userId === user.id && pm.memberRole === "EXPOSITOR"
  );
  const project =
    db.projects.find((p) => p.id === myMembership?.projectId) || db.projects[0];

  const tagIds = db.projectTags
    .filter((pt) => pt.projectId === project.id)
    .map((pt) => pt.tagId);
  const projectTags = db.tags.filter((t) => tagIds.includes(t.id));

  const teamMembers = db.projectMembers
    .filter((pm) => pm.projectId === project.id && pm.memberRole === "EXPOSITOR")
    .map((pm) => db.users.find((u) => u.id === pm.userId))
    .filter((u): u is NonNullable<typeof u> => Boolean(u));

  // Avaliadores vinculados (REGRA ESTRITA: mostrar APENAS se avaliou ou falta avaliar, NUNCA mostrar notas)
  const assignedEvaluators = db.projectMembers
    .filter((pm) => pm.projectId === project.id && pm.memberRole === "AVALIADOR")
    .map((pm) => {
      const avalUser = db.users.find((u) => u.id === pm.userId);
      const hasEvaluated = db.evaluations.some(
        (ev) => ev.projectId === project.id && ev.evaluatorId === pm.userId
      );
      return {
        id: pm.userId,
        name: avalUser?.name || "Avaliador Oficial",
        hasEvaluated,
      };
    });

  const stampsCollectedCount = db.passportStamps.filter(
    (s) => s.projectId === project.id
  ).length;

  return (
    <AppShell
      hideHeader
      user={{
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        isAccredited: project.isAccredited,
      }}
    >
      <ExpositorDashboardView
        currentUser={{
          id: user.id,
          name: user.name,
        }}
        project={{
          ...project,
          tags: projectTags,
          teamMembers: teamMembers.map((m) => ({
            id: m.id,
            name: m.name,
            username: m.username,
          })),
          assignedEvaluators,
          stampsCollectedCount,
        }}
      />
    </AppShell>
  );
}
