"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  TYPE_DESCRIPTIONS,
  TYPE_GROUPS,
} from "@/lib/types";
import TypeFlipCard from "@/components/TypeFlipCard";

const ALL_TYPES = Object.keys(TYPE_DESCRIPTIONS);
const GROUPS = ["All", "Analysts", "Diplomats", "Sentinels", "Explorers"];

export default function TypesPage() {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  // Only one card is flipped at a time — flipping another resets the previous one.
  const [flippedType, setFlippedType] = useState<string | null>(null);

  // Clicking anywhere outside a card (or pressing Escape) flips it back.
  useEffect(() => {
    if (!flippedType) return;
    const onClick = (e: MouseEvent) => {
      if (!(e.target as Element).closest?.("[data-flip-card]")) setFlippedType(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFlippedType(null);
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [flippedType]);

  const visible = useMemo(() => {
    return ALL_TYPES.filter((type) => {
      const matchesGroup = filter === "All" || TYPE_GROUPS[type] === filter;
      const matchesQuery =
        query.trim() === "" ||
        type.toLowerCase().includes(query.toLowerCase()) ||
        TYPE_DESCRIPTIONS[type].toLowerCase().includes(query.toLowerCase());
      return matchesGroup && matchesQuery;
    });
  }, [filter, query]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">The 16 personality types</h1>
        <p className="mt-2 text-neutral-500 dark:text-neutral-400">
          A quick reference for all 16 personality types.
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setFilter(g)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                filter === g
                  ? "bg-brand-700 text-white hover:bg-brand-800"
                  : "border border-neutral-200 bg-neutral-100 text-neutral-700 hover:border-brand-300 hover:bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search types or traits…"
          className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-neutral-700 dark:bg-neutral-900 sm:w-64"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((type, i) => (
          <TypeFlipCard
            key={type}
            type={type}
            index={i}
            flipped={flippedType === type}
            onToggle={() => setFlippedType((t) => (t === type ? null : type))}
          />
        ))}
      </div>

      {visible.length === 0 && (
        <p className="py-16 text-center text-neutral-400">No types match that search.</p>
      )}

      <div className="mt-12 text-center">
        <Link
          href="/assessment"
          className="rounded-xl bg-brand-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-800"
        >
          Find out which one you are →
        </Link>
      </div>
    </div>
  );
}
