"use client";

import { useCountUp } from "@/lib/useCountUp";

interface Props {
  left: string; // letter shown at the left end
  right: string; // letter shown at the right end
  rightPct: number; // 0–100: how far toward the right letter
  animate?: boolean;
}

// A two-sided bar that fills from the middle toward the side the person leans
// to, with a dot marking their position — so "69% Introversion" visibly leans
// toward I instead of reading as a short bar near E.
export default function LeanBar({ left, right, rightPct, animate = false }: Props) {
  const animatedOffset = useCountUp(rightPct - 50, animate ? 800 : 0);
  const pos = 50 + animatedOffset;
  const fillLeft = Math.min(pos, 50);
  const fillWidth = Math.abs(pos - 50);
  const leansRight = rightPct >= 50;

  return (
    <div className="flex items-center gap-2 text-xs font-semibold">
      <span className={`w-5 text-center ${leansRight ? "text-neutral-400 dark:text-neutral-500" : ""}`}>{left}</span>
      <div className="relative h-2 flex-1 rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div className="absolute left-1/2 top-1/2 h-3 w-px -translate-y-1/2 bg-neutral-400 dark:bg-neutral-600" />
        <div
          className="absolute top-0 h-2 rounded-full bg-gradient-to-r from-brand-600 to-brand-400"
          style={{ left: `${fillLeft}%`, width: `${fillWidth}%` }}
        />
        <div
          className="absolute -top-1 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white bg-brand-500 shadow dark:border-neutral-950"
          style={{ left: `${pos}%` }}
        />
      </div>
      <span className={`w-5 text-center ${leansRight ? "" : "text-neutral-400 dark:text-neutral-500"}`}>{right}</span>
    </div>
  );
}
