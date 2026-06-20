"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { MatchState } from "@/lib/match/match-state";
import {
  buildLiveShareText,
  buildMatchShareUrl,
  buildShareResultText,
  canNativeShare,
  copyToClipboard,
  shareNative,
} from "@/lib/share/match-share";
import { MatchShareQr } from "./match-share-qr";
import { Modal } from "./ui/modal";
import { alertError, btnPrimarySm, btnSecondary, inputField } from "@/lib/ui/styles";

type MatchShareModalProps = {
  matchId: string;
  state: MatchState | null;
  open: boolean;
  onClose: () => void;
};

type FeedbackKind = "link" | "result" | null;

export function MatchShareModal({ matchId, state, open, onClose }: MatchShareModalProps) {
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isCompleted = state?.match.status === "completed";
  const nativeShareAvailable = canNativeShare();

  const [url, setUrl] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackKind>(null);
  const [copyError, setCopyError] = useState(false);
  const [shareError, setShareError] = useState(false);

  useEffect(() => {
    setUrl(buildMatchShareUrl(matchId));
  }, [matchId]);

  useEffect(() => {
    if (!open) {
      setShowQr(false);
      setFeedback(null);
      setCopyError(false);
      setShareError(false);
    }
  }, [open]);

  const clearFeedbackTimer = useCallback(() => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearFeedbackTimer, [clearFeedbackTimer]);

  function showFeedback(kind: FeedbackKind) {
    clearFeedbackTimer();
    setFeedback(kind);
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 2000);
  }

  async function handleCopyLink() {
    if (!url) return;

    setCopyError(false);
    const ok = await copyToClipboard(url);
    if (ok) {
      showFeedback("link");
    } else {
      setCopyError(true);
    }
  }

  async function handleShareLink() {
    if (!url || !state) return;

    setShareError(false);
    const text = isCompleted
      ? buildShareResultText(state, url)
      : buildLiveShareText(state, url);

    const outcome = await shareNative({
      title: `${state.match.teamAName} vs ${state.match.teamBName}`,
      text,
      url,
    });

    if (outcome === "failed") {
      setShareError(true);
    }
  }

  async function handleShareResult() {
    if (!url || !state || !isCompleted) return;

    setShareError(false);
    const text = buildShareResultText(state, url);
    const outcome = await shareNative({
      title: "Match result",
      text,
      url,
    });

    if (outcome === "failed" || outcome === "unavailable") {
      const copied = await copyToClipboard(text);
      if (copied) {
        showFeedback("result");
      } else {
        setShareError(true);
      }
    }
  }

  const title = isCompleted ? "Share result" : "Share match";
  const description = isCompleted
    ? "Send the final score to teammates and spectators."
    : "Share the live score link so others can follow along.";

  return (
    <Modal open={open} title={title} description={description} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={url}
            aria-label="Match link"
            onFocus={(event) => event.currentTarget.select()}
            className={`${inputField} min-w-0 flex-1 truncate text-sm`}
          />
          <button type="button" onClick={handleCopyLink} disabled={!url} className={btnPrimarySm}>
            {feedback === "link" ? "Copied" : "Copy link"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {nativeShareAvailable && state && (
            <button
              type="button"
              onClick={isCompleted ? handleShareResult : handleShareLink}
              disabled={!url}
              className={btnSecondary}
            >
              {isCompleted ? "Share result" : "Share"}
            </button>
          )}

          {isCompleted && !nativeShareAvailable && (
            <button type="button" onClick={handleShareResult} disabled={!url} className={btnSecondary}>
              {feedback === "result" ? "Copied" : "Copy result"}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowQr((current) => !current)}
            aria-expanded={showQr}
            className={btnSecondary}
          >
            {showQr ? "Hide QR code" : "Show QR code"}
          </button>
        </div>

        {showQr && url && <MatchShareQr url={url} />}
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {feedback === "link" && "Link copied"}
        {feedback === "result" && "Result copied"}
      </p>

      {copyError && (
        <p role="alert" className={`${alertError} mt-3 text-xs`}>
          Copy failed. Select the link manually.
        </p>
      )}

      {shareError && (
        <p role="alert" className={`${alertError} mt-3 text-xs`}>
          Share failed. Copy the link instead.
        </p>
      )}
    </Modal>
  );
}
