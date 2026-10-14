"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { fetchHistory, clearHistory, HistoryEntry } from "@/lib/history";
import { HistorySkeleton } from "@/components/Skeleton";
import {
  AxisName,
  AXIS_NAMES_ORDERED,
  AXIS_LABELS,
  AXIS_TOPICS,
  LETTER_MEANINGS,
  PLAIN_NAMES,
  TYPE_DESCRIPTIONS,
  TYPE_GROUPS,
  GROUP_COLORS,
} from "@/lib/types";

// Plain-language names for each dimension, matching the quiz's section labels.
const TEST_MODE_LABELS: Record<string, string> = {
  quiz: "Quick test",
  deepQuiz: "In-depth test",
  freeform: "Write freely",
};

function formatDate(takenAt: number) {
  return new Date(takenAt * 1000).toLocaleDateString(undefined, { dateStyle: "medium" });
}

function timeAgo(takenAt: number) {
  const seconds = Math.max(0, Date.now() / 1000 - takenAt);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return formatDate(takenAt);
}

// Which side of a dimension an entry leans to, and how strongly (50–100%).
function lean(entry: HistoryEntry, axis: AxisName) {
  const [left, right] = AXIS_LABELS[axis];
  const probs = entry.axes[axis]?.probabilities ?? {};
  const leftPct = Math.round((probs[left] ?? 0.5) * 100);
  const rightPct = 100 - leftPct;
  return leftPct >= rightPct
    ? { letter: left, pct: leftPct, leftPct }
    : { letter: right, pct: rightPct, leftPct };
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?next=/history");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    fetchHistory()
      .then(setEntries)
      .catch((err) => setError(err.message || "Something went wrong."));
  }, [user]);

  async function handleClear() {
    if (!window.confirm("Delete all your past results? This can't be undone.")) return;
    setClearing(true);
    try {
      await clearHistory();
      setEntries([]);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setClearing(false);
    }
  }

  if (authLoading || !user || (entries === null && !error)) {
    return <HistorySkeleton />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (entries!.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="mb-3 text-2xl font-bold">No results yet</h1>
        <p className="mb-6 text-neutral-500 dark:text-neutral-400">
          Take a test and your results will be saved here, so you can look back at them
          anytime and see how you change.
        </p>
        <Link
          href="/assessment"
          className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-400 px-6 py-3 font-semibold text-white hover:opacity-90"
        >
          Take a test
        </Link>
      </div>
    );
  }

  const list = entries!;
  const latest = list[0];
  const first = list[list.length - 1];

  const typeCounts: Record<string, number> = {};
  for (const e of list) typeCounts[e.predicted_type] = (typeCounts[e.predicted_type] || 0) + 1;
  const mostCommon = Object.keys(typeCounts).sort((a, b) => typeCounts[b] - typeCounts[a])[0];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your results</h1>
        </div>
        <Link
          href="/assessment"
          className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-400 px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Take another test
        </Link>
      </div>

      {/* Summary */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Link
          href={`/types/${latest.predicted_type.toLowerCase()}`}
          className="card flex items-center gap-4 rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/5"
        >
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
            <Image
              src={`/mbti/characters/${latest.predicted_type}.png`}
              alt={latest.predicted_type}
              fill
              sizes="56px"
              className="object-cover object-top"
            />
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Your current type</p>
            <p className="text-2xl font-bold text-brand-500">{latest.predicted_type}</p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">{TYPE_GROUPS[latest.predicted_type]}</p>
          </div>
        </Link>
        <div className="card rounded-2xl p-5">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Tests taken</p>
          <p className="text-2xl font-bold">{list.length}</p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            First on {formatDate(first.taken_at)}
          </p>
        </div>
        <div className="card rounded-2xl p-5">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">You get most often</p>
          <p className="text-2xl font-bold">{mostCommon}</p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            {typeCounts[mostCommon]} of {list.length} test{list.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {/* Where you stand today, compared to your first test */}
      <div className="card mb-8 rounded-2xl p-6">
        <h2 className="mb-5 text-lg font-semibold">Where you stand</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {AXIS_NAMES_ORDERED.map((axis) => {
            const now = lean(latest, axis);
            const then = lean(first, axis);
            let change: string | null = null;
            if (list.length > 1) {
              if (now.letter !== then.letter) {
                change = `Changed from ${PLAIN_NAMES[then.letter].toLowerCase()} since your first test`;
              } else if (Math.abs(now.pct - then.pct) >= 5) {
                change = now.pct > then.pct ? "Stronger than your first test" : "Milder than your first test";
              } else {
                change = "About the same as your first test";
              }
            }
            const strength = now.pct >= 75 ? "Strong" : now.pct >= 60 ? "Clear" : "Mild, close to the middle";
            return (
              <div key={axis} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {AXIS_TOPICS[axis]}
                </p>
                <p className="mt-1.5 text-xl font-bold">{PLAIN_NAMES[now.letter]}</p>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{LETTER_MEANINGS[now.letter]}</p>
                <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                  {strength} ({now.pct}%)
                  {change && <> · {change}</>}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* All results */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">All tests</h2>
        <button
          onClick={handleClear}
          disabled={clearing}
          className="text-sm text-neutral-400 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {clearing ? "Deleting..." : "Delete all"}
        </button>
      </div>
      <div className="space-y-3">
        {list.map((entry, i) => {
          const group = TYPE_GROUPS[entry.predicted_type];
          return (
            <Link
              key={entry.taken_at}
              href={`/result?t=${entry.taken_at}`}
              className="card flex items-center gap-4 rounded-2xl p-4 transition hover:ring-2 hover:ring-brand-500/40"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                <Image
                  src={`/mbti/characters/${entry.predicted_type}.png`}
                  alt={entry.predicted_type}
                  fill
                  sizes="48px"
                  className="object-cover object-top"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2">
                  <span className="text-lg font-bold">{entry.predicted_type}</span>
                  {group && (
                    <span
                      className={`rounded-full bg-gradient-to-r px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white ${
                        GROUP_COLORS[group] ?? "from-brand-400 to-brand-700"
                      }`}
                    >
                      {group}
                    </span>
                  )}
                </p>
                <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
                  {TYPE_DESCRIPTIONS[entry.predicted_type]}
                </p>
              </div>
              <div className="shrink-0 self-start text-right text-xs text-neutral-400 dark:text-neutral-500">
                <p>{timeAgo(entry.taken_at)}</p>
                {entry.test_mode && TEST_MODE_LABELS[entry.test_mode] && (
                  <p className="mt-0.5">{TEST_MODE_LABELS[entry.test_mode]}</p>
                )}
                {i === 0 && (
                  <span className="mt-1 inline-block rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">
                    Latest
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
