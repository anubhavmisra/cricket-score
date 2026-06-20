const VIEWER_ID_KEY = "cricket-viewer-id";
const VIEWER_NAME_KEY = "cricket-viewer-name";
const DEFAULT_VIEWER_NAME = "Spectator";

function randomId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getViewerId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(VIEWER_ID_KEY);
    if (!id) {
      id = randomId();
      localStorage.setItem(VIEWER_ID_KEY, id);
    }
    return id;
  } catch {
    return randomId();
  }
}

export function getViewerDisplayName(): string {
  if (typeof window === "undefined") return DEFAULT_VIEWER_NAME;
  try {
    return localStorage.getItem(VIEWER_NAME_KEY)?.trim() || DEFAULT_VIEWER_NAME;
  } catch {
    return DEFAULT_VIEWER_NAME;
  }
}

export function setViewerDisplayName(name: string): void {
  if (typeof window === "undefined") return;
  const trimmed = name.trim().slice(0, 40);
  try {
    localStorage.setItem(VIEWER_NAME_KEY, trimmed || DEFAULT_VIEWER_NAME);
  } catch {
    // localStorage may be unavailable.
  }
}

export function getViewerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "S";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}
