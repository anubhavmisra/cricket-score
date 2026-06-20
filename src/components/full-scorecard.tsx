import type { ReactNode } from "react";
import type { MatchState } from "@/lib/match/match-state";
import {
  formatFallOfWickets,
  getBattingRows,
  getBowlingRows,
  getInningsEntry,
  getInningsHeader,
} from "@/lib/cricket/scorecard";
import { sectionLabel, matchViewStack } from "@/lib/ui/styles";
import { InningsHeaderBlock, MatchPanel, PanelSection } from "./innings-panel";

function ScorecardTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  if (rows.length === 0) return null;

  return (
    <div className="w-full min-w-0 overflow-x-auto">
      <table className="w-full min-w-0 border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted">
            {headers.map((h) => (
              <th key={h} scope="col" className="px-2 py-2 font-medium first:pl-0 last:pr-0">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0">
              {cells.map((cell, j) => (
                <td
                  key={j}
                  className={`px-2 py-2 tabular-nums first:pl-0 last:pr-0 ${
                    j === 0 ? "max-w-[9rem] truncate font-medium text-foreground" : "text-foreground"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InningsScorecard({
  state,
  inningsNumber,
  headerActions,
}: {
  state: MatchState;
  inningsNumber: 1 | 2;
  headerActions?: ReactNode;
}) {
  const header = getInningsHeader(state, inningsNumber);
  if (!header) return null;

  const batting = getBattingRows(state, inningsNumber);
  const bowling = getBowlingRows(state, inningsNumber);
  const fow = formatFallOfWickets(state, inningsNumber);

  const entry = getInningsEntry(state, inningsNumber);
  const inningsComplete =
    entry?.state.isComplete ||
    state.match.status === "completed" ||
    (inningsNumber === 1 && state.match.status !== "innings_1");

  const battingRows = batting
    .filter((b) => inningsComplete || b.didBat)
    .map((b) => [
      b.name,
      String(b.runs),
      b.balls > 0 ? String(b.balls) : "—",
      b.fours > 0 ? String(b.fours) : "—",
      b.sixes > 0 ? String(b.sixes) : "—",
      b.strikeRate,
      b.didBat ? b.dismissal : "—",
    ]);

  const bowlingRows = bowling.map((b) => [
    b.name,
    b.overs,
    String(b.runs),
    String(b.wickets),
    b.economy,
  ]);

  return (
    <MatchPanel>
      <InningsHeaderBlock header={header} actions={headerActions} />
      <PanelSection bordered={false}>
        <p className={sectionLabel}>Batting</p>
        <div className="mt-2">
          <ScorecardTable
            headers={["Batter", "R", "B", "4s", "6s", "SR", ""]}
            rows={battingRows}
          />
        </div>
      </PanelSection>
      {bowlingRows.length > 0 && (
        <PanelSection>
          <p className={sectionLabel}>Bowling</p>
          <div className="mt-2">
            <ScorecardTable headers={["Bowler", "O", "R", "W", "Econ"]} rows={bowlingRows} />
          </div>
        </PanelSection>
      )}
      {fow && (
        <PanelSection>
          <p className={sectionLabel}>Fall of wickets</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">{fow}</p>
        </PanelSection>
      )}
    </MatchPanel>
  );
}

export function FullScorecard({
  state,
  headerActions,
}: {
  state: MatchState;
  headerActions?: ReactNode;
}) {
  const inningsNumbers: (1 | 2)[] = [];
  if (state.innings.some((i) => i.innings.inningsNumber === 1)) inningsNumbers.push(1);
  if (state.innings.some((i) => i.innings.inningsNumber === 2)) inningsNumbers.push(2);

  if (inningsNumbers.length === 0) {
    return <p className="text-sm text-muted">No innings scored yet.</p>;
  }

  return (
    <div className={matchViewStack}>
      {inningsNumbers.map((n, index) => (
        <InningsScorecard
          key={n}
          state={state}
          inningsNumber={n}
          headerActions={index === 0 ? headerActions : undefined}
        />
      ))}
    </div>
  );
}
