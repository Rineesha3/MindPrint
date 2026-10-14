import { IdentityResult } from "@/lib/identity";

// Deliberately styled as visually distinct from AxisBar's rows (dashed
// border, muted badge, explicit "experimental" labeling) so it doesn't read
// as a 5th equally-valid model output alongside the four real trained axes.
export default function IdentityCard({ identity }: { identity: IdentityResult }) {
  return (
    <div className="card rounded-2xl border border-dashed border-neutral-300 p-6 dark:border-neutral-700">
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-lg font-semibold">Identity: {identity.label} ({identity.letter})</h2>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-300">{identity.blurb}</p>
    </div>
  );
}
