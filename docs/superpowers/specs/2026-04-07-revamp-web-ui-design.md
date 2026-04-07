# Design Spec: Revamp Web UI to Linear-inspired Design System

## Goal
Transform the current light-themed Web UI into a sophisticated, dark-mode-first, "Linear-inspired" design system as specified in `DESIGN.md`, while maintaining a theme toggle for a "Linear Light" experience.

## Context
The existing UI uses a light-themed `oklch` color palette and `Manrope` typography with large border radii. This revamp will align the project's visual identity with its goal of being a "precision-engineered" tool for agents and humans. We will use `next-themes` for theme management and `Inter Variable` for typography.

## Scope
- **Global Styles**: Redesign `apps/web/app/globals.css` with the palette, typography rules, and 8px spacing system.
- **Typography**: Integrate `Inter` via `next/font/google` and apply global `font-feature-settings: "cv01", "ss03"`.
- **Component Overhaul**:
  - Update `board-column.tsx`, `card-tile.tsx`, and `card-detail.tsx` with translucent surfaces and subtle borders.
  - Implement the theme toggle and button variants in `review-actions.tsx`.
- **Theme Management**: Install and configure `next-themes`.
- **Verification**: Ensure all existing Playwright E2E tests continue to pass.

## Architecture & Dependencies
- **Theme Management**: `next-themes` for handling `dark:` classes and `localStorage` persistence.
- **Typography**: `Inter Variable` (via `next/font/google`) with global `font-feature-settings: "cv01", "ss03"`.
- **Styling**: Tailwind CSS with a revamped `globals.css` using the palette and typography rules from `DESIGN.md`.

## Detailed Design

### 1. Palette & Variables
The color system will move from `oklch` to hex/rgba values for precise control over transparency and luminance stacking.

**Dark Theme (`.dark`):**
- **Background (Marketing Black)**: `#08090a`
- **Panel Background**: `#0f1011`
- **Surface (Level 2)**: `rgba(255, 255, 255, 0.02)`
- **Border (Standard)**: `rgba(255, 255, 255, 0.08)`
- **Primary Text**: `#f7f8f8`
- **Secondary Text**: `#8a8f98`
- **Brand Accent (Indigo)**: `#5e6ad2`

**Light Theme (`:root`):**
- **Background**: `#f7f8f8`
- **Surface**: `#ffffff`
- **Border**: `#d0d6e0`
- **Primary Text**: `#08090a`
- **Secondary Text**: `#62666d`
- **Brand Accent (Indigo)**: `#5e6ad2`

### 2. Typography Rules
- **Font**: `Inter Variable` globally.
- **Features**: `font-feature-settings: "cv01", "ss03"` enabled on `body`.
- **Weights**: 400 (Body), 510 (UI/Emphasis), 590 (Headings/Semibold).
- **Scale**:
  - Display (Headings): Negative letter-spacing (e.g., `-0.01em` to `-0.03em`).
  - Small (UI): Standard or slightly tight spacing.

### 3. Component Overhaul
- **Layout Container**: Max-width 1200px, 8px grid system.
- **Radius Scale**:
  - Buttons/Inputs: `6px`
  - Cards/Columns: `8px`
  - Panels: `12px`
- **Surfaces**:
  - Board columns and card tiles will use the `Surface` background and `Border` with a `backdrop-blur-xl`.
  - Hover states on card tiles will increase background opacity to `0.05`.
- **Buttons (`review-actions.tsx`)**:
  - **Ghost**: `rgba(255,255,255,0.02)` background (dark) / `#f3f4f5` (light), `Border` color.
  - **Primary**: Brand Indigo background, white text.

### 4. Theme Toggle
- A simple Sun/Moon icon toggle in the `header`.
- Client-side persistence via `localStorage`.
- Integrated using `next-themes` `ThemeProvider`.

## Error Handling & Edge Cases
- **Theme Flicker**: Handled by `next-themes` standard script.
- **Contrast**: Ensure WCAG AA compliance for primary and secondary text on both themes.

## Testing Strategy
- **Visual Verification**: Manual check of all key views (Board, Card Detail, Inbox) in both themes.
- **Regression**: Run existing Playwright E2E tests (`pnpm --filter @agent-kanban/web test:e2e`) to ensure no functional breakage.

## Definition of Done
- [x] `next-themes` installed and configured.
- [x] `globals.css` updated with the new palette and typography.
- [x] `Inter Variable` integrated via `next/font/google`.
- [x] Theme toggle icon implemented in the header.
- [x] Board, Card Detail, and Inbox views updated with the new aesthetics.
- [x] All Playwright E2E tests pass.
