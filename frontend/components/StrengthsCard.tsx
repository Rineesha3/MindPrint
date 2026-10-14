import { TYPE_PROFILES } from "@/lib/typeProfiles";

export default function StrengthsCard({ type }: { type: string }) {
  const profile = TYPE_PROFILES[type];
  if (!profile) return null;

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="card rounded-2xl p-6">
        <h2 className="mb-3 text-lg font-semibold">What you're good at</h2>
        <ul className="space-y-2">
          {profile.strengths.slice(0, 4).map((s) => (
            <li key={s} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-300">
              <span className="mt-0.5 font-bold text-emerald-500">✓</span>
              {s}
            </li>
          ))}
        </ul>
      </div>
      <div className="card rounded-2xl p-6">
        <h2 className="mb-3 text-lg font-semibold">What to watch out for</h2>
        <ul className="space-y-2">
          {profile.weaknesses.slice(0, 4).map((w) => (
            <li key={w} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-300">
              <span className="mt-0.5 font-bold text-amber-500">!</span>
              {w}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
