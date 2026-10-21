import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { readDb } from "@/db/local-store";
import { AppShell } from "@/components/shared/app-shell";
import { VisitanteDashboardView } from "@/features/passport/visitante-dashboard-view";

export default async function VisitantePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const db = readDb();

  // Caso outro perfil acesse /visitante diretamente na demo, usa a visitante Beatriz (user-vis-1)
  const visitorUser =
    user.role === "VISITANTE"
      ? user
      : db.users.find((u) => u.id === "user-vis-1") || user;

  const myInterestTagIds = db.visitorInterests
    .filter((vi) => vi.visitorId === visitorUser.id)
    .map((vi) => vi.tagId);

  const myStamps = db.passportStamps
    .filter((s) => s.visitorId === visitorUser.id)
    .map((s) => {
      const proj = db.projects.find((p) => p.id === s.projectId);
      return {
        ...s,
        projectTitle: proj?.title || "Projeto META",
        projectShortCode: proj?.shortCode || "0000",
        projectLocation: proj?.standLocation || "",
        stampImageUrl: proj?.stampImageUrl || "",
      };
    });

  const collectedProjectIds = new Set(myStamps.map((s) => s.projectId));

  const enrichedProjects = db.projects.map((p) => {
    const pTagIds = db.projectTags
      .filter((pt) => pt.projectId === p.id)
      .map((pt) => pt.tagId);
    const projectTags = db.tags.filter((t) => pTagIds.includes(t.id));

    const matchCount = pTagIds.filter((tid) =>
      myInterestTagIds.includes(tid)
    ).length;

    const alreadyCollected = collectedProjectIds.has(p.id);

    return {
      ...p,
      tags: projectTags,
      matchCount,
      alreadyCollected,
    };
  });

  // Ordenar recomendados pelo maior número de tags em comum
  const recommendedProjects = [...enrichedProjects].sort(
    (a, b) => b.matchCount - a.matchCount
  );

  return (
    <AppShell
      user={{
        id: visitorUser.id,
        name: visitorUser.name,
        username: visitorUser.username,
        role: visitorUser.role,
        isAccredited: true,
      }}
    >
      <VisitanteDashboardView
        visitor={{
          id: visitorUser.id,
          name: visitorUser.name,
          username: visitorUser.username,
          visitorShortCode: visitorUser.visitorShortCode || "V-3590",
        }}
        stamps={myStamps}
        recommendedProjects={recommendedProjects}
        rewards={db.rewards}
        tags={db.tags}
        myInterestTagIds={myInterestTagIds}
      />
    </AppShell>
  );
}
