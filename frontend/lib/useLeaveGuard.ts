"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export const LEAVE_MESSAGE = "Your test is in progress. If you leave now, your answers will be lost.";

/**
 * While `active`, asks for confirmation (via the in-app LeaveDialog) before
 * the user leaves the page via the browser back button or an in-app link.
 * Reload / tab close still falls back to the browser's own prompt, since
 * browsers don't allow custom UI there.
 *
 * Programmatic navigation (router.push after submitting) is not intercepted,
 * so finishing the test goes straight to the result.
 *
 * Render the returned state with <LeaveDialog open={open} onConfirm={confirm} onCancel={cancel} />,
 * and call `request(action)` to guard any other "leave" action of your own.
 */
export function useLeaveGuard(active: boolean) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const pendingRef = useRef<(() => void) | null>(null);

  const request = useCallback((onLeave: () => void) => {
    pendingRef.current = onLeave;
    setOpen(true);
  }, []);

  const confirm = useCallback(() => {
    const action = pendingRef.current;
    pendingRef.current = null;
    setOpen(false);
    action?.();
  }, []);

  const cancel = useCallback(() => {
    pendingRef.current = null;
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!active) return;

    // Reload / close tab — browsers only show their own generic prompt here.
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    // Back button: park a duplicate of the current history entry on top, so
    // pressing back pops that instead of leaving. Copying Next's own state
    // keeps the App Router happy when it sees the popstate. The duplicate is
    // re-parked straight away so the history stays put while the dialog is
    // open; confirming then steps back past both entries.
    window.history.pushState(window.history.state, "", window.location.href);
    const onPopState = () => {
      window.history.pushState(window.history.state, "", window.location.href);
      request(() => {
        window.removeEventListener("popstate", onPopState);
        window.removeEventListener("beforeunload", onBeforeUnload);
        window.history.go(-2);
      });
    };

    // In-app links (navbar, footer, …). Capture phase runs before Next's
    // <Link> handler, so cancelling here stops the client-side navigation;
    // the navigation is replayed once the user confirms.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank") return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin === window.location.origin && url.pathname === window.location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      request(() => {
        if (url.origin === window.location.origin) {
          router.push(url.pathname + url.search + url.hash);
        } else {
          window.removeEventListener("beforeunload", onBeforeUnload);
          window.location.href = url.href;
        }
      });
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("popstate", onPopState);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("click", onClick, true);
    };
  }, [active, request, router]);

  return { open, request, confirm, cancel };
}
