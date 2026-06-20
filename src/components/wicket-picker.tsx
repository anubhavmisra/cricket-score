"use client";

import { useId, useState } from "react";
import type { WicketType } from "@/lib/cricket/types";
import { DialogShell } from "@/components/ui/dialog-shell";
import { btnDanger, btnSecondary, btnToggle } from "@/lib/ui/styles";

const ALL_WICKET_TYPES: { type: WicketType; label: string }[] = [
  { type: "bowled", label: "Bowled" },
  { type: "caught", label: "Caught" },
  { type: "lbw", label: "LBW" },
  { type: "run_out", label: "Run out" },
  { type: "stumped", label: "Stumped" },
  { type: "other", label: "Other" },
];

const FREE_HIT_WICKET_TYPES: WicketType[] = ["run_out", "stumped"];

type WicketPickerProps = {
  strikerName: string;
  nonStrikerName: string;
  strikerId: string;
  nonStrikerId: string;
  isFreeHit: boolean;
  onConfirm: (wicketType: WicketType, dismissedPlayerId: string | null) => void;
  onCancel: () => void;
};

export function WicketPicker({
  strikerName,
  nonStrikerName,
  strikerId,
  nonStrikerId,
  isFreeHit,
  onConfirm,
  onCancel,
}: WicketPickerProps) {
  const titleId = useId();
  const [wicketType, setWicketType] = useState<WicketType | null>(null);
  const [dismissedEnd, setDismissedEnd] = useState<"striker" | "non_striker" | null>(null);

  const availableTypes = isFreeHit
    ? ALL_WICKET_TYPES.filter((w) => FREE_HIT_WICKET_TYPES.includes(w.type))
    : ALL_WICKET_TYPES;

  function handleConfirm() {
    if (!wicketType) return;

    let dismissedPlayerId: string | null = null;
    if (wicketType === "run_out") {
      if (!dismissedEnd) return;
      dismissedPlayerId = dismissedEnd === "striker" ? strikerId : nonStrikerId;
    } else {
      dismissedPlayerId = strikerId;
    }

    onConfirm(wicketType, dismissedPlayerId);
  }

  const canConfirm = wicketType != null && (wicketType !== "run_out" || dismissedEnd != null);

  return (
    <DialogShell open onClose={onCancel} labelledBy={titleId}>
      <h2 id={titleId} className="mb-1 text-xl font-semibold text-foreground">
        Wicket
      </h2>
      {isFreeHit && (
        <p className="mb-3 text-sm text-[var(--warning-text)]">
          Free hit — only run out or stumped allowed.
        </p>
      )}

      <div className="mb-4 grid grid-cols-2 gap-2" role="group" aria-label="Wicket type">
        {availableTypes.map(({ type, label }) => (
          <button
            key={type}
            type="button"
            aria-pressed={wicketType === type}
            onClick={() => {
              setWicketType(type);
              if (type !== "run_out") setDismissedEnd(null);
            }}
            className={btnToggle(wicketType === type)}
          >
            {label}
          </button>
        ))}
      </div>

      {wicketType === "run_out" && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-muted">Who was run out?</p>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Dismissed batsman">
            <button
              type="button"
              aria-pressed={dismissedEnd === "striker"}
              onClick={() => setDismissedEnd("striker")}
              className={btnToggle(dismissedEnd === "striker")}
            >
              {strikerName}
            </button>
            <button
              type="button"
              aria-pressed={dismissedEnd === "non_striker"}
              onClick={() => setDismissedEnd("non_striker")}
              className={btnToggle(dismissedEnd === "non_striker")}
            >
              {nonStrikerName}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className={`${btnSecondary} flex-1`}>
          Cancel
        </button>
        <button
          type="button"
          disabled={!canConfirm}
          onClick={handleConfirm}
          className={`${btnDanger} flex-1`}
        >
          Confirm
        </button>
      </div>
    </DialogShell>
  );
}
