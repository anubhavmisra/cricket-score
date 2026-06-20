"use client";

import { useId } from "react";
import { DialogShell } from "@/components/ui/dialog-shell";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  dismissible?: boolean;
};

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  dismissible = true,
}: ModalProps) {
  const titleId = useId();
  const descId = useId();

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      dismissible={dismissible}
      labelledBy={titleId}
      describedBy={description ? descId : undefined}
    >
      <h2 id={titleId} className="mb-1 text-xl font-semibold text-foreground">
        {title}
      </h2>
      {description && (
        <p id={descId} className="mb-4 text-sm text-muted">
          {description}
        </p>
      )}
      {children}
    </DialogShell>
  );
}
