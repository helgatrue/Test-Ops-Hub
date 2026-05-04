import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const checklistsTable = pgTable("checklists", {
  id: serial("id").primaryKey(),
  projectId: serial("project_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("active").notNull(),
  items: jsonb("items").default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertChecklistSchema = createInsertSchema(checklistsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateChecklistSchema = insertChecklistSchema.partial();

export type InsertChecklist = z.infer<typeof insertChecklistSchema>;
export type Checklist = typeof checklistsTable.$inferSelect;
