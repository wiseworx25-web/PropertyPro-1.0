import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { propertiesTable } from "./properties";

export const unitsTable = pgTable("units", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => propertiesTable.id),
  unitNumber: text("unit_number").notNull(),
  tier: text("tier").notNull().default("entry_level"),
  monthlyRent: numeric("monthly_rent", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("vacant"),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  size: numeric("size", { precision: 10, scale: 2 }),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUnitSchema = createInsertSchema(unitsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUnit = z.infer<typeof insertUnitSchema>;
export type Unit = typeof unitsTable.$inferSelect;
