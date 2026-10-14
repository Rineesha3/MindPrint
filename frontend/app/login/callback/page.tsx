"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { safeNextPath, setToken } from "@/lib/auth";

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <OAuthCallback />
    </Suspense>
  );
}

function OAuthCallback() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const next = safeNextPath(searchParams.get("next"));
    if (!token) {
      window.location.replace("/login?error=Sign-in failed — no token received.");
      return;
    }
    setToken(token);
    // Hard navigation so AuthProvider re-mounts and picks up the new session.
    // replace() keeps the token-bearing callback URL out of browser history.
    window.location.replace(next);
  }, [searchParams]);

  return (
    <div className="mx-auto max-w-sm px-4 py-16 text-center text-sm text-neutral-500 dark:text-neutral-400">
      Signing you in...
    </div>
  );
}
