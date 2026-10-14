import { AxisName, AXIS_NAMES_ORDERED, PredictResponse } from "./types";

export interface IdentityResult {
  letter: "A" | "T";
  label: string;
  confidence: "low" | "medium" | "high";
  blurb: string;
}

// IMPORTANT: this is NOT a trained model output like the four real axes.
// There is no Assertive/Turbulent classifier anywhere in this pipeline — this
// is a heuristic stand-in computed purely client-side from how decisively the
// four real axes already leaned, as a rough proxy for "how settled vs.
// self-questioning did your answers seem overall". Treat it as an
// experimental estimate, not a fifth measured trait.
//
// For each axis we take the winning probability's distance from the 0.5
// decision boundary (0 = exact toss-up, 0.5 = maximally decisive), then
// average that margin across all 4 axes. MARGIN_MIDPOINT = 0.15 is a
// hardcoded, reasoned-but-arbitrary cutoff: on this short-text classifier,
// axis probabilities in practice tend to cluster within roughly +/-0.25 of
// 0.5 rather than spreading to the extremes, so 0.15 sits at a sensible
// "barely decided" vs. "clearly decided" split for that observed range
// rather than the theoretical midpoint of 0.25. It is not derived from any
// ground-truth Assertive/Turbulent labels, because none exist in this
// dataset.
const MARGIN_MIDPOINT = 0.15;

export function computeIdentity(axes: PredictResponse["axes"]): IdentityResult {
  const margins = AXIS_NAMES_ORDERED.map((axis: AxisName) => {
    const probs = Object.values(axes[axis]?.probabilities ?? {});
    const winProb = probs.length > 0 ? Math.max(...probs) : 0.5;
    return Math.abs(winProb - 0.5);
  });

  const avgMargin = margins.reduce((sum, m) => sum + m, 0) / (margins.length || 1);
  const letter: "A" | "T" = avgMargin >= MARGIN_MIDPOINT ? "A" : "T";
  const label = letter === "A" ? "Assertive" : "Turbulent";

  // How far the average margin sits from the midpoint drives our confidence
  // in this heuristic's own call, not confidence in a real trait.
  const distance = Math.abs(avgMargin - MARGIN_MIDPOINT);
  const confidence: "low" | "medium" | "high" =
    distance > 0.12 ? "high" : distance > 0.05 ? "medium" : "low";

  const blurb =
    letter === "A"
      ? "Your answers leaned fairly firmly toward one side on most dimensions, which points to Assertive (-A): self-assured, even-tempered, and less likely to second-guess yourself."
      : "Several of your dimensions landed closer to the middle, which points to Turbulent (-T): sensitive to nuance, self-reflective, and driven to keep improving.";

  return { letter, label, confidence, blurb };
}
