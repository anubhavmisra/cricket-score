import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { matches, innings } from "@/db/schema";
import { getScorerMatchId } from "@/lib/auth/scorer-session";
import { buildMatchState } from "@/lib/match/build-match-state";

const bodySchema = z.object({
  action: z.enum(["start_innings_2", "complete"]),
  battingTeam: z.enum(["a", "b"]).optional(),
  target: z.number().int().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if ((await getScorerMatchId()) !== id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const db = getDb();
  if (parsed.data.action === "start_innings_2") {
    const state = await buildMatchState(id);
    const inn1 = state?.innings[0]?.state;
    const target = (inn1?.totalRuns ?? 0) + 1;
    const battingTeam = parsed.data.battingTeam!;
    await db.insert(innings).values({ matchId: id, battingTeam, inningsNumber: 2, target });
    await db.update(matches).set({ status: "innings_2" }).where(eq(matches.id, id));
  } else {
    await db.update(matches).set({ status: "completed" }).where(eq(matches.id, id));
  }

  return NextResponse.json({ ok: true });
}
