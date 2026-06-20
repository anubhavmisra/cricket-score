"use client";

import { useCallback, useEffect, useState } from "react";
import { Scoreboard, type MatchState } from "./scoreboard";
import { ShareLinkBar } from "./share-link-bar";
import { PinUnlockModal } from "./pin-unlock-modal";
import { BallPad } from "./ball-pad";
import { getUnsynced, markSynced } from "@/lib/offline/delivery-queue";

function scorerStorageKey(matchId: string) {
  return `scorer-${matchId}`;
}

export function MatchView({ matchId }: { matchId: string }) {
  const [state, setState] = useState<MatchState | null>(null);
  const [error, setError] = useState(false);
  const [isScorer, setIsScorer] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );

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
    function handleOnline() {
      setIsOffline(false);
    }
    function handleOffline() {
      setIsOffline(true);
    }

    setIsOffline(!navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const refreshState = useCallback(async () => {
    try {
      const res = await fetch(`/api/matches/${matchId}`);
      if (!res.ok) throw new Error("fail");
      const data = (await res.json()) as MatchState;
      setState(data);
      setError(false);
    } catch {
      setError(true);
    }
  }, [matchId]);

  const syncDeliveries = useCallback(async () => {
    const unsynced = await getUnsynced();
    if (unsynced.length === 0) return;

    try {
      const res = await fetch(`/api/matches/${matchId}/deliveries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ deliveries: unsynced.map((u) => u.payload) }),
      });
      if (!res.ok) return;

      for (const item of unsynced) {
        await markSynced(item.clientEventId);
      }
      await refreshState();
    } catch {
      // Keep items queued; will retry on next sync.
    }
  }, [matchId, refreshState]);

  useEffect(() => {
    if (isScorer) {
      void syncDeliveries();
    }
  }, [isScorer, syncDeliveries]);

  useEffect(() => {
    function handleOnline() {
      if (isScorer) void syncDeliveries();
    }
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [isScorer, syncDeliveries]);

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
      {isScorer && isOffline && (
        <p className="mb-3 rounded-lg bg-amber-100 px-3 py-2 text-center text-sm font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Offline — saving locally
        </p>
      )}
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
        <BallPad matchId={matchId} state={state} onDeliveryRecorded={syncDeliveries} />
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
