# Plan 006 · Phase A — Apple design tokens + chrome restyle (Implementation)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. This is the bite-sized execution of **Phase A** of `docs/superpowers/plans/006-build-frontend-scroll-disassembly-and-multi-axis-tree.md`.

**Goal:** Restyle the existing app to Apple's design grammar via a shared token layer — near-black surfaces, SF/PingFang marketing type ramp, pill + 20px radii, Apple motion — plus an Apple "product-bar" nav and a reveal primitive, with **no IA or logic changes**.

**Architecture:** Tailwind v4 (`@theme inline` + CSS vars in `app/globals.css`) is the single token source; components consume tokens/utility classes so the restyle propagates. Server page shells + client islands unchanged structurally — only classes/markup-for-style change.

**Tech Stack:** Next.js 16.2.10, React 19.2, Tailwind v4, shadcn/@base-ui, TypeScript, pnpm.

## Global Constraints

- **Background decision (locked):** adopt Apple near-black `--background #0b0d10` / `--surface-1 #101317` / `--card #15181d`; the old navy `#0d1b2a` becomes ONLY the 3D stage backdrop (`--stage-bg`). Not the page background.
- **Keep (non-negotiable):** amber `#ffb703` as the sole accent (never body text); 紅漲綠跌 via `--up`/`--down`; Geist mono for tabular quote numerals; zh-Hant-TW default; all user-facing strings bilingual `LStr {en,zh}` via `l()`.
- **No functional diffs:** sort/search/graph/quote logic untouched. This phase is styling only.
- **pnpm only.** **Next 16:** before editing any route/server file, read the relevant guide in `node_modules/next/dist/docs/` (AGENTS.md — breaking changes vs. training data).
- **Verification harness (no unit-test runner for UI):** every task ends green on `pnpm build` + `pnpm lint`, and — for visual tasks — a before/after screenshot at both locales via the dev server (`pnpm dev`, capture `/`… the relevant route, `?`/cookie locale). Data gate `pnpm test` (`check:data`) must stay green.
- **Contrast:** body gray on background ≥ 4.5:1 (the chosen `--muted-foreground #a1a1a6` on `#0b0d10` clears it).
- **Responsive is cross-cutting** (006 §1): every restyled surface stays usable ≥320px, ≥44px touch targets, `dvh/svh` + safe-area; no horizontal overflow.

---

### Task 1: Token layer — rewrite `app/globals.css`

The linchpin. Everything downstream consumes these tokens.

**Files:**
- Modify: `app/globals.css`

**Interfaces (produced for later tasks):**
- CSS vars: `--background`, `--surface-1`, `--card`, `--foreground`, `--muted-foreground`, `--tertiary`, `--primary`, `--border`, `--stage-bg`, `--up`, `--down`, `--ease-apple`, `--ease-snappy`, `--dur-micro/-reveal/-hero`, `--radius` (=1.25rem), `--font-marketing`.
- Utility classes: `.text-display`, `.text-headline`, `.text-title`, `.text-eyebrow`, `.text-body-lg`, `.text-body`, `.ss-veil` (kept), `.ss-hairline`.

- [ ] **Step 1: Replace the `@theme inline` + `:root` + base + component token blocks**

Replace `app/globals.css` lines from `@theme inline {` through the end of the `@layer base { … }` block, and ADD the type-ramp + motion, with this (keep the existing `@import` lines at top, and keep the `@keyframes` + `@layer components { .ss-* }` blocks below unchanged EXCEPT as noted in Step 2):

```css
@theme inline {
  --color-background: var(--background);
  --color-surface-1: var(--surface-1);
  --color-foreground: var(--foreground);
  --font-sans:
    var(--font-geist-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang TC',
    'Noto Sans TC', sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, 'SF Mono', Menlo, monospace;
  --font-marketing:
    -apple-system, 'SF Pro Display', 'SF Pro TC', 'PingFang TC', 'Noto Sans TC', system-ui,
    sans-serif;
  --font-heading: var(--font-marketing);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-tertiary: var(--tertiary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --color-surface-veil: var(--surface-veil);
  --color-up: var(--up);
  --color-down: var(--down);
  /* Apple pill + card radii (base 20px) */
  --radius-sm: calc(var(--radius) * 0.4); /* 8px  */
  --radius-md: calc(var(--radius) * 0.55); /* 11px */
  --radius-lg: var(--radius); /* 20px */
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-pill: 999px;
}

/*
 * Apple grammar, dark-first (near-black pro-page pattern). Navy is retired to
 * the 3D stage backdrop only (--stage-bg). Amber stays the single accent.
 */
:root {
  color-scheme: dark;
  --background: #0b0d10;
  --surface-1: #101317;
  --foreground: #f5f5f7;
  --card: #15181d;
  --card-foreground: #f5f5f7;
  --popover: #15181d;
  --popover-foreground: #f5f5f7;
  --primary: #ffb703;
  --primary-foreground: #0b0d10;
  --secondary: rgba(255, 255, 255, 0.06);
  --secondary-foreground: #f5f5f7;
  --muted: rgba(255, 255, 255, 0.045);
  --muted-foreground: #a1a1a6;
  --tertiary: #6e6e73;
  --accent: rgba(255, 255, 255, 0.08);
  --accent-foreground: #f5f5f7;
  --destructive: #e66767;
  --border: rgba(255, 255, 255, 0.08);
  --input: rgba(255, 255, 255, 0.12);
  --ring: rgba(255, 183, 3, 0.6);
  --radius: 1.25rem;
  --surface-veil: rgba(11, 13, 16, 0.72);
  --stage-bg: #0d1b2a; /* navy — 3D scene backdrop only */
  /* market colors assigned per locale in code (zh 紅漲綠跌) */
  --up: #5ad19a;
  --down: #ff8585;
  /* motion */
  --ease-apple: cubic-bezier(0.25, 0.1, 0.3, 1);
  --ease-snappy: cubic-bezier(0.4, 0, 0.6, 1);
  --dur-micro: 160ms;
  --dur-reveal: 600ms;
  --dur-hero: 1000ms;
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
  }
}

@layer components {
  /* ---- Apple marketing type ramp (headlines use --font-marketing) ---- */
  .text-display {
    font-family: var(--font-marketing);
    font-size: clamp(56px, 8vw, 96px);
    font-weight: 600;
    line-height: 1.05;
    letter-spacing: -0.015em;
  }
  .text-headline {
    font-family: var(--font-marketing);
    font-size: clamp(40px, 6vw, 64px);
    font-weight: 600;
    line-height: 1.08;
    letter-spacing: -0.012em;
  }
  .text-title {
    font-family: var(--font-marketing);
    font-size: clamp(28px, 4vw, 40px);
    font-weight: 600;
    line-height: 1.1;
    letter-spacing: -0.01em;
  }
  .text-eyebrow {
    font-family: var(--font-marketing);
    font-size: clamp(12px, 1.5vw, 14px);
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--muted-foreground);
  }
  .text-body-lg {
    font-family: var(--font-marketing);
    font-size: clamp(19px, 2vw, 21px);
    font-weight: 400;
    line-height: 1.5;
  }
  .text-body {
    font-family: var(--font-marketing);
    font-size: 17px;
    font-weight: 400;
    line-height: 1.6;
  }
  /* zh renders one weight lighter on the ramp (design token doc) */
  html:lang(zh) .text-display,
  html:lang(zh) .text-headline,
  html:lang(zh) .text-title {
    font-weight: 500;
  }
  /* uppercase eyebrow only for latin */
  html:lang(en) .text-eyebrow {
    text-transform: uppercase;
  }
  /* hairline separator */
  .ss-hairline {
    border-color: var(--border);
  }
}
```

- [ ] **Step 2: Keep the animation vocabulary; retune the frosted veil**

Below the block above, the existing `@keyframes hsPulse/spin/fadeUp` and the `.ss-veil / .ss-panel / .ss-scroll / .ss-hotspot*` component classes stay. Leave `.ss-hotspot*` colors as-is (they render on the navy 3D stage). `.ss-veil` already reads `var(--surface-veil)`, now near-black — no change needed.

- [ ] **Step 3: Verify build + lint + data gate**

Run: `pnpm build` (expect success), `pnpm lint` (0 errors), `pnpm test` (`✓ … 246 companies, 42 categories`).
Expected: all pass. If Tailwind v4 rejects a token, fix syntax and re-run.

- [ ] **Step 4: Visual smoke (both locales)**

Run `pnpm dev`; open `/market`. Confirm the page is near-black (not navy), text is the light `#f5f5f7` ink, amber accents intact, 紅漲綠跌 preserved. Toggle locale, reconfirm.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "feat(ui): Apple-grammar token layer (near-black surfaces, type ramp, motion)"
```

---

### Task 2: `reveal.tsx` scroll-reveal primitive

**Files:**
- Create: `components/site/reveal.tsx`

**Interfaces:**
- Produces: `<Reveal>` client component — wraps children, applies `translateY(24px)`+fade once on intersection using `--ease-apple`/`--dur-reveal`; **reduced-motion → renders visible, no animation**. Server-friendly (children can be server nodes; the wrapper is `'use client'`).

- [ ] **Step 1: Read the Next 16 client-component guide**

Read the relevant file(s) under `node_modules/next/dist/docs/` on `'use client'` boundaries before writing (AGENTS.md). Confirm the island pattern used elsewhere (e.g. `components/graph/supply-chain-graph.tsx`).

- [ ] **Step 2: Write `components/site/reveal.tsx`**

```tsx
'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
}: {
  children: ReactNode;
  as?: 'div' | 'section' | 'li';
  delay?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : 'translateY(24px)',
        transition: `opacity var(--dur-reveal) var(--ease-apple) ${delay}ms, transform var(--dur-reveal) var(--ease-apple) ${delay}ms`,
      }}
    >
      {children}
    </Tag>
  );
}
```

- [ ] **Step 3: Verify + commit**

Run: `pnpm build` + `pnpm lint`. Expected: pass.
```bash
git add components/site/reveal.tsx
git commit -m "feat(ui): add IntersectionObserver Reveal primitive"
```

---

### Task 3: Apple "product-bar" site nav

**Files:**
- Modify: `app/layout.tsx`, `components/site/nav-links.tsx`, `components/site/brand.tsx`, `components/site/locale-toggle.tsx`

**Interfaces:**
- Consumes: token layer (Task 1). No new exports; restyle in place.

- [ ] **Step 1: Read current chrome**

Read `app/layout.tsx` and `components/site/{nav-links,brand,locale-toggle}.tsx` to see the current pill-cluster header and how locale/nav render.

- [ ] **Step 2: Restyle to the product bar (design-restyle-market-and-graph.md §Site chrome)**

Make the header a **sticky hairline bar, 44px tall**, frosted via `.ss-veil`, hairline bottom border (`border-b ss-hairline`): brand 矽鏈 left; `探索 / 圖譜 / 行情` anchors + locale toggle right; link text **12px / weight 600**, muted-foreground with amber/foreground on active/hover; quiet, no pills around the cluster. Keep all existing routes/labels and the locale toggle behavior — style only. Ensure ≥44px tap targets and horizontal scroll of the link row on narrow widths.

- [ ] **Step 3: Verify + screenshots + commit**

`pnpm build` + `pnpm lint`; `pnpm dev` → screenshot header on `/market` at both locales (before/after).
```bash
git add app/layout.tsx components/site/
git commit -m "feat(ui): Apple product-bar site nav"
```

---

### Task 4: `/market` restyle

**Files:**
- Modify: `app/market/page.tsx`, `components/market/{market-toolbar,quote-table}.tsx`

**Interfaces:**
- Consumes: token layer, `Reveal`. Logic in `market-rows.ts`/`market-sort.ts` **untouched**.

- [ ] **Step 1: Read current `/market`**

Read `app/market/page.tsx`, `components/market/quote-table.tsx`, `components/market/market-toolbar.tsx`.

- [ ] **Step 2: Apply the grammar (design-restyle §/market)**

- Header → chapter opener: `.text-eyebrow`（市場行情）+ `.text-headline`（台股 AI 供應鏈，每天的價格）+ `.text-body` gray sub. Wrap in `<Reveal>`.
- Table: **hairline separators only (no zebra)**, 17px rows, **tabular numerals** (`font-mono`/`tabular-nums` on number cells), **sticky header**; keep 紅漲綠跌 via `--up`/`--down`.
- Stat tiles → **cards** (`rounded-[var(--radius-lg)]` 20px, `border ss-hairline`, `bg-card`); summary/advance-decline chips → **pills** (`rounded-[var(--radius-pill)]`).
- Sort/search controls → quiet Apple controls (hairline, pill, subtle focus ring `--ring`). **Sort/filter logic unchanged.**

- [ ] **Step 3: Verify + screenshots + commit**

`pnpm build` + `pnpm lint`; confirm sorting/filtering still work; before/after screenshots ×2 locales.
```bash
git add app/market/ components/market/
git commit -m "feat(ui): restyle /market to Apple grammar (no logic change)"
```

---

### Task 5: `/supply-chain` chrome restyle

**Files:**
- Modify: `app/supply-chain/page.tsx`, `components/graph/node-panel.tsx` (+ legend markup wherever it lives)

**Interfaces:**
- Consumes: token layer. **Canvas rendering (`graph-renderer.ts`) untouched** — it's already dark-grammar.

- [ ] **Step 1: Read current `/supply-chain`**

Read `app/supply-chain/page.tsx` and `components/graph/node-panel.tsx`; locate the header/legend markup.

- [ ] **Step 2: Apply tokens (design-restyle §/supply-chain)**

Header/legend/panel adopt the type ramp, hairlines, and pills; **legend chips = Apple pills with stage-palette dots** (keep the stage palette colors). NodePanel uses `.ss-panel`, hairline borders, `.text-title`/`.text-body`, live quote unchanged. Do **not** touch canvas draw code or graph forces/interaction.

- [ ] **Step 3: Verify + screenshots + commit**

`pnpm build` + `pnpm lint`; graph still renders/interacts; before/after ×2 locales.
```bash
git add app/supply-chain/ components/graph/node-panel.tsx
git commit -m "feat(ui): restyle /supply-chain chrome to Apple grammar"
```

---

### Task 6: Shared UI primitives adopt the radii/controls

**Files:**
- Modify: `components/ui/{button,card,badge,input,select,table}.tsx` (only those needing radius/token alignment)

**Interfaces:**
- Consumes: token layer. Keep component APIs identical.

- [ ] **Step 1: Read the primitives**

Read the six `components/ui/*` files. Identify hardcoded radii/colors that should map to tokens (`rounded-[var(--radius-*)]`, `--border`, `--card`, pill for chips/badges).

- [ ] **Step 2: Align to tokens**

Buttons/inputs/selects → hairline borders, pill or `--radius-md` per role, focus ring `--ring`, amber primary. Cards → `--radius-lg` + hairline. Badges → pill. **No API/prop changes**; only class/token alignment. (Many already read tokens via shadcn — change only what still hardcodes navy-era values.)

- [ ] **Step 3: Verify + commit**

`pnpm build` + `pnpm lint`; spot-check a page using each primitive.
```bash
git add components/ui/
git commit -m "feat(ui): align UI primitives to Apple radii/tokens"
```

---

### Task 7: Acceptance — audit, contrast, screenshots

**Files:** none (verification + a PR-ready audit note).

- [ ] **Step 1: Full gates**

`pnpm build`, `pnpm lint`, `pnpm test` — all green.

- [ ] **Step 2: Element→token audit + contrast**

Confirm no surface still uses the retired navy `#0d1b2a` as a page/card background (grep `0d1b2a` in `app/`+`components/`; only `--stage-bg`/scene may reference it). Confirm `--muted-foreground #a1a1a6` on `#0b0d10` ≥ 4.5:1.

- [ ] **Step 3: Before/after screenshots ×3 routes ×2 locales**

`pnpm dev`; capture `/`, `/market`, `/supply-chain` at zh + en. Note `/` (the 3D explorer) should keep its navy stage but gain Apple chrome/nav. Attach to the PR.

- [ ] **Step 4: Commit any audit fixes**

```bash
git add -A
git commit -m "chore(ui): Phase A acceptance — token audit + contrast"
```

## Self-Review

- **Spec coverage:** token layer (tokens doc) = Task 1; reveal primitive = Task 2; product-bar nav + /market + /supply-chain restyle (design-restyle doc) = Tasks 3–5; UI primitives = Task 6; acceptance (audit/contrast/screenshots ×3×2) = Task 7. Keeps amber/紅漲綠跌/Geist/zh-first throughout.
- **Placeholder scan:** Task 1 and Task 2 carry complete code; restyle tasks (3–6) give concrete grammar rules + exact token classes and read the current file (correct for in-place restyle).
- **Risk:** the only behavioral risk is accidentally changing sort/graph/quote logic — each task says logic is untouched, and `pnpm test` + manual interaction checks guard it. `/` (3D explorer) is intentionally out of Phase A except for shared chrome; its scene restyle is Phase B/C.

## Execution Handoff

Presented after review — recommend subagent-driven, Task 1 first (deterministic token layer), reviewing each task's build/lint + screenshots before the next.
