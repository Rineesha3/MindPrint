"use client";

import { useEffect, useState } from "react";
import { fetchStats, StatsResponse } from "@/lib/api";
import { AXIS_LABELS, AXIS_NAMES_ORDERED, AxisName, LETTER_NAMES, PredictResponse } from "@/lib/types";

interface Props {
  predictedType: string;
  axes: PredictResponse["axes"];
}

// A ~5 percentage-point gap before we bother calling out a difference —
// smaller than that reads as noise rather than a real lean.
const DIFF_THRESHOLD = 0.05;

interface Line {
  axis: AxisName;
  text: string;
}

export default function YouVsTypical({ predictedType, axes }: Props) {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchStats()
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Still loading or the request errored — stay quiet rather than showing a
  // broken comparison card.
  if (failed || !stats) return null;

  const typeAverages = stats.axis_averages?.[predictedType];

  const lines: Line[] = typeAverages
    ? (AXIS_NAMES_ORDERED.map((axis) => {
        const typeAvg = typeAverages[axis];
        if (typeAvg === undefined || typeAvg === null) return null;

        const [leftLabel, rightLabel] = AXIS_LABELS[axis];
        const userProb = axes[axis]?.probabilities[rightLabel] ?? 0;
        const diff = userProb - typeAvg;
        const rightName = LETTER_NAMES[rightLabel];
        const leftName = LETTER_NAMES[leftLabel];

        if (Math.abs(diff) < DIFF_THRESHOLD) {
          return {
            axis,
            text: `Right in line with typical ${predictedType}s on ${leftName} vs. ${rightName}.`,
          };
        }
        const leaningName = diff > 0 ? rightName : leftName;
        return {
          axis,
          text: `You're more ${leaningName} than the typical ${predictedType}.`,
        };
      }).filter(Boolean) as Line[])
    : [];

  return (
    <div className="card rounded-2xl p-6">
      <h2 className="mb-1 text-lg font-semibold">You vs. typical {predictedType}</h2>
      {lines.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Not enough data yet for this comparison.
        </p>
      ) : (
        <>
          <p className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
            How you compare to other {predictedType}s on each dimension.
          </p>
          <ul className="space-y-2">
            {lines.map((l) => (
              <li
                key={l.axis}
                className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-300"
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-500" />
                <span>{l.text}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
