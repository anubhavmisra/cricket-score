"use client";

import { useEffect, useState } from "react";
import { Scoreboard, type MatchState } from "./scoreboard";
import { ShareLinkBar } from "./share-link-bar";
import { PinUnlockModal } from "./pin-unlock-modal";

function scorerStorageKey(matchId: string) {
  return `scorer-${matchId}`;
}

export function MatchView({ matchId }: { matchId: string }) {
  const [state, setState] = useState<MatchState | null>(null);
  const [error, setError] = useState(false);
  const [isScorer, setIsScorer] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(scorerStorageKey(matchId)) === "true") {
        setIsScorer(true);
      }
    } catch {
      // localStorage may be unavailable in some contexts.
    }
  }, [matchId]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/matches/${matchId}`);
        if (!res.ok) throw new Error("fail");
        const data = (await res.json()) as MatchState;
        if (!cancelled) {
          setState(data);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }

    poll();
    const id = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [matchId]);

  function handleUnlocked() {
    setIsScorer(true);
    setShowPinModal(false);
    try {
      localStorage.setItem(scorerStorageKey(matchId), "true");
    } catch {
      // localStorage may be unavailable in some contexts.
    }
  }

  if (!state) return <p className="p-4">Loading…</p>;

  return (
    <div className="mx-auto max-w-lg p-4">
      <ShareLinkBar matchId={matchId} />
      {error && <p className="mb-3 text-sm text-amber-600 dark:text-amber-400">Reconnecting…</p>}
      <Scoreboard state={state} />

      {!isScorer && (
        <button
          type="button"
          onClick={() => setShowPinModal(true)}
          className="mt-6 w-full rounded-xl bg-green-600 px-6 py-4 text-lg font-semibold text-white"
        >
          Start Scoring
        </button>
      )}

      {isScorer && (
        <p className="mt-6 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-center font-medium text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-200">
          Scorer mode active
        </p>
      )}

      <PinUnlockModal
        matchId={matchId}
        open={showPinModal}
        onClose={() => setShowPinModal(false)}
        onUnlocked={handleUnlocked}
      />
    </div>
  );
}
