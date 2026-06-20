import type { ReactNode } from "react";
import type { MatchState } from "@/lib/match/match-state";
import { getInningsHeader } from "@/lib/cricket/scorecard";
import { sectionLabel, matchPanel, matchViewStack } from "@/lib/ui/styles";

export type InningsHeaderData = NonNullable<ReturnType<typeof getInningsHeader>>;

export function MatchPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`${matchPanel} ${className}`.trim()}>{children}</section>;
}

export function InningsHeaderBlock({
  header,
  statusLabel,
  actions,
}: {
  header: InningsHeaderData;
  statusLabel?: string | null;
  actions?: ReactNode;
}) {
  return (
    <div className="border-b border-border px-4 py-3">
      {statusLabel && (
        <p className="mb-1 text-center text-sm font-medium text-[var(--warning-text)]">{statusLabel}</p>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={sectionLabel}>{header.label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {header.total}
            <span className="ml-2 text-base font-normal text-muted">({header.overs} ov)</span>
          </p>
          <p className="mt-1 text-sm text-muted">
            RR {header.runRate}
            {header.target != null && <span className="ml-3">Target {header.target}</span>}
          </p>
        </div>
        {actions}
      </div>
    </div>
  );
}

export function PanelSection({
  children,
  bordered = true,
}: {
  children: ReactNode;
  bordered?: boolean;
}) {
  return (
    <div className={`px-4 py-3 ${bordered ? "border-t border-border" : ""}`}>{children}</div>
  );
}

export { matchViewStack };

export function getLiveInningsNumber(state: MatchState): 1 | 2 {
  const activeIndex =
    state.match.status === "innings_2" || state.match.status === "completed"
      ? 2
      : 1;
  return activeIndex;
}
