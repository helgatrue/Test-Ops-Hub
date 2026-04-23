import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { testRunsTable } from "./test-runs";
import { testCasesTable } from "./test-cases";

export const testResultsTable = pgTable("test_results", {
  id: serial("id").primaryKey(),
  testRunId: integer("test_run_id")
    .notNull()
    .references(() => testRunsTable.id, { onDelete: "cascade" }),
  testCaseId: integer("test_case_id")
    .notNull()
    .references(() => testCasesTable.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  stackTrace: text("stack_trace"),
  duration: integer("duration"),
  retries: integer("retries").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTestResultSchema = createInsertSchema(testResultsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateTestResultSchema = insertTestResultSchema.partial();

export type InsertTestResult = z.infer<typeof insertTestResultSchema>;
export type TestResult = typeof testResultsTable.$inferSelect;
