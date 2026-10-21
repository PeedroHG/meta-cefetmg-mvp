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
  const visitorUser = db.users.find((u) => u.id === user.id) || user;

  // Interesses do visitante logado
  const myInterestTagIds = db.visitorInterests
    .filter((vi) => vi.visitorId === user.id)
    .map((vi) => vi.tagId);

  // Selos já coletados pelo visitante
  const rawStamps = db.passportStamps.filter((s) => s.visitorId === user.id);
  const collectedProjectIds = new Set(rawStamps.map((s) => s.projectId));

  // Enriquecer selos com detalhes dos estandes
  const myStamps = rawStamps.map((s) => {
    const proj = db.projects.find((p) => p.id === s.projectId);
    return {
      ...s,
      projectTitle: proj?.title || "Projeto da 35ª META",
      projectShortCode: proj?.shortCode || "0000",
      projectLocation: proj?.standLocation || "Pavilhão Central",
      stampImageUrl: proj?.stampImageUrl || "",
    };
  });

  // Projetos com afinidade de tags
  const enrichedProjects = db.projects.map((p) => {
    const pTagIds = db.projectTags
      .filter((pt) => pt.projectId === p.id)
      .map((pt) => pt.tagId);
    const projectTags = db.tags.filter((t) => pTagIds.includes(t.id));
    const matchCount = projectTags.filter((t) =>
      myInterestTagIds.includes(t.id)
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
      hideHeader
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
