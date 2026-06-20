import type { WicketType } from "./types";
import type { MatchState } from "@/lib/match/match-state";

type DeliveryRow = {
  sequence: number;
  isWicket: boolean;
  isUndo: boolean;
  undoesSequence: number | null;
  dismissedPlayerId: string | null;
  wicketType: WicketType | null;
  bowlerId: string;
};

export type BattingRow = {
  playerId: string;
  name: string;
  dismissal: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: string;
  didBat: boolean;
};

export type BowlingRow = {
  playerId: string;
  name: string;
  overs: string;
  runs: number;
  wickets: number;
  economy: string;
};

function playerName(state: MatchState, playerId: string): string {
  return state.players.find((p) => p.id === playerId)?.name ?? "Unknown";
}

function oversFromLegalBalls(legalBalls: number): string {
  return `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
}

function strikeRate(runs: number, balls: number): string {
  if (balls === 0) return "—";
  return ((runs / balls) * 100).toFixed(1);
}

function economy(runs: number, legalBalls: number): string {
  if (legalBalls === 0) return "—";
  return ((runs / legalBalls) * 6).toFixed(2);
}

function activeDeliveries(deliveries: DeliveryRow[]): DeliveryRow[] {
  const undone = new Set<number>();
  for (const d of deliveries) {
    if (d.isUndo && d.undoesSequence != null) undone.add(d.undoesSequence);
  }
  return deliveries
    .filter((d) => !d.isUndo && !undone.has(d.sequence))
    .sort((a, b) => a.sequence - b.sequence);
}

function formatDismissal(
  wicketType: WicketType | null,
  bowlerName: string,
): string {
  switch (wicketType) {
    case "bowled":
      return `b ${bowlerName}`;
    case "caught":
      return `c & b ${bowlerName}`;
    case "lbw":
      return `lbw b ${bowlerName}`;
    case "run_out":
      return "run out";
    case "stumped":
      return `st ${bowlerName}`;
    case "other":
      return "out";
    default:
      return "out";
  }
}

function dismissalForPlayer(
  playerId: string,
  deliveries: DeliveryRow[],
  state: MatchState,
): string {
  const active = activeDeliveries(deliveries);
  const wicket = active.find((d) => d.isWicket && d.dismissedPlayerId === playerId);
  if (!wicket) return "not out";
  return formatDismissal(wicket.wicketType, playerName(state, wicket.bowlerId));
}

export function getBattingRows(
  state: MatchState,
  inningsNumber: 1 | 2,
): BattingRow[] {
  const entry = state.innings.find((i) => i.innings.inningsNumber === inningsNumber);
  if (!entry) return [];

  const { state: innState, deliveries } = entry;
  const battingTeam = entry.innings.battingTeam;
  const squad = state.players
    .filter((p) => p.team === battingTeam)
    .sort((a, b) => a.battingOrder - b.battingOrder);

  return squad.map((player) => {
    const stats = innState.batsmanStats[player.id];
    const didBat = Boolean(stats && (stats.balls > 0 || stats.isOut));
    const runs = stats?.runs ?? 0;
    const balls = stats?.balls ?? 0;

    let dismissal = "—";
    if (stats?.isOut) {
      dismissal = dismissalForPlayer(player.id, deliveries as DeliveryRow[], state);
    } else if (didBat) {
      dismissal = "not out";
    }

    return {
      playerId: player.id,
      name: player.name,
      dismissal,
      runs,
      balls,
      fours: stats?.fours ?? 0,
      sixes: stats?.sixes ?? 0,
      strikeRate: didBat ? strikeRate(runs, balls) : "—",
      didBat,
    };
  });
}

export function getBowlingRows(
  state: MatchState,
  inningsNumber: 1 | 2,
): BowlingRow[] {
  const entry = state.innings.find((i) => i.innings.inningsNumber === inningsNumber);
  if (!entry) return [];

  const { state: innState } = entry;
  const bowlingTeam = entry.innings.battingTeam === "a" ? "b" : "a";

  const rows = Object.values(innState.bowlerStats)
    .filter((s) => s.legalBalls > 0 || s.wickets > 0 || s.runsConceded > 0)
    .map((stats) => ({
      playerId: stats.playerId,
      name: playerName(state, stats.playerId),
      overs: oversFromLegalBalls(stats.legalBalls),
      runs: stats.runsConceded,
      wickets: stats.wickets,
      economy: economy(stats.runsConceded, stats.legalBalls),
      team: state.players.find((p) => p.id === stats.playerId)?.team,
    }))
    .filter((r) => r.team === bowlingTeam)
    .sort((a, b) => {
      const orderA =
        state.players.find((p) => p.id === a.playerId)?.battingOrder ?? 99;
      const orderB =
        state.players.find((p) => p.id === b.playerId)?.battingOrder ?? 99;
      return orderA - orderB;
    });

  return rows.map(({ playerId, name, overs, runs, wickets, economy: econ }) => ({
    playerId,
    name,
    overs,
    runs,
    wickets,
    economy: econ,
  }));
}

export function getInningsEntry(state: MatchState, inningsNumber: 1 | 2) {
  return state.innings.find((i) => i.innings.inningsNumber === inningsNumber);
}

function teamLabel(state: MatchState, team: "a" | "b"): string {
  return team === "a" ? state.match.teamAName : state.match.teamBName;
}

export function getInningsHeader(state: MatchState, inningsNumber: 1 | 2) {
  const entry = getInningsEntry(state, inningsNumber);
  if (!entry) return null;

  const { state: innState, innings: innMeta } = entry;
  return {
    label: `${inningsNumber === 1 ? "1st" : "2nd"} innings · ${teamLabel(state, innMeta.battingTeam)}`,
    total: `${innState.totalRuns}/${innState.wickets}`,
    overs: innState.oversDisplay,
    runRate: innState.runRate.toFixed(2),
    target: innMeta.target,
  };
}

export function formatFallOfWickets(
  state: MatchState,
  inningsNumber: 1 | 2,
): string {
  const entry = getInningsEntry(state, inningsNumber);
  if (!entry) return "";

  return entry.state.fallOfWickets
    .map((fow) => {
      const name = playerName(state, fow.playerId);
      const over = `${fow.over}.${fow.ball}`;
      return `${fow.wicket}-${fow.runs} ${name} (${over})`;
    })
    .join(" · ");
}
