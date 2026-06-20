import { eq, asc } from "drizzle-orm";
import { getDb } from "@/db";
import { matches, players, innings, deliveries } from "@/db/schema";
import { deriveInningsState } from "@/lib/cricket/derive-score";
import type { DeliveryInput } from "@/lib/cricket/types";

export async function buildMatchState(matchId: string) {
  const db = getDb();

  const [match] = await db.select().from(matches).where(eq(matches.id, matchId));
  if (!match) return null;

  const allPlayers = await db.select().from(players).where(eq(players.matchId, matchId));
  const allInnings = await db
    .select()
    .from(innings)
    .where(eq(innings.matchId, matchId))
    .orderBy(asc(innings.inningsNumber));

  const inningsStates = [];
  for (const inn of allInnings) {
    const rows = await db
      .select()
      .from(deliveries)
      .where(eq(deliveries.inningsId, inn.id))
      .orderBy(asc(deliveries.sequence));

    const deliveryInputs: DeliveryInput[] = rows.map((r) => ({
      sequence: r.sequence,
      overNumber: r.overNumber,
      ballInOver: r.ballInOver,
      runsOffBat: r.runsOffBat,
      extraType: r.extraType,
      extraRuns: r.extraRuns,
      isWicket: r.isWicket,
      wicketType: r.wicketType,
      dismissedPlayerId: r.dismissedPlayerId,
      strikerId: r.strikerId,
      nonStrikerId: r.nonStrikerId,
      bowlerId: r.bowlerId,
      isUndo: r.isUndo,
      undoesSequence: r.undoesSequence,
    }));

    const first = deliveryInputs[0];
    const openingStrikerId =
      first?.strikerId ??
      allPlayers.find((p) => p.team === inn.battingTeam && p.battingOrder === 1)!.id;
    const openingNonStrikerId =
      first?.nonStrikerId ??
      allPlayers.find((p) => p.team === inn.battingTeam && p.battingOrder === 2)!.id;
    const openingBowlerId =
      first?.bowlerId ??
      allPlayers.find((p) => p.team !== inn.battingTeam && p.battingOrder === 1)!.id;

    inningsStates.push({
      innings: inn,
      state: deriveInningsState(deliveryInputs, {
        maxOvers: 20,
        maxWickets: 10,
        openingStrikerId,
        openingNonStrikerId,
        openingBowlerId,
      }),
      deliveries: rows,
    });
  }

  return { match, players: allPlayers, innings: inningsStates };
}
