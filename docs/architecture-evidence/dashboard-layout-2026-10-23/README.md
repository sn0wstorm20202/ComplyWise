# Dashboard section order — 23 October 2026

Restored the original dashboard opening: business header, attention metrics, then the three existing workspace graph cards. The saved-assessment comparison link and evidence/coverage panel now follow the graphs. Graph styles, data, links and assessment behaviour are unchanged.

Frontend source: `369545920c131bd09dda544fcc876c72e2838f02`.

- TypeScript `--noEmit`: passed.
- Targeted DashboardView ESLint: zero errors; one pre-existing unused `dashboardData` warning.
- [Production image build](https://github.com/sn0wstorm20202/ComplyWise/actions/runs/39964778751): successful.
- Azure frontend update: Succeeded, using that source image. Backend and worker deployments were not changed.
- Public URL retained: `https://complywise-frontend.bravesand-4d6fbaeb.eastasia.azurecontainerapps.io`.
- Live browser verification: metrics precede graphs; graphs precede comparison; comparison precedes evidence. See browser-verification.json and dashboard.png.
- Temporary registry build credential removed from GitHub after the build.
