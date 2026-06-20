"use client";

import { useEffect, useRef } from "react";

type MatchShareQrProps = {
  url: string;
};

export function MatchShareQr({ url }: MatchShareQrProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!url || !canvasRef.current) return;

    let cancelled = false;

    import("qrcode").then((QRCode) => {
      if (cancelled || !canvasRef.current) return;

      void QRCode.toCanvas(canvasRef.current, url, {
        width: 168,
        margin: 2,
        color: {
          dark: "#1a2e1c",
          light: "#ffffff",
        },
      });
    });

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!url) return null;

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface p-4">
      <canvas ref={canvasRef} role="img" aria-label="QR code for the live match link" />
      <p className="text-center text-xs text-muted">Scan to open the live score</p>
    </div>
  );
}
