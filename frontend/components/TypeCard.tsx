import Image from "next/image";
import Link from "next/link";
import { TYPE_DESCRIPTIONS } from "@/lib/types";

interface Props {
  type: string;
  // Optional experimental Assertive/Turbulent suffix letter (from
  // lib/identity.ts) — shown as small supplementary text next to the type
  // letters, not baked into the main gradient heading, since it isn't a
  // trained model output like the type itself.
  identitySuffix?: string;
}

export default function TypeCard({ type, identitySuffix }: Props) {
  return (
    <div className="card animate-pop-in rounded-3xl p-8 text-center">
      <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-2xl shadow-lg shadow-brand-500/10 sm:h-40 sm:w-40">
        <Image
          src={`/mbti/characters/${type}.png`}
          alt={type}
          fill
          sizes="160px"
          className="object-cover object-top"
          priority
        />
      </div>
      <p className="mt-4 text-sm uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        Your type
      </p>
      <h1 className="my-2 bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-5xl font-extrabold text-transparent sm:text-6xl">
        {type}
        {identitySuffix && (
          <span
            className="ml-1 align-super text-lg font-semibold text-neutral-400 dark:text-neutral-500"
          >
            -{identitySuffix}
          </span>
        )}
      </h1>
      <p className="mx-auto max-w-md text-neutral-600 dark:text-neutral-300">
        {TYPE_DESCRIPTIONS[type] ?? "No description available for this type."}
      </p>
      <Link
        href={`/types/${type.toLowerCase()}`}
        className="mt-4 inline-block text-sm font-medium text-brand-500 hover:underline"
      >
        Read more about {type} →
      </Link>
    </div>
  );
}
