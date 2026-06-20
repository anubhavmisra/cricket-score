"use client";

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
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-picker-title"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[70vh] w-full max-w-sm flex-col rounded-2xl bg-white shadow-xl dark:bg-gray-900"
      >
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <h2 id="player-picker-title" className="text-xl font-semibold">
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
                className="flex w-full min-h-[48px] flex-col rounded-xl px-4 py-3 text-left text-base font-medium transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-800"
              >
                <span>{player.name}</span>
                {player.disabled && player.disabledReason && (
                  <span className="text-sm font-normal text-amber-600 dark:text-amber-400">
                    {player.disabledReason}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>

        <div className="border-t border-gray-200 p-3 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 font-medium dark:border-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
