"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Scoreboard } from "./scoreboard";
import type { MatchState } from "@/lib/match/match-state";
import { MatchCardMenu } from "./match-card-menu";
import { PinUnlockModal } from "./pin-unlock-modal";
import { BallPad } from "./ball-pad";
import { StartSecondInningsFlow } from "./start-second-innings-flow";
import { FullScorecard } from "./full-scorecard";
import { MatchEngagementBar } from "./match-engagement-bar";
import { MatchViewTabs, type MatchViewTab } from "./match-view-tabs";
import { getUnsynced, markSynced } from "@/lib/offline/delivery-queue";
import { isInningsBreak, shouldCompleteMatch } from "@/lib/cricket/match-result";
import { alertWarning, pageShell, matchPanel } from "@/lib/ui/styles";

const VIEWER_POLL_MS = 5000;
const SCORER_POLL_MS = 2000;

function scorerStorageKey(matchId: string) {
  return `scorer-${matchId}`;
}

function readScorerFlag(matchId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(scorerStorageKey(matchId)) === "true";
  } catch {
    return false;
  }
}

async function postAdvance(
  matchId: string,
  body: Record<string, unknown>,
): Promise<boolean> {
  const res = await fetch(`/api/matches/${matchId}/advance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  return res.ok;
}

export function MatchView({
  matchId,
  initialState = null,
}: {
  matchId: string;
  initialState?: MatchState | null;
}) {
  const [state, setState] = useState<MatchState | null>(initialState);
  const [error, setError] = useState(false);
  const [isScorer, setIsScorer] = useState(() => readScorerFlag(matchId));
  const [showPinModal, setShowPinModal] = useState(false);
  const [viewTab, setViewTab] = useState<MatchViewTab>("live");
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );
  const completingRef = useRef(false);

  useEffect(() => {
    setIsScorer(readScorerFlag(matchId));
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
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function poll() {
      if (document.hidden) return;
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

    function startPolling() {
      if (intervalId) clearInterval(intervalId);
      void poll();
      const intervalMs = isScorer ? SCORER_POLL_MS : VIEWER_POLL_MS;
      intervalId = setInterval(poll, intervalMs);
    }

    function stopPolling() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
      }
    }

    if (!document.hidden) {
      startPolling();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [matchId, isScorer]);

  useEffect(() => {
    if (!isScorer || !state || state.match.status === "completed") return;
    if (!shouldCompleteMatch(state)) return;
    if (completingRef.current) return;

    completingRef.current = true;
    void postAdvance(matchId, { action: "complete" })
      .then((ok) => {
        if (ok) return refreshState();
        completingRef.current = false;
      })
      .catch(() => {
        completingRef.current = false;
      });
  }, [isScorer, state, matchId, refreshState]);

  function handleUnlocked() {
    setIsScorer(true);
    setShowPinModal(false);
    try {
      localStorage.setItem(scorerStorageKey(matchId), "true");
    } catch {
      // localStorage may be unavailable in some contexts.
    }
  }

  async function handleStartSecondInnings(payload: {
    battingTeam: "a" | "b";
    openingStrikerId: string;
    openingNonStrikerId: string;
    openingBowlerId: string;
  }) {
    const ok = await postAdvance(matchId, {
      action: "start_innings_2",
      ...payload,
    });
    if (ok) await refreshState();
  }

  if (!state) {
    const cardMenu = (
      <MatchCardMenu
        matchId={matchId}
        state={null}
        isScorer={isScorer}
        onStartScoring={() => setShowPinModal(true)}
      />
    );

    return (
      <main className={pageShell}>
        <section className={matchPanel}>
          <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
            <p className="text-muted motion-safe:animate-pulse motion-reduce:animate-none" role="status" aria-live="polite">
              Loading match…
            </p>
            {cardMenu}
          </div>
        </section>
        <PinUnlockModal
          matchId={matchId}
          open={showPinModal}
          onClose={() => setShowPinModal(false)}
          onUnlocked={handleUnlocked}
        />
      </main>
    );
  }

  const cardMenu = (
    <MatchCardMenu
      matchId={matchId}
      state={state}
      isScorer={isScorer}
      onStartScoring={() => setShowPinModal(true)}
    />
  );

  const breakActive = isInningsBreak(state);
  const showBallPad =
    isScorer &&
    !breakActive &&
    state.match.status !== "completed" &&
    state.match.status !== "innings_break";

  return (
    <main className={pageShell}>
      {isScorer && isOffline && (
        <p role="status" className={`${alertWarning} mb-3`}>
          Offline: saving locally
        </p>
      )}
      {error && (
        <p role="status" className="mb-3 text-sm text-[var(--warning-text)]">
          Reconnecting…
        </p>
      )}
      <MatchViewTabs active={viewTab} onChange={setViewTab} />
      {viewTab === "live" ? (
        <Scoreboard state={state} headerActions={cardMenu} />
      ) : (
        <FullScorecard state={state} headerActions={cardMenu} />
      )}

      <div className="mt-4">
        <MatchEngagementBar matchId={matchId} state={state} />
      </div>

      {breakActive && isScorer && (
        <StartSecondInningsFlow state={state} onStart={handleStartSecondInnings} />
      )}

      {showBallPad && (
        <BallPad matchId={matchId} state={state} onDeliveryRecorded={syncDeliveries} />
      )}

      <PinUnlockModal
        matchId={matchId}
        open={showPinModal}
        onClose={() => setShowPinModal(false)}
        onUnlocked={handleUnlocked}
      />
    </main>
  );
}
