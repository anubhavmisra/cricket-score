import Link from "next/link";
import type { MatchSummary } from "@/lib/match/list-matches";

function statusLabel(status: MatchSummary["status"]): string {
  switch (status) {
    case "innings_1":
      return "1st innings";
    case "innings_break":
      return "Innings break";
    case "innings_2":
      return "2nd innings";
    case "completed":
      return "Completed";
  }
}

function formatWhen(date: Date): string {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MatchList({ matches }: { matches: MatchSummary[] }) {
  if (matches.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-surface px-4 py-8 text-center text-sm text-muted">
        No matches yet. Create one to get started.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {matches.map((match) => (
        <li key={match.id}>
          <Link
            href={`/m/${match.id}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 no-underline transition-colors hover:bg-[var(--surface-muted)]"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">
                {match.teamAName} vs {match.teamBName}
              </p>
              <p className="text-sm text-muted">{formatWhen(match.createdAt)}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                match.status === "completed"
                  ? "bg-[var(--surface-muted)] text-muted"
                  : "bg-[var(--info-bg)] text-[var(--info-text)]"
              }`}
            >
              {statusLabel(match.status)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
