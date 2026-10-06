import { getApiBaseUrl } from "@/lib/api/client";
import { googleAuthStartUrl } from "@/lib/googleAuthNavigation";

export async function startGoogleSignIn(): Promise<void> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const verifier = Array.from(bytes, value => value.toString(16).padStart(2, "0")).join("");
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  const challenge = btoa(String.fromCharCode(...hash)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
  sessionStorage.setItem("complywise_google_verifier", verifier);
  window.location.assign(googleAuthStartUrl(process.env.NEXT_PUBLIC_API_BASE_URL, getApiBaseUrl(), challenge));
}
