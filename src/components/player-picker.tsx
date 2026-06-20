"use client";

import { useId } from "react";
import { DialogShell } from "@/components/ui/dialog-shell";
import { btnSecondary, focusRing } from "@/lib/ui/styles";

type PlayerOption = {
  id: string;
  name: string;
  disabled?: boolean;
  disabledReason?: string;
};

type PlayerPickerProps = {
  players: PlayerOption[];
  title: string;
  onSelect: (playerId: string) => void;
  onCancel: () => void;
};

export function PlayerPicker({ players, title, onSelect, onCancel }: PlayerPickerProps) {
  const titleId = useId();

  return (
    <DialogShell
      open
      onClose={onCancel}
      labelledBy={titleId}
      panelClassName="flex max-h-[70vh] w-full max-w-sm flex-col rounded-2xl bg-surface shadow-xl"
    >
      <div className="border-b border-border p-4">
        <h2 id={titleId} className="text-xl font-semibold text-foreground">
          {title}
        </h2>
      </div>

      <ul className="flex-1 overflow-y-auto p-2">
        {players.map((player) => (
          <li key={player.id}>
            <button
              type="button"
              disabled={player.disabled}
              onClick={() => onSelect(player.id)}
              className={`${focusRing} flex w-full min-h-[48px] flex-col rounded-xl px-4 py-3 text-left text-base font-medium transition-[color,background-color] duration-150 ease-[var(--ease-out)] hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <span>{player.name}</span>
              {player.disabled && player.disabledReason && (
                <span className="text-sm font-normal text-[var(--warning-text)]">
                  {player.disabledReason}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <div className="border-t border-border p-3">
        <button type="button" onClick={onCancel} className={`${btnSecondary} w-full`}>
          Cancel
        </button>
      </div>
    </DialogShell>
  );
}
