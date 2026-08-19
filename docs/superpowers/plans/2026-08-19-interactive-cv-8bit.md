# Interactive CV 8-bit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multipage React site that presents a CV as arcade-style
8-bit screens, navigable by keyboard and pointer, deployed to GitHub Pages.

**Architecture:** Plain DOM + CSS — no canvas, no game engine. A single
typed data module feeds data-driven page components; a small design-system
layer under `components/ui/` owns every pixel-art detail; React Router
provides one real route per CV section.

**Tech Stack:** Vite, React, TypeScript, React Router, Vitest, React
Testing Library, @fontsource pixel fonts, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-19-interactive-cv-8bit-design.md`

## Global Constraints

- Content lives only in `src/data/cv.ts`. Page components must contain no
  CV copy — no names, dates, or job titles in JSX.
- Every page component accepts its data as an optional prop defaulting to
  the `cv` export. This keeps pages testable without module mocking.
- Palette is fixed to six tokens: `--c-bg` #10131c, `--c-panel` #1d2233,
  `--c-ink` #e8e6da, `--c-accent` #f2c94c, `--c-accent-2` #38b6ff,
  `--c-hp` #6ee06e. No other colors.
- `--c-accent` is reserved for active state and numeric values.
- Body text minimum 16px, line-height 1.7, measure capped at 65 characters.
- All animation uses `steps()` timing. Every animation must be disabled
  under `prefers-reduced-motion: reduce`, showing its end state instead.
- Every menu entry is a real `<a>` (React Router `Link`), never a `div`
  with a click handler.
- No information may be conveyed by color or icon alone.
- Test runner is Vitest with `globals: true` and the jsdom environment.

---

### Task 1: Project scaffold and test harness

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx` (via scaffold)
- Create: `src/test/setup.ts`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: `npm test` runs Vitest with jsdom, `@testing-library/jest-dom`
  matchers, and a controllable `matchMedia` stub exported as
  `setReducedMotion(value: boolean)` from `src/test/setup.ts`.

- [x] **Step 1: Scaffold Vite into the existing repo**

The repo already contains `README.md` and `docs/`, so scaffold into a temp
directory and copy over it.

```bash
npm create vite@latest .tmp-scaffold -- --template react-ts
rsync -a .tmp-scaffold/ ./ --exclude README.md
rm -rf .tmp-scaffold
npm install
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [x] **Step 2: Configure Vitest inside the Vite config**

Replace `vite.config.ts` with:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
```

Add the test scripts to `package.json`:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [x] **Step 3: Write the test setup file**

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'

let reducedMotion = false

export function setReducedMotion(value: boolean) {
  reducedMotion = value
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? reducedMotion : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
})

beforeEach(() => {
  reducedMotion = false
})
```

- [x] **Step 4: Write the failing smoke test**

Create `src/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import App from './App'

test('renders the arcade shell root landmark', () => {
  render(<App />)
  expect(screen.getByRole('main')).toBeInTheDocument()
})
```

- [x] **Step 5: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — the scaffolded `App` renders the Vite demo, no `main` landmark.

- [x] **Step 6: Replace App with a minimal shell**

Replace `src/App.tsx` with:

```tsx
export default function App() {
  return <main>Interactive CV</main>
}
```

Delete the scaffold leftovers: `src/App.css`, `src/assets/react.svg`.
Empty `src/index.css` — real tokens arrive in Task 3.

- [x] **Step 7: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS, 1 test.

- [x] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite React TypeScript app with Vitest harness"
```

---

### Task 2: CV data model and formatting helpers

**Files:**
- Create: `src/data/cv.ts`
- Create: `src/lib/format.ts`
- Test: `src/data/cv.test.ts`, `src/lib/format.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `type SkillCategory = 'lang' | 'framework' | 'tool' | 'soft'`
  - `type Skill = { name: string; level: number; category: SkillCategory }`
  - `type Quest = { id: string; title: string; org: string; from: string; to: string; achievements: string[]; tech: string[] }`
  - `type Training = { id: string; title: string; org: string; year: string; note?: string }`
  - `type InventoryItem = { id: string; name: string; kind: 'language' | 'ability'; detail: string }`
  - `type ProfileLink = { label: string; url: string }`
  - `type Profile = { name: string; class: string; level: number; location: string; bio: string; email: string; links: ProfileLink[] }`
  - `type CV = { profile: Profile; skills: Skill[]; quests: Quest[]; training: Training[]; inventory: InventoryItem[] }`
  - `const cv: CV`
  - `clamp(value: number, min: number, max: number): number`
  - `formatPeriod(from: string, to: string): string`

- [x] **Step 1: Write the failing helper tests**

Create `src/lib/format.test.ts`:

```ts
import { clamp, formatPeriod } from './format'

test('clamp keeps a value inside the range', () => {
  expect(clamp(150, 0, 100)).toBe(100)
  expect(clamp(-5, 0, 100)).toBe(0)
  expect(clamp(42, 0, 100)).toBe(42)
})

test('formatPeriod joins the two ends with an arrow', () => {
  expect(formatPeriod('2019', '2022')).toBe('2019 → 2022')
})

test('formatPeriod keeps the NOW sentinel', () => {
  expect(formatPeriod('2022', 'NOW')).toBe('2022 → NOW')
})
```

- [x] **Step 2: Run to verify it fails**

Run: `npm test src/lib/format.test.ts`
Expected: FAIL — cannot resolve `./format`.

- [x] **Step 3: Implement the helpers**

Create `src/lib/format.ts`:

```ts
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function formatPeriod(from: string, to: string): string {
  return `${from} → ${to}`
}
```

- [x] **Step 4: Write the failing data-integrity test**

Create `src/data/cv.test.ts`:

```ts
import { cv } from './cv'

test('every skill level sits between 0 and 100', () => {
  for (const skill of cv.skills) {
    expect(skill.level).toBeGreaterThanOrEqual(0)
    expect(skill.level).toBeLessThanOrEqual(100)
  }
})

test('quest ids are unique', () => {
  const ids = cv.quests.map((quest) => quest.id)
  expect(new Set(ids).size).toBe(ids.length)
})

test('the profile exposes at least one contact link', () => {
  expect(cv.profile.links.length).toBeGreaterThan(0)
  expect(cv.profile.email).toMatch(/@/)
})
```

- [x] **Step 5: Run to verify it fails**

Run: `npm test src/data/cv.test.ts`
Expected: FAIL — cannot resolve `./cv`.

- [x] **Step 6: Write the data module with placeholder content**

Create `src/data/cv.ts`:

```ts
export type SkillCategory = 'lang' | 'framework' | 'tool' | 'soft'

export type Skill = {
  name: string
  level: number
  category: SkillCategory
}

/** `to` carries the literal 'NOW' for an ongoing role. */
export type Quest = {
  id: string
  title: string
  org: string
  from: string
  to: string
  achievements: string[]
  tech: string[]
}

export type Training = {
  id: string
  title: string
  org: string
  year: string
  note?: string
}

export type InventoryItem = {
  id: string
  name: string
  kind: 'language' | 'ability'
  detail: string
}

export type ProfileLink = { label: string; url: string }

export type Profile = {
  name: string
  class: string
  level: number
  location: string
  bio: string
  email: string
  links: ProfileLink[]
}

export type CV = {
  profile: Profile
  skills: Skill[]
  quests: Quest[]
  training: Training[]
  inventory: InventoryItem[]
}

export const cv: CV = {
  profile: {
    name: 'ALESSANDRO MARCOZZI',
    class: 'Frontend Engineer',
    level: 12,
    location: 'Italia · Remote',
    bio: 'Placeholder: due o tre righe di presentazione, sostituire con il testo reale.',
    email: 'alessandro.marcozzi92@gmail.com',
    links: [
      { label: 'GITHUB', url: 'https://github.com/' },
      { label: 'LINKEDIN', url: 'https://www.linkedin.com/' },
    ],
  },
  skills: [
    { name: 'JavaScript', level: 85, category: 'lang' },
    { name: 'TypeScript', level: 75, category: 'lang' },
    { name: 'CSS', level: 80, category: 'lang' },
    { name: 'React', level: 80, category: 'framework' },
    { name: 'Node.js', level: 60, category: 'framework' },
    { name: 'Git', level: 75, category: 'tool' },
    { name: 'Accessibility', level: 65, category: 'soft' },
  ],
  quests: [
    {
      id: 'quest-1',
      title: 'Placeholder Role',
      org: 'Placeholder Company',
      from: '2022',
      to: 'NOW',
      achievements: [
        'Placeholder: risultato misurabile numero uno.',
        'Placeholder: risultato misurabile numero due.',
      ],
      tech: ['React', 'TypeScript'],
    },
    {
      id: 'quest-2',
      title: 'Placeholder Previous Role',
      org: 'Placeholder Agency',
      from: '2019',
      to: '2022',
      achievements: ['Placeholder: risultato precedente.'],
      tech: ['JavaScript', 'CSS'],
    },
  ],
  training: [
    {
      id: 'training-1',
      title: 'Placeholder Degree',
      org: 'Placeholder University',
      year: '2018',
      note: 'Placeholder: nota facoltativa.',
    },
  ],
  inventory: [
    { id: 'inv-1', name: 'Italiano', kind: 'language', detail: 'Madrelingua' },
    { id: 'inv-2', name: 'Inglese', kind: 'language', detail: 'B2' },
    { id: 'inv-3', name: 'Code review', kind: 'ability', detail: 'Passive' },
  ],
}
```

- [x] **Step 7: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS, all tests.

- [x] **Step 8: Commit**

```bash
git add src/data src/lib
git commit -m "feat: add typed CV data model with placeholder content"
```

---

### Task 3: Design tokens, pixel fonts, and Frame/Panel primitives

**Files:**
- Create: `src/styles/tokens.css`
- Modify: `src/index.css`, `src/main.tsx`
- Create: `src/components/ui/Frame.tsx`, `src/components/ui/Frame.module.css`
- Create: `src/components/ui/Panel.tsx`, `src/components/ui/Panel.module.css`
- Test: `src/components/ui/Frame.test.tsx`, `src/components/ui/Panel.test.tsx`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `<Frame as?: 'div' | 'section' | 'article' | 'li'; className?: string; children: ReactNode />`
  - `<Panel title: string; as?: 'section' | 'article' | 'li'; className?: string; children: ReactNode />`
    renders `title` as an `<h2>`.

- [x] **Step 1: Install the pixel fonts**

```bash
npm install @fontsource/silkscreen @fontsource/pixelify-sans
```

Silkscreen carries headings and UI labels; Pixelify Sans carries body copy
— it stays legible at 16px, which Press Start 2P does not. Both ship
self-hosted, so no external CDN is involved.

- [x] **Step 2: Write the design tokens**

Create `src/styles/tokens.css`:

```css
:root {
  --c-bg: #10131c;
  --c-panel: #1d2233;
  --c-ink: #e8e6da;
  --c-accent: #f2c94c;
  --c-accent-2: #38b6ff;
  --c-hp: #6ee06e;

  --font-display: 'Silkscreen', monospace;
  --font-body: 'Pixelify Sans', monospace;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 16px;
  --space-4: 24px;
  --space-5: 40px;
  --space-6: 64px;

  --border-w: 4px;
  --measure: 65ch;

  --z-shell: 10;
  --z-overlay: 20;
}
```

- [x] **Step 3: Write the global styles**

Replace `src/index.css`:

```css
@import '@fontsource/silkscreen/400.css';
@import '@fontsource/silkscreen/700.css';
@import '@fontsource/pixelify-sans/400.css';
@import '@fontsource/pixelify-sans/700.css';
@import './styles/tokens.css';

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--c-bg);
  color: var(--c-ink);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.7;
  -webkit-font-smoothing: none;
}

img {
  image-rendering: pixelated;
  max-width: 100%;
}

h1,
h2,
h3 {
  font-family: var(--font-display);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  line-height: 1.3;
}

p {
  max-width: var(--measure);
}

a {
  color: var(--c-accent-2);
}

:focus-visible {
  outline: 2px solid var(--c-accent-2);
  outline-offset: 2px;
}
```

Confirm `src/main.tsx` imports `./index.css` (the scaffold already does).

- [x] **Step 4: Write the failing Frame test**

Create `src/components/ui/Frame.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { Frame } from './Frame'

test('renders its children', () => {
  render(<Frame>PLAYER PROFILE</Frame>)
  expect(screen.getByText('PLAYER PROFILE')).toBeInTheDocument()
})

test('renders the requested element', () => {
  render(<Frame as="section">CONTENT</Frame>)
  expect(screen.getByText('CONTENT').tagName).toBe('SECTION')
})

test('keeps the caller className alongside its own', () => {
  render(<Frame className="custom">CONTENT</Frame>)
  expect(screen.getByText('CONTENT')).toHaveClass('custom')
})
```

- [x] **Step 5: Run to verify it fails**

Run: `npm test src/components/ui/Frame.test.tsx`
Expected: FAIL — cannot resolve `./Frame`.

- [x] **Step 6: Implement Frame**

Create `src/components/ui/Frame.module.css`:

```css
.frame {
  background: var(--c-panel);
  border: var(--border-w) solid var(--c-ink);
  box-shadow:
    0 0 0 var(--border-w) var(--c-bg),
    var(--space-1) var(--space-1) 0 var(--border-w) rgb(0 0 0 / 0.6);
  padding: var(--space-4);
  /* Notched pixel corners: no radii, no anti-aliasing. */
  clip-path: polygon(
    0 8px, 8px 8px, 8px 0,
    calc(100% - 8px) 0, calc(100% - 8px) 8px, 100% 8px,
    100% calc(100% - 8px), calc(100% - 8px) calc(100% - 8px), calc(100% - 8px) 100%,
    8px 100%, 8px calc(100% - 8px), 0 calc(100% - 8px)
  );
}
```

Create `src/components/ui/Frame.tsx`:

```tsx
import type { ReactNode } from 'react'
import styles from './Frame.module.css'

type FrameElement = 'div' | 'section' | 'article' | 'li'

type FrameProps = {
  children: ReactNode
  as?: FrameElement
  className?: string
}

export function Frame({ children, as: Tag = 'div', className }: FrameProps) {
  const classes = [styles.frame, className].filter(Boolean).join(' ')
  return <Tag className={classes}>{children}</Tag>
}
```

- [x] **Step 7: Write the failing Panel test**

Create `src/components/ui/Panel.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { Panel } from './Panel'

test('renders the title as a level 2 heading', () => {
  render(<Panel title="SKILL TREE">body</Panel>)
  expect(screen.getByRole('heading', { level: 2, name: 'SKILL TREE' })).toBeInTheDocument()
})

test('renders its children', () => {
  render(<Panel title="SKILL TREE">body</Panel>)
  expect(screen.getByText('body')).toBeInTheDocument()
})
```

- [x] **Step 8: Run to verify it fails**

Run: `npm test src/components/ui/Panel.test.tsx`
Expected: FAIL — cannot resolve `./Panel`.

- [x] **Step 9: Implement Panel**

Create `src/components/ui/Panel.module.css`:

```css
.title {
  margin: 0 0 var(--space-3);
  font-size: 18px;
  color: var(--c-accent);
}

.body {
  display: grid;
  gap: var(--space-3);
}
```

Create `src/components/ui/Panel.tsx`:

```tsx
import type { ReactNode } from 'react'
import { Frame } from './Frame'
import styles from './Panel.module.css'

type PanelProps = {
  title: string
  children: ReactNode
  as?: 'section' | 'article' | 'li'
  className?: string
}

export function Panel({ title, children, as = 'section', className }: PanelProps) {
  return (
    <Frame as={as} className={className}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.body}>{children}</div>
    </Frame>
  )
}
```

- [x] **Step 10: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS, all tests.

- [x] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: add design tokens, pixel fonts, and Frame/Panel primitives"
```

---

### Task 4: StatBar and PixelButton

**Files:**
- Create: `src/components/ui/StatBar.tsx`, `src/components/ui/StatBar.module.css`
- Create: `src/components/ui/PixelButton.tsx`, `src/components/ui/PixelButton.module.css`
- Test: `src/components/ui/StatBar.test.tsx`, `src/components/ui/PixelButton.test.tsx`

**Interfaces:**
- Consumes: `clamp` from `src/lib/format.ts`
- Produces:
  - `<StatBar label: string; level: number; blocks?: number />` — renders
    `role="meter"`, clamps `level` to 0-100, marks filled cells with
    `data-state="on"` and empty cells with `data-state="off"`.
  - `<PixelButton children: ReactNode; onClick?: () => void; href?: string; download?: boolean />`
    — renders `<a>` when `href` is set, otherwise `<button type="button">`.

- [x] **Step 1: Write the failing StatBar test**

Create `src/components/ui/StatBar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { StatBar } from './StatBar'

test('exposes the level through a meter role', () => {
  render(<StatBar label="React" level={80} />)
  const meter = screen.getByRole('meter', { name: 'React' })
  expect(meter).toHaveAttribute('aria-valuenow', '80')
  expect(meter).toHaveAttribute('aria-valuemin', '0')
  expect(meter).toHaveAttribute('aria-valuemax', '100')
})

test('clamps out-of-range levels', () => {
  const { rerender } = render(<StatBar label="React" level={150} />)
  expect(screen.getByRole('meter', { name: 'React' })).toHaveAttribute('aria-valuenow', '100')
  rerender(<StatBar label="React" level={-5} />)
  expect(screen.getByRole('meter', { name: 'React' })).toHaveAttribute('aria-valuenow', '0')
})

test('fills blocks proportionally to the level', () => {
  const { container } = render(<StatBar label="React" level={50} blocks={20} />)
  expect(container.querySelectorAll('[data-state="on"]')).toHaveLength(10)
  expect(container.querySelectorAll('[data-state="off"]')).toHaveLength(10)
})

test('shows the level as text, not only as a bar', () => {
  render(<StatBar label="React" level={80} />)
  expect(screen.getByText('Lv.80')).toBeInTheDocument()
})
```

- [x] **Step 2: Run to verify it fails**

Run: `npm test src/components/ui/StatBar.test.tsx`
Expected: FAIL — cannot resolve `./StatBar`.

- [x] **Step 3: Implement StatBar**

Create `src/components/ui/StatBar.module.css`:

```css
.row {
  display: grid;
  grid-template-columns: 12ch 1fr 6ch;
  align-items: center;
  gap: var(--space-3);
}

.track {
  display: flex;
  gap: 2px;
}

.cell {
  flex: 1;
  height: 14px;
  background: var(--c-bg);
  border: 2px solid var(--c-bg);
}

.cell[data-state='on'] {
  background: var(--c-hp);
}

.value {
  font-family: var(--font-display);
  color: var(--c-accent);
  text-align: right;
}
```

Create `src/components/ui/StatBar.tsx`:

```tsx
import { clamp } from '../../lib/format'
import styles from './StatBar.module.css'

type StatBarProps = {
  label: string
  level: number
  blocks?: number
}

export function StatBar({ label, level, blocks = 20 }: StatBarProps) {
  const value = clamp(Math.round(level), 0, 100)
  const filled = Math.round((value / 100) * blocks)

  return (
    <div className={styles.row}>
      <span>{label}</span>
      <span
        role="meter"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className={styles.track}
      >
        {Array.from({ length: blocks }, (_, index) => (
          <span
            key={index}
            className={styles.cell}
            data-state={index < filled ? 'on' : 'off'}
            aria-hidden="true"
          />
        ))}
      </span>
      <span className={styles.value}>Lv.{value}</span>
    </div>
  )
}
```

- [x] **Step 4: Write the failing PixelButton test**

Create `src/components/ui/PixelButton.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PixelButton } from './PixelButton'

test('renders a button and calls onClick', async () => {
  const onClick = vi.fn()
  render(<PixelButton onClick={onClick}>START</PixelButton>)
  await userEvent.click(screen.getByRole('button', { name: 'START' }))
  expect(onClick).toHaveBeenCalledTimes(1)
})

test('renders a download link when href is given', () => {
  render(
    <PixelButton href="/cv.pdf" download>
      SAVE GAME
    </PixelButton>,
  )
  const link = screen.getByRole('link', { name: 'SAVE GAME' })
  expect(link).toHaveAttribute('href', '/cv.pdf')
  expect(link).toHaveAttribute('download')
})
```

- [x] **Step 5: Run to verify it fails**

Run: `npm test src/components/ui/PixelButton.test.tsx`
Expected: FAIL — cannot resolve `./PixelButton`.

- [x] **Step 6: Implement PixelButton**

Create `src/components/ui/PixelButton.module.css`:

```css
.button {
  display: inline-block;
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-display);
  font-size: 14px;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--c-bg);
  background: var(--c-accent);
  border: var(--border-w) solid var(--c-ink);
  box-shadow: var(--space-1) var(--space-1) 0 0 var(--c-ink);
  cursor: pointer;
}

.button:active {
  transform: translate(var(--space-1), var(--space-1));
  box-shadow: none;
}
```

Create `src/components/ui/PixelButton.tsx`:

```tsx
import type { ReactNode } from 'react'
import styles from './PixelButton.module.css'

type PixelButtonProps = {
  children: ReactNode
  onClick?: () => void
  href?: string
  download?: boolean
}

export function PixelButton({ children, onClick, href, download }: PixelButtonProps) {
  if (href) {
    return (
      <a className={styles.button} href={href} download={download}>
        {children}
      </a>
    )
  }

  return (
    <button type="button" className={styles.button} onClick={onClick}>
      {children}
    </button>
  )
}
```

- [x] **Step 7: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS, all tests.

- [x] **Step 8: Commit**

```bash
git add src/components/ui
git commit -m "feat: add StatBar and PixelButton components"
```

---

### Task 5: Keyboard navigation hook

**Files:**
- Create: `src/hooks/useMenuNavigation.ts`
- Test: `src/hooks/useMenuNavigation.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  `useMenuNavigation({ itemCount, initialIndex?, onActivate, onCancel? })`
  returning `{ activeIndex: number; setActiveIndex: (index: number) => void; handleKeyDown: (event: KeyboardEvent) => void }`.
  Next keys: ArrowRight, ArrowDown, d/D. Previous keys: ArrowLeft, ArrowUp,
  a/A. Activate: Enter, Space. Cancel: Escape. Movement wraps at both ends.

- [ ] **Step 1: Write the failing hook test**

Create `src/hooks/useMenuNavigation.test.ts`:

```ts
import { act, renderHook } from '@testing-library/react'
import { useMenuNavigation } from './useMenuNavigation'

function pressKey(handler: (event: never) => void, key: string) {
  act(() => {
    handler({ key, preventDefault: () => {} } as never)
  })
}

test('moves forward and wraps past the last item', () => {
  const { result } = renderHook(() =>
    useMenuNavigation({ itemCount: 3, onActivate: vi.fn() }),
  )

  pressKey(result.current.handleKeyDown, 'ArrowRight')
  expect(result.current.activeIndex).toBe(1)

  pressKey(result.current.handleKeyDown, 'ArrowRight')
  pressKey(result.current.handleKeyDown, 'ArrowRight')
  expect(result.current.activeIndex).toBe(0)
})

test('moves backward and wraps before the first item', () => {
  const { result } = renderHook(() =>
    useMenuNavigation({ itemCount: 3, onActivate: vi.fn() }),
  )

  pressKey(result.current.handleKeyDown, 'ArrowLeft')
  expect(result.current.activeIndex).toBe(2)
})

test('activates the current item on Enter', () => {
  const onActivate = vi.fn()
  const { result } = renderHook(() =>
    useMenuNavigation({ itemCount: 3, initialIndex: 1, onActivate }),
  )

  pressKey(result.current.handleKeyDown, 'Enter')
  expect(onActivate).toHaveBeenCalledWith(1)
})

test('cancels on Escape', () => {
  const onCancel = vi.fn()
  const { result } = renderHook(() =>
    useMenuNavigation({ itemCount: 3, onActivate: vi.fn(), onCancel }),
  )

  pressKey(result.current.handleKeyDown, 'Escape')
  expect(onCancel).toHaveBeenCalledTimes(1)
})

test('ignores unrelated keys', () => {
  const onActivate = vi.fn()
  const { result } = renderHook(() => useMenuNavigation({ itemCount: 3, onActivate }))

  pressKey(result.current.handleKeyDown, 'x')
  expect(result.current.activeIndex).toBe(0)
  expect(onActivate).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test src/hooks/useMenuNavigation.test.ts`
Expected: FAIL — cannot resolve `./useMenuNavigation`.

- [ ] **Step 3: Implement the hook**

Create `src/hooks/useMenuNavigation.ts`:

```ts
import { useCallback, useState } from 'react'
import type { KeyboardEvent } from 'react'

const NEXT_KEYS = ['ArrowRight', 'ArrowDown', 'd', 'D']
const PREV_KEYS = ['ArrowLeft', 'ArrowUp', 'a', 'A']
const ACTIVATE_KEYS = ['Enter', ' ']

export type UseMenuNavigationOptions = {
  itemCount: number
  initialIndex?: number
  onActivate: (index: number) => void
  onCancel?: () => void
}

export function useMenuNavigation({
  itemCount,
  initialIndex = 0,
  onActivate,
  onCancel,
}: UseMenuNavigationOptions) {
  const [activeIndex, setActiveIndex] = useState(initialIndex)

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (NEXT_KEYS.includes(event.key)) {
        event.preventDefault()
        setActiveIndex((index) => (index + 1) % itemCount)
        return
      }

      if (PREV_KEYS.includes(event.key)) {
        event.preventDefault()
        setActiveIndex((index) => (index - 1 + itemCount) % itemCount)
        return
      }

      if (ACTIVATE_KEYS.includes(event.key)) {
        event.preventDefault()
        onActivate(activeIndex)
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel?.()
      }
    },
    [activeIndex, itemCount, onActivate, onCancel],
  )

  return { activeIndex, setActiveIndex, handleKeyDown }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS, all tests.

- [ ] **Step 5: Commit**

```bash
git add src/hooks
git commit -m "feat: add keyboard menu navigation hook"
```

---

### Task 6: Menu data, NavMenu, and ArcadeShell

**Files:**
- Create: `src/data/menu.ts`
- Create: `src/components/layout/NavMenu.tsx`, `src/components/layout/NavMenu.module.css`
- Create: `src/components/layout/ArcadeShell.tsx`, `src/components/layout/ArcadeShell.module.css`
- Test: `src/components/layout/NavMenu.test.tsx`

**Interfaces:**
- Consumes: `useMenuNavigation`, `cv`
- Produces:
  - `type MenuItem = { label: string; path: string }` and `const MENU_ITEMS: MenuItem[]`
  - `<NavMenu />` — renders one `Link` per item, `aria-current="page"` on the
    active route, a decorative `>` cursor on the highlighted item.
  - `<ArcadeShell />` — header + `NavMenu` + `<main>` rendering `<Outlet />`,
    preceded by a skip link targeting `#screen`.

- [ ] **Step 1: Install the router**

```bash
npm install react-router-dom
```

- [ ] **Step 2: Write the menu data**

Create `src/data/menu.ts`:

```ts
export type MenuItem = { label: string; path: string }

export const MENU_ITEMS: MenuItem[] = [
  { label: 'STATS', path: '/stats' },
  { label: 'SKILLS', path: '/skills' },
  { label: 'QUESTS', path: '/quests' },
  { label: 'TRAINING', path: '/training' },
  { label: 'INVENTORY', path: '/inventory' },
  { label: 'CONTACT', path: '/contact' },
]
```

- [ ] **Step 3: Write the failing NavMenu test**

Create `src/components/layout/NavMenu.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { NavMenu } from './NavMenu'

function LocationProbe() {
  const location = useLocation()
  return <span data-testid="location">{location.pathname}</span>
}

function renderMenu(initialPath = '/stats') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <NavMenu />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

test('renders one link per menu item', () => {
  renderMenu()
  expect(screen.getAllByRole('link')).toHaveLength(6)
})

test('marks the current route with aria-current', () => {
  renderMenu('/skills')
  expect(screen.getByRole('link', { name: /SKILLS/ })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: /STATS/ })).not.toHaveAttribute('aria-current')
})

test('navigates with arrow keys and Enter', async () => {
  renderMenu('/stats')
  const menu = screen.getByRole('menubar')
  menu.focus()
  await userEvent.keyboard('{ArrowRight}{Enter}')
  expect(screen.getByTestId('location')).toHaveTextContent('/skills')
})

test('navigates on click', async () => {
  renderMenu('/stats')
  await userEvent.click(screen.getByRole('link', { name: /QUESTS/ }))
  expect(screen.getByTestId('location')).toHaveTextContent('/quests')
})

test('returns to the title screen on Escape', async () => {
  renderMenu('/stats')
  screen.getByRole('menubar').focus()
  await userEvent.keyboard('{Escape}')
  expect(screen.getByTestId('location')).toHaveTextContent('/')
})
```

- [ ] **Step 4: Run to verify it fails**

Run: `npm test src/components/layout/NavMenu.test.tsx`
Expected: FAIL — cannot resolve `./NavMenu`.

- [ ] **Step 5: Implement NavMenu**

Create `src/components/layout/NavMenu.module.css`:

```css
.menu {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin: 0;
  padding: var(--space-2) 0;
  list-style: none;
  font-family: var(--font-display);
  font-size: 13px;
}

.link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  color: var(--c-ink);
  text-decoration: none;
}

.link[aria-current='page'] {
  color: var(--c-accent);
  text-decoration: underline;
}

.cursor {
  color: var(--c-accent);
}

.cursorSlot {
  display: inline-block;
  width: 1ch;
}
```

Create `src/components/layout/NavMenu.tsx`:

```tsx
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { MENU_ITEMS } from '../../data/menu'
import { useMenuNavigation } from '../../hooks/useMenuNavigation'
import styles from './NavMenu.module.css'

export function NavMenu() {
  const navigate = useNavigate()
  const location = useLocation()
  const routeIndex = MENU_ITEMS.findIndex((item) => item.path === location.pathname)

  const { activeIndex, setActiveIndex, handleKeyDown } = useMenuNavigation({
    itemCount: MENU_ITEMS.length,
    initialIndex: routeIndex < 0 ? 0 : routeIndex,
    onActivate: (index) => navigate(MENU_ITEMS[index].path),
    onCancel: () => navigate('/'),
  })

  return (
    <nav aria-label="Sezioni del CV">
      <ul className={styles.menu} role="menubar" tabIndex={0} onKeyDown={handleKeyDown}>
        {MENU_ITEMS.map((item, index) => (
          <li key={item.path} role="none">
            <Link
              role="menuitem"
              className={styles.link}
              to={item.path}
              aria-current={location.pathname === item.path ? 'page' : undefined}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
            >
              <span className={styles.cursorSlot} aria-hidden="true">
                {index === activeIndex ? <span className={styles.cursor}>▸</span> : null}
              </span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
```

- [ ] **Step 6: Run the NavMenu tests to verify they pass**

Run: `npm test src/components/layout/NavMenu.test.tsx`
Expected: PASS, 5 tests.

- [ ] **Step 7: Implement ArcadeShell**

Create `src/components/layout/ArcadeShell.module.css`:

```css
.shell {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: var(--space-4);
  padding: var(--space-4);
  max-width: 960px;
  margin: 0 auto;
}

.header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  border-bottom: var(--border-w) solid var(--c-panel);
  padding-bottom: var(--space-2);
}

.brand {
  margin: 0;
  font-size: 16px;
  color: var(--c-ink);
}

.brand a {
  color: inherit;
  text-decoration: none;
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

Create `src/components/layout/ArcadeShell.tsx`:

```tsx
import { Link, Outlet } from 'react-router-dom'
import { cv } from '../../data/cv'
import { NavMenu } from './NavMenu'
import styles from './ArcadeShell.module.css'

export function ArcadeShell() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <a className={styles.skip} href="#screen">
          Vai al contenuto
        </a>
        <h1 className={styles.brand}>
          <Link to="/">{cv.profile.name}</Link>
        </h1>
        <NavMenu />
      </header>
      <main id="screen">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 8: Run the full suite**

Run: `npm test`
Expected: PASS, all tests.

- [ ] **Step 9: Commit**

```bash
git add src/data/menu.ts src/components/layout package.json package-lock.json
git commit -m "feat: add arcade shell layout with dual-input menu"
```

---

### Task 7: Routing, title screen, and not-found screen

**Files:**
- Modify: `src/App.tsx`, `src/App.test.tsx`
- Create: `src/routes/TitleScreen.tsx`, `src/routes/TitleScreen.module.css`
- Create: `src/routes/NotFoundScreen.tsx`
- Create: `src/routes/StatsScreen.tsx`, `src/routes/SkillsScreen.tsx`, `src/routes/QuestsScreen.tsx`, `src/routes/TrainingScreen.tsx`, `src/routes/InventoryScreen.tsx`, `src/routes/ContactScreen.tsx`
- Create: `src/routes/routes.tsx`
- Test: `src/routes/routes.test.tsx`

**Interfaces:**
- Consumes: `ArcadeShell`, `PixelButton`, `cv`
- Produces:
  - `<AppRoutes />` from `src/routes/routes.tsx` — the `<Routes>` tree, router-agnostic so tests can wrap it in `MemoryRouter`.
  - Each screen component exported by name, e.g. `export function SkillsScreen()`.
  - `App` mounts `<BrowserRouter basename={import.meta.env.BASE_URL}>` around `<AppRoutes />`.

- [ ] **Step 1: Write the failing routing test**

Create `src/routes/routes.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from './routes'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

test('the root path shows the title screen', () => {
  renderAt('/')
  expect(screen.getByText('PRESS START')).toBeInTheDocument()
})

test.each([
  ['/stats', 'PLAYER PROFILE'],
  ['/skills', 'SKILL TREE'],
  ['/quests', 'QUEST LOG'],
  ['/training', 'TRAINING GROUNDS'],
  ['/inventory', 'INVENTORY'],
  ['/contact', 'CONTACT'],
])('%s renders its screen heading', (path, heading) => {
  renderAt(path)
  expect(screen.getByRole('heading', { level: 2, name: heading })).toBeInTheDocument()
})

test('an unknown path shows the game over screen', () => {
  renderAt('/nope')
  expect(screen.getByRole('heading', { level: 2, name: 'GAME OVER' })).toBeInTheDocument()
})

test('section screens are wrapped in the arcade shell', () => {
  renderAt('/skills')
  expect(screen.getByRole('navigation', { name: 'Sezioni del CV' })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test src/routes/routes.test.tsx`
Expected: FAIL — cannot resolve `./routes`.

- [ ] **Step 3: Create the title screen**

Create `src/routes/TitleScreen.module.css`:

```css
.screen {
  min-height: 100vh;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: var(--space-4);
  text-align: center;
  padding: var(--space-4);
}

.title {
  margin: 0;
  font-size: clamp(24px, 6vw, 48px);
  color: var(--c-accent);
}

.subtitle {
  margin: 0;
  color: var(--c-ink);
}
```

Create `src/routes/TitleScreen.tsx`:

```tsx
import { useNavigate } from 'react-router-dom'
import { cv } from '../data/cv'
import { MENU_ITEMS } from '../data/menu'
import { PixelButton } from '../components/ui/PixelButton'
import styles from './TitleScreen.module.css'

export function TitleScreen() {
  const navigate = useNavigate()

  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>{cv.profile.name}</h1>
      <p className={styles.subtitle}>
        {cv.profile.class} · Lv.{cv.profile.level}
      </p>
      <PixelButton onClick={() => navigate(MENU_ITEMS[0].path)}>PRESS START</PixelButton>
    </main>
  )
}
```

- [ ] **Step 4: Create the six section screens and the not-found screen**

Each screen is a heading plus a placeholder paragraph for now; Task 8 fills
in the real, data-driven bodies.

Create `src/routes/StatsScreen.tsx`:

```tsx
import { Panel } from '../components/ui/Panel'

export function StatsScreen() {
  return <Panel title="PLAYER PROFILE">Contenuto in arrivo.</Panel>
}
```

Create `src/routes/SkillsScreen.tsx`:

```tsx
import { Panel } from '../components/ui/Panel'

export function SkillsScreen() {
  return <Panel title="SKILL TREE">Contenuto in arrivo.</Panel>
}
```

Create `src/routes/QuestsScreen.tsx`:

```tsx
import { Panel } from '../components/ui/Panel'

export function QuestsScreen() {
  return <Panel title="QUEST LOG">Contenuto in arrivo.</Panel>
}
```

Create `src/routes/TrainingScreen.tsx`:

```tsx
import { Panel } from '../components/ui/Panel'

export function TrainingScreen() {
  return <Panel title="TRAINING GROUNDS">Contenuto in arrivo.</Panel>
}
```

Create `src/routes/InventoryScreen.tsx`:

```tsx
import { Panel } from '../components/ui/Panel'

export function InventoryScreen() {
  return <Panel title="INVENTORY">Contenuto in arrivo.</Panel>
}
```

Create `src/routes/ContactScreen.tsx`:

```tsx
import { Panel } from '../components/ui/Panel'

export function ContactScreen() {
  return <Panel title="CONTACT">Contenuto in arrivo.</Panel>
}
```

Create `src/routes/NotFoundScreen.tsx`:

```tsx
import { Link } from 'react-router-dom'
import { Panel } from '../components/ui/Panel'

export function NotFoundScreen() {
  return (
    <Panel title="GAME OVER">
      <p>Questa schermata non esiste.</p>
      <Link to="/">Torna alla title screen</Link>
    </Panel>
  )
}
```

- [ ] **Step 5: Wire the route tree**

Create `src/routes/routes.tsx`:

```tsx
import { Route, Routes } from 'react-router-dom'
import { ArcadeShell } from '../components/layout/ArcadeShell'
import { TitleScreen } from './TitleScreen'
import { StatsScreen } from './StatsScreen'
import { SkillsScreen } from './SkillsScreen'
import { QuestsScreen } from './QuestsScreen'
import { TrainingScreen } from './TrainingScreen'
import { InventoryScreen } from './InventoryScreen'
import { ContactScreen } from './ContactScreen'
import { NotFoundScreen } from './NotFoundScreen'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<TitleScreen />} />
      <Route element={<ArcadeShell />}>
        <Route path="/stats" element={<StatsScreen />} />
        <Route path="/skills" element={<SkillsScreen />} />
        <Route path="/quests" element={<QuestsScreen />} />
        <Route path="/training" element={<TrainingScreen />} />
        <Route path="/inventory" element={<InventoryScreen />} />
        <Route path="/contact" element={<ContactScreen />} />
        <Route path="*" element={<NotFoundScreen />} />
      </Route>
    </Routes>
  )
}
```

- [ ] **Step 6: Mount the router in App**

Replace `src/App.tsx`:

```tsx
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes/routes'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppRoutes />
    </BrowserRouter>
  )
}
```

Replace `src/App.test.tsx` — the smoke test from Task 1 asserted a bare
`main`, which now lives inside the routed screens:

```tsx
import { render, screen } from '@testing-library/react'
import App from './App'

test('boots on the title screen', () => {
  render(<App />)
  expect(screen.getByText('PRESS START')).toBeInTheDocument()
})
```

- [ ] **Step 7: Run the full suite**

Run: `npm test`
Expected: PASS, all tests.

- [ ] **Step 8: Commit**

```bash
git add src
git commit -m "feat: add routing, title screen, and section screen skeletons"
```

---

### Task 8: Data-driven section screens

**Files:**
- Modify: `src/routes/StatsScreen.tsx`, `src/routes/SkillsScreen.tsx`, `src/routes/QuestsScreen.tsx`, `src/routes/TrainingScreen.tsx`, `src/routes/InventoryScreen.tsx`, `src/routes/ContactScreen.tsx`
- Create: `src/routes/screens.module.css`
- Create: `public/cv.pdf` (placeholder file)
- Test: `src/routes/StatsScreen.test.tsx`, `src/routes/SkillsScreen.test.tsx`, `src/routes/QuestsScreen.test.tsx`, `src/routes/ContactScreen.test.tsx`

**Interfaces:**
- Consumes: `cv`, `Panel`, `StatBar`, `PixelButton`, `formatPeriod`
- Produces: each screen accepts its slice of data as an optional prop:
  - `StatsScreen({ profile = cv.profile }: { profile?: Profile })`
  - `SkillsScreen({ skills = cv.skills }: { skills?: Skill[] })`
  - `QuestsScreen({ quests = cv.quests }: { quests?: Quest[] })`
  - `TrainingScreen({ training = cv.training }: { training?: Training[] })`
  - `InventoryScreen({ items = cv.inventory }: { items?: InventoryItem[] })`
  - `ContactScreen({ profile = cv.profile }: { profile?: Profile })`

- [ ] **Step 1: Write the failing screen tests**

Create `src/routes/SkillsScreen.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { SkillsScreen } from './SkillsScreen'
import type { Skill } from '../data/cv'

const skills: Skill[] = [
  { name: 'React', level: 80, category: 'framework' },
  { name: 'TypeScript', level: 75, category: 'lang' },
  { name: 'Git', level: 70, category: 'tool' },
]

test('renders one meter per skill', () => {
  render(<SkillsScreen skills={skills} />)
  expect(screen.getAllByRole('meter')).toHaveLength(3)
})

test('groups skills by category heading', () => {
  render(<SkillsScreen skills={skills} />)
  expect(screen.getByRole('heading', { name: 'FRAMEWORK' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'LANG' })).toBeInTheDocument()
})

test('shows no empty category when a category has no skills', () => {
  render(<SkillsScreen skills={[skills[0]]} />)
  expect(screen.queryByRole('heading', { name: 'SOFT' })).not.toBeInTheDocument()
})
```

Create `src/routes/QuestsScreen.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { QuestsScreen } from './QuestsScreen'
import type { Quest } from '../data/cv'

const quests: Quest[] = [
  {
    id: 'q1',
    title: 'Frontend Engineer',
    org: 'Acme',
    from: '2022',
    to: 'NOW',
    achievements: ['Ridotto il tempo di build del 40%'],
    tech: ['React'],
  },
]

test('renders each quest with role, org and period', () => {
  render(<QuestsScreen quests={quests} />)
  expect(screen.getByRole('heading', { name: /Frontend Engineer/ })).toBeInTheDocument()
  expect(screen.getByText('Acme')).toBeInTheDocument()
  expect(screen.getByText('2022 → NOW')).toBeInTheDocument()
})

test('lists the achievements', () => {
  render(<QuestsScreen quests={quests} />)
  expect(screen.getByText('Ridotto il tempo di build del 40%')).toBeInTheDocument()
})

test('shows an empty-state message with no quests', () => {
  render(<QuestsScreen quests={[]} />)
  expect(screen.getByText('Nessuna quest registrata.')).toBeInTheDocument()
})
```

Create `src/routes/StatsScreen.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { StatsScreen } from './StatsScreen'
import type { Profile } from '../data/cv'

const profile: Profile = {
  name: 'TEST PLAYER',
  class: 'Frontend Engineer',
  level: 12,
  location: 'Roma',
  bio: 'Bio di prova.',
  email: 'test@example.com',
  links: [{ label: 'GITHUB', url: 'https://github.com/' }],
}

test('renders the profile fields as labelled rows', () => {
  render(<StatsScreen profile={profile} />)
  expect(screen.getByText('CLASS')).toBeInTheDocument()
  expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()
  expect(screen.getByText('LEVEL')).toBeInTheDocument()
  expect(screen.getByText('12')).toBeInTheDocument()
  expect(screen.getByText('Bio di prova.')).toBeInTheDocument()
})
```

Create `src/routes/ContactScreen.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { ContactScreen } from './ContactScreen'
import type { Profile } from '../data/cv'

const profile: Profile = {
  name: 'TEST PLAYER',
  class: 'Frontend Engineer',
  level: 12,
  location: 'Roma',
  bio: 'Bio di prova.',
  email: 'test@example.com',
  links: [{ label: 'GITHUB', url: 'https://github.com/' }],
}

test('offers the CV download', () => {
  render(<ContactScreen profile={profile} />)
  const download = screen.getByRole('link', { name: 'SAVE GAME' })
  expect(download).toHaveAttribute('href', '/cv.pdf')
  expect(download).toHaveAttribute('download')
})

test('renders a mailto link and the external links', () => {
  render(<ContactScreen profile={profile} />)
  expect(screen.getByRole('link', { name: 'test@example.com' })).toHaveAttribute(
    'href',
    'mailto:test@example.com',
  )
  expect(screen.getByRole('link', { name: 'GITHUB' })).toHaveAttribute(
    'href',
    'https://github.com/',
  )
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm test src/routes`
Expected: FAIL — the screens ignore props and render "Contenuto in arrivo."

- [ ] **Step 3: Add the shared screen styles**

Create `src/routes/screens.module.css`:

```css
.rows {
  display: grid;
  gap: var(--space-2);
  margin: 0;
}

.row {
  display: grid;
  grid-template-columns: 12ch 1fr;
  gap: var(--space-3);
}

.key {
  font-family: var(--font-display);
  font-size: 12px;
  color: var(--c-accent);
}

.list {
  display: grid;
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}

.group {
  display: grid;
  gap: var(--space-2);
}

.groupTitle {
  margin: 0;
  font-family: var(--font-display);
  font-size: 12px;
  color: var(--c-accent-2);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  font-size: 14px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.tag {
  border: 2px solid var(--c-accent-2);
  padding: 0 var(--space-2);
  font-size: 13px;
}
```

- [ ] **Step 4: Implement StatsScreen**

Replace `src/routes/StatsScreen.tsx`:

```tsx
import { cv } from '../data/cv'
import type { Profile } from '../data/cv'
import { Panel } from '../components/ui/Panel'
import styles from './screens.module.css'

type StatsScreenProps = { profile?: Profile }

export function StatsScreen({ profile = cv.profile }: StatsScreenProps) {
  const rows = [
    { key: 'CLASS', value: profile.class },
    { key: 'LEVEL', value: String(profile.level) },
    { key: 'LOCATION', value: profile.location },
    { key: 'EMAIL', value: profile.email },
  ]

  return (
    <Panel title="PLAYER PROFILE">
      <dl className={styles.rows}>
        {rows.map((row) => (
          <div className={styles.row} key={row.key}>
            <dt className={styles.key}>{row.key}</dt>
            <dd style={{ margin: 0 }}>{row.value}</dd>
          </div>
        ))}
      </dl>
      <p>{profile.bio}</p>
    </Panel>
  )
}
```

- [ ] **Step 5: Implement SkillsScreen**

Replace `src/routes/SkillsScreen.tsx`:

```tsx
import { cv } from '../data/cv'
import type { Skill, SkillCategory } from '../data/cv'
import { Panel } from '../components/ui/Panel'
import { StatBar } from '../components/ui/StatBar'
import styles from './screens.module.css'

const CATEGORY_ORDER: SkillCategory[] = ['lang', 'framework', 'tool', 'soft']

type SkillsScreenProps = { skills?: Skill[] }

export function SkillsScreen({ skills = cv.skills }: SkillsScreenProps) {
  return (
    <Panel title="SKILL TREE">
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
  )
}
```

- [ ] **Step 6: Implement QuestsScreen**

Replace `src/routes/QuestsScreen.tsx`:

```tsx
import { cv } from '../data/cv'
import type { Quest } from '../data/cv'
import { Panel } from '../components/ui/Panel'
import { formatPeriod } from '../lib/format'
import styles from './screens.module.css'

type QuestsScreenProps = { quests?: Quest[] }

export function QuestsScreen({ quests = cv.quests }: QuestsScreenProps) {
  if (quests.length === 0) {
    return <Panel title="QUEST LOG">Nessuna quest registrata.</Panel>
  }

  return (
    <Panel title="QUEST LOG">
      <ul className={styles.list}>
        {quests.map((quest) => (
          <li key={quest.id} className={styles.group}>
            <h3>{quest.title}</h3>
            <div className={styles.meta}>
              <span>{quest.org}</span>
              <span>{formatPeriod(quest.from, quest.to)}</span>
            </div>
            <ul>
              {quest.achievements.map((achievement) => (
                <li key={achievement}>{achievement}</li>
              ))}
            </ul>
            <ul className={styles.tags}>
              {quest.tech.map((tech) => (
                <li key={tech} className={styles.tag}>
                  {tech}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
```

- [ ] **Step 7: Implement TrainingScreen and InventoryScreen**

Replace `src/routes/TrainingScreen.tsx`:

```tsx
import { cv } from '../data/cv'
import type { Training } from '../data/cv'
import { Panel } from '../components/ui/Panel'
import styles from './screens.module.css'

type TrainingScreenProps = { training?: Training[] }

export function TrainingScreen({ training = cv.training }: TrainingScreenProps) {
  if (training.length === 0) {
    return <Panel title="TRAINING GROUNDS">Nessun tutorial completato.</Panel>
  }

  return (
    <Panel title="TRAINING GROUNDS">
      <ul className={styles.list}>
        {training.map((entry) => (
          <li key={entry.id} className={styles.group}>
            <h3>{entry.title}</h3>
            <div className={styles.meta}>
              <span>{entry.org}</span>
              <span>{entry.year}</span>
            </div>
            {entry.note ? <p>{entry.note}</p> : null}
          </li>
        ))}
      </ul>
    </Panel>
  )
}
```

Replace `src/routes/InventoryScreen.tsx`:

```tsx
import { cv } from '../data/cv'
import type { InventoryItem } from '../data/cv'
import { Panel } from '../components/ui/Panel'
import styles from './screens.module.css'

type InventoryScreenProps = { items?: InventoryItem[] }

export function InventoryScreen({ items = cv.inventory }: InventoryScreenProps) {
  const languages = items.filter((item) => item.kind === 'language')
  const abilities = items.filter((item) => item.kind === 'ability')

  return (
    <Panel title="INVENTORY">
      {[
        { title: 'LANGUAGES', entries: languages },
        { title: 'PASSIVE ABILITIES', entries: abilities },
      ]
        .filter((group) => group.entries.length > 0)
        .map((group) => (
          <section className={styles.group} key={group.title}>
            <h3 className={styles.groupTitle}>{group.title}</h3>
            <dl className={styles.rows}>
              {group.entries.map((entry) => (
                <div className={styles.row} key={entry.id}>
                  <dt className={styles.key}>{entry.name}</dt>
                  <dd style={{ margin: 0 }}>{entry.detail}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
    </Panel>
  )
}
```

- [ ] **Step 8: Implement ContactScreen and add the PDF placeholder**

Replace `src/routes/ContactScreen.tsx`:

```tsx
import { cv } from '../data/cv'
import type { Profile } from '../data/cv'
import { Panel } from '../components/ui/Panel'
import { PixelButton } from '../components/ui/PixelButton'
import styles from './screens.module.css'

type ContactScreenProps = { profile?: Profile }

export function ContactScreen({ profile = cv.profile }: ContactScreenProps) {
  return (
    <Panel title="CONTACT">
      <p>
        <a href={`mailto:${profile.email}`}>{profile.email}</a>
      </p>
      <ul className={styles.tags}>
        {profile.links.map((link) => (
          <li key={link.url} className={styles.tag}>
            <a href={link.url} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
      <PixelButton href="/cv.pdf" download>
        SAVE GAME
      </PixelButton>
    </Panel>
  )
}
```

Add a placeholder PDF so the link resolves in dev:

```bash
printf '%%PDF-1.4\n%% placeholder - sostituire con il CV reale\n' > public/cv.pdf
```

- [ ] **Step 9: Run the full suite**

Run: `npm test`
Expected: PASS, all tests.

- [ ] **Step 10: Commit**

```bash
git add src public/cv.pdf
git commit -m "feat: render CV sections from the data module"
```

---

### Task 9: Motion — reduced-motion guard, typewriter, counters, screen wipe

**Files:**
- Create: `src/hooks/usePrefersReducedMotion.ts`, `src/hooks/useTypewriter.ts`, `src/hooks/useAnimatedNumber.ts`
- Modify: `src/components/ui/StatBar.tsx`, `src/components/ui/StatBar.module.css`
- Create: `src/styles/motion.css`
- Modify: `src/index.css`, `src/routes/TitleScreen.tsx`, `src/routes/TitleScreen.module.css`, `src/components/layout/ArcadeShell.tsx`, `src/components/layout/ArcadeShell.module.css`
- Test: `src/hooks/usePrefersReducedMotion.test.ts`, `src/hooks/useTypewriter.test.ts`

**Interfaces:**
- Consumes: `setReducedMotion` from `src/test/setup.ts` (tests only)
- Produces:
  - `usePrefersReducedMotion(): boolean`
  - `useTypewriter(text: string, speedMs?: number): string` — returns the
    full text immediately when reduced motion is requested.
  - `useAnimatedNumber(target: number, durationMs?: number, steps?: number): number`
  - `.wipe` animation class applied to `<main>`, keyed by pathname.

- [ ] **Step 1: Write the failing reduced-motion test**

Create `src/hooks/usePrefersReducedMotion.test.ts`:

```ts
import { renderHook } from '@testing-library/react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import { setReducedMotion } from '../test/setup'

test('reports false by default', () => {
  const { result } = renderHook(() => usePrefersReducedMotion())
  expect(result.current).toBe(false)
})

test('reports true when the user asked for reduced motion', () => {
  setReducedMotion(true)
  const { result } = renderHook(() => usePrefersReducedMotion())
  expect(result.current).toBe(true)
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test src/hooks/usePrefersReducedMotion.test.ts`
Expected: FAIL — cannot resolve `./usePrefersReducedMotion`.

- [ ] **Step 3: Implement usePrefersReducedMotion**

Create `src/hooks/usePrefersReducedMotion.ts`:

```ts
import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => window.matchMedia(QUERY).matches)

  useEffect(() => {
    const media = window.matchMedia(QUERY)
    const onChange = () => setReduced(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return reduced
}
```

- [ ] **Step 4: Write the failing typewriter test**

Create `src/hooks/useTypewriter.test.ts`:

```ts
import { act, renderHook } from '@testing-library/react'
import { useTypewriter } from './useTypewriter'
import { setReducedMotion } from '../test/setup'

test('reveals the text one character at a time', () => {
  vi.useFakeTimers()
  const { result } = renderHook(() => useTypewriter('ABC', 10))

  expect(result.current).toBe('')
  act(() => {
    vi.advanceTimersByTime(10)
  })
  expect(result.current).toBe('A')
  act(() => {
    vi.advanceTimersByTime(20)
  })
  expect(result.current).toBe('ABC')
  vi.useRealTimers()
})

test('shows the full text immediately under reduced motion', () => {
  setReducedMotion(true)
  const { result } = renderHook(() => useTypewriter('ABC', 10))
  expect(result.current).toBe('ABC')
})
```

- [ ] **Step 5: Run to verify it fails**

Run: `npm test src/hooks/useTypewriter.test.ts`
Expected: FAIL — cannot resolve `./useTypewriter`.

- [ ] **Step 6: Implement useTypewriter**

Create `src/hooks/useTypewriter.ts`:

```ts
import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

export function useTypewriter(text: string, speedMs = 35): string {
  const reduced = usePrefersReducedMotion()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (reduced) return
    setCount(0)
    const timer = setInterval(() => {
      setCount((current) => {
        if (current >= text.length) {
          clearInterval(timer)
          return current
        }
        return current + 1
      })
    }, speedMs)
    return () => clearInterval(timer)
  }, [text, speedMs, reduced])

  return reduced ? text : text.slice(0, count)
}
```

- [ ] **Step 7: Run the hook tests to verify they pass**

Run: `npm test src/hooks`
Expected: PASS, all hook tests.

- [ ] **Step 8: Add the motion stylesheet**

Create `src/styles/motion.css`:

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

.blink {
  animation: blink 1s steps(1, end) infinite;
}

.wipe {
  animation: wipe-in 220ms steps(8, end) both;
}

@media (prefers-reduced-motion: reduce) {
  .blink,
  .wipe {
    animation: none;
  }
}
```

Import it from `src/index.css`, right after the tokens import:

```css
@import './styles/motion.css';
```

- [ ] **Step 9: Apply the blink and the typewriter to the title screen**

Replace the body of `src/routes/TitleScreen.tsx`:

```tsx
import { useNavigate } from 'react-router-dom'
import { cv } from '../data/cv'
import { MENU_ITEMS } from '../data/menu'
import { PixelButton } from '../components/ui/PixelButton'
import { useTypewriter } from '../hooks/useTypewriter'
import styles from './TitleScreen.module.css'

export function TitleScreen() {
  const navigate = useNavigate()
  const title = useTypewriter(cv.profile.name, 60)

  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>{title || ' '}</h1>
      <p className={styles.subtitle}>
        {cv.profile.class} · Lv.{cv.profile.level}
      </p>
      <span className="blink">
        <PixelButton onClick={() => navigate(MENU_ITEMS[0].path)}>PRESS START</PixelButton>
      </span>
    </main>
  )
}
```

Note: `App.test.tsx` asserts on the `PRESS START` button text, which the
typewriter never touches, so it keeps passing.

- [ ] **Step 10: Apply the wipe to route changes**

In `src/components/layout/ArcadeShell.tsx`, import `useLocation` and key the
`<main>` so React remounts it on every route change, restarting the animation:

```tsx
import { Link, Outlet, useLocation } from 'react-router-dom'
```

and replace the `<main>` element with:

```tsx
      <main id="screen" key={location.pathname} className="wipe">
        <Outlet />
      </main>
```

adding `const location = useLocation()` at the top of the component body.

- [ ] **Step 11: Run the full suite**

Run: `npm test`
Expected: PASS, all tests.

- [ ] **Step 12: Commit**

```bash
git add src
git commit -m "feat: add typewriter, blink, and screen wipe with reduced-motion guards"
```

- [ ] **Step 13: Write the failing counter test**

Create `src/hooks/useAnimatedNumber.test.ts`:

```ts
import { act, renderHook } from '@testing-library/react'
import { useAnimatedNumber } from './useAnimatedNumber'
import { setReducedMotion } from '../test/setup'

test('counts up to the target in discrete steps', () => {
  vi.useFakeTimers()
  const { result } = renderHook(() => useAnimatedNumber(20, 200, 20))

  expect(result.current).toBe(0)
  act(() => {
    vi.advanceTimersByTime(100)
  })
  expect(result.current).toBe(10)
  act(() => {
    vi.advanceTimersByTime(100)
  })
  expect(result.current).toBe(20)
  vi.useRealTimers()
})

test('shows the target immediately under reduced motion', () => {
  setReducedMotion(true)
  const { result } = renderHook(() => useAnimatedNumber(20, 200, 20))
  expect(result.current).toBe(20)
})
```

- [ ] **Step 14: Run to verify it fails**

Run: `npm test src/hooks/useAnimatedNumber.test.ts`
Expected: FAIL — cannot resolve `./useAnimatedNumber`.

- [ ] **Step 15: Implement useAnimatedNumber**

Create `src/hooks/useAnimatedNumber.ts`:

```ts
import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

export function useAnimatedNumber(target: number, durationMs = 600, steps = 20): number {
  const reduced = usePrefersReducedMotion()
  const [value, setValue] = useState(reduced ? target : 0)

  useEffect(() => {
    if (reduced) {
      setValue(target)
      return
    }

    let tick = 0
    setValue(0)
    const timer = setInterval(() => {
      tick += 1
      if (tick >= steps) {
        clearInterval(timer)
        setValue(target)
        return
      }
      setValue(Math.round((target * tick) / steps))
    }, durationMs / steps)

    return () => clearInterval(timer)
  }, [target, durationMs, steps, reduced])

  return value
}
```

- [ ] **Step 16: Count the level on the title screen**

The counter goes on the title screen, not on `/stats`: the `StatsScreen`
test asserts the level synchronously, and animating it there would force
that assertion to become asynchronous for no user-visible gain.

In `src/routes/TitleScreen.tsx`, add the import and the hook call, then use
the animated value in the subtitle:

```tsx
import { useAnimatedNumber } from '../hooks/useAnimatedNumber'
```

```tsx
  const level = useAnimatedNumber(cv.profile.level, 600)
```

```tsx
      <p className={styles.subtitle}>
        {cv.profile.class} · Lv.{level}
      </p>
```

- [ ] **Step 17: Animate the StatBar fill**

Give each filled cell its index so the blocks light up in sequence. In
`src/components/ui/StatBar.tsx`, extend the cell element:

```tsx
          <span
            key={index}
            className={styles.cell}
            data-state={index < filled ? 'on' : 'off'}
            style={{ '--i': index } as React.CSSProperties}
            aria-hidden="true"
          />
```

Add the keyframes to `src/components/ui/StatBar.module.css`:

```css
@keyframes cell-in {
  from {
    background: var(--c-bg);
  }
  to {
    background: var(--c-hp);
  }
}

.cell[data-state='on'] {
  animation: cell-in 40ms steps(1, end) both;
  animation-delay: calc(var(--i) * 40ms);
}

@media (prefers-reduced-motion: reduce) {
  .cell[data-state='on'] {
    animation: none;
    background: var(--c-hp);
  }
}
```

The `aria-valuenow` attribute never animates, so the accessible value is
correct from the first frame and the StatBar tests keep passing.

- [ ] **Step 18: Run the full suite**

Run: `npm test`
Expected: PASS, all tests.

- [ ] **Step 19: Commit**

```bash
git add src
git commit -m "feat: animate level counter and stat bar fill"
```

---

### Task 10: GitHub Pages deploy

**Files:**
- Modify: `package.json`, `README.md`
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `VITE_BASE_PATH` env var read by `vite.config.ts` (Task 1)
- Produces: a Pages deployment on every push to `main`; `dist/404.html` is a
  copy of `dist/index.html` so deep links survive a refresh.

- [ ] **Step 1: Make the build emit the SPA fallback**

Update the build script in `package.json`:

```json
"build": "tsc -b && vite build && cp dist/index.html dist/404.html"
```

- [ ] **Step 2: Verify the build locally**

```bash
VITE_BASE_PATH=/InteractiveCV/ npm run build
grep -o 'src="/InteractiveCV/assets/[^"]*"' dist/index.html | head -1
test -f dist/404.html && echo "404 fallback present"
```

Expected: an asset path prefixed with `/InteractiveCV/`, and the fallback line.

- [ ] **Step 3: Add the workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
        env:
          VITE_BASE_PATH: /InteractiveCV/
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 4: Document the project**

Replace `README.md`:

```markdown
# InteractiveCV

CV personale come sito arcade 8-bit: title screen piu sei sezioni
navigabili da tastiera (frecce, Enter, Esc) e da mouse/touch.

## Sviluppo

```bash
npm install
npm run dev
npm test
```

## Contenuti

Tutti i contenuti stanno in `src/data/cv.ts`. I componenti non contengono
testo del CV: per aggiornare il curriculum si modifica solo quel file.
Il PDF scaricabile e `public/cv.pdf`.

## Deploy

Push su `main` -> GitHub Action -> GitHub Pages, con
`VITE_BASE_PATH=/InteractiveCV/`.

Passaggio a dominio custom: impostare `VITE_BASE_PATH=/` nel workflow e
aggiungere `public/CNAME` con il dominio.
```

- [ ] **Step 5: Commit**

```bash
git add package.json README.md .github
git commit -m "ci: deploy to GitHub Pages with SPA fallback"
```

- [ ] **Step 6: Enable Pages in the repository settings**

In GitHub: Settings -> Pages -> Source: "GitHub Actions". Then push and check
the workflow run.

---

## Remaining manual inputs

These are outside the plan's control and block nothing until the end:

1. `public/cv.pdf` — replace the placeholder with the real CV export.
2. `src/data/cv.ts` — replace placeholder content with real CV data.
3. Optional CC0 asset pack (Kenney UI): the components render fully without
   it — `Frame` draws its notched border in CSS. Dropping PNG frames into
   `public/assets/ui/`, switching `Frame.module.css` to `border-image`, and
   adding the `Icon` wrapper named in the spec is a self-contained follow-up.
   The `Icon` component is deliberately not part of this plan: with no asset
   pack chosen yet, it would have nothing to render, and no screen depends on
   it — every label in the plan is text.
