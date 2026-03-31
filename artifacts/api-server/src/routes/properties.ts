import { Router } from "express";
import { db, propertiesTable, unitsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth.js";

const router = Router();
router.use(authMiddleware);

function formatProperty(p: any, totalUnits = 0, occupiedUnits = 0) {
  return {
    id: p.id, name: p.name, address: p.address, city: p.city,
    province: p.province, postalCode: p.postalCode, ownerId: p.ownerId,
    totalUnits, occupiedUnits,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
  };
}

router.get("/", async (req, res) => {
  try {
    const props = await db.select().from(propertiesTable);
    const units = await db.select().from(unitsTable);
    const result = props.map(p => {
      const pUnits = units.filter(u => u.propertyId === p.id);
      return formatProperty(p, pUnits.length, pUnits.filter(u => u.status === "occupied").length);
    });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "List properties error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", requireRole("owner", "admin"), async (req, res) => {
  const { name, address, city, province, postalCode, ownerId } = req.body;
  if (!name || !address || !city || !province || !ownerId) {
    res.status(400).json({ message: "Missing required fields" });
    return;
  }
  try {
    const [prop] = await db.insert(propertiesTable).values({ name, address, city, province, postalCode, ownerId }).returning();
    res.status(201).json(formatProperty(prop));
  } catch (err) {
    req.log.error({ err }, "Create property error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [prop] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, parseInt(req.params.id)));
    if (!prop) { res.status(404).json({ message: "Not found" }); return; }
    const units = await db.select().from(unitsTable).where(eq(unitsTable.propertyId, prop.id));
    res.json(formatProperty(prop, units.length, units.filter(u => u.status === "occupied").length));
  } catch (err) {
    req.log.error({ err }, "Get property error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:id", requireRole("owner", "admin"), async (req, res) => {
  try {
    const { name, address, city, province, postalCode, ownerId } = req.body;
    const [prop] = await db.update(propertiesTable).set({ name, address, city, province, postalCode, ownerId, updatedAt: new Date() }).where(eq(propertiesTable.id, parseInt(req.params.id))).returning();
    if (!prop) { res.status(404).json({ message: "Not found" }); return; }
    res.json(formatProperty(prop));
  } catch (err) {
    req.log.error({ err }, "Update property error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", requireRole("owner", "admin"), async (req, res) => {
  try {
    await db.delete(propertiesTable).where(eq(propertiesTable.id, parseInt(req.params.id)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete property error");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
