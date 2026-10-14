import { Question, DIMENSION_DESCRIPTIONS } from "@/lib/questions";

interface Props {
  question: Question;
  value: string | undefined; // selected option id ("a" | "b")
  onChange: (optionId: string) => void;
}

export default function QuestionStep({ question, value, onChange }: Props) {
  return (
    <div className="card animate-fade-up rounded-2xl p-6">
      <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-brand-500">
        {question.dimension}
      </p>
      <p className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
        {DIMENSION_DESCRIPTIONS[question.dimension]}
      </p>

      <h2 className="mb-5 text-xl font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
        {question.prompt}
      </h2>

      <div className="grid gap-3 sm:grid-cols-3">
        {question.options.map((option) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={selected}
              className={`rounded-xl border p-4 text-left text-sm font-medium transition ${
                selected
                  ? "border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-200"
                  : "border-neutral-300 bg-white text-neutral-700 hover:border-brand-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-brand-500"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-neutral-400 dark:text-neutral-500">
        Pick whichever one is closer to you — there's no wrong answer.
      </p>
    </div>
  );
}
