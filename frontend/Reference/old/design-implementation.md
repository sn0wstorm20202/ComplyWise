# ComplyWise — Final 3D / Scroll-Driven Product Story Implementation

## 0. Final Objective

Rebuild the ComplyWise landing experience as a **cinematic, physical, scroll-driven product story**.

The website must no longer feel like:

- a sequence of static marketing sections
- a normal SaaS landing page
- a page with text plus decorative GSAP effects
- a collection of cards that happen to animate

It must feel like:

> **A product film that the user controls by scrolling.**

The user should feel that they are physically moving through the ComplyWise system.

The core journey is:

```text
BUSINESS
   ↓
CONTEXT
   ↓
MISSING INFORMATION
   ↓
QUESTION
   ↓
REGULATORY WORLD
   ↓
RULE
   ↓
DECISION
   ↓
EVIDENCE
   ↓
ACTION
   ↓
WORKSPACE
```

The final experience should communicate the product without requiring the visitor to read technical explanations.

### Core principle

> **The interface tells the story.**

The content, 3D objects, camera movement, typography, evidence, and UI states must work together.

The visual reference language comes from the supplied landing-page storyboard frames: persistent objects, camera travel, depth, independent object motion, composition changes, progressive replacement of one message with another, and physical transitions between product states.

The current ComplyWise visual identity remains:

- light theme
- warm ivory
- charcoal
- muted sage
- subtle dusty rose
- editorial typography
- restrained borders
- premium whitespace

The reference is for **storytelling and motion grammar**, not for copying branding, colour palette, artwork, or assets.

---

# 1. NON-NEGOTIABLE PRINCIPLE

## Build a visual world, not a collection of sections.

Every major story chapter should contain a persistent visual stage.

The stage can contain:

- business profile
- regulatory document
- rule card
- evidence sheet
- decision badge
- workspace panel
- calendar item
- source nodes
- connecting lines
- small 3D objects
- abstract regulatory geometry

The camera and objects move through this world.

### Think:

```text
virtual camera
+
persistent objects
+
depth layers
+
scroll-controlled choreography
+
DOM storytelling
+
3D / 2.5D objects
```

not:

```text
section
+
fade
+
slide
+
next section
```

---

# 2. TECHNOLOGY DIRECTION

Use the strongest combination that the existing project can support.

## Required motion stack

Prefer:

```text
GSAP
GSAP ScrollTrigger
```

Use Lenis if it is already stable in the project.

## 3D stack

Use one of:

```text
Three.js
React Three Fiber
@react-three/drei
```

when real 3D adds value.

CSS 3D is acceptable for lighter objects.

SVG / DOM objects are preferred when a visual does not require real 3D.

### Important

Do not introduce Three.js simply because it is available.

Use:

- GSAP for choreography
- ScrollTrigger for scroll progress
- Three.js / R3F for genuine depth, camera and physical objects
- DOM/SVG for readable interfaces and text

The goal is **visual quality**, not technology count.

---

# 3. HYBRID ARCHITECTURE

The recommended system is:

```text
                     PAGE
                      │
          ┌───────────┴───────────┐
          │                       │
     DOM / HTML              3D / R3F
          │                       │
   headlines               physical objects
   labels                  source documents
   controls                rule blocks
   workspace UI            evidence cards
   accessibility           abstract geometry
          │                       │
          └───────────┬───────────┘
                      │
                    GSAP
                      │
               ScrollTrigger
                      │
                Scroll Progress
```

GSAP should coordinate both DOM and 3D state.

Do not create a second animation system that fights GSAP.

---

# 4. PHYSICAL STORYTELLING MODEL

The most important visual concept is **continuity**.

An object should be allowed to change meaning.

Examples:

```text
BUSINESS PROFILE
        ↓
structured facts
        ↓
decision context
```

```text
REGULATORY DOCUMENT
        ↓
relevant clause
        ↓
rule
```

```text
RULE
        ↓
decision
```

```text
DECISION
        ↓
workspace action
```

This is better than destroying one UI and creating another.

The user should feel that the product state is **evolving physically in front of them**.

---

# 5. HERO — THE FIRST PHYSICAL SCENE

## 5.1 Hero objective

The hero must immediately feel more advanced than a normal website.

The first viewport should contain:

- floating navigation
- editorial headline
- minimal supporting copy
- primary CTA
- one dominant physical visual system

The hero must **not** be only typography.

## 5.2 Recommended hero message

Use a calm, memorable statement such as:

> **Behind every business is a rulebook.**

The final copy may be refined separately, but the interaction architecture must not depend on a fixed sentence.

## 5.3 Hero visual world

Create a centered physical composition containing:

### Primary object

A **Business Dossier**.

It looks like a refined physical profile/document object:

- warm white paper
- subtle edge
- soft shadow
- slight thickness
- small metadata
- business name
- location
- activity

### Secondary objects

Orbiting / floating lightly around it:

- regulatory document
- rule fragment
- small source label
- evidence strip
- subtle circular geometry
- small status marker

### Background

Warm ivory field with:

- very soft sage radial light
- subtle paper grain
- faint depth haze
- extremely slow ambient movement

No giant decorative blob.

---

# 6. HERO CAMERA CHOREOGRAPHY

Use a virtual camera / scene transform.

Initial state:

```text
camera:
  centered
  slightly elevated
  low rotation
  medium distance
```

Objects should have different depths.

Example:

```text
background: z = -2
documents:  z = 0
business:   z = 1
evidence:   z = 2
```

Do not make the depth visually obvious.

It should feel premium and spatial.

### Scroll sequence

#### HERO STATE 01 — INTRO

Everything visible.

Business dossier is dominant.

Headline is fully readable.

#### HERO STATE 02 — APPROACH

As the user scrolls:

- camera moves slightly forward
- business dossier grows
- background recedes
- small source objects move outward
- headline becomes less dominant

#### HERO STATE 03 — INSPECTION

Camera approaches the business dossier.

The dossier tilts slightly.

Its fields become readable.

A small missing-data marker appears.

#### HERO STATE 04 — TRANSFORMATION

The dossier opens / expands.

Business information separates into floating facts:

```text
LOCATION
ACTIVITY
ENTITY
SCALE
OPERATIONS
```

Each fact occupies a different depth plane.

#### HERO STATE 05 — QUESTION

One fact becomes visually isolated.

Example:

```text
TURNOVER
—
MISSING
```

The remaining facts soften.

A question card enters.

#### HERO STATE 06 — TRANSITION

The question becomes the doorway into the next scene.

The camera moves through the question card.

This is the scene transition.

---

# 7. HERO MICRO-INTERACTIONS

Desktop only.

### Cursor movement

Create subtle parallax based on pointer position.

Different layers move by different amounts.

Example:

```text
background: ±4px
documents:  ±8px
business:   ±12px
foreground: ±18px
```

Use eased `quickTo` or equivalent.

### Hover business dossier

On hover:

- dossier lifts slightly
- shadow deepens subtly
- border becomes slightly clearer
- one metadata line brightens
- cursor becomes slightly larger

No bounce.

### Hover metadata

When hovering a business fact:

- related visual line becomes brighter
- corresponding object gains a soft sage highlight
- unrelated objects reduce opacity slightly

### Important

Hover interaction must never distract from scroll narrative.

---

# 8. SCENE 01 — BUSINESS → FACTS

Create a pinned / sticky scene.

The scene uses one central business dossier.

### State 01

```text
Business description
```

The content is readable.

### State 02

The sentence physically breaks apart.

Words move toward their semantic categories.

Example:

```text
Maharashtra
        →
LOCATION

Manufacturing
        →
ACTIVITY

Private Limited
        →
ENTITY
```

Use GSAP position/opacity/scale transitions.

### State 03

The resulting facts settle into a clean structured arrangement.

The visitor should feel:

> “The system understood the business.”

---

# 9. SCENE 02 — THE UNKNOWN

This scene should not introduce a new unrelated card.

Use the previous structured facts.

One fact becomes visually unresolved.

Example:

```text
TURNOVER
?
```

### Visual behaviour

- connected rule lines pause
- uncertain node pulses very subtly
- other facts remain stable
- environment becomes quieter
- a single question object enters

This is an important cinematic pause.

---

# 10. SCENE 03 — ADAPTIVE QUESTION

The question should feel like it **emerges from the missing fact**.

Do not simply fade in a new card.

Transformation:

```text
missing variable
        ↓
highlight
        ↓
question label
        ↓
question card
```

The question card can be a physical translucent/white object in 3D space.

When the answer is selected:

```text
question
        ↓
answer
        ↓
rule path activates
```

The selected answer should subtly illuminate the path forward.

---

# 11. SCENE 04 — REGULATORY WORLD

The scene changes from a single business to a much larger environment.

The camera pulls back.

The user sees a **regulatory landscape**.

Create a spatial field of softly floating source objects:

```text
Central Government
Maharashtra
BIS
Labour
Environment
Fire
GST
Standards
Notifications
Orders
```

These should not appear as a conventional card grid.

They should feel like a **constellation / archive / library**.

## 11.1 Spatial arrangement

Use a gentle curved or orbital layout.

Possible implementations:

- GSAP + DOM cards along a mathematical curve
- Three.js object placement
- R3F group with camera movement

The active source moves toward the center.

The others recede.

## 11.2 Scroll behaviour

As the camera moves:

```text
wide regulatory field
        ↓
selected authority
        ↓
selected source
        ↓
relevant document
```

Unselected objects should reduce:

- scale
- opacity
- contrast

Do not blur them aggressively.

---

# 12. SCENE 05 — DOCUMENT / SOURCE REVEAL

A regulatory document becomes the primary physical object.

This can be rendered in DOM or as a plane in Three.js.

### Physical interaction

The document:

- rotates slightly
- moves forward
- opens/unfolds
- reveals a clause
- highlights the relevant passage

Use 3D transforms / `rotateX` / depth.

If using Three.js, a simple plane/card stack is enough.

Do not build an overly complex document simulator.

---

# 13. SCENE 06 — CLAUSE → RULE

The highlighted clause should **transform into a structured rule object**.

Visual transition:

```text
document
   ↓
highlight
   ↓
selected clause
   ↓
clause lifts out
   ↓
rule card forms
```

The rule card can contain:

```text
Condition
Threshold
Exemption
Effective date
Jurisdiction
```

The card should physically assemble.

For example:

```text
threshold block enters
condition block enters
exemption block enters
effective-date block enters
```

Then they lock together.

---

# 14. SCENE 07 — DETERMINISTIC DECISION

This is the most important technical scene.

The rule should visibly execute.

Use:

```text
condition
condition
threshold
date
exemption
```

Each one changes state.

Example:

```text
CONDITION        ✓
THRESHOLD        ✓
EXEMPTION        —
EFFECTIVE DATE   ✓
```

Then the result emerges:

```text
APPLICABLE
```

### Animation

Each condition should:

- highlight
- resolve
- slightly compress into the final rule
- feed a common visual line

Then all lines converge into the result.

The convergence itself is the visual metaphor for deterministic evaluation.

---

# 15. SCENE 08 — DECISION → EVIDENCE

The decision should not simply cut to another section.

It should produce its evidence.

The final rule result opens a path toward the source.

A small evidence tag travels backward:

```text
DECISION
   ↑
RULE
   ↑
CLAUSE
   ↑
SOURCE
```

Then returns to:

```text
DECISION
```

This creates a visual evidence loop.

The visitor should understand:

> “I can see where this answer came from.”

---

# 16. SCENE 09 — EVIDENCE → ACTION

The decision object morphs into an actionable compliance item.

Example transformation:

```text
APPLICABLE
      ↓
REQUIREMENT
      ↓
ACTION
```

The new action object should become part of the workspace.

Possible visual:

- result badge becomes card header
- source stays as metadata
- due date enters
- action/owner appears
- status appears

This is the bridge between intelligence and workflow.

---

# 17. SCENE 10 — WORKSPACE

Now pull the camera back.

The user enters the ComplyWise workspace.

This should feel like entering the product.

Create a physical browser/product environment.

The workspace can be a large floating panel.

The previous compliance item should be visible inside it.

Then the interface transitions through:

```text
Compliance
Documents
Workflows
Calendar
Schemes
Standards
```

## Scroll choreography

Do not simply show six screenshots.

Instead:

```text
workspace enters
        ↓
Compliance becomes active
        ↓
current decision visible
        ↓
Documents tab activates
        ↓
Workflow tab activates
        ↓
Calendar activates
        ↓
Standards/Schemes appear
```

The same workspace shell persists.

Only the internal state changes.

---

# 18. SCENE 11 — WORKSPACE MICRO-INTERACTIONS

### Tab hover

- subtle lift
- soft sage fill
- underline/indicator expansion

### Compliance row hover

- evidence line illuminates
- corresponding source metadata appears subtly

### Document hover

- document rises 2–4px
- verification badge becomes clearer

### Workflow hover

- current step becomes highlighted
- next step becomes slightly visible

### Calendar hover

- deadline ring expands
- subtle date emphasis

All interactions must remain calm.

---

# 19. SCENE 12 — TRUST

Do not make trust another technical dashboard.

Instead, reuse the physical objects that appeared earlier.

For example:

```text
BUSINESS
SOURCE
RULE
EVIDENCE
DECISION
```

Arrange them as a clean causal chain.

Then reveal:

> **The rules decide. The AI explains.**

This should be a visual conclusion.

The phrase should feel earned by the preceding experience.

---

# 20. SCENE 13 — FINAL CAMERA EXIT

After the trust scene:

- camera slowly pulls away
- all objects become smaller
- regulatory world becomes visible again
- workspace recedes
- background returns to warm ivory

Then final CTA appears.

The user should feel like they have travelled through the entire system.

---

# 21. FINAL CTA

Use a large circular interaction.

At rest:

```text
Explore Workspace
```

Hover:

- circle fills with sage
- arrow rotates
- text transitions
- subtle scale
- pointer response

Use GSAP for the expansion.

This can remain mostly DOM/CSS; no Three.js required.

---

# 22. CAMERA DESIGN

The camera is the most important part of the experience.

Treat it as a continuous system.

## Camera controls

```text
position
target
zoom / fov
rotation
```

For a Three.js implementation:

```text
camera.position
camera.lookAt()
```

For DOM/CSS 3D:

```text
perspective
translateZ
translateX
translateY
rotateX
rotateY
scale
```

## Camera rules

### Rule A

Never make the camera move unpredictably.

### Rule B

Every camera movement should have narrative purpose.

### Rule C

Use acceleration/deceleration rather than linear movement.

### Rule D

The camera should linger briefly on important states.

### Rule E

The camera should create transitions between chapters.

---

# 23. PERSISTENT OBJECT SYSTEM

Implement a shared object registry.

Possible objects:

```text
BusinessDossier
FactNode
QuestionCard
SourceNode
RegulatoryDocument
ClauseHighlight
RuleCard
DecisionBadge
EvidenceTrail
ComplianceTask
WorkspaceShell
CalendarCard
StandardCard
```

Each object should support:

```text
position
rotation
scale
opacity
depth
visibility
hoverState
activeState
```

This makes the visual world coherent.

---

# 24. OBJECT TRANSFORMATION RULE

Prefer:

```text
same object
→ new state
```

instead of:

```text
object disappears
→ new object appears
```

Examples:

```text
BusinessDossier
→
FactDossier
```

```text
DocumentClause
→
RuleCard
```

```text
DecisionBadge
→
ComplianceTask
```

This is critical to the physical product-film feeling.

---

# 25. BACKGROUND MICRO-INTERACTION

The hero and transition scenes should have subtle ambient motion.

Use:

- radial sage glow
- tiny dust/grain
- soft light movement
- faint technical grid
- low-opacity lines
- extremely slow floating geometry

The movement must be almost subconscious.

Example:

```text
ambient glow:
x + 12px
y - 8px
scale 1.00 → 1.04
duration 10–18 seconds
```

Do not create a visible looping animation that competes with the story.

---

# 26. LIGHT THEME DEPTH

Do not switch to a dark canvas for the sake of contrast.

The physical depth must work within the light theme.

Use:

- white elevated objects
- warm gray inset surfaces
- muted sage highlights
- charcoal text
- soft shadows
- subtle ambient occlusion
- very light blur

The reference's purple/bright visual energy must be translated into **premium light regulatory depth**, not copied literally.

---

# 27. 3D STYLE

Avoid realistic 3D.

Preferred style:

> **editorial product objects + refined dimensionality**

Use:

- slightly rounded geometry
- paper-like layers
- smooth bevels
- thin outlines
- soft shadows
- restrained gloss
- subtle perspective

Avoid:

- photorealistic factory scenes
- gaming-style 3D
- glowing neon objects
- mechanical sci-fi
- overly complex shader effects

---

# 28. WHEN TO USE THREE.JS

Use Three.js / R3F when it materially improves:

- camera movement
- object depth
- perspective
- physical layering
- rotating 3D objects
- spatial scenes

Good candidates:

- hero dossier stack
- regulatory constellation
- document stack
- rule-object assembly
- final workspace environment

Do not force all UI into the canvas.

Readable text and accessible controls should remain DOM where possible.

---

# 29. WHEN TO USE GSAP ONLY

Use GSAP + DOM/CSS for:

- headline transitions
- fact extraction
- hover interactions
- section reveals
- rule evaluation
- evidence highlighting
- workspace tabs
- CTA
- opacity/scale/position
- layout transitions

This keeps text crisp and accessible.

---

# 30. GSAP CHOREOGRAPHY

Use a master timeline per scene.

Do not create dozens of unrelated timelines.

Each scene should have:

```text
setup()
enter()
scrub()
hover()
exit()
cleanup()
```

Use `gsap.context()` in React.

Always clean up ScrollTriggers and timelines on unmount.

---

# 31. SCROLL PROGRESS MODEL

Do not map every animation directly to raw `window.scrollY`.

Use ScrollTrigger progress.

Example:

```text
0.00–0.15
scene enters

0.15–0.35
object transformation

0.35–0.55
new state

0.55–0.75
camera movement

0.75–0.90
decision

0.90–1.00
transition
```

The exact ranges may be tuned during implementation.

---

# 32. TRANSITION LANGUAGE

Use these transitions frequently:

### Morph

One object changes form.

### Dissolve

Old information quietly recedes.

### Drift

Object moves independently.

### Converge

Multiple paths become one.

### Expand

A small state becomes a system.

### Zoom-through

Camera moves through an object into the next scene.

### Pull-back

Camera reveals the larger ecosystem.

These are the core motion verbs.

---

# 33. HOVER SYSTEM

Hover interaction should exist throughout the site.

But use a single interaction language.

### Rest

quiet

### Hover

object lifts / sharpens / highlights

### Active

sage semantic state

### Exit

smooth return

Do not use a different hover style for every component.

---

# 34. CURSOR

Desktop:

- small custom cursor
- smooth follow
- subtle scale on interaction
- semantic response

Interaction states:

```text
default
interactive
inspect
CTA
```

Example:

`inspect` can appear over evidence/rule objects.

Do not build a giant novelty cursor.

---

# 35. PERFORMANCE

The visual ambition must not destroy performance.

### Prefer

- instanced/simple geometry
- low polygon counts
- CSS transforms
- `requestAnimationFrame` only where justified
- GSAP ticker
- lazy loading
- texture compression
- `will-change` only on actively animated elements

### Avoid

- heavy real-time postprocessing
- huge textures
- thousands of 3D objects
- expensive shadows
- continuous full-scene blur

The target is premium smoothness.

---

# 36. ACCESSIBILITY / REDUCED MOTION

When `prefers-reduced-motion` is active:

- disable major camera motion
- remove large 3D rotations
- remove pointer parallax
- stop nonessential ambient loops
- convert story states into readable staged transitions

The narrative must remain understandable.

---

# 37. MOBILE

Do not reproduce the desktop camera choreography literally on mobile.

Mobile should preserve the concept but simplify the physics.

Use:

```text
smaller object count
shorter camera movement
stacked spatial layers
reduced perspective
reduced pinning
```

Real 3D can be reduced or disabled on weaker devices.

The story must remain intact.

---

# 38. CONTENT RULES INSIDE THE VISUAL WORLD

The language should be written for a normal business user.

Main story language:

- calm
- minimal
- clear
- trustworthy
- confident

Technical terminology belongs primarily inside:

- small metadata
- rule UI
- evidence UI
- workspace UI

Avoid turning the hero into an engineering paper.

The visitor should understand the product story without knowing how RAG or embeddings work.

---

# 39. DO NOT CLAIM MORE THAN THE PRODUCT SUPPORTS

Do not use visual storytelling to imply unsupported guarantees.

Avoid unless actually implemented:

```text
ZERO HALLUCINATION
100% LEGALLY GUARANTEED
CERTIFIED IMMUTABLE
ZERO RISK
PERFECT COMPLIANCE
```

Prefer:

```text
SOURCE-LINKED
VERSIONED
VERIFIED
EVIDENCE-BACKED
RULE-GOVERNED
```

---

# 40. ENGINEERING CONSTRAINTS

Do not:

- migrate frameworks
- replace Next.js
- rewrite authentication
- break existing routes
- rewrite backend functionality
- change the compliance engine
- rebuild the dashboard
- modify unrelated application code

This task is a **landing-page visual/product storytelling implementation**.

---

# 41. IMPLEMENTATION PHASES

## Phase 1 — Spatial foundation

Build:

- shared 3D scene infrastructure
- camera
- persistent object registry
- GSAP integration
- ScrollTrigger integration
- responsive scene manager

## Phase 2 — Hero

Build:

- Business Dossier
- floating source objects
- camera choreography
- fact extraction
- question transition
- cursor/hover system

## Phase 3 — Core journey

Build:

- regulatory world
- document reveal
- clause extraction
- rule assembly
- deterministic decision
- evidence trail

## Phase 4 — Product payoff

Build:

- decision → workspace transformation
- interactive workspace
- hover interactions
- trust scene
- final camera exit
- CTA

## Phase 5 — polish

Tune:

- easing
- shadows
- depth
- object timing
- typography integration
- mobile fallbacks
- reduced-motion mode
- performance

---

# 42. DEFINITION OF DONE

The landing page is complete only when all of the following are true:

### Visual

- The website still feels like ComplyWise.
- It remains light, warm and premium.
- No dark-theme drift.
- No generic SaaS appearance.

### Story

- The user can understand the product by scrolling.
- The visual itself explains the product.
- The story progresses logically.

### Physical storytelling

- Objects persist between states.
- Objects transform rather than simply disappear.
- Camera movement links chapters.
- Depth is visible but restrained.

### 3D / animation

- Hero has a real spatial scene.
- Business → facts → question is animated.
- Regulatory world has spatial depth.
- Source → clause → rule is animated.
- Rule → decision has visible convergence.
- Decision → workspace is a physical transformation.

### Interaction

- Hero has subtle pointer response.
- Important objects have meaningful hover states.
- Rule/evidence/workspace interactions feel tactile.
- CTA has magnetic/expanding interaction.

### Performance

- Smooth desktop scrolling.
- Responsive mobile fallback.
- No major frame drops.
- No runaway animation loops.
- No console errors.

---

# 43. FINAL TARGET FEELING

The final ComplyWise experience should feel like:

```text
Apple-style product reveal
        +
premium editorial design
        +
physical product storytelling
        +
regulatory intelligence
        +
light-theme trust
        +
scroll-controlled camera
        +
GSAP choreography
        +
selective 3D
```

The user should finish the page thinking:

> **“I didn't just read what ComplyWise does. I watched it happen.”**

That is the final objective.
