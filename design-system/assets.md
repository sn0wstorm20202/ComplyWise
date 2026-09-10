# Visual Asset Inventory — ComplyWise Design System

## Asset Inventory & Sources

| Asset Name | Semantic Role | Source / Location | Type | Specifications |
|---|---|---|---|---|
| ComplyWise Brand Mark | Brand Identity | `frontend/components/icons/ComplyWiseLogo.tsx` | SVG Vector | Folded black ribbon "A" with gray contrast leg |
| Bureau of Indian Standards Emblem | Statutory Authority Mark | `frontend/components/icons/BISLogo.tsx` | SVG Vector | Official blue triangle outline, red anvil, "BIS" text |
| 3D Compliance Shield & Documents | Primary Hero Graphic | `frontend/public/assets/complywise-shield-3d.png` | PNG Asset | White stacked sheets with embossed bar marks, glowing royal blue checkmark shield |
| Team Member Avatars (1, 2, 3) | Top bar team cluster | `frontend/public/assets/avatars/` | SVG / PNG | Crisp circular portrait photos |
| User Profile Avatar | Current operator | `frontend/public/assets/avatars/user-avatar.png` | SVG / PNG | Circular portrait photo |

## Vector Fallbacks
All core marks (ComplyWise folded-A mark, BIS emblem) are implemented as pure inline SVG components to guarantee zero latency and pixel-perfect rendering across all retina/high-DPI displays.
