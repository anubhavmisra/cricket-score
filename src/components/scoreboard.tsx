import type { ReactNode } from "react";
import type { BowlerStats, PlayerStats } from "@/lib/cricket/types";
import { computeMatchResult, isInningsBreak } from "@/lib/cricket/match-result";
import { formatFallOfWickets, getInningsHeader } from "@/lib/cricket/scorecard";
import { sectionLabel, matchViewStack } from "@/lib/ui/styles";

export type { MatchState } from "@/lib/match/match-state";
import type { MatchState } from "@/lib/match/match-state";
import {
  getLiveInningsNumber,
  InningsHeaderBlock,
  MatchPanel,
  PanelSection,
} from "./innings-panel";

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

function MatchResultBanner({ state }: { state: MatchState }) {
  const result = computeMatchResult(state);
  if (!result || state.match.status !== "completed") return null;

  return (
    <MatchPanel className="border-[var(--success-border)] bg-[var(--success-bg)] text-center">
      <div className="px-4 py-3">
        <p className="text-lg font-bold text-[var(--success-text)]">
          {result.winnerName} won by {result.margin}
        </p>
      </div>
    </MatchPanel>
  );
}

function CompletedInningsPanel({
  state,
  headerActions,
}: {
  state: MatchState;
  headerActions?: ReactNode;
}) {
  return (
    <>
      {([1, 2] as const).map((n) => {
        const header = getInningsHeader(state, n);
        if (!header) return null;
        return (
          <MatchPanel key={n}>
            <InningsHeaderBlock header={header} actions={n === 1 ? headerActions : undefined} />
          </MatchPanel>
        );
      })}
    </>
  );
}

export function Scoreboard({
  state,
  headerActions,
}: {
  state: MatchState;
  headerActions?: ReactNode;
}) {
  const breakActive = isInningsBreak(state);
  const activeIndex = getActiveInningsIndex(state);
  const active = state.innings[activeIndex];

  if (!active && !breakActive) {
    return <p className="text-sm text-muted">No innings data yet.</p>;
  }

  const statusLabel = getStatusLabel(state);
  const showLiveCard = active && !breakActive && state.match.status !== "completed";
  const liveInningsNumber = getLiveInningsNumber(state);
  const liveHeader = getInningsHeader(state, liveInningsNumber);

  const innState = active?.state;
  const innMeta = active?.innings;
  const bowlingTeam = innMeta?.battingTeam === "a" ? "b" : "a";
  const bowlingTeamName = getTeamName(state, bowlingTeam);

  const strikerStats = innState ? innState.batsmanStats[innState.strikerId] : undefined;
  const nonStrikerStats = innState ? innState.batsmanStats[innState.nonStrikerId] : undefined;
  const bowlerStats = innState ? innState.bowlerStats[innState.bowlerId] : undefined;
  const fow = showLiveCard ? formatFallOfWickets(state, liveInningsNumber) : "";

  return (
    <div className={matchViewStack}>
      <p className="truncate text-center text-sm text-muted">
        {state.match.teamAName} vs {state.match.teamBName}
      </p>

      <MatchResultBanner state={state} />

      {breakActive && liveHeader && (
        <MatchPanel>
          <InningsHeaderBlock header={liveHeader} statusLabel={statusLabel} actions={headerActions} />
        </MatchPanel>
      )}

      {showLiveCard && liveHeader && innState && (
        <MatchPanel>
          <InningsHeaderBlock header={liveHeader} statusLabel={statusLabel} actions={headerActions} />
          {innState.isFreeHit && (
            <PanelSection bordered={false}>
              <p className="text-sm font-medium text-[var(--warning-text)]">Free hit</p>
            </PanelSection>
          )}
          <PanelSection bordered={!innState.isFreeHit}>
            <p className={sectionLabel}>Batting</p>
            <ul className="mt-2 flex flex-col gap-1 text-sm text-foreground">
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
          </PanelSection>
          <PanelSection>
            <p className={sectionLabel}>Bowling · {bowlingTeamName}</p>
            {bowlerStats ? (
              <p className="mt-2 text-sm text-foreground">
                {formatBowlerLine(bowlerStats, getPlayerName(state.players, innState.bowlerId))}
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted">—</p>
            )}
          </PanelSection>
          {fow && (
            <PanelSection>
              <p className={sectionLabel}>Fall of wickets</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{fow}</p>
            </PanelSection>
          )}
        </MatchPanel>
      )}

      {state.match.status === "completed" && (
        <CompletedInningsPanel state={state} headerActions={headerActions} />
      )}

      {state.innings.length > 1 && activeIndex === 1 && state.innings[0] && showLiveCard && (
        <MatchPanel className="bg-[var(--surface-muted)]">
          <div className="px-4 py-3">
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
        </MatchPanel>
      )}
    </div>
  );
}
