import { Router } from "express";
import { db, propertiesTable, unitsTable, usersTable, leasesTable, transactionsTable, maintenanceRequestsTable, notificationsTable, auditLogsTable } from "@workspace/db";
import { authMiddleware, requireRole } from "../middlewares/auth.js";

const router = Router();
router.use(authMiddleware);

router.get("/owner", requireRole("owner", "admin"), async (req, res) => {
  try {
    const [props, units, txs, mReqs, leases] = await Promise.all([
      db.select().from(propertiesTable),
      db.select().from(unitsTable),
      db.select().from(transactionsTable),
      db.select().from(maintenanceRequestsTable),
      db.select().from(leasesTable),
    ]);

    const occupied = units.filter(u => u.status === "occupied").length;
    const monthlyIncome = txs.filter(t => t.status === "completed" && ["rent"].includes(t.type) && isCurrentMonth(t.createdAt)).reduce((s, t) => s + parseFloat(t.amount), 0);
    const yearlyIncome = txs.filter(t => t.status === "completed" && ["rent"].includes(t.type) && isCurrentYear(t.createdAt)).reduce((s, t) => s + parseFloat(t.amount), 0);
    
    const recentTxs = txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
    const incomeChart = buildMonthlyChart(txs);

    res.json({
      totalProperties: props.length,
      totalUnits: units.length,
      occupiedUnits: occupied,
      vacantUnits: units.filter(u => u.status === "vacant").length,
      occupancyRate: units.length ? (occupied / units.length) * 100 : 0,
      monthlyIncome, yearlyIncome,
      pendingMaintenance: mReqs.filter(m => m.status === "pending").length,
      recentTransactions: recentTxs.map(t => formatTx(t)),
      incomeChart,
    });
  } catch (err) {
    req.log.error({ err }, "Owner dashboard error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/admin", requireRole("owner", "admin"), async (req, res) => {
  try {
    const [users, units, mReqs, leases, auditLogs] = await Promise.all([
      db.select().from(usersTable),
      db.select().from(unitsTable),
      db.select().from(maintenanceRequestsTable),
      db.select().from(leasesTable),
      db.select().from(auditLogsTable).limit(20),
    ]);

    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringLeases = leases.filter(l => l.status === "active" && new Date(l.endDate) <= thirtyDaysFromNow && new Date(l.endDate) >= today);
    const tenants = users.filter(u => u.role === "tenant");

    res.json({
      totalTenants: tenants.length,
      activeTenants: tenants.filter(t => t.isActive).length,
      totalVendors: users.filter(u => u.role === "vendor").length,
      pendingMaintenanceRequests: mReqs.filter(m => m.status === "pending").length,
      expiringLeases: expiringLeases.map(l => ({ id: l.id, tenantId: l.tenantId, unitId: l.unitId, startDate: l.startDate, endDate: l.endDate, monthlyRent: parseFloat(l.monthlyRent), depositAmount: parseFloat(l.depositAmount), status: l.status, paymentDueDay: l.paymentDueDay, notes: l.notes, createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : l.createdAt, tenant: null, unit: null })),
      recentActivity: auditLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10).map(l => ({ ...l, createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : l.createdAt, user: null })),
      unitStatusBreakdown: {
        vacant: units.filter(u => u.status === "vacant").length,
        occupied: units.filter(u => u.status === "occupied").length,
        maintenance: units.filter(u => u.status === "maintenance").length,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Admin dashboard error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/tenant", requireRole("tenant"), async (req, res) => {
  try {
    const userId = req.user!.userId;
    const [leases, txs, mReqs, notifs, units] = await Promise.all([
      db.select().from(leasesTable),
      db.select().from(transactionsTable),
      db.select().from(maintenanceRequestsTable),
      db.select().from(notificationsTable),
      db.select().from(unitsTable),
    ]);

    const myLeases = leases.filter(l => l.tenantId === userId);
    const activeLease = myLeases.find(l => l.status === "active") || null;
    const unit = activeLease ? units.find(u => u.id === activeLease.unitId) : null;
    const myTxs = txs.filter(t => t.tenantId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const myMRs = mReqs.filter(m => m.tenantId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const myNotifs = notifs.filter(n => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const today = new Date();
    let nextPaymentDue = null;
    let nextPaymentAmount = null;
    if (activeLease) {
      const dueDay = activeLease.paymentDueDay;
      const nextDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
      if (nextDate <= today) nextDate.setMonth(nextDate.getMonth() + 1);
      nextPaymentDue = nextDate.toISOString();
      nextPaymentAmount = parseFloat(activeLease.monthlyRent);
    }

    res.json({
      activeLease: activeLease ? { id: activeLease.id, tenantId: activeLease.tenantId, unitId: activeLease.unitId, startDate: activeLease.startDate, endDate: activeLease.endDate, monthlyRent: parseFloat(activeLease.monthlyRent), depositAmount: parseFloat(activeLease.depositAmount), status: activeLease.status, paymentDueDay: activeLease.paymentDueDay, notes: activeLease.notes, createdAt: activeLease.createdAt instanceof Date ? activeLease.createdAt.toISOString() : activeLease.createdAt, tenant: null, unit: null } : null,
      unit: unit ? { id: unit.id, propertyId: unit.propertyId, unitNumber: unit.unitNumber, tier: unit.tier, monthlyRent: parseFloat(unit.monthlyRent), status: unit.status, bedrooms: unit.bedrooms, bathrooms: unit.bathrooms, size: unit.size ? parseFloat(unit.size) : null, description: unit.description, createdAt: unit.createdAt instanceof Date ? unit.createdAt.toISOString() : unit.createdAt, property: null } : null,
      nextPaymentDue,
      nextPaymentAmount,
      paymentHistory: myTxs.map(formatTx),
      maintenanceRequests: myMRs.map(m => ({ id: m.id, tenantId: m.tenantId, unitId: m.unitId, vendorId: m.vendorId, title: m.title, description: m.description, priority: m.priority, status: m.status, resolvedAt: m.resolvedAt instanceof Date ? m.resolvedAt.toISOString() : m.resolvedAt, notes: m.notes, createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt, tenant: null, vendor: null, unit: null })),
      notifications: myNotifs.map(n => ({ ...n, createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt })),
    });
  } catch (err) {
    req.log.error({ err }, "Tenant dashboard error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/vendor", requireRole("vendor"), async (req, res) => {
  try {
    const userId = req.user!.userId;
    const mReqs = await db.select().from(maintenanceRequestsTable);
    const myJobs = mReqs.filter(m => m.vendorId === userId);

    res.json({
      assignedJobs: myJobs.map(m => ({ id: m.id, tenantId: m.tenantId, unitId: m.unitId, vendorId: m.vendorId, title: m.title, description: m.description, priority: m.priority, status: m.status, resolvedAt: m.resolvedAt instanceof Date ? m.resolvedAt.toISOString() : m.resolvedAt, notes: m.notes, createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt, tenant: null, vendor: null, unit: null })),
      pendingJobs: myJobs.filter(j => j.status === "pending").length,
      inProgressJobs: myJobs.filter(j => j.status === "in_progress").length,
      completedJobs: myJobs.filter(j => j.status === "resolved").length,
      recentlyCompleted: myJobs.filter(j => j.status === "resolved").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map(m => ({ id: m.id, tenantId: m.tenantId, unitId: m.unitId, vendorId: m.vendorId, title: m.title, description: m.description, priority: m.priority, status: m.status, resolvedAt: m.resolvedAt instanceof Date ? m.resolvedAt.toISOString() : m.resolvedAt, notes: m.notes, createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt, tenant: null, vendor: null, unit: null })),
    });
  } catch (err) {
    req.log.error({ err }, "Vendor dashboard error");
    res.status(500).json({ message: "Internal server error" });
  }
});

function isCurrentMonth(date: any): boolean {
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function isCurrentYear(date: any): boolean {
  const d = date instanceof Date ? date : new Date(date);
  return d.getFullYear() === new Date().getFullYear();
}

function buildMonthlyChart(txs: any[]) {
  const map: Record<string, number> = {};
  txs.filter(t => t.status === "completed" && ["rent", "deposit"].includes(t.type)).forEach(t => {
    const d = t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt);
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
    map[key] = (map[key] || 0) + parseFloat(t.amount);
  });
  return Object.entries(map).map(([month, amount]) => ({ month, amount }));
}

function formatTx(t: any) {
  return { id: t.id, leaseId: t.leaseId, tenantId: t.tenantId, amount: parseFloat(t.amount), type: t.type, status: t.status, reference: t.reference, description: t.description, paymentMethod: t.paymentMethod, paidAt: t.paidAt instanceof Date ? t.paidAt.toISOString() : t.paidAt, createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt, tenant: null };
}

export default router;
