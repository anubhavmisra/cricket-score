"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { MatchEngagement } from "@/lib/match/engagement";
import { alertError, btnPrimarySm, inputField, sectionLabel } from "@/lib/ui/styles";

type MatchCommentsSectionProps = {
  matchId: string;
  displayName: string;
  isSignedIn: boolean;
  engagement: MatchEngagement | null;
  onEngagementChange: (engagement: MatchEngagement) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
};

function formatCommentTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MatchCommentsSection({
  matchId,
  displayName,
  isSignedIn,
  engagement,
  onEngagementChange,
  inputRef,
}: MatchCommentsSectionProps) {
  const pathname = usePathname();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  const signInHref = `/sign-in?redirect_url=${encodeURIComponent(pathname)}`;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || !isSignedIn || submitting) return;

    setSubmitting(true);
    setError(false);
    try {
      const res = await fetch(`/api/matches/${matchId}/engagement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "comment",
          body: trimmed,
        }),
      });
      if (!res.ok) {
        setError(true);
        return;
      }
      onEngagementChange((await res.json()) as MatchEngagement);
      setBody("");
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  const comments = engagement?.comments ?? [];

  return (
    <div id="match-comments" className="border-t border-border px-4 py-3">
      <p className={sectionLabel}>Comments</p>

      {isSignedIn ? (
        <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={`Comment as ${displayName}…`}
            maxLength={500}
            aria-label="Add a comment"
            className={`${inputField} min-w-0 flex-1 text-sm`}
          />
          <button type="submit" disabled={!body.trim() || submitting} className={btnPrimarySm}>
            Post
          </button>
        </form>
      ) : (
        <p className="mt-2 text-sm text-muted">
          <Link
            href={signInHref}
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Sign in
          </Link>{" "}
          to join the conversation.
        </p>
      )}

      {error && (
        <p role="alert" className={`${alertError} mt-2 text-xs`}>
          Could not post comment. Try again.
        </p>
      )}

      <ul className="mt-3 space-y-3">
        {comments.length === 0 && (
          <li className="text-sm text-muted">No comments yet. Start the conversation.</li>
        )}
        {comments.map((comment) => (
          <li key={comment.id} className="border-t border-border/60 pt-3 first:border-0 first:pt-0">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">
                {comment.authorName}
                {comment.isOwn && <span className="ml-1 text-xs font-normal text-muted">(you)</span>}
              </p>
              <time className="shrink-0 text-xs text-muted" dateTime={comment.createdAt}>
                {formatCommentTime(comment.createdAt)}
              </time>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-foreground">{comment.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
