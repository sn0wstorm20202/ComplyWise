# Design System Tokens — ComplyWise

## Overview
The ComplyWise Design System establishes an enterprise-grade, high-fidelity visual and structural standard reconstructed directly from `design-reference/dashboard-reference.png`.

## Core Token Architecture

### 1. Canvas & Frame Tokens
- `--canvas-bg`: `#edf0f6` (Ambient desktop background)
- `--app-window-bg`: `#f6f7fb` (Application main container surface)
- `--app-window-border`: `rgba(0, 0, 0, 0.04)`
- `--app-window-radius`: `28px` (Large rounded container corners)
- `--app-window-shadow`: `0 20px 40px -15px rgba(15, 23, 42, 0.08)`

### 2. Card Surfaces
- `--card-bg`: `#ffffff` (Pure white for Activity, Documents, Actions, Status)
- `--card-border`: `rgba(226, 232, 240, 0.7)` (Ultra-subtle border)
- `--card-radius`: `24px` (`rounded-3xl`)
- `--card-shadow`: `0 2px 10px -2px rgba(15, 23, 42, 0.03)`
- `--card-sage`: `#d5e2d8` (Applicable Requirements accent card)
- `--card-hero-start`: `#e7edf6` (ComplyWise tall feature card gradient top)
- `--card-hero-end`: `#f0f4fa` (ComplyWise tall feature card gradient bottom)

### 3. Brand & Accent Tokens
- `--brand-black`: `#0f172a` (Primary dark buttons, active badges, headings)
- `--brand-blue`: `#2563eb` (3D Shield & primary brand emphasis)
- `--accent-lime`: `#ecfa98` / `#eefbaa` (Weekly highlights, `+32%`, `3 actions` pill)
- `--accent-lime-dark`: `#273a0e` (Text on lime surfaces)
- `--accent-teal`: `#82ded8` / `#a2e4df` (Central 82% compliance bubble)
- `--accent-yellow`: `#fef08a` (`★ IS 3055` badge)
- `--indicator-red`: `#ef4444` (`↑ 2 from last week` alert)
- `--indicator-green`: `#10b981` (Documents `↗ 3 this week`, progress verified)

### 4. Text Color Tokens
- `--text-primary`: `#0f172a` (Headings, primary metrics, active nav)
- `--text-secondary`: `#475569` (Subtitles, labels, inactive nav items)
- `--text-muted`: `#94a3b8` (Footer notes, secondary metadata)
- `--text-white`: `#ffffff`

### 5. Control & Interactive Tokens
- `--control-bg`: `#f1f5f9` (Subtle pill & circular control background)
- `--control-bg-hover`: `#e2e8f0`
- `--control-border`: `rgba(226, 232, 240, 0.8)`
- `--control-radius`: `9999px` (`rounded-full` for all buttons, pills, search)
