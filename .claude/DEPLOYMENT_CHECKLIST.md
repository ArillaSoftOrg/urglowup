# Deployment Checklist

## Phase 10: User Suspension Feature ✅ ACCEPTED

**Status:** Build clean, TypeScript clean, smoke test verified (code inspection), documentation complete.

### 🚀 MANDATORY Staging Runtime Checks (Before Production Deploy)

These 6 checks must pass on staging with real test data. Do not skip.

1. **[ ] Suspend test customer from /admin/users/:id**
   - Fill reason: "Staging test"
   - Duration: 7 days
   - Click submit

2. **[ ] Verify suspended state in UI**
   - Badge appears: "SUSPENDED (7d remaining)" in red
   - Dashboard "Suspended Users" count increases
   - User moves to SUSPENDED lifecycle tab

3. **[ ] Verify enforcement blocks actions**
   - Login as suspended customer, try booking → blocked "Hesabınız askıya alınmıştır..."
   - Try review creation → blocked "Your account is suspended..."

4. **[ ] Unsuspend and verify access restored**
   - Click "Unsuspend User"
   - Badge disappears
   - Customer can book/review without errors
   - Dashboard count decrements

5. **[ ] Verify AdminAction audit log**
   - User detail page shows AdminAction entries
   - `user.suspend` with reason + duration
   - `user.unsuspend` entry exists
   - Admin name, email, timestamp recorded

6. **[ ] Last-admin guard with 2 test admins**
   - Create 2 admin accounts
   - Attempt to suspend one while other active → allowed
   - Verify message: "Cannot suspend the last active admin user." if blocking

---

## Phase 10: Detailed Implementation Record

### Staging Environment Checks (Reference)

#### Last-Active-Admin Protection
- [ ] Create 2 admins in staging; verify Alice cannot suspend Bob when only 2 active
- [ ] Suspend Bob temporarily (1 day); verify Alice still cannot suspend Bob (temp suspension counts as active)
- [ ] Create 3 admins; verify Alice can suspend Bob (1 other admin remains)
- [ ] Verify error message: "Cannot suspend the last active admin user."
- [ ] Confirm single-admin scenario: attempting to suspend self gives "Cannot suspend yourself." (not last-admin error)

#### Suspended User Enforcement
- [ ] Suspend a customer in staging; verify they cannot request appointments
  - Navigate to business booking page → attempt to book → message: "Hesabınız askıya alınmıştır. Destek ile iletişime geçin."
- [ ] Verify suspended customer cannot create reviews
  - Attempt to create review → message: "Your account is suspended. Please contact support."
- [ ] Verify suspended business owner cannot create posts
  - Login as suspended owner → attempt new post → message: "Hesabınız askıya alınmıştır..."
- [ ] Verify suspended user sees SUSPENDED lifecycle segment in /admin/users

#### Expired Suspension Handling
- [ ] Create temporary suspension (1 day); advance time in staging (or manually set suspendedUntil to past)
- [ ] Verify expired user:
  - Can book appointments (enforcement skips)
  - Lifecycle reverts to appropriate segment (not SUSPENDED)
  - Excluded from dashboard "Suspended Users" count
  - Not visible in /admin/users?lifecycle=SUSPENDED tab
- [ ] Verify adminOverride: manually query user where suspendedUntil < now, confirm isSuspended() returns false

#### AdminAction Logging
- [ ] Suspend a user via /admin/users/[id] detail page
  - Verify AdminAction log entry appears with action: "user.suspend"
  - Confirm message includes: reason, duration (e.g., "Suspended for 7 days, reason: ...")
- [ ] Unsuspend the same user
  - Verify new AdminAction log entry with action: "user.unsuspend"
- [ ] Verify admin who performed actions is correctly recorded (firstName, lastName, email in AdminAction.admin)

### Production Deployment

- [ ] Confirm Prisma migration `20260528201456_add_user_suspension_fields` ran successfully
- [ ] Verify schema fields exist: `User.suspendedAt`, `User.suspendedUntil`, `User.suspensionReason`
- [ ] Run test: attempt to suspend last active admin in production → confirm rejection
- [ ] Monitor first 24h: check AdminAction logs for suspension events
- [ ] Performance: verify suspension count query in dashboard doesn't timeout (should use indexed fields)

### Rollback Plan

- If last-admin check fails: revert `src/app/(admin)/admin/actions.ts` lines 629–645
- If enforcement breaks booking: revert `isSuspended()` call in `src/app/(public)/b/[slug]/book/actions.ts`
- If expired suspensions cause confusion: clear `suspendedUntil` cache in Redis (if applicable) or redeploy

---

## Next Phase: Phase 11 — Appointment Lifecycle & Cancellation

(To be planned after Phase 10 acceptance)
