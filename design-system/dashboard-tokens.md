# ComplyWise Dashboard Design Tokens

Forensic design token documentation derived directly from `design-reference/dashboard-reference.png`.

---

## 1. Color Palette

| Token | Name | HEX | RGB | Usage |
|---|---|---|---|---|
| `BACKGROUND` | Canvas Slate Background | `#edf0f6` | `rgb(237, 240, 246)` | Outer desktop canvas backdrop |
| `BACKGROUND_CARD` | Floating Application Surface | `#f6f7fb` | `rgb(246, 247, 251)` | Main floating application window background |
| `SURFACE` | Pure White Card Surface | `#ffffff` | `rgb(255, 255, 255)` | Activity, Actions, Documents, and Status card surfaces |
| `SURFACE_ACCENT` | Sage Mint Surface | `#d5e2d8` | `rgb(213, 226, 216)` | Applicable Requirements card background |
| `SURFACE_GRADIENT_START` | Ice Blue Surface Start | `#e7edf6` | `rgb(231, 237, 246)` | Tall Feature card gradient start (top) |
| `SURFACE_GRADIENT_END` | Ice Blue Surface End | `#edf1f8` | `rgb(237, 241, 248)` | Tall Feature card gradient end (bottom) |
| `SURFACE_MUTED` | Light Slate Pill Fill | `#f1f5f9` | `rgb(241, 245, 249)` | Inactive pills, date picker, dropdowns, unselected bars |
| `SURFACE_ACTIVE_NAV` | Active Nav Item Background | `#eceff3` | `rgb(236, 239, 243)` | Sidebar active nav pill container |
| `BORDER` | Ultra-Subtle Border | `#0000000a` | `rgba(0, 0, 0, 0.04)` | Card borders and divider lines |
| `BORDER_MUTED` | Neutral Slate Border | `#e2e8f0` | `rgb(226, 232, 240)` | Button borders, modal dividers, progress bar track |
| `TEXT_PRIMARY` | Slate 950 High Contrast | `#020617` | `rgb(2, 6, 23)` | Dashboard title, card titles, main KPI numerals |
| `TEXT_SECONDARY` | Slate 700 Dark Text | `#334155` | `rgb(51, 65, 85)` | Navigation labels, filter text, table headers |
| `TEXT_MUTED` | Slate 400 Muted Label | `#94a3b8` | `rgb(148, 163, 184)` | Subtitles ("This week", "Open Actions"), inactive days |
| `ACCENT_PRIMARY` | Dark Slate / Charcoal | `#0f172a` | `rgb(15, 23, 42)` | Active tab pill, active icon container, spline chart stroke |
| `ACCENT_SECONDARY` | Bright Lime Yellow | `#ecfa98` | `rgb(236, 250, 152)` | Friday peak activity bar, "+32%" pill, "3 actions" floating pill |
| `ACCENT_BADGE` | Soft Gold / Yellow | `#fef08a` | `rgb(254, 240, 138)` | "★ IS 3055" feature badge |
| `SUCCESS` | Turquoise Health Bubble | `#82ded8` | `rgb(130, 222, 216)` | Central 82% compliance health bubble |
| `SUCCESS_MINT` | Mint Document Bar | `#cce3d8` | `rgb(204, 227, 216)` | Verified documents progress bar fill |
| `SUCCESS_EMERALD` | Emerald Indicator | `#10b981` | `rgb(16, 185, 129)` | "+3 this week" positive delta indicator |
| `WARNING` | Amber Alert | `#f59e0b` | `rgb(245, 158, 11)` | Medium priority actions and pending audit flags |
| `DANGER` | Rose / Red Alert | `#ef4444` | `rgb(239, 68, 68)` | "↑ 2 from last week" delta pill and overdue counts |
| `INFO` | Statutory Blue | `#3b82f6` | `rgb(59, 130, 246)` | Official gazette references and info markers |

---

## 2. Typography

- **Font Family**: Plus Jakarta Sans (`var(--font-plus-jakarta-sans)`, sans-serif)
- **Hierarchy**:
  - `Display / Dashboard Title`: `32px` (2rem), font-weight `700` (bold), line-height `1.15`, letter-spacing `-0.03em`
  - `Card Header Title`: `16px` (1rem), font-weight `700` (bold), line-height `1.3`, letter-spacing `-0.015em`
  - `Hero KPI Numeral (Large)`: `48px` (3rem) to `56px` (3.5rem), font-weight `800` (extrabold), tracking `-0.04em`
  - `Standard KPI Numeral`: `30px` (1.875rem), font-weight `700` (bold), tracking `-0.025em`
  - `Metric Subtitle`: `12px` (0.75rem), font-weight `500` (medium), color `#94a3b8`
  - `Pill / Badge Label`: `11px` (0.6875rem) to `12px` (0.75rem), font-weight `700` (bold)
  - `Body / Explanatory Text`: `12px` (0.75rem) to `13px` (0.8125rem), font-weight `400` / `500`, line-height `1.5`

---

## 3. Geometry & Radii

| Element | Radius Token | Value | Visual Intent |
|---|---|---|---|
| Floating App Window | `rounded-[32px]` | `32px` | Soft exterior framing floating on canvas |
| Dashboard Cards | `rounded-[28px]` | `28px` | Modern pill-inspired card geometry |
| Active Nav Pill Box | `rounded-2xl` | `16px` | Nested sidebar active container |
| Active Icon Container | `rounded-xl` | `12px` | Sharp, balanced dark icon badge |
| Action Buttons & Pills | `rounded-full` | `9999px` | Circular pill buttons (`Date`, `Widget`, `Pill Nav`) |
| Icon Buttons | `rounded-full` | `9999px` | `40px` and `32px` circular controls |
| Activity Chart Bars | `rounded-full` | `9999px` | Cylindrical pill bars with full top & bottom radius |
| Document Progress Bars| `rounded-full` | `9999px` | Smooth capsule progress meters |

---

## 4. Spacing & Structural Dimensions

| Structural Dimension | Value | Tailwind Class | Notes |
|---|---|---|---|
| Desktop Canvas Padding | `24px` | `p-6` | Gap between screen edge and floating window |
| Floating Window Max Width | `1600px` | `max-w-[1600px]` | Centered desktop bounds |
| Sidebar Width (Desktop) | `240px` | `w-60` | Fixed width navigation rail |
| Top Header Height | `64px` | `h-16` | Fixed height sticky top bar |
| Main Card Padding | `24px` | `p-6` | Uniform inner card padding |
| Grid Gap | `20px` | `gap-5` | Gap between the 3 asymmetric columns |
| Card Row Height (Middle/Right) | `280px` | `h-[280px]` | Equal height horizontal alignment |
| Tall Feature Card Height | `580px` | `min-h-[580px]` | Double height span matching right columns |
| Circular Control Size | `40px` / `32px`| `h-10 w-10` / `h-8 w-8` | Action bar vs card header icon buttons |

---

## 5. Shadows & Elevation

- `APP_SHELL_SHADOW`: `0 20px 50px -15px rgba(15, 23, 42, 0.07)` — ambient float off desktop canvas
- `CARD_SHADOW`: `0 1px 3px 0 rgba(0, 0, 0, 0.02), 0 1px 2px -1px rgba(0, 0, 0, 0.02)` (`shadow-xs`)
- `PILL_SHADOW`: `0 1px 2px 0 rgba(0, 0, 0, 0.04)` (`shadow-2xs`)
- `DROPDOWN_SHADOW`: `0 10px 25px -5px rgba(0, 0, 0, 0.08)`
