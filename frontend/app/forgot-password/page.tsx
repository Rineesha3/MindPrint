"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:px-6">
      <div className="card rounded-2xl p-6">
        <h1 className="mb-2 text-xl font-semibold">Reset your password</h1>

        {sent ? (
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            If an account with a password exists for that email, we've sent a
            reset link. It expires in 1 hour.
          </p>
        ) : (
          <>
            <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
              Enter your email and we'll send you a link to set a new password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-neutral-300 bg-white p-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-brand-400 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:opacity-90"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-neutral-400 dark:text-neutral-500">
        <Link href="/login" className="hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
