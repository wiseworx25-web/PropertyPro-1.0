import bcrypt from "bcryptjs";
import { db, usersTable, propertiesTable, unitsTable, leasesTable, transactionsTable, maintenanceRequestsTable, notificationsTable } from "@workspace/db";

async function seed() {
  console.log("Seeding database...");

  const hash = (pw: string) => bcrypt.hash(pw, 10);

  const [owner] = await db.insert(usersTable).values({
    email: "owner@propertypro.com",
    passwordHash: await hash("owner123"),
    name: "John Owner",
    role: "owner",
    phone: "+27 11 000 0001",
    isActive: true,
  }).onConflictDoNothing().returning();

  const [admin] = await db.insert(usersTable).values({
    email: "admin@propertypro.com",
    passwordHash: await hash("admin123"),
    name: "Sarah Admin",
    role: "admin",
    phone: "+27 11 000 0002",
    isActive: true,
  }).onConflictDoNothing().returning();

  const [tenant1] = await db.insert(usersTable).values({
    email: "tenant@propertypro.com",
    passwordHash: await hash("tenant123"),
    name: "Mike Tenant",
    role: "tenant",
    phone: "+27 11 000 0003",
    isActive: true,
  }).onConflictDoNothing().returning();

  const [tenant2] = await db.insert(usersTable).values({
    email: "tenant2@propertypro.com",
    passwordHash: await hash("tenant123"),
    name: "Lisa Tenant",
    role: "tenant",
    phone: "+27 11 000 0004",
    isActive: true,
  }).onConflictDoNothing().returning();

  const [vendor] = await db.insert(usersTable).values({
    email: "vendor@propertypro.com",
    passwordHash: await hash("vendor123"),
    name: "Bob Vendor",
    role: "vendor",
    phone: "+27 11 000 0005",
    isActive: true,
  }).onConflictDoNothing().returning();

  if (!owner || !admin || !tenant1 || !tenant2 || !vendor) {
    console.log("Users already seeded, skipping.");
    return;
  }

  const [prop1] = await db.insert(propertiesTable).values({
    name: "Sunset Apartments",
    address: "123 Main Street",
    city: "Johannesburg",
    province: "Gauteng",
    postalCode: "2000",
    ownerId: owner.id,
  }).returning();

  const [prop2] = await db.insert(propertiesTable).values({
    name: "Garden View Flats",
    address: "456 Oak Avenue",
    city: "Cape Town",
    province: "Western Cape",
    postalCode: "8001",
    ownerId: owner.id,
  }).returning();

  const [unit1] = await db.insert(unitsTable).values({
    propertyId: prop1.id,
    unitNumber: "101",
    tier: "entry_level",
    monthlyRent: "1600",
    status: "occupied",
    bedrooms: 1,
    bathrooms: 1,
    size: "40",
    description: "Cozy entry level studio apartment",
  }).returning();

  const [unit2] = await db.insert(unitsTable).values({
    propertyId: prop1.id,
    unitNumber: "102",
    tier: "small",
    monthlyRent: "2400",
    status: "occupied",
    bedrooms: 2,
    bathrooms: 1,
    size: "60",
    description: "Comfortable 2-bedroom unit",
  }).returning();

  const [unit3] = await db.insert(unitsTable).values({
    propertyId: prop1.id,
    unitNumber: "201",
    tier: "medium",
    monthlyRent: "3800",
    status: "vacant",
    bedrooms: 3,
    bathrooms: 2,
    size: "90",
    description: "Spacious 3-bedroom apartment",
  }).returning();

  const [unit4] = await db.insert(unitsTable).values({
    propertyId: prop2.id,
    unitNumber: "A1",
    tier: "small",
    monthlyRent: "2400",
    status: "vacant",
    bedrooms: 2,
    bathrooms: 1,
    size: "55",
    description: "Garden view unit",
  }).returning();

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 6);

  const [lease1] = await db.insert(leasesTable).values({
    tenantId: tenant1.id,
    unitId: unit1.id,
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    monthlyRent: "1600",
    depositAmount: "3200",
    status: "active",
    paymentDueDay: 1,
    notes: "Good tenant",
  }).returning();

  const [lease2] = await db.insert(leasesTable).values({
    tenantId: tenant2.id,
    unitId: unit2.id,
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    monthlyRent: "2400",
    depositAmount: "4800",
    status: "active",
    paymentDueDay: 5,
    notes: "",
  }).returning();

  for (let i = 0; i < 6; i++) {
    const paidAt = new Date();
    paidAt.setMonth(paidAt.getMonth() - i);
    paidAt.setDate(1);
    await db.insert(transactionsTable).values({
      leaseId: lease1.id,
      tenantId: tenant1.id,
      amount: "1600",
      type: "rent",
      status: "completed",
      reference: `REF-T1-${i + 1}`,
      description: `Rent payment month -${i}`,
      paymentMethod: "paystack",
      paidAt,
    });
  }

  for (let i = 0; i < 4; i++) {
    const paidAt = new Date();
    paidAt.setMonth(paidAt.getMonth() - i);
    paidAt.setDate(5);
    await db.insert(transactionsTable).values({
      leaseId: lease2.id,
      tenantId: tenant2.id,
      amount: "2400",
      type: "rent",
      status: "completed",
      reference: `REF-T2-${i + 1}`,
      description: `Rent payment month -${i}`,
      paymentMethod: "paystack",
      paidAt,
    });
  }

  await db.insert(transactionsTable).values({
    tenantId: tenant1.id,
    amount: "150",
    type: "expense",
    status: "completed",
    description: "Plumbing repair unit 101",
    paidAt: new Date(),
  });

  await db.insert(maintenanceRequestsTable).values({
    tenantId: tenant1.id,
    unitId: unit1.id,
    title: "Leaking tap in kitchen",
    description: "The kitchen tap has been dripping water for the past week.",
    priority: "medium",
    status: "pending",
  });

  await db.insert(maintenanceRequestsTable).values({
    tenantId: tenant1.id,
    unitId: unit1.id,
    title: "Broken window latch",
    description: "The bedroom window latch is broken and won't lock.",
    priority: "high",
    status: "in_progress",
    vendorId: vendor.id,
    notes: "Vendor scheduled for next week",
  });

  await db.insert(maintenanceRequestsTable).values({
    tenantId: tenant2.id,
    unitId: unit2.id,
    title: "Geyser not working",
    description: "No hot water since Monday.",
    priority: "urgent",
    status: "resolved",
    vendorId: vendor.id,
    notes: "Replaced geyser element",
    resolvedAt: new Date(),
  });

  await db.insert(notificationsTable).values({
    userId: tenant1.id,
    title: "Rent Due Soon",
    message: "Your rent of R1,600 is due on the 1st of next month.",
    type: "warning",
    isRead: false,
  });

  await db.insert(notificationsTable).values({
    userId: tenant1.id,
    title: "Maintenance Update",
    message: "Your maintenance request 'Broken window latch' has been assigned to a vendor.",
    type: "info",
    isRead: false,
  });

  await db.insert(notificationsTable).values({
    userId: admin.id,
    title: "New Maintenance Request",
    message: "Tenant Mike Tenant submitted a new maintenance request for Unit 101.",
    type: "info",
    isRead: false,
  });

  console.log("✅ Database seeded successfully!");
  console.log("Demo accounts:");
  console.log("  owner@propertypro.com / owner123");
  console.log("  admin@propertypro.com / admin123");
  console.log("  tenant@propertypro.com / tenant123");
  console.log("  tenant2@propertypro.com / tenant123");
  console.log("  vendor@propertypro.com / vendor123");
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
