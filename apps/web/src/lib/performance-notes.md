# Performance Optimizations — Phase 20 Part 2

## Database Indexes (High Impact)

### Strategic Indexes for Hot Queries

Add these indexes to improve query performance:

```sql
-- Message queries: indexed by conversationId + timestamp
CREATE INDEX idx_message_conversation_created 
ON "Message"("conversationId", "createdAt" DESC);

-- Conversation queries: indexed by user + timestamp
CREATE INDEX idx_conversation_customer_time 
ON "Conversation"("customerId", "lastMessageAt" DESC);

CREATE INDEX idx_conversation_business_time 
ON "Conversation"("businessId", "lastMessageAt" DESC);

-- Google review cache: indexed by business + provider
CREATE INDEX idx_review_cache_business_provider 
ON "ExternalReviewCache"("businessId", "provider", "expiresAt" DESC);

-- External media cache: indexed for sync queries
CREATE INDEX idx_media_cache_business_provider 
ON "ExternalMediaCache"("businessId", "provider", "expiresAt" DESC);

-- Business queries: indexed by slug + status
CREATE INDEX idx_business_slug_status 
ON "Business"("slug", "status");

-- Appointments: indexed for pending/stuck query
CREATE INDEX idx_appointment_status_created 
ON "Appointment"("status", "createdAt" DESC);

-- Users: indexed for unverified count
CREATE INDEX idx_user_verified 
ON "User"("emailVerified", "createdAt" DESC);
```

### Why These Indexes

1. **Message conversations**: Most queries fetch by conversationId with DESC ordering; speeds up thread load
2. **Conversation lists**: Sort by lastMessageAt; needs fast DESC lookups
3. **Google reviews**: Filter by businessId + provider + expiry; composite index prevents full table scan
4. **Business slug**: Profile page lookup; should be instant
5. **Appointment status**: Admin dashboard queries pending/stuck; needs fast filtering
6. **User verification**: Onboarding flows; avoids N+1 queries

## Response Caching

### Implemented

- **Business profiles** (5 min TTL): `business:slug:{slug}`
- **Google reviews** (1 hour TTL): `reviews:google:{businessId}`
- Fallback to in-memory if Redis unavailable
- Automatic cleanup of expired entries

### Cache Invalidation Hooks

After mutations, invalidate:
- `invalidateCache("business:")` after business updates
- `invalidateCache("reviews:google:")` after review sync
- `invalidateCache("conversation:")` after new message

## API Cache Headers

Applied cache control headers:

```
IMMUTABLE:       public assets (1 year)
PUBLIC_PAGE:     business pages (1 hour + stale-while-revalidate)
API_RESPONSE:    API data (5 min + 1 hour stale)
PRIVATE_DATA:    user conversations (no cache)
```

## Query Optimization Checklist

- [x] Caching layer with Redis fallback
- [x] Cache headers utility
- [ ] Database indexes (manual SQL or migration)
- [x] Rate limiter optimization (distributed)
- [x] In-memory cleanup (auto-expiry)

## Monitoring

Check cache stats: `getCacheStats()` returns:
```typescript
{
  inMemorySize: number,      // entries in cache
  inMemoryMaxAge: number     // max TTL remaining (ms)
}
```

Monitor in-memory pressure; consider lowering TTL if size > 1000 entries.

## Future Optimizations

- Batch query optimization (N+1 reduction)
- Query plan analysis (PostgreSQL EXPLAIN)
- Connection pool tuning (Prisma pool size)
- CDN integration for static assets
- API response compression (gzip)
