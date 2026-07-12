import { pgTable, serial, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { scrapeJobsTable } from "./scrapeJobs";
import { jobStatusEnum } from "./scrapeJobs";

export const featureSetsTable = pgTable("feature_sets", {
  id: serial("id").primaryKey(),
  scrapeJobId: integer("scrape_job_id")
    .notNull()
    .references(() => scrapeJobsTable.id, { onDelete: "cascade" }),
  status: jobStatusEnum("status").notNull().default("pending"),
  featureNames: jsonb("feature_names").$type<string[]>().notNull().default([]),
  rowCount: integer("row_count").notNull().default(0),
  csvObjectPath: text("csv_object_path"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertFeatureSetSchema = createInsertSchema(featureSetsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertFeatureSet = z.infer<typeof insertFeatureSetSchema>;
export type FeatureSet = typeof featureSetsTable.$inferSelect;
