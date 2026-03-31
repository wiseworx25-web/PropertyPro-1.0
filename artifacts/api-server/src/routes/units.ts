import { Router } from "express";
import { db, unitsTable, propertiesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth.js";

const router = Router();
router.use(authMiddleware);

function formatUnit(u: any, property?: any) {
  return {
    id: u.id, propertyId: u.propertyId, unitNumber: u.unitNumber,
    tier: u.tier, monthlyRent: parseFloat(u.monthlyRent),
    status: u.status, bedrooms: u.bedrooms, bathrooms: u.bathrooms,
    size: u.size ? parseFloat(u.size) : null, description: u.description,
    createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
    property: property ? {
      id: property.id, name: property.name, address: property.address,
      city: property.city, province: property.province,
      postalCode: property.postalCode, ownerId: property.ownerId,
      totalUnits: 0, occupiedUnits: 0,
      createdAt: property.createdAt instanceof Date ? property.createdAt.toISOString() : property.createdAt,
    } : null,
  };
}

router.get("/", async (req, res) => {
  try {
    const { propertyId, status } = req.query;
    let units = await db.select().from(unitsTable);
    if (propertyId) units = units.filter(u => u.propertyId === parseInt(propertyId as string));
    if (status) units = units.filter(u => u.status === status);
    const props = await db.select().from(propertiesTable);
    const propMap = Object.fromEntries(props.map(p => [p.id, p]));
    res.json(units.map(u => formatUnit(u, propMap[u.propertyId])));
  } catch (err) {
    req.log.error({ err }, "List units error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", requireRole("owner", "admin"), async (req, res) => {
  const { propertyId, unitNumber, tier, monthlyRent, status, bedrooms, bathrooms, size, description } = req.body;
  if (!propertyId || !unitNumber || !tier || !monthlyRent || !status) {
    res.status(400).json({ message: "Missing required fields" });
    return;
  }
  try {
    const [unit] = await db.insert(unitsTable).values({ propertyId, unitNumber, tier, monthlyRent: monthlyRent.toString(), status, bedrooms, bathrooms, size: size?.toString(), description }).returning();
    res.status(201).json(formatUnit(unit));
  } catch (err) {
    req.log.error({ err }, "Create unit error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [unit] = await db.select().from(unitsTable).where(eq(unitsTable.id, parseInt(req.params.id)));
    if (!unit) { res.status(404).json({ message: "Not found" }); return; }
    const [property] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, unit.propertyId));
    res.json(formatUnit(unit, property));
  } catch (err) {
    req.log.error({ err }, "Get unit error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:id", requireRole("owner", "admin"), async (req, res) => {
  try {
    const { propertyId, unitNumber, tier, monthlyRent, status, bedrooms, bathrooms, size, description } = req.body;
    const updates: any = { updatedAt: new Date() };
    if (propertyId !== undefined) updates.propertyId = propertyId;
    if (unitNumber !== undefined) updates.unitNumber = unitNumber;
    if (tier !== undefined) updates.tier = tier;
    if (monthlyRent !== undefined) updates.monthlyRent = monthlyRent.toString();
    if (status !== undefined) updates.status = status;
    if (bedrooms !== undefined) updates.bedrooms = bedrooms;
    if (bathrooms !== undefined) updates.bathrooms = bathrooms;
    if (size !== undefined) updates.size = size?.toString();
    if (description !== undefined) updates.description = description;
    const [unit] = await db.update(unitsTable).set(updates).where(eq(unitsTable.id, parseInt(req.params.id))).returning();
    if (!unit) { res.status(404).json({ message: "Not found" }); return; }
    res.json(formatUnit(unit));
  } catch (err) {
    req.log.error({ err }, "Update unit error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", requireRole("owner", "admin"), async (req, res) => {
  try {
    await db.delete(unitsTable).where(eq(unitsTable.id, parseInt(req.params.id)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete unit error");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
