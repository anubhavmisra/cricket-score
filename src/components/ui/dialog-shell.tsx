"use client";

import { useCallback, useEffect, useRef } from "react";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type DialogShellProps = {
  open: boolean;
  onClose: () => void;
  dismissible?: boolean;
  labelledBy: string;
  describedBy?: string;
  children: React.ReactNode;
  panelClassName?: string;
  align?: "center" | "bottom";
};

export function DialogShell({
  open,
  onClose,
  dismissible = true,
  labelledBy,
  describedBy,
  children,
  panelClassName = "w-full max-w-sm rounded-2xl bg-surface p-5 shadow-xl",
  align = "center",
}: DialogShellProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Tab" || !panelRef.current) return;

    const focusables = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) {
        e.preventDefault();
        onClose();
        return;
      }
      trapFocus(e);
    };

    document.addEventListener("keydown", handleKeyDown);
    const focusTimer = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
    }, 0);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [open, dismissible, onClose, trapFocus]);

  if (!open) return null;

  const alignClass =
    align === "bottom" ? "items-end sm:items-center" : "items-end justify-center sm:items-center";

  return (
    <div
      className={`fixed inset-0 z-[var(--z-modal)] flex ${alignClass} bg-[var(--scrim)] p-4`}
      role="presentation"
      onClick={dismissible ? onClose : undefined}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        onClick={(e) => e.stopPropagation()}
        className={panelClassName}
      >
        {children}
      </div>
    </div>
  );
}
