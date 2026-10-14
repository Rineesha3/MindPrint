"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QuestionRunner from "@/components/QuestionRunner";
import { analyzeText, predictType } from "@/lib/api";
import { pickQuizByAllocation, Question, toQuizAnswers } from "@/lib/questions";

const MIN_WORDS = 100;

// Free writing: the model reads the text and decides the type. If it's unsure
// about some letters, it asks a couple of follow-up questions on just those
// before showing the result.
export default function TextInputForm() {
  const [text, setText] = useState("");
  const [followUps, setFollowUps] = useState<Question[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const canSubmit = wordCount >= MIN_WORDS && !loading;

  async function finish(questions: Question[] = [], answers: Record<string, string> = {}) {
    const quizAnswers = toQuizAnswers(questions, answers);
    setLoading(true);
    setError(null);
    try {
      const result = await predictType(
        text,
        "freeform",
        quizAnswers.length ? quizAnswers.map((a) => ({ dimension: a.dimension, pole: a.pole })) : undefined
      );
      sessionStorage.setItem("mbti_result", JSON.stringify(result));
      if (quizAnswers.length) sessionStorage.setItem("mbti_quiz_answers", JSON.stringify(quizAnswers));
      else sessionStorage.removeItem("mbti_quiz_answers");
      router.push("/result");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    let questions: Question[] = [];
    try {
      const plan = await analyzeText(text);
      questions = pickQuizByAllocation(plan.follow_ups);
    } catch {
      // Couldn't plan follow-ups — just go straight to the result.
    }
    if (questions.length) {
      setFollowUps(questions);
      setLoading(false);
    } else {
      await finish();
    }
  }

  if (followUps) {
    return (
      <div>
        <p className="mb-4 rounded-xl bg-brand-500/10 p-3 text-sm text-brand-700 dark:text-brand-300">
          Thanks! A few quick questions to sharpen your result.
        </p>
        <QuestionRunner
          questions={followUps}
          submitLabel="See my results"
          submitting={loading}
          error={error}
          onComplete={(answers) => finish(followUps, answers)}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        className="h-56 w-full rounded-xl border border-neutral-300 bg-white p-4 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
        placeholder="Write about yourself here — a journal entry, a few social media posts, or your answer to: 'Describe your ideal weekend and how you handle conflict with people close to you.' Aim for at least 100 words."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="mt-2 flex items-center justify-between text-sm">
        <span
          className={wordCount < MIN_WORDS ? "text-amber-500" : "text-neutral-400 dark:text-neutral-500"}
        >
          {wordCount} / {MIN_WORDS} words minimum
        </span>
        {error && <span className="text-red-500">{error}</span>}
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-4 w-full rounded-xl bg-gradient-to-r from-brand-600 to-brand-400 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:opacity-90"
      >
        {loading ? "Analyzing..." : "Analyze my writing"}
      </button>

      <p className="mt-3 text-center text-xs text-neutral-400 dark:text-neutral-500">
        Avoid including sensitive personal information.
      </p>
    </form>
  );
}
