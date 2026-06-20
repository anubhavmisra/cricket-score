import type { innings, matches, players } from "@/db/schema";
import type { BowlerStats, InningsState, PlayerStats } from "@/lib/cricket/types";

export type MatchState = {
  match: typeof matches.$inferSelect;
  players: (typeof players.$inferSelect)[];
  innings: Array<{
    innings: typeof innings.$inferSelect;
    state: InningsState;
    deliveries: unknown[];
  }>;
};

function bowlerOversDisplay(legalBalls: number): string {
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  return `${overs}.${balls}`;
}

function getPlayerName(players: MatchState["players"], playerId: string): string {
  return players.find((p) => p.id === playerId)?.name ?? "Unknown";
}

function formatBatsmanLine(stats: PlayerStats, name: string, isStriker: boolean): string {
  const marker = isStriker ? "*" : "";
  return `${marker}${name} ${stats.runs} (${stats.balls})`;
}

function formatBowlerLine(stats: BowlerStats, name: string): string {
  return `${name} ${bowlerOversDisplay(stats.legalBalls)}-${stats.runsConceded}-${stats.wickets}`;
}

function getActiveInningsIndex(state: MatchState): number {
  const { status } = state.match;
  if (status === "innings_2" || status === "completed") {
    const second = state.innings.find((i) => i.innings.inningsNumber === 2);
    if (second) return state.innings.indexOf(second);
  }
  return 0;
}

function getTeamName(state: MatchState, team: "a" | "b"): string {
  return team === "a" ? state.match.teamAName : state.match.teamBName;
}

function getStatusLabel(status: MatchState["match"]["status"]): string | null {
  switch (status) {
    case "innings_break":
      return "Innings break";
    case "completed":
      return "Match completed";
    default:
      return null;
  }
}

export function Scoreboard({ state }: { state: MatchState }) {
  const activeIndex = getActiveInningsIndex(state);
  const active = state.innings[activeIndex];
  if (!active) {
    return <p className="text-sm text-gray-600 dark:text-gray-400">No innings data yet.</p>;
  }

  const { state: innState, innings: innMeta } = active;
  const battingTeamName = getTeamName(state, innMeta.battingTeam);
  const bowlingTeam = innMeta.battingTeam === "a" ? "b" : "a";
  const bowlingTeamName = getTeamName(state, bowlingTeam);
  const statusLabel = getStatusLabel(state.match.status);

  const strikerStats = innState.batsmanStats[innState.strikerId];
  const nonStrikerStats = innState.batsmanStats[innState.nonStrikerId];
  const bowlerStats = innState.bowlerStats[innState.bowlerId];

  return (
    <div className="flex flex-col gap-4">
      <header className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {state.match.teamAName} vs {state.match.teamBName}
        </p>
        {statusLabel && (
          <p className="mt-1 text-sm font-medium text-amber-700 dark:text-amber-400">{statusLabel}</p>
        )}
      </header>

      <section className="rounded-xl border border-gray-300 bg-white p-4 dark:border-gray-600 dark:bg-gray-950">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{battingTeamName}</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">
          {innState.totalRuns}/{innState.wickets}
          <span className="ml-2 text-lg font-normal text-gray-600 dark:text-gray-400">
            ({innState.oversDisplay} ov)
          </span>
        </p>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          RR {innState.runRate.toFixed(2)}
          {innMeta.target != null && (
            <span className="ml-3">Target {innMeta.target}</span>
          )}
        </p>
        {innState.isFreeHit && (
          <p className="mt-1 text-sm font-medium text-orange-600 dark:text-orange-400">Free hit</p>
        )}
      </section>

      <section className="rounded-xl border border-gray-300 p-4 dark:border-gray-600">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Batting</h2>
        <ul className="flex flex-col gap-1 text-sm">
          {strikerStats && (
            <li className="font-medium">
              {formatBatsmanLine(
                strikerStats,
                getPlayerName(state.players, innState.strikerId),
                true,
              )}
            </li>
          )}
          {nonStrikerStats && (
            <li>
              {formatBatsmanLine(
                nonStrikerStats,
                getPlayerName(state.players, innState.nonStrikerId),
                false,
              )}
            </li>
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-gray-300 p-4 dark:border-gray-600">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Bowling · {bowlingTeamName}
        </h2>
        {bowlerStats ? (
          <p className="text-sm">{formatBowlerLine(bowlerStats, getPlayerName(state.players, innState.bowlerId))}</p>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">—</p>
        )}
      </section>

      {innState.fallOfWickets.length > 0 && (
        <section className="rounded-xl border border-gray-300 p-4 dark:border-gray-600">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Fall of wickets
          </h2>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            {innState.fallOfWickets.map((fow, i) => {
              const name = getPlayerName(state.players, fow.playerId);
              const over = `${fow.over}.${fow.ball}`;
              return (
                <span key={`${fow.wicket}-${fow.playerId}`}>
                  {i > 0 && " · "}
                  {fow.wicket}-{fow.runs} {name} ({over})
                </span>
              );
            })}
          </p>
        </section>
      )}

      {state.innings.length > 1 && activeIndex === 1 && state.innings[0] && (
        <section className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            1st innings · {getTeamName(state, state.innings[0].innings.battingTeam)}
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {state.innings[0].state.totalRuns}/{state.innings[0].state.wickets}
            <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">
              ({state.innings[0].state.oversDisplay} ov)
            </span>
          </p>
        </section>
      )}
    </div>
  );
}
