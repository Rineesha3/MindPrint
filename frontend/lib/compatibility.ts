import { AxisName } from "./types";

const AXES: AxisName[] = ["IE", "NS", "TF", "JP"];

const AXIS_BLURBS: Record<AxisName, { both: Record<string, string>; mixed: string }> = {
  IE: {
    both: {
      E: "Both of you recharge around people and think out loud — expect an energetic dynamic, but make sure you're not just talking over each other.",
      I: "Both of you recharge alone. Plenty of mutual understanding for needing space, but you may have to consciously plan time together.",
    },
    mixed:
      "One of you recharges around people, the other alone. Respect each other's different social batteries instead of reading it as rejection or clinginess.",
  },
  NS: {
    both: {
      N: "Both of you think in patterns and possibilities — great for big-picture alignment, but watch for both missing the same practical details.",
      S: "Both of you focus on concrete facts and present reality — grounded and practical together, though may need to consciously make room for big ideas.",
    },
    mixed:
      "One of you thinks in abstract patterns, the other in concrete specifics. A strong complementary pair for planning, if you translate rather than dismiss each other's view.",
  },
  TF: {
    both: {
      T: "Both of you lead with logic in decisions — efficient and direct, but check in on the emotional layer that pure logic can skip past.",
      F: "Both of you lead with values and people-impact — a warm, empathetic pairing, though decisions can get harder when logic alone would resolve it faster.",
    },
    mixed:
      "One of you decides with logic, the other with values. This is a classic friction point — what reads as 'cold' to one can read as 'necessary' to the other. Worth naming explicitly.",
  },
  JP: {
    both: {
      J: "Both of you like plans and closure — you'll agree on structure, but may over-schedule life together and resist last-minute change.",
      P: "Both of you keep things open and flexible — spontaneous and easygoing together, though logistics can slip through the cracks.",
    },
    mixed:
      "One of you wants a plan, the other wants to keep options open. Common source of everyday friction (deadlines, plans, tidiness) — and a genuine opportunity to balance each other out.",
  },
};

const TIERS = [
  {
    min: 4,
    label: "Nearly identical",
    blurb: "You'll likely just 'get' each other fast — the risk is shared blind spots reinforcing each other rather than balancing out.",
  },
  {
    min: 3,
    label: "Very compatible",
    blurb: "Deep common ground with one axis of healthy contrast — usually an easy, low-friction pairing.",
  },
  {
    min: 2,
    label: "Balanced pairing",
    blurb: "Real common ground and real differences in roughly equal measure — works well with a bit of mutual translation.",
  },
  {
    min: 1,
    label: "Complementary opposites",
    blurb: "You cover each other's blind spots more than you share instincts — high potential, but it takes real effort to translate between styles.",
  },
  {
    min: 0,
    label: "Polar opposites",
    blurb: "Almost nothing is assumed the same way. The most growth-oriented pairing on paper, and also the most work.",
  },
];

export interface AxisComparison {
  axis: AxisName;
  shared: boolean;
  letterA: string;
  letterB: string;
  blurb: string;
}

export interface CompatibilityResult {
  sharedCount: number;
  tierLabel: string;
  tierBlurb: string;
  axes: AxisComparison[];
}

export function getCompatibility(typeA: string, typeB: string): CompatibilityResult {
  const codeA = typeA.toUpperCase();
  const codeB = typeB.toUpperCase();

  const axes: AxisComparison[] = AXES.map((axis, i) => {
    const letterA = codeA[i];
    const letterB = codeB[i];
    const shared = letterA === letterB;
    const blurb = shared ? AXIS_BLURBS[axis].both[letterA] : AXIS_BLURBS[axis].mixed;
    return { axis, shared, letterA, letterB, blurb };
  });

  const sharedCount = axes.filter((a) => a.shared).length;
  const tier = TIERS.find((t) => sharedCount >= t.min)!;

  return { sharedCount, tierLabel: tier.label, tierBlurb: tier.blurb, axes };
}

// ---------------------------------------------------------------------------
// Relationship modes
// ---------------------------------------------------------------------------

export type RelationshipMode = "romantic" | "friendship" | "work" | "leadership";

export const RELATIONSHIP_MODES: RelationshipMode[] = ["romantic", "friendship", "work", "leadership"];

export const MODE_LABELS: Record<RelationshipMode, string> = {
  romantic: "Romantic",
  friendship: "Friendship",
  work: "Work",
  leadership: "Leadership",
};

// Per-axis weight of how much it drives compatibility in each relationship
// context (each row sums to 1) — romantic leans on Feeling/Judging for
// emotional & lifestyle fit, friendship on Intuition/Perceiving for shared
// interests & spontaneity, work on Thinking/Judging for decisions & structure,
// and leadership on Extraversion/Judging for directive style & structure.
const MODE_AXIS_WEIGHTS: Record<RelationshipMode, Record<AxisName, number>> = {
  romantic: { IE: 0.15, NS: 0.2, TF: 0.35, JP: 0.3 },
  friendship: { IE: 0.15, NS: 0.35, TF: 0.15, JP: 0.35 },
  work: { IE: 0.15, NS: 0.15, TF: 0.35, JP: 0.35 },
  leadership: { IE: 0.35, NS: 0.15, TF: 0.15, JP: 0.35 },
};

// A shared letter counts as fully compatible on that axis; a differing letter
// still counts as partially compatible (differences bring friction, not zero
// value — they're often complementary), so scores land between 45 and 100.
const SHARED_AXIS_SCORE = 100;
const DIFFERENT_AXIS_SCORE = 45;

const MODE_TIER_BLURBS: Record<RelationshipMode, { min: number; blurb: string }[]> = {
  romantic: [
    {
      min: 75,
      blurb: "Your emotional wiring and pace of life line up well — a naturally low-friction romantic match.",
    },
    {
      min: 50,
      blurb: "A mix of emotional common ground and real differences — romance here works with some deliberate translation.",
    },
    {
      min: 0,
      blurb: "Your emotional instincts and daily rhythms diverge sharply — rewarding, but it takes real work to bridge.",
    },
  ],
  friendship: [
    {
      min: 75,
      blurb: "You're likely drawn to similar ideas and a similar pace of spontaneity — an easy, low-effort friendship.",
    },
    {
      min: 50,
      blurb: "Enough shared curiosity to click, with enough difference to keep things interesting.",
    },
    {
      min: 0,
      blurb: "Very different sources of fun and structure — this friendship works best around a shared activity rather than shared instincts.",
    },
  ],
  work: [
    {
      min: 75,
      blurb: "Similar decision-making and structure preferences — you'll likely move through projects smoothly together.",
    },
    {
      min: 50,
      blurb: "You balance each other on some work habits and clash gently on others — fine with a bit of clear process.",
    },
    {
      min: 0,
      blurb: "Different approaches to logic and structure — this pairing is productive only with explicit process and role clarity.",
    },
  ],
  leadership: [
    {
      min: 75,
      blurb: "Compatible instincts for setting direction and pace — you'd likely lead in a similar register.",
    },
    {
      min: 50,
      blurb: "Some shared leadership instincts, some contrast in style — works if authority and structure are made explicit.",
    },
    {
      min: 0,
      blurb: "Contrasting instincts for asserting direction and structure — a leadership pairing that needs clearly negotiated roles.",
    },
  ],
};

export interface ModeScore {
  mode: RelationshipMode;
  label: string;
  score: number;
  blurb: string;
}

export function getModeScores(typeA: string, typeB: string): ModeScore[] {
  const codeA = typeA.toUpperCase();
  const codeB = typeB.toUpperCase();

  return RELATIONSHIP_MODES.map((mode) => {
    const weights = MODE_AXIS_WEIGHTS[mode];
    const score = Math.round(
      AXES.reduce((sum, axis, i) => {
        const shared = codeA[i] === codeB[i];
        return sum + weights[axis] * (shared ? SHARED_AXIS_SCORE : DIFFERENT_AXIS_SCORE);
      }, 0)
    );
    const tier = MODE_TIER_BLURBS[mode].find((t) => score >= t.min)!;
    return { mode, label: MODE_LABELS[mode], score, blurb: tier.blurb };
  });
}

// ---------------------------------------------------------------------------
// Conflict styles
// ---------------------------------------------------------------------------

// One sentence per type describing its natural, instinctive reaction to
// conflict — used to explain how a given pair of types might clash.
export const CONFLICT_STYLE: Record<string, string> = {
  INTJ: "INTJs tend to withdraw to analyze the problem logically and privately before they're ready to discuss it.",
  INTP: "INTPs tend to intellectualize the conflict, wanting to pick apart the reasoning before addressing the feelings involved.",
  ENTJ: "ENTJs tend to want to resolve conflict head-on and quickly, pushing for a decision before emotions have fully settled.",
  ENTP: "ENTPs tend to turn conflict into a debate, probing and challenging the other side's logic rather than sitting with the discomfort.",
  INFJ: "INFJs tend to internalize conflict and go quiet, replaying it privately until they've found the underlying meaning.",
  INFP: "INFPs tend to feel conflict deeply and may need to retreat to process their values and feelings before they can talk.",
  ENFJ: "ENFJs tend to focus on restoring harmony fast, sometimes smoothing things over before the real issue is fully addressed.",
  ENFP: "ENFPs tend to want to talk through the emotional side immediately and openly, sometimes before they've organized their thoughts.",
  ISTJ: "ISTJs tend to want to address conflict factually and in order, sticking to what actually happened rather than how it felt.",
  ISFJ: "ISFJs tend to avoid direct confrontation and quietly absorb tension, hoping it resolves before it needs to be named.",
  ESTJ: "ESTJs tend to state their position directly and push for a clear resolution, sometimes moving faster than the other person is ready for.",
  ESFJ: "ESFJs tend to seek reassurance and consensus quickly, feeling unsettled until the relationship visibly feels okay again.",
  ISTP: "ISTPs tend to detach and go silent under conflict, needing space to process alone before engaging.",
  ISFP: "ISFPs tend to withdraw from confrontation, quietly hurt, and need calm space before they can articulate what's wrong.",
  ESTP: "ESTPs tend to confront conflict directly and in the moment, wanting to hash it out now rather than let it linger.",
  ESFP: "ESFPs tend to react emotionally in the moment and want it resolved fast, uneasy about letting bad feelings sit.",
};

// One line of concrete, actionable advice per type for bridging its own
// conflict instinct toward whoever it's disagreeing with.
export const CONFLICT_ADVICE: Record<string, string> = {
  INTJ: "Say \"I need to think about this and get back to you\" explicitly, instead of just going quiet — silence alone reads as dismissal.",
  INTP: "Name the emotional stakes out loud before diving into the logic, or the other person may feel unheard while you're still debating the premise.",
  ENTJ: "Slow down and ask a clarifying question before pushing for resolution — being right fast can feel like being run over.",
  ENTP: "Pause the devil's-advocate instinct and check whether the other person wants to solve the problem or just be heard.",
  INFJ: "Say what's bothering you sooner rather than processing it alone for days — by the time you're ready to talk, the other person may not know anything was wrong.",
  INFP: "Ask for time to gather your thoughts rather than shutting down completely — a clear \"I need a bit before I can talk about this\" prevents it from reading as stonewalling.",
  ENFJ: "Let the actual disagreement surface fully before moving to repair it — smoothing over too fast can leave the root issue unresolved.",
  ENFP: "Give the other person a beat to collect their thoughts before diving in — not everyone processes conflict out loud in real time.",
  ISTJ: "Make space for how the other person feels about the situation, not just what happened — facts alone can feel dismissive of emotion.",
  ISFJ: "Say something before resentment builds — naming a small issue early is easier for both of you than a silent buildup.",
  ESTJ: "Check the pace — ask if the other person is ready to resolve this now, rather than assuming everyone wants it settled immediately.",
  ESFJ: "Give the issue room to be actually worked through, not just soothed — quick reassurance can paper over what still needs to change.",
  ISTP: "Say you need space explicitly (\"I need a bit, I'm not avoiding this\") so withdrawal doesn't get mistaken for indifference.",
  ISFP: "Name what hurt you directly once you've had a moment, rather than letting it show only in withdrawal.",
  ESTP: "Slow down before confronting it in the moment — the other person may need a few minutes to organize their thoughts first.",
  ESFP: "Take a breath before reacting in the moment — a quick emotional response can escalate faster than the situation calls for.",
};

export interface ConflictProfile {
  type: string;
  tendency: string;
  advice: string;
}

export interface ConflictStyleResult {
  a: ConflictProfile;
  b: ConflictProfile;
}

export function getConflictStyle(typeA: string, typeB: string): ConflictStyleResult {
  const codeA = typeA.toUpperCase();
  const codeB = typeB.toUpperCase();
  return {
    a: { type: codeA, tendency: CONFLICT_STYLE[codeA], advice: CONFLICT_ADVICE[codeA] },
    b: { type: codeB, tendency: CONFLICT_STYLE[codeB], advice: CONFLICT_ADVICE[codeB] },
  };
}
