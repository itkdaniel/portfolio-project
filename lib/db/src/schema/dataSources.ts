import { pgTable, serial, text, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dataSourceCategoryEnum = pgEnum("data_source_category", [
  "news",
  "tech",
  "crypto",
  "stocks",
  "sports",
]);

export const dataSourcesTable = pgTable("data_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: dataSourceCategoryEnum("category").notNull(),
  baseUrl: text("base_url").notNull(),
  description: text("description").notNull(),
});

export const insertDataSourceSchema = createInsertSchema(dataSourcesTable).omit({
  id: true,
});
export type InsertDataSource = z.infer<typeof insertDataSourceSchema>;
export type DataSource = typeof dataSourcesTable.$inferSelect;
