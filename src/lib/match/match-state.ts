import type { innings, matches, players } from "@/db/schema";
import type { InningsState } from "@/lib/cricket/types";

export type MatchState = {
  match: typeof matches.$inferSelect;
  players: (typeof players.$inferSelect)[];
  innings: Array<{
    innings: typeof innings.$inferSelect;
    state: InningsState;
    deliveries: unknown[];
  }>;
};
