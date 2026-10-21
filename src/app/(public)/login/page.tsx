import { readDb } from "@/db/local-store";
import { LoginClientView } from "@/features/auth/login-client-view";

export default function LoginPage() {
  const db = readDb();
  return <LoginClientView tags={db.tags} />;
}
