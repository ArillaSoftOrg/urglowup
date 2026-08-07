# Locale Promotion Guide

## Overview

New locales start as **non-production** (routable but not indexed) until a native speaker reviews the dictionary and approves it for promotion.

## Current Status

| Locale | Status | Path | Notes |
|--------|--------|------|-------|
| `tr` | ✅ Production | `/` | Turkish (root, canonical) |
| `en` | ✅ Production | `/en` | English |
| `de` | ✅ Production | `/de` | German |
| `ru` | ✅ Production | `/ru` | Russian (promoted 2026-06-13) |
| `bg` | ✅ Production | `/bg` | Bulgarian (promoted 2026-06-13) |
| `fa` | ⏳ Review-needed | `/fa` | Persian — **awaiting native review** |
| `pl` | ⏳ Review-needed | `/pl` | Polish — **awaiting native review** |
| `ar` | ⏳ Review-needed | `/ar` | Arabic (RTL) — **awaiting native review** |
| `fr` | ⏳ Review-needed | `/fr` | French — **awaiting native review** |
| `nl` | ⏳ Review-needed | `/nl` | Dutch — **awaiting native review** |
| `ro` | ⏳ Review-needed | `/ro` | Romanian — **awaiting native review** |

## Promotion Checklist

For each locale awaiting review:

### 1. **Dictionary Review**
- [ ] Native speaker reviews `src/dictionaries/{locale}.ts`
- [ ] Verify translation accuracy and tone consistency
- [ ] Check special characters, RTL markers (for ar/fa), encoding
- [ ] Validate that all 5 sections match shape:
  - `nav` (10 keys: explore, forBusiness, account, businessPanel, adminPanel, signIn, signUp, listBusiness, openMenu)
  - `home` (13 keys: badge, heroTitle, heroBrand, heroDescription, categoriesLabel, categoriesTitle, categoriesSeeAll, featuredLabel, featuredTitle, featuredDescription, featuredSeeAll, ctaExplore, ctaForBusiness)
  - `explore` (7 keys: searchTitle, searchDescription, regionTitle, categoriesTitle, allCategories, professionalCount, emptyMessage)
  - `deals` (2 keys: title, description)
  - `cookieConsent` (13 keys: bannerTitle, bannerDescription, acceptAll, rejectNonEssential, managePreferences, savePreferences, necessaryTitle, necessaryDesc, preferenceTitle, preferenceDesc, analyticsTitle, analyticsDesc, marketingTitle, marketingDesc, alwaysActive, enabled, disabled, policyUpdatedTitle, policyUpdatedDesc, cookieSettings)

### 2. **RTL Verification** (for `ar` and `fa` only)
- [ ] Test `/ar/explore` and `/fa/explore` routes
- [ ] Verify `<html dir="rtl">` attribute is set
- [ ] Visually verify navbar, dropdown, and text alignment
- [ ] Check that arrows in dictionary strings are appropriate for RTL (`→` vs `←`)
- [ ] Test on mobile viewport

### 3. **QA Sign-off**
- [ ] Product review: does the locale appear correct to a native user?
- [ ] No TypeScript errors: `npx tsc --noEmit` passes
- [ ] Dictionary parity: `npm run check:dictionaries` passes

### 4. **Promotion**
Once approved, run:

```bash
# 1. Update status comment in dictionary file
sed -i 's/review-needed.*production/g' src/dictionaries/{locale}.ts

# 2. Add to PRODUCTION_LOCALES
# Edit src/lib/i18n-config.ts line 8:
export const PRODUCTION_LOCALES = ['en', 'de', 'ru', 'bg', '{locale}'] as const

# 3. Build and verify
npm run build
npm run test:e2e

# 4. Commit
git add src/dictionaries/{locale}.ts src/lib/i18n-config.ts
git commit -m "Promote {locale} to PRODUCTION_LOCALES after native review"

# 5. Push
git push origin main
```

## What Changes After Promotion

- ✅ Locale appears in sitemap (`/sitemap.xml`)
- ✅ Hreflang alternates generated (SEO)
- ✅ Pages indexed by search engines (robots: index: true)
- ✅ OpenGraph metadata uses correct OG locale code
- No change needed to routes (already routable before promotion)

## Review Timeline

- `ru`, `bg` — promoted 2026-06-13 (shipped in commit 38e8507)
- `fa` — assign to native Persian speaker
- `pl` — assign to native Polish speaker
- `ar` — assign to native Arabic speaker (flag RTL QA)
- `fr` — assign to native French speaker
- `nl` — assign to native Dutch speaker
- `ro` — assign to native Romanian speaker

## Contact

Assign reviews to respective native speakers. Estimated review time: 30-60 minutes per locale.
