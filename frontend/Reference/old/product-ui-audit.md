# Product UI audit and implementation

Authority: `product-ui-design-implementation.md`. Existing routes and API contracts are retained. The established landing experience is isolated from application tokens and motion.

## Inventory

| Routes | Existing surface / data | Audit finding and treatment |
| --- | --- | --- |
| `/` | PhysicalProductStory, GSAP / Lenis | Existing landing retained; no application motion or palette overrides. |
| `/auth/signin`, `/auth/sign-in`, `/login`, `/register` | AuthContext; sign-in, registration, reviewer modes / aliases | Warm focused auth surface, human copy, labelled inputs, keyboard password visibility. Aliases retained. |
| `/admin/login` | Staff-only auth API | Same light palette, operational language; shared auth session now updates before switching to the business workspace. Staff permission boundary retained. |
| `/onboarding` | Business profile, products, understanding, adaptive questions, analysis, results | Existing five-stage orchestration retained. Human introduction, conceptual progress, answered-count progress, sage selection and GSAP question transition. |
| `/dashboard` | DashboardView / business summary | Removed fabricated certificate claims and misleading report/widget actions. Attention first, supported deadlines, assessment completeness, workspace actions, disclosed intelligence. |
| `/business-profile`, `/profile` | Profile home, business selection, assessments; alias | Removed seeded directory fallback on empty live data. Persist core edits through existing profile-version API; distinguish device notes. |
| `/businesses/[id]` | Business details, profile and assessment history | Preserve assessment creation and resume routes; shared product tokens, responsive table. |
| `/compliance`, `/requirements`, `/checklist` | Compliance API, discovery candidates, trace; aliases | Requirement cards disclose evidence, jurisdiction and workflow actions inline. Remove made-up document counts, step counts and timing strip. Fix no-business infinite loading. |
| `/compliance/[id]` | Canonical requirement detail / trace | Human questions and disclosed rule detail. Failed/unknown IDs no longer show an unrelated sample requirement. Missing fee, procedure, decision and evidence metadata remain unrecorded. |
| `/documents` | Registry, real file upload / verification, portal status | Honest empty vault; actual operation progress, no simulated OCR stages; failed uploads no longer become successful local records. Accessible result and configuration dialogs. |
| `/documents/[id]` | Document detail | Resolve actual business document; remove first-sample fallback and fake download alert. Persist portal filing status through API. |
| `/workflows` | Workflow API, steps, document references, updates | Sage step rail, stable panel position, GSAP state transition, accessible step selection; existing step persistence retained. |
| `/workflows/[id]` | Case-linked workflow | Preserve generic case workflow and review synchronization; consistent product surfaces. |
| `/applications` | Existing application tracker | Retain tracking interactions; consistent visual tokens and readable table states. |
| `/cases`, `/cases/[id]` | Case generation, uploads, forms, queries, portal status | Preserve case workflows, notices and execution. Accessible portal-status dialog and operational light palette. |
| `/calendar` | Supported statutory dates, Google connection, sync | Agenda ordered by due date; explicit overdue / due-today text; remove invented remaining-days fallback; open workflow action. |
| `/notifications` | API notifications, preferences, delivery state | Empty live results remain empty; optimistic read failure restores row/count; explicit errors; restrained priority and read transitions. |
| `/standards` | Published standards search | Empty search clears previous results; error is visible; citations disclosed inline. |
| `/standards/[id]` | Standard detail | Load actual published standard by ID; no unrelated first-sample fallback. |
| `/schemes` | Matched benefits, catalogue, filtering, versions, operations | Calm token system; benefit / match first; eligibility and evidence disclosed; history / source operations preserved in accessible dialogs. |
| `/regulatory-updates`, `/regulatory-updates/[id]` | Existing illustrative update feed | Clearly label sample feed because live change monitoring is unavailable. Keep sample browsing, disclose actions; unknown IDs no longer show the first update. |
| `/assistant`, `/ai-assistant` | Source-grounded assistant; alias | Specialist context, accessible conversation log, citations, suggested queries and input. No simulated streaming or blanket verified claim. |
| `/settings` | Previously unsaved local engine controls | Replace false success with existing server notification preferences, account/business sections, device language, unsaved state and real save/error feedback. No pretend decision-engine mode. |
| `/admin` | Admin summary, businesses, review queue, decisions | Same brand, operational typography and restrained semantics. Preserve case review actions and evidence. |
| `/admin/businesses`, `/admin/businesses/[id]` | Registry, full business overview, evidence, decisions | Operational tables, accessible overview / determination dialogs; existing data and reviewer actions retained. |
| `/admin/cases`, `/admin/cases/[id]` | Queue, review packet, evidence viewer, requirements, decisions, deadlines, assignment | Correct all-cases vs queue API selection. Staff guard no longer renders children after denied access. Accessible review dialogs and anchored evidence workspace preserved. |

37 page files audited, including aliases and parameterized routes. No password-recovery route exists.

## Shared architecture

- Application-only CSS tokens for colour, spacing, typography, surfaces, radius, shadows and motion; no framework or package changes.
- One user shell with grouped workspace / intelligence / account navigation; compact operational admin shell.
- Keyboard command navigation, native dialog focus containment, Escape and focus return, mobile drawer, skip links.
- Reusable `Disclosure`, `ProductMotion`, `Overlay`, `RequirementCard` and `UploadProgress`.
- GSAP contexts clean up on unmount; all motion observes reduced-motion preferences. No continuous application scenes or scroll pinning.

## Functional scope and limits

Local backend sign-in and route rendering were inspected before changes. Stateful browser tests use deterministic API fixtures to cover success, empty, error and permission states without sending regulatory decisions or external calendar actions to a real account. Live Google OAuth/provider delivery and regulator submissions require configured external services; this frontend change does not claim to verify them. The regulatory feed remains explicitly illustrative because its backend monitoring capability is unavailable.

## Material fixes

- Failed onboarding profile/product saves retain inputs and do not advance. Question/assessment failures offer retry instead of fabricating a successful sample assessment.
- Applicability cards preserve backend decisions. Removed business-name regex filters and client-side merging of different food-safety requirements.
- An applicability count no longer becomes a readiness score. Removed invented readiness and required-document totals from orchestration fallback summaries.
- Upload results require a server-confirmed document ID and check result. Detailed document checks are disclosed behind the next step; closing the result refreshes the persisted vault. Failed portal-status saves restore the previous state.
- Missing source references remain unverified; an authority homepage cannot become a recorded evidence passage. Missing requirement-detail filing URLs remain unrecorded. Penalty text is not substituted for an application fee.
- Empty accounts stay empty. Unknown document, standard, requirement and update IDs do not show unrelated records.
- Settings persist through the existing preference API. Failed saves preserve edits; failed alert read operations restore the unread row and count.
- Failed Copilot calls retain the prompt and show an error without generating fallback advice or citations.
- Review queue navigation reloads when its query changes. Staff access, submission identity and explicit reviewer decisions are retained.
- Mobile navigation, case/business tabs, workflow rails and auth screens recompose to fit small screens. Native dialogs contain focus and restore it on close.

The existing backend, dependencies, framework configuration, global stylesheet, route URLs and API contracts are unchanged. The landing component diff only corrects two pre-existing JSX lint errors without changing their rendered text.

## Verification

- `npm run build`: passed on the final implementation (Next.js 16.3.4 production compilation, TypeScript and all 37 page routes).
- `PLAYWRIGHT_CHANNEL=msedge npx playwright test e2e/product-workspace.spec.ts e2e/landing-editorial-design.spec.ts --reporter=list`: **23 passed** against the production server.
- After the final recorded-portal guard and detail-action polish, rebuilt successfully and repeated the two affected empty-account/requirement-detail browser tests: **2 passed**. All six normalization unit checks passed again.
- The browser suite covers 14 primary product routes at 1440, 768 and 390 px, seven additional admin/detail routes on mobile, 320 px auth, keyboard navigation, dialog focus/return, reduced motion, evidence disclosure, actual save/upload responses, failed-save rollback, staff permissions and reviewer sign-in/decisions.
- Successful route/layout checks produced no browser console errors, page errors or horizontal overflow; computed application canvas is `rgb(247, 245, 239)`. Existing desktop, mobile and reduced-motion landing story checks passed.
- Local backend demo-account sign-in and desktop/mobile workspace rendering passed without console errors. Populated and error/reviewer flows are exercised with clearly illustrative, stateful fixtures.
- Six existing/new requirement-normalization unit checks passed, including full and legacy response compatibility and missing-data safeguards. Executed with the installed TypeScript transpiler and a temporary in-process resolver for the existing `@/` alias; no test-runner package added.
- ESLint for application/components/context, the changed normalization helper and associated tests: **0 errors, 348 non-blocking warnings**. Repository warning debt remains; this task does not claim a warning-free lint run.
- `git diff --check`: passed. No backend, package, framework configuration or global stylesheet changes.
