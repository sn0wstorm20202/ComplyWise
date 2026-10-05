# Functional hardening diagnostic — 2026-10-04

Baseline SHA e88e7248666057634d1ac807e2dc83c4bafd10cf; existing dirty tree preserved.
Native PostgreSQL/pgvector readiness succeeds; Next production server3000 and Django8000 running.
Historical reports are not treated as new test results.

| Priority | Observation / expected behavior | Root cause / reproduction | Boundary |
|---|---|---|---|
| P0 | Answering an older assessment must not merge a newer assessment's profile or mark its questions answered | save_smart_question_answers uses current_profile and all business question instances. New regression fails before fix. | onboarding services / AnswerInterpreter |
| P1 | Known workforce/activity must not be asked again | Engine supplies aliases but planning context does not. Precision Workshop saved Q_TOTAL_WORKFORCE/Q_PRIMARY_ACTIVITY despite18workers/description. Different dynamic key can bypass exact-key dedup. Four new reproductions fail before fixes. | business_context / planner |
| P1 | Explicit foreign assessment must fail closed | Planner silently substitutes latest assessment when supplied ID is not found. | planner |
| P1 | Numeric questions must render an input | Runtime saved DECIMAL type reaches wizard that renders NUMBER only. | planner / questionnaire contract |
| P1 | Standards should use the requested business and assessment | List ignores assessment query parameter; combines explicit business with active assessment from another business. | standards frontend |
| P1 | Standards service failure must not assert no standards | Error clears list then simultaneously renders empty match message. | standards frontend |
| P2 | Contextual standards must explain their origin | Precision Workshop backend returns one contextual safety suggestion, no reviewed matched standard. UI hides source_reference/why, calls sources Gazette, repeated quality cards share React key. | standards frontend / scope response |
| P1 | Editing a previously answered last question must persist | Wizard returns before save whenever all questions answered. | question wizard |
| P2 | Starter suggestions should be visible and explicitly confirmed | No suggestion metadata or wizard path exists. | starter checkpoint / question contract |
| P1 test contract | Eight historical browser scenarios rely on obsolete demo passwords/IDs, fixed15questions and exact legal outputs | Full baseline browser run reproduced failures. Tests will retain original purposes with explicit fixtures/current contracts, not restored insecure login. | browser tests |

Live independent OpenAI structured application request passed2.847s. Simulated unavailable Gemini selection followed by real OpenAI passed1.536s; simulation is not a live outage claim. Each Gemini slot simple live JSON probe passed; deeper application probes and five journeys pending.

## Verified follow-up findings

The paragraph above records the initial diagnostic checkpoint. Current evidence is in `functional-hardening-report.md`, not those initial pending statuses.

Additional reproduced defects: orchestration/later question rounds used the latest rather than requested snapshot; emergency understanding invented location/industrial obligations; negative qualifiers changed manufacturing/source searches; cooking-oil question used a hazardous-waste key; malformed provider metadata escaped classification; 25s browser abort started competing analysis; simultaneous fresh-user workspace creation returned409; legacy results invented counts/verified evidence; profile hydration and Schemes each duplicated business-list requests; hardcoded unused credential helper remained bundled; document links dropped assessment scope and called contextual planning statutory evidence.

These were corrected within existing boundaries. Snapshot/alias/provider/search regressions, five real API journeys, independent real provider probes, actual unmocked browser and current fixture browser tests distinguish runtime behavior from test contracts. All eight initial historical browser purposes were retained; no legal seed outputs or insecure accounts were restored. Final counts are recorded in task progress after the final run.

Remaining coverage finding: the existing Precision Workshop assessment has one contextual quality suggestion, no exact URL/citations and zero reviewed standard matches. That is incomplete knowledge scope, not proof that no standards exist. No fake standard was added. Live search/capture failures and empty assessment RAG responses remain visible in diagnostic artifacts. Google/delivery/storage setup and expert/deployed-service audit remain external limits.
