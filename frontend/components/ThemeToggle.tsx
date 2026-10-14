"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle color theme"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 text-neutral-600 transition hover:border-brand-400 hover:text-brand-500 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-brand-400 dark:hover:text-brand-300"
    >
      {dark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3a9 9 0 1 0 9 9c0-.35-.02-.7-.05-1.04A7 7 0 0 1 12 3Z" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4.5a1 1 0 0 1-1-1V2a1 1 0 1 1 2 0v1.5a1 1 0 0 1-1 1Zm0 15a1 1 0 0 1 1 1V22a1 1 0 1 1-2 0v-1.5a1 1 0 0 1 1-1ZM4.5 12a1 1 0 0 1-1 1H2a1 1 0 1 1 0-2h1.5a1 1 0 0 1 1 1Zm15 0a1 1 0 0 1 1-1H22a1 1 0 1 1 0 2h-1.5a1 1 0 0 1-1-1ZM6.34 7.76a1 1 0 0 1-1.42 0L3.87 6.71a1 1 0 1 1 1.42-1.42l1.05 1.06a1 1 0 0 1 0 1.41Zm11.32 11.32a1 1 0 0 1-1.42 0l-1.05-1.06a1 1 0 1 1 1.42-1.42l1.05 1.06a1 1 0 0 1 0 1.42ZM6.34 16.24a1 1 0 0 1 0 1.42l-1.05 1.06a1 1 0 1 1-1.42-1.42l1.05-1.06a1 1 0 0 1 1.42 0Zm11.32-11.32a1 1 0 0 1 0 1.42L16.6 7.4a1 1 0 1 1-1.42-1.42l1.05-1.06a1 1 0 0 1 1.42 0ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z" />
        </svg>
      )}
    </button>
  );
}
