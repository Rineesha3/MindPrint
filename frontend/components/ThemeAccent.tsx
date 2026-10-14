"use client";

import { useEffect } from "react";
import { PredictResponse, TYPE_GROUPS } from "@/lib/types";

// Representative hex per personality group — used for the CSS custom
// property since canvas/CSS can't consume Tailwind's `from-x to-y` gradient
// classes from GROUP_COLORS directly.
export const GROUP_HEX: Record<string, string> = {
  Analysts: "#8b5cf6", // violet-500
  Diplomats: "#10b981", // emerald-500
  Sentinels: "#0ea5e9", // sky-500
  Explorers: "#f59e0b", // amber-500
};

// Light personalization touch, not a full re-theme: on mount, if a result
// from this session exists, tints `--accent-type-color` on <html> to that
// type's group color. Renders nothing itself. Currently consumed by the
// result page's top accent strip; safe to read elsewhere later since it's
// just a CSS custom property with no default visual effect on its own.
export default function ThemeAccent() {
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("mbti_result");
      if (!stored) return;
      const result: PredictResponse = JSON.parse(stored);
      const group = TYPE_GROUPS[result.predicted_type];
      const hex = group ? GROUP_HEX[group] : undefined;
      if (hex) {
        document.documentElement.style.setProperty("--accent-type-color", hex);
      }
    } catch {
      // Malformed or missing session data — leave the default, no accent.
    }
  }, []);

  return null;
}
