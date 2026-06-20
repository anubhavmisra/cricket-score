import { NextResponse } from "next/server";
import { z } from "zod";
import {
  addMatchComment,
  getMatchEngagement,
  toggleMatchLike,
} from "@/lib/match/engagement";

const engagementActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("like"), viewerId: z.string().min(1).max(64) }),
  z.object({
    action: z.literal("comment"),
    viewerId: z.string().min(1).max(64),
    authorName: z.string().min(1).max(40),
    body: z.string().min(1).max(500),
  }),
]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const viewerId = new URL(request.url).searchParams.get("viewerId") ?? undefined;
  const engagement = await getMatchEngagement(id, viewerId);
  if (!engagement) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(engagement);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

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

  const payload = parsed.data;

  if (payload.action === "comment") {
    const engagement = await addMatchComment(
      id,
      payload.viewerId,
      payload.authorName,
      payload.body,
    );
    if (!engagement) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(engagement);
  }

  const engagement = await toggleMatchLike(id, payload.viewerId);
  if (!engagement) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(engagement);
}
