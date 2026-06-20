import type { MatchState } from "@/components/scoreboard";
import { computeMatchResult } from "@/lib/cricket/match-result";

export function buildMatchShareUrl(matchId: string, origin?: string): string {
  const configured = process.env.NEXT_PUBLIC_APP_ORIGIN?.replace(/\/$/, "");
  const base =
    origin ??
    configured ??
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/m/${matchId}`;
}

export function buildShareResultText(state: MatchState, url: string): string {
  const result = computeMatchResult(state);
  if (!result) {
    return `${state.match.teamAName} vs ${state.match.teamBName}\n${url}`;
  }

  return [
    `${state.match.teamAName} vs ${state.match.teamBName}`,
    `${result.winnerName} won by ${result.margin}`,
    url,
  ].join("\n");
}

export function buildLiveShareText(state: MatchState, url: string): string {
  return `Live score: ${state.match.teamAName} vs ${state.match.teamBName}\n${url}`;
}

export function canNativeShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

type SharePayload = {
  title: string;
  text: string;
  url: string;
};

export async function shareNative(payload: SharePayload): Promise<"shared" | "cancelled" | "unavailable" | "failed"> {
  if (!canNativeShare()) return "unavailable";

  try {
    await navigator.share(payload);
    return "shared";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "cancelled";
    }
    return "failed";
  }
}
