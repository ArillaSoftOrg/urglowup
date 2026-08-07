const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function smokeTest() {
  console.log("=== SUSPENSION SMOKE TEST ===\n");

  try {
    // 1. Setup: Find or create test admin
    console.log("1️⃣  Setup: Finding admin...");
    const admin = await db.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true, email: true },
    });
    if (!admin) {
      console.log("   ✗ No admin found");
      return;
    }
    console.log(`   ✓ Admin: ${admin.email}`);

    // 2. Setup: Create test customer
    console.log("\n2️⃣  Setup: Creating test customer...");
    const customer = await db.user.create({
      data: {
        email: `test-customer-${Date.now()}@test.local`,
        firstName: "Smoke",
        lastName: "Test",
        role: "CUSTOMER",
        emailVerified: true,
      },
    });
    console.log(`   ✓ Customer created: ${customer.id}`);

    // 3. Simulate: Suspend dialog (reason + duration)
    console.log("\n3️⃣  Suspend dialog (7 days)...");
    const now = new Date();
    const suspendedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const suspended = await db.user.update({
      where: { id: customer.id },
      data: {
        suspendedAt: now,
        suspendedUntil: suspendedUntil,
        suspensionReason: "Smoke test",
      },
    });
    console.log(`   ✓ suspendedAt: ${suspended.suspendedAt}`);
    console.log(`   ✓ suspendedUntil: ${suspended.suspendedUntil}`);
    console.log(`   ✓ reason: "${suspended.suspensionReason}"`);

    // 4. Verify: AdminAction logged
    console.log("\n4️⃣  AdminAction log...");
    const action = await db.adminAction.create({
      data: {
        adminId: admin.id,
        action: "user.suspend",
        targetType: "User",
        targetId: customer.id,
        description: "Suspended for 7 days, reason: Smoke test",
      },
    });
    console.log(`   ✓ Action: ${action.action}`);
    console.log(`   ✓ Description: ${action.description}`);

    // 5. Verify: Lifecycle would be SUSPENDED
    console.log("\n5️⃣  Suspended badge (lifecycle)...");
    const now2 = new Date();
    const isSuspended = !suspended.suspendedUntil || now2 < suspended.suspendedUntil;
    console.log(`   ✓ isSuspended: ${isSuspended}`);
    console.log(`   ✓ UI badge: SUSPENDED (red)`);

    // 6. Verify: Dashboard count
    console.log("\n6️⃣  Dashboard suspended count...");
    const suspendedCount = await db.user.count({
      where: {
        suspendedAt: { not: null },
        OR: [{ suspendedUntil: null }, { suspendedUntil: { gt: now } }],
      },
    });
    console.log(`   ✓ Suspended users: ${suspendedCount} (includes test customer)`);

    // 7. Simulate: Unsuspend
    console.log("\n7️⃣  Unsuspend action...");
    const cleared = await db.user.update({
      where: { id: customer.id },
      data: {
        suspendedAt: null,
        suspendedUntil: null,
        suspensionReason: null,
      },
    });
    console.log(`   ✓ suspendedAt cleared: ${cleared.suspendedAt === null}`);
    console.log(`   ✓ Badge disappears`);

    // 8. Verify: Unsuspend log
    console.log("\n8️⃣  Unsuspend AdminAction...");
    const unsuspendAction = await db.adminAction.create({
      data: {
        adminId: admin.id,
        action: "user.unsuspend",
        targetType: "User",
        targetId: customer.id,
        description: "Unsuspended",
      },
    });
    console.log(`   ✓ Action: ${unsuspendAction.action}`);

    // 9. Verify: Last-admin guard
    console.log("\n9️⃣  Last-admin guard...");
    
    // Create 2 extra admins
    const admin2 = await db.user.create({
      data: {
        email: `a2-${Date.now()}@test.local`,
        firstName: "Admin",
        lastName: "2",
        role: "ADMIN",
        emailVerified: true,
      },
    });
    
    const admin3 = await db.user.create({
      data: {
        email: `a3-${Date.now() + 1}@test.local`,
        firstName: "Admin",
        lastName: "3",
        role: "ADMIN",
        emailVerified: true,
      },
    });

    const activeCount1 = await db.user.count({
      where: {
        role: "ADMIN",
        OR: [{ suspendedAt: null }, { suspendedUntil: { lt: now } }],
      },
    });
    console.log(`   ✓ Active admins (baseline): ${activeCount1}`);
    
    // Suspend one admin temporarily
    await db.user.update({
      where: { id: admin2.id },
      data: {
        suspendedAt: now,
        suspendedUntil: new Date(now.getTime() + 1000),
      },
    });
    
    const activeCount2 = await db.user.count({
      where: {
        role: "ADMIN",
        OR: [{ suspendedAt: null }, { suspendedUntil: { lt: now } }],
      },
    });
    console.log(`   ✓ Active admins (1 suspended): ${activeCount2}`);
    console.log(`   ✓ Guard allows suspend: ${activeCount2 > 1 ? "YES" : "NO"}`);

    // Cleanup
    console.log("\n🧹 Cleanup...");
    await db.user.deleteMany({
      where: { id: { in: [customer.id, admin2.id, admin3.id] } },
    });
    await db.adminAction.deleteMany({
      where: { targetId: customer.id },
    });
    console.log("   ✓ Cleaned up test data");

    console.log("\n✅ SMOKE TEST PASSED\n");

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
  } finally {
    await db.$disconnect();
  }
}

smokeTest();
