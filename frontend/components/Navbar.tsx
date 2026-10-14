"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "./AuthProvider";
import { NAV_LINKS as LINKS } from "@/lib/navLinks";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user, loading, logout } = useAuth();

  return (
    <header className="glass-nav sticky top-0 z-50 border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 text-sm text-white">
            MB
          </span>
          <span className="hidden text-neutral-900 dark:text-neutral-100 sm:inline">
            MindPrint
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-brand-500/10 text-brand-600 dark:text-brand-300"
                    : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800/60"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {!loading && (
            <div className="hidden items-center gap-3 sm:flex">
              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300"
                  >
                    {user.name}
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="rounded-full border border-neutral-300 px-3.5 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800/60"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded-full px-3.5 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800/60"
                >
                  Log in
                </Link>
              )}
            </div>
          )}
          <button
            className="rounded-lg p-2 text-neutral-600 dark:text-neutral-300 lg:hidden"
            aria-label="Toggle menu"
            onClick={() => setOpen((o) => !o)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800 lg:hidden">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                pathname === link.href
                  ? "bg-brand-500/10 text-brand-600 dark:text-brand-300"
                  : "text-neutral-600 dark:text-neutral-300"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {!loading &&
            (user ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-600 dark:text-brand-300"
                >
                  {user.name}
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral-600 dark:text-neutral-300"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300"
              >
                Log in
              </Link>
            ))}
        </nav>
      )}
    </header>
  );
}
