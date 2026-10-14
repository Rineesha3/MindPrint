"use client";

import { AxisName, AXIS_LABELS, AXIS_TITLES } from "@/lib/types";
import { useCountUp } from "@/lib/useCountUp";
import LeanBar from "@/components/LeanBar";

interface Props {
  axis: AxisName;
  probabilities: Record<string, number>;
  confidence: "low" | "medium" | "high";
}

export default function AxisBar({ axis, probabilities, confidence }: Props) {
  const [leftLabel, rightLabel] = AXIS_LABELS[axis];
  const leftProb = probabilities[leftLabel] ?? 0;
  const rightProb = probabilities[rightLabel] ?? 0;
  const rightPct = Math.round(rightProb * 100);

  // Left derived from right so the pair always sums to 100 (0.495/0.505 would
  // otherwise round to 50% / 51%).
  const animatedLeftPct = Math.round(useCountUp(100 - rightPct));
  const animatedRightPct = Math.round(useCountUp(rightPct));

  return (
    <div className="mb-5">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 text-sm text-neutral-600 dark:text-neutral-300">
        <span>
          {AXIS_TITLES[axis]}
          {confidence === "low" && (
            <span
              className="ml-2 whitespace-nowrap rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-500"
              title="You landed close to the middle here — you show traits of both sides."
            >
              Balanced
            </span>
          )}
        </span>
        <span className="whitespace-nowrap text-neutral-400 dark:text-neutral-500">
          {animatedLeftPct}% / {animatedRightPct}%
        </span>
      </div>
      <LeanBar left={leftLabel} right={rightLabel} rightPct={rightProb * 100} animate />
    </div>
  );
}
