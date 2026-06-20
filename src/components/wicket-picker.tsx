"use client";

import { useState } from "react";
import type { WicketType } from "@/lib/cricket/types";

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

  const canConfirm =
    wicketType != null && (wicketType !== "run_out" || dismissedEnd != null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wicket-picker-title"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900"
      >
        <h2 id="wicket-picker-title" className="mb-1 text-xl font-semibold">
          Wicket
        </h2>
        {isFreeHit && (
          <p className="mb-3 text-sm text-orange-600 dark:text-orange-400">
            Free hit — only run out or stumped allowed.
          </p>
        )}

        <div className="mb-4 grid grid-cols-2 gap-2">
          {availableTypes.map(({ type, label }) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setWicketType(type);
                if (type !== "run_out") setDismissedEnd(null);
              }}
              className={`min-h-12 rounded-xl px-3 py-3 text-sm font-semibold ${
                wicketType === type
                  ? "bg-red-600 text-white"
                  : "border border-gray-300 dark:border-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {wicketType === "run_out" && (
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              Who was run out?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDismissedEnd("striker")}
                className={`min-h-12 rounded-xl px-3 py-3 text-sm font-semibold ${
                  dismissedEnd === "striker"
                    ? "bg-red-600 text-white"
                    : "border border-gray-300 dark:border-gray-600"
                }`}
              >
                {strikerName}
              </button>
              <button
                type="button"
                onClick={() => setDismissedEnd("non_striker")}
                className={`min-h-12 rounded-xl px-3 py-3 text-sm font-semibold ${
                  dismissedEnd === "non_striker"
                    ? "bg-red-600 text-white"
                    : "border border-gray-300 dark:border-gray-600"
                }`}
              >
                {nonStrikerName}
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 font-medium dark:border-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
            className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
