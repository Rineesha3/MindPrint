import { PredictResponse } from "./types";
import { authHeaders } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface HistoryEntry extends PredictResponse {
  taken_at: number; // unix seconds
  test_mode?: "quiz" | "deepQuiz" | "freeform" | null; // null for older entries
}

export async function fetchHistory(): Promise<HistoryEntry[]> {
  const res = await fetch(`${API_URL}/history`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load history.");
  return res.json();
}

export async function clearHistory(): Promise<void> {
  const res = await fetch(`${API_URL}/history`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to clear history.");
}
