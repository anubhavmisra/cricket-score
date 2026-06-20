import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { matches } from "@/db/schema";
import { verifyPin, createScorerSession, scorerSessionCookie } from "@/lib/auth/scorer-session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { pin } = await request.json();
  const db = getDb();
  const [match] = await db.select().from(matches).where(eq(matches.id, id));
  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ok = await verifyPin(String(pin), match.scorerPinHash);
  if (!ok) return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });

  const token = await createScorerSession(id);
  return new NextResponse(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Set-Cookie": scorerSessionCookie(token), "Content-Type": "application/json" },
  });
}
