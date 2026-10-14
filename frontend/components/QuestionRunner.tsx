"use client";

import { useEffect, useState } from "react";
import ProgressBar from "@/components/ProgressBar";
import QuestionStep from "@/components/QuestionStep";
import { Question } from "@/lib/questions";

interface Props {
  questions: Question[];
  // Steps already completed before these questions (e.g. the write-in), so the
  // progress bar reflects the whole test.
  stepOffset?: number;
  totalSteps?: number;
  submitLabel: string;
  submitting: boolean;
  error: string | null;
  onComplete: (answers: Record<string, string>) => void;
}

// Steps through a list of multiple-choice questions one at a time, with
// keyboard shortcuts (1/2/3 to pick, Enter to continue, ← to go back).
// Shared by the quizzes and the follow-up questions after free writing.
export default function QuestionRunner({
  questions,
  stepOffset = 0,
  totalSteps,
  submitLabel,
  submitting,
  error,
  onComplete,
}: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const question = questions[step];
  const isLast = step === questions.length - 1;
  const selected = answers[question.id];

  function select(optionId: string) {
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
  }

  function next() {
    if (!selected || submitting) return;
    if (isLast) onComplete(answers);
    else setStep((s) => s + 1);
  }

  function back() {
    if (step > 0 && !submitting) setStep((s) => s - 1);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      const optionIndex = ["1", "2", "3"].indexOf(e.key);
      if (optionIndex !== -1 && question.options[optionIndex]) {
        select(question.options[optionIndex].id);
        return;
      }
      if (e.key === "Enter") {
        // Without this the browser also "clicks" the focused button after the
        // step changes — answering the next question or skipping one.
        e.preventDefault();
        next();
      } else if (e.key === "Backspace" || e.key === "ArrowLeft") back();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <>
      <ProgressBar
        current={stepOffset + step}
        total={totalSteps ?? stepOffset + questions.length}
        dimension={question.dimension}
      />

      <QuestionStep question={question} value={selected} onChange={select} />

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={back}
          disabled={step === 0 || submitting}
          className="rounded-xl border border-neutral-300 px-5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-30 enabled:hover:bg-neutral-100 dark:border-neutral-700 dark:enabled:hover:bg-neutral-800"
        >
          Back
        </button>
        <button
          onClick={next}
          disabled={!selected || submitting}
          className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-400 px-6 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:opacity-90"
        >
          {submitting ? "Analyzing..." : isLast ? submitLabel : "Next"}
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-neutral-300 dark:text-neutral-600">
        Tip: press 1/2/3 to pick an option, Enter to continue.
      </p>
    </>
  );
}
