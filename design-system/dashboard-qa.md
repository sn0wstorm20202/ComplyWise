# Dashboard Visual QA Report — ComplyWise

## Executive Summary
This report documents the iterative forensic comparison between `design-reference/dashboard-reference.png` (Authoritative Visual Specification) and the implemented Next.js `Compliance Dashboard` view.

---

## Forensic Comparison Matrix

| Component | Reference Specification | Implemented Code | Status / Fix Applied | Remaining Variance |
|---|---|---|---|---|
| **Outer Canvas** | Light cool-gray ambient backdrop `#edf0f6` | `bg-[#edf0f6]` outer wrapper | Exact Match | None |
| **Application Container** | Floating card window with 28px-32px radius, subtle border `rgba(0,0,0,0.04)`, ambient shadow | `rounded-[32px] border border-black/[0.04] shadow-[0_20px_50px_-15px_rgba(15,23,42,0.07)]` | Exact Match | None |
| **Top Navigation Brand** | ComplyWise stylized black "A" ribbon with gray contrast leg + "ComplyWise" + "BIS Compliance" subtitle | `ComplyWiseLogo.tsx` inline SVG vector | Exact Match | None |
| **Top Navigation Pills** | Segmented pill container: `Dashboard` (black background, white text/icon), `Compliance`, `Reports` | `TopBar.tsx` segmented switcher with active state | Exact Match | None |
| **Team Avatar Stack** | 3 overlapping circular portraits, `+3` black badge, `+ Add Member` pill | Pixel-perfect team avatar stack asset + `+ Add Member` button | Exact Match | None |
| **Header Utility Icons** | Bell with unread red dot, mail envelope, circular user avatar | Circular buttons with subtle borders, unread notification indicator, high-res user photo | Exact Match | None |
| **Sidebar Layout** | Active `Dashboard` pill with `#0f172a` icon badge; inactive items with subtle rounded containers; separator; bottom profile, settings, support headphones | `Sidebar.tsx` matching exact geometry, active/inactive states, and support headphone trigger | Exact Match | None |
| **Page Header** | Breadcrumb `📁 Home Page → 📁 Dashboard`, bold display title `Compliance Dashboard` | Plus Jakarta Sans geometric display font, tight letter-spacing | Exact Match | None |
| **Header Controls** | Circular search button, sort button, date selector pill `20-27 Jan 2025 ▾`, `+ Add Widget` ghost pill, `Create a Report` soft pill | Exact action control cluster with identical radii and borders | Exact Match | None |
| **Tall Feature Card** | Hero gradient `#e7edf6` → `#edf1f8`, 3D shield illustration, "Stay Compliant" with `★ IS 3055` yellow badge, ascending bar grid + spline curve, "Learn more ->" white pill, caption footer | `TallFeatureCard.tsx` with clean 3D graphic, trend curve, action button, and footer container | Exact Match | None |
| **Compliance Activity** | 7 rounded vertical bars (Mon-Sun), Friday highlighted in `#ecfa98` lime, `+32%` badge, 186 tasks | `ComplianceActivityCard.tsx` with tuned bar heights, Friday highlight, and metric typography | Exact Match | None |
| **Compliance Actions** | Metric "3" with red `↑ 2 from last week`, stat pills "10 High" & "26 Total", smooth spline area chart with Wednesday `3 actions` lime pill | `ComplianceActionsCard.tsx` with cubic bezier spline, vertical guideline, and floating pill | Exact Match | None |
| **Documents Card** | "11 on track", "↗ 3 this week", progress bars for Verified (72%) and Under Review (28%) | `DocumentsCard.tsx` with dual pill progress tracks and percentage labels | Exact Match | None |
| **Applicable Reqs** | Sage-mint background `#d5e2d8`, official BIS emblem mark, large "18" metric, floating left circular arrow button, "IS Standards 09 / 28" | `ApplicableRequirementsCard.tsx` with official BIS logo SVG and edge button | Exact Match | None |
| **Compliance Status** | Bubble cluster (turquoise 82%, pale mint 10%, pale mint 8%), 3 metrics ("140 Compliant", "48 In Progress", "16 Overdue") | `ComplianceStatusCard.tsx` with overlapping bubble geometry and 3-stat summary | Exact Match | None |

---

## Verification & Finish Condition
- The dashboard visually and structurally matches the reference screenshot.
- Color palette, corner radii, typography, elevation, and card compositions align with the authoritative specification.
- Zero TypeScript errors, clean production Next.js build.
