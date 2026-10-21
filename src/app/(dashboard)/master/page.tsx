import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { readDb } from "@/db/local-store";
import { AppShell } from "@/components/shared/app-shell";
import { MasterDashboardView } from "@/features/projects/master-dashboard-view";

export default async function MasterPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const db = readDb();

  const enrichedProjects = db.projects.map((p) => {
    const tagIds = db.projectTags
      .filter((pt) => pt.projectId === p.id)
      .map((pt) => pt.tagId);
    const projectTags = db.tags.filter((t) => tagIds.includes(t.id));

    const expositores = db.projectMembers
      .filter((pm) => pm.projectId === p.id && pm.memberRole === "EXPOSITOR")
      .map((pm) => db.users.find((u) => u.id === pm.userId))
      .filter((u): u is NonNullable<typeof u> => Boolean(u));

    const avaliadores = db.projectMembers
      .filter((pm) => pm.projectId === p.id && pm.memberRole === "AVALIADOR")
      .map((pm) => {
        const avalUser = db.users.find((u) => u.id === pm.userId);
        const evaluation = db.evaluations.find(
          (ev) => ev.projectId === p.id && ev.evaluatorId === pm.userId
        );
        return {
          id: pm.userId,
          name: avalUser?.name || "Avaliador",
          username: avalUser?.username || "",
          isAccredited: avalUser?.isAccredited ?? false,
          hasEvaluated: Boolean(evaluation),
          totalScore: evaluation?.totalScore ?? null,
          scoreLogbook: evaluation?.scoreLogbook ?? null,
          feedbackNotes: evaluation?.feedbackNotes ?? null,
        };
      });

    const projectEvals = db.evaluations.filter((ev) => ev.projectId === p.id);
    const avgScore =
      projectEvals.length > 0
        ? projectEvals.reduce((acc, cur) => acc + Number(cur.totalScore), 0) /
          projectEvals.length
        : null;

    const popularVotes = db.passportStamps.filter(
      (s) => s.projectId === p.id && s.likedProject
    ).length;

    const totalStampsIssued = db.passportStamps.filter(
      (s) => s.projectId === p.id
    ).length;

    return {
      ...p,
      tags: projectTags,
      expositores: expositores.map((e) => ({
        id: e.id,
        name: e.name,
        username: e.username,
        tempPasswordHint: e.tempPasswordHint,
      })),
      avaliadores,
      avgScore,
      popularVotes,
      totalStampsIssued,
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
      <MasterDashboardView
        projects={enrichedProjects}
        users={db.users.map((u) => ({
          id: u.id,
          name: u.name,
          username: u.username,
          role: u.role,
          mustChangePassword: u.mustChangePassword,
          tempPasswordHint: u.tempPasswordHint,
          isAccredited: u.isAccredited,
        }))}
        tags={db.tags}
        rewards={db.rewards}
      />
    </AppShell>
  );
}
