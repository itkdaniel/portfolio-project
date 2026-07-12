import { pgTable, serial, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { jobStatusEnum } from "./scrapeJobs";

export const testSuiteTypeEnum = pgEnum("test_suite_type", [
  "unit",
  "ddt",
  "bdd",
  "regression",
  "e2e",
]);

export const testRunsTable = pgTable("test_runs", {
  id: serial("id").primaryKey(),
  suiteType: testSuiteTypeEnum("suite_type").notNull(),
  status: jobStatusEnum("status").notNull().default("pending"),
  total: integer("total").notNull().default(0),
  passed: integer("passed").notNull().default(0),
  failed: integer("failed").notNull().default(0),
  durationMs: integer("duration_ms"),
  output: text("output"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertTestRunSchema = createInsertSchema(testRunsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertTestRun = z.infer<typeof insertTestRunSchema>;
export type TestRun = typeof testRunsTable.$inferSelect;
