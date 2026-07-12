import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { dataSourcesTable } from "./dataSources";
import { usersTable } from "./users";

export const jobStatusEnum = pgEnum("job_status", [
  "pending",
  "running",
  "completed",
  "failed",
]);

export const scrapeJobsTable = pgTable("scrape_jobs", {
  id: serial("id").primaryKey(),
  dataSourceId: integer("data_source_id")
    .notNull()
    .references(() => dataSourcesTable.id, { onDelete: "cascade" }),
  status: jobStatusEnum("status").notNull().default("pending"),
  rawObjectPath: text("raw_object_path"),
  recordsScraped: integer("records_scraped").notNull().default(0),
  errorMessage: text("error_message"),
  triggeredByUserId: integer("triggered_by_user_id").references(
    () => usersTable.id,
    { onDelete: "set null" },
  ),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertScrapeJobSchema = createInsertSchema(scrapeJobsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertScrapeJob = z.infer<typeof insertScrapeJobSchema>;
export type ScrapeJob = typeof scrapeJobsTable.$inferSelect;
