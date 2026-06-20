export type ExtraType = "wide" | "noball";
export type WicketType = "bowled" | "caught" | "lbw" | "run_out" | "stumped" | "other";

export interface DeliveryInput {
  sequence: number;
  overNumber: number;
  ballInOver: number;
  runsOffBat: number;
  extraType?: ExtraType | null;
  extraRuns: number;
  isWicket: boolean;
  wicketType?: WicketType | null;
  dismissedPlayerId?: string | null;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  isUndo?: boolean;
  undoesSequence?: number | null;
}

export interface InningsConfig {
  maxOvers: number;
  maxWickets: number;
  openingStrikerId: string;
  openingNonStrikerId: string;
  openingBowlerId: string;
}

export interface PlayerStats {
  playerId: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
}

export interface BowlerStats {
  playerId: string;
  legalBalls: number;
  runsConceded: number;
  wickets: number;
}

export interface FallOfWicket {
  wicket: number;
  runs: number;
  over: number;
  ball: number;
  playerId: string;
}

export interface InningsState {
  totalRuns: number;
  wickets: number;
  legalBalls: number;
  oversDisplay: string;
  runRate: number;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  isFreeHit: boolean;
  isComplete: boolean;
  batsmanStats: Record<string, PlayerStats>;
  bowlerStats: Record<string, BowlerStats>;
  fallOfWickets: FallOfWicket[];
  undoneSequences: Set<number>;
}
