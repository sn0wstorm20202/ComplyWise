# ComplyWise: BIS Compliance Intelligence — Release & Implementation Notes

## 1. Overview & Project Objectives

ComplyWise is an enterprise-grade compliance intelligence platform engineered specifically for Indian statutory standards, Bureau of Indian Standards (BIS) Quality Control Orders (QCOs), and regulatory workflows.

This release establishes a dedicated, presentation-ready single-page landing page at the root route (`/`), while preserving the full operational compliance workspace at `/dashboard`. The design and architecture adhere to a "Serene Industrial" aesthetic—communicating quiet authority, engineering rigor, and transparent active development.

---

## 2. Design System & Aesthetic Direction ("Serene Industrial")

- **Tone & Mood**: Minimal, architectural, quiet, confident, and industrial. Avoids generic SaaS tropes, neon gradients, saturated accent buttons, and AI hype buzzwords.
- **Color Tokens**:
  - **Base Canvas**: `#fcfcfb` (warm off-white stone).
  - **Primary Text**: `#18181b` (deep charcoal / near-black).
  - **Secondary & Caption Text**: `#52525b` / `#71717a` (muted slate and stone).
  - **Accents**: Sparse deep muted navy (`#1e3a8a`) for BIS institutional authority, and muted sage/emerald (`#10b981`) for live status indicators.
  - **Dividers & Structural Borders**: Subtle 1px stone hairlines (`#e4e4e7` / `border-stone-200/80`).
- **Layout Philosophy**: Open editorial structure with ample breathing space (`py-20 md:py-28`) and thin hairline borders rather than heavy, repetitive boxed cards.

---

## 3. Transparent Development-Stage Messaging

The interface communicates deliberate forward momentum without over-promising or presenting work-in-progress as fully settled:
- **Navbar Status Pill**: *"Platform in active development"* with a subtle pulsing status dot.
- **Hero Announcement**: *"ComplyWise is evolving · More compliance intelligence, workflows and connected capabilities are under continuous development"*.
- **Preview Frame Chrome**: Window chrome badge labeled *"Platform Artifact · Active Build"*.
- **Closing Footer Statement**: *"Building the future of connected compliance, one capability at a time. · Platform in active development"*.

---

## 4. Frontend Component Breakdown

All landing page components are modularized under `frontend/components/landing/`:

### 1. `LandingNavbar.tsx`
- Minimal top bar featuring the ComplyWise logo mark with an industrial BIS tag.
- Quick navigation anchor links: `Product`, `Standards`, `BIS Agent`, `Roadmap`.
- Live status indicator: *"Platform in active development"*.
- Actions: Direct link to *"Explore Workspace"* (`/dashboard`) and *"Request Demo"* modal trigger.

### 2. `HeroSection.tsx`
- Eyebrow tag: `BIS COMPLIANCE INTELLIGENCE`.
- Exact Headline: *"Stay ahead of compliance. Understand what applies. Act with confidence."*
- Subheading: *"ComplyWise brings BIS standards, requirements, documents and regulatory intelligence into one connected workspace."*
- Primary CTA: *"Explore ComplyWise"* (smooth scroll) and secondary *"View Platform"* (direct link to `/dashboard`).

### 3. `HeroProductPreview.tsx`
- Simulated browser window chrome (`app.complywise.in/dashboard`, security badge, active build indicator).
- Embedded live preview demonstrating core operational metrics:
  - 82% Statutory Compliance Health Index.
  - 3 Urgent Operational Deadlines (QCO enforcement dates, NABL renewal).
  - Priority Action Cards (Draft audit preparation for IS 1293:2019, Calibration gap analysis).
  - Grounded BIS Agent query input.

### 4. `ValueStrip.tsx`
- Clean horizontal typographic strip replacing boxed card grids.
- Highlights the 6 foundational product pillars:
  - *Standards*, *Requirements*, *Documents*, *Evidence*, *Workflows*, *BIS Agent*.

### 5. `ValueProposition.tsx`
- Editorial 2-column breakdown detailing the three operational phases:
  - **01 — Understand**: Dynamic mapping from industrial parameters to mandatory BIS standards and Gazette Quality Control Orders.
  - **02 — Analyse**: Direct linking between factory test reports, calibration certificates, and specific standard clauses.
  - **03 — Act**: Clearance step workflows, milestone tracking, and audit-ready statutory dossiers.

### 6. `StandardsHierarchySection.tsx`
- Visualizes the 5-tier technical data structure:  
  `STANDARD → VERSION → CLAUSE → REQUIREMENT → EVIDENCE`
- Interactive clause inspector toggles between:
  - **IS 3055:2024** (Third Edition) — Clause 4.1 Dielectric & Insulation Resistance.
  - **IS 1293:2019** — Clause 7.2 Mechanical Impact and Drop Ingress.
- Exposes clause-level requirement text, verification frequency, and verified evidence artifacts.

### 7. `AgentSection.tsx`
- Intelligent, grounded search interface focused on regulatory retrieval.
- Interactive query presets:
  - *“What does IS 3055:2024 require?”*
  - *“Which documents are required for this certification?”*
  - *“Which clause covers calibration accuracy?”*
- Structured outputs featuring clause citations, confidence metrics, and linked operational workflows.

### 8. `PlatformOverviewSection.tsx`
- Bridges the landing page to the operational dashboard.
- Highlights unified management of requirements, deadlines, documents, and regulatory updates.
- Prominent action button: *"Explore Workspace"*.

### 9. `WhatsNextSection.tsx` (Roadmap)
- Details the next phase of technical deliverables with active stage badges:
  - **Connected Compliance Workflows** (`In development`): Multi-step state pollution and BIS Manakonline clearance automation.
  - **Deeper Regulatory Intelligence** (`Expanding`): Automated Gazette of India text diffing for QCO impact analysis.
  - **Expanded BIS Standards Coverage** (`Being built`): Broadening packs across industrial machinery, chemicals, polymers, and steel.
  - **Evidence & Requirement Tracking** (`In development`): NABL test verification and one-click surveillance audit dossiers.

### 10. `FinalCTA.tsx`
- Dignified dark charcoal closing invitation (`#18181b`).
- Headline: *"Compliance is easier when the right information is connected."*
- Clear action: *"Request a Demo"* with early-access partner evaluation note.

### 11. `LandingFooter.tsx`
- Minimal footer with branding, internal anchor navigation, legal notes, and platform status.

### 12. `RequestDemoModal.tsx`
- Functional modal dialog enabling prospective enterprise partners to submit demonstration requests directly during presentations.

---

## 5. Workspace Integration (`/dashboard`)

The full operational application remains accessible at `/dashboard` and contains:
- Executive statutory health scoring.
- Comprehensive BIS standard library and clause navigator.
- Regulatory document vault with expiry and evidence tracking.
- Interactive BIS AI Agent assistant.
- Milestone deadline calendar and workflow tracker.

---

## 6. Build & Verification

- **Framework**: Next.js 16.3.4 (App Router) + React 19 + Tailwind CSS.
- **Compiler**: Turbopack (`next build`).
- **Static Page Generation**: 15 routes generated with 0 errors.
- **Production Deployment Target**: Vercel.
- **Production URL**: `https://frontend-woad-eight-18.vercel.app`
- **Dashboard Direct URL**: `https://frontend-woad-eight-18.vercel.app/dashboard`
