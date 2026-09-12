# Layout & Responsive Geometry — ComplyWise Design System

## Canvas Proportions
- **Visual Design Reference Dimensions**: 1024 × 682 px (mockup aspect ratio 1.5:1).
- **Target Desktop Implementation**: 1536 × 1024 px.
- **Secondary Desktop Breakpoints**: 1440px, 1280px.
- **Responsive Adaptations**:
  - Desktop (>1280px): Full 3-column asymmetric layout matching reference faithfully.
  - Laptop (1024px - 1280px): 2-column flow preserving relative card heights.
  - Tablet & Mobile (<1024px): Stacked single-column card grid with collapsible sidebar.

## Card Placement Grid
1. **Left Tall Card (ComplyWise Platform Intro & Stay Compliant)**:
   - Spans the entire vertical height of the dashboard main section.
   - Desktop column span: 3.2 of 12 (approx. 27% content width).
2. **Center Column (Activity & Actions)**:
   - Desktop column span: 4.8 of 12 (approx. 40% content width).
   - Top card: `Compliance Activity` (weekly task bars).
   - Bottom card: `Compliance Actions` (spline line chart with 3 actions highlight).
3. **Right Column (Documents, Applicable Reqs, Status)**:
   - Desktop column span: 4.0 of 12 (approx. 33% content width).
   - Top split: `Documents` (left) and `Applicable Requirements` (right, sage green).
   - Bottom card: `Compliance Status` (bubble cluster + 3-stat summary).
