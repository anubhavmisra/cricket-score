"use client";

import { useState } from "react";

type PinUnlockModalProps = {
  matchId: string;
  open: boolean;
  onClose: () => void;
  onUnlocked: () => void;
};

export function PinUnlockModal({ matchId, open, onClose, onUnlocked }: PinUnlockModalProps) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(pin)) {
      setError("Enter a 4–6 digit PIN.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/matches/${matchId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error === "Invalid PIN" ? "Incorrect PIN. Try again." : "Unlock failed. Try again.");
        return;
      }

      setPin("");
      onUnlocked();
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (loading) return;
    setPin("");
    setError(null);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-unlock-title"
      onClick={handleClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900"
      >
        <h2 id="pin-unlock-title" className="mb-1 text-xl font-semibold">
          Unlock scoring
        </h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Enter the scorer PIN to record balls for this match.
        </p>

        <label className="mb-4 flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Scorer PIN</span>
          <input
            type="password"
            inputMode="numeric"
            pattern="\d{4,6}"
            required
            minLength={4}
            maxLength={6}
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="••••"
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-base tracking-widest dark:border-gray-600 dark:bg-gray-800"
          />
        </label>

        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 font-medium disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="flex-1 rounded-xl bg-green-600 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Unlocking…" : "Unlock"}
          </button>
        </div>
      </form>
    </div>
  );
}
