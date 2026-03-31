import { Router } from "express";
import { db, maintenanceRequestsTable, usersTable, unitsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();
router.use(authMiddleware);

function formatMR(m: any, tenant?: any, vendor?: any, unit?: any) {
  return {
    id: m.id, tenantId: m.tenantId, unitId: m.unitId, vendorId: m.vendorId,
    title: m.title, description: m.description, priority: m.priority, status: m.status,
    resolvedAt: m.resolvedAt instanceof Date ? m.resolvedAt.toISOString() : m.resolvedAt,
    notes: m.notes,
    createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
    tenant: tenant ? { id: tenant.id, email: tenant.email, name: tenant.name, role: tenant.role, phone: tenant.phone, isActive: tenant.isActive, createdAt: tenant.createdAt instanceof Date ? tenant.createdAt.toISOString() : tenant.createdAt } : null,
    vendor: vendor ? { id: vendor.id, email: vendor.email, name: vendor.name, role: vendor.role, phone: vendor.phone, isActive: vendor.isActive, createdAt: vendor.createdAt instanceof Date ? vendor.createdAt.toISOString() : vendor.createdAt } : null,
    unit: unit ? { id: unit.id, propertyId: unit.propertyId, unitNumber: unit.unitNumber, tier: unit.tier, monthlyRent: parseFloat(unit.monthlyRent), status: unit.status, bedrooms: unit.bedrooms, bathrooms: unit.bathrooms, size: unit.size ? parseFloat(unit.size) : null, description: unit.description, createdAt: unit.createdAt instanceof Date ? unit.createdAt.toISOString() : unit.createdAt, property: null } : null,
  };
}

router.get("/", async (req, res) => {
  try {
    const { tenantId, unitId, vendorId, status, priority } = req.query;
    let reqs = await db.select().from(maintenanceRequestsTable);
    
    if (req.user!.role === "tenant") reqs = reqs.filter(r => r.tenantId === req.user!.userId);
    else if (req.user!.role === "vendor") reqs = reqs.filter(r => r.vendorId === req.user!.userId);
    else if (tenantId) reqs = reqs.filter(r => r.tenantId === parseInt(tenantId as string));
    
    if (unitId) reqs = reqs.filter(r => r.unitId === parseInt(unitId as string));
    if (vendorId) reqs = reqs.filter(r => r.vendorId === parseInt(vendorId as string));
    if (status) reqs = reqs.filter(r => r.status === status);
    if (priority) reqs = reqs.filter(r => r.priority === priority);
    
    const users = await db.select().from(usersTable);
    const units = await db.select().from(unitsTable);
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    const unitMap = Object.fromEntries(units.map(u => [u.id, u]));
    
    res.json(reqs.map(r => formatMR(r, userMap[r.tenantId], r.vendorId ? userMap[r.vendorId] : undefined, unitMap[r.unitId])));
  } catch (err) {
    req.log.error({ err }, "List maintenance error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  const { tenantId, unitId, title, description, priority } = req.body;
  if (!tenantId || !unitId || !title || !description || !priority) {
    res.status(400).json({ message: "Missing required fields" });
    return;
  }
  try {
    const [mr] = await db.insert(maintenanceRequestsTable).values({ tenantId, unitId, title, description, priority }).returning();
    res.status(201).json(formatMR(mr));
  } catch (err) {
    req.log.error({ err }, "Create maintenance request error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [mr] = await db.select().from(maintenanceRequestsTable).where(eq(maintenanceRequestsTable.id, parseInt(req.params.id)));
    if (!mr) { res.status(404).json({ message: "Not found" }); return; }
    const [tenant] = await db.select().from(usersTable).where(eq(usersTable.id, mr.tenantId));
    const [unit] = await db.select().from(unitsTable).where(eq(unitsTable.id, mr.unitId));
    const vendor = mr.vendorId ? (await db.select().from(usersTable).where(eq(usersTable.id, mr.vendorId)))[0] : undefined;
    res.json(formatMR(mr, tenant, vendor, unit));
  } catch (err) {
    req.log.error({ err }, "Get maintenance request error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { vendorId, status, notes, resolvedAt } = req.body;
    const updates: any = { updatedAt: new Date() };
    if (vendorId !== undefined) updates.vendorId = vendorId;
    if (status !== undefined) {
      updates.status = status;
      if (status === "resolved") updates.resolvedAt = resolvedAt ? new Date(resolvedAt) : new Date();
    }
    if (notes !== undefined) updates.notes = notes;
    const [mr] = await db.update(maintenanceRequestsTable).set(updates).where(eq(maintenanceRequestsTable.id, parseInt(req.params.id))).returning();
    if (!mr) { res.status(404).json({ message: "Not found" }); return; }
    res.json(formatMR(mr));
  } catch (err) {
    req.log.error({ err }, "Update maintenance request error");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
