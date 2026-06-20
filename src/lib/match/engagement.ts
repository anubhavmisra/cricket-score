import { and, count, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { matchComments, matchLikes, matches } from "@/db/schema";

export type MatchComment = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
  isOwn: boolean;
};

export type MatchEngagement = {
  likeCount: number;
  likedByViewer: boolean;
  commentCount: number;
  comments: MatchComment[];
};

async function matchExists(matchId: string): Promise<boolean> {
  const db = getDb();
  const row = await db.select({ id: matches.id }).from(matches).where(eq(matches.id, matchId)).limit(1);
  return row.length > 0;
}

export async function getMatchEngagement(
  matchId: string,
  viewerId?: string,
): Promise<MatchEngagement | null> {
  if (!(await matchExists(matchId))) return null;

  const db = getDb();

  const [likeCountRow] = await db
    .select({ value: count() })
    .from(matchLikes)
    .where(eq(matchLikes.matchId, matchId));

  let likedByViewer = false;
  if (viewerId) {
    const liked = await db
      .select({ id: matchLikes.id })
      .from(matchLikes)
      .where(and(eq(matchLikes.matchId, matchId), eq(matchLikes.viewerId, viewerId)))
      .limit(1);
    likedByViewer = liked.length > 0;
  }

  const commentRows = await db
    .select()
    .from(matchComments)
    .where(eq(matchComments.matchId, matchId))
    .orderBy(desc(matchComments.createdAt))
    .limit(50);

  const comments: MatchComment[] = commentRows.map((row) => ({
    id: row.id,
    authorName: row.authorName,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    isOwn: viewerId ? row.viewerId === viewerId : false,
  }));

  return {
    likeCount: likeCountRow?.value ?? 0,
    likedByViewer,
    commentCount: comments.length,
    comments,
  };
}

export async function toggleMatchLike(
  matchId: string,
  viewerId: string,
): Promise<MatchEngagement | null> {
  if (!(await matchExists(matchId))) return null;

  const db = getDb();
  const existing = await db
    .select({ id: matchLikes.id })
    .from(matchLikes)
    .where(and(eq(matchLikes.matchId, matchId), eq(matchLikes.viewerId, viewerId)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(matchLikes).where(eq(matchLikes.id, existing[0]!.id));
  } else {
    await db.insert(matchLikes).values({ matchId, viewerId });
  }

  return getMatchEngagement(matchId, viewerId);
}

export async function addMatchComment(
  matchId: string,
  viewerId: string,
  authorName: string,
  body: string,
): Promise<MatchEngagement | null> {
  if (!(await matchExists(matchId))) return null;

  const db = getDb();
  await db.insert(matchComments).values({
    matchId,
    viewerId,
    authorName: authorName.trim().slice(0, 40) || "Spectator",
    body: body.trim().slice(0, 500),
  });

  return getMatchEngagement(matchId, viewerId);
}
