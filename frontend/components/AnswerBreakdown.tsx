import { AxisName, LETTER_NAMES } from "@/lib/types";
import { QuizAnswer } from "@/lib/questions";

interface Props {
  answers: QuizAnswer[];
  predictedLetters: Record<AxisName, string>;
}

const DIMENSION_BY_AXIS: Record<AxisName, string> = {
  IE: "Energy",
  NS: "Perception",
  TF: "Judgment",
  JP: "Orientation",
};

const AXES: AxisName[] = ["IE", "NS", "TF", "JP"];

// Grounds "why this result" in the user's actual quiz picks per axis, rather
// than only generic corpus-level writing-style signals (which the quiz path
// barely varies, since answers are picked from fixed text, not freely written).
export default function AnswerBreakdown({ answers, predictedLetters }: Props) {
  if (!answers || answers.length === 0) return null;

  return (
    <div className="card rounded-2xl p-6">
      <h2 className="mb-1 text-lg font-semibold">Your answers, by axis</h2>
      <p className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
        What you picked, grouped by dimension, compared to your final result.
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        {AXES.map((axis) => {
          const dimension = DIMENSION_BY_AXIS[axis];
          const dimAnswers = answers.filter((a) => a.dimension === dimension);
          if (dimAnswers.length === 0) return null;

          const counts: Record<string, number> = {};
          for (const a of dimAnswers) {
            if (a.pole) counts[a.pole] = (counts[a.pole] || 0) + 1;
          }
          const poles = Object.keys(counts);
          const topCount = Math.max(0, ...poles.map((p) => counts[p]));
          const topPoles = poles.filter((p) => counts[p] === topCount);
          const majorityPole = topCount > 0 && topPoles.length === 1 ? topPoles[0] : null;
          const predicted = predictedLetters[axis];
          const agrees = majorityPole === predicted;

          return (
            <div key={axis} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold">{dimension}</span>
                {majorityPole && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      agrees
                        ? "bg-brand-500/15 text-brand-600 dark:text-brand-300"
                        : "bg-amber-500/10 text-amber-500"
                    }`}
                  >
                    {agrees ? `Matches ${predicted}` : `Leaned ${majorityPole}, overall ${predicted}`}
                  </span>
                )}
              </div>
              <ul className="space-y-1.5">
                {dimAnswers.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-neutral-400 dark:bg-neutral-600" />
                    <span>
                      {a.label}
                      {a.pole && (
                        <span className="ml-1.5 text-xs text-neutral-400 dark:text-neutral-500">
                          ({LETTER_NAMES[a.pole] ?? a.pole})
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
