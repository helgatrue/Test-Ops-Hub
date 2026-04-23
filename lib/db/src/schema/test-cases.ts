import { pgTable, serial, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

export const testCasesTable = pgTable("test_cases", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("draft"),
  labels: jsonb("labels").$type<string[]>().default([]),
  steps: jsonb("steps")
    .$type<Array<{ order: number; action: string; expected: string }>>()
    .default([]),
  automationStatus: text("automation_status").notNull().default("manual"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTestCaseSchema = createInsertSchema(testCasesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateTestCaseSchema = insertTestCaseSchema.partial();

export type InsertTestCase = z.infer<typeof insertTestCaseSchema>;
export type TestCase = typeof testCasesTable.$inferSelect;
