/** Shared UI class strings aligned with globals.css tokens. */

const transition =
  "transition-[color,background-color,opacity,transform] duration-150 ease-[var(--ease-out)] motion-reduce:transition-none";

export const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]";

export const btnPrimary = `${focusRing} ${transition} rounded-xl bg-primary px-6 py-4 text-lg font-semibold text-primary-foreground hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] disabled:cursor-not-allowed disabled:opacity-60 motion-safe:active:scale-[0.98] motion-reduce:active:scale-100`;

export const btnPrimarySm = `${focusRing} ${transition} shrink-0 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] disabled:cursor-not-allowed disabled:opacity-60 min-h-11`;

export const btnSecondary = `${focusRing} ${transition} rounded-xl border border-border bg-surface px-4 py-3 font-medium text-foreground hover:bg-[var(--surface-muted)] active:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-60 min-h-12`;

export const btnDanger = `${focusRing} ${transition} rounded-xl bg-danger px-4 py-3 font-semibold text-white hover:bg-[var(--danger-hover)] active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 min-h-12`;

export const btnToggle = (selected: boolean) =>
  `${focusRing} ${transition} min-h-12 rounded-xl px-3 py-3 text-sm font-semibold ${
    selected
      ? "bg-danger text-white"
      : "border border-border bg-surface text-foreground hover:bg-[var(--surface-muted)]"
  }`;

export const btnBall = `${focusRing} ${transition} min-h-[48px] rounded-xl border border-border bg-surface px-2 py-3 text-lg font-bold text-foreground hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.98] motion-reduce:active:scale-100`;

export const btnBallExtra = `${focusRing} ${transition} min-h-[48px] rounded-xl border border-[var(--info-border)] bg-[var(--info-bg)] px-2 py-3 text-lg font-bold text-[var(--info-text)] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.98] motion-reduce:active:scale-100`;

export const btnBallUndo = `${focusRing} ${transition} min-h-[48px] rounded-xl border border-[var(--warning-border)] bg-[var(--warning-bg)] px-2 py-3 text-lg font-bold text-[var(--warning-text)] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.98] motion-reduce:active:scale-100`;

export const inputField = `${focusRing} ${transition} rounded-lg border border-border bg-surface px-3 py-2.5 text-base text-foreground placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-60`;

export const inputFieldSm = `${focusRing} ${transition} rounded-lg border border-border bg-surface px-2 py-2 text-sm text-foreground placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-60`;

export const labelText = "text-sm font-medium text-muted";

export const sectionTitle = "text-base font-semibold text-foreground";

export const sectionLabel = "text-sm font-medium text-muted";

export const alertError =
  "rounded-lg border border-[var(--error-border)] bg-[var(--error-bg)] px-3 py-2 text-sm text-[var(--error-text)]";

export const alertWarning =
  "rounded-lg border border-[var(--warning-border)] bg-[var(--warning-bg)] px-3 py-2 text-center text-sm font-medium text-[var(--warning-text)]";

export const pageShell =
  "mx-auto max-w-lg px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.5rem,env(safe-area-inset-top))]";

export const pageTitle = "text-2xl font-bold text-balance text-foreground";

export const backLink = `${focusRing} text-sm font-medium text-muted hover:text-foreground`;
