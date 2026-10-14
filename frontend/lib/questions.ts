export interface QuestionOption {
  id: string;
  label: string; // text shown on the option button
}

export interface Question {
  id: string;
  dimension: string; // grouping label shown above the prompt, Cloverleaf-style
  prompt: string;
  options: [QuestionOption, QuestionOption, QuestionOption];
}

export const QUESTIONS_PER_QUIZ = 10;

// Which single-letter pole each dimension's "a"/"b" option represents (the
// "c" option is always a deliberate middle-ground answer, so it has no pole).
// Used to build a concrete, per-answer "why this result" breakdown instead of
// relying only on generic corpus-level writing-style signals.
export const DIMENSION_POLES: Record<string, [string, string]> = {
  Energy: ["E", "I"],
  Perception: ["S", "N"],
  Judgment: ["T", "F"],
  Orientation: ["J", "P"],
};

export interface QuizAnswer {
  dimension: string;
  prompt: string;
  label: string;
  pole: string | null; // null for the "c" middle-ground option
}

export function poleForAnswer(question: Question, optionId: string): string | null {
  const [poleA, poleB] = DIMENSION_POLES[question.dimension] ?? [null, null];
  if (optionId === "a") return poleA;
  if (optionId === "b") return poleB;
  return null;
}

// A pool of 50 forced-choice questions, evenly spread across the 4 classic
// dimensions. Option "a" counts toward the dimension's first letter, "b"
// toward the second, and "c" is a genuine "it depends" middle ground — some
// people really are close to 50/50 on a given axis. Answers are scored in
// backend/app/quiz_scoring.py, blended with the model's reading of the quiz's
// closing write-in.
const POOL: Question[] = [
  // ---- Energy (E vs I) ----
  {
    id: "energy_1",
    dimension: "Energy",
    prompt: "After a long week, what actually recharges you?",
    options: [
      { id: "a", label: "A night out with people" },
      { id: "b", label: "Quiet time alone" },
      { id: "c", label: "A bit of both, depending on the week" },
    ],
  },
  {
    id: "energy_2",
    dimension: "Energy",
    prompt: "At a party full of strangers, you're more likely to...",
    options: [
      { id: "a", label: "Work the room, meet everyone" },
      { id: "b", label: "Stick with one or two people" },
      { id: "c", label: "Depends on my mood that night" },
    ],
  },
  {
    id: "energy_3",
    dimension: "Energy",
    prompt: "When you're thinking through a problem, you prefer to...",
    options: [
      { id: "a", label: "Talk it out with others" },
      { id: "b", label: "Sit with it privately first" },
      { id: "c", label: "Some thinking alone, then talk it through" },
    ],
  },
  {
    id: "energy_4",
    dimension: "Energy",
    prompt: "Your ideal weekend has...",
    options: [
      { id: "a", label: "Plans with friends, group activities" },
      { id: "b", label: "Open unstructured time by yourself" },
      { id: "c", label: "A balance of social time and solo time" },
    ],
  },
  {
    id: "energy_5",
    dimension: "Energy",
    prompt: "In a group project, you naturally...",
    options: [
      { id: "a", label: "Speak up early, drive discussion" },
      { id: "b", label: "Listen first, contribute when ready" },
      { id: "c", label: "It depends on who else is in the room" },
    ],
  },
  {
    id: "energy_6",
    dimension: "Energy",
    prompt: "After a big social event, how do you usually feel?",
    options: [
      { id: "a", label: "Energized, wishing it lasted longer" },
      { id: "b", label: "Drained, needing time alone to recover" },
      { id: "c", label: "A mix, energized at first then drained" },
    ],
  },
  {
    id: "energy_7",
    dimension: "Energy",
    prompt: "Your phone rings with an unexpected call. Your first instinct is...",
    options: [
      { id: "a", label: "Pick up right away" },
      { id: "b", label: "Let it go to voicemail" },
      { id: "c", label: "Depends who it is and my mood" },
    ],
  },
  {
    id: "energy_8",
    dimension: "Energy",
    prompt: "How many close friends do you keep in regular contact with?",
    options: [
      { id: "a", label: "A big, wide circle" },
      { id: "b", label: "A small, tight circle" },
      { id: "c", label: "A moderate circle, neither big nor small" },
    ],
  },
  {
    id: "energy_9",
    dimension: "Energy",
    prompt: "When something exciting happens, what's your first move?",
    options: [
      { id: "a", label: "Tell people immediately" },
      { id: "b", label: "Sit with the feeling privately" },
      { id: "c", label: "Tell one close person, then go quiet" },
    ],
  },
  {
    id: "energy_10",
    dimension: "Energy",
    prompt: "In a new city, your instinct is to...",
    options: [
      { id: "a", label: "Strike up conversations with locals" },
      { id: "b", label: "Explore quietly on your own" },
      { id: "c", label: "A little of both, depending on the day" },
    ],
  },
  {
    id: "energy_11",
    dimension: "Energy",
    prompt: "Which describes your ideal work environment better?",
    options: [
      { id: "a", label: "Open, collaborative, lots of interaction" },
      { id: "b", label: "Quiet, private, minimal interruptions" },
      { id: "c", label: "Some collaboration, some quiet focus time" },
    ],
  },
  {
    id: "energy_12",
    dimension: "Energy",
    prompt: "How do you feel about small talk with strangers?",
    options: [
      { id: "a", label: "Enjoy it, easy and fun" },
      { id: "b", label: "Find it tiring or awkward" },
      { id: "c", label: "Fine in small doses" },
    ],
  },
  {
    id: "energy_13",
    dimension: "Energy",
    prompt: "During a holiday break, you're happiest when...",
    options: [
      { id: "a", label: "Surrounded by family and friends" },
      { id: "b", label: "You get long stretches of solitude" },
      { id: "c", label: "Some family time, some time to myself" },
    ],
  },

  // ---- Perception (S vs N) ----
  {
    id: "perception_1",
    dimension: "Perception",
    prompt: "When learning something new, you focus first on...",
    options: [
      { id: "a", label: "Concrete facts and step-by-step details" },
      { id: "b", label: "The big-picture idea and possibilities" },
      { id: "c", label: "Both together, facts and the big picture" },
    ],
  },
  {
    id: "perception_2",
    dimension: "Perception",
    prompt: "You trust more...",
    options: [
      { id: "a", label: "What you can directly observe" },
      { id: "b", label: "Your gut feeling or intuition" },
      { id: "c", label: "A mix of evidence and gut feeling" },
    ],
  },
  {
    id: "perception_3",
    dimension: "Perception",
    prompt: "Reading a novel, you're more drawn to...",
    options: [
      { id: "a", label: "Realistic, grounded stories" },
      { id: "b", label: "Imaginative, symbolic, speculative stories" },
      { id: "c", label: "Enjoy both equally" },
    ],
  },
  {
    id: "perception_4",
    dimension: "Perception",
    prompt: "Giving directions, you tend to...",
    options: [
      { id: "a", label: "List exact turns and landmarks" },
      { id: "b", label: "Describe the general vibe of the route" },
      { id: "c", label: "A rough idea plus a couple key landmarks" },
    ],
  },
  {
    id: "perception_5",
    dimension: "Perception",
    prompt: "In meetings, you usually notice...",
    options: [
      { id: "a", label: "The specific facts and numbers presented" },
      { id: "b", label: "The underlying pattern or hidden implication" },
      { id: "c", label: "Both the numbers and what they imply" },
    ],
  },
  {
    id: "perception_6",
    dimension: "Perception",
    prompt: "You'd rather a teacher explain something with...",
    options: [
      { id: "a", label: "A real, practical example" },
      { id: "b", label: "The theory and underlying concept" },
      { id: "c", label: "The theory, then a practical example" },
    ],
  },
  {
    id: "perception_7",
    dimension: "Perception",
    prompt: "When your instinct about a person conflicted with the facts, what happened?",
    options: [
      { id: "a", label: "The facts won out, instinct was noise" },
      { id: "b", label: "The instinct turned out to be right" },
      { id: "c", label: "It's gone both ways for me" },
    ],
  },
  {
    id: "perception_8",
    dimension: "Perception",
    prompt: "Assembling furniture, you...",
    options: [
      { id: "a", label: "Follow the instructions step by step" },
      { id: "b", label: "Skim the instructions, wing it from intuition" },
      { id: "c", label: "Skim once, then follow along closely" },
    ],
  },
  {
    id: "perception_9",
    dimension: "Perception",
    prompt: "Which compliment would mean more to you?",
    options: [
      { id: "a", label: "\"You're so practical and reliable.\"" },
      { id: "b", label: "\"You're so imaginative and original.\"" },
      { id: "c", label: "Both would mean about the same to me" },
    ],
  },
  {
    id: "perception_10",
    dimension: "Perception",
    prompt: "You're planning a trip. You spend more time on...",
    options: [
      { id: "a", label: "The concrete logistics and schedule" },
      { id: "b", label: "Imagining the overall experience and vibe" },
      { id: "c", label: "Split fairly evenly between the two" },
    ],
  },
  {
    id: "perception_11",
    dimension: "Perception",
    prompt: "A coworker describes a vague, half-formed idea. You...",
    options: [
      { id: "a", label: "Ask for specifics before reacting" },
      { id: "b", label: "Get excited and start extrapolating" },
      { id: "c", label: "Get curious, then ask for specifics" },
    ],
  },
  {
    id: "perception_12",
    dimension: "Perception",
    prompt: "Which better describes how you remember past events?",
    options: [
      { id: "a", label: "Specific, literal details" },
      { id: "b", label: "General impressions and meaning" },
      { id: "c", label: "A mix of specific details and general feel" },
    ],
  },

  // ---- Judgment (T vs F) ----
  {
    id: "judgment_1",
    dimension: "Judgment",
    prompt: "In a disagreement, what matters most to you?",
    options: [
      { id: "a", label: "Finding the most logical, fair resolution" },
      { id: "b", label: "Making sure everyone's feelings are okay" },
      { id: "c", label: "Both the logic and the feelings involved" },
    ],
  },
  {
    id: "judgment_2",
    dimension: "Judgment",
    prompt: "A tough decision usually comes down to...",
    options: [
      { id: "a", label: "Logic and a pros-and-cons analysis" },
      { id: "b", label: "How it affects the people involved" },
      { id: "c", label: "Weighing both logic and the people impact" },
    ],
  },
  {
    id: "judgment_3",
    dimension: "Judgment",
    prompt: "Giving feedback on someone's work, you tend to...",
    options: [
      { id: "a", label: "Be direct and blunt about the flaws" },
      { id: "b", label: "Soften it and lead with the positives" },
      { id: "c", label: "Honest but careful with the delivery" },
    ],
  },
  {
    id: "judgment_4",
    dimension: "Judgment",
    prompt: "You value more in a leader...",
    options: [
      { id: "a", label: "Fair, consistent, rational decisions" },
      { id: "b", label: "Warm, empathetic, people-first decisions" },
      { id: "c", label: "Someone who balances both" },
    ],
  },
  {
    id: "judgment_5",
    dimension: "Judgment",
    prompt: "A friend asks for your honest opinion on something they made. You...",
    options: [
      { id: "a", label: "Give an objective, critical assessment" },
      { id: "b", label: "Focus on encouragement, frame it gently" },
      { id: "c", label: "Give honest thoughts, framed with care" },
    ],
  },
  {
    id: "judgment_6",
    dimension: "Judgment",
    prompt: "What frustrates you more in a debate?",
    options: [
      { id: "a", label: "Sloppy, inconsistent logic" },
      { id: "b", label: "People being cold or dismissive" },
      { id: "c", label: "Both equally frustrate me" },
    ],
  },
  {
    id: "judgment_7",
    dimension: "Judgment",
    prompt: "At work, a rule is technically correct but feels unfair to one person. You...",
    options: [
      { id: "a", label: "Apply the rule consistently regardless" },
      { id: "b", label: "Bend it to be fair to that person" },
      { id: "c", label: "Depends how much it would hurt them" },
    ],
  },
  {
    id: "judgment_8",
    dimension: "Judgment",
    prompt: "Which matters more when you evaluate an argument?",
    options: [
      { id: "a", label: "Whether it's logically sound" },
      { id: "b", label: "Whether it aligns with your values" },
      { id: "c", label: "Both logic and how it aligns with values" },
    ],
  },
  {
    id: "judgment_9",
    dimension: "Judgment",
    prompt: "You're mediating a conflict between two friends. Your first move is to...",
    options: [
      { id: "a", label: "Get the facts straight from both sides" },
      { id: "b", label: "Check in on how each of them is feeling" },
      { id: "c", label: "A bit of both, facts and feelings together" },
    ],
  },
  {
    id: "judgment_10",
    dimension: "Judgment",
    prompt: "Which sounds more like you?",
    options: [
      { id: "a", label: "\"I call it like I see it, facts first.\"" },
      { id: "b", label: "\"I choose kindness over blunt honesty.\"" },
      { id: "c", label: "\"I try to be both honest and kind.\"" },
    ],
  },
  {
    id: "judgment_11",
    dimension: "Judgment",
    prompt: "When someone is upset, your instinct is to...",
    options: [
      { id: "a", label: "Help them solve the actual problem" },
      { id: "b", label: "Just listen and validate the feeling" },
      { id: "c", label: "Listen first, then offer to help fix it" },
    ],
  },
  {
    id: "judgment_12",
    dimension: "Judgment",
    prompt: "You perform better under a system that rewards...",
    options: [
      { id: "a", label: "Objective merit and results" },
      { id: "b", label: "Effort, care, and team harmony" },
      { id: "c", label: "A mix of results and effort" },
    ],
  },

  // ---- Orientation (J vs P) ----
  {
    id: "orientation_1",
    dimension: "Orientation",
    prompt: "Your typical week looks more like...",
    options: [
      { id: "a", label: "A detailed plan you stick to" },
      { id: "b", label: "A loose idea you adjust as you go" },
      { id: "c", label: "A rough plan with room to adjust" },
    ],
  },
  {
    id: "orientation_2",
    dimension: "Orientation",
    prompt: "When plans change unexpectedly, you usually...",
    options: [
      { id: "a", label: "Feel thrown off, need to reset the plan" },
      { id: "b", label: "Roll with it easily, even feel relieved" },
      { id: "c", label: "A little thrown off, but adjust quickly" },
    ],
  },
  {
    id: "orientation_3",
    dimension: "Orientation",
    prompt: "Packing for a trip, you...",
    options: [
      { id: "a", label: "Make a checklist days in advance" },
      { id: "b", label: "Throw things in the bag last minute" },
      { id: "c", label: "A rough mental list, packed the night before" },
    ],
  },
  {
    id: "orientation_4",
    dimension: "Orientation",
    prompt: "Which feels better to you?",
    options: [
      { id: "a", label: "Crossing off a finished to-do list" },
      { id: "b", label: "Leaving your options open all day" },
      { id: "c", label: "Both feel good in different ways" },
    ],
  },
  {
    id: "orientation_5",
    dimension: "Orientation",
    prompt: "Before starting a big project, you usually...",
    options: [
      { id: "a", label: "Map out every step in advance" },
      { id: "b", label: "Dive in and figure it out as you go" },
      { id: "c", label: "Sketch a rough plan, then dive in" },
    ],
  },
  {
    id: "orientation_6",
    dimension: "Orientation",
    prompt: "Your workspace or room is usually...",
    options: [
      { id: "a", label: "Organized, everything has a place" },
      { id: "b", label: "A bit chaotic, but you know where things are" },
      { id: "c", label: "Organized in some areas, messy in others" },
    ],
  },
  {
    id: "orientation_7",
    dimension: "Orientation",
    prompt: "A deadline is two weeks out. You...",
    options: [
      { id: "a", label: "Start early, pace yourself with a schedule" },
      { id: "b", label: "Wait until closer, work best under pressure" },
      { id: "c", label: "Start a little early, finish in a rush anyway" },
    ],
  },
  {
    id: "orientation_8",
    dimension: "Orientation",
    prompt: "Which sounds more like your ideal vacation?",
    options: [
      { id: "a", label: "A fixed itinerary planned in advance" },
      { id: "b", label: "No itinerary, deciding day by day" },
      { id: "c", label: "A few things booked, rest left open" },
    ],
  },
  {
    id: "orientation_9",
    dimension: "Orientation",
    prompt: "How do you feel about deadlines?",
    options: [
      { id: "a", label: "They keep me structured and on track" },
      { id: "b", label: "They feel restrictive and stressful" },
      { id: "c", label: "Useful, but I don't stress about them much" },
    ],
  },
  {
    id: "orientation_10",
    dimension: "Orientation",
    prompt: "Making weekend plans with friends, you'd rather...",
    options: [
      { id: "a", label: "Decide and lock it in ahead of time" },
      { id: "b", label: "Keep it open, decide the day of" },
      { id: "c", label: "Loosely plan it, finalize details later" },
    ],
  },
  {
    id: "orientation_11",
    dimension: "Orientation",
    prompt: "Which bothers you more?",
    options: [
      { id: "a", label: "A messy, unstructured situation" },
      { id: "b", label: "Being locked into a rigid plan" },
      { id: "c", label: "Both bother me about equally" },
    ],
  },
  {
    id: "orientation_12",
    dimension: "Orientation",
    prompt: "When you set a goal, you usually...",
    options: [
      { id: "a", label: "Build a step-by-step plan to reach it" },
      { id: "b", label: "Keep the goal loose and adapt as you learn" },
      { id: "c", label: "Set rough milestones, adjust along the way" },
    ],
  },
  {
    id: "orientation_13",
    dimension: "Orientation",
    prompt: "Your calendar app is...",
    options: [
      { id: "a", label: "Full of scheduled events and reminders" },
      { id: "b", label: "Nearly empty, you just wing it" },
      { id: "c", label: "A few key events, rest kept flexible" },
    ],
  },
];

export const DIMENSION_DESCRIPTIONS: Record<string, string> = {
  Energy: "How you gain energy — internally or through others.",
  Perception: "How you take in information — through facts or patterns.",
  Judgment: "How you make decisions — through logic or values.",
  Orientation: "How you organize your life — with structure or flexibility.",
};

const DIMENSIONS = Object.keys(DIMENSION_DESCRIPTIONS);

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Turns { questionId: optionId } into the answer list sent to the backend and
// shown on the result page.
export function toQuizAnswers(questions: Question[], answers: Record<string, string>): QuizAnswer[] {
  return questions.map((q) => {
    const optionId = answers[q.id];
    const option = q.options.find((o) => o.id === optionId);
    return {
      dimension: q.dimension,
      prompt: q.prompt,
      label: option?.label || "",
      pole: poleForAnswer(q, optionId),
    };
  });
}

// How many questions each dimension has — sent to the backend so the model's
// question plan never asks a dimension for more than exist.
export const DIMENSION_POOL_SIZES: Record<string, number> = Object.fromEntries(
  DIMENSIONS.map((d) => [d, POOL.filter((q) => q.dimension === d).length])
);

// Picks questions to match a per-dimension plan from the model (e.g.
// { Energy: 2, Orientation: 4 }), skipping any already asked, then shuffles.
export function pickQuizByAllocation(allocation: Record<string, number>, excludeIds: string[] = []): Question[] {
  const picked: Question[] = [];
  for (const dim of DIMENSIONS) {
    const n = allocation[dim] ?? 0;
    if (n <= 0) continue;
    const available = POOL.filter((q) => q.dimension === dim && !excludeIds.includes(q.id));
    picked.push(...shuffle(available).slice(0, n));
  }
  return shuffle(picked);
}

// Picks `count` questions balanced across the 4 dimensions (not pure uniform
// random over the whole pool, so a quiz can't accidentally land all its
// questions on the same axis), then shuffles the final order. Called fresh on
// every assessment mount, so every attempt gets a different set.
//
// `count` defaults to QUESTIONS_PER_QUIZ (10), matching the original
// no-argument behavior exactly. Slots are handed out one at a time in a
// randomized round-robin across dimensions, skipping a dimension once its
// pool is exhausted — so a larger "deep quiz" request (e.g. 40) still comes
// back balanced and never asks a dimension for more than it actually has
// (currently 12-13 per dimension), without erroring or duplicating.
export function pickQuiz(count: number = QUESTIONS_PER_QUIZ): Question[] {
  const byDimension: Record<string, Question[]> = {};
  for (const dim of DIMENSIONS) byDimension[dim] = [];
  for (const q of POOL) byDimension[q.dimension].push(q);

  const shuffledDims = shuffle(DIMENSIONS);
  const counts: Record<string, number> = {};
  for (const dim of shuffledDims) counts[dim] = 0;

  let remaining = Math.min(count, POOL.length);
  while (remaining > 0) {
    let allocatedThisRound = false;
    for (const dim of shuffledDims) {
      if (remaining <= 0) break;
      if (counts[dim] < byDimension[dim].length) {
        counts[dim]++;
        remaining--;
        allocatedThisRound = true;
      }
    }
    if (!allocatedThisRound) break; // every dimension's pool is exhausted
  }

  const picked: Question[] = [];
  for (const dim of DIMENSIONS) {
    picked.push(...shuffle(byDimension[dim]).slice(0, counts[dim]));
  }
  return shuffle(picked);
}
