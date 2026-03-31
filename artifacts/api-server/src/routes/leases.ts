import { Router } from "express";
import { db, leasesTable, usersTable, unitsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth.js";

const router = Router();
router.use(authMiddleware);

function formatLease(l: any, tenant?: any, unit?: any) {
  return {
    id: l.id, tenantId: l.tenantId, unitId: l.unitId,
    startDate: l.startDate, endDate: l.endDate,
    monthlyRent: parseFloat(l.monthlyRent), depositAmount: parseFloat(l.depositAmount),
    status: l.status, paymentDueDay: l.paymentDueDay, notes: l.notes,
    createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : l.createdAt,
    tenant: tenant ? { id: tenant.id, email: tenant.email, name: tenant.name, role: tenant.role, phone: tenant.phone, isActive: tenant.isActive, createdAt: tenant.createdAt instanceof Date ? tenant.createdAt.toISOString() : tenant.createdAt } : null,
    unit: unit ? { id: unit.id, propertyId: unit.propertyId, unitNumber: unit.unitNumber, tier: unit.tier, monthlyRent: parseFloat(unit.monthlyRent), status: unit.status, bedrooms: unit.bedrooms, bathrooms: unit.bathrooms, size: unit.size ? parseFloat(unit.size) : null, description: unit.description, createdAt: unit.createdAt instanceof Date ? unit.createdAt.toISOString() : unit.createdAt, property: null } : null,
  };
}

router.get("/", async (req, res) => {
  try {
    const { tenantId, unitId, status } = req.query;
    let leases = await db.select().from(leasesTable);
    
    if (req.user!.role === "tenant") {
      leases = leases.filter(l => l.tenantId === req.user!.userId);
    } else {
      if (tenantId) leases = leases.filter(l => l.tenantId === parseInt(tenantId as string));
    }
    if (unitId) leases = leases.filter(l => l.unitId === parseInt(unitId as string));
    if (status) leases = leases.filter(l => l.status === status);
    
    const tenants = await db.select().from(usersTable);
    const units = await db.select().from(unitsTable);
    const tenantMap = Object.fromEntries(tenants.map(t => [t.id, t]));
    const unitMap = Object.fromEntries(units.map(u => [u.id, u]));
    
    res.json(leases.map(l => formatLease(l, tenantMap[l.tenantId], unitMap[l.unitId])));
  } catch (err) {
    req.log.error({ err }, "List leases error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", requireRole("owner", "admin"), async (req, res) => {
  const { tenantId, unitId, startDate, endDate, monthlyRent, depositAmount, status, paymentDueDay, notes } = req.body;
  if (!tenantId || !unitId || !startDate || !endDate || !monthlyRent || !depositAmount || !status || !paymentDueDay) {
    res.status(400).json({ message: "Missing required fields" });
    return;
  }
  try {
    const [lease] = await db.insert(leasesTable).values({
      tenantId, unitId, startDate, endDate,
      monthlyRent: monthlyRent.toString(), depositAmount: depositAmount.toString(),
      status, paymentDueDay, notes,
    }).returning();
    await db.update(unitsTable).set({ status: "occupied" }).where(eq(unitsTable.id, unitId));
    res.status(201).json(formatLease(lease));
  } catch (err) {
    req.log.error({ err }, "Create lease error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [lease] = await db.select().from(leasesTable).where(eq(leasesTable.id, parseInt(req.params.id)));
    if (!lease) { res.status(404).json({ message: "Not found" }); return; }
    const [tenant] = await db.select().from(usersTable).where(eq(usersTable.id, lease.tenantId));
    const [unit] = await db.select().from(unitsTable).where(eq(unitsTable.id, lease.unitId));
    res.json(formatLease(lease, tenant, unit));
  } catch (err) {
    req.log.error({ err }, "Get lease error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:id", requireRole("owner", "admin"), async (req, res) => {
  try {
    const { endDate, monthlyRent, status, paymentDueDay, notes } = req.body;
    const updates: any = { updatedAt: new Date() };
    if (endDate !== undefined) updates.endDate = endDate;
    if (monthlyRent !== undefined) updates.monthlyRent = monthlyRent.toString();
    if (status !== undefined) updates.status = status;
    if (paymentDueDay !== undefined) updates.paymentDueDay = paymentDueDay;
    if (notes !== undefined) updates.notes = notes;
    const [lease] = await db.update(leasesTable).set(updates).where(eq(leasesTable.id, parseInt(req.params.id))).returning();
    if (!lease) { res.status(404).json({ message: "Not found" }); return; }
    res.json(formatLease(lease));
  } catch (err) {
    req.log.error({ err }, "Update lease error");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
