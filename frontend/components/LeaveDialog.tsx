"use client";

import { useEffect, useRef } from "react";
import { LEAVE_MESSAGE } from "@/lib/useLeaveGuard";

type Props = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// In-app replacement for window.confirm when leaving a test in progress.
export default function LeaveDialog({ open, onConfirm, onCancel }: Props) {
  const stayRef = useRef<HTMLButtonElement>(null);

  // Focus the safe choice, and let Escape dismiss. Capture phase + stopping
  // propagation keeps the quiz's own keyboard shortcuts (Enter, 1/2/3,
  // Backspace) from firing underneath the dialog.
  useEffect(() => {
    if (!open) return;
    stayRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="leave-dialog-title"
        aria-describedby="leave-dialog-desc"
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-md rounded-2xl p-6 shadow-2xl"
      >
        <h2 id="leave-dialog-title" className="mb-2 text-lg font-semibold">
          Leave this test?
        </h2>
        <p id="leave-dialog-desc" className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
          {LEAVE_MESSAGE}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onConfirm}
            className="rounded-xl border border-neutral-300 px-5 py-2 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Leave
          </button>
          <button
            ref={stayRef}
            onClick={onCancel}
            className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-400 px-6 py-2 text-sm font-semibold text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
          >
            Stay on test
          </button>
        </div>
      </div>
    </div>
  );
}
