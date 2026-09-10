# Component Anatomy & Standards — ComplyWise Design System

## Core Reusable Components

### 1. AppShell
- Frame wrapper placing the application inside an ambient desktop canvas (`#edf0f6`) with rounded corners (`rounded-3xl`), outer margin (`p-3 sm:p-5`), and crisp surface (`#f6f7fb`).
- Composes `TopBar`, `Sidebar`, and main scrollable content canvas.

### 2. TopBar
- Fixed header with left logo, segmented primary pill switcher (`Dashboard`, `Compliance`, `Reports`), avatar team cluster with `+ Add Member`, notification bell with unread indicator, mail trigger, and user profile avatar.

### 3. Sidebar
- Vertical navigation with active item enclosed in a pill container with dark square icon backplate.
- Subtle circular/square icon backing for inactive items.
- Bottom partition containing Business Profile, Settings, and Headphone support button.

### 4. Card Primitive
- Standard card: `bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/70 shadow-xs`.
- Accent card (Sage): `bg-[#d5e2d8] rounded-3xl p-5 sm:p-6`.
- Hero card (Gradient): `bg-gradient-to-b from-[#e7edf6] to-[#f0f4fa] rounded-3xl p-5 sm:p-6`.

### 5. Metric / Summary Display
- Oversized primary numbers (28px - 36px font size, semi-bold to bold) with inline label or subtitle.
- Percentage pills (`+32%`) and directional trend indicators (`↑ 2 from last week`, `↗ 3 this week`).

### 6. Chart Components
- **WeeklyActivityBarChart**: 7 rounded bars (Mon-Sun), baseline alignment, Friday highlighted in lime-yellow (`#ecfa98`), others in soft gray (`#edf0f4`).
- **SplineTrendChart**: Smooth cubic bezier curve line with area fill gradient below, discrete circular data points, Wednesday milestone with vertical guideline and floating `3 actions` lime pill.
- **BubbleClusterStatus**: Concentric/overlapping circles with dominant mint teal bubble ("82%"), top-right translucent bubble ("10%"), and bottom-left translucent bubble ("8%").
- **DoubleProgressBar**: Rounded pill progress tracks ("Verified" 72% green, "Under Review" 28% gray).
