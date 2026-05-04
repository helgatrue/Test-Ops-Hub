import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const checklistGroupsTable = pgTable("checklist_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertChecklistGroupSchema = createInsertSchema(checklistGroupsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateChecklistGroupSchema = insertChecklistGroupSchema.partial();

export type InsertChecklistGroup = z.infer<typeof insertChecklistGroupSchema>;
export type ChecklistGroup = typeof checklistGroupsTable.$inferSelect;
