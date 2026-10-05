# ComplyWise frontend

Next.js App Router, React, TypeScript and Tailwind. The existing visual identity
and route contracts are preserved.

- `app/`: route entry points. Onboarding composes `features/onboarding`.
- `features/onboarding/OnboardingFlow.tsx`: assessment lifecycle and API sequencing.
- `features/onboarding/*Step.tsx`, `AssessmentProgress.tsx`,
  `AssessmentDecisionResults.tsx`: presentation without network calls.
- `components/`: shared UI, product primitives and the existing landing experience.
- `context/`: auth, language and active business/assessment scope.
- `lib/api/`: centralized request boundary; no provider SDK calls from the browser.
- `types/`: domain contracts; `index.ts` preserves the public `@/types` exports.
- `tests/`: Node unit tests; `e2e/`: Playwright browser regressions.

Use `npm ci`, configure `.env.local` from `.env.example`, then `npm run dev`.
The development URL is `http://localhost:3000`. Provider secrets stay backend-side.

Validation commands and backend setup are in [the repository README](../README.md).
Ownership, remaining debt and cleanup gates are in
[the structure guide](../docs/codebase-structure.md). Read `AGENTS.md` and the
installed Next.js guides before changing framework-specific behavior.
