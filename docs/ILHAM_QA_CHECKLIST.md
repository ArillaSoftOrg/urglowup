# İlham / Style Atlas — QA Checklist

Run this before merging any feature that touches posts, style tags, or the explore feed.

---

## 1. Routes to Smoke Test

| Route | Expect |
|-------|--------|
| `/explore` | Businesses tab loads by default |
| `/explore?tab=ilham` | İlham feed loads; category + style-tag filter bar visible |
| `/api/posts?take=3` | JSON `{ posts: [...], nextCursor }`, each post has `styleTags` array |
| `/api/style-tags` | JSON array of `{ id, name, slug, categoryId, postCount }` |
| `/styles` | Lists all active style tags grouped by category |
| `/styles/[slug]` | Tag detail: post count badge, businesses section, post grid, related tags |
| `/business/posts` | Business post list; create dialog opens; style tag pills render |
| `/admin/style-tags` | Admin CRUD table; create/edit/toggle-active all work |

---

## 2. Feed UX Rules

- **Layout is Twitter/X-style, two-column.** Avatar in a fixed `w-10` left gutter; all content (header, description, tags, media, actions) in the right column. Separated by `border-b` dividers — no card boxes, no shadows.
- **Post order:** header → description text → style tag pills → media → action bar.
- **Header:** business name (links to profile) + optional service name (`· Service`) + category name right-aligned. Category is plain `text-xs text-muted-foreground`, not a pill.
- **Avatar** links to business profile; sits outside the content column so media always aligns to the same left edge.
- **Media sizing:** uses the media's own aspect ratio (width/height from `PostMedia`). Portrait media does not stretch to full width with side gutters — it centers at its natural width, capped by `maxMediaH` (320 px mobile, 400 px tablet, 480 px desktop).
- **Videos autoplay muted** when 50 % of the post enters the viewport. They pause when scrolled out.
- **Mute/unmute:** toggled by the bottom-right corner button (has `stopPropagation`). Clicking the media area opens the fullscreen viewer.
- **Multi-media:** shows a `1/N` counter pill (top-right). Desktop shows left/right arrows; mobile uses touch swipe. No dots-only pagination.
- **Actions:** icon-only — Save (heart, fills rose-500 when saved), Book (calendar), Message. No label text, no `bg-muted` pill backgrounds. Likes and comments are not in MVP.
- **Infinite scroll:** spinner at bottom while loading next page; no duplicates across pages.
- **Personalization nudge:** logged-in users who have not granted personalization consent see an inline dismissible banner at the top of the İlham feed, linking to `/account/settings#privacy`.

---

## 3. Fullscreen Media Viewer

Opened by clicking any media item in the feed.

- **Fullscreen overlay:** `fixed inset-0 z-[100] bg-black flex flex-col`. Rendered via `ReactDOM.createPortal` into `document.body`.
- **Top bar:** ArrowLeft back button (top-left) + `N / M` counter (top-right, only when multiple media).
- **Back behavior:** Viewer pushes a history entry on open (`history.pushState`). ArrowLeft button calls `history.back()`. Browser back button / device back gesture also closes the viewer via `popstate` listener. Scroll position in the feed is preserved.
- **Media area:** `object-contain`, fills available height without cropping. Image uses `next/image` with `fill` when `width` + `height` are known; falls back to `<img>` otherwise.
- **Multi-media navigation:** Prev/Next arrow buttons on desktop. Horizontal swipe (>40 px) on mobile. Downward swipe (>60 px, larger than horizontal) dismisses viewer.
- **Keyboard shortcuts:** `Escape` / `Backspace` → close; `←` / `→` → prev/next; `Space` → play/pause (video only).
- **Video controls (custom, no native controls bar):**
  - Scrubber: `<input type="range">` with white inline gradient showing progress
  - Play/Pause toggle button
  - Mute/Unmute toggle button
  - Time display: `currentTime / duration` in `m:ss` format
  - Controls visible only when current media is `VIDEO`
- **Body scroll lock:** `overflow:hidden; position:fixed` applied to `<body>` while viewer is open; restored with correct `scrollY` on close.

---

## 4. Style Atlas Rules

- Style tags are **admin-controlled only** — businesses cannot create new tags.
- A post can have **at most 5 style tags**.
- A business can only tag a post with styles that either match one of its registered categories or have `categoryId: null` (universal tags). Wrong-category tags must be rejected at the server action level, not just the UI.
- `/styles/[slug]` is public SEO content (`revalidate: 3600`, `generateStaticParams` for active tags). Do not add auth guards to it.
- **No AI try-on feature yet.** Do not add, reference, or stub it.

---

## 5. Test Data Checklist

Before releasing a post-related change, verify each case renders and saves correctly:

- [ ] **Text-only post** — no media, description only
- [ ] **Image-only post** — single image, description optional
- [ ] **Video-only post** — autoplay muted, mute toggle works
- [ ] **Multi-media post** — at least 3 items; counter and swipe/arrows work
- [ ] **Tagged post** — 1–5 style tags; pills appear below description
- [ ] **Untagged post** — no style tag row rendered at all (not an empty row)
- [ ] **Inactive tag** — tag with `isActive: false` does not appear in filter bar or tag pills; `/styles/[slug]` returns 404
- [ ] **Wrong-category tag rejection** — submitting a post with a tag outside the business's categories returns a validation error; post is not created
- [ ] **Media viewer — image** — clicking an image opens fullscreen viewer; back button and browser back both close it; scroll position is restored
- [ ] **Media viewer — video** — fullscreen viewer shows custom scrubber + play/pause + mute; scrubbing updates position; controls absent for images
- [ ] **Media viewer — multi-media** — counter shows `N / M`; arrow keys and swipe navigate; downward swipe closes
- [ ] **Personalization nudge** — logged-in user without consent sees nudge; dismissing it hides it for the session; link goes to `/account/settings#privacy`
- [ ] **Personalization active** — logged-in user with consent sees preferred categories ranked first (verify by checking `userPreferences.preferredCategoryIds` in DB and matching order)

---

## 6. Verification Commands

```powershell
# Regenerate Prisma client after any schema change
npx prisma generate

# Confirm schema.prisma is syntactically valid
npx prisma validate

# TypeScript type check (no emit)
npx tsc --noEmit

# Start dev server (required after prisma generate to clear stale globalThis.prisma)
npm run dev
```

> **Note:** After running `prisma generate`, always restart the dev server. The mtime guard in `src/lib/db.ts` handles automatic staleness detection during a live session, but a clean restart is safer after schema changes.
