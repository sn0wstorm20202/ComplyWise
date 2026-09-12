# Iconography Specification — ComplyWise Design System

## Icon Library & Weight
- **Library**: `lucide-react` paired with precise SVG vector glyphs where specialized (e.g. BIS emblem mark, ComplyWise folded-A mark).
- **Stroke Width**: `1.75px` default (crisp, elegant line weight).
- **Size Standards**:
  - `h-4 w-4` (16px): Sidebar items, top pill controls, inline action glyphs.
  - `h-3.5 w-3.5` (14px): Small auxiliary indicators, chevron dropdowns.
  - `h-5 w-5` (20px): Floating circular header controls, card title glyphs.

## Mapping of Reference Icons

| Location | Label / Role | Reference Appearance | Component / Vector |
|---|---|---|---|
| Top Bar Brand | ComplyWise Mark | Stylized folded black ribbon "A" | `ComplyWiseLogo.tsx` |
| Top Bar Nav | Dashboard | 4-square grid | `LayoutGrid` |
| Top Bar Nav | Compliance | Rounded document with check | `FileCheck` |
| Top Bar Nav | Reports | Flag / report | `Flag` |
| Top Bar Right | Add Member | Plus icon | `Plus` |
| Top Bar Right | Alerts | Bell with red unread circle | `Bell` |
| Top Bar Right | Messages | Envelope / mail | `Mail` |
| Sidebar Active | Dashboard | Folder / window with dark backplate | `FolderOpen` / `LayoutDashboard` in `#0f172a` box |
| Sidebar Items | Compliance | Shield with lock/document | `ShieldCheck` |
| Sidebar Items | Documents | Document with folded corner | `FileText` |
| Sidebar Items | Workflows | Branching flow nodes | `GitFork` |
| Sidebar Items | Calendar | Desk calendar | `Calendar` |
| Sidebar Items | Standards | Bullseye concentric target | `Disc` / `Target` |
| Sidebar Items | Schemes | Ribbon medal badge | `Award` |
| Sidebar Items | Updates | Circle info icon | `Info` |
| Sidebar Items | AI Assistant | Spark / lightbulb | `Sparkles` / `Bot` |
| Sidebar Bottom | Business Profile | Document list | `FileSpreadsheet` |
| Sidebar Bottom | Settings | Cog / gear | `Settings` |
| Sidebar Bottom | Support | Headphones | `Headphones` |
| Header Controls | Search | Magnifying glass in circle | `Search` |
| Header Controls | Sort / Filter | Up-down arrows in circle | `ArrowUpDown` |
| Header Controls | Date | Calendar icon + ChevronDown | `Calendar`, `ChevronDown` |
| Card Controls | Sort / Expand | Up-down arrows, diagonal arrow | `ArrowUpDown`, `ArrowUpRight` |
| Applicable Reqs | BIS Emblem | Blue & red triangle mark with "BIS" | `BISLogo.tsx` |
