import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { readDb } from "@/db/local-store";
import { OnboardingClientView } from "@/features/auth/onboarding-client-view";

export default async function PrimeiroAcessoPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const db = readDb();
  const currentTagIds = db.visitorInterests
    .filter((vi) => vi.visitorId === user.id)
    .map((vi) => vi.tagId);

  return (
    <OnboardingClientView
      user={{
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        tempPasswordHint: user.tempPasswordHint,
        savedSignatureData: user.savedSignatureData,
      }}
      tags={db.tags}
      initialTagIds={currentTagIds}
    />
  );
}
