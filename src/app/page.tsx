import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ROLE_META_CONFIG } from "@/lib/utils";
import { switchDemoRoleAction } from "@/features/auth/actions";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    if (user.mustChangePassword || !user.onboardingCompleted) {
      redirect("/primeiro-acesso");
    }
    redirect(ROLE_META_CONFIG[user.role].defaultRoute);
  }

  redirect("/login");
}
