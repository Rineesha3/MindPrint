import Link from "next/link";
import Reveal from "@/components/Reveal";

const DIMENSIONS = [
  { title: "Energy", axis: "E / I", desc: "How you gain energy — internally or through others." },
  { title: "Perception", axis: "S / N", desc: "How you take in information — through facts or patterns." },
  { title: "Judgment", axis: "T / F", desc: "How you make decisions — through logic or values." },
  { title: "Orientation", axis: "J / P", desc: "How you organize your life — with structure or flexibility." },
];

// Inline icon paths (24x24, stroke-based) so the feature cards don't need an icon library.
const FEATURES = [
  {
    title: "Quick and fresh every time",
    desc: "Just a couple of minutes, with new questions each time you come back.",
    icon: "M13 2 3 14h9l-1 8 10-12h-9l1-8z",
  },
  {
    title: "Results that go deeper",
    desc: "Go beyond four letters and see how strongly you lean on each trait.",
    icon: "M3 3v18h18M7 15l4-4 3 3 5-6",
  },
  {
    title: "Track how you grow",
    desc: "Save your results and see how your personality shifts over time.",
    icon: "M12 21s-7-4.35-9.5-8.5C.5 8.5 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.5 4.5 4.5 8.5C19 16.65 12 21 12 21z",
  },
];


export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-24 top-0 h-72 w-72 animate-blob rounded-full bg-brand-400/30 blur-3xl" />
          <div className="absolute right-0 top-20 h-72 w-72 animate-blob rounded-full bg-brand-700/25 blur-3xl [animation-delay:4s]" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 animate-blob rounded-full bg-brand-300/20 blur-3xl [animation-delay:8s]" />
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="animate-fade-up text-center">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-400/40 bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">
              Free · ~2 minutes · Instant results
            </p>
            <h1 className="mb-5 text-4xl font-bold leading-tight sm:text-5xl">
              Discover your personality type
              <span className="text-gradient mt-3 block">from how you actually think.</span>
            </h1>
            <p className="mx-auto mb-8 max-w-xl text-lg text-neutral-600 dark:text-neutral-400">
              Answer a few quick questions and uncover your personality type — how you see
              the world, connect with others, and make everyday decisions.
            </p>

            <div className="mb-10 flex flex-wrap justify-center gap-3">
              <Link
                href="/assessment"
                className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-400 px-6 py-3 text-center font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:opacity-90"
              >
                Start the assessment →
              </Link>
              <Link
                href="/types"
                className="rounded-xl border border-neutral-300 px-6 py-3 text-center font-semibold text-neutral-700 transition hover:border-brand-400 hover:text-brand-600 dark:border-neutral-700 dark:text-neutral-200"
              >
                Browse the 16 types
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {DIMENSIONS.map((d) => (
                <div key={d.title} className="rounded-xl border border-neutral-200 bg-white/50 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
                  <p className="font-mono text-sm font-bold text-brand-500">{d.axis}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{d.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <Reveal className="mb-10 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Why people love MindPrint</h2>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">
            A personality test that's fast, insightful, and actually fun to take.
          </p>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 100}>
              <div className="card h-full rounded-2xl p-6 text-center transition hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-500/5">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d={f.icon} />
                  </svg>
                </div>
                <p className="mb-2 text-lg font-semibold">{f.title}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="text-center">
          <Link
            href="/assessment"
            className="inline-block rounded-xl bg-gradient-to-r from-brand-600 to-brand-400 px-6 py-3 font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:opacity-90"
          >
            Take the free test →
          </Link>
        </div>
      </section>
    </div>
  );
}
