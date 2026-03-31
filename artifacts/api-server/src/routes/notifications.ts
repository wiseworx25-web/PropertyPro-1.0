import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();
router.use(authMiddleware);

function formatNotif(n: any) {
  return { ...n, createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt };
}

router.get("/", async (req, res) => {
  try {
    const notifs = await db.select().from(notificationsTable).where(eq(notificationsTable.userId, req.user!.userId));
    res.json(notifs.map(formatNotif));
  } catch (err) {
    req.log.error({ err }, "List notifications error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id/read", async (req, res) => {
  try {
    const [notif] = await db.update(notificationsTable).set({ isRead: true }).where(and(eq(notificationsTable.id, parseInt(req.params.id)), eq(notificationsTable.userId, req.user!.userId))).returning();
    if (!notif) { res.status(404).json({ message: "Not found" }); return; }
    res.json(formatNotif(notif));
  } catch (err) {
    req.log.error({ err }, "Mark read error");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
