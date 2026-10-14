import { WritingSignal } from "@/lib/types";

// Shows the model's own internal signals — the actual standardized features
// it fed into the CatBoost classifiers — as plain-language reasoning, after
// the prediction is made.
export default function WhyThisResult({ signals }: { signals: WritingSignal[] }) {
  if (!signals || signals.length === 0) return null;

  return (
    <div className="card rounded-2xl p-6">
      <h2 className="mb-1 text-lg font-semibold">Why this result</h2>
      <p className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
        What stood out most about the way you express yourself.
      </p>
      <ul className="space-y-3">
        {signals.map((s) => (
          <li key={s.feature} className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                s.direction === "above"
                  ? "bg-brand-500/15 text-brand-600 dark:text-brand-300"
                  : "bg-neutral-500/15 text-neutral-600 dark:text-neutral-300"
              }`}
            >
              {s.direction === "above" ? "↑" : "↓"}
            </span>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">{s.blurb}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
