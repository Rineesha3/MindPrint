export type AxisName = "IE" | "NS" | "TF" | "JP";

export const AXIS_NAMES_ORDERED: AxisName[] = ["IE", "NS", "TF", "JP"];

export interface AxisResult {
  predicted: string;
  probabilities: Record<string, number>;
  confidence: "low" | "medium" | "high";
  axis_reliability: number;
}

export interface WritingSignal {
  feature: string;
  direction: "above" | "below";
  blurb: string;
}

export interface PredictResponse {
  predicted_type: string;
  axes: Record<AxisName, AxisResult>;
  word_count: number;
  warning: string | null;
  signals: WritingSignal[];
}

export const AXIS_LABELS: Record<AxisName, [string, string]> = {
  IE: ["E", "I"],
  NS: ["S", "N"],
  TF: ["T", "F"], // second letter = the backend models' positive class (I, N, F, J)
  JP: ["P", "J"],
};

export const AXIS_TITLES: Record<AxisName, string> = {
  IE: "Extraversion vs. Introversion",
  NS: "Sensing vs. Intuition",
  TF: "Thinking vs. Feeling",
  JP: "Perceiving vs. Judging",
};

export const LETTER_NAMES: Record<string, string> = {
  E: "Extraversion",
  I: "Introversion",
  S: "Sensing",
  N: "Intuition",
  T: "Thinking",
  F: "Feeling",
  J: "Judging",
  P: "Perceiving",
};

// Everyday wording for each letter, so results read without knowing any
// MBTI jargon.
export const PLAIN_NAMES: Record<string, string> = {
  E: "Outgoing",
  I: "Reserved",
  S: "Practical",
  N: "Imaginative",
  T: "Logical",
  F: "Caring",
  J: "Organized",
  P: "Flexible",
};

export const LETTER_MEANINGS: Record<string, string> = {
  E: "You get energy from people and activity, and you think out loud.",
  I: "You recharge with time alone and like to think before you speak.",
  S: "You trust facts and details, and focus on what's real right now.",
  N: "You notice patterns and ideas, and think about what could be.",
  T: "You make decisions with logic and what makes the most sense.",
  F: "You make decisions with your values and how people will feel.",
  J: "You like plans, routines and getting things settled.",
  P: "You like keeping options open and going with the flow.",
};

export const AXIS_TOPICS: Record<AxisName, string> = {
  IE: "Where you get your energy",
  NS: "How you take in the world",
  TF: "How you make decisions",
  JP: "How you handle your day",
};

export const TYPE_GROUPS: Record<string, string> = {
  INTJ: "Analysts", INTP: "Analysts", ENTJ: "Analysts", ENTP: "Analysts",
  INFJ: "Diplomats", INFP: "Diplomats", ENFJ: "Diplomats", ENFP: "Diplomats",
  ISTJ: "Sentinels", ISFJ: "Sentinels", ESTJ: "Sentinels", ESFJ: "Sentinels",
  ISTP: "Explorers", ISFP: "Explorers", ESTP: "Explorers", ESFP: "Explorers",
};

export const GROUP_COLORS: Record<string, string> = {
  Analysts: "from-violet-800 to-indigo-800",
  Diplomats: "from-emerald-800 to-teal-800",
  Sentinels: "from-sky-800 to-blue-800",
  Explorers: "from-amber-900 to-orange-900",
};

export const TYPE_DESCRIPTIONS: Record<string, string> = {
  INTJ: "Strategic, independent thinkers who like designing systems and long-term plans.",
  INTP: "Curious, analytical problem-solvers who enjoy exploring abstract ideas.",
  ENTJ: "Decisive, big-picture leaders who like organizing people and resources toward a goal.",
  ENTP: "Quick-witted debaters who enjoy generating ideas and challenging assumptions.",
  INFJ: "Idealistic and insightful, often focused on meaning and helping others grow.",
  INFP: "Values-driven and imaginative, motivated by authenticity and personal ideals.",
  ENFJ: "Warm, persuasive organizers who are attuned to others' emotions and growth.",
  ENFP: "Enthusiastic, imaginative connectors who thrive on new possibilities and people.",
  ISTJ: "Practical, reliable, and detail-oriented, valuing structure and follow-through.",
  ISFJ: "Considerate and dependable, quietly attentive to others' needs.",
  ESTJ: "Organized, direct, and results-focused, comfortable taking charge.",
  ESFJ: "Sociable and supportive, attentive to harmony and practical needs of a group.",
  ISTP: "Hands-on problem-solvers who like understanding how things work.",
  ISFP: "Gentle, present-focused, and aesthetically minded, valuing personal freedom.",
  ESTP: "Energetic and pragmatic, drawn to action and real-time problem-solving.",
  ESFP: "Spontaneous and outgoing, focused on enjoying and sharing the present moment.",
};
