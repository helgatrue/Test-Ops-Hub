import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

export const testRunsTable = pgTable("test_runs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status").notNull().default("pending"),
  branch: text("branch"),
  commitHash: text("commit_hash"),
  commitMessage: text("commit_message"),
  triggeredBy: text("triggered_by"),
  ciProvider: text("ci_provider"),
  totalTests: integer("total_tests").notNull().default(0),
  passedTests: integer("passed_tests").notNull().default(0),
  failedTests: integer("failed_tests").notNull().default(0),
  skippedTests: integer("skipped_tests").notNull().default(0),
  blockedTests: integer("blocked_tests").notNull().default(0),
  duration: integer("duration"),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTestRunSchema = createInsertSchema(testRunsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateTestRunSchema = insertTestRunSchema.partial();

export type InsertTestRun = z.infer<typeof insertTestRunSchema>;
export type TestRun = typeof testRunsTable.$inferSelect;
