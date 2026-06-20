"use client";

import { useEffect, useState } from "react";
import { btnPrimarySm, inputField, alertError } from "@/lib/ui/styles";

export function ShareLinkBar({ matchId }: { matchId: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}/m/${matchId}`);
  }, [matchId]);

  async function copyLink() {
    if (!url) return;
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-[var(--surface-muted)] p-2">
        <input
          type="text"
          readOnly
          value={url}
          aria-label="Share link"
          className={`${inputField} min-w-0 flex-1 truncate border-0 bg-transparent px-2 py-2 text-sm`}
        />
        <button
          type="button"
          onClick={copyLink}
          disabled={!url}
          className={btnPrimarySm}
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
      {copyError && (
        <p role="alert" className={`${alertError} mt-2 text-xs`}>
          Copy failed. Select the link manually.
        </p>
      )}
    </div>
  );
}
