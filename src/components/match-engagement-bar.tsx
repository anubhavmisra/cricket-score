"use client";

import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { MatchState } from "@/lib/match/match-state";
import type { MatchEngagement } from "@/lib/match/engagement";
import {
  buildLiveShareText,
  buildMatchShareUrl,
  buildShareResultText,
  shareNative,
} from "@/lib/share/match-share";
import { getDisplayInitials } from "@/lib/auth/display-name";
import { MatchShareModal } from "./match-share-modal";
import { MatchCommentsSection } from "./match-comments-section";
import { focusRing, matchPanel } from "@/lib/ui/styles";

type MatchEngagementBarProps = {
  matchId: string;
  state: MatchState | null;
};

function LikeIcon({ filled }: { filled?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill={filled ? "currentColor" : "none"}>
      <path
        d="M6.633 10.25c.806 0 1.533-.278 2.1-.783 3.632-3.102 4.166-8.084 5.018-11.076a1.126 1.126 0 011.591-.225 1.126 1.126 0 01.225 1.591c-.912 1.303-1.505 3.842-2.778 6.064-.78 1.346-1.829 2.366-2.965 2.989A4.003 4.003 0 006.633 10.25zm0 0A4.003 4.003 0 003 14.25v1.5A1.75 1.75 0 004.75 17.5h6.5A1.75 1.75 0 0013 15.75v-1.5a4.003 4.003 0 00-3.367-3.973z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
      <path
        d="M7.5 8.25h9m-9 3H12m-8.25 9.75 2.25-.75A11.25 11.25 0 0112 21.75c5.385 0 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25 2.25 6.615 2.25 12c0 1.66.403 3.22 1.117 4.59l-.867 3.16z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RepostIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
      <path
        d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12.75 0c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3 3-3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
      <path
        d="M6 12 3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
  active,
  count,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  count?: number;
  disabled?: boolean;
}) {
  const displayLabel = count != null && count > 0 ? `${label} · ${count}` : label;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`${focusRing} flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-xs font-semibold disabled:opacity-50 ${
        active ? "text-primary" : "text-muted hover:text-foreground"
      }`}
    >
      {icon}
      <span className="truncate">{displayLabel}</span>
    </button>
  );
}

export function MatchEngagementBar({ matchId, state }: MatchEngagementBarProps) {
  const pathname = usePathname();
  const commentInputRef = useRef<HTMLInputElement>(null);
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  const [engagement, setEngagement] = useState<MatchEngagement | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [likePending, setLikePending] = useState(false);

  const displayName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "User";

  const signInHref = `/sign-in?redirect_url=${encodeURIComponent(pathname)}`;

  const fetchEngagement = async () => {
    const res = await fetch(`/api/matches/${matchId}/engagement`, {
      credentials: "include",
    });
    if (!res.ok) return;
    setEngagement((await res.json()) as MatchEngagement);
  };

  useEffect(() => {
    void fetchEngagement();
    const intervalId = setInterval(() => void fetchEngagement(), 8000);
    return () => clearInterval(intervalId);
  }, [matchId, isSignedIn]);

  async function handleLike() {
    if (likePending) return;
    setLikePending(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/engagement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "like" }),
      });
      if (res.ok) {
        setEngagement((await res.json()) as MatchEngagement);
      }
    } finally {
      setLikePending(false);
    }
  }

  async function handleSend() {
    if (!state) {
      setShareOpen(true);
      return;
    }

    const url = buildMatchShareUrl(matchId);
    const isCompleted = state.match.status === "completed";
    const text = isCompleted
      ? buildShareResultText(state, url)
      : buildLiveShareText(state, url);

    const outcome = await shareNative({
      title: `${state.match.teamAName} vs ${state.match.teamBName}`,
      text,
      url,
    });

    if (outcome === "unavailable" || outcome === "failed") {
      setShareOpen(true);
    }
  }

  function focusComments() {
    document.getElementById("match-comments")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    if (isSignedIn) {
      commentInputRef.current?.focus();
    }
  }

  const likeCount = engagement?.likeCount ?? 0;
  const commentCount = engagement?.commentCount ?? 0;
  const liked = engagement?.likedByUser ?? false;

  return (
    <>
      <section className={`${matchPanel} overflow-visible`} aria-label="Match engagement">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <div className="shrink-0">
            {isSignedIn && user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.imageUrl}
                alt=""
                className="size-8 rounded-full object-cover"
              />
            ) : (
              <span className="flex size-8 items-center justify-center rounded-full bg-[var(--surface-muted)] text-xs font-semibold text-muted">
                {isSignedIn ? getDisplayInitials(displayName) : "?"}
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-1 items-stretch divide-x divide-border">
            {isSignedIn ? (
              <ActionButton
                label="Like"
                icon={<LikeIcon filled={liked} />}
                onClick={handleLike}
                active={liked}
                count={likeCount}
                disabled={likePending}
              />
            ) : (
              <Link
                href={signInHref}
                className={`${focusRing} flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-xs font-semibold text-muted no-underline hover:text-foreground`}
              >
                <LikeIcon />
                <span className="truncate">{likeCount > 0 ? `Like · ${likeCount}` : "Like"}</span>
              </Link>
            )}
            <ActionButton
              label="Comment"
              icon={<CommentIcon />}
              onClick={focusComments}
              count={commentCount}
            />
            <ActionButton
              label="Repost"
              icon={<RepostIcon />}
              onClick={() => setShareOpen(true)}
            />
            <ActionButton label="Send" icon={<SendIcon />} onClick={() => void handleSend()} />
          </div>
        </div>

        <MatchCommentsSection
          matchId={matchId}
          displayName={displayName}
          isSignedIn={isSignedIn ?? false}
          engagement={engagement}
          onEngagementChange={setEngagement}
          inputRef={commentInputRef}
        />
      </section>

      <MatchShareModal
        matchId={matchId}
        state={state}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </>
  );
}
