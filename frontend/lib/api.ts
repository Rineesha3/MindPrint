import { PredictResponse } from "./types";
import { authHeaders } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface StatsResponse {
  total_predictions: number;
  type_counts: Record<string, number>;
  // Average model probability for each axis's second letter (I/N/F/J),
  // grouped by predicted type — e.g. axis_averages.INTJ.IE = 0.78 means
  // INTJs in the data average 78% toward I. Powers "you vs typical type".
  axis_averages: Record<string, Record<string, number>>;
}

export interface AnalyzeResponse {
  axes: Record<string, { letter: string; certainty: number }>;
  allocation: Record<string, number>; // questions per dimension (quizzes)
  follow_ups: Record<string, number>; // follow-up questions per dimension (free writing)
}

// The model reads the person's writing first and plans the questions:
// pass `count` for a quiz plan, or omit it to get free-writing follow-ups.
export async function analyzeText(
  text: string,
  count = 0,
  maxPerDimension: Record<string, number> = {}
): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, count, max_per_dimension: maxPerDimension }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export async function fetchStats(): Promise<StatsResponse> {
  const res = await fetch(`${API_URL}/stats`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load stats.");
  return res.json();
}

export type TestMode = "quiz" | "deepQuiz" | "freeform";

export async function predictType(
  text: string,
  mode?: TestMode,
  answers?: { dimension: string; pole: string | null }[]
): Promise<PredictResponse> {
  const res = await fetch(`${API_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ text, mode, answers }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed with status ${res.status}`);
  }

  return res.json();
}
