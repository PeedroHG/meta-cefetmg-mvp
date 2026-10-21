import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { readDb, type UserRecord } from "@/db/local-store";
import type { UserRole } from "@/db/schema";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "meta-cefetmg-35-secret-key-2026-mvp"
);

export const SESSION_COOKIE_NAME = "meta_session_token";

export interface SessionPayload {
  userId: string;
  role: UserRole;
  username: string;
  name: string;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      userId: String(payload.userId),
      role: payload.role as UserRole,
      username: String(payload.username),
      name: String(payload.name),
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserRecord | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const db = readDb();

  if (token) {
    const session = await verifySessionToken(token);
    if (session) {
      const found = db.users.find((u) => u.id === session.userId);
      if (found) return found;
    }
  }

  return null;
}
