# Full dashboard widget restoration — 23 October 2026

## Cause and scope

The five-card dashboard in the earlier product video used `ComplianceActivityCard`, `DocumentsCard`, `ApplicableRequirementsCard`, `ComplianceActionsCard` and `ComplianceStatusCard`. Commit `b09dbf4` replaced that dashboard with a compact workspace view. Later work brought back activity, documents and tracked case status. Commit `3695459` moved those three cards before the new comparison/evidence content, but did not restore the missing applicable-requirements/standards card or actions chart. The previous restoration was incomplete.

The new `DashboardOverview` renders all five cards in the original two-row proportions: activity/documents/applicable requirements at 5/4/3 desktop columns, then actions/case status at 7/5. Smaller screens stack the cards. The attention metrics remain above them. Comparison, assessment evidence/coverage, priority actions, deadlines, completeness and the other newer sections remain below. The animated loading placeholder now follows both card rows.

## Data and interaction boundaries

- Applicable requirements use the selected assessment's `metrics.applicable_count`. Standards use the full `total_standards_count`, rather than the three-item preview. This includes contextual suggestions, so the footer says **Standards to explore**, without claiming certification or mandatory status.
- Actions use `metrics.action_required_count`, not the truncated six-item priority preview. The review filter uses needs-information plus conflict-review counts; no unsupported severity classification is invented.
- The actions line chart displays recorded workflow events over the last seven days. It does not invent historical open-action totals that the application has not recorded. Activity, uploaded documents and tracked case completion retain their existing operational data sources. Applicability is not represented as completed compliance.
- Before evaluation, assessment-derived counts remain unknown. Real zeroes after an evaluation remain zero. Neither restored card has a default sample dataset.
- Card navigation carries both the selected business and assessment in the URL. The requirements/actions, standards, documents and workflow destinations retain that context.
- This is a frontend-only change. It reads fields already in the bootstrap response and adds no dashboard API request or provider call. Backend, worker, database, immutable assessment history and judging scenarios are unchanged.

## Validation

Frontend source: `45a8a5413a5b9fcfbfa69583fc5da4de5727b589`.

TypeScript and targeted lint passed. Three rendered-component regression checks passed: all five cards with full totals exceeding preview lengths; an unevaluated account with unknown assessment counts and real operational values; and a completed evaluation with zero matches. The test uses a 27-action total with only six preview entries, nine standards with only three previews, and two uploads distinct from 40 required documents.

The [production image build](https://github.com/sn0wstorm20202/ComplyWise/actions/runs/39980588662) passed. Azure successfully deployed only the frontend image for this source revision at the unchanged public hostname. The temporary build credential was removed afterward.

Live browser verification found all five cards. Meridian showed **11 applicable requirements**, **14 actions to review** and **3 needing information/review**; toggling the action filter showed 3, then returning to all actions showed 14. The requirements destination loaded the same saved assessment and its 14 action-required items. The standards destination retained the same business/assessment and correctly showed no reviewed matches for this saved case. Both destinations retained the explicit assessment ID in the URL.

At a 1,275 px viewport, the first three cards shared the top row and the remaining two shared the second. There was no horizontal page overflow. The overview ended at y=1,075 and evidence began at y=1,183, confirming evidence remained after the complete overview. In the existing narrow browser tab, all five cards remained present and the actions/case-status cards stacked without clipped content. Both tabs were restored to the original Meridian dashboard, and the user's existing tab was refreshed.

[Raw screenshots, layout observations, navigation URLs and deployment metadata](architecture-evidence/dashboard-five-widgets-2026-10-23/) record the checks. These are layout/interaction checks, not new latency or capacity benchmarks.
