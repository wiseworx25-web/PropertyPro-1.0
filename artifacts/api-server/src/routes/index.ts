import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import propertiesRouter from "./properties.js";
import unitsRouter from "./units.js";
import leasesRouter from "./leases.js";
import transactionsRouter from "./transactions.js";
import maintenanceRouter from "./maintenance.js";
import notificationsRouter from "./notifications.js";
import auditRouter from "./audit.js";
import dashboardRouter from "./dashboard.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/properties", propertiesRouter);
router.use("/units", unitsRouter);
router.use("/leases", leasesRouter);
router.use("/transactions", transactionsRouter);
router.use("/maintenance", maintenanceRouter);
router.use("/notifications", notificationsRouter);
router.use("/audit", auditRouter);
router.use("/dashboard", dashboardRouter);

export default router;
