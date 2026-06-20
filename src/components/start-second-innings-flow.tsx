"use client";

import { useMemo, useState } from "react";
import type { MatchState } from "./scoreboard";
import { PlayerPicker } from "./player-picker";
import { btnPrimary } from "@/lib/ui/styles";

type StartSecondInningsFlowProps = {
  state: MatchState;
  onStart: (payload: {
    battingTeam: "a" | "b";
    openingStrikerId: string;
    openingNonStrikerId: string;
    openingBowlerId: string;
  }) => Promise<void>;
};

type Step = "striker" | "non_striker" | "bowler";

function getTeamName(state: MatchState, team: "a" | "b"): string {
  return team === "a" ? state.match.teamAName : state.match.teamBName;
}

export function StartSecondInningsFlow({ state, onStart }: StartSecondInningsFlowProps) {
  const [step, setStep] = useState<Step | null>(null);
  const [strikerId, setStrikerId] = useState<string | null>(null);
  const [nonStrikerId, setNonStrikerId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const inn1 = state.innings.find((i) => i.innings.inningsNumber === 1);
  const battingTeam = inn1 ? (inn1.innings.battingTeam === "a" ? "b" : "a") : "b";
  const bowlingTeam = battingTeam === "a" ? "b" : "a";

  const battingPlayers = useMemo(
    () => state.players.filter((p) => p.team === battingTeam),
    [state.players, battingTeam],
  );
  const bowlingPlayers = useMemo(
    () => state.players.filter((p) => p.team === bowlingTeam),
    [state.players, bowlingTeam],
  );

  function resetFlow() {
    setStep(null);
    setStrikerId(null);
    setNonStrikerId(null);
  }

  async function finishFlow(bowlerId: string) {
    if (!strikerId || !nonStrikerId) return;
    setSubmitting(true);
    try {
      await onStart({
        battingTeam,
        openingStrikerId: strikerId,
        openingNonStrikerId: nonStrikerId,
        openingBowlerId: bowlerId,
      });
      resetFlow();
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "striker") {
    return (
      <PlayerPicker
        title={`Opening striker · ${getTeamName(state, battingTeam)}`}
        players={battingPlayers.map((p) => ({ id: p.id, name: p.name }))}
        onSelect={(id) => {
          setStrikerId(id);
          setStep("non_striker");
        }}
        onCancel={resetFlow}
      />
    );
  }

  if (step === "non_striker") {
    return (
      <PlayerPicker
        title={`Opening non-striker · ${getTeamName(state, battingTeam)}`}
        players={battingPlayers
          .filter((p) => p.id !== strikerId)
          .map((p) => ({ id: p.id, name: p.name }))}
        onSelect={(id) => {
          setNonStrikerId(id);
          setStep("bowler");
        }}
        onCancel={resetFlow}
      />
    );
  }

  if (step === "bowler") {
    return (
      <PlayerPicker
        title={`Opening bowler · ${getTeamName(state, bowlingTeam)}`}
        players={bowlingPlayers.map((p) => ({ id: p.id, name: p.name }))}
        onSelect={(id) => void finishFlow(id)}
        onCancel={resetFlow}
      />
    );
  }

  return (
    <button
      type="button"
      disabled={submitting || !inn1}
      onClick={() => setStep("striker")}
      className={`${btnPrimary} mt-4 w-full min-h-12`}
    >
      Start 2nd innings
    </button>
  );
}
