"use client";

import { focusRing } from "@/lib/ui/styles";

export type MatchViewTab = "live" | "scorecard";

export function MatchViewTabs({
  active,
  onChange,
}: {
  active: MatchViewTab;
  onChange: (tab: MatchViewTab) => void;
}) {
  const tabs: { id: MatchViewTab; label: string }[] = [
    { id: "live", label: "Live" },
    { id: "scorecard", label: "Scorecard" },
  ];

  return (
    <div
      role="tablist"
      aria-label="Match view"
      className="mb-4 flex w-full gap-1 rounded-xl border border-border bg-[var(--surface-muted)] p-1"
    >
      {tabs.map((tab) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={`${focusRing} flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors min-h-11 ${
              selected
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
