"use client";

import { useEffect, useRef, useState } from "react";
import { authApi } from "@/lib/api/auth";

export default function DemoReviewerAutofill({ onFill }: {
  onFill: (email: string, password: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);

  async function fill() {
    setPending(true);
    setMessage(null);
    try {
      const credentials = await authApi.demoReviewerCredentials();
      if (active.current) {
        onFill(credentials.email, credentials.password);
        setMessage("Demo credentials filled. You can edit them, then use the normal sign-in button.");
      }
    } catch (error) {
      if (active.current) setMessage(error instanceof Error ? error.message : "Demo reviewer access is unavailable.");
    } finally {
      if (active.current) setPending(false);
    }
  }

  return <div className="space-y-2">
    <button type="button" className="ui-button w-full justify-center" disabled={pending} onClick={fill}>
      {pending ? "Preparing demo credentials…" : "Use Demo Reviewer Credentials"}
    </button>
    <p className="text-xs text-[var(--ui-secondary)]" role="status">
      {message || "DEMO — fills a dedicated reviewer account. Sign-in is still required."}
    </p>
  </div>;
}
