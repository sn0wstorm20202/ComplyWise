# Shadows & Elevation Tokens — ComplyWise Design System

## Elevation Principles
ComplyWise uses soft ambient diffusion rather than harsh drop shadows. No heavy glassmorphism or neon glows are permitted.

## Shadow Tokens

- **shadow-window**:
  - `0 24px 48px -12px rgba(15, 23, 42, 0.08), 0 0 1px 1px rgba(0, 0, 0, 0.03)`
  - Used on: Outer floating application container on the canvas.
- **shadow-card**:
  - `0 1px 3px 0 rgba(0, 0, 0, 0.02), 0 1px 2px -1px rgba(0, 0, 0, 0.02)`
  - Used on: Standard dashboard cards (`Compliance Activity`, `Documents`, etc.).
- **shadow-control**:
  - `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
  - Used on: Floating circular action buttons (e.g. `↗` diagonal expand button, search trigger, sort trigger).
- **shadow-badge**:
  - `0 2px 4px rgba(0, 0, 0, 0.04)`
  - Used on: Floating highlighted chart pills (`3 actions`, `+32%`).
