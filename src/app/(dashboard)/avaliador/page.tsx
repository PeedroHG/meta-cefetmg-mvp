import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { readDb } from "@/db/local-store";
import { AppShell } from "@/components/shared/app-shell";
import { AvaliadorDashboardView } from "@/features/evaluation/avaliador-dashboard-view";

export default async function AvaliadorPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const db = readDb();

  // Caso o usuário esteja em outro perfil na demo e acesse /avaliador diretamente, usa o avaliador principal
  const evaluatorUser =
    user.role === "AVALIADOR"
      ? user
      : db.users.find((u) => u.id === "user-aval-1") || user;

  const assignedProjectIds = db.projectMembers
    .filter(
      (pm) => pm.userId === evaluatorUser.id && pm.memberRole === "AVALIADOR"
    )
    .map((pm) => pm.projectId);

  const assignedProjects = db.projects
    .filter((p) => assignedProjectIds.includes(p.id))
    .map((p) => {
      const expositores = db.projectMembers
        .filter((pm) => pm.projectId === p.id && pm.memberRole === "EXPOSITOR")
        .map((pm) => db.users.find((u) => u.id === pm.userId)?.name || "Aluno");

      const myEvaluation = db.evaluations.find(
        (ev) => ev.projectId === p.id && ev.evaluatorId === evaluatorUser.id
      );

      return {
        ...p,
        expositores,
        myEvaluation: myEvaluation || null,
      };
    });

  return (
    <AppShell
      user={{
        id: evaluatorUser.id,
        name: evaluatorUser.name,
        username: evaluatorUser.username,
        role: evaluatorUser.role,
        isAccredited: evaluatorUser.isAccredited,
      }}
    >
      <AvaliadorDashboardView
        evaluator={{
          id: evaluatorUser.id,
          name: evaluatorUser.name,
          isAccredited: evaluatorUser.isAccredited,
          accreditationUnlocked: evaluatorUser.accreditationUnlocked,
          savedSignatureData: evaluatorUser.savedSignatureData,
        }}
        projects={assignedProjects}
      />
    </AppShell>
  );
}
