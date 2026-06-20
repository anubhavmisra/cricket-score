"use client";

import { useCallback, useEffect, useState } from "react";
import type { MatchState } from "./scoreboard";
import { PlayerPicker } from "./player-picker";
import { WicketPicker } from "./wicket-picker";
import type { ExtraType, WicketType } from "@/lib/cricket/types";
import { enqueueDelivery } from "@/lib/offline/delivery-queue";

type DeliveryRow = {
  sequence: number;
  isUndo: boolean;
  undoesSequence: number | null;
};

type DeliveryPayload = {
  clientEventId: string;
  inningsId: string;
  runsOffBat: number;
  extraType?: ExtraType | null;
  extraRuns: number;
  isWicket: boolean;
  wicketType?: WicketType | null;
  dismissedPlayerId?: string | null;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  isUndo?: boolean;
  undoesSequence?: number | null;
};

type PendingFollowUp =
  | { kind: "next_batsman"; dismissedPlayerId: string }
  | { kind: "new_bowler" };

function getActiveInningsIndex(state: MatchState): number {
  const { status } = state.match;
  if (status === "innings_2" || status === "completed") {
    const second = state.innings.find((i) => i.innings.inningsNumber === 2);
    if (second) return state.innings.indexOf(second);
  }
  return 0;
}

function getPlayerName(players: MatchState["players"], playerId: string): string {
  return players.find((p) => p.id === playerId)?.name ?? "Unknown";
}

function getUndoneSequences(deliveries: DeliveryRow[]): Set<number> {
  const undone = new Set<number>();
  for (const d of deliveries) {
    if (d.isUndo && d.undoesSequence != null) {
      undone.add(d.undoesSequence);
    }
  }
  return undone;
}

type BallPadProps = {
  matchId: string;
  state: MatchState;
  onDeliveryRecorded: () => void;
};

export function BallPad({ matchId: _matchId, state, onDeliveryRecorded }: BallPadProps) {
  const [showWicketPicker, setShowWicketPicker] = useState(false);
  const [playerPicker, setPlayerPicker] = useState<{
    title: string;
    players: Array<{ id: string; name: string; disabled?: boolean; disabledReason?: string }>;
    onSelect: (playerId: string) => void;
  } | null>(null);
  const [pendingFollowUp, setPendingFollowUp] = useState<PendingFollowUp | null>(null);
  const [overrideBowlerId, setOverrideBowlerId] = useState<string | null>(null);
  const [overrideStrikerId, setOverrideStrikerId] = useState<string | null>(null);
  const [overrideNonStrikerId, setOverrideNonStrikerId] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);

  const activeIndex = getActiveInningsIndex(state);
  const active = state.innings[activeIndex];

  useEffect(() => {
    setOverrideBowlerId(null);
    setOverrideStrikerId(null);
    setOverrideNonStrikerId(null);
  }, [active?.innings.id, active?.state.legalBalls, active?.state.wickets, active?.state.totalRuns]);

  const shouldHide =
    !active ||
    active.state.isComplete ||
    state.match.status === "innings_break" ||
    state.match.status === "completed";

  const getCurrentIds = useCallback(() => {
    if (!active) return null;
    const { state: innState } = active;
    return {
      strikerId: overrideStrikerId ?? innState.strikerId,
      nonStrikerId: overrideNonStrikerId ?? innState.nonStrikerId,
      bowlerId: overrideBowlerId ?? innState.bowlerId,
      inningsId: active.innings.id,
      innState,
    };
  }, [active, overrideBowlerId, overrideStrikerId, overrideNonStrikerId]);

  const submitDelivery = useCallback(
    async (
      payload: Omit<
        DeliveryPayload,
        "clientEventId" | "inningsId" | "strikerId" | "nonStrikerId" | "bowlerId"
      >,
    ) => {
      const ids = getCurrentIds();
      if (!ids || recording) return;

      setRecording(true);
      try {
        const clientEventId = crypto.randomUUID();
        const fullPayload: DeliveryPayload = {
          ...payload,
          clientEventId,
          inningsId: ids.inningsId,
          strikerId: ids.strikerId,
          nonStrikerId: ids.nonStrikerId,
          bowlerId: ids.bowlerId,
        };

        await enqueueDelivery({
          clientEventId,
          inningsId: ids.inningsId,
          payload: fullPayload,
          synced: false,
        });
        onDeliveryRecorded();

        const isLegal = !payload.extraType;
        const legalBallsAfter = ids.innState.legalBalls + (isLegal ? 1 : 0);
        if (isLegal && legalBallsAfter > 0 && legalBallsAfter % 6 === 0) {
          setPendingFollowUp({ kind: "new_bowler" });
        }
      } finally {
        setRecording(false);
      }
    },
    [getCurrentIds, onDeliveryRecorded, recording],
  );

  const openBowlerPicker = useCallback(() => {
    if (!active) return;
    const battingTeam = active.innings.battingTeam;
    const bowlingTeam = battingTeam === "a" ? "b" : "a";
    const { state: innState } = active;

    const players = state.players
      .filter((p) => p.team === bowlingTeam)
      .map((p) => {
        const legalBalls = innState.bowlerStats[p.id]?.legalBalls ?? 0;
        const atLimit = legalBalls >= 24;
        return {
          id: p.id,
          name: p.name,
          disabled: atLimit,
          disabledReason: atLimit ? "Max 4 overs bowled" : undefined,
        };
      });

    setPlayerPicker({
      title: "Select bowler",
      players,
      onSelect: (playerId) => {
        setOverrideBowlerId(playerId);
        setPlayerPicker(null);
        setPendingFollowUp(null);
      },
    });
  }, [active, state.players]);

  const openNextBatsmanPicker = useCallback(
    (dismissedPlayerId: string) => {
      if (!active) return;
      const battingTeam = active.innings.battingTeam;
      const { state: innState } = active;

      const players = state.players
        .filter((p) => p.team === battingTeam)
        .filter((p) => {
          const stats = innState.batsmanStats[p.id];
          if (stats?.isOut) return false;
          if (p.id === innState.strikerId || p.id === innState.nonStrikerId) return false;
          return true;
        })
        .map((p) => ({ id: p.id, name: p.name }));

      setPlayerPicker({
        title: "Next batsman",
        players,
        onSelect: (playerId) => {
          if (dismissedPlayerId === innState.strikerId) {
            setOverrideStrikerId(playerId);
          } else {
            setOverrideNonStrikerId(playerId);
          }
          setPlayerPicker(null);
          setPendingFollowUp(null);
        },
      });
    },
    [active, state.players],
  );

  useEffect(() => {
    if (!pendingFollowUp || playerPicker) return;
    if (pendingFollowUp.kind === "new_bowler") {
      openBowlerPicker();
    } else if (pendingFollowUp.kind === "next_batsman") {
      openNextBatsmanPicker(pendingFollowUp.dismissedPlayerId);
    }
  }, [pendingFollowUp, playerPicker, openBowlerPicker, openNextBatsmanPicker]);

  if (shouldHide) return null;

  const ids = getCurrentIds();
  if (!ids) return null;

  async function handleRun(runsOffBat: number) {
    await submitDelivery({
      runsOffBat,
      extraRuns: 0,
      isWicket: false,
    });
  }

  async function handleExtra(extraType: ExtraType) {
    await submitDelivery({
      runsOffBat: 0,
      extraType,
      extraRuns: 0,
      isWicket: false,
    });
  }

  async function handleWicketConfirm(wicketType: WicketType, dismissedPlayerId: string | null) {
    setShowWicketPicker(false);
    if (!dismissedPlayerId) return;

    await submitDelivery({
      runsOffBat: 0,
      extraRuns: 0,
      isWicket: true,
      wicketType,
      dismissedPlayerId,
    });

    setPendingFollowUp({ kind: "next_batsman", dismissedPlayerId });
  }

  async function handleUndo() {
    if (!active || recording) return;

    const deliveries = active.deliveries as DeliveryRow[];
    const undone = getUndoneSequences(deliveries);
    const latest = deliveries
      .filter((d) => !d.isUndo && !undone.has(d.sequence))
      .sort((a, b) => b.sequence - a.sequence)[0];

    if (!latest) return;

    const ids = getCurrentIds();
    if (!ids) return;

    setRecording(true);
    try {
      const clientEventId = crypto.randomUUID();
      const fullPayload: DeliveryPayload = {
        clientEventId,
        inningsId: ids.inningsId,
        runsOffBat: 0,
        extraRuns: 0,
        isWicket: false,
        strikerId: ids.strikerId,
        nonStrikerId: ids.nonStrikerId,
        bowlerId: ids.bowlerId,
        isUndo: true,
        undoesSequence: latest.sequence,
      };

      await enqueueDelivery({
        clientEventId,
        inningsId: ids.inningsId,
        payload: fullPayload,
        synced: false,
      });
      onDeliveryRecorded();
    } finally {
      setRecording(false);
    }
  }

  const buttonClass =
    "min-h-[48px] rounded-xl px-2 py-3 text-lg font-bold transition-colors active:scale-95 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="mt-6">
      <h2 className="mb-3 text-center text-sm font-semibold uppercase tracking-wide text-gray-500">
        Record ball
      </h2>
      <div className="grid grid-cols-3 gap-2">
        {([0, 1, 2, 3, 4, 6] as const).map((runs) => (
          <button
            key={runs}
            type="button"
            disabled={recording}
            onClick={() => handleRun(runs)}
            className={`${buttonClass} bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600`}
          >
            {runs}
          </button>
        ))}
        <button
          type="button"
          disabled={recording}
          onClick={() => handleExtra("wide")}
          className={`${buttonClass} bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-800`}
        >
          Wide
        </button>
        <button
          type="button"
          disabled={recording}
          onClick={() => handleExtra("noball")}
          className={`${buttonClass} bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-800`}
        >
          No ball
        </button>
        <button
          type="button"
          disabled={recording}
          onClick={() => setShowWicketPicker(true)}
          className={`${buttonClass} bg-red-600 text-white`}
        >
          W
        </button>
        <button
          type="button"
          disabled={recording}
          onClick={handleUndo}
          className={`${buttonClass} col-span-3 border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200`}
        >
          Undo
        </button>
      </div>

      {showWicketPicker && (
        <WicketPicker
          strikerName={getPlayerName(state.players, ids.strikerId)}
          nonStrikerName={getPlayerName(state.players, ids.nonStrikerId)}
          strikerId={ids.strikerId}
          nonStrikerId={ids.nonStrikerId}
          isFreeHit={ids.innState.isFreeHit}
          onConfirm={handleWicketConfirm}
          onCancel={() => setShowWicketPicker(false)}
        />
      )}

      {playerPicker && (
        <PlayerPicker
          title={playerPicker.title}
          players={playerPicker.players}
          onSelect={playerPicker.onSelect}
          onCancel={() => {
            setPlayerPicker(null);
            setPendingFollowUp(null);
          }}
        />
      )}
    </div>
  );
}
