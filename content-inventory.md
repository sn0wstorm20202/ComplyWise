# ComplyWise — Complete Landing Page Content Inventory

> **Document Status**: Production Source of Truth  
> **Extraction Mode**: Verbatim Copy Mapping (No Rewrites, Edits, or Paraphrasing)  
> **Target Scope**: Live ComplyWise Scrollytelling Landing Page  
> **Source Directory**: `frontend/components/landing/` & `frontend/app/`  
> **Date Generated**: October 2026

---

## 0. Extraction Notes & Architectural Overview

1. **Extraction Fidelity**: All visible strings, typographical marks, symbols (such as `•`, `✓`, `—`, `&bull;`, `&rarr;`, `&ldquo;`, `&plusmn;`), line-breaks, dynamic state strings, form labels, and user-facing accessibility labels were extracted verbatim directly from the live React components.
2. **Current Component Architecture**:
   - The landing page root is located at [`frontend/app/page.tsx`](file:///O:/Project/branches/ComplyWise/frontend/app/page.tsx), which renders [`frontend/components/landing/LandingPage.tsx`](file:///O:/Project/branches/ComplyWise/frontend/components/landing/LandingPage.tsx).
   - `LandingPage.tsx` orchestrates the Lenis smooth-scroll manager, custom desktop magnetic cursor, floating pill navigation, 9 consecutive scrollytelling narrative chapters, interactive simulated workspace, audit governance pipelines, FAQ accordion, expanding circular CTA, footer, and technical intake modal.
3. **Superseded Unrendered Components**: Earlier static editorial sections (`HeroSection.tsx`, `LandingNavbar.tsx`, `CapabilityCardGrid.tsx`, `CapabilityList.tsx`, `ManifestoSection.tsx`, `MetricsSection.tsx`, `TrustSection.tsx`, `ValueProposition.tsx`, `StandardsHierarchySection.tsx`, `WhatsNextSection.tsx`, `AgentSection.tsx`) remain in the repository but are **not mounted** in `LandingPage.tsx`. Their status is detailed in Section 21.

---

## 1. Global Navigation

### 1.1 Desktop Floating Capsule Navigation
* **Component**: [`frontend/components/landing/FloatingNav.tsx`](file:///O:/Project/branches/ComplyWise/frontend/components/landing/FloatingNav.tsx)
* **DOM Location**: Fixed top capsule (`header.fixed.top-5.z-50`)

| UI Element | Exact Copy | Link Target / Action | Notes / Formatting |
| :--- | :--- | :--- | :--- |
| **Brand Monogram** | `CW` | `/` | Charcoal circular badge (`bg-[#171714] text-[#F7F5EF] font-mono`) |
| **Brand Name** | `ComplyWise` | `/` | Semi-bold sans-serif (`text-[13.5px] font-semibold`) |
| **Brand Descriptor** | `Statutory Intel` | N/A | Monospace uppercase tag (`font-mono text-[9px] uppercase tracking-[0.16em]`) |
| **Nav Item 1** | `Product` | `#story` | Links to Chapter 01 (Business Context Scene) |
| **Nav Item 2** | `How It Works` | `#mechanism` | Links to Chapter 03 (Regulatory Discovery Scene) |
| **Nav Item 3** | `Evidence` | `#evidence` | Links to Chapter 05 (Evidence & Provenance Scene) |
| **Nav Item 4** | `FAQ` | `#faq` | Links to Chapter 10 (Frequently Asked Questions Accordion) |
| **Secondary CTA** | `Sign In` | `/auth/signin` | Text link to client portal |
| **Primary CTA** | `Explore Workspace` | `/dashboard` | Capsule button with `ArrowUpRight` icon |
| **Mobile Menu Toggle** | N/A (`Menu` / `X` icon) | Toggles mobile drawer state | `aria-label="Toggle navigation menu"` |

---

### 1.2 Mobile Drawer Navigation
* **Component**: [`frontend/components/landing/FloatingNav.tsx`](file:///O:/Project/branches/ComplyWise/frontend/components/landing/FloatingNav.tsx)
* **DOM Location**: Mobile overlay drawer (`div.fixed.inset-0.z-40.lg:hidden`)

| UI Element | Exact Copy | Link Target / Action | Notes / Formatting |
| :--- | :--- | :--- | :--- |
| **Section Header** | `Navigation` | N/A | Monospace uppercase (`text-[10px] tracking-[0.2em]`) |
| **Nav Item 1** | `Product` | `#story` | Serif 2xl link |
| **Nav Item 2** | `How It Works` | `#mechanism` | Serif 2xl link |
| **Nav Item 3** | `Evidence & Provenance` | `#evidence` | Serif 2xl link |
| **Nav Item 4** | `Frequently Asked Questions` | `#faq` | Serif 2xl link |
| **Secondary Button** | `Sign In to ComplyWise` | `/auth/signin` | Full-width rounded outline button |
| **Primary Button** | `Explore Workspace` | `/dashboard` | Full-width rounded solid button with `ArrowUpRight` icon |

---

## 2. Hero Section

* **Component**: [`frontend/components/landing/HeroStory.tsx`](file:///O:/Project/branches/ComplyWise/frontend/components/landing/HeroStory.tsx)
* **DOM Location**: `#hero`

### 2.1 Initial Static Content
| UI Element | Exact Copy | Typography & Hierarchy | Source Reference |
| :--- | :--- | :--- | :--- |
| **Top Peripheral Bar (Left)** | `CENTRAL GOVERNMENT • MAHARASHTRA JURISDICTION` | Monospace `11px`, tracking `0.16em`, uppercase, sage indicator dot | Lines 106–110 |
| **Top Peripheral Bar (Center)**| `EST. 2026 • STATUTORY RULE ENGINE` | Monospace `11px`, tracking `0.16em`, uppercase | Line 111 |
| **Top Peripheral Bar (Right)** | `EVIDENCE-GROUNDED • VERSIONED` | Monospace `11px`, tracking `0.16em`, uppercase, `ShieldCheck` icon | Lines 112–115 |
| **Eyebrow Status Pill** | `Scroll-Driven Product Story` | Monospace `11px`, tracking `0.2em`, uppercase, pulsing green indicator dot | Lines 122–125 |
| **Hero Headline** | `Behind every business is a rulebook.` | Serif display `clamp(2.75rem,7vw,6.2rem)`, italicized accent on `rulebook.` (`text-[#557D6B]`) | Lines 129–135 |
| **Supporting Copy** | `ComplyWise turns business context into a clear map of the rules, approvals, laboratory standards, and statutory actions that matter.` | Sans-serif `clamp(1rem,1.35vw,1.25rem)`, light weight, relaxed leading | Lines 138–144 |
| **Primary Action CTA** | `Explore Workspace` | Solid charcoal pill button with `ArrowUpRight` in circle | Lines 151–159 |
| **Secondary Action CTA** | `Watch How It Thinks` | Outlined pill button with `ArrowDown` icon, links to `#story` | Lines 161–167 |
| **Card Footnote Bar (Left)** | `STORY PHASE: INTAKE → DISCOVERY` | Monospace `11px`, uppercase, muted | Line 289 |
| **Card Footnote Bar (Right)** | `SCROLL TO BEGIN SCROLLYTELLING FILM` | Monospace `11px`, uppercase, muted | Line 290 |

---

### 2.2 Living Product Film Preview Card (Dynamic States 01 to 05)
* **Container Header Bar**: `LIVING MECHANISM • STEP {activeStep + 1} OF 5` (Lines 177–180)
* **Stepper Dots Accessibility**: `aria-label="Go to step {step + 1}"` (Lines 185–195)
* **Cycle Mechanism**: Automatically cycles every 3,800ms or advances via manual click on indicator dots.

#### State 01 — Natural Context
| Element | Exact Text |
| :--- | :--- |
| **State Label** | `STATE 1 — NATURAL CONTEXT` |
| **Blockquote** | `“We manufacture temperature-control equipment in Maharashtra.”` |

#### State 02 — Canonical Facts Extracted
| Element | Exact Text |
| :--- | :--- |
| **State Label** | `STATE 2 — CANONICAL FACTS EXTRACTED` |
| **Pill 1** | `LOCATION: MAHARASHTRA` |
| **Pill 2** | `ACTIVITY: MANUFACTURING` |
| **Pill 3** | `PRODUCT: TEMPERATURE EQUIPMENT` |
| **Pill 4** | `ENTITY: PRIVATE LIMITED` |

#### State 03 — Statutory Relevance Mapping
| Element | Exact Text | Status / Styling |
| :--- | :--- | :--- |
| **State Label** | `STATE 3 — STATUTORY RELEVANCE MAPPING` | Monospace `10px` |
| **Badge 1** | `BIS MANDATE (ACTIVE)` | Sage background, bold (`bg-[#DCEAE2] text-[#557D6B]`) |
| **Badge 2** | `FACTORIES ACT (ACTIVE)` | Sage background, bold (`bg-[#DCEAE2] text-[#557D6B]`) |
| **Badge 3** | `MINING CODES (BYPASSED)` | Faint, strikethrough (`line-through opacity-60`) |
| **Badge 4** | `TELECOM 3GPP (BYPASSED)` | Faint, strikethrough (`line-through opacity-60`) |

#### State 04 — Decision-Critical Fact Missing
| Element | Exact Text |
| :--- | :--- |
| **Warning Pill** | `DECISION-CRITICAL FACT MISSING` (with `HelpCircle` icon, dusty rose background) |
| **Headline** | `Scale Threshold Required to Evaluate MSME Exemption` |
| **Description** | `Without annual turnover, Rule-014 testing mandates cannot be confirmed.` |

#### State 05 — Targeted Adaptive Question
| Element | Exact Text |
| :--- | :--- |
| **State Label** | `STATE 5 — TARGETED ADAPTIVE QUESTION` |
| **Headline** | `“What is your annual turnover?”` |
| **Resolution Badge**| `User inputs ₹18 Cr → Evaluates directly into Rule-014` (with `Sparkles` icon) |

---

## 3. Chapter 01 — Understand & Canonical Extraction

* **Component**: [`frontend/components/landing/BusinessStoryScene.tsx`](file:///O:/Project/branches/ComplyWise/frontend/components/landing/BusinessStoryScene.tsx)
* **DOM Location**: `#story`
* **Trigger**: Pinning timeline `start: "top top", end: "+=160%"`

### 3.1 Left Column Narrative
| UI Element | Exact Copy |
| :--- | :--- |
| **Chapter Pill** | `CHAPTER 01 • UNDERSTAND` (with `Compass` icon) |
| **Headline** | `Where do we start?`<br>`With the business, not the regulation.` (`With the business,` in italics) |
| **Body Paragraph** | `Industrial compliance fails when businesses are forced into rigid, generic forms. ComplyWise extracts canonical operational facts directly from your real plant footprint.` |
| **Technical Label** | `TRANSFORMATION: NATURAL LANGUAGE → STRUCTURED FACTS` (with `Layers` icon) |

### 3.2 Right Column Card Structure
| UI Element | Exact Copy |
| :--- | :--- |
| **Card Header (Left)** | `BUSINESS INTAKE OBJECT` |
| **Card Header (Right)**| `SCENE 1.1 • CANONICAL EXTRACTION` |
| **Card Footer (Left)** | `EVALUATION STATUS: FACT EXTRACTION COMPLETED` |
| **Card Footer (Right)**| `STEP 01 OF 07` |

### 3.3 Right Column Dynamic Scroll States
#### State A: Natural Context Input
| Element | Exact Text |
| :--- | :--- |
| **Subhead** | `NATURAL CONTEXT INPUT` |
| **Blockquote** | `“We manufacture industrial temperature measurement apparatus and thermal sensors in Maharashtra, employing 84 staff across two licensed workshops.”` |
| **Microcopy** | `Raw operational profile submitted without regulatory pre-classification.` |

#### State B: Structured Canonical Profile
| Field Label | Field Value | Visual State |
| :--- | :--- | :--- |
| `LOCATION` | `Maharashtra` | Neutral card |
| `ENTITY TYPE` | `Private Limited` | Neutral card |
| `PRIMARY ACTIVITY` | `Manufacturing` | Neutral card |
| `PRODUCT SCOPE` | `Temperature Apparatus` | Neutral card |
| `WORKFORCE` | `84 Personnel` | Neutral card |
| `ANNUAL TURNOVER` | `MISSING (?)` | Warning card (dusty rose highlight `#F1DFDC`) |

#### State C: Decision-Critical Unknown Detected
| Element | Exact Text |
| :--- | :--- |
| **Pill** | `DECISION-CRITICAL UNKNOWN DETECTED` (with `HelpCircle` icon) |
| **Headline** | `Turnover threshold dictates whether MSME exemptions or mandatory BIS ISI marking apply.` |
| **Description** | `The system refrains from speculative guesswork. It isolates the exact variable that determines the statutory decision boundary.` |
| **Next Prompt** | `TRIGGERING ADAPTIVE QUESTION NEXT` (with `ArrowRight` icon) |

---

## 4. Chapter 02 — Adaptive Question & Branch Update

* **Component**: [`frontend/components/landing/AdaptiveQuestionScene.tsx`](file:///O:/Project/branches/ComplyWise/frontend/components/landing/AdaptiveQuestionScene.tsx)
* **DOM Location**: Sticky scene 2
* **Trigger**: Pinning timeline `start: "top top", end: "+=130%"`

### 4.1 Left Column Narrative
| UI Element | Exact Copy |
| :--- | :--- |
| **Chapter Pill** | `CHAPTER 02 • ADAPTIVE QUESTION` (with `HelpCircle` icon) |
| **Headline** | `Why ask every business`<br>`the same questions?` (`the same questions?` in italics) |
| **Body Paragraph** | `Instead of 80 tedious boilerplate questions, ComplyWise prompts exclusively for decision-critical variables that have the power to trigger or exempt statutory rules.` |
| **Technical Label** | `DYNAMIC FACT RESOLUTION • ZERO SPECULATION` (with `GitBranch` icon) |

### 4.2 Right Column Adaptive Engine Card
| UI Element | Exact Copy |
| :--- | :--- |
| **Card Header (Left)** | `ADAPTIVE PROMPT ENGINE` |
| **Card Header (Right)**| `VARIABLE: MSME_TURNOVER_BRACKET` |
| **Prompt Pill** | `PROMPT 01 OF 01 (TARGETED)` |
| **Question Headline** | `“What is your audited annual turnover for the current financial year?”` |
| **Answer Pill (Left)** | `ANSWER RECORDED: ₹18.00 Cr` (with checkmark `Check` icon) |
| **Answer Pill (Right)**| `MEDIUM ENTERPRISE` |
| **Routing Label** | `STATUTORY PATH ROUTING` |
| **Routing Status** | `RULE PATH UPDATED` (with `Sparkles` icon) |
| **Branch Item 1** | `MICRO/SMALL ENTERPRISE EXEMPTION (RULE-008)` / `BYPASSED` (strikethrough) |
| **Branch Item 2** | `QUALITY CONTROL ORDER MANDATE (RULE-014)` / `ACTIVATED` (sage highlight) |
| **Branch Explanation**| `Because turnover exceeded the ₹5 Cr threshold, the mandatory BIS licensing schedule is triggered deterministically.` |
| **Card Footer (Left)** | `STATUS: DECISION-CRITICAL INPUT SATISFIED` |
| **Card Footer (Right)**| `STEP 02 OF 07` |

---

## 5. Chapter 03 — Regulatory Discovery & Ingestion Pipeline

* **Component**: [`frontend/components/landing/RegulatoryDiscoveryScene.tsx`](file:///O:/Project/branches/ComplyWise/frontend/components/landing/RegulatoryDiscoveryScene.tsx)
* **DOM Location**: `#mechanism`
* **Trigger**: Pinning timeline `start: "top top", end: "+=150%"`

### 5.1 Left Column Narrative
| UI Element | Exact Copy |
| :--- | :--- |
| **Chapter Pill** | `CHAPTER 03 • REGULATORY DISCOVERY` (with `Search` icon) |
| **Headline** | `Order emerging from`<br>`regulatory complexity.` (`regulatory complexity.` in italics) |
| **Body Paragraph** | `India's regulatory landscape is scattered across weekly extraordinary gazettes, bureau circulars, and departmental orders. ComplyWise indexes, normalizes, and reranks these sources into unified statutory knowledge.` |
| **Technical Label** | `CENTRAL • STATE NOTIFICATION REPOSITORY` (with `Database` icon) |

### 5.2 Right Column Ingestion Pipeline Card
| UI Element | Exact Copy |
| :--- | :--- |
| **Card Header (Left)** | `STATUTORY INGESTION PIPELINE` |
| **Card Header (Right)**| `SOURCE: CENTRAL REPOSITORY 2026.4` |
| **Input Section Label**| `SCATTERED OFFICIAL SOURCES (INPUT)` |
| **Source 1** | `GAZETTE OF INDIA` • `2024`<br>`S.O. 1284(E) Quality Control Order` |
| **Source 2** | `BUREAU OF STANDARDS` • `2024`<br>`IS 3055:2024 Metrology Apparatus` |
| **Source 3** | `STATE NOTIFICATION` • `2025`<br>`Maharashtra Industrial Safety Order` |
| **Source 4** | `LABOUR MINISTRY` • `2026`<br>`Occupational Safety Code Rules` |
| **Pipeline Bar** | `NORMALIZE → FILTER → RETRIEVE → RERANK` |
| **Knowledge Header** | `KNOWLEDGE OBJECT: QCO_MANDATE_IS3055` / `VERSION 2026.4` |
| **Knowledge Excerpt** | `Scattered gazette clauses consolidated into machine-evaluable statutory terms: mandatory standard IS 3055, BIS Scheme I factory inspection schedule, and NABL accredited test scopes.` |
| **Card Footer (Left)** | `RESULT: OFFICIAL NOTIFICATIONS CONSOLIDATED` |
| **Card Footer (Right)**| `STEP 03 OF 07` |

---

## 6. Chapter 04 — Deterministic Rule Engine (Rule-014)

* **Component**: [`frontend/components/landing/RuleDecisionScene.tsx`](file:///O:/Project/branches/ComplyWise/frontend/components/landing/RuleDecisionScene.tsx)
* **DOM Location**: Sticky scene 4
* **Trigger**: Pinning timeline `start: "top top", end: "+=150%"`

### 6.1 Left Column Narrative
| UI Element | Exact Copy |
| :--- | :--- |
| **Chapter Pill** | `CHAPTER 04 • DETERMINISTIC RULE ENGINE` (with `Cpu` icon) |
| **Headline** | `The rule executes against`<br>`verified facts.` (`verified facts.` in italics) |
| **Body Paragraph** | `No probability. No hallucinated legal interpretations. The normalized statutory rule checks thresholds, environmental conditions, and exceptions to produce an audit-grade decision.` |
| **Technical Label** | `DETERMINISTIC EVALUATION • ZERO SPECULATION` (with `ShieldCheck` icon) |

### 6.2 Right Column Rule Evaluation Card
| UI Element | Exact Copy |
| :--- | :--- |
| **Card Header (Left)** | `EVALUATING RULE-014` |
| **Card Header (Right)**| `SCHEME: BIS_SCHEME_I_QCO` |
| **Code Comment** | `// STATUTORY EVALUATION LOGIC` |
| **Code Line 1** | `IF facility_type == 'MANUFACTURING'` |
| **Code Line 2** | `AND product_category == 'TEMPERATURE_EQUIPMENT'` |
| **Code Line 3** | `AND annual_turnover >= 50000000 /* ₹5 Cr MSME Threshold */` |
| **Code Line 4** | `THEN mandate = 'BIS_ISI_SCHEME_I_MANDATORY'` |
| **Checklist Item 1** | `TURNOVER THRESHOLD` / `✓ (₹18 Cr)` |
| **Checklist Item 2** | `FACILITY MATCH` / `✓ (MFG Bay)` |
| **Checklist Item 3** | `EXEMPTIONS` / `— (None)` |
| **Checklist Item 4** | `EFFECTIVE DATE` / `✓ (Current)` |
| **Decision Badge** | `APPLICABLE` (with `CheckCircle2` icon) |
| **Decision Status** | `STATUTORY REQUIREMENT` |
| **Decision Summary** | `Manufacturing operations trigger mandatory Quality Control Order testing under IS 3055:2024.` |
| **Source Citation** | `Source: Gazette of India S.O. 1284(E) • Verified Repository 2026.4` |
| **Card Footer (Left)** | `RESULT: DETERMINISTIC APPLICABILITY ESTABLISHED` |
| **Card Footer (Right)**| `STEP 04 OF 07` |

---

## 7. Chapter 05 — The Evidence Chain & Provenance

* **Component**: [`frontend/components/landing/EvidenceStoryScene.tsx`](file:///O:/Project/branches/ComplyWise/frontend/components/landing/EvidenceStoryScene.tsx)
* **DOM Location**: `#evidence`
* **Trigger**: GSAP ScrollTrigger `start: "top 80%", end: "bottom 30%"`

### 7.1 Section Header
| UI Element | Exact Copy |
| :--- | :--- |
| **Chapter Pill** | `CHAPTER 05 • THE EVIDENCE CHAIN` (with `FileText` icon) |
| **Headline** | `Can I see why the system decided this?`<br>`Every decision is backed by traceable evidence.` (`Every decision is backed by traceable evidence.` in italics) |
| **Body Paragraph** | `Statutory compliance requires evidentiary proof for auditors, testing labs, and executive boards. Watch how official text extracts directly into an actionable operational task.` |

### 7.2 Left Column Provenance Chain
| Stage Number & Label | Exact Value |
| :--- | :--- |
| `01 OFFICIAL SOURCE` | `Gazette Notification S.O. 1284(E)` |
| `02 RELEVANT CLAUSE` | `IS 3055:2024 Section 4.1 Metrological Scope` |
| `03 NORMALIZED RULE` | `Rule-014 Mandatory Laboratory Quality Plan` |
| `04 APPLICABILITY TEST` | `Medium Scale Manufacturing Scope Matched` |
| `05 DECISION` | `APPLICABLE • Immediate Compliance Mandate` |

### 7.3 Right Column Official Statutory Record Excerpt
| UI Element | Exact Copy |
| :--- | :--- |
| **Header (Left)** | `OFFICIAL STATUTORY RECORD` |
| **Header (Right)** | `GAZETTE NOTIFICATION EXCERPT` |
| **Blockquote** | `“No person shall manufacture, import, distribute, or sell any temperature apparatus unless it conforms to Indian Standard IS 3055:2024 (Clause 4.1 Metrological Scale Accuracy ±0.1°C) and bears the Standard Mark under licence from the Bureau of Indian Standards.”` |
| **Metadata (Left)** | `JURISDICTION: CENTRAL (DPIIT)` |
| **Metadata (Right)**| `STATUS: VERIFIED & SOURCE-LINKED` |

### 7.4 Right Column Synthesized Compliance Action Item
| UI Element | Exact Copy |
| :--- | :--- |
| **Header Label** | `SYNTHESIZED COMPLIANCE ACTION ITEM` (with `Sparkles` icon) |
| **Urgency Badge** | `ACTION REQUIRED` |
| **Action Title** | `Initiate NABL Primary Calibration Test Dossier (IS 3055 Clause 4.1)` |
| **Action Description**| `Required document: Calibration certificate within 12-month validity from an accredited laboratory prior to BIS Scheme I factory audit.` |
| **Assignment** | `ASSIGNED TO: QUALITY ASSURANCE TEAM` |
| **Target Window** | `TARGET WINDOW: 45 DAYS →` |

---

## 8. Chapter 06 — The Architectural Truth

* **Component**: [`frontend/components/landing/TrustPrincipleScene.tsx`](file:///O:/Project/branches/ComplyWise/frontend/components/landing/TrustPrincipleScene.tsx)
* **DOM Location**: `#principle`

### 8.1 Section Header & Earned Principle Tag
| UI Element | Exact Copy |
| :--- | :--- |
| **Chapter Pill** | `CHAPTER 06 • THE ARCHITECTURAL TRUTH` (with `ShieldCheck` icon) |
| **Subtitle Tag** | `EARNED PRINCIPLE: SEPARATION OF COGNITION AND DETERMINISM` |

### 8.2 4 Architectural Layers Grid
| Layer Role | Exact Copy Description | Icon Reference |
| :--- | :--- | :--- |
| `AI LAYER` | `Understands natural business context, discovers unknowns, and explains legal reasoning.` | `Cpu` |
| `VERIFIED KNOWLEDGE` | `Source-linked official gazettes, indexed bureau standards, and effective dates.` | `Database` |
| `DETERMINISTIC ENGINE` | `Executes exact numerical thresholds, territorial scope, and statutory exemptions.` | `ShieldCheck` |
| `AUDIT-READY OUTCOME` | `Actionable testing schedules, factory STI plans, and verifiable evidence dossiers.` | `CheckCircle2` |

### 8.3 Earned Climax Statements
| UI Element | Exact Copy |
| :--- | :--- |
| **Prefatory Lead** | `AI assists the process. Verified knowledge grounds it. The rules decide.` |
| **Climax Headline**| `The rules decide.`<br>`The AI explains.` (`The AI explains.` in italics) |
| **Closing Justification**| `This core separation is why ComplyWise delivers defensible regulatory clarity rather than speculative AI conversations.` |

---

## 9. Chapter 07 — Interactive Product Workspace

* **Component**: [`frontend/components/landing/WorkspaceStoryScene.tsx`](file:///O:/Project/branches/ComplyWise/frontend/components/landing/WorkspaceStoryScene.tsx)
* **DOM Location**: `#workspace`

### 9.1 Section Header
| UI Element | Exact Copy |
| :--- | :--- |
| **Chapter Pill** | `CHAPTER 07 • PRODUCT PAYOFF` (with `Layers` icon) |
| **Headline** | `Decisions turn into`<br>`operational action.` (`operational action.` in italics) |
| **Body Paragraph** | `Every evaluated requirement seamlessly populates your active compliance workspace with assigned owners, testing schedules, and audit-ready dossiers.` |
| **Header CTA Button** | `Launch Live Workspace` (with `ArrowUpRight` icon, links to `/dashboard`) |

### 9.2 Workspace Shell Bar & Tab Controls
| UI Element | Exact Copy |
| :--- | :--- |
| **Client / Plant Label**| `Apex Industrial Electro-Mechanicals Ltd. • MH Unit 01` |
| **Status Indicator** | `LIVE ACTIVE WORKSPACE` (with pulsing sage dot) |
| **Tab 1** | `Compliance` (icon: `ShieldCheck`) |
| **Tab 2** | `Documents` (icon: `FileText`) |
| **Tab 3** | `Workflows` (icon: `GitBranch`) |
| **Tab 4** | `Calendar` (icon: `Calendar`) |
| **Tab 5** | `Schemes` (icon: `Award`) |
| **Tab 6** | `Standards` (icon: `Layers`) |

---

### 9.3 Tab Views Content

#### Tab 1: Compliance
| Element | Exact Copy | Link / Status |
| :--- | :--- | :--- |
| **View Header** | `ACTIVE APPLICABLE MANDATES (3)` / `SORTED BY URGENCY` | N/A |
| **Card 1 Tag** | `RULE-014` • `IS 3055:2024 • BIS SCHEME I` | Sage tag |
| **Card 1 Title** | `Mandatory Factory Laboratory Quality Plan & STI Adherence` | Title |
| **Card 1 Status** | `APPLICABLE` | Links to `/compliance` |
| **Card 2 Tag** | `RULE-028` • `FACTORIES ACT SEC 40` | Muted tag |
| **Card 2 Title** | `Annual Industrial Fire Safety & Electrical Inspection Audit` | Title |
| **Card 2 Status** | `VERIFIED ANNUAL` | Links to `/compliance` |

#### Tab 2: Documents
| Element | Exact Copy | Status Tag |
| :--- | :--- | :--- |
| **View Header** | `STATUTORY EVIDENCE DOSSIERS (4)` / `VERIFICATION AUDIT STATUS` | N/A |
| **Dossier 1** | `FORM V PART II`<br>**Title**: `Technical Dossier & Plant Layout`<br>**Description**: `Signed manufacturing layout with designated calibration bay.` | `VERIFIED` |
| **Dossier 2** | `NABL CERT`<br>**Title**: `Primary Bath Calibration Logs`<br>**Description**: `Traceable accuracy to national temperature standards.` | `VALID 11 MOS` |
| **Dossier 3** | `STI ADHERENCE`<br>**Title**: `Scheme of Testing & Inspection`<br>**Description**: `Mandatory quality plan awaiting factory lead digital sign-off.` | `PENDING SIGN` |

#### Tab 3: Workflows
| Element | Exact Copy | Status Tag |
| :--- | :--- | :--- |
| **View Header** | `ACTIVE COMPLIANCE WORKFLOWS` / `PROGRESS: 66% COMPLETED` | N/A |
| **Workflow Title** | `BIS ISI Mark Certification Workflow (IS 3055)` | `STEP 2 OF 3 IN PROGRESS` |
| **Milestone 1** | `1. FACTORY GAP AUDIT`<br>`Completed on 2026-03-15` | Completed (`CheckCircle2` icon) |
| **Milestone 2** | `2. DOSSIER SUBMISSION`<br>`Under review by lead auditor` | In Progress (`Clock` icon) |
| **Milestone 3** | `3. ONSITE BIS VERIFICATION`<br>`Awaiting window confirmation` | Pending |

#### Tab 4: Calendar
| Element | Exact Copy | Deadline Status |
| :--- | :--- | :--- |
| **View Header** | `UPCOMING STATUTORY DEADLINES` / `TIME HORIZON: Q2-Q3 2026` | N/A |
| **Event 1 Date** | `15 MAY` | Calendar icon block |
| **Event 1 Details** | `BIS Scheme I Advance Marking Fee Challan`<br>`Statutory payment deadline` | `42 DAYS REMAINING` |
| **Event 2 Date** | `30 JUN` | Calendar icon block |
| **Event 2 Details** | `Annual Hazardous Waste Environmental Return (Form 4)`<br>`State Pollution Control Board` | `88 DAYS REMAINING` |

#### Tab 5: Schemes
| Element | Exact Copy |
| :--- | :--- |
| **View Header** | `ELIGIBLE INDUSTRIAL SCHEMES & SUBSIDIES` / `MATCHED TO TURNOVER: ₹18 CR` |
| **Scheme Category** | `MSME TECHNOLOGY UPGRADATION (CLCSS)` |
| **Eligibility Tag** | `POTENTIALLY ELIGIBLE` |
| **Scheme Title** | `15% Capital Subsidy on Precision Testing Lab Apparatus` |
| **Scheme Details** | `Direct government reimbursement for upgrading temperature test benches to meet mandatory Quality Control Order laboratory specifications.` |

#### Tab 6: Standards
| Element | Exact Copy |
| :--- | :--- |
| **View Header** | `INDEXED BUREAU STANDARDS & QCOS` / `SOURCE-LINKED GAZETTE ARCHIVE` |
| **Standard Number** | `IS 3055:2024 (PART II)` |
| **Mandate Status** | `ACTIVE STATUTORY MANDATE` |
| **Standard Title** | `Industrial Temperature Measurement Instruments — Metrological Standards` |
| **Standard Details**| `Prescribes constructional tolerances, thermal shock resistance, and primary calibration intervals under Gazette Order S.O. 1284(E).` |

---

## 10. Chapter 08 — Industrial Coverage

* **Component**: [`frontend/components/landing/CoverageScene.tsx`](file:///O:/Project/branches/ComplyWise/frontend/components/landing/CoverageScene.tsx)
* **DOM Location**: `#coverage`

### 10.1 Section Header & Jurisdiction Badges
| UI Element | Exact Copy |
| :--- | :--- |
| **Chapter Pill** | `CHAPTER 08 • INDUSTRIAL COVERAGE` (with `MapPin` icon) |
| **Headline** | `Supported Jurisdictions & Sectors` |
| **Body Paragraph** | `Engineered specifically for the Indian manufacturing ecosystem, covering harmonized Central Government gazettes and Maharashtra industrial estates.` |
| **Jurisdiction Tag 1** | `CENTRAL GOVERNMENT` |
| **Jurisdiction Tag 2** | `MAHARASHTRA STATE` |

### 10.2 Supported Sectors Grid (8 Sectors)
| Sector # & Status | Sector Name | Standards Reference | Mandate Tag |
| :--- | :--- | :--- | :--- |
| `SECTOR 01` • `ACTIVE` | `Electrical & Electronics` | `IS 1293 / IS 302 / IS 15885` | `Mandatory QCO Regime` |
| `SECTOR 02` • `ACTIVE` | `Industrial Machinery & Metrology` | `IS 3055 / Heavy Plant Safety` | `Bureau Licensing Scheme I` |
| `SECTOR 03` • `ACTIVE` | `Automotive Components` | `AIS / BIS Auto Safety Orders` | `Component Certification` |
| `SECTOR 04` • `ACTIVE` | `Chemicals & Petrochemicals` | `Pesticides & Polymer Orders` | `Mandatory Bureau Mark` |
| `SECTOR 05` • `ACTIVE` | `Food & Beverage Processing` | `FSSAI Statutory Mandates` | `State & Central Licensure` |
| `SECTOR 06` • `ACTIVE` | `Pharmaceuticals & Medical Devices`| `CDSCO / Good Manufacturing Practice` | `Schedule M Adherence` |
| `SECTOR 07` • `ACTIVE` | `Textiles & Technical Fabrics` | `Geo-textiles & Safety Wear QCOs` | `DPIIT Mandatory Orders` |
| `SECTOR 08` • `ACTIVE` | `Clean Tech & EV Battery Storage` | `AIS 156 / IS 16046 Safety Codes` | `Thermal Runaway Mandates` |

---

## 11. Chapter 09 — Human Verification Pipeline & Audit Governance

* **Component**: [`frontend/components/landing/VerificationScene.tsx`](file:///O:/Project/branches/ComplyWise/frontend/components/landing/VerificationScene.tsx)
* **DOM Location**: `#verification`

### 11.1 Section Header
| UI Element | Exact Copy |
| :--- | :--- |
| **Chapter Pill** | `CHAPTER 09 • AUDIT GOVERNANCE` (with `ShieldCheck` icon) |
| **Headline** | `Human Verification Pipeline` |
| **Body Paragraph** | `What prevents the knowledge layer from becoming a black box? Every rule in ComplyWise passes through expert human review before it ever executes on a business profile.` |

### 11.2 5-Step Pipeline
| Step # | Title | Description | Icon |
| :--- | :--- | :--- | :--- |
| `01` | `AI Ingestion Pre-Check` | `Extracts clauses, numerical thresholds, dates, and penalty provisions from official gazette PDFs.` | `Eye` |
| `02` | `Evidence Provenance Review` | `Links raw text directly to permanent statutory gazette identifiers (S.O. numbers and standard clauses).` | `Layers` |
| `03` | `Human Legal Verification` | `In-house compliance specialists review scope definitions, effective dates, and exemption boundaries.` | `UserCheck` |
| `04` | `Published Knowledge Ingestion` | `Only peer-verified provisions enter the immutable production knowledge repository.` | `ShieldCheck` |
| `05` | `Deterministic Rule Evaluation` | `Evaluates production business profiles with zero speculative guesswork.` | `CheckCircle2` |

### 11.3 Verification Integrity Protocol Checklist
* **Header**: `VERIFICATION INTEGRITY PROTOCOL`
* **Item 1**: `Source gazette authenticity verified against government repository`
* **Item 2**: `Statutory amendment version and revision number checked`
* **Item 3**: `Enforcement and grace period effective dates reviewed`
* **Item 4**: `Applicability conditions and threshold boundary criteria validated`

---

## 12. FAQ Section (Section 05 — Clarifications)

* **Component**: [`frontend/components/landing/FAQSection.tsx`](file:///O:/Project/branches/ComplyWise/frontend/components/landing/FAQSection.tsx)
* **DOM Location**: `#faq`

### 12.1 Section Header
| UI Element | Exact Copy |
| :--- | :--- |
| **Chapter Label** | `05 — CLARIFICATIONS` |
| **Headline** | `Frequently Asked Questions` |
| **Body Paragraph** | `Answers regarding our deterministic rule engine, evidence verification, and compliance workflow architecture.` |

### 12.2 Accordion Items
| # | Question | Answer |
| :--- | :--- | :--- |
| **1** | `How does ComplyWise determine applicability?` | `ComplyWise separates fact-finding from decision logic. Business activities, production thresholds, and machinery parameters are gathered through structured intake. These facts are then evaluated by deterministic rule engines directly derived from statutory gazette notifications and BIS Quality Control Orders. The AI assists in translating queries, but deterministic rules make the final legal determination.` |
| **2** | `What happens when a required operational fact is missing?` | `The system never assumes or guesses unknown parameters. Instead, ComplyWise flags the item as 'Fact Dependent' and presents targeted, non-legalistic follow-up questions (such as boiler capacity, chemical volume, or storage conditions) necessary to definitively trigger or exempt the provision.` |
| **3** | `How is regulatory evidence verified and kept audit-ready?` | `Every identified requirement links directly to its statutory origin: official gazette number, clause reference, effective implementation date, and prescribed testing authority (such as NABL-accredited laboratory scopes or BIS Scheme I schedules). Decisions form a tamper-evident audit dossier.` |
| **4** | `Which jurisdictions and sectors are currently covered?` | `ComplyWise supports Central Government mandates (including DPIIT QCOs, BIS Standards, Ministry of Environment guidelines, and Central Labour Codes) alongside harmonized State frameworks, starting with Maharashtra industrial estates and expanding across all major manufacturing hubs.` |
| **5** | `Does ComplyWise replace professional legal counsel?` | `No. ComplyWise is an industrial regulatory intelligence and workflow system. It equips manufacturing executives, quality heads, and in-house compliance officers with structured evidentiary maps, eliminating the preliminary 80% manual research so legal and technical teams can execute with immediate clarity.` |
| **6** | `How are new gazette notifications and amendments handled?` | `The ComplyWise Central Repository indexes gazette notifications, draft standards, and deadline extensions on a continuous synchronization cycle. When an amendment alters a threshold or grace period, affected operational workspaces receive immediate impact warnings.` |

---

## 13. Final CTA (Section 06 — Next Step)

* **Component**: [`frontend/components/landing/FinalCTA.tsx`](file:///O:/Project/branches/ComplyWise/frontend/components/landing/FinalCTA.tsx)
* **DOM Location**: Section `FinalCTA`

| UI Element | Exact Copy | Interaction / Action | Notes / Formatting |
| :--- | :--- | :--- | :--- |
| **Chapter Label** | `06 — NEXT STEP` | N/A | Monospace `11px`, tracking `0.2em` |
| **Headline** | `Turn regulatory complexity into a clear next step.` | N/A | Serif display `clamp(2.5rem,6vw,5.5rem)`, italicized accent on `clear next step.` (`text-[#557D6B]`) |
| **Supporting Copy** | `Experience deterministic compliance intelligence designed for the scale and precision of modern Indian industry.` | N/A | Sans-serif light text `max-w-lg mx-auto` |
| **Signature Circular Expanding CTA** | `Explore`<br>`Workspace` | Links to `/dashboard` | Circular magnetic expanding button (`h-44 w-44 sm:h-52 sm:w-52 rounded-full`) with sage hover fill expansion and `ArrowUpRight` circle |
| **Auxiliary Link** | `Request personalized technical walkthrough →` | Triggers `RequestDemoModal` | Underlined monospace button (`text-xs uppercase tracking-[0.16em]`) |

---

## 14. Footer

* **Component**: [`frontend/components/landing/LandingFooter.tsx`](file:///O:/Project/branches/ComplyWise/frontend/components/landing/LandingFooter.tsx)
* **DOM Location**: `footer`

| UI Element | Exact Copy | Link Target / Action | Notes |
| :--- | :--- | :--- | :--- |
| **Brand Monogram** | `CW` | N/A | Circular black badge |
| **Brand Title** | `ComplyWise` | N/A | Bold sans-serif |
| **Manifesto Tagline**| `The rules decide. The AI explains. Deterministic statutory intelligence and audit-grade operational dossiers for Indian industry.` | N/A | Editorial summary copy |
| **Repository Version**| `CENTRAL REPOSITORY • SYSTEM 2026.4` | N/A | Monospace metadata |
| **Column 1 Header** | `Platform` | N/A | Monospace uppercase |
| **Column 1 Link 1** | `Compliance Workspace` | `/dashboard` | Platform link |
| **Column 1 Link 2** | `Diagnostic Intake` | `/onboarding` | Platform link |
| **Column 1 Link 3** | `Statutory Standards Index` | `/standards` | Platform link |
| **Column 1 Link 4** | `BIS Schemes & Subsidies` | `/schemes` | Platform link |
| **Column 2 Header** | `Governance & Trust` | N/A | Monospace uppercase |
| **Column 2 Link 1** | `Deterministic Philosophy` | `#manifesto` | Hash link |
| **Column 2 Link 2** | `Provenance & Citation Integrity` | `#trust` | Hash link |
| **Column 2 Link 3** | `Client Portal Sign In` | `/auth/signin` | Portal auth link |
| **Column 2 Link 4** | `Request Technical Demonstration` | Triggers modal | Interactive button |
| **Copyright Notice** | `© 2026 ComplyWise. All rights reserved.` | N/A | Dynamic year via `new Date().getFullYear()` |
| **Jurisdiction Stamp**| `JURISDICTION: IN-CENTRAL • MH` | N/A | Monospace `11px` |
| **Status Beacon** | `ALL SYSTEMS VERIFIED` | N/A | Sage indicator dot (`bg-[#7FAF9A]`) |

---

## 15. Technical Briefing Modal (Request Demo Modal)

* **Component**: [`frontend/components/landing/RequestDemoModal.tsx`](file:///O:/Project/branches/ComplyWise/frontend/components/landing/RequestDemoModal.tsx)
* **Trigger**: Triggered by `onSeeWhatApplies` across FloatingNav, FinalCTA, and LandingFooter.

### 15.1 Header & Instructions
| UI Element | Exact Copy |
| :--- | :--- |
| **Monogram** | `CW` |
| **Modal Title** | `See What Applies — Technical Intake` |
| **Modal Subtitle** | `Statutory Intelligence Briefing` |
| **Close Button Label** | `Close modal` (`aria-label="Close modal"`) |
| **Exploratory Intro** | `Connect with our compliance solutions engineering team to review your plant footprint, applicable BIS Quality Control Orders, and mandatory testing schedules.` |

### 15.2 Intake Form Fields & Placeholders
| Field Label | Input Type | Placeholder / Default | Options (if select dropdown) |
| :--- | :--- | :--- | :--- |
| `Full Name` | Text (Required) | `e.g. Dr. Vikramaditya Sharma` | N/A |
| `Corporate Email` | Email (Required) | `name@enterprise.com` | N/A |
| `Enterprise / Plant Name` | Text (Required) | `e.g. Apex Industrial Electro-Mechanicals Ltd.` | N/A |
| `Manufacturing Category` | Select Dropdown | `Electrical Appliances & Equipment` (default state) | 1. `Electrical Accessories & Plugs (IS 1293)`<br>2. `Household Electrical Appliances (IS 302)`<br>3. `Information Technology Goods (CRS Scheme II)`<br>4. `LED & Electronic Controlgear (IS 15885)`<br>5. `Heavy Machinery & Industrial Equipment`<br>6. `Chemicals, Petrochemicals & Polymers` |

### 15.3 Action Buttons & Success Confirmation Screen
| UI Element | Exact Copy |
| :--- | :--- |
| **Cancel Button** | `Cancel` |
| **Submit Button** | `Request Technical Briefing` (with `ArrowUpRight` icon) |
| **Success Icon** | `CheckCircle2` (sage background) |
| **Success Title** | `Technical Request Received` |
| **Success Message** | `Thank you, {formData.fullName}. Our industrial compliance solutions lead will reach you at {formData.email} within one business day.` |
| **Success Reset Button**| `Return to ComplyWise` |

---

## 16. SEO & Root Document Metadata

* **Component**: [`frontend/app/layout.tsx`](file:///O:/Project/branches/ComplyWise/frontend/app/layout.tsx)
* **Document Attributes**: `html lang="en"`

| Metadata Field | Exact Value |
| :--- | :--- |
| **Document Title (`title`)** | `ComplyWise — Deterministic Regulatory Intelligence for Indian Industry` |
| **Meta Description (`description`)** | `Statutory precision for Indian industry. Unified Quality Control Orders, testing dossiers, and deterministic rule engines.` |
| **Display Typography Variable** | `--font-display: Playfair Display, Cormorant Garamond, Georgia, serif` |
| **Body Typography Variable** | `--font-inter: Inter, system-ui, -apple-system, sans-serif` |
| **Monospace Typography Variable** | `--font-mono: JetBrains Mono, monospace` |

---

## 17. Video, Snapshot & Asset-Embedded Text

An inspection of the assets directory (`public/`) and CSS definitions reveals:
- **No Embedded Raster Text**: There are no raster graphic banners, JPEG/PNG images with baked-in marketing text, or hard-coded video overlays on the landing page.
- **Pure Code Rendering**: All visual objects (cards, pills, checklists, code blocks, dossiers, calendar widgets) are rendered in pure React DOM with Tailwind CSS and GSAP animations.
- **Vector Icons**: Lucide icon glyphs (`ArrowUpRight`, `ArrowDown`, `ShieldCheck`, `Sparkles`, `HelpCircle`, `Compass`, `Layers`, `GitBranch`, `Search`, `Database`, `Filter`, `Cpu`, `CheckCircle2`, `FileText`, `CheckSquare`, `Calendar`, `Award`, `MapPin`, `UserCheck`, `Eye`, `Plus`, `X`, `Building2`, `Mail`, `User`, `Clock`, `ExternalLink`, `Menu`) provide visual semantics alongside explicit text strings.
- **Inline SVG Grain**: [`frontend/app/globals.css`](file:///O:/Project/branches/ComplyWise/frontend/app/globals.css#L220-L222) contains an SVG filter (`feTurbulence`) for procedural paper grain texture with zero textual content.

---

## 18. Global Microcopy & Recurring Phrases

| Recurring Phrase / Token | Usage Contexts |
| :--- | :--- |
| `CW` | Monogram badge in FloatingNav, Modal header, Footer |
| `The rules decide. The AI explains.` | Trust Principle climax, Footer manifesto |
| `APPLICABLE` | RuleDecisionScene outcome badge, Workspace applicable mandate card |
| `CENTRAL GOVERNMENT • MAHARASHTRA JURISDICTION` | Hero top bar, CoverageScene tags, Footer metadata bar |
| `EST. 2026 • STATUTORY RULE ENGINE` | Hero top bar |
| `CENTRAL REPOSITORY • SYSTEM 2026.4` | Regulatory Discovery source, Rule evaluation source, Footer metadata bar |
| `DETERMINISTIC EVALUATION • ZERO SPECULATION` | RuleDecisionScene, AdaptiveQuestionScene |
| `Explore Workspace` | FloatingNav desktop & mobile, Hero CTA, FinalCTA circular button |

---

## 19. Content Source Map & Architecture

| Section / Story Scene | Component File | Line Range | Live DOM Selector | Lifecycle State |
| :--- | :--- | :--- | :--- | :--- |
| **Global Shell** | `LandingPage.tsx` | 1–85 | `div.relative.min-h-screen` | Mounted Root |
| **Floating Nav** | `FloatingNav.tsx` | 1–236 | `header.fixed.top-5` | Fixed, Scroll-reactive (`>40px`) |
| **Hero Story** | `HeroStory.tsx` | 1–300 | `section#hero` | Loaded + 3.8s State Cycle |
| **Scene 01: Understand** | `BusinessStoryScene.tsx` | 1–209 | `section#story` | Pinned GSAP ScrollTrigger |
| **Scene 02: Adaptive Q** | `AdaptiveQuestionScene.tsx` | 1–180 | `section` | Pinned GSAP ScrollTrigger |
| **Scene 03: Discovery** | `RegulatoryDiscoveryScene.tsx` | 1–184 | `section#mechanism` | Pinned GSAP ScrollTrigger |
| **Scene 04: Rule Engine** | `RuleDecisionScene.tsx` | 1–180 | `section` | Pinned GSAP ScrollTrigger |
| **Scene 05: Evidence** | `EvidenceStoryScene.tsx` | 1–178 | `section#evidence` | Scrubbed GSAP ScrollTrigger |
| **Scene 06: Trust Truth** | `TrustPrincipleScene.tsx` | 1–142 | `section#principle` | Scrubbed GSAP ScrollTrigger |
| **Scene 07: Workspace** | `WorkspaceStoryScene.tsx` | 1–369 | `section#workspace` | Interactive React Tab State |
| **Scene 08: Coverage** | `CoverageScene.tsx` | 1–111 | `section#coverage` | Static Grid |
| **Scene 09: Verification** | `VerificationScene.tsx` | 1–120 | `section#verification` | Static Grid + Checklist |
| **Scene 10: FAQ** | `FAQSection.tsx` | 1–122 | `section#faq` | Interactive Accordion State |
| **Scene 11: Final CTA** | `FinalCTA.tsx` | 1–123 | `section` | Scroll-triggered Reveal |
| **Footer** | `LandingFooter.tsx` | 1–137 | `footer` | Static Grid + Metadata |
| **Demo Modal** | `RequestDemoModal.tsx` | 1–219 | `div.fixed.inset-0.z-50` | Conditional State Modal |

---

## 20. Dynamic Content & Interactive State Mapping

| Dynamic Component | Number of States | Triggers / Transition Logic | Default / Initial State Shown |
| :--- | :--- | :--- | :--- |
| **Hero Story Preview** | 5 States | 3,800ms timer or direct click on stepper indicators | State 1: Natural context blockquote |
| **Scene 01 (Business)** | 3 States | User scroll progression (`0% → 50% → 100%`) | State A: Raw business narrative input |
| **Scene 02 (Adaptive Q)** | 3 States | User scroll progression (`0% → 50% → 100%`) | State 1: Targeted question box |
| **Scene 03 (Discovery)** | 3 States | User scroll progression (`0% → 50% → 100%`) | State 1: 4 scattered official sources |
| **Scene 04 (Rule Engine)**| 3 States | User scroll progression (`0% → 50% → 100%`) | State 1: Rule evaluation logic |
| **Scene 07 (Workspace)** | 6 Views | Click on tab pills (`compliance`, `documents`, `workflows`, `calendar`, `schemes`, `standards`) | Active view: `compliance` (3 applicable mandates) |
| **FAQ Accordion** | 6 Items | Click toggle on individual question rows | Item 0 (`How does ComplyWise determine applicability?`) expanded by default |
| **Technical Modal** | 2 Screens | Form submission event | Screen 1: Intake form; Screen 2: Confirmation screen with user full name & email |

---

## 21. Content That Could Not Be Extracted / Superseded Legacy Modules

All visible copy rendered on the live landing page has been 100% extracted.

For complete repository transparency, the following legacy components were preserved in the codebase from an earlier static iteration but are **not rendered** in `LandingPage.tsx`:
1. `HeroSection.tsx`: Predecessor static hero with headline *"The rules decide. The AI explains."*
2. `LandingNavbar.tsx`: Predecessor navbar containing legacy links (*Architecture*, *Painter*, *System*, *Diagnostic*).
3. `CapabilityCardGrid.tsx` & `CapabilityList.tsx`: Predecessor feature cards.
4. `ManifestoSection.tsx`: Predecessor standalone manifesto block.
5. `MetricsSection.tsx`: Predecessor numerical statistics strip (*99.4%*, *4,200+*, *48 hrs*).
6. `TrustSection.tsx`: Predecessor trust grid.
7. `ValueProposition.tsx` & `ValueStrip.tsx`: Predecessor comparison tables.
8. `StandardsHierarchySection.tsx`: Predecessor hierarchy diagram.
9. `WhatsNextSection.tsx` & `AgentSection.tsx`: Predecessor pipeline cards.

None of the copy from these unmounted files appears on the live user-facing landing page.

---
*End of Content Inventory Source of Truth.*
