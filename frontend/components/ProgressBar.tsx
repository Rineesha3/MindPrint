interface Props {
  current: number; // 0-indexed
  total: number;
  dimension?: string;
}

export default function ProgressBar({ current, total, dimension }: Props) {
  const pct = Math.round(((current + 1) / total) * 100);

  return (
    <div className="glass-nav sticky top-16 z-40 -mx-4 mb-8 rounded-b-2xl px-4 pb-3 pt-3 sm:-mx-6 sm:px-6">
      <div className="mb-2 flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <span>
          Question {current + 1} of {total}
          {dimension ? ` · ${dimension}` : ""}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="flex h-2 w-full gap-1">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
          >
            <div
              className="h-2 rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-500"
              style={{ width: i <= current ? "100%" : "0%" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
