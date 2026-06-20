import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { eq, and, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { scorerSessions } from "@/db/schema";

export const SCORER_COOKIE = "scorer_session";

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

export async function createScorerSession(matchId: string): Promise<string> {
  const db = getDb();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const [row] = await db
    .insert(scorerSessions)
    .values({ matchId, expiresAt })
    .returning({ token: scorerSessions.token });
  return row.token;
}

export async function getScorerMatchId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SCORER_COOKIE)?.value;
  if (!token) return null;

  const db = getDb();
  const [session] = await db
    .select()
    .from(scorerSessions)
    .where(and(eq(scorerSessions.token, token), gt(scorerSessions.expiresAt, new Date())));
  return session?.matchId ?? null;
}

export function scorerSessionCookie(token: string) {
  return `${SCORER_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
}
