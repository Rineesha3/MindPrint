"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TYPE_DESCRIPTIONS, TYPE_GROUPS, GROUP_COLORS, AxisName, PredictResponse } from "@/lib/types";
import {
  getCompatibility,
  getModeScores,
  getConflictStyle,
  RELATIONSHIP_MODES,
  RelationshipMode,
} from "@/lib/compatibility";
import { useAuth } from "@/components/AuthProvider";
import { fetchHistory } from "@/lib/history";

const ALL_TYPES = Object.keys(TYPE_DESCRIPTIONS);

// Everyday wording for the relationship tabs and the four trait areas.
const RELATIONSHIP_LABELS: Record<RelationshipMode, string> = {
  romantic: "Partner",
  friendship: "Friend",
  work: "Coworker",
  leadership: "Leader",
};

const TRAIT_AREAS: Record<AxisName, string> = {
  IE: "Social energy",
  NS: "How you see things",
  TF: "How you decide",
  JP: "How you plan",
};

const TRAIT_WORDS: Record<string, string> = {
  E: "outgoing",
  I: "reserved",
  S: "practical",
  N: "imaginative",
  T: "logical",
  F: "caring",
  J: "organized",
  P: "spontaneous",
};

function isValidType(t: string | null | undefined): t is string {
  return Boolean(t && ALL_TYPES.includes(t.toUpperCase()));
}

function scoreColor(score: number) {
  if (score >= 75) return "text-emerald-500";
  if (score >= 55) return "text-brand-500";
  return "text-amber-500";
}

const GROUP_ORDER = ["Analysts", "Diplomats", "Sentinels", "Explorers"];

// Custom picker: a button showing the current type that opens a panel with all
// 16 types laid out in their four colored groups.
function TypeSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label} personality type: ${value}. Change`}
        className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-xl font-extrabold tracking-tight transition hover:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-neutral-700 dark:bg-neutral-900"
      >
        {value}
        <svg
          viewBox="0 0 20 20"
          className={`h-4 w-4 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-1/2 top-full z-30 mt-2 w-72 -translate-x-1/2 rounded-2xl border border-neutral-200 bg-white p-3 text-left shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
        >
          {GROUP_ORDER.map((g) => (
            <div key={g} className="mb-2 last:mb-0">
              <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                {g}
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {ALL_TYPES.filter((t) => TYPE_GROUPS[t] === g).map((t) => (
                  <button
                    key={t}
                    role="option"
                    aria-selected={t === value}
                    onClick={() => {
                      onChange(t);
                      setOpen(false);
                    }}
                    className={`rounded-lg py-1.5 text-xs font-bold transition ${
                      t === value
                        ? `bg-gradient-to-r text-white ${GROUP_COLORS[g]}`
                        : "bg-neutral-100 text-neutral-700 hover:bg-brand-500/10 hover:text-brand-600 dark:bg-neutral-800 dark:text-neutral-200"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TypePicker({
  label,
  value,
  onChange,
  note,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  note?: React.ReactNode;
}) {
  const group = TYPE_GROUPS[value];
  return (
    <div className="card relative flex flex-1 flex-col items-center gap-3 rounded-2xl p-5 text-center focus-within:z-40">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
        {label}
      </p>
      <div className="relative h-24 w-24 overflow-hidden rounded-2xl shadow-lg shadow-brand-500/10">
        <Image src={`/mbti/characters/${value}.png`} alt={value} fill sizes="96px" className="object-cover object-top" />
      </div>
      <TypeSelect label={label} value={value} onChange={onChange} />
      {group && (
        <span
          className={`rounded-full bg-gradient-to-r px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white ${GROUP_COLORS[group]}`}
        >
          {group}
        </span>
      )}
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{TYPE_DESCRIPTIONS[value]}</p>
      {note}
    </div>
  );
}

export default function CompatibilityPage() {
  return (
    <Suspense fallback={null}>
      <CompatibilityPageInner />
    </Suspense>
  );
}

function CompatibilityPageInner() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read once on mount: the URL-sync effect below rewrites ?a= immediately,
  // so reading it live would make every later check see a URL-provided type.
  const [initialA] = useState(() => searchParams.get("a"));
  const [initialB] = useState(() => searchParams.get("b"));
  const urlProvidedA = isValidType(initialA);

  const [typeA, setTypeA] = useState(isValidType(initialA) ? initialA.toUpperCase() : "INTJ");
  const [typeB, setTypeB] = useState(isValidType(initialB) ? initialB.toUpperCase() : "ENFP");
  const [myType, setMyType] = useState<string | null>(null);
  const [mode, setMode] = useState<RelationshipMode>("romantic");

  // Personalize the default comparison to the user's own most recent result
  // instead of a fixed placeholder pair, so the page answers "how do I match
  // with X" rather than only "how do any two types match." Skip this when the
  // URL already specified a type A, so a shared/deep-linked comparison isn't
  // silently overwritten by the visitor's own result — myType is still
  // learned in that case so the "Use my result" shortcut keeps working.
  useEffect(() => {
    const stored = sessionStorage.getItem("mbti_result");
    if (stored) {
      try {
        const parsed: PredictResponse = JSON.parse(stored);
        if (isValidType(parsed.predicted_type)) {
          setMyType(parsed.predicted_type);
          if (!urlProvidedA) setTypeA(parsed.predicted_type);
          return;
        }
      } catch {
        // fall through to history lookup
      }
    }
    if (user) {
      fetchHistory()
        .then((entries) => {
          const latest = entries[0];
          if (latest && isValidType(latest.predicted_type)) {
            setMyType(latest.predicted_type);
            if (!urlProvidedA) setTypeA(latest.predicted_type);
          }
        })
        .catch(() => {
          // no history yet, or request failed — keep the default pair
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Keep the URL in sync with the current pair so the comparison is always
  // shareable, without pushing a new history entry per change.
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("a", typeA);
    params.set("b", typeB);
    router.replace(`/compatibility?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeA, typeB]);

  function swapTypes() {
    setTypeA(typeB);
    setTypeB(typeA);
  }

  const result = useMemo(() => getCompatibility(typeA, typeB), [typeA, typeB]);
  const modeScores = useMemo(() => getModeScores(typeA, typeB), [typeA, typeB]);
  const conflict = useMemo(() => getConflictStyle(typeA, typeB), [typeA, typeB]);
  const activeMode = modeScores.find((m) => m.mode === mode)!;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">How well do you match?</h1>
        <p className="mt-2 text-neutral-500 dark:text-neutral-400">
          Pick your type and someone else&apos;s — a partner, friend, or coworker — to see
          where you click and where you might clash.
        </p>
      </div>

      {/* Pickers */}
      <div className="mb-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <TypePicker
          label={myType && typeA === myType ? "You (your result)" : "You"}
          value={typeA}
          onChange={setTypeA}
          note={
            !myType ? (
              <Link href="/assessment" className="text-xs font-medium text-brand-500 hover:underline">
                Don&apos;t know your type? Take the test
              </Link>
            ) : typeA !== myType ? (
              <button onClick={() => setTypeA(myType)} className="text-xs font-medium text-brand-500 hover:underline">
                Use my result ({myType})
              </button>
            ) : null
          }
        />
        <button
          onClick={swapTypes}
          aria-label="Swap"
          title="Swap"
          className="mx-auto rotate-90 rounded-full border border-neutral-300 p-2 text-neutral-400 hover:text-brand-500 dark:border-neutral-700 sm:rotate-0"
        >
          ⇄
        </button>
        <TypePicker label="Them" value={typeB} onChange={setTypeB} />
      </div>

      {/* Match score */}
      <div className="card mb-8 rounded-2xl p-6 text-center">
        <p className="mb-3 text-sm font-medium text-neutral-500 dark:text-neutral-400">
          What&apos;s your relationship?
        </p>
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {RELATIONSHIP_MODES.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                mode === m
                  ? "bg-gradient-to-r from-brand-600 to-brand-400 text-white"
                  : "border border-neutral-300 text-neutral-600 hover:border-brand-400 dark:border-neutral-700 dark:text-neutral-300"
              }`}
            >
              {RELATIONSHIP_LABELS[m]}
            </button>
          ))}
        </div>

        <p className={`text-6xl font-extrabold ${scoreColor(activeMode.score)}`}>{activeMode.score}%</p>
        <p className="mt-1 text-lg font-semibold">{result.tierLabel}</p>
        <p className="mx-auto mt-2 max-w-lg text-sm text-neutral-600 dark:text-neutral-300">
          {activeMode.blurb}
        </p>
        <p className="mt-3 text-xs text-neutral-400 dark:text-neutral-500">
          You have {result.sharedCount} of 4 traits in common.
        </p>
      </div>

      {/* Trait by trait */}
      <h2 className="mb-3 text-lg font-semibold">Trait by trait</h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {result.axes.map((a) => (
          <div key={a.axis} className="card rounded-2xl p-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{TRAIT_AREAS[a.axis]}</p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  a.shared ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                }`}
              >
                {a.shared ? "In common" : "Different"}
              </span>
            </div>
            <p className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
              {a.shared
                ? `You're both ${TRAIT_WORDS[a.letterA]}.`
                : `You're more ${TRAIT_WORDS[a.letterA]}, they're more ${TRAIT_WORDS[a.letterB]}.`}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{a.blurb}</p>
          </div>
        ))}
      </div>

      {/* Conflict */}
      <h2 className="mb-3 text-lg font-semibold">When you disagree</h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {[
          { who: `You (${conflict.a.type})`, ...conflict.a },
          { who: `Them (${conflict.b.type})`, ...conflict.b },
        ].map((p) => (
          <div key={p.who} className="card rounded-2xl p-5">
            <p className="mb-2 text-sm font-semibold">{p.who}</p>
            <p className="mb-3 text-sm text-neutral-600 dark:text-neutral-300">{p.tendency}</p>
            <p className="rounded-xl bg-brand-500/10 p-3 text-sm text-brand-700 dark:text-brand-300">
              <span className="font-semibold">Tip: </span>
              {p.advice}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
