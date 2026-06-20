import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import {
  addMatchComment,
  getMatchEngagement,
  toggleMatchLike,
} from "@/lib/match/engagement";
import { getClerkAuthorProfile, unauthorized } from "@/lib/auth/match-access";

const commentBodySchema = z.object({
  action: z.literal("comment"),
  body: z.string().min(1).max(500),
});

const likeBodySchema = z.object({
  action: z.literal("like"),
});

const engagementActionSchema = z.discriminatedUnion("action", [
  likeBodySchema,
  commentBodySchema,
]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { userId } = await auth();
  const engagement = await getMatchEngagement(id, userId ?? undefined);
  if (!engagement) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(engagement);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const profile = await getClerkAuthorProfile();
  if (!profile) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = engagementActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (parsed.data.action === "comment") {
    const engagement = await addMatchComment(
      id,
      profile.userId,
      profile.authorName,
      profile.authorImageUrl,
      parsed.data.body,
    );
    if (!engagement) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(engagement);
  }

  const engagement = await toggleMatchLike(id, profile.userId);
  if (!engagement) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(engagement);
}
