import Link from "next/link";
import { NAV_LINKS } from "@/lib/navLinks";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-neutral-500 dark:text-neutral-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © {new Date().getFullYear()} MindPrint. For self-discovery, not a clinical
          assessment.
        </p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-brand-500">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
