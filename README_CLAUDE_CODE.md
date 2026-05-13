# UrGlowUp Web MVP

## 1. Goal

Build **UrGlowUp**, a scalable web MVP for beauty and personal care businesses.

UrGlowUp lets customers discover a business profile, view services, photos/videos, reviews, and create appointment requests. Businesses get a dashboard to manage profile data, services, media, working hours, appointments, reviews, customers, and their public booking link.

This MVP must be built as a strong foundation for a future marketplace, map discovery, mobile apps, and AI try-on features.

---

## 2. Core Product Strategy

Initial launch is **not a full marketplace**.

The first version gives each business a public profile and booking link:

```txt
/b/[slug]
```

Businesses will share this link on Instagram, TikTok, Google Business, WhatsApp, or QR codes.

Later, when enough businesses exist in a city/region, the same business profiles will be listed in marketplace pages:

```txt
/explore
/map
/category/[category]
/city/[city]
/city/[city]/[district]
```

Do not build a separate business profile system later. The public business page must be reusable inside the future marketplace.

---

## 3. Tech Stack

Use:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma
- Neon PostgreSQL
- Clerk Auth
- Cloudinary for images/videos
- Zod for validation
- React Hook Form for forms
- Vercel deployment

Long-term migration target:

- PostgreSQL-compatible database
- AWS hosting if needed
- S3/CloudFront-compatible media layer if needed

Keep provider-specific logic isolated where possible.

---

## 4. User Roles

### customer

Can:

- register/login
- view business pages
- create appointment requests
- view own appointments
- cancel own appointment requests
- favorite businesses
- write reviews after completed appointments

### business_owner

Can:

- create and manage one business profile
- manage services
- manage working hours
- upload photos/videos
- manage appointment requests
- view customer list
- view/manage reviews
- copy public booking link

### admin

Can:

- manage users
- manage businesses
- suspend businesses
- moderate media
- moderate reviews
- manage categories
- control marketplace visibility

---

## 5. Auth Rules

Use Clerk.

Enable:

- email + password
- Google login

Customer account is required before creating an appointment request.

Business registration has a separate flow.

---

## 6. Main Routes

### Public

```txt
/
 /for-business
 /login
 /register
 /b/[slug]
 /b/[slug]/book
```

### Customer Account

```txt
/account
/account/profile
/account/appointments
/account/favorites
/account/reviews
```

### Business

```txt
/business/register
/business/onboarding
/business/dashboard
/business/appointments
/business/services
/business/media
/business/profile
/business/hours
/business/reviews
/business/customers
/business/public-link
/business/settings
```

### Admin

```txt
/admin
/admin/businesses
/admin/users
/admin/appointments
/admin/media
/admin/reviews
/admin/categories
/admin/marketplace
```

### Future Placeholder Routes

Create lightweight placeholder routes only if useful:

```txt
/explore
/map
/category/[category]
/city/[city]
/city/[city]/[district]
```

---

## 7. Homepage

Homepage is customer-focused.

Sections:

- hero
- category cards
- featured/preview businesses
- how it works
- popular services
- customer CTA
- small business CTA linking to `/for-business`
- footer

Main message:

```txt
Discover beauty and personal care businesses, view real work, and request appointments with confidence.
```

---

## 8. Business Registration Flow

Business owners register from:

```txt
/for-business
/business/register
/business/onboarding
```

Onboarding steps:

1. account data
2. business basic info
3. category and location
4. public profile data
5. services
6. working hours
7. media upload
8. public link preview

Business public page can be active before admin approval, but it must not appear in marketplace results until approved/activated.

---

## 9. Business Status

Use these statuses:

```txt
draft
pending_approval
active_private
active_marketplace
suspended
rejected
```

Meaning:

- `active_private`: `/b/[slug]` works, but business is not discoverable in marketplace.
- `active_marketplace`: public page works and business is visible in future marketplace/search/map pages.

---

## 10. Public Business Page

Route:

```txt
/b/[slug]
```

Must be mobile-first.

Sections:

- cover image
- logo/profile image
- business name
- category
- rating/review summary
- open/closed state
- address
- directions button
- photo/video gallery
- services
- about
- location
- Google reviews
- UrGlowUp reviews
- appointment request CTA

Desktop layout:

- main content left
- sticky booking card right

Mobile layout:

- compact profile header
- media gallery
- services
- reviews
- bottom sticky CTA

CTA text:

```txt
Request Appointment
```

---

## 11. Appointment Model

Use appointment request flow, not instant confirmed booking.

Flow:

```txt
customer selects service
customer selects date/time
customer must login/register
customer adds optional note
appointment request is created as pending
business confirms or rejects
customer tracks status in account
```

Statuses:

```txt
pending
confirmed
rejected
cancelled_by_customer
cancelled_by_business
completed
no_show
```

First MVP does not need email, SMS, or WhatsApp automation.

Slot generation:

- generate available time slots from business working hours
- do basic conflict checks
- still require business confirmation

---

## 12. Business Dashboard

Business dashboard menu:

```txt
Dashboard
Appointments
Services
Media
Profile
Working Hours
Reviews
Customers
Public Link
Settings
```

### Dashboard should show

- today’s appointments
- pending requests
- this week’s requests
- total profile views
- total appointment requests
- quick actions:
  - add service
  - upload media
  - copy public link

---

## 13. Services

Business owners can manage services.

Service fields:

- name
- description
- category
- durationMinutes
- price
- priceType
- isActive

Price types:

```txt
fixed
starts_from
consultation_required
free_consultation
```

Do not hard-delete services used in appointments. Prefer soft delete or inactive status.

---

## 14. Working Hours

Business owners define weekly working hours.

Fields:

- dayOfWeek
- isOpen
- openTime
- closeTime
- slotIntervalMinutes
- minAdvanceHours
- maxAdvanceDays

No employee-level scheduling in this MVP.

---

## 15. Media

Use Cloudinary.

Support:

- cover image
- logo image
- portfolio images
- portfolio videos
- service images
- before/after images

Media fields:

- url
- publicId
- type
- title
- description
- relatedServiceId
- categoryId
- status
- sortOrder

Recommended limits:

- video max size: 100 MB
- video max duration: 60 sec
- video formats: mp4, mov, webm
- initial limit per business: 20 videos
- initial limit per business: 100 images

Admin can hide/remove inappropriate media.

---

## 16. Reviews

Two review sources:

1. Google reviews
2. UrGlowUp reviews

### Google Reviews

Business may provide Google Maps business link or Google Place ID.

Display Google rating/reviews only according to Google attribution and API rules.

### UrGlowUp Reviews

Only customers with completed appointments can review a business.

Review fields:

- rating
- comment
- status
- source
- appointmentId

Use label:

```txt
Verified appointment
```

Admin can hide or remove reviews.

---

## 17. Customer Account

Customer pages:

```txt
/account/profile
/account/appointments
/account/favorites
/account/reviews
```

Customer can:

- edit profile
- view appointment requests
- cancel appointments if allowed
- favorite businesses
- write reviews after completed appointments
- view own reviews

---

## 18. Admin Panel

Admin features:

- list businesses
- view business details
- update business status
- suspend business
- manage marketplace visibility
- list users
- list appointments
- moderate media
- moderate reviews
- manage categories

Admin actions should be logged.

---

## 19. Suggested Database Models

Use Prisma with PostgreSQL.

Core models:

```txt
User
CustomerProfile
BusinessOwnerProfile
Business
BusinessCategory
BusinessService
BusinessHour
BusinessMedia
Appointment
Review
ExternalReviewSource
Favorite
AdminAction
Region
```

### Business

Fields:

```txt
id
ownerId
name
slug
description
phone
whatsapp
instagramUrl
address
city
district
latitude
longitude
coverImageUrl
logoUrl
status
isMarketplaceVisible
googlePlaceId
createdAt
updatedAt
```

### Appointment

Fields:

```txt
id
businessId
customerId
serviceId
requestedDate
requestedTime
status
customerNote
businessNote
createdAt
updatedAt
```

### Review

Fields:

```txt
id
businessId
customerId
appointmentId
rating
comment
status
source
createdAt
updatedAt
```

`source` values:

```txt
urglowup
google
```

---

## 20. UI Direction

Style:

- modern
- premium
- clean
- mobile-first
- beauty/personal-care feel without being cliché

Suggested palette:

- white
- black
- soft pink
- soft purple
- cream
- neutral grays

Use shadcn/ui components where practical.

Prioritize:

- clarity
- responsive layout
- fast booking flow
- polished public business page
- clean dashboards

---

## 21. Build Phases

Build incrementally.

### Phase 1: Project Foundation

- Next.js setup
- TypeScript
- Tailwind
- shadcn/ui
- Prisma
- Neon connection
- Clerk auth
- roles
- global layout

### Phase 2: Customer Account

- customer register/login
- profile page
- appointments placeholder
- favorites placeholder

### Phase 3: Business Onboarding

- `/for-business`
- business registration
- onboarding flow
- slug creation
- business profile creation

### Phase 4: Public Business Page

- `/b/[slug]`
- profile header
- media gallery
- services
- about
- location
- reviews area
- booking CTA

### Phase 5: Services and Hours

- service CRUD
- price types
- working hours CRUD
- public page integration

### Phase 6: Appointment Requests

- customer login required
- booking form
- appointment creation
- business appointment management
- customer appointment tracking
- status updates
- cancellation

### Phase 7: Media

- Cloudinary integration
- image upload
- video upload
- media library
- public gallery
- admin moderation

### Phase 8: Reviews

- Google review display integration structure
- UrGlowUp verified reviews
- review moderation

### Phase 9: Admin

- business management
- user management
- media moderation
- review moderation
- category management
- marketplace visibility

### Phase 10: Marketplace Readiness

- region model
- category model
- `isMarketplaceVisible`
- placeholder marketplace routes if needed

---

## 22. Non-Goals For This MVP

Do not build yet:

- mobile app
- AI try-on
- full marketplace search
- full map discovery
- payment system
- subscriptions
- employee/staff scheduling
- multi-branch businesses
- SMS automation
- WhatsApp automation
- complex analytics
- loyalty system
- CRM automation
- social feed
- direct messaging

---

## 23. Implementation Rules

- Use TypeScript strictly.
- Use server-side validation with Zod.
- Keep business logic outside UI components where possible.
- Keep Cloudinary logic isolated.
- Keep auth/role checks centralized.
- Use clean route groups if helpful.
- Use reusable dashboard layout components.
- Use responsive design from the start.
- Avoid hard-coded business data.
- Use seed data for local/demo development.
- Prioritize working MVP flows over decorative features.

---

## 24. Acceptance Criteria

The MVP is acceptable when:

1. A customer can register/login.
2. A business owner can register and complete onboarding.
3. A business public page is generated at `/b/[slug]`.
4. A business can add services.
5. A business can define working hours.
6. A business can upload images and videos.
7. A logged-in customer can request an appointment.
8. A business can confirm/reject/cancel appointments.
9. A customer can track appointments.
10. Customers can favorite businesses.
11. Customers can review after completed appointments.
12. Admin can manage businesses, users, media, reviews, categories, and marketplace visibility.
13. Business profiles are ready for future marketplace listing.
14. The app is responsive and works well on mobile.

---

## 25. Environment Variables

Prepare these variables:

```env
DATABASE_URL=

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

GOOGLE_MAPS_API_KEY=
GOOGLE_PLACES_API_KEY=

NEXT_PUBLIC_APP_URL=
```

Email/SMS variables are not required in the first MVP.
