"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { MatchState } from "@/lib/match/match-state";
import { MatchShareModal } from "./match-share-modal";
import { focusRing } from "@/lib/ui/styles";

type MatchCardMenuProps = {
  matchId: string;
  state: MatchState | null;
};

function MoreIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-5">
      <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 14a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
    </svg>
  );
}

export function MatchCardMenu({ matchId, state }: MatchCardMenuProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);

  const isCompleted = state?.match.status === "completed";
  const shareLabel = isCompleted ? "Share result" : "Share match";

  function updateMenuPosition() {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
  }

  function toggleMenu() {
    setMenuOpen((open) => {
      if (!open) updateMenuPosition();
      return !open;
    });
  }

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    function handleLayoutChange() {
      updateMenuPosition();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleLayoutChange);
    window.addEventListener("scroll", handleLayoutChange, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleLayoutChange);
      window.removeEventListener("scroll", handleLayoutChange, true);
    };
  }, [menuOpen]);

  function openShare() {
    setMenuOpen(false);
    setShareOpen(true);
  }

  return (
    <>
      <div ref={rootRef} className="relative shrink-0">
        <button
          ref={buttonRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label="Match options"
          onClick={toggleMenu}
          className={`${focusRing} -mr-1 flex size-10 items-center justify-center rounded-lg text-muted hover:bg-[var(--surface-muted)] hover:text-foreground`}
        >
          <MoreIcon />
        </button>

        {menuOpen && menuPosition && (
          <div
            id={menuId}
            role="menu"
            style={{ top: menuPosition.top, right: menuPosition.right }}
            className="fixed z-[var(--z-dropdown)] min-w-[11rem] overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              onClick={openShare}
              className={`${focusRing} block w-full px-4 py-2.5 text-left text-sm font-medium text-foreground hover:bg-[var(--surface-muted)]`}
            >
              {shareLabel}
            </button>
          </div>
        )}
      </div>

      <MatchShareModal
        matchId={matchId}
        state={state}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </>
  );
}
