import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { TYPE_DESCRIPTIONS, TYPE_GROUPS, GROUP_COLORS } from "@/lib/types";
import { TYPE_PROFILES } from "@/lib/typeProfiles";
import TypeProfileTabs from "@/components/TypeProfileTabs";

export function generateStaticParams() {
  return Object.keys(TYPE_DESCRIPTIONS).map((type) => ({ type: type.toLowerCase() }));
}

export function generateMetadata({ params }: { params: { type: string } }) {
  const type = params.type.toUpperCase();
  const desc = TYPE_DESCRIPTIONS[type];
  if (!desc) return {};
  return {
    title: `${type} Personality Type — MindPrint`,
    description: desc,
  };
}

export default function TypeProfilePage({ params }: { params: { type: string } }) {
  const type = params.type.toUpperCase();
  const description = TYPE_DESCRIPTIONS[type];
  const profile = TYPE_PROFILES[type];
  const group = TYPE_GROUPS[type];

  if (!description || !profile) notFound();

  const gradient = GROUP_COLORS[group] ?? "from-brand-500 to-brand-700";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href="/types"
        className="mb-6 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-brand-500 dark:text-neutral-400"
      >
        ← All types
      </Link>

      <div className="mb-8 flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
        <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl shadow-lg shadow-brand-500/10">
          <Image
            src={`/mbti/characters/${type}.png`}
            alt={type}
            fill
            sizes="128px"
            className="object-cover object-top"
            priority
          />
        </div>
        <div>
          <span
            className={`inline-block rounded-full bg-gradient-to-r px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white ${gradient}`}
          >
            {group}
          </span>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight">{type}</h1>
          <p className="mt-2 max-w-xl text-neutral-600 dark:text-neutral-300">{description}</p>
        </div>
      </div>

      <TypeProfileTabs type={type} profile={profile} />

      <div className="mt-10 text-center">
        <Link
          href="/assessment"
          className="rounded-xl bg-brand-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-800"
        >
          Find out your type →
        </Link>
      </div>
    </div>
  );
}
