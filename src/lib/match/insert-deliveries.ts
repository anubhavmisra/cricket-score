import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { deliveries, innings } from "@/db/schema";
import { z } from "zod";

export const deliveryPayloadSchema = z.object({
  clientEventId: z.string().uuid(),
  inningsId: z.string().uuid(),
  runsOffBat: z.number().int().min(0).max(6),
  extraType: z.enum(["wide", "noball"]).nullable().optional(),
  extraRuns: z.number().int().min(0).default(0),
  isWicket: z.boolean().default(false),
  wicketType: z.enum(["bowled", "caught", "lbw", "run_out", "stumped", "other"]).nullable().optional(),
  dismissedPlayerId: z.string().uuid().nullable().optional(),
  strikerId: z.string().uuid(),
  nonStrikerId: z.string().uuid(),
  bowlerId: z.string().uuid(),
  isUndo: z.boolean().default(false),
  undoesSequence: z.number().int().nullable().optional(),
});

export async function insertDeliveriesBatch(
  matchId: string,
  items: z.infer<typeof deliveryPayloadSchema>[]
) {
  const db = getDb();

  return db.transaction(async (tx) => {
    const inserted = [];
    for (const item of items) {
      const existing = await tx
        .select({ id: deliveries.id })
        .from(deliveries)
        .where(eq(deliveries.clientEventId, item.clientEventId));
      if (existing.length > 0) {
        inserted.push(existing[0]);
        continue;
      }

      const inningsDeliveries = await tx
        .select({
          sequence: deliveries.sequence,
          extraType: deliveries.extraType,
          isUndo: deliveries.isUndo,
        })
        .from(deliveries)
        .where(eq(deliveries.inningsId, item.inningsId));

      const maxSeq = inningsDeliveries.reduce((max, row) => Math.max(max, row.sequence), 0);
      const legalBallCount = inningsDeliveries.filter(
        (row) => !row.isUndo && !row.extraType,
      ).length;

      const sequence = maxSeq + 1;
      const overNumber = Math.floor(legalBallCount / 6);
      const ballInOver = (legalBallCount % 6) + 1;

      const [row] = await tx
        .insert(deliveries)
        .values({
          clientEventId: item.clientEventId,
          inningsId: item.inningsId,
          sequence,
          overNumber: item.isUndo ? 0 : overNumber,
          ballInOver: item.isUndo ? 0 : ballInOver,
          runsOffBat: item.runsOffBat,
          extraType: item.extraType ?? null,
          extraRuns: item.extraRuns ?? 0,
          isWicket: item.isWicket,
          wicketType: item.wicketType ?? null,
          dismissedPlayerId: item.dismissedPlayerId ?? null,
          strikerId: item.strikerId,
          nonStrikerId: item.nonStrikerId,
          bowlerId: item.bowlerId,
          isUndo: item.isUndo ?? false,
          undoesSequence: item.undoesSequence ?? null,
        })
        .returning();
      inserted.push(row);
    }
    return inserted;
  });
}
