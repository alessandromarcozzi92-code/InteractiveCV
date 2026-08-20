# Scenic Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the existing 8-bit CV site an environment and a rhythm — a
parallax night sky with a pixel skyline, a real type scale, and
scroll-driven motion — without changing content, routing, or the data model.

**Architecture:** A self-contained `scenery/` layer draws the sky in inline
SVG behind everything and knows nothing about the content. The page itself
scrolls while the header and the scenery are `position: fixed`, which is
what lets CSS `animation-timeline` drive parallax with no JavaScript. Every
animation is additive: the CSS default is the finished state, and motion is
layered on inside `@supports`.

**Tech Stack:** React, TypeScript, CSS Modules, inline SVG, CSS
`animation-timeline` (scroll-driven animations), Vitest, React Testing
Library. No new runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-08-20-scenic-redesign-design.md`

## Global Constraints

- The six UI colour tokens keep their current values and meanings.
  `--c-accent` (#f2c94c) stays reserved for active state and numeric values.
- Environment tokens (`--sky-*`, `--city-*`, `--star`, `--window`) describe
  the scene. No component under `components/ui/`, `components/layout/` or
  `routes/` may reference them. Only `components/scenery/` may.
- Font sizes come from `--fs-1`..`--fs-8` and are whole pixels: 12, 14, 16,
  20, 24, 32, 48, 64. A pixel font rendered at a fractional size shimmers.
  The single exception is the title-screen heading, which uses `clamp()`.
- Body text stays `1rem`, line-height `1.7`, measure capped at `65ch`.
- Every animation uses `steps()`. The only exception is parallax, where
  stepping would read as a bug rather than as a style.
- **The finished state is the CSS default.** Animation is added inside
  `@supports (animation-timeline: view())`. Never write `opacity: 0` in
  base CSS and raise it from an animation — an unsupported browser would
  show a blank page.
- Every animation must also be disabled under
  `prefers-reduced-motion: reduce`, showing its end state.
- Every node in `components/scenery/` carries `aria-hidden="true"` and
  exposes no accessible content. Removing the whole layer must leave the CV
  complete.
- No new runtime dependencies. No external image assets, no animation
  library, no canvas, no WebGL.
- **The 52 existing tests must pass unmodified.** If a test needs changing
  to accommodate the restyle, the restyle has overstepped: the behaviour was
  not supposed to change.
- At most one `<h2>` per screen.
- No information may be conveyed by colour or icon alone.

---

### Task 1: Design tokens — environment palette, type scale, depth scale

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/components/layout/NavMenu.module.css`, `src/components/layout/ArcadeShell.module.css`, `src/components/ui/Panel.module.css`, `src/components/ui/PixelButton.module.css`, `src/routes/screens.module.css`, `src/routes/TitleScreen.module.css`
- Test: `src/styles/tokens.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: the token names every later task uses —
  `--sky-zenith`, `--sky-horizon`, `--city-far`, `--city-near`, `--star`,
  `--window`, `--glow-accent`, `--glow-cyan`, `--fs-1`..`--fs-8`,
  `--z-scenery`, `--z-content`, `--z-shell`.

- [x] **Step 1: Write the failing token test**

This test reads the stylesheets as text. jsdom does not evaluate CSS, so
asserting on the source is the only way to hold these invariants. It is
worth holding: a stray hardcoded `font-size: 13px` is exactly the drift
this task exists to remove.

Create `src/styles/tokens.test.ts`:

```ts
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const SRC = join(process.cwd(), 'src')

function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return cssFiles(path)
    return entry.name.endsWith('.css') ? [path] : []
  })
}

const tokens = readFileSync(join(SRC, 'styles/tokens.css'), 'utf8')

test('declares the environment palette', () => {
  for (const name of [
    '--sky-zenith',
    '--sky-horizon',
    '--city-far',
    '--city-near',
    '--star',
    '--window',
    '--glow-accent',
    '--glow-cyan',
  ]) {
    expect(tokens).toContain(`${name}:`)
  }
})

test('declares a whole-pixel type scale', () => {
  const sizes = ['12px', '14px', '16px', '20px', '24px', '32px', '48px', '64px']
  sizes.forEach((size, index) => {
    expect(tokens).toContain(`--fs-${index + 1}: ${size}`)
  })
})

test('declares the three-plane depth scale', () => {
  for (const name of ['--z-scenery', '--z-content', '--z-shell']) {
    expect(tokens).toContain(`${name}:`)
  }
})

test('no stylesheet hardcodes a font-size outside the scale', () => {
  const offenders = cssFiles(SRC)
    .filter((path) => !path.endsWith('tokens.css'))
    .flatMap((path) => {
      const source = readFileSync(path, 'utf8')
      const matches = source.match(/font-size:\s*\d+px/g) ?? []
      return matches.map((match) => `${path}: ${match}`)
    })

  expect(offenders).toEqual([])
})
```

- [x] **Step 2: Run to verify it fails**

Run: `npm test src/styles/tokens.test.ts`
Expected: FAIL — no environment tokens, no `--fs-*`, and several modules
still hardcode `font-size` in pixels.

- [x] **Step 3: Extend the tokens**

Replace `src/styles/tokens.css`:

```css
:root {
  /* --- UI palette: unchanged, meanings unchanged --- */
  --c-bg: #10131c;
  --c-panel: #1d2233;
  --c-ink: #e8e6da;
  --c-accent: #f2c94c;
  --c-accent-2: #38b6ff;
  --c-hp: #6ee06e;

  /* --- Environment palette: the scene, never the interface.
         Only components/scenery/ may reference these. --- */
  --sky-zenith: #070912;
  --sky-horizon: #2a2038;
  --city-far: #161b2e;
  --city-near: #080a12;
  /* Same values as --c-ink / --c-accent, different roles: a lit window is
     not "the active state". The scene must not follow a UI palette change. */
  --star: #e8e6da;
  --window: #f2c94c;

  --glow-accent: 0 0 12px rgb(242 201 76 / 0.45);
  --glow-cyan: 0 0 12px rgb(56 182 255 / 0.4);

  --font-display: 'Silkscreen', monospace;
  --font-body: 'Pixelify Sans', monospace;

  /* Whole pixels only: a pixel font at a fractional size shimmers. */
  --fs-1: 12px;
  --fs-2: 14px;
  --fs-3: 16px;
  --fs-4: 20px;
  --fs-5: 24px;
  --fs-6: 32px;
  --fs-7: 48px;
  --fs-8: 64px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 16px;
  --space-4: 24px;
  --space-5: 40px;
  --space-6: 64px;

  --border-w: 4px;
  --measure: 65ch;

  --z-scenery: 0;
  --z-content: 10;
  --z-shell: 20;
}
```

Note `--z-overlay` is gone: nothing referenced it.

- [x] **Step 4: Replace the hardcoded font sizes**

Six edits, one per file. Each replaces a literal with the matching token.

`src/components/layout/NavMenu.module.css` — in `.menu`:

```css
  font-size: var(--fs-1);
```

(was `13px`; 13 is not on the scale, and 12 is the nearest step down —
menu labels are uppercase display type and read fine one step smaller)

`src/components/layout/ArcadeShell.module.css` — in `.brand`:

```css
  font-size: var(--fs-3);
```

`src/components/ui/Panel.module.css` — in `.title`:

```css
  font-size: var(--fs-4);
```

(was `18px`; 20 is the nearest step)

`src/components/ui/PixelButton.module.css` — in `.button`:

```css
  font-size: var(--fs-2);
```

`src/routes/screens.module.css` — in `.key` and `.groupTitle`:

```css
  font-size: var(--fs-1);
```

in `.meta`:

```css
  font-size: var(--fs-2);
```

in `.tag`:

```css
  font-size: var(--fs-1);
```

(was `13px`)

`src/routes/TitleScreen.module.css` — in `.title`:

```css
  font-size: clamp(var(--fs-6), 9vw, var(--fs-8));
```

`src/components/ui/StatBar.module.css` has no `font-size`; leave it alone.

- [x] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS — the four new token tests plus the 52 existing ones,
unmodified.

- [x] **Step 6: Build and lint**

Run: `npm run build && npm run lint`
Expected: both clean.

- [x] **Step 7: Commit**

```bash
git add src/styles src/components src/routes
git commit -m "feat: add environment palette, type scale, and depth scale"
```

---

### Task 2: Deterministic scene data and the Stars and Moon layers

**Files:**
- Create: `src/components/scenery/sceneData.ts`
- Create: `src/components/scenery/Stars.tsx`
- Create: `src/components/scenery/Moon.tsx`
- Test: `src/components/scenery/sceneData.test.ts`, `src/components/scenery/Stars.test.tsx`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `type Star = { x: number; y: number; size: number; tier: 1 | 2 | 3 }`
  - `type Building = { x: number; width: number; height: number; windows: boolean[] }`
  - `createStars(count: number, seed: number): Star[]`
  - `createSkyline(count: number, seed: number, maxHeight: number): Building[]`
  - `<Stars count?: number />` — inline `<svg>`, `aria-hidden`
  - `<Moon />` — inline `<svg>`, `aria-hidden`

`x`, `y`, `width` and `height` are percentages of the viewBox (0-100), so
the SVG scales to any viewport without recomputing.

- [x] **Step 1: Write the failing scene-data test**

Create `src/components/scenery/sceneData.test.ts`:

```ts
import { createSkyline, createStars } from './sceneData'

test('createStars is deterministic for a given seed', () => {
  expect(createStars(20, 7)).toEqual(createStars(20, 7))
})

test('createStars varies with the seed', () => {
  expect(createStars(20, 7)).not.toEqual(createStars(20, 8))
})

test('stars land inside the viewBox', () => {
  for (const star of createStars(60, 1)) {
    expect(star.x).toBeGreaterThanOrEqual(0)
    expect(star.x).toBeLessThanOrEqual(100)
    expect(star.y).toBeGreaterThanOrEqual(0)
    expect(star.y).toBeLessThanOrEqual(100)
    expect([1, 2, 3]).toContain(star.tier)
  }
})

test('createSkyline is deterministic for a given seed', () => {
  expect(createSkyline(10, 3, 60)).toEqual(createSkyline(10, 3, 60))
})

test('buildings respect the height ceiling and carry windows', () => {
  for (const building of createSkyline(10, 3, 60)) {
    expect(building.height).toBeGreaterThan(0)
    expect(building.height).toBeLessThanOrEqual(60)
    expect(building.windows.length).toBeGreaterThan(0)
  }
})

test('buildings tile the full width without gaps', () => {
  const buildings = createSkyline(10, 3, 60)
  const last = buildings[buildings.length - 1]
  expect(buildings[0].x).toBe(0)
  expect(last.x + last.width).toBeCloseTo(100, 5)
})
```

- [x] **Step 2: Run to verify it fails**

Run: `npm test src/components/scenery/sceneData.test.ts`
Expected: FAIL — cannot resolve `./sceneData`.

- [x] **Step 3: Implement the scene data**

`Math.random` is deliberately not used: the scene must be identical on
every render and in every test run. `mulberry32` is a small, well-known
seeded generator — thirty-odd bits of state, no dependency.

Create `src/components/scenery/sceneData.ts`:

```ts
export type Star = { x: number; y: number; size: number; tier: 1 | 2 | 3 }

export type Building = {
  x: number
  width: number
  height: number
  windows: boolean[]
}

/**
 * Seeded pseudo-random generator. The scene must be byte-identical across
 * renders and test runs, so Math.random is not an option.
 *
 * @param seed - Any integer; the same seed always yields the same sequence.
 * @returns A function producing successive numbers in [0, 1).
 */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Builds the starfield as percentages of the SVG viewBox.
 *
 * @param count - How many stars to place.
 * @param seed - Seed for the layout.
 * @returns Stars ordered as generated; tier 1 is brightest.
 */
export function createStars(count: number, seed: number): Star[] {
  const random = mulberry32(seed)

  return Array.from({ length: count }, () => {
    const roll = random()
    const tier: 1 | 2 | 3 = roll > 0.85 ? 1 : roll > 0.55 ? 2 : 3

    return {
      x: Math.round(random() * 10000) / 100,
      // Stars thin out towards the horizon: squaring biases upward.
      y: Math.round(random() ** 2 * 10000) / 100,
      size: tier === 1 ? 2 : 1,
      tier,
    }
  })
}

/**
 * Builds a row of buildings that tiles the full viewBox width.
 *
 * @param count - How many buildings to place.
 * @param seed - Seed for the layout.
 * @param maxHeight - Tallest possible building, in viewBox percent.
 * @returns Buildings left to right, together spanning exactly 0-100.
 */
export function createSkyline(
  count: number,
  seed: number,
  maxHeight: number,
): Building[] {
  const random = mulberry32(seed)
  const width = 100 / count

  return Array.from({ length: count }, (_, index) => {
    const height = Math.round((0.35 + random() * 0.65) * maxHeight * 100) / 100
    const windowCount = 3 + Math.floor(random() * 6)

    return {
      x: Math.round(index * width * 100) / 100,
      width,
      height,
      windows: Array.from({ length: windowCount }, () => random() > 0.45),
    }
  })
}
```

- [x] **Step 4: Run the scene-data test to verify it passes**

Run: `npm test src/components/scenery/sceneData.test.ts`
Expected: PASS, 6 tests.

- [x] **Step 5: Write the failing Stars test**

Create `src/components/scenery/Stars.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { Moon } from './Moon'
import { Stars } from './Stars'

test('Stars renders one rect per star', () => {
  const { container } = render(<Stars count={12} />)
  expect(container.querySelectorAll('rect')).toHaveLength(12)
})

test('Stars is hidden from assistive technology', () => {
  const { container } = render(<Stars count={12} />)
  expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
})

test('Stars renders identically twice', () => {
  const first = render(<Stars count={30} />).container.innerHTML
  const second = render(<Stars count={30} />).container.innerHTML
  expect(first).toBe(second)
})

test('Moon is hidden from assistive technology', () => {
  const { container } = render(<Moon />)
  expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
})
```

- [x] **Step 6: Run to verify it fails**

Run: `npm test src/components/scenery/Stars.test.tsx`
Expected: FAIL — cannot resolve `./Moon`.

- [x] **Step 7: Implement Stars and Moon**

Create `src/components/scenery/Stars.tsx`:

```tsx
import { createStars } from './sceneData'
import styles from './Scenery.module.css'

const STAR_SEED = 20260820

type StarsProps = { count?: number }

export function Stars({ count = 60 }: StarsProps) {
  const stars = createStars(count, STAR_SEED)

  return (
    <svg
      className={styles.stars}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {stars.map((star, index) => (
        <rect
          key={index}
          x={star.x}
          y={star.y}
          width={star.size}
          height={star.size}
          className={styles.star}
          data-tier={star.tier}
        />
      ))}
    </svg>
  )
}
```

Create `src/components/scenery/Moon.tsx`:

```tsx
import styles from './Scenery.module.css'

export function Moon() {
  return (
    <svg
      className={styles.moon}
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      {/* Stepped disc: rectangles, not a circle — a circle would be
          anti-aliased and read as a different medium. */}
      <rect x="5" y="2" width="6" height="1" />
      <rect x="3" y="3" width="10" height="2" />
      <rect x="2" y="5" width="12" height="6" />
      <rect x="3" y="11" width="10" height="2" />
      <rect x="5" y="13" width="6" height="1" />
    </svg>
  )
}
```

Create `src/components/scenery/Scenery.module.css` with just what these
two need for now; Task 3 extends it:

```css
.stars,
.moon {
  position: absolute;
  display: block;
}

.stars {
  inset: 0;
  width: 100%;
  height: 100%;
}

.star {
  fill: var(--star);
}

.star[data-tier='1'] {
  opacity: 1;
}

.star[data-tier='2'] {
  opacity: 0.65;
}

.star[data-tier='3'] {
  opacity: 0.35;
}

.moon {
  top: 8%;
  right: 12%;
  width: 64px;
  height: 64px;
  fill: var(--star);
  filter: drop-shadow(var(--glow-cyan));
}
```

- [x] **Step 8: Run the full suite**

Run: `npm test`
Expected: PASS, all tests.

- [x] **Step 9: Commit**

```bash
git add src/components/scenery
git commit -m "feat: add deterministic scene data with stars and moon layers"
```

---

### Task 3: Sky, Skyline, and the composed Scenery layer

**Files:**
- Create: `src/components/scenery/Sky.tsx`
- Create: `src/components/scenery/Skyline.tsx`
- Create: `src/components/scenery/Scenery.tsx`
- Modify: `src/components/scenery/Scenery.module.css`
- Test: `src/components/scenery/Scenery.test.tsx`

**Interfaces:**
- Consumes: `createSkyline`, `Star`, `Building` from `./sceneData`; `Stars`,
  `Moon`
- Produces:
  - `<Sky />` — the gradient and vignette, a `<div>`, `aria-hidden`
  - `<Skyline plane: 'far' | 'near' />` — inline `<svg>`, `aria-hidden`;
    the `near` plane draws lit windows, `far` does not
  - `<Scenery intensity?: 'full' | 'muted' />` — composes Sky, Stars, Moon
    and both Skyline planes; `muted` is the default

- [x] **Step 1: Write the failing Scenery test**

Create `src/components/scenery/Scenery.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { Scenery } from './Scenery'

test('exposes no accessible content', () => {
  render(<Scenery />)
  expect(screen.queryAllByRole('img')).toHaveLength(0)
  expect(screen.queryAllByRole('graphics-document')).toHaveLength(0)
  expect(document.body).toHaveTextContent('')
})

test('every svg root is hidden from assistive technology', () => {
  const { container } = render(<Scenery />)
  const roots = container.querySelectorAll('svg')
  expect(roots.length).toBeGreaterThan(0)
  roots.forEach((root) => {
    expect(root).toHaveAttribute('aria-hidden', 'true')
  })
})

test('draws both skyline planes', () => {
  const { container } = render(<Scenery />)
  expect(container.querySelector('[data-plane="far"]')).toBeInTheDocument()
  expect(container.querySelector('[data-plane="near"]')).toBeInTheDocument()
})

test('only the near plane lights windows', () => {
  const { container } = render(<Scenery />)
  const far = container.querySelector('[data-plane="far"]')
  const near = container.querySelector('[data-plane="near"]')
  expect(far?.querySelectorAll('[data-window]')).toHaveLength(0)
  expect(near?.querySelectorAll('[data-window]').length).toBeGreaterThan(0)
})

test('carries the requested intensity', () => {
  const { container, rerender } = render(<Scenery intensity="full" />)
  expect(container.firstElementChild).toHaveAttribute('data-intensity', 'full')
  rerender(<Scenery intensity="muted" />)
  expect(container.firstElementChild).toHaveAttribute('data-intensity', 'muted')
})

test('defaults to the muted intensity', () => {
  const { container } = render(<Scenery />)
  expect(container.firstElementChild).toHaveAttribute('data-intensity', 'muted')
})
```

- [x] **Step 2: Run to verify it fails**

Run: `npm test src/components/scenery/Scenery.test.tsx`
Expected: FAIL — cannot resolve `./Scenery`.

- [x] **Step 3: Implement Sky**

Create `src/components/scenery/Sky.tsx`:

```tsx
import styles from './Scenery.module.css'

export function Sky() {
  return <div className={styles.sky} aria-hidden="true" />
}
```

- [x] **Step 4: Implement Skyline**

Create `src/components/scenery/Skyline.tsx`:

```tsx
import { createSkyline } from './sceneData'
import styles from './Scenery.module.css'

const PLANE_CONFIG = {
  far: { seed: 1312, count: 22, maxHeight: 38, windows: false },
  near: { seed: 8471, count: 13, maxHeight: 62, windows: true },
} as const

type SkylineProps = { plane: 'far' | 'near' }

export function Skyline({ plane }: SkylineProps) {
  const { seed, count, maxHeight, windows } = PLANE_CONFIG[plane]
  const buildings = createSkyline(count, seed, maxHeight)

  return (
    <svg
      className={styles.skyline}
      data-plane={plane}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {buildings.map((building, index) => (
        <g key={index}>
          <rect
            className={styles.building}
            x={building.x}
            y={100 - building.height}
            width={building.width}
            height={building.height}
          />
          {windows
            ? building.windows.map((lit, windowIndex) =>
                lit ? (
                  <rect
                    key={windowIndex}
                    data-window=""
                    className={styles.window}
                    x={building.x + building.width * 0.25}
                    y={100 - building.height + 2 + windowIndex * 3}
                    width={building.width * 0.5}
                    height={1.2}
                    style={{ '--w': windowIndex } as CSSProperties}
                  />
                ) : null,
              )
            : null}
        </g>
      ))}
    </svg>
  )
}
```

The file's first line must be `import type { CSSProperties } from 'react'`.
Writing `React.CSSProperties` will not compile: the modern JSX transform
leaves no `React` binding in scope.

- [x] **Step 5: Implement Scenery**

Create `src/components/scenery/Scenery.tsx`:

```tsx
import { Moon } from './Moon'
import { Sky } from './Sky'
import { Skyline } from './Skyline'
import { Stars } from './Stars'
import styles from './Scenery.module.css'

type SceneryProps = {
  /**
   * `full` on the title screen: tall skyline, bright stars.
   * `muted` behind content: the scene must never compete with text.
   */
  intensity?: 'full' | 'muted'
}

export function Scenery({ intensity = 'muted' }: SceneryProps) {
  return (
    <div className={styles.scenery} data-intensity={intensity} aria-hidden="true">
      <Sky />
      <Stars />
      <Moon />
      <Skyline plane="far" />
      <Skyline plane="near" />
    </div>
  )
}
```

- [x] **Step 6: Extend the scenery stylesheet**

Append to `src/components/scenery/Scenery.module.css`:

```css
.scenery {
  position: fixed;
  inset: 0;
  z-index: var(--z-scenery);
  overflow: hidden;
  pointer-events: none;
}

.sky {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      120% 80% at 50% 100%,
      rgb(0 0 0 / 0) 40%,
      rgb(0 0 0 / 0.55) 100%
    ),
    linear-gradient(to bottom, var(--sky-zenith) 0%, var(--sky-horizon) 100%);
}

.skyline {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.skyline[data-plane='far'] .building {
  fill: var(--city-far);
}

.skyline[data-plane='near'] .building {
  fill: var(--city-near);
}

.window {
  fill: var(--window);
  opacity: 0.75;
}

/*
 * The vertical offset goes through a custom property, never through
 * `transform` directly: Task 8 animates `transform` for parallax, and a
 * static transform here would simply be overwritten.
 */
.skyline,
.stars {
  --base-y: 0px;
  transform: translateY(var(--base-y));
}

/* Muted is the default because most of the site is content. */
.scenery[data-intensity='muted'] .skyline {
  --base-y: 12vh;
  opacity: 0.7;
}

.scenery[data-intensity='muted'] .stars {
  opacity: 0.6;
}

.scenery[data-intensity='full'] .skyline {
  --base-y: 0px;
}
```

- [x] **Step 7: Run the full suite**

Run: `npm test`
Expected: PASS, all tests.

- [x] **Step 8: Build and lint**

Run: `npm run build && npm run lint`
Expected: both clean.

- [x] **Step 9: Commit**

```bash
git add src/components/scenery
git commit -m "feat: add sky, skyline planes, and the composed scenery layer"
```

---

### Task 4: Frame depth variants and a titleless Panel

**Files:**
- Modify: `src/components/ui/Frame.tsx`, `src/components/ui/Frame.module.css`
- Modify: `src/components/ui/Panel.tsx`
- Test: `src/components/ui/Frame.test.tsx` (append), `src/components/ui/Panel.test.tsx` (append)

**Interfaces:**
- Consumes: nothing
- Produces:
  - `<Frame depth?: 'flat' | 'raised' />` — `flat` is the default and
    renders exactly as today
  - `<Panel title?: string />` — `title` becomes optional. When omitted, no
    `<h2>` is rendered and the body fills the frame.

Existing calls to `Frame` and `Panel` keep working unchanged. The existing
tests for both must not be edited.

- [x] **Step 1: Append the failing Frame test**

Add to `src/components/ui/Frame.test.tsx`:

```tsx
test('is flat by default', () => {
  render(<Frame>CONTENT</Frame>)
  expect(screen.getByText('CONTENT')).toHaveAttribute('data-depth', 'flat')
})

test('carries the requested depth', () => {
  render(<Frame depth="raised">CONTENT</Frame>)
  expect(screen.getByText('CONTENT')).toHaveAttribute('data-depth', 'raised')
})
```

- [x] **Step 2: Append the failing Panel test**

Add to `src/components/ui/Panel.test.tsx`:

```tsx
test('renders no heading when no title is given', () => {
  render(<Panel>body</Panel>)
  expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  expect(screen.getByText('body')).toBeInTheDocument()
})
```

- [x] **Step 3: Run to verify both fail**

Run: `npm test src/components/ui`
Expected: FAIL — `depth` is not rendered, and `Panel` requires `title`.

- [x] **Step 4: Implement the Frame depth prop**

Replace `src/components/ui/Frame.tsx`:

```tsx
import type { ReactNode } from 'react'
import styles from './Frame.module.css'

type FrameElement = 'div' | 'section' | 'article' | 'li'

type FrameProps = {
  children: ReactNode
  as?: FrameElement
  className?: string
  /** `raised` lifts the frame off the scene with a stronger shadow. */
  depth?: 'flat' | 'raised'
}

export function Frame({
  children,
  as: Tag = 'div',
  className,
  depth = 'flat',
}: FrameProps) {
  const classes = [styles.frame, className].filter(Boolean).join(' ')
  return (
    <Tag className={classes} data-depth={depth}>
      {children}
    </Tag>
  )
}
```

Append to `src/components/ui/Frame.module.css`:

```css
.frame[data-depth='raised'] {
  box-shadow:
    0 0 0 var(--border-w) var(--c-bg),
    var(--space-2) var(--space-2) 0 var(--border-w) rgb(0 0 0 / 0.75),
    var(--glow-accent);
}
```

- [x] **Step 5: Implement the titleless Panel**

Replace `src/components/ui/Panel.tsx`:

```tsx
import type { ReactNode } from 'react'
import { Frame } from './Frame'
import styles from './Panel.module.css'

type PanelProps = {
  /** Omit when the screen already renders its heading in ScreenHeader. */
  title?: string
  children: ReactNode
  as?: 'section' | 'article' | 'li'
  className?: string
  depth?: 'flat' | 'raised'
}

export function Panel({ title, children, as = 'section', className, depth }: PanelProps) {
  return (
    <Frame as={as} className={className} depth={depth}>
      {title ? <h2 className={styles.title}>{title}</h2> : null}
      <div className={styles.body}>{children}</div>
    </Frame>
  )
}
```

- [x] **Step 6: Run the full suite**

Run: `npm test`
Expected: PASS, all tests — including the untouched Frame and Panel tests
from the original build.

- [x] **Step 7: Commit**

```bash
git add src/components/ui
git commit -m "feat: add frame depth variants and a titleless panel"
```

---

### Task 5: ScreenHeader with a derived section index

**Files:**
- Create: `src/components/layout/ScreenHeader.tsx`, `src/components/layout/ScreenHeader.module.css`
- Create: `src/lib/sections.ts`
- Test: `src/lib/sections.test.ts`, `src/components/layout/ScreenHeader.test.tsx`

**Interfaces:**
- Consumes: `MENU_ITEMS` from `src/data/menu.ts`
- Produces:
  - `sectionPosition(path: string): { index: number; total: number } | null`
    — 1-based index, `null` for a path outside the menu
  - `<ScreenHeader title: string; path: string />` — renders the `<h2>` and
    the `NN / NN` index

The index is derived from `MENU_ITEMS`, never written by hand: adding a
seventh section must renumber every screen automatically.

- [ ] **Step 1: Write the failing sections test**

Create `src/lib/sections.test.ts`:

```ts
import { sectionPosition } from './sections'
import { MENU_ITEMS } from '../data/menu'

test('numbers sections from one, in menu order', () => {
  expect(sectionPosition('/stats')).toEqual({ index: 1, total: MENU_ITEMS.length })
  expect(sectionPosition('/skills')).toEqual({ index: 2, total: MENU_ITEMS.length })
})

test('numbers the last menu entry as the total', () => {
  const last = MENU_ITEMS[MENU_ITEMS.length - 1]
  expect(sectionPosition(last.path)?.index).toBe(MENU_ITEMS.length)
})

test('returns null for a path outside the menu', () => {
  expect(sectionPosition('/')).toBeNull()
  expect(sectionPosition('/nope')).toBeNull()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test src/lib/sections.test.ts`
Expected: FAIL — cannot resolve `./sections`.

- [ ] **Step 3: Implement sectionPosition**

Create `src/lib/sections.ts`:

```ts
import { MENU_ITEMS } from '../data/menu'

export type SectionPosition = { index: number; total: number }

/**
 * Locates a route within the menu so a screen can show "02 / 06".
 * Derived from MENU_ITEMS so adding a section renumbers every screen.
 *
 * @param path - The route path, e.g. '/skills'.
 * @returns The 1-based position and the total, or null if the path is not
 *   a menu section (the title screen and unknown routes).
 */
export function sectionPosition(path: string): SectionPosition | null {
  const index = MENU_ITEMS.findIndex((item) => item.path === path)
  if (index < 0) return null
  return { index: index + 1, total: MENU_ITEMS.length }
}
```

- [ ] **Step 4: Write the failing ScreenHeader test**

Create `src/components/layout/ScreenHeader.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { ScreenHeader } from './ScreenHeader'

test('renders the title as the single level 2 heading', () => {
  render(<ScreenHeader title="SKILL TREE" path="/skills" />)
  expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1)
  expect(screen.getByRole('heading', { level: 2, name: 'SKILL TREE' })).toBeInTheDocument()
})

test('shows the section index as readable text', () => {
  render(<ScreenHeader title="SKILL TREE" path="/skills" />)
  expect(screen.getByText('02 / 06')).toBeInTheDocument()
})

test('omits the index for a path outside the menu', () => {
  render(<ScreenHeader title="GAME OVER" path="/nope" />)
  expect(screen.queryByText(/\d+ \/ \d+/)).not.toBeInTheDocument()
})
```

- [ ] **Step 5: Run to verify it fails**

Run: `npm test src/components/layout/ScreenHeader.test.tsx`
Expected: FAIL — cannot resolve `./ScreenHeader`.

- [ ] **Step 6: Implement ScreenHeader**

The index is text, not a decorative flourish: it says where you are, and
the spec forbids conveying that through colour alone.

Create `src/components/layout/ScreenHeader.tsx`:

```tsx
import { sectionPosition } from '../../lib/sections'
import styles from './ScreenHeader.module.css'

const pad = (value: number) => String(value).padStart(2, '0')

type ScreenHeaderProps = { title: string; path: string }

export function ScreenHeader({ title, path }: ScreenHeaderProps) {
  const position = sectionPosition(path)

  return (
    <div className={styles.header}>
      <h2 className={styles.title}>{title}</h2>
      {position ? (
        <p className={styles.index}>
          {pad(position.index)} / {pad(position.total)}
        </p>
      ) : null}
    </div>
  )
}
```

Create `src/components/layout/ScreenHeader.module.css`:

```css
.header {
  display: grid;
  gap: var(--space-1);
  margin-bottom: var(--space-4);
  border-bottom: 2px solid var(--c-panel);
  padding-bottom: var(--space-2);
}

.title {
  margin: 0;
  font-size: var(--fs-6);
  color: var(--c-ink);
}

.index {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--fs-1);
  color: var(--c-accent);
}

/*
 * Deliberately no wide-viewport rule here. Above 1024px the shell puts
 * this whole block into its own narrow column (Task 6), so the title and
 * the index stay stacked at every width.
 */
```

- [ ] **Step 7: Run the full suite**

Run: `npm test`
Expected: PASS, all tests.

- [ ] **Step 8: Commit**

```bash
git add src/lib src/components/layout
git commit -m "feat: add screen header with a menu-derived section index"
```

---

### Task 6: Recompose the shell and adopt ScreenHeader on every screen

**Files:**
- Modify: `src/components/layout/ArcadeShell.tsx`, `src/components/layout/ArcadeShell.module.css`
- Modify: `src/routes/StatsScreen.tsx`, `src/routes/SkillsScreen.tsx`, `src/routes/QuestsScreen.tsx`, `src/routes/TrainingScreen.tsx`, `src/routes/InventoryScreen.tsx`, `src/routes/ContactScreen.tsx`, `src/routes/NotFoundScreen.tsx`
- Modify: `src/routes/screens.module.css`
- Test: `src/components/layout/ArcadeShell.test.tsx`

**Interfaces:**
- Consumes: `Scenery`, `ScreenHeader`, `Panel` (titleless variant)
- Produces: no new exports. Every section screen renders exactly one `<h2>`,
  now via `ScreenHeader`, and passes no `title` to `Panel`.

This is the task where the existing routing tests are most at risk. They
query `getByRole('heading', { level: 2, name: '...' })`, which does not care
where in the tree the heading sits — so they must keep passing untouched.

- [ ] **Step 1: Write the failing shell test**

Create `src/components/layout/ArcadeShell.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ArcadeShell } from './ArcadeShell'

function renderShell(path = '/skills') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<ArcadeShell />}>
          <Route path="/skills" element={<p>contenuto</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

test('renders the scenery behind the content', () => {
  const { container } = renderShell()
  const scenery = container.querySelector('[data-intensity]')
  expect(scenery).toBeInTheDocument()
  expect(scenery).toHaveAttribute('aria-hidden', 'true')
})

test('mounts the scenery muted behind content screens', () => {
  const { container } = renderShell()
  expect(container.querySelector('[data-intensity]')).toHaveAttribute(
    'data-intensity',
    'muted',
  )
})

test('keeps the skip link pointing at the screen', () => {
  renderShell()
  expect(screen.getByRole('link', { name: 'Vai al contenuto' })).toHaveAttribute(
    'href',
    '#screen',
  )
})

test('renders the outlet content', () => {
  renderShell()
  expect(screen.getByText('contenuto')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test src/components/layout/ArcadeShell.test.tsx`
Expected: FAIL — no element carries `data-intensity`; the shell does not
render the scenery yet.

- [ ] **Step 3: Recompose the shell**

The page scrolls; the header and the scenery are fixed. `main` is pushed
down by the header's height, published as a custom property so the value
lives in one place.

Replace `src/components/layout/ArcadeShell.tsx`:

```tsx
import { Link, Outlet, useLocation } from 'react-router-dom'
import { cv } from '../../data/cv'
import { Scenery } from '../scenery/Scenery'
import { NavMenu } from './NavMenu'
import styles from './ArcadeShell.module.css'

export function ArcadeShell() {
  const location = useLocation()

  return (
    <div className={styles.shell}>
      <Scenery intensity="muted" />
      <header className={styles.header}>
        <a className={styles.skip} href="#screen">
          Vai al contenuto
        </a>
        <h1 className={styles.brand}>
          <Link to="/">{cv.profile.name}</Link>
        </h1>
        <NavMenu />
      </header>
      {/* Keyed by pathname so React remounts it and the wipe restarts. */}
      <main id="screen" key={location.pathname} className={`${styles.screen} wipe`}>
        <Outlet />
      </main>
    </div>
  )
}
```

Replace `src/components/layout/ArcadeShell.module.css`:

```css
.shell {
  --header-h: 96px;
}

.header {
  position: fixed;
  inset: 0 0 auto;
  z-index: var(--z-shell);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  min-height: var(--header-h);
  padding: var(--space-2) var(--space-4);
  border-bottom: var(--border-w) solid var(--c-panel);
  /* Opaque first: this is the value browsers without backdrop-filter keep. */
  background: var(--c-panel);
}

@supports (backdrop-filter: blur(2px)) {
  .header {
    background: rgb(29 34 51 / 0.82);
    backdrop-filter: blur(6px);
  }
}

.brand {
  margin: 0;
  font-size: var(--fs-3);
  color: var(--c-ink);
}

.brand a {
  color: inherit;
  text-decoration: none;
}

.screen {
  position: relative;
  z-index: var(--z-content);
  max-width: 960px;
  margin: 0 auto;
  padding: calc(var(--header-h) + var(--space-5)) var(--space-4) var(--space-6);
}

/*
 * Asymmetric grid on wide viewports: ScreenHeader and the panels are
 * siblings (each screen returns a fragment), so the split happens here
 * rather than inside any screen component.
 */
@media (min-width: 1024px) {
  .screen {
    max-width: 1180px;
    display: grid;
    grid-template-columns: 14rem 1fr;
    column-gap: var(--space-5);
    align-items: start;
  }

  .screen > :first-child {
    position: sticky;
    top: calc(var(--header-h) + var(--space-4));
  }
}

.skip {
  position: absolute;
  left: -9999px;
}

.skip:focus {
  position: static;
  display: inline-block;
  margin-bottom: var(--space-2);
}
```

- [ ] **Step 4: Move the heading out of Panel on every screen**

Seven edits. Each adds a `ScreenHeader` and drops the `title` prop from
`Panel`, so exactly one `<h2>` survives per screen.

`src/routes/StatsScreen.tsx` — replace the returned JSX:

```tsx
    <>
      <ScreenHeader title="PLAYER PROFILE" path="/stats" />
      <Panel>
        <dl className={styles.rows}>
          {rows.map((row) => (
            <div className={styles.row} key={row.key}>
              <dt className={styles.key}>{row.key}</dt>
              <dd className={styles.value}>{row.value}</dd>
            </div>
          ))}
        </dl>
        <p>{profile.bio}</p>
      </Panel>
    </>
```

and add the import:

```tsx
import { ScreenHeader } from '../components/layout/ScreenHeader'
```

The other six take the same mechanical shape. `SkillsScreen.tsx` in full,
so the pattern is unambiguous — note the `Panel` keeps its children exactly
as they are and loses only its `title`:

```tsx
  return (
    <>
      <ScreenHeader title="SKILL TREE" path="/skills" />
      <Panel>
        {CATEGORY_ORDER.map((category) => {
          const group = skills.filter((skill) => skill.category === category)
          if (group.length === 0) return null

          return (
            <section className={styles.group} key={category}>
              <h3 className={styles.groupTitle}>{category.toUpperCase()}</h3>
              {group.map((skill) => (
                <StatBar key={skill.name} label={skill.name} level={skill.level} />
              ))}
            </section>
          )
        })}
      </Panel>
    </>
  )
```

Apply the identical transformation to the remaining five, with these title
and path pairs:

| File | Title | Path |
|---|---|---|
| `QuestsScreen.tsx` | `QUEST LOG` | `/quests` |
| `TrainingScreen.tsx` | `TRAINING GROUNDS` | `/training` |
| `InventoryScreen.tsx` | `INVENTORY` | `/inventory` |
| `ContactScreen.tsx` | `CONTACT` | `/contact` |
| `NotFoundScreen.tsx` | `GAME OVER` | `/nope` |

`QuestsScreen` and `TrainingScreen` have two returns — the empty state and
the populated one. Both need the header, or the empty state loses its
heading and the routing test for that screen fails. For `QuestsScreen` the
empty branch becomes:

```tsx
  if (quests.length === 0) {
    return (
      <>
        <ScreenHeader title="QUEST LOG" path="/quests" />
        <Panel>Nessuna quest registrata.</Panel>
      </>
    )
  }
```

`TrainingScreen` mirrors it with `TRAINING GROUNDS` and `/training`.

For `NotFoundScreen`, `/nope` is not a menu path, so `sectionPosition`
returns null and no index renders — which is correct: GAME OVER is not one
of the six sections.

`QuestsScreen` also marks its most recent entry as raised. Change the first
list item only:

```tsx
          <li key={quest.id} className={styles.group} data-first={index === 0 ? '' : undefined}>
```

with `index` added to the map callback: `{quests.map((quest, index) => (`.

- [ ] **Step 5: Give the raised quest its style**

Append to `src/routes/screens.module.css`:

```css
.list > [data-first] {
  border-left: var(--border-w) solid var(--c-accent);
  padding-left: var(--space-3);
}
```

A border, not only a glow: the spec forbids signalling with colour alone,
and the border carries a shape difference as well as a hue.

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: PASS. The routing tests still find one level-2 heading per
screen, now rendered by `ScreenHeader` instead of `Panel`. **No existing
test file may be edited to reach this state.**

- [ ] **Step 7: Build and lint**

Run: `npm run build && npm run lint`
Expected: both clean.

- [ ] **Step 8: Commit**

```bash
git add src/components/layout src/routes
git commit -m "feat: recompose the shell around a fixed header and scenery"
```

---

### Task 7: The title screen as a full scene

**Files:**
- Modify: `src/routes/TitleScreen.tsx`, `src/routes/TitleScreen.module.css`
- Test: `src/routes/TitleScreen.test.tsx`

**Interfaces:**
- Consumes: `Scenery` at `intensity="full"`
- Produces: no new exports

- [ ] **Step 1: Write the failing title screen test**

Create `src/routes/TitleScreen.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TitleScreen } from './TitleScreen'

function renderTitle() {
  return render(
    <MemoryRouter>
      <TitleScreen />
    </MemoryRouter>,
  )
}

test('mounts the scenery at full intensity', () => {
  const { container } = renderTitle()
  expect(container.querySelector('[data-intensity]')).toHaveAttribute(
    'data-intensity',
    'full',
  )
})

test('the scanline overlay is decorative', () => {
  const { container } = renderTitle()
  const scanlines = container.querySelector('[data-scanlines]')
  expect(scanlines).toBeInTheDocument()
  expect(scanlines).toHaveAttribute('aria-hidden', 'true')
})

test('still offers the start control', () => {
  renderTitle()
  expect(screen.getByRole('button', { name: 'PRESS START' })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test src/routes/TitleScreen.test.tsx`
Expected: FAIL — no `data-intensity` and no `data-scanlines` element.

- [ ] **Step 3: Implement the scene**

Replace `src/routes/TitleScreen.tsx`:

```tsx
import { useNavigate } from 'react-router-dom'
import { cv } from '../data/cv'
import { MENU_ITEMS } from '../data/menu'
import { PixelButton } from '../components/ui/PixelButton'
import { Scenery } from '../components/scenery/Scenery'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber'
import { useTypewriter } from '../hooks/useTypewriter'
import styles from './TitleScreen.module.css'

export function TitleScreen() {
  const navigate = useNavigate()
  const title = useTypewriter(cv.profile.name, 60)
  const level = useAnimatedNumber(cv.profile.level, 600)

  return (
    <main className={styles.screen}>
      <Scenery intensity="full" />
      {/* Scanlines live only here: the one screen with nothing to read. */}
      <div className={styles.scanlines} data-scanlines="" aria-hidden="true" />
      <div className={styles.stage}>
        <h1 className={styles.title}>{title || ' '}</h1>
        <p className={styles.subtitle}>
          {cv.profile.class} · Lv.{level}
        </p>
        <span className="blink">
          <PixelButton onClick={() => navigate(MENU_ITEMS[0].path)}>PRESS START</PixelButton>
        </span>
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Style the scene**

Replace `src/routes/TitleScreen.module.css`:

```css
.screen {
  position: relative;
  min-height: 100vh;
  display: grid;
  place-content: center;
  justify-items: center;
  padding: var(--space-4);
}

.stage {
  position: relative;
  z-index: var(--z-content);
  display: grid;
  justify-items: center;
  gap: var(--space-4);
  text-align: center;
}

.title {
  margin: 0;
  font-size: clamp(var(--fs-6), 9vw, var(--fs-8));
  color: var(--c-accent);
  text-shadow: var(--glow-accent);
}

.subtitle {
  margin: 0;
  color: var(--c-ink);
}

.scanlines {
  position: fixed;
  inset: 0;
  z-index: var(--z-shell);
  pointer-events: none;
  opacity: 0.06;
  background: repeating-linear-gradient(
    to bottom,
    rgb(0 0 0 / 0) 0,
    rgb(0 0 0 / 0) 1px,
    rgb(0 0 0 / 1) 1px,
    rgb(0 0 0 / 1) 2px
  );
}
```

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS, all tests.

- [ ] **Step 6: Commit**

```bash
git add src/routes
git commit -m "feat: turn the title screen into a full scene"
```

---

### Task 8: Scroll-driven parallax and reveals

**Files:**
- Modify: `src/styles/motion.css`
- Modify: `src/components/scenery/Scenery.module.css`
- Modify: `src/routes/screens.module.css`
- Test: `src/styles/motion.test.ts`

**Interfaces:**
- Consumes: the scenery class names from Task 3
- Produces: the `.reveal` class, applied by screens to scroll-revealed
  blocks

- [ ] **Step 1: Write the failing motion-contract test**

This is the one automated guard on the constraint that matters most: no
stylesheet may hide something in base CSS and rely on an animation to bring
it back. jsdom cannot run `@supports`, so the source is again the only
place to check — and it is enough, because the rule is syntactic.

Create `src/styles/motion.test.ts`:

```ts
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const SRC = join(process.cwd(), 'src')

function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return cssFiles(path)
    return entry.name.endsWith('.css') ? [path] : []
  })
}

/**
 * Removes every block introduced by the named at-rules, braces balanced.
 *
 * @supports is stripped because declarations inside it are exactly what
 * the contract permits. @keyframes is stripped because `opacity: 0` in a
 * keyframe is a frame of an animation, not a rule that hides an element:
 * the existing `blink` animation legitimately contains one.
 */
function withoutBlocks(source: string, atRules: string[]): string {
  let output = ''
  let index = 0

  while (index < source.length) {
    const starts = atRules
      .map((rule) => source.indexOf(rule, index))
      .filter((position) => position >= 0)

    if (starts.length === 0) {
      output += source.slice(index)
      break
    }

    const start = Math.min(...starts)
    output += source.slice(index, start)

    let depth = 0
    let cursor = source.indexOf('{', start)
    if (cursor < 0) break

    for (; cursor < source.length; cursor += 1) {
      if (source[cursor] === '{') depth += 1
      if (source[cursor] === '}') {
        depth -= 1
        if (depth === 0) break
      }
    }
    index = cursor + 1
  }

  return output
}

const unconditional = (source: string) =>
  withoutBlocks(source, ['@supports', '@keyframes'])

const sheets = cssFiles(SRC).map((path) => ({
  path,
  source: readFileSync(path, 'utf8'),
}))

test('nothing is hidden outside an @supports block', () => {
  const offenders = sheets
    .filter(({ source }) => /opacity:\s*0\s*[;}]/.test(unconditional(source)))
    .map(({ path }) => path)

  expect(offenders).toEqual([])
})

test('scroll-driven animation is only declared inside @supports', () => {
  const offenders = sheets
    .filter(({ source }) => /animation-timeline/.test(unconditional(source)))
    .map(({ path }) => path)

  expect(offenders).toEqual([])
})

test('motion.css disables its animations under reduced motion', () => {
  const motion = readFileSync(join(SRC, 'styles/motion.css'), 'utf8')
  expect(motion).toContain('prefers-reduced-motion: reduce')
  expect(motion).toMatch(/animation:\s*none/)
})
```

- [ ] **Step 2: Run to verify it passes already, then keep it**

Run: `npm test src/styles/motion.test.ts`
Expected: PASS — today no stylesheet hides anything, which is exactly the
state this test exists to preserve. Unlike the other tasks, the test is a
ratchet rather than a red-green cycle: it must stay green while Steps 3-5
add animation.

- [ ] **Step 3: Add the parallax and reveal keyframes**

Replace `src/styles/motion.css`:

```css
@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  50.01%,
  100% {
    opacity: 0;
  }
}

@keyframes wipe-in {
  from {
    clip-path: inset(0 100% 0 0);
  }
  to {
    clip-path: inset(0 0 0 0);
  }
}

@keyframes rise-in {
  from {
    opacity: 0.15;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.blink {
  animation: blink 1s steps(1, end) infinite;
}

.wipe {
  animation: wipe-in 220ms steps(8, end) both;
}

/*
 * The finished state IS the default: .reveal styles nothing on its own.
 * A browser that does not understand the block below simply shows the
 * element, which is the whole point of the contract.
 */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .reveal {
      animation: rise-in 1ms steps(4, end) both;
      animation-timeline: view();
      animation-range: entry 10% cover 28%;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .blink,
  .wipe,
  .reveal {
    animation: none;
  }
}
```

`rise-in` never fully hides its element — it starts at `opacity: 0.15`, not
`0`. Combined with the source check in Step 1, that means no scroll position
and no browser can produce genuinely invisible content.

- [ ] **Step 4: Drive the scenery planes**

The keyframes must live in this file, not in `motion.css`. CSS Modules
scope `@keyframes` names: a module referencing a keyframe defined in a
global stylesheet gets its reference renamed and silently matches nothing.

Append to `src/components/scenery/Scenery.module.css`:

```css
@keyframes drift-up {
  from {
    transform: translateY(var(--base-y));
  }
  to {
    transform: translateY(calc(var(--base-y) - var(--drift, 0) * 1px));
  }
}

/*
 * Parallax is the one place steps() is wrong: stepped drift reads as a
 * dropped frame, not as a style.
 */
@supports (animation-timeline: scroll(root)) {
  @media (prefers-reduced-motion: no-preference) {
    .stars,
    .skyline {
      animation: drift-up 1ms linear both;
      animation-timeline: scroll(root);
    }

    .stars {
      --drift: 40;
    }

    .skyline[data-plane='far'] {
      --drift: 100;
    }

    .skyline[data-plane='near'] {
      --drift: 200;
    }
  }
}
```

- [ ] **Step 5: Apply the reveal to content blocks**

`.reveal` is a global class from `motion.css`, applied in JSX the same way
`.blink` and `.wipe` already are. No stylesheet change is needed.

In `src/routes/QuestsScreen.tsx`, the list item className becomes:

```tsx
className={`${styles.group} reveal`}
```

In `src/routes/TrainingScreen.tsx`, identically:

```tsx
className={`${styles.group} reveal`}
```

Leave the other screens alone: `StatsScreen`, `SkillsScreen`,
`InventoryScreen` and `ContactScreen` fit on one screen, so a
scroll-triggered reveal there would either never fire or fire instantly.

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: PASS, all tests, including the three motion-contract tests.

- [ ] **Step 7: Build and lint**

Run: `npm run build && npm run lint`
Expected: both clean.

- [ ] **Step 8: Commit**

```bash
git add src/styles src/components/scenery src/routes
git commit -m "feat: add scroll-driven parallax and content reveals"
```

---

### Task 9: Documentation and manual verification

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: nothing
- Produces: nothing

- [ ] **Step 1: Document the scenery boundary in the README**

Under the existing `## Architettura` section, add a third bullet after the
two that are already there:

```markdown
- **Scenografia**: cielo, stelle e skyline vivono in
  `src/components/scenery/`, disegnati in SVG inline. Non conoscono il
  contenuto e il contenuto non conosce loro: togliendo l'intero layer il
  CV resta completo. La palette ambientale (`--sky-*`, `--city-*`) e
  separata da quella dell'interfaccia e nessun componente di UI puo usarla.
```

- [ ] **Step 2: Run the manual checks**

These cannot be automated — jsdom evaluates neither `@supports` nor
`@media` in stylesheets. Run `npm run dev` and confirm each:

1. Scrolling a long screen moves stars, far skyline and near skyline at
   visibly different speeds.
2. Quest entries rise into place as they enter the viewport, and are fully
   visible once settled.
3. With the OS set to reduce motion (macOS: System Settings → Accessibility
   → Display → Reduce motion), nothing animates and every element is
   visible immediately — including quest entries below the fold.
4. The header stays legible while content scrolls beneath it.
5. The title screen shows scanlines; no other screen does.
6. Text contrast against the sky gradient still reads at the top and the
   bottom of a long screen.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document the scenery layer boundary"
```

---

## Remaining manual inputs

Unchanged from the previous plan and still outside this one's control:

1. `public/cv.pdf` — still a placeholder, not a valid PDF.
2. `src/data/cv.ts` — still placeholder content.

New to this plan:

3. Building count and distribution per plane (Task 3, `PLANE_CONFIG`) are
   first guesses. The spec calls for tuning them by looking, not by
   reasoning — expect one pass of adjustment after Task 9's manual check.
