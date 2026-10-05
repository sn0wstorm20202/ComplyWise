"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const messages: Record<string, string> = {
  not_configured: "Google sign-in needs to be configured. You can still sign in with email and password.",
  cancelled: "Google sign-in was cancelled. You can try again.",
  existing_account: "Please sign in with your existing email and password.",
  verification_failed: "We couldn't verify this Google sign-in. Please try again.",
  provider_unavailable: "Google sign-in is temporarily unavailable. Please try again.",
};

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { completeGoogleSignIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const pending = useRef<ReturnType<typeof completeGoogleSignIn> | null>(null);
  useEffect(() => {
    let active = true;
    if (!pending.current) {
      const providerError = new URLSearchParams(window.location.search).get("error");
      const ticket = new URLSearchParams(window.location.hash.slice(1)).get("ticket");
      const verifier = sessionStorage.getItem("complywise_google_verifier");
      history.replaceState(null, "", window.location.pathname);
      if (providerError || !ticket || !verifier) {
        setError(messages[providerError || "verification_failed"] || messages.verification_failed);
        return;
      }
      pending.current = completeGoogleSignIn(ticket, verifier);
    }
    pending.current.then(session => {
      if (active) { sessionStorage.removeItem("complywise_google_verifier"); router.replace(session.is_new_user ? "/onboarding?new=true" : "/dashboard"); }
    }).catch(err => { if (active) setError(err instanceof Error ? err.message : messages.verification_failed); });
    return () => { active = false; };
  }, [router, completeGoogleSignIn]);
  return <main className="ui-auth min-h-screen flex items-center justify-center p-6">
    <section className="ui-object max-w-lg text-center" aria-live="polite">
      <h1 className="text-2xl">{error ? "Google sign-in needs attention" : "Finishing your sign-in…"}</h1>
      <p className="mt-4 text-sm text-[var(--ui-secondary)]">{error || "Verifying your account and opening your workspace."}</p>
      {error && <Link href="/auth/signin" className="ui-button mt-6">Return to sign in</Link>}
    </section>
  </main>;
}
