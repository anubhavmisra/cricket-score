"use client";

import { useEffect, useState } from "react";
import { Scoreboard, type MatchState } from "./scoreboard";
import { ShareLinkBar } from "./share-link-bar";

export function MatchView({ matchId }: { matchId: string }) {
  const [state, setState] = useState<MatchState | null>(null);
  const [error, setError] = useState(false);

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

  if (!state) return <p className="p-4">Loading…</p>;

  return (
    <div className="mx-auto max-w-lg p-4">
      <ShareLinkBar matchId={matchId} />
      {error && <p className="mb-3 text-sm text-amber-600 dark:text-amber-400">Reconnecting…</p>}
      <Scoreboard state={state} />
    </div>
  );
}
