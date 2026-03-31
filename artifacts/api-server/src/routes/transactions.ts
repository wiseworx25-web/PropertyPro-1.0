import { Router } from "express";
import { db, transactionsTable, usersTable } from "@workspace/db";
import { eq, gte, lte, and, sql } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();
router.use(authMiddleware);

function formatTx(t: any, tenant?: any) {
  return {
    id: t.id, leaseId: t.leaseId, tenantId: t.tenantId,
    amount: parseFloat(t.amount), type: t.type, status: t.status,
    reference: t.reference, description: t.description, paymentMethod: t.paymentMethod,
    paidAt: t.paidAt instanceof Date ? t.paidAt.toISOString() : t.paidAt,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
    tenant: tenant ? { id: tenant.id, email: tenant.email, name: tenant.name, role: tenant.role, phone: tenant.phone, isActive: tenant.isActive, createdAt: tenant.createdAt instanceof Date ? tenant.createdAt.toISOString() : tenant.createdAt } : null,
  };
}

router.get("/summary", async (req, res) => {
  try {
    const txs = await db.select().from(transactionsTable);
    const income = txs.filter(t => t.status === "completed" && ["rent", "deposit"].includes(t.type)).reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const expenses = txs.filter(t => t.status === "completed" && t.type === "expense").reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const pending = txs.filter(t => t.status === "pending").reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const monthlyMap: Record<string, { income: number; expenses: number }> = {};
    txs.filter(t => t.status === "completed").forEach(t => {
      const d = t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyMap[key]) monthlyMap[key] = { income: 0, expenses: 0 };
      if (["rent", "deposit"].includes(t.type)) monthlyMap[key].income += parseFloat(t.amount);
      if (t.type === "expense") monthlyMap[key].expenses += parseFloat(t.amount);
    });
    
    res.json({
      totalIncome: income,
      totalExpenses: expenses,
      netIncome: income - expenses,
      pendingPayments: pending,
      overdueCount: 0,
      monthlyBreakdown: Object.entries(monthlyMap).sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({ month, ...v })),
    });
  } catch (err) {
    req.log.error({ err }, "Summary error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { tenantId, leaseId, type, status } = req.query;
    let txs = await db.select().from(transactionsTable);
    
    if (req.user!.role === "tenant") txs = txs.filter(t => t.tenantId === req.user!.userId);
    else if (tenantId) txs = txs.filter(t => t.tenantId === parseInt(tenantId as string));
    if (leaseId) txs = txs.filter(t => t.leaseId === parseInt(leaseId as string));
    if (type) txs = txs.filter(t => t.type === type);
    if (status) txs = txs.filter(t => t.status === status);
    
    const tenants = await db.select().from(usersTable);
    const tenantMap = Object.fromEntries(tenants.map(t => [t.id, t]));
    res.json(txs.map(t => formatTx(t, t.tenantId ? tenantMap[t.tenantId] : undefined)));
  } catch (err) {
    req.log.error({ err }, "List transactions error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  const { leaseId, tenantId, amount, type, status, reference, description, paymentMethod, paidAt } = req.body;
  if (!amount || !type || !status) {
    res.status(400).json({ message: "Missing required fields" });
    return;
  }
  try {
    const [tx] = await db.insert(transactionsTable).values({
      leaseId, tenantId, amount: amount.toString(), type, status,
      reference, description, paymentMethod,
      paidAt: paidAt ? new Date(paidAt) : (status === "completed" ? new Date() : null),
    }).returning();
    res.status(201).json(formatTx(tx));
  } catch (err) {
    req.log.error({ err }, "Create transaction error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [tx] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, parseInt(req.params.id)));
    if (!tx) { res.status(404).json({ message: "Not found" }); return; }
    res.json(formatTx(tx));
  } catch (err) {
    req.log.error({ err }, "Get transaction error");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
