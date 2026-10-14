"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "@/components/ProgressBar";
import QuestionRunner from "@/components/QuestionRunner";
import TextInputForm from "@/components/TextInputForm";
import {
  DIMENSION_POOL_SIZES,
  pickQuiz,
  pickQuizByAllocation,
  Question,
  QUESTIONS_PER_QUIZ,
  toQuizAnswers,
} from "@/lib/questions";
import { analyzeText, predictType } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { AssessmentSkeleton } from "@/components/Skeleton";
import { useLeaveGuard } from "@/lib/useLeaveGuard";
import LeaveDialog from "@/components/LeaveDialog";

// The question pool has ~12-13 questions per dimension (50 total), so 40
// (10 per dimension) gives the deep quiz meaningfully more signal than the
// quick quiz's 10 total, while staying comfortably within every dimension's
// available pool.
const DEEP_QUIZ_COUNT = 40;

// Minimum length of the write-in that opens both quizzes.
const MIN_WRITE_WORDS = 25;

type Mode = "quiz" | "deepQuiz" | "freeform";

export default function AssessmentPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?next=/assessment");
    }
  }, [authLoading, user, router]);

  // Three ways to take the test: a quick quiz, a longer "deep" quiz (both end
  // with a short write-in the model reads), or free writing only.
  // Starts unselected so the visitor picks a test before anything begins.
  const [mode, setMode] = useState<Mode | null>(null);
  const leave = useLeaveGuard(mode !== null);

  if (authLoading || !user) {
    return <AssessmentSkeleton />;
  }

  if (!mode) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Choose your test</h1>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">
            Pick the option that suits you best. You can always come back and try another.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {MODE_OPTIONS.map((o) => (
            <button
              key={o.mode}
              onClick={() => setMode(o.mode)}
              className="card group relative flex h-full flex-col rounded-2xl p-6 text-left transition hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-500/10 focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              {o.badge && (
                <span className="absolute right-4 top-4 rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-600 dark:text-brand-300">
                  {o.badge}
                </span>
              )}
              <p className="mb-1 text-lg font-semibold">{o.title}</p>
              <p className="mb-4 text-xs font-medium uppercase tracking-wide text-brand-500">{o.meta}</p>
              <p className="mb-6 flex-1 text-sm text-neutral-500 dark:text-neutral-400">{o.desc}</p>
              <span className="text-sm font-semibold text-neutral-700 transition group-hover:text-brand-500 dark:text-neutral-200">
                Start →
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const selected = MODE_OPTIONS.find((o) => o.mode === mode)!;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => leave.request(() => setMode(null))}
          className="text-sm font-medium text-brand-500 hover:underline"
        >
          ← Change test
        </button>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          {selected.title} · {selected.meta}
        </span>
      </div>

      {mode === "freeform" ? (
        <TextInputForm />
      ) : (
        <QuizFlow key={mode} mode={mode} count={mode === "deepQuiz" ? DEEP_QUIZ_COUNT : QUESTIONS_PER_QUIZ} />
      )}

      <LeaveDialog open={leave.open} onConfirm={leave.confirm} onCancel={leave.cancel} />
    </div>
  );
}

const MODE_OPTIONS: { mode: Mode; title: string; meta: string; desc: string; badge?: string }[] = [
  {
    mode: "quiz",
    title: "Quick test",
    meta: `${QUESTIONS_PER_QUIZ} questions · ~2 min`,
    desc: "Write a few sentences about yourself, then answer quick questions tailored to you. Perfect for a first look at your type.",
    badge: "Most popular",
  },
  {
    mode: "deepQuiz",
    title: "In-depth test",
    meta: `${DEEP_QUIZ_COUNT} questions · ~8 min`,
    desc: "Start with a few sentences about you, then more tailored questions for a detailed, accurate picture of who you are.",
  },
  {
    mode: "freeform",
    title: "Write freely",
    meta: "100+ words · ~5 min",
    desc: "Write about yourself in your own words — your type is revealed from how you express yourself, with a few follow-up questions if needed.",
  },
];

// The quiz flow shared by "Quick test" and "In-depth test" (only the number of
// questions differs). Adaptive: the person writes a few sentences first, the
// model reads them and decides how to split the questions across dimensions —
// more questions where it's unsure — then answers + the model's reading are
// combined into the result. Keyed on `mode` by the parent, so switching tests
// starts fresh.
function QuizFlow({ mode, count }: { mode: "quiz" | "deepQuiz"; count: number }) {
  const router = useRouter();
  const [writing, setWriting] = useState("");
  const [quiz, setQuiz] = useState<Question[] | null>(null);
  const [planning, setPlanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const writingWords = writing.trim() ? writing.trim().split(/\s+/).length : 0;
  const totalSteps = count + 1;

  async function startQuestions() {
    if (writingWords < MIN_WRITE_WORDS || planning) return;
    setPlanning(true);
    setError(null);
    try {
      const plan = await analyzeText(writing.trim(), count, DIMENSION_POOL_SIZES);
      setQuiz(pickQuizByAllocation(plan.allocation));
    } catch {
      // Model unavailable — fall back to an evenly balanced quiz.
      setQuiz(pickQuiz(count));
    } finally {
      setPlanning(false);
    }
  }

  async function submit(answers: Record<string, string>) {
    if (!quiz) return;
    const quizAnswers = toQuizAnswers(quiz, answers);
    setSubmitting(true);
    setError(null);
    try {
      const result = await predictType(
        writing.trim(),
        mode,
        quizAnswers.map((a) => ({ dimension: a.dimension, pole: a.pole }))
      );
      sessionStorage.setItem("mbti_result", JSON.stringify(result));
      sessionStorage.setItem("mbti_quiz_answers", JSON.stringify(quizAnswers));
      router.push("/result");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (quiz) {
    return (
      <QuestionRunner
        questions={quiz}
        stepOffset={1}
        totalSteps={totalSteps}
        submitLabel="See my results"
        submitting={submitting}
        error={error}
        onComplete={submit}
      />
    );
  }

  return (
    <>
      <ProgressBar current={0} total={totalSteps} dimension="About you" />
      <h2 className="mb-2 text-xl font-semibold sm:text-2xl">First, tell us a bit about yourself</h2>
      <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
        In a few sentences, describe your perfect weekend and how you usually handle a
        disagreement with someone close to you. Just write naturally — we&apos;ll tailor
        the questions to you.
      </p>
      <textarea
        value={writing}
        onChange={(e) => setWriting(e.target.value)}
        maxLength={3000}
        autoFocus
        placeholder="My perfect weekend would be..."
        className="h-40 w-full rounded-xl border border-neutral-300 bg-white p-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />
      <p
        className={`mt-1 text-xs ${
          writingWords >= MIN_WRITE_WORDS ? "text-emerald-500" : "text-neutral-400 dark:text-neutral-500"
        }`}
      >
        {writingWords} / {MIN_WRITE_WORDS} words minimum
      </p>
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      <div className="mt-6 flex justify-end">
        <button
          onClick={startQuestions}
          disabled={writingWords < MIN_WRITE_WORDS || planning}
          className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-400 px-6 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:opacity-90"
        >
          {planning ? "Preparing your questions..." : "Next"}
        </button>
      </div>
    </>
  );
}
