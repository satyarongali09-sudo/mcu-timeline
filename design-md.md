# MCU TIMELINE — THE MULTIVERSE EXPERIENCE
## Design System & Creative Direction Specification (`design-md.md`)

---

### 1. Design Philosophy

**"One Universe. Infinite Stories."**
The MCU Timeline is an interactive digital universe—a fusion of high-end Awwwards-caliber editorial storytelling, digital museum archiving, and interactive network science. 

Rather than a generic movie listing website with repetitive cards and template gradients, every section functions as an intentional cinematic chapter. The central visual and narrative anchor is the **Yggdrasil Multiverse Tree**:
- **Roots**: Cosmic & ancient origins (Celestials, WWII, Tesseract).
- **Trunk**: The Sacred Timeline (Earth-616).
- **Branches**: The Six MCU Phases (Phases 1–3 Infinity Saga, Phases 4–6 Multiverse Saga).
- **Nodes & Leaves**: Characters, hero alliances, and nexus events.
- **Interconnected Threads**: The Marvel Network — social and narrative connections across timelines.
- **Outer Branches & Portals**: Alternate realities, incursions, and multiverse offshoots (Earth-838, Fox Mutants, Spider-Verse).

---

### 2. Color Palette & Thematic Lighting

Dark, atmospheric, near-black space surfaces punctured by cosmic luminescence and stone-specific accent frequencies:

#### Base Void Surfaces
- `--bg-void`: `#05070C` (Absolute cosmic deep)
- `--bg-space`: `#080B13` (Interstellar background)
- `--bg-deep`: `#0D111B` (Nebula undertone)
- `--bg-card`: `#101725` (Subtle glassmorphic surface)
- `--bg-card-hover`: `#151D2C` (Elevated interactive surface)
- `--surface-glass`: `rgba(16, 23, 37, 0.72)` (Backdrop-filtered 16px blur)

#### Typography Colors
- `--text-primary`: `#F5F5F7` (Pristine titanium white)
- `--text-secondary`: `#9AA6B8` (Celestial silver / subdued description)
- `--text-muted`: `#4A5568` (Deep metadata tone)
- `--border-subtle`: `rgba(255, 255, 255, 0.07)`
- `--border-bright`: `rgba(255, 255, 255, 0.18)`

#### Cosmic & Infinity Stone Accents
- **Space Stone (Cosmic Blue)**: `#3C8DFF` (`rgba(60, 141, 255, 0.25)` aura)
- **Mind Stone (Electric Gold)**: `#FACC15` (`rgba(250, 204, 21, 0.25)` aura)
- **Reality Stone (Aether Red)**: `#E84B4B` (`rgba(232, 75, 75, 0.25)` aura)
- **Power Stone (Orb Purple)**: `#8257FF` (`rgba(130, 87, 255, 0.25)` aura)
- **Time Stone (Agamotto Green)**: `#00E676` (`rgba(0, 230, 118, 0.25)` aura)
- **Soul Stone (Vormir Orange)**: `#FF8A00` (`rgba(255, 138, 0, 0.25)` aura)
- **Stark Gold**: `#D6B36A`
- **Quantum / TVA Emerald**: `#00F0FF`

---

### 3. Typography Hierarchy

Imported Fonts:
- **Display Headings**: `'Bebas Neue', sans-serif` (All-caps, high-impact cinematic editorial titles, tight letter-spacing `0.04em - 0.08em`).
- **Body & Information**: `'Outfit', -apple-system, sans-serif` (Geometric, clean, readable modern grotesque).
- **Secondary Accent**: `'Playfair Display', serif` (Agency and regal historic elements).

#### Typographic Scale
- **Hero Title**: `clamp(3.2rem, 7.5vw, 6.2rem)` | Line-height `0.98` | Bold 700
- **Section Major Header**: `clamp(2.2rem, 4.5vw, 3.8rem)` | Line-height `1.05`
- **Chapter / Phase Banner**: `1.8rem - 2.4rem` | Uppercase | Letter-spacing `0.1em`
- **Card & Node Titles**: `1rem - 1.15rem` | Medium 600
- **Body Text**: `0.88rem - 0.96rem` (`14px - 15.4px`) | Line-height `1.6`
- **Metadata & Tags**: `0.62rem - 0.72rem` (`10px - 11.5px`) | Weight 700 | Uppercase | Letter-spacing `0.18em`

---

### 4. Layout Rules & Spatial Architecture

1. **Editorial Pacing**: Alternate between full-bleed cinematic hero moments, pinned horizontal timeline scrolling, interactive force-directed graph canvases, and asymmetrical split-screen panels.
2. **Horizontal Pinned Timeline**: The Infinity Saga and Multiverse Saga utilize pinned-scroll progression where users journey through Phase 1 to Phase 6 chronologically.
3. **Negative Space**: Generous breathing room (`padding: 5rem - 7rem` desktop, `3rem` mobile) ensuring individual story elements command focus.
4. **Z-index Layers**:
   - `0`: Background particle canvas & nebula field
   - `1`: Yggdrasil SVG/Canvas layer
   - `10`: Content cards, editorial grids, and text
   - `50`: Sticky Multiverse Navigation & Scroll progress tracker
   - `100`: Interactive Stone details & Filter pills
   - `1000+`: Modals, Character Dossiers, and Thanos Gauntlet Snap overlay

---

### 5. Signature Animations & Motion Principles

1. **Cinematic Stagger**: Content sections reveal via masked translation (`translateY(24px) -> 0`) combined with subtle blur fade (`filter: blur(4px) -> blur(0px)`).
2. **Scroll-Driven Camera Pacing**: ScrollTrigger orchestrates the tree's branch illumination and camera zoom as the viewer journeys from ancient roots to the cosmic canopy.
3. **Atmospheric Particles**: Canvas-driven floating cosmic dust with organic Brownian motion that reacts subtly to mouse velocity.
4. **Stone Illuminations**: Radial luminescent flares activated upon hover/click with KaTeX-accurate SVG glyph paths.
5. **Reduced Motion**: All transforms and continuous canvas loops degrade gracefully to static clean editorial layouts when `prefers-reduced-motion: reduce` is detected.

---

### 6. Component Specs

- **Floating Multiverse Header**: Glassmorphism navbar (`backdrop-filter: blur(16px)`), Infinity Stones tracker showing real-time saga exploration status, and chapter jump pills.
- **Character Dossier Modal**: Split-pane interface: high-resolution verified artwork on the left, authenticated Marvel dossier on the right (real name, affiliations, verified power set, cinematic appearances, and comic continuity distinction).
- **Marvel Network Explorer**: Interactive node graph powered by verified relationship matrix and genuine network science centrality scores (degree, eigenvector, betweenness) calculated from the `marvel-network-universe.ipynb` dataset.
- **Infinity Stone Altar**: 3D geometric interactive stones featuring dynamic color grading that washes the surrounding atmosphere in corresponding stone light.
- **Movie Archive**: Dual-mode exploration: **Release Order** (the historical premiere timeline) vs. **Story Chronology** (in-universe chronological sequence), with instant search, phase filter, and Hotstar/Disney+ deep links.

---

### 7. Accessibility & Performance Guardrails

- **Semantic Landmark Roles**: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`.
- **Contrast**: Text contrast strictly exceeds WCAG AA (minimum 4.5:1 for body, 3:1 for large display).
- **Responsive**: 100% fluid down to 320px viewport width; touch-friendly target size minimum 44x44px.
- **Images**: Lazy loaded with native decoding async and blur placeholders.
- **Memory Safety**: Event listeners and animation requestAnimationFrame loops cleanly disconnected during component unmount.

---

### 8. Do's and Don'ts

#### Do's
- **Do** verify character data against authoritative Marvel canonical sources.
- **Do** clearly distinguish MCU canon (Earth-616) from Fox Mutant timelines, Sony Universe, and comic book origins.
- **Do** compute statistics directly from verified data rather than hardcoding random figures.
- **Do** preserve full existing user progress and bookmarking capabilities in `localStorage`.

#### Don'ts
- **Don't** display corrupt/shuffled CSV data (e.g., Victor Von Doom as Vision, Mac Gargan as Doc Ock).
- **Don't** use generic rectangular cards with flat purple gradients everywhere.
- **Don't** invent unannounced release dates or unverified movie plots.
- **Don't** break Netlify deployment or production Vite build compatibility.
