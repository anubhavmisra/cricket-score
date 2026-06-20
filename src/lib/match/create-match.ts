import { z } from "zod";
import { getDb } from "@/db";
import { matches, players, innings } from "@/db/schema";
import { hashPin } from "@/lib/auth/scorer-session";

export const createMatchSchema = z.object({
  teamAName: z.string().min(1),
  teamBName: z.string().min(1),
  tossWinner: z.enum(["a", "b"]),
  electedTo: z.enum(["bat", "bowl"]),
  pin: z.string().regex(/^\d{4,6}$/),
  teamAPlayers: z.array(z.string().min(1)).length(11),
  teamBPlayers: z.array(z.string().min(1)).length(11),
  openingStrikerIndex: z.number().int().min(0).max(10),
  openingNonStrikerIndex: z.number().int().min(0).max(10),
  openingBowlerIndex: z.number().int().min(0).max(10),
});

export type CreateMatchInput = z.infer<typeof createMatchSchema>;

export async function createMatch(input: CreateMatchInput) {
  const db = getDb();
  const pinHash = await hashPin(input.pin);

  const battingFirst =
    (input.tossWinner === "a" && input.electedTo === "bat") ||
    (input.tossWinner === "b" && input.electedTo === "bowl")
      ? "a"
      : "b";

  const [match] = await db
    .insert(matches)
    .values({
      teamAName: input.teamAName,
      teamBName: input.teamBName,
      tossWinner: input.tossWinner,
      electedTo: input.electedTo,
      scorerPinHash: pinHash,
      status: "innings_1",
    })
    .returning();

  const playerRows = [
    ...input.teamAPlayers.map((name, i) => ({
      matchId: match.id,
      team: "a" as const,
      name,
      battingOrder: i + 1,
    })),
    ...input.teamBPlayers.map((name, i) => ({
      matchId: match.id,
      team: "b" as const,
      name,
      battingOrder: i + 1,
    })),
  ];

  const insertedPlayers = await db.insert(players).values(playerRows).returning();

  const teamA = insertedPlayers.filter((p) => p.team === "a");
  const teamB = insertedPlayers.filter((p) => p.team === "b");
  const battingTeamPlayers = battingFirst === "a" ? teamA : teamB;
  const bowlingTeamPlayers = battingFirst === "a" ? teamB : teamA;

  await db.insert(innings).values({
    matchId: match.id,
    battingTeam: battingFirst,
    inningsNumber: 1,
  });

  return {
    matchId: match.id,
    shareUrl: `/m/${match.id}`,
    openingStrikerId: battingTeamPlayers[input.openingStrikerIndex].id,
    openingNonStrikerId: battingTeamPlayers[input.openingNonStrikerIndex].id,
    openingBowlerId: bowlingTeamPlayers[input.openingBowlerIndex].id,
  };
}
