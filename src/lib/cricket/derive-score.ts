import type {
  DeliveryInput,
  FallOfWicket,
  InningsConfig,
  InningsState,
  PlayerStats,
  BowlerStats,
} from "./types";

function initBatsman(playerId: string): PlayerStats {
  return { playerId, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false };
}

function initBowler(playerId: string): BowlerStats {
  return { playerId, legalBalls: 0, runsConceded: 0, wickets: 0 };
}

function oversDisplay(legalBalls: number): string {
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  return `${overs}.${balls}`;
}

function isLegalDelivery(d: DeliveryInput): boolean {
  return !d.extraType;
}

function totalDeliveryRuns(d: DeliveryInput): number {
  const extra = d.extraType === "wide" || d.extraType === "noball" ? 1 + d.extraRuns : d.extraRuns;
  return d.runsOffBat + extra;
}

function swapStriker(strikerId: string, nonStrikerId: string, runs: number): [string, string] {
  if (runs % 2 === 1) return [nonStrikerId, strikerId];
  return [strikerId, nonStrikerId];
}

export function deriveInningsState(
  allDeliveries: DeliveryInput[],
  config: InningsConfig
): InningsState {
  const undone = new Set<number>();
  for (const d of allDeliveries) {
    if (d.isUndo && d.undoesSequence != null) undone.add(d.undoesSequence);
  }

  const active = allDeliveries
    .filter((d) => !d.isUndo && !undone.has(d.sequence))
    .sort((a, b) => a.sequence - b.sequence);

  let totalRuns = 0;
  let wickets = 0;
  let legalBalls = 0;
  let strikerId = config.openingStrikerId;
  let nonStrikerId = config.openingNonStrikerId;
  let bowlerId = config.openingBowlerId;
  let isFreeHit = false;

  const batsmanStats: Record<string, PlayerStats> = {
    [config.openingStrikerId]: initBatsman(config.openingStrikerId),
    [config.openingNonStrikerId]: initBatsman(config.openingNonStrikerId),
  };
  const bowlerStats: Record<string, BowlerStats> = {
    [config.openingBowlerId]: initBowler(config.openingBowlerId),
  };
  const fallOfWickets: FallOfWicket[] = [];

  for (const d of active) {
    const runs = totalDeliveryRuns(d);
    totalRuns += runs;

    if (!bowlerStats[d.bowlerId]) bowlerStats[d.bowlerId] = initBowler(d.bowlerId);
    if (!batsmanStats[d.strikerId]) batsmanStats[d.strikerId] = initBatsman(d.strikerId);

    bowlerStats[d.bowlerId].runsConceded += runs;

    if (d.extraType !== "wide") {
      batsmanStats[d.strikerId].balls += 1;
      if (d.runsOffBat === 4) batsmanStats[d.strikerId].fours += 1;
      if (d.runsOffBat === 6) batsmanStats[d.strikerId].sixes += 1;
      batsmanStats[d.strikerId].runs += d.runsOffBat;
    }

    if (isLegalDelivery(d)) {
      legalBalls += 1;
      bowlerStats[d.bowlerId].legalBalls += 1;
      if (legalBalls % 6 === 0) {
        [strikerId, nonStrikerId] = [nonStrikerId, strikerId];
      }
    }

    if (d.isWicket) {
      wickets += 1;
      if (d.dismissedPlayerId && batsmanStats[d.dismissedPlayerId]) {
        batsmanStats[d.dismissedPlayerId].isOut = true;
      }
      bowlerStats[d.bowlerId].wickets += d.wicketType !== "run_out" ? 1 : 0;
      if (d.dismissedPlayerId) {
        fallOfWickets.push({
          wicket: wickets,
          runs: totalRuns,
          over: Math.floor(legalBalls / 6),
          ball: legalBalls % 6,
          playerId: d.dismissedPlayerId,
        });
      }
    }

    const swapRuns = d.extraType === "wide" ? 1 + d.extraRuns : d.runsOffBat;
    if (!d.isWicket) {
      [strikerId, nonStrikerId] = swapStriker(strikerId, nonStrikerId, swapRuns);
    }

    if (d.extraType === "noball") isFreeHit = true;
    else if (isLegalDelivery(d)) isFreeHit = false;
  }

  const completedByOvers = legalBalls >= config.maxOvers * 6;
  const completedByWickets = wickets >= config.maxWickets;

  return {
    totalRuns,
    wickets,
    legalBalls,
    oversDisplay: oversDisplay(legalBalls),
    runRate: legalBalls === 0 ? 0 : (totalRuns / legalBalls) * 6,
    strikerId,
    nonStrikerId,
    bowlerId,
    isFreeHit,
    isComplete: completedByOvers || completedByWickets,
    batsmanStats,
    bowlerStats,
    fallOfWickets,
    undoneSequences: undone,
  };
}
