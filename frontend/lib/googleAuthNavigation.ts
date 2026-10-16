/** OAuth must start on the callback backend so its state cookie stays on that host. */
export function googleAuthStartUrl(
  configuredApiBase: string | undefined,
  defaultApiBase: string,
  handoffChallenge: string,
): string {
  const base = (configuredApiBase?.trim() || defaultApiBase).replace(/\/+$/, "");
  return `${base}/auth/google/start?handoff_challenge=${encodeURIComponent(handoffChallenge)}`;
}
