# ComplyWise — Live Selection & Investor Demo Runbook

This runbook provides the standard operating procedure (SOP) for conducting high-stakes investor presentations, stakeholder walkthroughs, and technical selection committee demonstrations.

---

## 1. Pre-Demo Setup (T-15 Minutes)

Execute the pre-demo checklist to ensure zero-latency execution and verified database state:

```bash
# 1. Verify background daemons are active
curl -I http://127.0.0.1:8000/api/v1/health/  # Expected: HTTP 200 OK
curl -I http://localhost:3000/                # Expected: HTTP 200 OK

# 2. Reset and re-seed demo data to golden state
cd E:\complience\ComplyWise
$env:USE_LOCAL_SQLITE="true"
E:\complience\_scratch\complywise-venv\Scripts\python.exe backend/demo/seed_demo_suite.py

# 3. Open Chrome in Incognito / Clean Profile
# Navigate to: http://localhost:3000/auth/signin
```

---

## 2. Live Demo Script (10-Minute Walkthrough)

### Segment 1: Quick Auth & Executive Dashboard (2 Mins)

1. **Open Sign-In Screen**: `http://localhost:3000/auth/signin`
2. **Action**: Click the **"Fast Demo Login"** button (or sign in with `demo@complywise.test` / `DemoPassword123!`).
3. **Talking Point**:
   > *"ComplyWise delivers deterministic regulatory intelligence for Indian enterprises. Instead of relying on unpredictable LLM hallucinations for legal advice, ComplyWise pairs deep statutory retrieval with a deterministic rule engine."*
4. **Dashboard View**: Note the active enterprise overview, statutory compliance health index, and urgent statutory deadlines.

---

### Segment 2: Deep Statutory Compliance — Meridian Pharma (3 Mins)

1. **Navigate to Compliance**: `http://localhost:3000/compliance?business_id=7f27ea65-f87d-4c48-9764-ae9edb14c506`
2. **Examine Action Required Tab**:
   - Highlight the **14 Action Required** obligations (11 Applicable + 3 Needs Information).
   - Point out **CDSCO Drug Manufacturing License (Form 25/28)** and **SPCB Consent to Operate (Red Category)**.
3. **Click "Why This Applies"**:
   - Opens the Provenance Modal displaying exact business facts matched (Active Pharmaceutical Ingredients, High-Pollution Effluent, 120 employees).
   - Show statutory citations from the Drugs and Cosmetics Act 1940 and Air/Water Acts.
4. **Inspect Statutory Action Links**:
   - Click the statutory action button (e.g., `🔗 CDSCO SUGAM Portal ↗` or `🔗 Gujarat SPCB XGN Portal ↗`).
   - Highlight that these lead to **real official government portals**, not placeholder pages or generic homepages.
5. **Inspect the "Audit & Inactive" Tab**:
   - Switch to **All Requirements & Discoveries** tab.
   - Show the **Quarantined Discovered Regulatory Knowledge** section: Explain how live web discoveries from official gazettes are quarantined until human review.
   - Expand the **Audit Trail: Not Applicable Obligations** collapsible:
     - Show **4 excluded rules** (e.g. Retail Sale Chemist License Form 20, Clinical Trial Phase 1 Approval).
     - Point out the deterministic justification: *"The deterministic engine verified that your business profile does not meet the statutory threshold conditions for these requirements."*

---

### Segment 3: Multi-Industry Breadth & Sector Isolation (2 Mins)

Switch between other curated scenarios to demonstrate industry versatility:

1. **VoltGrid Mobility (EV Charging)**:
   - Link: `http://localhost:3000/compliance?business_id=8a11ea65-f87d-4c48-9764-ae9edb14c507`
   - Key Laws: CEA Central Electricity Authority (EV Charging Stations) Regulations, Bureau of Energy Efficiency, BIS IS 17017 standards.
   - Highlight: Zero contamination from pharma or bio-waste rules.
2. **SilkRoute Exports (Apparel Export)**:
   - Link: `http://localhost:3000/compliance?business_id=ac33ea65-f87d-4c48-9764-ae9edb14c509`
   - Key Laws: DGFT Importer-Exporter Code, ICEGATE Customs Registration, Export Promotion Council (TEXPROCIL), FERA/FEMA Export Declarations.
   - Highlight: Pure export focus, zero heavy manufacturing factory licenses.
3. **CloudAxis Data Centres (Cloud/IT)**:
   - Link: `http://localhost:3000/compliance?business_id=bd44ea65-f87d-4c48-9764-ae9edb14c510`
   - Key Laws: CERT-In 6-Hour Cybersecurity Directive, Digital Personal Data Protection Act 2023, Critical Information Infrastructure guidelines.

---

### Segment 4: Procedural Workflows & Deadline Calendar (1.5 Mins)

1. **Navigate to Workflows**: `http://localhost:3000/workflows?business_id=7f27ea65-f87d-4c48-9764-ae9edb14c506`
   - Walk through the step-by-step roadmap for CDSCO Form 28 application.
   - Show document checklists, government fee schedules, and required affidavits.
2. **Navigate to Calendar**: `http://localhost:3000/calendar?business_id=7f27ea65-f87d-4c48-9764-ae9edb14c506`
   - Display statutory filing deadlines, annual return dates, and renewal cadences.

---

### Segment 5: Admin Control Room & Parity Scrutiny Cockpit (1.5 Mins)

1. **Navigate to Officer Sign-In**: `http://localhost:3000/auth/signin?mode=officer`
2. **Log in as Admin**: `admin@complywise.test` / `DemoPassword123!`
3. **Open Scrutiny Cockpit**:
   - `http://localhost:3000/admin?business_id=7f27ea65-f87d-4c48-9764-ae9edb14c506&tab=compliance`
4. **Key Talking Point**:
   > *"Here in the Admin Control Room, regulatory officers have complete inspectability. Notice that the legal status evaluated by Engine 2 in the officer view exactly matches the user view: 11 Applicable, 3 Needs Info, 4 Not Applicable. There is zero drift and zero discrepancy."*

---

## 3. Demo Troubleshooting & Quick Fixes

| Issue | Root Cause | Immediate Fix |
|---|---|---|
| **Stale company data in UI** | Local storage has previous demo session | Hard refresh (`Ctrl + Shift + R`) or append `?business_id=<ID>` explicitly. |
| **Port 8000 already in use** | Stray Python process | In PowerShell: `Get-Process python \| Stop-Process -Force` then restart backend. |
| **Port 3000 already in use** | Stray Bun/Node process | In PowerShell: `Get-Process bun \| Stop-Process -Force` then restart frontend. |
| **Database out of sync** | SQLite migrations needed | Run `python backend/demo/seed_demo_suite.py` to recreate golden records. |
