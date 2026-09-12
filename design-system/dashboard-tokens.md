# ComplyWise Dashboard Design Tokens — V2 Modern Dark Interface

Forensic design token documentation for the high-end modern dark dashboard, synthesized from Linear's 2026 design refresh, Apple's Liquid Glass materials and layout guidelines, and Vercel's precision dark interfaces.

---

## 1. Exact Color System

| Token | CSS Variable | Hex / Value | Semantic Usage |
|---|---|---|---|
| `BACKGROUND` | `--background` | `#09090B` | Deepest canvas backdrop |
| `BACKGROUND_SECONDARY` | `--background-secondary` | `#0D0E10` | App container & sidebar background |
| `SURFACE` | `--surface` | `#111214` | Primary card surfaces (Activity, Actions, Documents, Status) |
| `SURFACE_ELEVATED` | `--surface-elevated` | `#17191C` | Elevated surfaces (Feature Card, Applicable Requirements, Menus) |
| `SURFACE_HOVER` | `--surface-hover` | `#1B1D21` | Interactive control hover state |
| `BORDER_SUBTLE` | `--border-subtle` | `rgba(255, 255, 255, 0.07)` | Standard structural dividers & subtle card borders |
| `BORDER_DEFAULT` | `--border-default` | `rgba(255, 255, 255, 0.10)` | Interactive borders, card strokes, inputs |
| `BORDER_STRONG` | `--border-strong` | `rgba(255, 255, 255, 0.14)` | Focused controls, active tabs, modal borders |
| `TEXT_PRIMARY` | `--text-primary` | `#F5F5F3` | Display titles, section headings, KPI numbers |
| `TEXT_SECONDARY` | `--text-secondary` | `#A1A1AA` | Body copy, secondary labels, active navigation |
| `TEXT_TERTIARY` | `--text-tertiary` | `#71717A` | Inactive navigation, metadata, breadcrumbs, guide lines |
| `ACCENT` | `--accent` | `#6D8CFF` | Technical blue accent (applied sparingly for key highlights) |
| `ACCENT_SOFT` | `--accent-soft` | `rgba(109, 140, 255, 0.14)` | Soft accent container fill |
| `SUCCESS` | `--success` | `#75D69C` | On-track status, positive trends, verified documents |
| `WARNING` | `--warning` | `#F2C96D` | Review required, pending audits, standard badges |
| `DANGER` | `--danger` | `#ED7C7C` | Overdue actions, regulatory flags |

---

## 2. Concentric Radii System

| Element Level | Token | Value | Applied Elements |
|---|---|---|---|
| Small Controls | `rounded-[8px]` | `8px` | Icon buttons, checkboxes, tooltips, tags |
| Buttons & Inputs | `rounded-[10px]` | `10px` | Standard CTA buttons, search inputs, dropdown triggers |
| Small Cards | `rounded-[12px]` | `12px` | Documents card, Requirements card, popover menus |
| Main Surfaces | `rounded-[14px]` | `14px` | Activity card, Actions card, Status card |
| Large Feature Surfaces | `rounded-[16px]` | `16px` | Main Feature card, App shell container |
| Pills (Restricted) | `rounded-full` | `9999px` | Compact status badges, filters, tiny metadata, selected nav |

> [!NOTE]
> Inflated 24px–32px radii are eliminated to align with modern editorial precision. Pills are strictly reserved for compact metadata indicators.

---

## 3. Typography Hierarchy

- **Font Family**: Inter (`var(--font-sans)`, system-ui, -apple-system, sans-serif)
- **Hierarchy**:
  - `Page Title`: `26px–28px` (1.625rem–1.75rem), weight `600` (semibold), line-height `1.2`, letter-spacing `-0.02em`, color `#F5F5F3`
  - `Section Heading`: `18px` (1.125rem), weight `600` (semibold), line-height `1.3`, color `#F5F5F3`
  - `Card Title`: `15px–16px` (0.9375rem–1rem), weight `600` (semibold), line-height `1.35`, color `#F5F5F3`
  - `Body Copy`: `14px` (0.875rem), weight `400` (regular), line-height `1.5`, color `#A1A1AA`
  - `Metadata / Subtitle`: `12px` (0.75rem), weight `400` / `500`, line-height `1.4`, color `#71717A`
  - `Button Label`: `13px` (0.8125rem), weight `500` (medium), color `#F5F5F3`
  - `KPI Numbers`: `32px–40px` (2rem–2.5rem), weight `700` (bold), tracking `-0.03em`, color `#F5F5F3`

---

## 4. Spacing & Layout Structure

- **Desktop Content Max-Width**: `1440px` (centered or expansive layout)
- **Padding**:
  - Desktop: `32px` (`p-8`)
  - Laptop: `24px` (`p-6`)
  - Mobile: `16px` (`p-4`)
- **Sidebar Width**: `240px–248px` fixed desktop rail (subordinate, quiet, dark `#0D0E10`)
- **Top Header Height**: `64px` compact quiet bar with translucent glass (`backdrop-blur-md bg-[#09090B]/80`)
- **Grid Gap**: `16px–20px` (`gap-4` to `gap-5`)

---

## 5. Glass & Material Treatment (Apple Liquid Glass)

- **Application**: Used sparingly on navigation/control surfaces (sidebar, floating controls, popovers, segmented nav).
- **Material Specification**:
  - `background`: `rgba(255, 255, 255, 0.04–0.06)`
  - `border`: `1px solid rgba(255, 255, 255, 0.08)`
  - `backdrop-filter`: `blur(16px) saturate(120%)`
  - `box-shadow`: layered multi-stop subtle shadow: `0 4px 20px -2px rgba(0, 0, 0, 0.5)`
- Content cards remain mostly solid dark surfaces (`#111214` / `#17191C`) with crisp subtle borders (`rgba(255, 255, 255, 0.07)`).

---

## 6. Real Technical Chart Specifications

- **Stroke Width**: `2px–2.5px` smooth SVG spline
- **Endpoints**: `4.5px–5.5px` radius with subtle outer ring
- **Guide Lines**: `1px` stroke, `rgba(255, 255, 255, 0.05)` opacity
- **Peak / Highlight Indicators**: Subtle accent or lime pill anchored to data vertices
- **ViewBox**: Responsive `viewBox="0 0 300 100"` / `viewBox="0 0 200 80"` with auto-scaling

