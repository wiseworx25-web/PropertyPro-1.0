import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { unitsTable } from "./units";

export const leasesTable = pgTable("leases", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => usersTable.id),
  unitId: integer("unit_id").notNull().references(() => unitsTable.id),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  monthlyRent: numeric("monthly_rent", { precision: 10, scale: 2 }).notNull(),
  depositAmount: numeric("deposit_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("active"),
  paymentDueDay: integer("payment_due_day").notNull().default(1),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLeaseSchema = createInsertSchema(leasesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLease = z.infer<typeof insertLeaseSchema>;
export type Lease = typeof leasesTable.$inferSelect;
