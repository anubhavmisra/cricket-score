import { eq, and } from "drizzle-orm";
import type { Db } from "@/db";
import { players } from "@/db/schema";

async function swapToBattingOrder(
  db: Db,
  matchId: string,
  team: "a" | "b",
  playerId: string,
  targetOrder: number,
) {
  const teamPlayers = await db
    .select()
    .from(players)
    .where(and(eq(players.matchId, matchId), eq(players.team, team)));

  const selected = teamPlayers.find((p) => p.id === playerId);
  const occupant = teamPlayers.find((p) => p.battingOrder === targetOrder);
  if (!selected || !occupant || selected.id === occupant.id) return;

  await db
    .update(players)
    .set({ battingOrder: occupant.battingOrder })
    .where(eq(players.id, selected.id));
  await db
    .update(players)
    .set({ battingOrder: selected.battingOrder })
    .where(eq(players.id, occupant.id));
}

export async function setOpeningPlayers(
  db: Db,
  matchId: string,
  battingTeam: "a" | "b",
  openingStrikerId: string,
  openingNonStrikerId: string,
  openingBowlerId: string,
) {
  const bowlingTeam = battingTeam === "a" ? "b" : "a";
  await swapToBattingOrder(db, matchId, battingTeam, openingStrikerId, 1);
  await swapToBattingOrder(db, matchId, battingTeam, openingNonStrikerId, 2);
  await swapToBattingOrder(db, matchId, bowlingTeam, openingBowlerId, 1);
}
