"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary, focusRing, inputField, inputFieldSm, labelText, sectionTitle, alertError } from "@/lib/ui/styles";

const DEFAULT_TEAM_A_PLAYERS = Array.from({ length: 11 }, (_, i) => `P${i + 1}`);
const DEFAULT_TEAM_B_PLAYERS = Array.from({ length: 11 }, (_, i) => `Q${i + 1}`);

function getBattingFirst(tossWinner: "a" | "b", electedTo: "bat" | "bowl"): "a" | "b" {
  return (tossWinner === "a" && electedTo === "bat") ||
    (tossWinner === "b" && electedTo === "bowl")
    ? "a"
    : "b";
}

function formatApiError(error: unknown): string {
  if (!error || typeof error !== "object") return "Something went wrong. Please try again.";
  const err = error as { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
  const messages: string[] = [];
  if (err.formErrors?.length) messages.push(...err.formErrors);
  if (err.fieldErrors) {
    for (const [field, fieldMsgs] of Object.entries(err.fieldErrors)) {
      if (fieldMsgs?.length) messages.push(`${field}: ${fieldMsgs.join(", ")}`);
    }
  }
  return messages.length > 0 ? messages.join(". ") : "Something went wrong. Please try again.";
}

export function CreateMatchForm() {
  const router = useRouter();
  const [teamAName, setTeamAName] = useState("");
  const [teamBName, setTeamBName] = useState("");
  const [teamAPlayers, setTeamAPlayers] = useState([...DEFAULT_TEAM_A_PLAYERS]);
  const [teamBPlayers, setTeamBPlayers] = useState([...DEFAULT_TEAM_B_PLAYERS]);
  const [tossWinner, setTossWinner] = useState<"a" | "b">("a");
  const [electedTo, setElectedTo] = useState<"bat" | "bowl">("bat");
  const [openingStrikerIndex, setOpeningStrikerIndex] = useState(0);
  const [openingNonStrikerIndex, setOpeningNonStrikerIndex] = useState(1);
  const [openingBowlerIndex, setOpeningBowlerIndex] = useState(0);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const battingFirst = useMemo(
    () => getBattingFirst(tossWinner, electedTo),
    [tossWinner, electedTo],
  );

  const battingPlayers = battingFirst === "a" ? teamAPlayers : teamBPlayers;
  const bowlingPlayers = battingFirst === "a" ? teamBPlayers : teamAPlayers;
  const battingTeamLabel = battingFirst === "a" ? teamAName || "Team A" : teamBName || "Team B";
  const bowlingTeamLabel = battingFirst === "a" ? teamBName || "Team B" : teamAName || "Team A";

  function updatePlayer(team: "a" | "b", index: number, value: string) {
    if (team === "a") {
      setTeamAPlayers((prev) => prev.map((name, i) => (i === index ? value : name)));
    } else {
      setTeamBPlayers((prev) => prev.map((name, i) => (i === index ? value : name)));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamAName: teamAName.trim(),
          teamBName: teamBName.trim(),
          teamAPlayers: teamAPlayers.map((name) => name.trim()),
          teamBPlayers: teamBPlayers.map((name) => name.trim()),
          tossWinner,
          electedTo,
          openingStrikerIndex,
          openingNonStrikerIndex,
          openingBowlerIndex,
          pin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(formatApiError(data.error));
        return;
      }

      router.push(data.shareUrl);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const fieldClass = inputField;
  const fieldClassSm = inputFieldSm;
  const radioClass = `${focusRing} h-4 w-4 accent-primary`;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className={sectionTitle}>Teams</h2>
        <label className="flex flex-col gap-1">
          <span className={labelText}>Team A</span>
          <input
            type="text"
            required
            value={teamAName}
            onChange={(e) => setTeamAName(e.target.value)}
            placeholder="Team A name"
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelText}>Team B</span>
          <input
            type="text"
            required
            value={teamBName}
            onChange={(e) => setTeamBName(e.target.value)}
            placeholder="Team B name"
            className={fieldClass}
          />
        </label>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitle}>Team A players</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {teamAPlayers.map((name, i) => (
            <label key={`a-${i}`} className="flex flex-col gap-0.5">
              <span className="text-xs text-muted">#{i + 1}</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => updatePlayer("a", i, e.target.value)}
                placeholder={`P${i + 1}`}
                className={fieldClassSm}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitle}>Team B players</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {teamBPlayers.map((name, i) => (
            <label key={`b-${i}`} className="flex flex-col gap-0.5">
              <span className="text-xs text-muted">#{i + 1}</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => updatePlayer("b", i, e.target.value)}
                placeholder={`Q${i + 1}`}
                className={fieldClassSm}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitle}>Toss</h2>
        <fieldset className="flex flex-col gap-2">
          <legend className={`${labelText} mb-1`}>Toss winner</legend>
          <label className="flex min-h-11 items-center gap-2">
            <input
              type="radio"
              name="tossWinner"
              value="a"
              checked={tossWinner === "a"}
              onChange={() => setTossWinner("a")}
              className={radioClass}
            />
            <span>{teamAName || "Team A"}</span>
          </label>
          <label className="flex min-h-11 items-center gap-2">
            <input
              type="radio"
              name="tossWinner"
              value="b"
              checked={tossWinner === "b"}
              onChange={() => setTossWinner("b")}
              className={radioClass}
            />
            <span>{teamBName || "Team B"}</span>
          </label>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className={`${labelText} mb-1`}>Elected to</legend>
          <label className="flex min-h-11 items-center gap-2">
            <input
              type="radio"
              name="electedTo"
              value="bat"
              checked={electedTo === "bat"}
              onChange={() => setElectedTo("bat")}
              className={radioClass}
            />
            <span>Bat</span>
          </label>
          <label className="flex min-h-11 items-center gap-2">
            <input
              type="radio"
              name="electedTo"
              value="bowl"
              checked={electedTo === "bowl"}
              onChange={() => setElectedTo("bowl")}
              className={radioClass}
            />
            <span>Bowl</span>
          </label>
        </fieldset>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitle}>Opening lineup</h2>
        <p className="text-sm text-muted">
          {battingTeamLabel} bats first · {bowlingTeamLabel} bowls
        </p>
        <label className="flex flex-col gap-1">
          <span className={labelText}>Striker ({battingTeamLabel})</span>
          <select
            value={openingStrikerIndex}
            onChange={(e) => setOpeningStrikerIndex(Number(e.target.value))}
            className={fieldClass}
          >
            {battingPlayers.map((name, i) => (
              <option key={`striker-${i}`} value={i}>
                {name || `#${i + 1}`}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelText}>Non-striker ({battingTeamLabel})</span>
          <select
            value={openingNonStrikerIndex}
            onChange={(e) => setOpeningNonStrikerIndex(Number(e.target.value))}
            className={fieldClass}
          >
            {battingPlayers.map((name, i) => (
              <option key={`non-striker-${i}`} value={i}>
                {name || `#${i + 1}`}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelText}>Bowler ({bowlingTeamLabel})</span>
          <select
            value={openingBowlerIndex}
            onChange={(e) => setOpeningBowlerIndex(Number(e.target.value))}
            className={fieldClass}
          >
            {bowlingPlayers.map((name, i) => (
              <option key={`bowler-${i}`} value={i}>
                {name || `#${i + 1}`}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitle}>Scorer PIN</h2>
        <label className="flex flex-col gap-1">
          <span className={labelText}>4–6 digit PIN to unlock scoring</span>
          <input
            type="password"
            inputMode="numeric"
            pattern="\d{4,6}"
            required
            minLength={4}
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="••••"
            className={`${fieldClass} tracking-widest`}
          />
        </label>
      </section>

      {error && (
        <p role="alert" className={alertError}>
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className={`${btnPrimary} w-full`}>
        {loading ? "Creating match…" : "Create match"}
      </button>
    </form>
  );
}
