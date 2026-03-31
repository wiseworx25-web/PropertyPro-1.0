import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/", requireRole("owner", "admin"), async (req, res) => {
  try {
    const { role } = req.query;
    let query = db.select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
      phone: usersTable.phone,
      isActive: usersTable.isActive,
      createdAt: usersTable.createdAt,
    }).from(usersTable);
    
    const users = await query;
    const filtered = role ? users.filter(u => u.role === role) : users;
    res.json(filtered.map(u => ({ ...u, createdAt: u.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "List users error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", requireRole("owner", "admin"), async (req, res) => {
  const { email, password, name, role, phone } = req.body;
  if (!email || !password || !name || !role) {
    res.status(400).json({ message: "Missing required fields" });
    return;
  }
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({ email, passwordHash, name, role, phone }).returning();
    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(400).json({ message: "Email already exists" });
      return;
    }
    req.log.error({ err }, "Create user error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, parseInt(req.params.id)));
    if (!user) { res.status(404).json({ message: "Not found" }); return; }
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone, isActive: user.isActive, createdAt: user.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Get user error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:id", requireRole("owner", "admin"), async (req, res) => {
  try {
    const updates: any = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.email !== undefined) updates.email = req.body.email;
    if (req.body.role !== undefined) updates.role = req.body.role;
    if (req.body.phone !== undefined) updates.phone = req.body.phone;
    if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
    updates.updatedAt = new Date();
    const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, parseInt(req.params.id))).returning();
    if (!user) { res.status(404).json({ message: "Not found" }); return; }
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone, isActive: user.isActive, createdAt: user.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Update user error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", requireRole("owner", "admin"), async (req, res) => {
  try {
    await db.delete(usersTable).where(eq(usersTable.id, parseInt(req.params.id)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete user error");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
