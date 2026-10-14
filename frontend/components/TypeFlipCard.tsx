"use client";

import Image from "next/image";
import Link from "next/link";
import { TYPE_DESCRIPTIONS, TYPE_GROUPS, GROUP_COLORS } from "@/lib/types";

export default function TypeFlipCard({
  type,
  index = 0,
  flipped,
  onToggle,
}: {
  type: string;
  index?: number;
  flipped: boolean;
  onToggle: () => void;
}) {
  const group = TYPE_GROUPS[type];

  return (
    <div
      id={type}
      data-flip-card
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        // Let keys on the inner "Full profile" link reach the link itself.
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      aria-pressed={flipped}
      style={{ animationDelay: `${index * 60}ms` }}
      className="group block w-full scroll-mt-24 origin-center cursor-pointer animate-pop-in text-left [perspective:1200px]"
    >
      <div
        className={`relative aspect-[4/5] w-full transition-transform duration-700 ease-out [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        <div className="card absolute inset-0 overflow-hidden rounded-2xl transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-brand-500/10 [backface-visibility:hidden]">
          <Image
            src={`/mbti/characters/${type}.png`}
            alt={type}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 pt-10">
            <span
              className={`mb-1.5 inline-block rounded-full bg-gradient-to-r px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white ${GROUP_COLORS[group]}`}
            >
              {group}
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">{type}</h2>
          </div>
        </div>

        <div className="card absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl p-5 text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <span
            className={`rounded-full bg-gradient-to-r px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white ${GROUP_COLORS[group]}`}
          >
            {group}
          </span>
          <h2 className="text-3xl font-bold tracking-tight">{type}</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            {TYPE_DESCRIPTIONS[type]}
          </p>
          <Link
            href={`/types/${type.toLowerCase()}`}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 text-xs font-medium text-brand-500 hover:underline"
          >
            Full profile →
          </Link>
        </div>
      </div>
    </div>
  );
}
