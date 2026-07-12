import { pgTable, serial, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { featureSetsTable } from "./featureSets";
import { jobStatusEnum } from "./scrapeJobs";

export const trainingRunsTable = pgTable("training_runs", {
  id: serial("id").primaryKey(),
  featureSetId: integer("feature_set_id")
    .notNull()
    .references(() => featureSetsTable.id, { onDelete: "cascade" }),
  status: jobStatusEnum("status").notNull().default("pending"),
  metrics: jsonb("metrics").$type<Record<string, unknown>>(),
  predictedTopics: jsonb("predicted_topics")
    .$type<{ topic: string; score: number }[]>()
    .notNull()
    .default([]),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertTrainingRunSchema = createInsertSchema(trainingRunsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertTrainingRun = z.infer<typeof insertTrainingRunSchema>;
export type TrainingRun = typeof trainingRunsTable.$inferSelect;
