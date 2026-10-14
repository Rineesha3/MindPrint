"use client";

import { useEffect, useState } from "react";
import { TypeProfile } from "@/lib/typeProfiles";

const TABS = [
  "Strengths & Weaknesses",
  "Growth",
  "Work Style",
  "Relationships",
] as const;
type Tab = (typeof TABS)[number];

const WORK_STYLE_ROWS: { key: keyof TypeProfile["workStyle"]; label: string }[] = [
  { key: "communication", label: "Communication" },
  { key: "meetings", label: "Meetings" },
  { key: "decisionMaking", label: "Decision-making" },
  { key: "feedback", label: "Feedback" },
  { key: "idealEnvironment", label: "Ideal environment" },
  { key: "frustration", label: "Frustration" },
];

interface Challenge {
  id: string;
  text: string;
  done: boolean;
}

const listKey = (type: string) => `mbti_growth_list_${type}`;

function defaultChallenges(profile: TypeProfile): Challenge[] {
  return profile.growthChallenges.map((text, i) => ({ id: `d${i}`, text, done: false }));
}

export default function TypeProfileTabs({
  type,
  profile,
}: {
  type: string;
  profile: TypeProfile;
}) {
  const [tab, setTab] = useState<Tab>("Strengths & Weaknesses");
  const [challenges, setChallenges] = useState<Challenge[]>(() => defaultChallenges(profile));
  const [customized, setCustomized] = useState(false);
  const [draft, setDraft] = useState("");

  // The user's edited list (added/removed/checked challenges) lives in
  // localStorage per type. Before editing existed, only checkmarks were
  // stored (mbti_growth_<type>_<i>), so fall back to those for the defaults.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(listKey(type));
      if (stored) {
        setChallenges(JSON.parse(stored));
        setCustomized(true);
        return;
      }
    } catch {
      // unreadable or unavailable storage — fall through to defaults
    }
    setChallenges(
      defaultChallenges(profile).map((c, i) => {
        try {
          return { ...c, done: window.localStorage.getItem(`mbti_growth_${type}_${i}`) === "true" };
        } catch {
          return c;
        }
      })
    );
    setCustomized(false);
  }, [type, profile]);

  function update(next: Challenge[]) {
    setChallenges(next);
    setCustomized(true);
    try {
      window.localStorage.setItem(listKey(type), JSON.stringify(next));
    } catch {
      // localStorage unavailable — ignore, state still updates for this session
    }
  }

  function toggleChallenge(id: string) {
    update(challenges.map((c) => (c.id === id ? { ...c, done: !c.done } : c)));
  }

  function removeChallenge(id: string) {
    update(challenges.filter((c) => c.id !== id));
  }

  function addChallenge(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    update([...challenges, { id: `c${Date.now()}`, text, done: false }]);
    setDraft("");
  }

  function resetChallenges() {
    try {
      window.localStorage.removeItem(listKey(type));
      profile.growthChallenges.forEach((_, i) => window.localStorage.removeItem(`mbti_growth_${type}_${i}`));
    } catch {
      // ignore
    }
    setChallenges(defaultChallenges(profile));
    setCustomized(false);
  }

  const doneCount = challenges.filter((c) => c.done).length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2 border-b border-neutral-200 pb-2 dark:border-neutral-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              tab === t
                ? "bg-brand-500/10 text-brand-600 dark:text-brand-300"
                : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800/60"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Strengths & Weaknesses" && (
        <div className="space-y-5">
          <div className="card rounded-2xl p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-500">
              Trait balance
            </h2>
            <div className="space-y-3">
              {profile.traitBalance.map((h) => (
                <div key={h.label} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                  <span className="text-sm text-neutral-700 dark:text-neutral-300 sm:w-36 sm:shrink-0">
                    {h.label}
                  </span>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={`h-3 w-6 rounded-sm ${
                          i < h.score
                            ? "bg-brand-500"
                            : "bg-neutral-200 dark:bg-neutral-700"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="card rounded-2xl p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-500">
                Strengths
              </h2>
              <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                {profile.strengths.map((s) => (
                  <li key={s} className="flex gap-2">
                    <span className="text-emerald-500">+</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card rounded-2xl p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-rose-500">
                Weaknesses
              </h2>
              <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                {profile.weaknesses.map((w) => (
                  <li key={w} className="flex gap-2">
                    <span className="text-rose-500">−</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {tab === "Growth" && (
        <div className="card rounded-2xl p-6">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">
              Growth challenges
            </h2>
            {challenges.length > 0 && (
              <span className="text-xs text-neutral-400 dark:text-neutral-500">
                {doneCount} of {challenges.length} done
              </span>
            )}
          </div>

          {challenges.length === 0 ? (
            <p className="py-2 text-sm text-neutral-400 dark:text-neutral-500">
              No challenges yet — add one below.
            </p>
          ) : (
            <ul className="space-y-1">
              {challenges.map((c) => (
                <li key={c.id} className="group flex items-start gap-3 rounded-lg px-1 py-1 hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                  <label className="flex flex-1 cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={c.done}
                      onChange={() => toggleChallenge(c.id)}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-neutral-300 text-brand-500 focus:ring-brand-500 dark:border-neutral-700 dark:bg-neutral-800"
                    />
                    <span
                      className={`text-sm text-neutral-700 dark:text-neutral-300 ${
                        c.done ? "text-neutral-400 line-through dark:text-neutral-500" : ""
                      }`}
                    >
                      {c.text}
                    </span>
                  </label>
                  <button
                    onClick={() => removeChallenge(c.id)}
                    aria-label={`Remove "${c.text}"`}
                    title="Remove"
                    className="shrink-0 rounded-full px-2 text-neutral-400 transition hover:text-rose-500 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={addChallenge} className="mt-4 flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={200}
              placeholder="Add your own challenge…"
              className="min-w-0 flex-1 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-neutral-700 dark:bg-neutral-900"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-400 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:opacity-90"
            >
              Add
            </button>
          </form>

          {customized && (
            <button
              onClick={resetChallenges}
              className="mt-3 text-xs text-neutral-400 hover:text-brand-500 dark:text-neutral-500"
            >
              Reset to defaults
            </button>
          )}
        </div>
      )}

      {tab === "Work Style" && (
        <div className="grid gap-5 sm:grid-cols-2">
          {WORK_STYLE_ROWS.map(({ key, label }) => (
            <div key={key} className="card rounded-2xl p-6">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-500">
                {label}
              </h2>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                {profile.workStyle[key]}
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === "Relationships" && (
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="card rounded-2xl p-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-500">
              Romantic
            </h2>
            <p className="text-sm text-neutral-700 dark:text-neutral-300">{profile.romantic}</p>
          </div>
          <div className="card rounded-2xl p-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-500">
              Friendships
            </h2>
            <p className="text-sm text-neutral-700 dark:text-neutral-300">{profile.friendships}</p>
          </div>
          <div className="card rounded-2xl p-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-500">
              Parenthood
            </h2>
            <p className="text-sm text-neutral-700 dark:text-neutral-300">{profile.parenthood}</p>
          </div>
        </div>
      )}
    </div>
  );
}
