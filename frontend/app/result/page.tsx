"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TypeCard from "@/components/TypeCard";
import LetterCards from "@/components/LetterCards";
import StrengthsCard from "@/components/StrengthsCard";
import Confetti from "@/components/Confetti";
import PersonalityPassport from "@/components/PersonalityPassport";
import { ResultSkeleton } from "@/components/Skeleton";
import { GROUP_HEX } from "@/components/ThemeAccent";
import { PredictResponse, TYPE_GROUPS } from "@/lib/types";
import { computeIdentity } from "@/lib/identity";
import { fetchHistory } from "@/lib/history";

export default function ResultPage() {
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [pastTakenAt, setPastTakenAt] = useState<number | null>(null);

  useEffect(() => {
    // Opened from the history page (/result?t=<taken_at>) — load that saved
    // result from the account instead of the just-finished session result.
    const takenAt = new URLSearchParams(window.location.search).get("t");
    if (takenAt) {
      fetchHistory()
        .then((entries) => {
          const entry = entries.find((e) => String(e.taken_at) === takenAt);
          if (entry) {
            setResult(entry);
            setPastTakenAt(entry.taken_at);
          } else {
            setNotFound(true);
          }
        })
        .catch(() => setNotFound(true));
      return;
    }

    const stored = sessionStorage.getItem("mbti_result");
    if (stored) {
      try {
        setResult(JSON.parse(stored));
        setShowConfetti(true);
      } catch {
        setNotFound(true);
        return;
      }
    } else {
      setNotFound(true);
    }
  }, []);

  if (notFound) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="mb-4 text-neutral-500 dark:text-neutral-300">
          No result found — take the assessment first.
        </p>
        <Link href="/assessment" className="font-medium text-brand-500 underline">
          Start the assessment
        </Link>
      </div>
    );
  }

  if (!result) {
    return <ResultSkeleton />;
  }

  // Experimental Assertive/Turbulent heuristic, only used on the downloadable
  // passport — see lib/identity.ts for why it isn't shown as a real result.
  const identity = computeIdentity(result.axes);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {showConfetti && <Confetti />}
      {pastTakenAt && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <Link href="/history" className="font-medium text-brand-500 hover:underline">
            ← Back to history
          </Link>
          <span>
            Result from{" "}
            {new Date(pastTakenAt * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
          </span>
        </div>
      )}
      <div
        className="mb-4 h-1 w-full rounded-full"
        // From the result shown, not --accent-type-color: that variable is set
        // once on first app load, so it's stale/unset after client navigation.
        style={{ backgroundColor: GROUP_HEX[TYPE_GROUPS[result.predicted_type]] ?? "transparent" }}
      />
      <TypeCard type={result.predicted_type} />

      {result.warning && (
        <p className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-300">
          {result.warning}
        </p>
      )}

      <LetterCards axes={result.axes} />

      <div className="mt-6">
        <StrengthsCard type={result.predicted_type} />
      </div>

      <div className="mt-8 flex justify-center">
        <PersonalityPassport result={result} identity={identity} />
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href="/assessment"
          className="rounded-xl border border-neutral-300 px-5 py-2 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          Take it again
        </Link>
        <Link
          href="/history"
          className="rounded-xl border border-neutral-300 px-5 py-2 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          View history
        </Link>
      </div>
    </div>
  );
}
