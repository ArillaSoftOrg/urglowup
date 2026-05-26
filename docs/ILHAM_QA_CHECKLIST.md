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

- **Layout is Twitter/X-style, not a card grid.** Posts are full-width, separated by dividers — no boxes, no shadows, no rounded card borders around the whole post.
- **Post order:** header → description text → style tag pills → media → action bar.
- **Header:** business avatar + name (both link to business profile). No redundant chevron or profile arrow.
- **Media sizing:** uses the media's own aspect ratio (width/height from `PostMedia`). Portrait media does not stretch to full width with side gutters — it centers at its natural width, capped at `max-height: 560px`.
- **Videos autoplay muted** when 50 % of the post enters the viewport. They pause when scrolled out.
- **Mute/unmute:** toggled by the button in the bottom-right corner of the video or by clicking the video itself.
- **Multi-media:** shows a `1/N` counter pill (top-right). Desktop shows left/right arrows; mobile uses touch swipe. No dots-only pagination.
- **Actions:** Save (heart), Book (calendar), Message. Likes and comments are not in MVP — do not add them.
- **Infinite scroll:** spinner at bottom while loading next page; no duplicates across pages.

---

## 3. Style Atlas Rules

- Style tags are **admin-controlled only** — businesses cannot create new tags.
- A post can have **at most 5 style tags**.
- A business can only tag a post with styles that either match one of its registered categories or have `categoryId: null` (universal tags). Wrong-category tags must be rejected at the server action level, not just the UI.
- `/styles/[slug]` is public SEO content (`revalidate: 3600`, `generateStaticParams` for active tags). Do not add auth guards to it.
- **No AI try-on feature yet.** Do not add, reference, or stub it.

---

## 4. Test Data Checklist

Before releasing a post-related change, verify each case renders and saves correctly:

- [ ] **Text-only post** — no media, description only
- [ ] **Image-only post** — single image, description optional
- [ ] **Video-only post** — autoplay muted, mute toggle works
- [ ] **Multi-media post** — at least 3 items; counter and swipe/arrows work
- [ ] **Tagged post** — 1–5 style tags; pills appear below description
- [ ] **Untagged post** — no style tag row rendered at all (not an empty row)
- [ ] **Inactive tag** — tag with `isActive: false` does not appear in filter bar or tag pills; `/styles/[slug]` returns 404
- [ ] **Wrong-category tag rejection** — submitting a post with a tag outside the business's categories returns a validation error; post is not created

---

## 5. Verification Commands

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
