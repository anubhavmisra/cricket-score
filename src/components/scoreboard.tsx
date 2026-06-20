import type { innings, matches, players } from "@/db/schema";
import type { BowlerStats, InningsState, PlayerStats } from "@/lib/cricket/types";
import { computeMatchResult, isInningsBreak } from "@/lib/cricket/match-result";
import { sectionLabel } from "@/lib/ui/styles";

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

export function getActiveInningsIndex(state: MatchState): number {
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

function getStatusLabel(state: MatchState): string | null {
  if (isInningsBreak(state)) return "Innings break";
  switch (state.match.status) {
    case "completed":
      return "Match completed";
    default:
      return null;
  }
}

function InningsSummary({
  state,
  inningsNumber,
}: {
  state: MatchState;
  inningsNumber: 1 | 2;
}) {
  const entry = state.innings.find((i) => i.innings.inningsNumber === inningsNumber);
  if (!entry) return null;

  const { state: innState, innings: innMeta } = entry;
  const teamName = getTeamName(state, innMeta.battingTeam);

  return (
    <div className="border-t border-border px-4 py-3 first:border-t-0">
      <p className={sectionLabel}>
        {inningsNumber === 1 ? "1st" : "2nd"} innings · {teamName}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
        {innState.totalRuns}/{innState.wickets}
        <span className="ml-2 text-base font-normal text-muted">({innState.oversDisplay} ov)</span>
      </p>
      <p className="mt-1 text-sm text-muted">RR {innState.runRate.toFixed(2)}</p>
    </div>
  );
}

function MatchResultBanner({ state }: { state: MatchState }) {
  const result = computeMatchResult(state);
  if (!result || state.match.status !== "completed") return null;

  return (
    <div className="rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] px-4 py-3 text-center">
      <p className="text-lg font-bold text-[var(--success-text)]">
        {result.winnerName} won by {result.margin}
      </p>
    </div>
  );
}

function ScoreDivider() {
  return <div className="border-t border-border" role="separator" />;
}

export function Scoreboard({ state }: { state: MatchState }) {
  const breakActive = isInningsBreak(state);
  const activeIndex = getActiveInningsIndex(state);
  const active = state.innings[activeIndex];

  if (!active && !breakActive) {
    return <p className="text-sm text-muted">No innings data yet.</p>;
  }

  const statusLabel = getStatusLabel(state);
  const showLiveCard = active && !breakActive && state.match.status !== "completed";

  const innState = active?.state;
  const innMeta = active?.innings;
  const battingTeamName = innMeta ? getTeamName(state, innMeta.battingTeam) : "";
  const bowlingTeam = innMeta?.battingTeam === "a" ? "b" : "a";
  const bowlingTeamName = getTeamName(state, bowlingTeam);

  const strikerStats = innState ? innState.batsmanStats[innState.strikerId] : undefined;
  const nonStrikerStats = innState ? innState.batsmanStats[innState.nonStrikerId] : undefined;
  const bowlerStats = innState ? innState.bowlerStats[innState.bowlerId] : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-[var(--z-sticky)] -mx-4 border-b border-border bg-[var(--background)] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <header className="text-center">
          <p className="truncate text-sm text-muted">
            {state.match.teamAName} vs {state.match.teamBName}
          </p>
          {statusLabel && (
            <p className="mt-1 text-sm font-medium text-[var(--warning-text)]">{statusLabel}</p>
          )}
        </header>

        {showLiveCard && innState && innMeta && (
          <div className="mt-3 text-center">
            <p className={`${sectionLabel} truncate`}>{battingTeamName}</p>
            <p className="mt-1 text-4xl font-bold tabular-nums text-foreground">
              {innState.totalRuns}/{innState.wickets}
              <span className="ml-2 text-xl font-normal text-muted">({innState.oversDisplay} ov)</span>
            </p>
            <p className="mt-1 text-sm text-muted">
              RR {innState.runRate.toFixed(2)}
              {innMeta.target != null && <span className="ml-3">Target {innMeta.target}</span>}
            </p>
            {innState.isFreeHit && (
              <p className="mt-1 text-sm font-medium text-[var(--warning-text)]">Free hit</p>
            )}
          </div>
        )}
      </div>

      <MatchResultBanner state={state} />

      {breakActive && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <InningsSummary state={state} inningsNumber={1} />
        </div>
      )}

      {showLiveCard && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="px-4 py-3">
            <p className={sectionLabel}>Batting</p>
            <ul className="mt-2 flex flex-col gap-1 text-sm text-foreground">
              {strikerStats && innState && (
                <li className="font-medium">
                  {formatBatsmanLine(
                    strikerStats,
                    getPlayerName(state.players, innState.strikerId),
                    true,
                  )}
                </li>
              )}
              {nonStrikerStats && innState && (
                <li>
                  {formatBatsmanLine(
                    nonStrikerStats,
                    getPlayerName(state.players, innState.nonStrikerId),
                    false,
                  )}
                </li>
              )}
            </ul>
          </div>

          <ScoreDivider />

          <div className="px-4 py-3">
            <p className={sectionLabel}>Bowling · {bowlingTeamName}</p>
            {bowlerStats && innState ? (
              <p className="mt-2 text-sm text-foreground">
                {formatBowlerLine(bowlerStats, getPlayerName(state.players, innState.bowlerId))}
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted">—</p>
            )}
          </div>

          {innState && innState.fallOfWickets.length > 0 && (
            <>
              <ScoreDivider />
              <div className="px-4 py-3">
                <p className={sectionLabel}>Fall of wickets</p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">
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
              </div>
            </>
          )}
        </div>
      )}

      {state.match.status === "completed" && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <InningsSummary state={state} inningsNumber={1} />
          <ScoreDivider />
          <InningsSummary state={state} inningsNumber={2} />
        </div>
      )}

      {state.innings.length > 1 && activeIndex === 1 && state.innings[0] && showLiveCard && (
        <div className="rounded-xl border border-border bg-[var(--surface-muted)] px-4 py-3">
          <p className={sectionLabel}>
            1st innings · {getTeamName(state, state.innings[0].innings.battingTeam)}
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
            {state.innings[0].state.totalRuns}/{state.innings[0].state.wickets}
            <span className="ml-2 text-sm font-normal text-muted">
              ({state.innings[0].state.oversDisplay} ov)
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
