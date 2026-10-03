# ComplyWise — Premium Product Story + Interaction Design System

## 0. Purpose

This is the current master design contract for the ComplyWise public landing page.

It combines four inputs:

1. The existing ComplyWise light editorial design system.
2. The current scrollytelling architecture and content inventory.
3. The approved ComplyWise product story and SIH presentation.
4. The uploaded landing-page reference videos, used only for visual storytelling patterns and interaction inspiration.

The page is now visually strong. Do not redesign the brand direction.

The next quality jump must come from:

- clearer, calmer content
- a stronger user-first narrative
- better micro-interactions
- subtle GSAP motion
- product-aware hover states
- a more alive hero
- intentional visual storytelling
- stronger trust cues

The page should feel like a premium product film for a serious business tool.

Core principle:

> **The rules decide. The AI explains.**

This phrase is a product principle, not necessarily the opening hero headline.

---

# 1. Design Goal

A normal business owner, founder, operations manager, manufacturer, exporter, or compliance professional should be able to visit the site and quickly feel:

> “This understands businesses like mine.”

Then:

> “It will help me understand what actually applies.”

Then:

> “I can see why it applies.”

Then:

> “It gives me a clear next step.”

The website should build trust through:

- calm language
- transparent explanation
- source visibility
- restrained visuals
- realistic product UI
- useful micro-interactions
- no exaggerated claims
- no fear-based copy
- no unnecessary technical jargon

The product should feel sophisticated because it is **clear**, not because it sounds complicated.

---

# 2. Design Personality

## Target feeling

- calm
- premium
- intelligent
- trustworthy
- modern
- precise
- warm
- editorial
- quietly technical
- business-friendly

## Avoid

- generic AI startup language
- “revolutionary” or “game-changing” claims
- fear-based compliance messaging
- government-portal visual language
- excessive legal jargon
- overly technical architecture language in primary marketing copy
- neon technology aesthetics
- busy dashboards everywhere
- decorative animation with no semantic purpose

The user should feel **guided**, not overwhelmed.

---

# 3. Reference Video Translation

Three uploaded reference videos were reviewed as visual storytelling references.

They show a recurring high-end product-landing pattern:

### Reference Pattern A

A clean light page opens with:

- a simple navigation
- a large centered statement
- one strong product visual
- restrained supporting copy
- then progressively more product/function detail

The product visual, not paragraphs, does most of the explaining.

### Reference Pattern B

The story uses:

- large centered headlines
- floating people/UI objects
- product screenshots or interface fragments
- integrations/process diagrams
- testimonials or proof moments
- carefully spaced chapters

The page feels like a guided presentation rather than a documentation page.

### Reference Pattern C

The structure is especially useful for ComplyWise:

- bold hero statement
- product visual immediately underneath
- feature story told one idea at a time
- large typography paired with real UI
- trust/security moment
- customer/testimonial/proof treatment
- strong closing CTA

## ComplyWise translation

Do not copy the reference brands, assets, colours, illustrations, or exact layouts.

Translate the underlying storytelling mechanics into:

```text
Business context
→ business facts
→ missing fact
→ question
→ relevant rules
→ applicability
→ source/evidence
→ next action
```

Instead of colourful product illustrations, use:

- business profile fragments
- requirement cards
- source snippets
- rule chips
- evidence documents
- workspace UI
- calendar/workflow fragments

The references are useful because they show **how to make a product feel alive through layout and motion**.

---

# 4. Existing Visual System — LOCKED

The following is approved and should remain.

## Canvas

```css
--cw-bg: #F7F5EF;
--cw-surface: #EFEEE7;
--cw-surface-card: #FFFFFF;
--cw-surface-warm: #F1EDE6;
--cw-surface-hover: #E7EEE9;
```

## Typography

```css
--cw-text: #171714;
--cw-text-secondary: #5A5851;
--cw-text-muted: #87847B;
--cw-text-faint: #B4B0A6;
```

Use:

- structural sans for clarity
- editorial serif for emotional emphasis
- monospace for technical metadata

## Accent

```css
--cw-sage: #7FAF9A;
--cw-sage-dark: #4F7464;
--cw-sage-soft: #DCEAE2;
--cw-sage-faint: #EDF4F0;

--cw-blush: #D9AAA5;
--cw-blush-soft: #F1DFDC;
--cw-blush-faint: #F8EFEA;
```

Sage communicates:

- active
- relevant
- verified
- selected
- current
- positive interaction

Dusty rose is only a secondary warning/atmospheric colour.

## Shapes

```css
--cw-radius-pill: 9999px;
--cw-radius-card: 24px;
--cw-radius-inner: 16px;
--cw-radius-micro: 8px;
```

## Shadows

Use soft multi-layered elevation, never hard drop shadows.

---

# 5. Content Philosophy — MOST IMPORTANT

The content must sound like it is written for a **real business person**.

Not for a regulator.

Not for a machine-learning engineer.

Not for a legal researcher.

Not for a developer.

## Voice

Use:

- short sentences
- familiar words
- calm certainty
- direct value
- specific but understandable language
- one idea per paragraph

Do not use technical terms unless they are necessary inside the product UI.

### Example

Marketing copy:

> **Only answer what changes the answer.**

Product UI:

> `DECISION-CRITICAL FACT`

This contrast is intentional.

---

# 6. Editorial Rule: Simple Outside, Technical Inside

## Marketing layer

Use language such as:

- business
- what applies
- what you need
- what is missing
- why it applies
- source
- next step
- keep track
- stay updated

## Product UI layer

Technical vocabulary can appear here:

- applicability
- threshold
- exemption
- effective date
- jurisdiction
- source
- version
- rule
- evidence
- verification

Do not put architecture jargon into headlines unless it is actually the point of the chapter.

---

# 7. Words / Phrases to Reduce

The current copy uses several phrases too frequently.

Reduce or remove these from primary marketing copy:

- statutory intelligence
- statutory ingestion pipeline
- deterministic rule engine
- deterministic evaluation
- canonical extraction
- statutory mandate
- audit-grade
- synthesized compliance action item
- architectural truth
- separation of cognition and determinism
- plant footprint
- zero speculation
- zero hallucination
- tamper-evident
- immutable
- legal reasoning

These can exist in technical UI, architecture views, or documentation where appropriate.

They should not dominate the experience of a normal business user.

---

# 8. Recommended Narrative

The entire page should tell one story.

```text
01 — START WITH THE BUSINESS
Tell us what you do.

02 — UNDERSTAND WHAT MATTERS
We turn the description into useful business details.

03 — ASK ONLY WHAT MATTERS
When one missing detail could change the answer, we ask for it.

04 — FIND THE RELEVANT RULES
We bring the right requirements into view.

05 — SHOW WHY THEY APPLY
The decision is connected to its source and conditions.

06 — TURN IT INTO ACTION
Requirements become documents, workflows and dates.

07 — KEEP YOU INFORMED
Relevant changes and next steps stay visible.
```

The user should never feel that the site suddenly changes subject.

---

# 9. Hero Direction

Current visual headline direction is strong:

> **Behind every business is a rulebook.**

Keep the tone, but make the hero feel more alive.

Recommended supporting line:

> **ComplyWise helps you understand what applies to your business — and what to do next.**

The phrase:

> **The rules decide. The AI explains.**

should appear later as the trust principle after the user has watched the mechanism.

## Hero visual storytelling

The hero should visually suggest a business becoming a clearer compliance picture.

Start with:

```text
YOUR BUSINESS

“We manufacture industrial equipment in Maharashtra.”
```

Then subtly extract:

```text
ACTIVITY     MANUFACTURING
LOCATION     MAHARASHTRA
SCALE        84 PEOPLE
```

Then one item becomes:

```text
WHAT IS MISSING?
```

Then:

```text
ONE QUESTION
```

Then the scene resolves into:

```text
WHAT APPLIES
```

This should be understated and elegant.

---

# 10. Hero Background Micro-Interaction

The hero currently needs more life.

Implement a **regulatory constellation** background rather than a generic particle system.

## Behaviour

Use 6–10 very subtle abstract nodes representing:

- business
- requirement
- source
- rule
- document
- deadline

Nodes should be almost invisible at rest.

On desktop mouse movement:

- a soft sage ambient glow follows the cursor with a large radius
- nodes drift slightly toward/away from the pointer
- connecting lines appear only at very low opacity
- movement is slow and damped

On scroll:

- the constellation gradually moves upward
- some nodes fade out
- relevant nodes consolidate toward the centre

This should feel like **information becoming organised**, not a sci-fi particle field.

## Constraints

- no canvas particle engine unless necessary
- use lightweight DOM/SVG where possible
- no neon
- no visible particle spam
- no continuous high-frequency animation
- disable pointer parallax on touch devices

---

# 11. Micro-Interaction System

Micro-interactions should make the site feel expensive without making it noisy.

## 11.1 Navigation

Hover on a nav item:

- underline/indicator grows from 0 → 100%
- text shifts 1px or 2px
- 250–350ms
- sage used only on active/hover state

CTA:

- arrow moves 2–4px
- background subtly lifts
- border/shadow changes
- 350ms `power3.out`

---

## 11.2 Eyebrow Status Dot

The tiny sage dot should have a slow breathing animation:

```text
scale: 0.9 → 1.08 → 0.9
opacity: 0.7 → 1 → 0.7
```

Cycle around 3 seconds.

Keep it subtle.

---

## 11.3 Hero Headline

Use line-based reveal:

- mask/clip reveal
- slight upward movement
- slight opacity shift

Then add a very subtle hover-responsive shift to the italic word only.

Do not animate the headline continuously after entry.

---

## 11.4 Hero CTA Hover

Primary CTA:

- arrow nudges diagonally
- button lifts 1–2px
- inner highlight shifts
- micro shadow deepens

Secondary CTA:

- underline expands
- arrow moves

No bounce.

---

## 11.5 Business Context Hover

When hovering a business fact:

```text
LOCATION
ACTIVITY
SCALE
```

highlight the corresponding piece in the narrative statement.

Example:

Hover `MAHARASHTRA`
→ the location phrase becomes slightly darker/sage.

This gives the impression that the system understands the sentence.

---

# 12. Scrollytelling Micro-Interactions

Each scroll chapter should have a small tactile layer on top of the major state transition.

## Business → Facts

Words detach from the natural-language sentence and settle into fact chips.

Use:

- opacity
- y
- x
- scale 0.96 → 1
- very small rotation correction

The movement should feel physical.

---

## Missing Fact

The missing field should have a subtle pulse and a quiet blush tint.

On hover:

- card border becomes slightly stronger
- question icon rotates 4°
- supporting text fades upward

---

## Adaptive Question

When the user reaches the question:

- question card lifts from the page
- one answer becomes active
- the selected answer creates a thin path into the next rule state

The line should visually connect:

```text
Question
→ Answer
→ Rule
```

---

# 13. Regulatory Discovery Interaction

Use the current idea of multiple official sources but make it visually calm.

Each source is a floating paper-like card.

Hover:

- card comes forward by 6–10px
- border darkens slightly
- source label brightens
- a tiny arrow/link affordance appears

On scroll:

- active source moves toward centre
- surrounding sources soften
- one relevant source remains sharp

The visual metaphor is:

> many sources → one relevant set

Not:

> five random glowing cards.

---

# 14. Deterministic Decision Interaction

Avoid flashy code animations.

Use a calm evaluation sequence:

```text
Business fact ✓
Condition ✓
Threshold ✓
Effective date ✓
        ↓
     RESULT
```

Each check appears with:

- tiny horizontal line draw
- sage check
- subtle 150ms opacity rise

Then the result card gently changes surface colour.

The interaction should feel like a trusted instrument finishing a check.

---

# 15. Evidence / Source Interaction

The evidence scene is a major trust moment.

Use a real document-like object.

On scroll:

```text
SOURCE
 ↓
RELEVANT PASSAGE
 ↓
RULE
 ↓
RESULT
```

The relevant line can receive a soft sage highlight.

On hover, a tiny source metadata tray can appear:

```text
SOURCE
VERSION
EFFECTIVE DATE
```

Do not create a large popup.

---

# 16. Workspace Micro-Interactions

The workspace should feel like a living product.

## Tabs

On hover:

- tab label shifts 1px
- icon changes from muted to sage
- bottom indicator grows

On activation:

- active panel fades/slides 12px
- previous panel exits in the opposite direction
- 450–650ms

## Compliance item

Hover:

- evidence/source metadata becomes more visible
- right arrow appears
- card lifts slightly

## Calendar

Hover a deadline:

- date highlights
- reminder metadata appears
- small timeline line brightens

## Documents

Hover:

- verification badge becomes clearer
- file icon lifts slightly

The product should feel responsive without looking game-like.

---

# 17. Coverage Section

Use a calm horizontal or grid reveal.

Each sector should have:

```text
Sector
small descriptor
```

On hover:

- sector name becomes dark/sage
- a thin rule line extends
- optional metadata appears

No giant colourful industry illustrations.

---

# 18. Trust / Verification Interaction

The verification pipeline should illuminate sequentially:

```text
SOURCE
→ REVIEW
→ VERIFY
→ PUBLISH
→ APPLY
```

Each node activates with a quiet sage state.

A line between nodes draws using SVG stroke animation.

At the end:

> **The rules decide. The AI explains.**

Use progressive word reveal.

---

# 19. FAQ Interaction

Keep the accordion minimal.

Hover:

- plus rotates 45°
- row border subtly changes

Open:

- answer slides/fades down
- question text darkens
- active indicator becomes sage

No large animated containers.

---

# 20. Final CTA

Keep the large circular CTA.

On hover:

- sage fill grows from the centre
- arrow moves and rotates
- text shifts slightly
- outer ring becomes more visible

This is the strongest CTA animation on the page.

---

# 21. Scroll Physics

Preferred stack:

- Lenis
- GSAP
- ScrollTrigger

Use a smooth, damped feel.

Suggested hover timing:

```text
250–350ms
```

Major micro-reveal:

```text
450–800ms
```

Hero sequence:

```text
1000–1800ms
```

Pinned sections:

Use scrub values around `0.8–1.2`, tuned by actual feel.

Never animate layout properties during scrub.

Prefer:

- transform
- opacity
- clip-path
- SVG stroke-dashoffset

Avoid continuous animation of:

- top
- left
- width
- height
- margin
- padding
- expensive box-shadow changes

---

# 22. Responsive Behaviour

## Desktop ≥ 1280px

Full experience:

- Lenis
- pinned scrollytelling
- subtle pointer-responsive hero
- custom cursor
- source-card hover
- workspace tab motion

## Tablet 768–1279px

Reduce:

- parallax distance
- simultaneous elements
- card count

Keep:

- narrative sequence
- meaningful transitions
- workspace demonstration

## Mobile < 768px

Do not force desktop pinning.

Use stacked story cards with short reveal sequences.

Disable:

- custom cursor
- mouse parallax
- heavy 3D transforms

Keep the story:

```text
Business
→ Facts
→ Question
→ Rules
→ Decision
→ Evidence
→ Action
```

---

# 23. Trust & Claim Guardrails

Do not use claims that sound stronger than the system can prove.

Avoid:

- zero hallucination
- 100% legal certainty
- zero ambiguity
- certified immutable
- tamper-proof
- guaranteed compliance

Prefer:

- source-linked
- evidence-backed
- versioned
- verified
- rule-governed
- traceable

The product should communicate **humility + control**.

For a normal business user, this is more trustworthy than absolute claims.

---

# 24. Content-to-Animation Rule

Every major visual transition must support a sentence.

Examples:

### Copy
> Tell us what you do.

### Visual
Business description becomes structured facts.

---

### Copy
> Only answer what changes the answer.

### Visual
Missing field becomes one adaptive question.

---

### Copy
> See why it applies.

### Visual
Source → condition → decision.

---

### Copy
> Turn requirements into next steps.

### Visual
Requirement moves into document/workflow/calendar.

This is what makes the site feel like a premium product film rather than a decorated brochure.

---

# 25. Recommended Story Copy Direction

These are the approved **content-direction candidates** for the next content implementation pass.

## Hero

### Headline
> **Behind every business is a rulebook.**

### Supporting line
> **ComplyWise helps you understand what applies to your business — and what to do next.**

### Primary CTA
> **Explore Workspace**

### Secondary CTA
> **See How It Works**

---

## Chapter 01

### Headline
> **Start with what you do.**

### Supporting copy
> **Tell us about your business in plain language. We turn it into the details that matter for compliance.**

---

## Chapter 02

### Headline
> **Only answer what changes the answer.**

### Supporting copy
> **When an important detail is missing, ComplyWise asks for it. Nothing more.**

---

## Chapter 03

### Headline
> **Find the rules that belong to you.**

### Supporting copy
> **We bring together the requirements that matter for your business, location and activity.**

---

## Chapter 04

### Headline
> **See why it applies.**

### Supporting copy
> **Each result is connected to the conditions and source behind it.**

---

## Chapter 05

### Headline
> **Every decision has a trail.**

### Supporting copy
> **See the source, the reason, and the next step behind every result.**

---

## Chapter 06

### Headline
> **Turn requirements into next steps.**

### Supporting copy
> **Keep requirements, documents, workflows and important dates together.**

---

## Trust Principle

### Headline
> **The rules decide. The AI explains.**

### Supporting copy
> **ComplyWise uses AI to understand and explain, while verified regulatory knowledge and rules guide the decision.**

---

## Final CTA

### Headline
> **Know what applies. Know what to do next.**

### Supporting copy
> **Bring your business, requirements and next steps into one place.**

### CTA
> **Explore Workspace**

These lines are intentionally shorter and calmer than the current implementation. They should be treated as the content direction to implement, not as an excuse to add more copy.

---

# 26. Agency-Level Layout Principle

The page should alternate between:

```text
BIG IDEA
↓
PRODUCT VISUAL
↓
SHORT EXPLANATION
↓
INTERACTION
```

Do not create long paragraphs.

Do not make every chapter two-column text + card.

Vary the composition:

- centred hero
- full-width product object
- left narrative / right object
- centred evidence reveal
- wide workspace
- horizontal source rail
- full-width trust statement
- compact FAQ
- large final CTA

This variation is important for premium perception.

---

# 27. Premium Perception Checklist

A $10k-level impression should come from:

- excellent spacing
- excellent type hierarchy
- content restraint
- real product detail
- meaningful motion
- subtle hover feedback
- coherent easing
- consistent interaction language
- believable trust signals
- no visual clutter

Not from:

- more gradients
- more shadows
- more 3D
- more particles
- more text
- more cards

---

# 28. Performance / Accessibility

Support:

- `prefers-reduced-motion`
- keyboard navigation
- visible focus
- accessible menu states
- semantic headings
- `aria-expanded`
- touch-safe controls

For reduced motion:

- disable pointer parallax
- reduce pinned transformations
- convert dynamic stages into readable sequential states
- keep the narrative order

Use GPU-friendly properties for continuous animation.

---

# 29. Critical Regression Guard

If the page ever renders as raw HTML/default browser styling, stop design implementation.

Verify first:

```text
Root layout
→ globals.css
→ Tailwind/PostCSS
→ generated CSS bundle
→ fonts
→ browser console
```

The expected page must retain:

- cream background
- styled floating navigation
- premium typography
- borders/radii
- sage accents
- layout system

Never continue adding animation while the stylesheet is broken.

---

# 30. Definition of Done

The redesigned ComplyWise landing page is successful when:

1. A normal business user understands what the product is within the first 20–30 seconds.
2. The page feels calm and trustworthy instead of technical or intimidating.
3. The scroll tells one continuous story.
4. The user sees the product working, not merely described.
5. Hover interactions respond to meaning, not decoration.
6. The hero feels alive but remains elegant.
7. Every major animation explains a product concept.
8. The evidence/source story strengthens trust.
9. The workspace feels like a real product payoff.
10. The site feels premium without becoming visually noisy.

Final emotional target:

> **“This is a serious product. It understands my business, shows me what matters, and gives me a clear next step.”**
