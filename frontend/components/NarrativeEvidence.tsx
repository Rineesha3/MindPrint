import { QuizAnswer } from "@/lib/questions";

interface Props {
  answers: QuizAnswer[];
  predictedType: string;
}

// Short, human-readable topic per dimension, used to build the connective
// "when asked about X, you picked Y" sentence below.
const DIMENSION_TOPIC: Record<string, string> = {
  Energy: "how you recharge",
  Perception: "how you take in information",
  Judgment: "how you make decisions",
  Orientation: "how you organize your time",
};

// Short adjective phrase per letter, used to build the lead-in sentence.
// Purely templated — not a model output.
const TRAIT_PHRASES: Record<string, string> = {
  I: "independent, internally-focused",
  E: "outgoing, people-first",
  N: "big-picture, idea-driven",
  S: "practical, detail-focused",
  T: "logical, structure-first",
  F: "values-driven, people-focused",
  J: "structured, plan-ahead",
  P: "flexible, in-the-moment",
};

// Synthesizes a short templated narrative paragraph from the user's own quiz
// picks that agree with the final predicted type — grounding "why this
// result" in the user's exact words rather than only generic corpus-level
// writing-style signals. This is template-based, not an LLM call: there is
// no AI text-generation API configured in this project. Only renders when
// quiz answers are available (same sessionStorage source AnswerBreakdown
// reads), and deliberately reads as prose rather than duplicating
// AnswerBreakdown's per-axis table.
export default function NarrativeEvidence({ answers, predictedType }: Props) {
  if (!answers || answers.length === 0) return null;

  const predictedLetters = predictedType.split("");
  const agreeing = answers.filter((a) => a.pole && predictedLetters.includes(a.pole));
  if (agreeing.length === 0) return null;

  const picked = agreeing.slice(0, 3);
  const fragments = picked.map((a) => {
    const topic = DIMENSION_TOPIC[a.dimension] ?? a.dimension.toLowerCase();
    return `when asked about ${topic}, you picked "${a.label}"`;
  });

  // De-duplicated set of trait phrases for the 4 predicted letters, in type
  // order, joined into a short lead-in.
  const leadPhrases = Array.from(
    new Set(predictedLetters.map((l) => TRAIT_PHRASES[l]).filter(Boolean))
  );
  const lead = leadPhrases.join(", ");

  let examples: string;
  if (fragments.length === 1) {
    examples = fragments[0];
  } else if (fragments.length === 2) {
    examples = `${fragments[0]}, and ${fragments[1]}`;
  } else {
    examples = `${fragments.slice(0, -1).join("; ")}; and ${fragments[fragments.length - 1]}`;
  }

  return (
    <div className="card rounded-2xl p-6">
      <h2 className="mb-1 text-lg font-semibold">The story behind your answers</h2>
      <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
        Your answers leaned toward {lead} thinking — for example, {examples}.
      </p>
    </div>
  );
}
