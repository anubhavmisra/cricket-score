import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { matches } from "@/db/schema";

export type ClerkAuthorProfile = {
  userId: string;
  authorName: string;
  authorImageUrl: string | null;
};

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function requireUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

export async function getClerkAuthorProfile(): Promise<ClerkAuthorProfile | null> {
  const user = await currentUser();
  if (!user) return null;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  const authorName =
    fullName ||
    user.username ||
    user.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "User";

  return {
    userId: user.id,
    authorName: authorName.slice(0, 40),
    authorImageUrl: user.imageUrl ?? null,
  };
}

export async function requireMatchOwner(matchId: string) {
  const userId = await requireUserId();
  if (!userId) return { error: unauthorized() };

  const db = getDb();
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId));
  if (!match) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }

  if (!match.createdByUserId || match.createdByUserId !== userId) {
    return { error: forbidden() };
  }

  return { userId, match };
}
