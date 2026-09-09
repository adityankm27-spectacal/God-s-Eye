Before making any changes, read Frontend/design.md completely. Treat it as the authoritative UI/UX specification for this redesign. Follow its requirements throughout all phases. Do not modify or delete design.md.

# God's Eye — Frontend Design Specification

## 1. Purpose

This file defines the UI/UX design direction for the **God's Eye** frontend.

The goal is to make the existing application feel:

* Modern
* Premium
* Clean
* Ocean-inspired
* Maritime
* Professional
* Simple
* Smooth
* Easy to use

The visual quality should be inspired by this Dribbble design:

https://dribbble.com/shots/27708468-Wellora-Wellness-Health-Coaching-Landing-Page

**Important:** Do NOT copy the Dribbble design. Use it only as inspiration for layout quality, spacing, typography, rounded elements, visual hierarchy, and smooth animations.

---

# 2. ABSOLUTE RULE — BACKEND MUST NOT BE TOUCHED

## NEVER MODIFY THE BACKEND

The entire `Backend/` directory must be treated as **READ-ONLY**.

Do NOT:

* edit backend files
* rename backend files
* move backend files
* refactor backend code
* modify APIs
* modify API request/response formats
* modify inference logic
* modify ML/model code
* modify database logic
* modify backend dependencies
* modify backend configuration
* optimize backend code

The backend may be inspected only when necessary to understand how the frontend currently works.

### If a frontend requirement appears to require backend changes:

STOP and explain:

1. What frontend requirement is blocked.
2. What backend change would theoretically be required.
3. Why the backend will remain untouched.

Wait for explicit approval.

---

# 3. CORE DESIGN CONCEPT

The product should feel like:

> **A modern ocean intelligence platform.**

The visual identity should communicate:

* Ocean
* Sea
* Maritime monitoring
* Satellite/SAR intelligence
* Oil-spill detection
* Vessel awareness
* Environmental intelligence

It should NOT look like:

* Cyberpunk software
* Hacker UI
* Gaming interface
* Generic SaaS dashboard
* Excessively futuristic AI software

Keep it sophisticated and restrained.

---

# 4. COLOR DIRECTION

The primary theme must be **ocean/sea blue**.

Use a palette approximately around:

### Deep Ocean

`#061A2B`

For:

* navbar
* dark sections
* sidebar
* strong backgrounds

### Ocean Blue

`#0B4F71`

For:

* primary UI elements
* navigation
* important sections

### Marine Blue

`#087EA4`

For:

* secondary accents
* interactive elements

### Aqua

`#28B8D8`

For:

* highlights
* active states
* subtle accents

### Soft Cyan

`#78DCE8`

For:

* small decorative accents
* subtle gradients

### Ocean White

`#F4FAFC`

For:

* text on dark backgrounds
* clean sections

### Light Ocean

`#EAF6F8`

For:

* dashboard background
* light sections

### Muted Text

`#66808D`

For:

* secondary information
* descriptions

Do not use every color everywhere.

The interface should primarily feel blue, white, and clean.

---

# 5. GENERAL VISUAL STYLE

Use:

* generous whitespace
* large clean headings
* rounded cards
* subtle borders
* soft shadows
* clean typography
* restrained gradients
* smooth hover states
* consistent spacing
* clear hierarchy

Prefer:

* fewer elements
* larger visual breathing room
* simple layouts
* meaningful information

Avoid:

* clutter
* excessive borders
* excessive shadows
* excessive gradients
* too many colors
* tiny text
* unnecessary decorative elements
* excessive glassmorphism

---

# 6. BORDER RADIUS

Use a consistent rounded design language.

Suggested:

* Cards: `16px – 24px`
* Buttons: `10px – 16px`
* Inputs: `10px – 14px`
* Hero image containers: `20px – 28px`

Do not make every element extremely rounded.

---

# 7. TYPOGRAPHY

Typography should feel modern and clean.

Prioritize:

1. readability
2. hierarchy
3. spacing
4. consistency

Use:

* large strong headings
* medium-weight section headings
* readable body text
* smaller muted supporting information

Avoid unnecessarily thin text.

Do not introduce a new font dependency unless necessary.

Prefer the font already used by the project if it is suitable.

---

# 8. ANIMATION

Animations should be **smooth and subtle**.

Preferred animations:

* fade in
* fade up
* slight scale
* hover elevation
* subtle image zoom
* navigation underline movement
* button hover transitions
* soft card transitions
* subtle page transitions

Typical animation duration:

`200ms – 700ms`

Use easing that feels natural.

Avoid:

* bouncing
* aggressive scaling
* spinning
* flashing
* excessive parallax
* constant movement
* particle effects
* distracting background animations

Animations must never interfere with functionality.

---

# 9. RESPONSIVE DESIGN

The frontend must work properly on:

* desktop
* laptop
* tablet
* mobile

Pay special attention to:

* navbar
* hero
* sidebar
* dashboard cards
* SAR images
* maps
* tables
* vessel information
* buttons
* forms

Avoid horizontal overflow.

---

# 10. EXISTING FUNCTIONALITY MUST REMAIN

This is a **UI redesign**, not a rewrite.

Preserve all existing functionality.

Do not change:

* API calls
* inference calls
* image processing
* SAR detection logic
* vessel logic
* map data logic
* routing
* existing data handling
* existing forms
* existing business logic

If something already works, preserve it.

Only change how it looks and how it is presented.

---

# 11. HERO PAGE

The landing page should be the strongest visual part of the application.

It should immediately communicate:

**God's Eye — Ocean & Maritime Intelligence**

Possible visual direction:

### Navigation

Include:

* God's Eye branding/logo
* relevant existing navigation links
* primary CTA

Keep navigation minimal.

---

## Hero Headline

Use a strong, concise headline.

Possible direction:

> **See Beyond the Surface.**

Supporting text can communicate:

> AI-powered SAR intelligence for detecting oil spills, understanding marine activity, and monitoring vessels.

Use existing project terminology if it is more accurate.

---

## Hero Image

The repository already contains:

`public/hero/vessel.jpg`

Prefer using this existing image if it fits the redesigned hero.

The image should feel integrated into the design.

Possible treatment:

* rounded container
* subtle ocean gradient
* soft overlay
* slight depth
* subtle movement
* floating information card

Do not over-design it.

### Image comment

If an image is added or replaced, include one simple comment near its source:

```tsx
// Change this image path to use a different hero image.
```

Do not add lengthy comments.

---

## Hero CTA

Use the existing application/dashboard route.

Possible CTA:

**Explore Dashboard**

or

**Open Monitoring**

Do not invent a new route.

---

## Hero Animation

On page load:

1. headline fades upward
2. supporting text follows
3. CTA follows
4. hero image gently fades/scales into place

Keep the animation subtle.

---

# 12. LANDING PAGE SECTIONS

If appropriate based on existing content, organize the landing page around existing capabilities such as:

1. Detection
2. Characterization
3. Drift
4. Vessel Intelligence
5. Evidence

Do not invent capabilities that do not exist.

Each section should be simple.

Use:

* large heading
* short description
* visual/card
* subtle animation

Avoid excessive content.

---

# 13. DASHBOARD DESIGN

The dashboard should feel like the same product as the landing page.

Use:

* light ocean background
* white/light cards
* deep blue navigation
* subtle borders
* consistent rounded corners
* generous spacing

---

# 14. SIDEBAR

The sidebar should use the ocean theme.

Recommended:

* deep ocean background
* white/light text
* subtle active state
* simple icons
* smooth transitions

Keep existing navigation items.

Do not remove functional pages.

The active page should be immediately obvious.

---

# 15. TOPBAR

Improve:

* spacing
* page title
* status information
* user controls if already present

Keep it clean.

Avoid filling the topbar with unnecessary elements.

---

# 16. CARDS

Cards should generally use:

* white/light background
* subtle border
* soft shadow
* rounded corners
* consistent padding
* clear heading

Hover states may include:

* slight elevation
* subtle border/accent change
* very small movement

Do not make cards jump or scale excessively.

---

# 17. SAR / OIL-SPILL DETECTION UI

Improve the visual presentation without changing the detection logic.

Preserve:

* image upload
* inference
* results
* existing API calls
* image processing
* existing output

---

## SAR Image Area

Improve:

* image container
* image framing
* zoom/view presentation
* result visualization
* loading state
* result state

Use the ocean design language.

---

## Detection Results

Make existing information easy to scan.

Examples of information that can be highlighted IF ALREADY PROVIDED BY THE APPLICATION:

* detection status
* confidence
* detected area
* image metadata
* classification

Never fabricate values.

---

## Loading State

Use a simple loading state.

Example:

> Analyzing SAR imagery...

Animation should be subtle.

Do not pretend to show real-time progress if the backend does not provide it.

---

# 18. VESSEL / AIS UI

Improve the visual presentation of existing vessel functionality.

Do NOT build a new AIS backend.

Do NOT invent vessel positions.

Do NOT fabricate real-time vessel data.

Preserve existing data sources and logic.

Improve:

* vessel cards
* vessel details
* map container
* status indicators
* filters/search if they already exist
* loading states
* empty states

Use a maritime/ocean visual style.

---

# 19. MAPS

Existing maps should continue functioning exactly as before.

UI improvements may include:

* map container styling
* rounded corners
* surrounding controls
* headers
* information panels

Do not change:

* map data logic
* API logic
* vessel coordinates
* backend integration

unless explicitly approved.

---

# 20. OTHER PAGES

Apply the same design language to:

* Characterization
* Drift
* Evidence
* Oil Type
* Technology

Do not make every page identical.

Instead:

* maintain consistent colors
* maintain consistent typography
* maintain consistent cards
* maintain consistent spacing
* maintain consistent animation

while allowing each page to have its own content hierarchy.

---

# 21. EMPTY STATES

Create clean empty states where appropriate.

Examples:

> No analysis available yet.

> Upload a SAR image to begin analysis.

> No vessel data available.

Only use messages that accurately describe the application's state.

---

# 22. ACCESSIBILITY

Maintain:

* readable contrast
* usable font sizes
* visible focus states
* meaningful button labels
* keyboard accessibility where practical
* appropriate image alt text

Do not sacrifice accessibility for visual effects.

---

# 23. PERFORMANCE

Avoid unnecessary:

* large assets
* dependencies
* animation libraries
* client-side rendering
* duplicate components
* repeated code

Reuse existing components whenever possible.

Do not introduce a large animation framework simply for small animations.

---

# 24. CODE QUALITY

Only clean up code that is directly related to the UI work.

Remove:

* unused imports introduced by your changes
* obvious dead code introduced by your changes

Do not refactor unrelated application logic.

Do not rewrite working components without a UI reason.

---

# 25. TESTING

After each phase:

* start the frontend
* verify affected pages
* check browser console
* check for TypeScript errors
* check responsive layout
* check navigation
* check affected functionality

Never assume the UI works without testing.

---

# 26. PHASED IMPLEMENTATION

The implementation MUST happen in phases.

## PHASE 1 — AUDIT + DESIGN SYSTEM

Inspect:

* project architecture
* frontend structure
* existing pages
* components
* styles
* navigation
* existing animations
* existing assets

Establish:

* colors
* typography
* spacing
* card styles
* buttons
* transitions
* global UI rules

Do NOT redesign all pages yet.

### STOP

After Phase 1:

* test the frontend
* report changes
* list modified files
* confirm backend was untouched

Then STOP.

Wait for:

`CONTINUE`

---

# PHASE 2 — LANDING PAGE

Redesign:

* navbar
* hero
* hero image
* CTA
* supporting sections
* landing-page animations

Use `public/hero/vessel.jpg` if appropriate.

### STOP

Test the landing page.

Wait for:

`CONTINUE`

---

# PHASE 3 — DASHBOARD SHELL

Redesign:

* sidebar
* topbar
* dashboard background
* navigation
* common cards
* responsive dashboard structure

Preserve all routes.

### STOP

Test dashboard navigation.

Wait for:

`CONTINUE`

---

# PHASE 4 — DETECTION

Redesign the existing SAR/oil-spill detection interface.

Preserve all detection functionality.

### STOP

Test the actual detection workflow.

Wait for:

`CONTINUE`

---

# PHASE 5 — VESSEL / AIS

Redesign the existing vessel/AIS interface.

Preserve all vessel logic and data sources.

### STOP

Test vessel functionality.

Wait for:

`CONTINUE`

---

# PHASE 6 — REMAINING PAGES

Redesign:

* Characterization
* Drift
* Evidence
* Oil Type
* Technology

Preserve functionality.

### STOP

Test all affected pages.

Wait for:

`CONTINUE`

---

# PHASE 7 — FINAL POLISH

Perform:

* responsive QA
* animation polish
* accessibility checks
* spacing consistency
* typography consistency
* performance review
* console/error checks
* final build/run test

Do not introduce new features.

---

# 27. PHASE RULE

## NEVER CONTINUE AUTOMATICALLY.

After completing a phase:

1. Report what was done.
2. Report modified files.
3. Report tests performed.
4. Confirm backend remains untouched.
5. STOP.

Only continue when the user explicitly says:

> CONTINUE

---

# 28. FINAL ACCEPTANCE CRITERIA

The final frontend should:

* look modern
* feel ocean-inspired
* use a blue maritime palette
* have smooth subtle animations
* have clean spacing
* have consistent cards
* have a premium landing page
* have a polished dashboard
* work responsively
* preserve all existing functionality
* avoid unnecessary complexity
* avoid fake data
* avoid unnecessary dependencies

Most importantly:

## THE BACKEND MUST REMAIN COMPLETELY UNCHANGED.

The final product should feel like:

> **A calm, intelligent, modern ocean-monitoring platform powered by SAR and AI.**
