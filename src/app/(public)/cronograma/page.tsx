import { readDb } from "@/db/local-store";
import { getCurrentUser } from "@/lib/session";
import { CronogramaClientView } from "@/features/projects/cronograma-client-view";

export default async function CronogramaPage() {
  const db = readDb();
  const user = await getCurrentUser();

  const enrichedProjects = db.projects.map((p) => {
    const tagIds = db.projectTags
      .filter((pt) => pt.projectId === p.id)
      .map((pt) => pt.tagId);
    const projectTags = db.tags.filter((t) => tagIds.includes(t.id));
    const expositores = db.projectMembers
      .filter((pm) => pm.projectId === p.id && pm.memberRole === "EXPOSITOR")
      .map((pm) => db.users.find((u) => u.id === pm.userId)?.name || "Aluno");

    return {
      ...p,
      tags: projectTags,
      expositores,
    };
  });

  return (
    <CronogramaClientView
      user={
        user
          ? {
              id: user.id,
              name: user.name,
              username: user.username,
              role: user.role,
              isAccredited: user.isAccredited,
            }
          : null
      }
      scheduleItems={db.scheduleItems}
      projects={enrichedProjects}
      tags={db.tags}
    />
  );
}
