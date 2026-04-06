# Revamp Web UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Web UI into a dark-mode-first, "Linear-inspired" design system using `next-themes` and `Inter Variable`.

**Architecture:** Implement a theme-aware layout with a preference-based toggle. Centralize colors and spacing in `globals.css` using CSS variables that swap based on the `.dark` class. Update all components to use luminance-based elevation and refined typography.

**Tech Stack:** Next.js, Tailwind CSS v4, `next-themes`, `lucide-react`.

---

### Task 1: Environment Setup & next-themes Installation

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Install next-themes**

Run: `pnpm --filter @agent-kanban/web add next-themes lucide-react`
Expected: `next-themes` and `lucide-react` are added to `apps/web/package.json`.

- [ ] **Step 2: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "chore(web): add next-themes and lucide-react dependencies"
```

---

### Task 2: Configure Inter Variable Font and Typography

**Files:**
- Modify: `apps/web/app/layout.tsx`

- [ ] **Step 1: Replace Manrope with Inter Variable**

Update `layout.tsx` to use `Inter` with the required OpenType features (`cv01`, `ss03`) and apply it globally.

```typescript
import { Inter, IBM_Plex_Mono } from "next/font/google";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: 'swap',
});
```

- [ ] **Step 2: Apply global font features**

In `layout.tsx`, ensure the `body` tag receives the `antialiased` class and that the OpenType features are applied via CSS (handled in next task).

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/layout.tsx
git commit -m "style(web): switch typography to Inter Variable"
```

---

### Task 3: Revamp globals.css with Linear-inspired Variables

**Files:**
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: Define Linear-inspired palette and spacing**

Update `globals.css` to use the new variables for both light and dark modes. Use the luminance stacking model for surfaces.

```css
@import "tailwindcss";
@import "tw-animate-css";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-surface: var(--surface);
  --color-border: var(--border);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
}

:root {
  --background: #f7f8f8;
  --foreground: #08090a;
  --surface: #ffffff;
  --border: #d0d6e0;
  --accent: #5e6ad2;
  --accent-foreground: #ffffff;
  --radius: 8px;
}

.dark {
  --background: #08090a;
  --foreground: #f7f8f8;
  --surface: rgba(255, 255, 255, 0.02);
  --border: rgba(255, 255, 255, 0.08);
  --accent: #5e6ad2;
  --accent-foreground: #f7f8f8;
}

* {
  border-color: var(--border);
}

body {
  min-height: 100vh;
  background-color: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans), sans-serif;
  font-feature-settings: "cv01", "ss03";
}
```

- [ ] **Step 2: Update prose and typography styles**

Refine headings with negative letter-spacing and appropriate weights (510/590).

```css
.prose-kanban h1 {
  font-size: 1.85rem;
  font-weight: 590;
  letter-spacing: -0.03em;
}

.prose-kanban h2 {
  font-weight: 510;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/globals.css
git commit -m "style(web): implement Linear-inspired palette and typography rules"
```

---

### Task 4: Implement ThemeProvider and Theme Toggle

**Files:**
- Create: `apps/web/components/theme-provider.tsx`
- Create: `apps/web/components/theme-toggle.tsx`
- Modify: `apps/web/app/layout.tsx`

- [ ] **Step 1: Create ThemeProvider**

```typescript
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
```

- [ ] **Step 2: Create ThemeToggle component**

Use `lucide-react` for Sun/Moon icons and `useTheme` for state.

```typescript
"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-9 h-9" />;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-md hover:bg-surface border border-transparent hover:border-border transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
```

- [ ] **Step 3: Integrate ThemeProvider into Layout**

Wrap the children in `layout.tsx` with the `ThemeProvider`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/theme-provider.tsx apps/web/components/theme-toggle.tsx apps/web/app/layout.tsx
git commit -m "feat(web): implement theme-aware provider and toggle"
```

---

### Task 5: Refactor Header and Global Layout

**Files:**
- Modify: `apps/web/app/layout.tsx`

- [ ] **Step 1: Refine Header aesthetics**

Update the header to match the new surface and border rules. Add the `ThemeToggle`.

```tsx
<header className="sticky top-0 z-20 border-b border-border bg-background/70 backdrop-blur-xl">
  <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
    <div className="flex flex-col">
       <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
         Local First Workflow
       </span>
       <span className="text-lg font-medium tracking-[-0.02em]">
         agent-kanban
       </span>
    </div>
    <div className="flex items-center gap-4">
      <nav className="hidden items-center gap-3 text-sm text-secondary-foreground md:flex">
         <Link href="/inbox" className="px-3 py-1.5 rounded-md hover:bg-surface border border-transparent hover:border-border transition">
           Inbox
         </Link>
      </nav>
      <ThemeToggle />
    </div>
  </div>
</header>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/layout.tsx
git commit -m "style(web): refine header layout and integration"
```

---

### Task 6: Update Board and Card Components

**Files:**
- Modify: `apps/web/components/board-column.tsx`
- Modify: `apps/web/components/card-tile.tsx`
- Modify: `apps/web/app/cards/[cardId]/page.tsx` (Card detail if separate component)

- [ ] **Step 1: Update BoardColumn styles**

Use `bg-surface`, `border-border`, and `rounded-xl`. Replace large shadows with subtle luminance steps.

```tsx
// apps/web/components/board-column.tsx
<section className="flex min-w-[300px] flex-1 flex-col gap-4 rounded-xl border border-border bg-surface p-4 backdrop-blur-xl">
```

- [ ] **Step 2: Update CardTile styles**

Implement hover states that increase opacity.

```tsx
// apps/web/components/card-tile.tsx
<div className="group rounded-lg border border-border bg-surface/50 p-4 transition-all hover:bg-surface">
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/board-column.tsx apps/web/components/card-tile.tsx
git commit -m "style(web): update board and card components to new design system"
```

---

### Task 7: Update Action Components and Final Verification

**Files:**
- Modify: `apps/web/components/review-actions.tsx`

- [ ] **Step 1: Refactor buttons in review-actions.tsx**

Implement Ghost and Primary buttons using the new palette.

```tsx
// apps/web/components/review-actions.tsx
const ghostClass = "px-3 py-1.5 rounded-md border border-border bg-surface hover:bg-surface/80 transition-colors text-sm font-medium";
const primaryClass = "px-3 py-1.5 rounded-md bg-accent text-accent-foreground hover:opacity-90 transition-opacity text-sm font-medium";
```

- [ ] **Step 2: Final Verification**

Run Playwright E2E tests to ensure no regressions.

Run: `pnpm --filter @agent-kanban/web test:e2e`
Expected: ALL PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/review-actions.tsx
git commit -m "style(web): update review actions and finalize revamp"
```
