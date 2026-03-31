import { Router } from "express";
import { db, auditLogsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth.js";

const router = Router();
router.use(authMiddleware, requireRole("owner", "admin"));

router.get("/", async (req, res) => {
  try {
    const { userId, action } = req.query;
    let logs = await db.select().from(auditLogsTable).orderBy(auditLogsTable.createdAt);
    if (userId) logs = logs.filter(l => l.userId === parseInt(userId as string));
    if (action) logs = logs.filter(l => l.action.includes(action as string));
    
    const users = await db.select().from(usersTable);
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    
    res.json(logs.map(l => ({
      ...l,
      createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : l.createdAt,
      user: l.userId && userMap[l.userId] ? { id: userMap[l.userId].id, email: userMap[l.userId].email, name: userMap[l.userId].name, role: userMap[l.userId].role, phone: userMap[l.userId].phone, isActive: userMap[l.userId].isActive, createdAt: userMap[l.userId].createdAt instanceof Date ? userMap[l.userId].createdAt.toISOString() : userMap[l.userId].createdAt } : null,
    })));
  } catch (err) {
    req.log.error({ err }, "List audit logs error");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
