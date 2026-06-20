import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { matches } from "@/db/schema";

export type MatchSummary = {
  id: string;
  teamAName: string;
  teamBName: string;
  status: (typeof matches.$inferSelect)["status"];
  createdAt: Date;
};

export async function listMatches(): Promise<MatchSummary[]> {
  const db = getDb();
  return db
    .select({
      id: matches.id,
      teamAName: matches.teamAName,
      teamBName: matches.teamBName,
      status: matches.status,
      createdAt: matches.createdAt,
    })
    .from(matches)
    .orderBy(desc(matches.createdAt));
}
