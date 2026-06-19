# UrGlowUp Design System

Turkey-focused appointment marketplace for beauty, grooming, wellness, spa, and personal care services.

**Stack**: Next.js App Router · Tailwind v4 · shadcn/ui (Nova, base-ui primitives) · Lucide icons · OKLCH color space

---

## 1. Design Principles

1. **Trust first** — Clarity and transparency over cleverness. Prices, durations, and cancellation terms are always visible. No dark patterns.
2. **Calm focus** — Low visual noise. Content breathes. Avoid decorative animation; reserve motion for meaningful state changes.
3. **Mobile-first** — Design for one thumb on a 390 px screen; desktop is an enhancement layer.
4. **Accessible always** — WCAG 2.1 AA minimum. Every interactive element must have a visible focus ring, sufficient contrast, and a text label for screen readers.
5. **Marketplace clarity** — The user should never have to dig for: business name, service price, duration, next availability, and star rating. Surface these in every listing context.

---

## 2. Brand Attributes

| Attribute | Expression |
|---|---|
| **Personality** | Warm, premium, calm, trustworthy |
| **Tone** | Approachable expert — confident but never cold |
| **Market** | Turkey-first (TRY pricing, Turkish locale at root `/`) |
| **Audience** | Primarily women 20–45; inclusive of grooming, clinic, and wellness |
| **Differentiator** | Reliable scheduling + transparent pricing, not lifestyle aspiration |

**Primary brand color**: Rose-pink (hue 10°) — warm, inviting, feminine without being exclusive.  
**Secondary brand color**: Soft purple (hue 285–300°) — trustworthy, sophisticated, used for business nav and accents.  
**Neutral base**: Warm cream (hue 85°) — calm backgrounds, never clinical white.

---

## 3. Color Tokens

All tokens are CSS custom properties defined in `src/app/globals.css`. Use Tailwind utilities — never hardcode raw OKLCH values in components.

### 3a. Semantic Core

| Token | Light value | Tailwind utility | Usage |
|---|---|---|---|
| `--background` | `oklch(1 0 0)` | `bg-background` | Page background |
| `--foreground` | `oklch(0.145 0 0)` | `text-foreground` | Body text |
| `--card` | `oklch(1 0 0)` | `bg-card` | Card surface |
| `--card-foreground` | `oklch(0.145 0 0)` | `text-card-foreground` | Card text |
| `--popover` | `oklch(1 0 0)` | `bg-popover` | Dropdown / dialog surface |
| `--muted` | `oklch(0.97 0 0)` | `bg-muted` | Muted/subtle fill |
| `--muted-foreground` | `oklch(0.556 0 0)` | `text-muted-foreground` | Secondary text, placeholders |
| `--border` | `oklch(0.922 0 0)` | `border-border` | Default borders |
| `--input` | `oklch(0.90 0.008 10)` | `border-input` | Input border (warm tint) |
| `--ring` | `oklch(0.72 0.06 10)` | `ring-ring` | Focus ring (warm pink) |
| `--primary` | `oklch(0.205 0 0)` | `bg-primary` | Default button, active nav |
| `--primary-foreground` | `oklch(0.985 0 0)` | `text-primary-foreground` | Text on primary |
| `--secondary` | `oklch(0.97 0 0)` | `bg-secondary` | Secondary button fill |
| `--secondary-foreground` | `oklch(0.205 0 0)` | `text-secondary-foreground` | Text on secondary |
| `--accent` | `oklch(0.97 0 0)` | `bg-accent` | Hover fills |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `text-destructive` | Errors, delete actions |

### 3b. Brand

| Token | Light value | Tailwind utility | Role |
|---|---|---|---|
| `--brand-pink` | `oklch(0.92 0.03 10)` | `bg-brand-pink` | Primary CTA background |
| `--brand-pink-foreground` | `oklch(0.25 0.05 10)` | `text-brand-pink-foreground` | Text on brand-pink |
| `--brand-purple` | `oklch(0.91 0.03 300)` | `bg-brand-purple` | Purple accent |
| `--brand-purple-foreground` | `oklch(0.25 0.05 300)` | `text-brand-purple-foreground` | Text on brand-purple |
| `--brand-cream` | `oklch(0.97 0.01 85)` | `bg-brand-cream` | Warm neutral fill |

### 3c. Surface Tints

Used for contextual backgrounds: info callouts, hover states, grouping.

| Token | Light value | Tailwind utility | Usage |
|---|---|---|---|
| `--surface-cream` | `oklch(0.98 0.008 85)` | `bg-surface-cream` | Default muted section background |
| `--surface-pink` | `oklch(0.97 0.008 10)` | `bg-surface-pink` | Info callouts, booking context |
| `--surface-pink-hover` | `oklch(0.94 0.015 10)` | `bg-surface-pink-hover` | Hover on brand-pink elements |
| `--surface-purple` | `oklch(0.97 0.007 300)` | `bg-surface-purple` | Purple tinted surfaces |

### 3d. Semantic Status

| Token | Light value | Tailwind utility | Usage |
|---|---|---|---|
| `--success` | `oklch(0.93 0.05 145)` | `bg-success` | Confirmed bookings, open status |
| `--success-foreground` | `oklch(0.28 0.08 145)` | `text-success-foreground` | |
| `--warning` | `oklch(0.94 0.06 80)` | `bg-warning` | Pending, rescheduled |
| `--warning-foreground` | `oklch(0.30 0.09 65)` | `text-warning-foreground` | |
| `--info` | `oklch(0.92 0.04 240)` | `bg-info` | Informational callouts |
| `--info-foreground` | `oklch(0.28 0.08 240)` | `text-info-foreground` | |
| `--neutral` | `oklch(0.93 0.005 85)` | `bg-neutral` | Cancelled, inactive |
| `--neutral-foreground` | `oklch(0.40 0.01 85)` | `text-neutral-foreground` | |

### 3e. Business Nav

| Token | Value | Usage |
|---|---|---|
| `--business-nav` | `oklch(0.21 0.10 285)` | Business dashboard sidebar/topbar |
| `--business-nav-fg` | `oklch(0.97 0 0)` | Text/icons on nav |
| `--business-nav-muted` | `oklch(0.70 0.04 285)` | Inactive nav items |

### 3f. Shadow Tokens

All shadows carry a warm pink undertone (hue 10°) for visual cohesion.

| Token | Value | Usage |
|---|---|---|
| `--shadow-xs` | `0 1px 2px oklch(0.20 0.01 10 / 0.06)` | Subtle lift (inputs, chips) |
| `--shadow-sm` | `0 1px 3px … / 0.08, 0 1px 2px … / 0.04` | Cards, dropdowns |
| `--shadow-md` | `0 4px 6px … / 0.06, 0 2px 4px … / 0.04` | Floating panels, popovers |
| `--shadow-lg` | `0 10px 15px … / 0.06, 0 4px 6px … / 0.03` | Modals, bottom sheets |

Tailwind utilities: `shadow-xs` · `shadow-sm` · `shadow-md` · `shadow-lg`

---

## 4. Typography

### 4a. Font Stack

```css
--app-font-sans: "Segoe UI", ui-sans-serif, system-ui, -apple-system,
                 BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
```

No web font is loaded. Do not introduce web font imports without a specific product decision.

### 4b. Type Scale

Defined in `src/app/globals.css` `@layer base`. Use HTML elements directly — do not re-declare these with raw Tailwind classes on heading elements.

| Element | Classes | Mobile | Desktop |
|---|---|---|---|
| `h1` | `text-4xl font-bold leading-[1.1] tracking-[-0.02em]` | 36px | 48px (md:text-5xl) |
| `h2` | `text-2xl font-semibold leading-snug tracking-[-0.015em]` | 24px | 24px |
| `h3` | `text-lg font-semibold leading-snug tracking-[-0.01em]` | 18px | 18px |
| `h4` | `text-base font-semibold tracking-[-0.005em]` | 16px | 16px |
| `p` | `leading-relaxed` | 16px | 16px |
| Label / caption | `text-sm text-muted-foreground` | 14px | 14px |
| Micro / metadata | `text-xs text-muted-foreground` | 12px | 12px |

### 4c. Rules

- Negative letter-tracking on headings only — never on body text.
- Use `font-heading` (`font-sans` alias) for `CardTitle` and `DialogTitle`.
- `truncate` + `min-w-0` on any flex child that might overflow.
- Avoid `font-bold` on body text; use `font-medium` or `font-semibold`.

---

## 5. Spacing Scale

Tailwind v4 default: 1 unit = 4px.

| Scale | px | Common use |
|---|---|---|
| 0.5 | 2 | Hairline gaps |
| 1 | 4 | Icon-to-text gap in xs buttons |
| 1.5 | 6 | Icon-to-text gap in default buttons |
| 2 | 8 | Tight padding (xs button `px-2`) |
| 2.5 | 10 | Default button `px-2.5` |
| 3 | 12 | Input `px-3`, card sm `px-3` |
| 4 | 16 | Card `px-4`, section `p-4` |
| 5 | 20 | Generous section gap |
| 6 | 24 | Large button `px-6`, section `p-6` |
| 8 | 32 | Page-level horizontal padding |
| 12 | 48 | Section vertical rhythm |
| 16 | 64 | Large vertical gaps |

Standard component heights: `h-6` (24) · `h-7` (28) · `h-8` (32, default button) · `h-9` (36, input) · `h-10` (40, lg button)

---

## 6. Radius & Shadow Reference

### Radius

Base: `--radius: 0.625rem` (10px). All variants derive from this.

| Token | Calc | px | Tailwind | Usage |
|---|---|---|---|---|
| `--radius-sm` | × 0.6 | ~6 | `rounded-sm` | xs buttons, tight chips |
| `--radius-md` | × 0.8 | ~8 | `rounded-md` | sm buttons |
| `--radius-lg` | × 1.0 | 10 | `rounded-lg` | inputs, default buttons, most elements |
| `--radius-xl` | × 1.4 | ~14 | `rounded-xl` | cards, dialogs, sheet panels |
| `--radius-2xl` | × 1.8 | ~18 | `rounded-2xl` | large surfaces |
| `--radius-3xl` | × 2.2 | ~22 | `rounded-3xl` | |
| `--radius-4xl` | × 2.6 | ~26 | `rounded-4xl` | pill badges |
| — | — | 9999 | `rounded-full` | avatar, icon-only buttons, star chips |

**Rule**: cards and dialogs use `rounded-xl`. Inputs and standard buttons use `rounded-lg`. Badges use `rounded-4xl`. Avatars use `rounded-full`.

### Shadows

Use `shadow-sm` for cards at rest, `shadow-md` on hover or for popovers, `shadow-lg` for modals. Use `shadow-xs` for form elements when a subtle lift is needed.

---

## 7. Component Rules

### 7a. Button

Source: `src/components/ui/button.tsx`

| Variant | Usage |
|---|---|
| `brand` | Primary marketplace CTA: "Book Now", "Reserve Slot" — rose-pink fill |
| `default` | Dark-fill actions in admin or confirmation contexts |
| `outline` | Secondary action alongside a primary; hovers to `surface-cream` |
| `secondary` | Tertiary; light-gray fill |
| `ghost` | Icon-only toolbar actions, nav items |
| `destructive` | Cancel booking, delete record |
| `link` | Inline text links |

| Size | Height | Usage |
|---|---|---|
| `xs` | h-6 | Compact table actions, inline chips |
| `sm` | h-7 | Dense lists, secondary row actions |
| `default` | h-8 | Standard form actions |
| `lg` | h-10 | Hero CTAs, full-width mobile booking bar |
| `icon` / `icon-sm` / `icon-lg` | Square | Icon-only buttons |

Rules:
- Use `brand` + `lg` for the primary booking CTA on marketplace pages.
- Never place two `brand` buttons in the same view.
- Full-width on mobile: add `w-full` to the button (do not wrap in extra divs).
- Focus ring is auto-applied (`focus-visible:ring-3 focus-visible:ring-ring/50`). Do not override.

### 7b. Card

Source: `src/components/ui/card.tsx`

Structure: `Card > CardHeader > CardTitle + CardDescription + CardAction | CardContent | CardFooter`

```
rounded-xl border border-border/50 bg-card py-4 shadow-sm
```

- Default padding: `px-4` in header and content, `py-4` on card.
- `size="sm"`: `py-3 / px-3` — use for dense list cards.
- `CardFooter`: `border-t bg-muted/50` — muted footer for actions.
- Images as first or last child clip to card corners automatically.
- For marketplace listing cards: use `hover:shadow-md transition-all` for interactive lift.
- Do not nest cards.

### 7c. Input / Textarea

Source: `src/components/ui/input.tsx`

```
h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-base
focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50
```

- Always pair with `<label>` — never `placeholder`-only.
- `aria-invalid` prop triggers red border + ring automatically.
- Disabled state uses `bg-input/50 opacity-50`.
- Textarea follows the same pattern with `min-h-[6rem] resize-y`.

### 7d. Badge

Source: `src/components/ui/badge.tsx`

```
h-5 rounded-4xl px-2 py-0.5 text-xs font-medium
```

| Variant | Usage |
|---|---|
| `success` | Confirmed booking, business open |
| `warning` | Pending, rescheduled, closing soon |
| `info` | Informational context |
| `neutral` | Cancelled, expired, inactive |
| `destructive` | Failed, overdue |
| `pink` | Service category tag, featured |
| `purple` | Premium / brand accent tag |
| `outline` | Neutral filter chip |

Rules:
- Use status variants for booking/appointment states — never raw color classes.
- Business "open/closed" badge: `success` / `neutral`.
- Category tags in search/explore: `pink` or `outline`.

### 7e. Modal / Dialog / Sheet

Source: `src/components/ui/dialog.tsx`

```
fixed top-1/2 left-1/2 rounded-xl bg-popover p-4 ring-1 ring-foreground/10
max-w-[calc(100%-2rem)] sm:max-w-sm
```

- Overlay: `bg-black/10 backdrop-blur-xs`.
- Dialog footer: `border-t bg-muted/50` (same pattern as CardFooter).
- Close button: `ghost` `icon-sm` at `top-2 right-2`.
- On mobile, prefer `Sheet` (bottom drawer) over `Dialog` for booking flows.
- Keep dialog width ≤ `sm:max-w-sm` for confirmation dialogs; use `sm:max-w-lg` for form dialogs only.

---

## 8. Marketplace UI Patterns

### 8a. Business Listing Card

Layout: image (aspect-video, rounded-t-xl) → content (name, category, rating, price-from, distance) → CTA.

```
bg-surface-cream rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-all
```

- Rating: `★ 4.8 (124)` — star icon (`size-3.5 text-warning-foreground`) + text-sm.
- Price-from: `text-sm font-medium` + `text-muted-foreground` for "from" label.
- Category badge: `pink` or `outline` variant, top-left overlay on image.

### 8b. Profile Hero / Header

- Business name: `h1` (36–48px, bold).
- Subtitle (category + city): `text-muted-foreground text-base`.
- Open/closed badge inline with name: `success` / `neutral` badge.
- Star rating + review count: prominent, below name.
- Action row: "Book Now" (`brand lg`), "Share" (`outline icon-sm`), "Save" (`ghost icon-sm`).

### 8c. Service List Row

```
flex items-center justify-between border-t border-border/50 py-3
```

- Left: service name (`font-medium`) + duration (`text-sm text-muted-foreground`).
- Right: price (`font-semibold`) + "Book" (`brand xs` or `outline xs`).
- Do not use cards for service rows in a list — use divider rows.

### 8d. Review / Rating Display

- Summary: large number (`text-3xl font-bold`) + star row + count.
- Individual review: avatar (`size-8 rounded-full`) + name + date (`text-xs text-muted-foreground`) + text.
- Star icons: `size-3.5`. Filled = `text-warning-foreground`; empty = `text-muted`.

### 8e. Open/Closed Status Badge

```tsx
<Badge variant={isOpen ? "success" : "neutral"}>
  {isOpen ? "Açık" : "Kapalı"}
</Badge>
```

Always use `success` / `neutral`. Never use raw colors for this state.

---

## 9. Booking Flow Rules

### 9a. Step Layout

- Full-screen mobile sheet or page route — not a dialog.
- Progress: step indicator at top (`text-xs text-muted-foreground` — "Adım 2/4").
- Business context chip at top: logo + name + city on `bg-surface-cream rounded-xl`.
- Each step = `flex flex-col gap-4 p-4`.

### 9b. Summary Card Pattern

```
bg-surface-cream rounded-lg p-3 space-y-2
```

- Each row: `flex items-center gap-2 text-sm` with Lucide icon (`size-4 text-muted-foreground shrink-0`).
- Info callout: `bg-surface-pink/60 rounded-lg p-3 text-sm`.
- Sections separated by `border-t border-border/50`.

### 9c. Confirmation / Success State

- Use `EmptyState` component with `CalendarCheck` icon.
- Success icon background: `bg-success/20 rounded-full p-3`.
- Heading: `h3` "Randevunuz Onaylandı".
- Sub-text: date, time, business name in `text-muted-foreground`.
- CTA: "Randevularım" (`outline`) + "Ana Sayfa" (`ghost`).

---

## 10. Mobile-First Layout Rules

- **Base breakpoint = mobile** (< 640px). Add `sm:` / `md:` / `lg:` only when desktop needs differ.
- Minimum touch target: 44 × 44px (`min-h-[44px] min-w-[44px]` or use `lg` button size).
- Horizontal padding: `px-4` on mobile containers; `px-6` or `px-8` on `sm:`.
- Two-column layout (profile + sidebar): `grid grid-cols-1 md:grid-cols-[1fr_320px]`.
- Bottom booking bar on mobile: `fixed bottom-0 left-0 right-0 z-40 border-t bg-background p-4`.
- Avoid horizontal scroll. All scrollable containers must use `overflow-x-auto` with `scrollbar-none` or visible scrollbars.
- Carousel / horizontal scroll panels: apply `.business-panel-mask` or `.home-testimonials-mask` for fade-out edges.

---

## 11. Accessibility Rules

- **Contrast**: all text on background must meet WCAG AA (4.5:1 normal text, 3:1 large text). OKLCH tokens are chosen to satisfy this — do not reduce opacity of foreground text.
- **Focus ring**: every interactive element inherits `focus-visible:ring-3 focus-visible:ring-ring/50` from base styles. Never add `outline-none` without a visible alternative.
- **Labels**: every form input must have a visible `<label>` or an `aria-label`. Placeholder text is not a label.
- **Icon buttons**: always include `<span className="sr-only">Description</span>` inside icon-only buttons.
- **Images**: all `<Image>` and `<img>` must have descriptive `alt` text. Decorative images use `alt=""`.
- **ARIA live regions**: booking confirmations and error messages must use `role="status"` or `role="alert"`.
- **Reduced motion**: respect `prefers-reduced-motion: reduce` — do not add auto-playing or looping animations.
- **Color alone**: never convey state (success, error, open/closed) with color alone — pair with text or icon.

---

## 12. AI Coding Rules

These rules apply to all future UI changes in this codebase.

### Do

- **Use design tokens** — always reference CSS custom properties via Tailwind utilities (`bg-brand-pink`, `text-muted-foreground`, `border-border`). Never hardcode `oklch(…)`, `#hex`, or `rgb(…)` in components.
- **Use existing components** — check `src/components/ui/` before writing a new primitive. Prefer composing from `Card`, `Button`, `Badge`, `Input`, `Dialog`.
- **Use `cn()`** — always merge classes with `cn()` from `@/lib/utils`. Never concatenate class strings manually.
- **Use `brand` button for booking CTAs** — the single primary action per view gets `variant="brand" size="lg"`.
- **Use status badge variants** — booking/appointment state always maps to `success` / `warning` / `neutral` / `destructive` Badge variants.
- **Use surface tints for context** — muted sections, info callouts, and summary cards use `bg-surface-cream` or `bg-surface-pink/60`. Never use raw `bg-gray-*`.
- **Use `data-slot` attributes** — follow the existing `data-slot="component-name"` pattern when writing new primitives.
- **Respect heading hierarchy** — `h1` once per page, `h2` for sections, `h3` for cards/subsections.
- **Mobile-first breakpoints** — write mobile styles as the base; override at `sm:` / `md:`.
- **Icon sizes** — use `size-3` (12px), `size-4` (16px), `size-5` (20px). Always add `shrink-0` to icons in flex rows.

### Do not

- **Do not hardcode colors** — `text-[oklch(0.25_0.05_10)]` or `bg-[#f5c4bb]` are forbidden. Map to a token or request a new one in `globals.css`.
- **Do not nest cards** — no `<Card>` inside a `<Card>`.
- **Do not use `outline-none` alone** — always pair with a visible focus style.
- **Do not use `placeholder` as the only label** — pair every input with a `<label>`.
- **Do not introduce web fonts** — the system font stack is intentional. No `next/font` without a product decision.
- **Do not use `tailwind.config.ts`** — Tailwind v4 configuration lives in `globals.css` `@theme inline` and CSS custom properties. Do not create a config file.
- **Do not add new npm packages** for UI — the stack (shadcn/base-ui/lucide/CVA/clsx/tailwind-merge) covers all UI needs.
- **Do not use `sm:text-*` to size headings** — heading sizes are defined globally in `@layer base`; override with a wrapper class only if the context truly differs.
- **Do not suppress the focus ring** — the ring is a trust and accessibility signal. Do not set `focus:outline-none` or `focus-visible:ring-0` on clickable elements.
- **Do not use color alone for state** — always pair badge color with text (e.g., "Onaylandı", not just green).
