"use client";

import { useEffect, useState } from "react";

export function ShareLinkBar({ matchId }: { matchId: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}/m/${matchId}`);
  }, [matchId]);

  async function copyLink() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable in some contexts.
    }
  }

  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-900">
      <input
        type="text"
        readOnly
        value={url}
        aria-label="Share link"
        className="min-w-0 flex-1 truncate rounded border-0 bg-transparent px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300"
      />
      <button
        type="button"
        onClick={copyLink}
        disabled={!url}
        className="shrink-0 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
