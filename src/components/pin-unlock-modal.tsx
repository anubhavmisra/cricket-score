"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { btnPrimary, btnSecondary, alertError, inputField, labelText } from "@/lib/ui/styles";

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
    <Modal
      open={open}
      title="Unlock scoring"
      description="Enter the scorer PIN to record balls for this match."
      onClose={handleClose}
      dismissible={!loading}
    >
      <form onSubmit={handleSubmit}>
        <label className="mb-4 flex flex-col gap-1">
          <span className={labelText}>Scorer PIN</span>
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
            className={`${inputField} tracking-widest`}
          />
        </label>

        {error && (
          <p role="alert" className={`${alertError} mb-4`}>
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button type="button" onClick={handleClose} disabled={loading} className={`${btnSecondary} flex-1`}>
            Cancel
          </button>
          <button type="submit" disabled={loading || pin.length < 4} className={`${btnPrimary} flex-1 py-3 text-base`}>
            {loading ? "Unlocking…" : "Unlock"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
