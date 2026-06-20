import type { MatchState } from "@/components/scoreboard";

function getTeamName(state: MatchState, team: "a" | "b"): string {
  return team === "a" ? state.match.teamAName : state.match.teamBName;
}

export type MatchResult = {
  winnerName: string;
  margin: string;
};

export function computeMatchResult(state: MatchState): MatchResult | null {
  const inn1 = state.innings.find((i) => i.innings.inningsNumber === 1);
  const inn2 = state.innings.find((i) => i.innings.inningsNumber === 2);
  if (!inn1 || !inn2) return null;

  const target = inn1.state.totalRuns + 1;
  const chase = inn2.state;
  const chasingTeam = inn2.innings.battingTeam;
  const defendingTeam = chasingTeam === "a" ? "b" : "a";
  const chasingName = getTeamName(state, chasingTeam);
  const defendingName = getTeamName(state, defendingTeam);

  if (chase.totalRuns >= target) {
    const wicketsRemaining = 10 - chase.wickets;
    return {
      winnerName: chasingName,
      margin: `${wicketsRemaining} wicket${wicketsRemaining === 1 ? "" : "s"}`,
    };
  }

  const runsShort = target - 1 - chase.totalRuns;
  return {
    winnerName: defendingName,
    margin: `${runsShort} run${runsShort === 1 ? "" : "s"}`,
  };
}

export function isInningsBreak(state: MatchState): boolean {
  if (state.match.status === "innings_break") return true;
  if (state.match.status !== "innings_1") return false;
  const inn1 = state.innings.find((i) => i.innings.inningsNumber === 1);
  return inn1?.state.isComplete ?? false;
}

export function shouldCompleteMatch(state: MatchState): boolean {
  if (state.match.status !== "innings_2") return false;
  const inn1 = state.innings.find((i) => i.innings.inningsNumber === 1);
  const inn2 = state.innings.find((i) => i.innings.inningsNumber === 2);
  if (!inn1 || !inn2) return false;

  const target = inn1.state.totalRuns + 1;
  return inn2.state.isComplete || inn2.state.totalRuns >= target;
}
