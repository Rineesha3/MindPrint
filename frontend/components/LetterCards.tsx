import {
  AXIS_LABELS,
  AXIS_NAMES_ORDERED,
  AXIS_TOPICS,
  LETTER_MEANINGS,
  LETTER_NAMES,
  PLAIN_NAMES,
  PredictResponse,
} from "@/lib/types";

const STRENGTH: Record<"low" | "medium" | "high", string> = {
  low: "Close to the middle: you show both sides",
  medium: "Clear preference",
  high: "Strong preference",
};

export default function LetterCards({ axes }: { axes: PredictResponse["axes"] }) {
  return (
    <div className="card rounded-2xl p-6">
      <h2 className="mb-1 text-lg font-semibold">What your four letters mean</h2>
      <p className="mb-5 text-sm text-neutral-500 dark:text-neutral-400">
        Each letter is one side of a pair. The dot shows where you landed between them.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {AXIS_NAMES_ORDERED.map((axis) => {
          const { predicted, probabilities, confidence } = axes[axis];
          const [left, right] = AXIS_LABELS[axis];
          const rightPct = Math.round((probabilities[right] ?? 0) * 100);
          const pickedPct = predicted === right ? rightPct : 100 - rightPct;

          return (
            <div key={axis} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {AXIS_TOPICS[axis]}
              </p>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-brand-500">{predicted}</span>
                <span className="text-lg font-semibold">
                  {PLAIN_NAMES[predicted]}
                  <span className="ml-1.5 text-sm font-normal text-neutral-400 dark:text-neutral-500">
                    ({LETTER_NAMES[predicted]})
                  </span>
                </span>
              </div>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{LETTER_MEANINGS[predicted]}</p>

              <div className="mt-4">
                <div className="relative h-2 rounded-full bg-neutral-200 dark:bg-neutral-800">
                  <div className="absolute left-1/2 top-1/2 h-3 w-px -translate-y-1/2 bg-neutral-400 dark:bg-neutral-600" />
                  <div
                    className="absolute -top-1 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white bg-brand-500 shadow dark:border-neutral-950"
                    style={{ left: `${rightPct}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                  <span className={predicted === left ? "font-semibold text-neutral-800 dark:text-neutral-100" : ""}>
                    {PLAIN_NAMES[left]}
                  </span>
                  <span className={predicted === right ? "font-semibold text-neutral-800 dark:text-neutral-100" : ""}>
                    {PLAIN_NAMES[right]}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                {STRENGTH[confidence]} · {pickedPct}% {PLAIN_NAMES[predicted].toLowerCase()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
