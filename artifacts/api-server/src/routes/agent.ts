import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, dataSourcesTable, scrapeJobsTable, featureSetsTable, trainingRunsTable } from "@workspace/db";
import {
  DATA_SOURCE_DEFINITIONS,
  getDataSourceDefinition,
  scrapeDataSource,
  processRecords,
  trainOnFeatureRows,
  parseCsv,
  type FeatureRow,
} from "@workspace/agent-pipeline";
import {
  RunScrapeBody,
  RunProcessBody,
  RunTrainBody,
  ListDataSourcesResponse,
  RunScrapeResponse,
  ListScrapeJobsResponse,
  GetScrapeJobResponse,
  RunProcessResponse,
  ListFeatureSetsResponse,
  GetFeatureSetResponse,
  RunTrainResponse,
  ListTrainingRunsResponse,
  GetTrainingRunResponse,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middlewares/rbac";
import { ObjectStorageService } from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorage = new ObjectStorageService();

async function ensureDataSourcesSeeded(): Promise<void> {
  const existing = await db.select().from(dataSourcesTable);
  const existingNames = new Set(existing.map((d: { name: string }) => d.name));
  const missing = DATA_SOURCE_DEFINITIONS.filter((d) => !existingNames.has(d.name));
  if (missing.length > 0) {
    await db.insert(dataSourcesTable).values(
      missing.map((d) => ({
        name: d.name,
        category: d.category,
        baseUrl: d.baseUrl,
        description: d.description,
      })),
    );
  }
}

async function writePrivateObject(pathPrefix: string, contents: string): Promise<string> {
  const uploadUrl = await objectStorage.getObjectEntityUploadURL();
  await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: contents,
  });
  return objectStorage.normalizeObjectEntityPath(uploadUrl);
}

router.get("/agent/sources", requireAuth, async (_req, res): Promise<void> => {
  await ensureDataSourcesSeeded();
  const sources = await db.select().from(dataSourcesTable).orderBy(dataSourcesTable.id);
  res.json(ListDataSourcesResponse.parse(sources));
});

router.post("/agent/scrape", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = RunScrapeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await ensureDataSourcesSeeded();
  const [source] = await db
    .select()
    .from(dataSourcesTable)
    .where(eq(dataSourcesTable.id, parsed.data.dataSourceId));
  if (!source) {
    res.status(400).json({ error: "Unknown data source" });
    return;
  }

  const definition = DATA_SOURCE_DEFINITIONS.find((d) => d.name === source.name);
  if (!definition || !getDataSourceDefinition(definition.key)) {
    res.status(400).json({ error: "No scraper registered for this data source" });
    return;
  }

  const [job] = await db
    .insert(scrapeJobsTable)
    .values({
      dataSourceId: source.id,
      status: "running",
      triggeredByUserId: req.localUser!.id,
    })
    .returning();

  try {
    const result = await scrapeDataSource(definition.key);
    const rawObjectPath = await writePrivateObject(
      "scrape",
      JSON.stringify({ records: result.records, raw: result.raw }, null, 2),
    );

    const [completed] = await db
      .update(scrapeJobsTable)
      .set({
        status: "completed",
        recordsScraped: result.records.length,
        rawObjectPath,
        completedAt: new Date(),
      })
      .where(eq(scrapeJobsTable.id, job.id))
      .returning();

    res.status(201).json(
      RunScrapeResponse.parse({ ...completed, dataSourceName: source.name }),
    );
  } catch (err) {
    req.log.error({ err }, "Scrape job failed");
    const message = err instanceof Error ? err.message : "Scrape failed";
    const [failed] = await db
      .update(scrapeJobsTable)
      .set({ status: "failed", errorMessage: message, completedAt: new Date() })
      .where(eq(scrapeJobsTable.id, job.id))
      .returning();
    res
      .status(502)
      .json({ error: `Failed to scrape ${source.name}: ${message}`, job: { ...failed, dataSourceName: source.name } });
  }
});

router.get("/agent/scrape-jobs", requireAuth, async (_req, res): Promise<void> => {
  const jobs = await db
    .select({ job: scrapeJobsTable, dataSourceName: dataSourcesTable.name })
    .from(scrapeJobsTable)
    .innerJoin(dataSourcesTable, eq(scrapeJobsTable.dataSourceId, dataSourcesTable.id))
    .orderBy(scrapeJobsTable.createdAt);

  res.json(
    ListScrapeJobsResponse.parse(jobs.map(({ job, dataSourceName }) => ({ ...job, dataSourceName }))),
  );
});

router.get("/agent/scrape-jobs/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const [row] = await db
    .select({ job: scrapeJobsTable, dataSourceName: dataSourcesTable.name })
    .from(scrapeJobsTable)
    .innerJoin(dataSourcesTable, eq(scrapeJobsTable.dataSourceId, dataSourcesTable.id))
    .where(eq(scrapeJobsTable.id, id));

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(GetScrapeJobResponse.parse({ ...row.job, dataSourceName: row.dataSourceName }));
});

router.post("/agent/process", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = RunProcessBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [job] = await db
    .select()
    .from(scrapeJobsTable)
    .where(eq(scrapeJobsTable.id, parsed.data.scrapeJobId));
  if (!job || job.status !== "completed" || !job.rawObjectPath) {
    res.status(404).json({ error: "Completed scrape job not found" });
    return;
  }

  const [featureSet] = await db
    .insert(featureSetsTable)
    .values({ scrapeJobId: job.id, status: "running" })
    .returning();

  try {
    const objectFile = await objectStorage.getObjectEntityFile(job.rawObjectPath);
    const [contents] = await objectFile.download();
    const raw = JSON.parse(contents.toString("utf8")) as { records: unknown[] };
    const result = processRecords(raw.records as never, parsed.data.features);
    const csvObjectPath = await writePrivateObject("features", result.csv);

    const [completed] = await db
      .update(featureSetsTable)
      .set({
        status: "completed",
        featureNames: result.featureNames,
        rowCount: result.rows.length,
        csvObjectPath,
        completedAt: new Date(),
      })
      .where(eq(featureSetsTable.id, featureSet.id))
      .returning();

    res.status(201).json(RunProcessResponse.parse(completed));
  } catch (err) {
    req.log.error({ err }, "Feature processing failed");
    const message = err instanceof Error ? err.message : "Processing failed";
    await db
      .update(featureSetsTable)
      .set({ status: "failed", errorMessage: message, completedAt: new Date() })
      .where(eq(featureSetsTable.id, featureSet.id));
    res.status(502).json({ error: `Failed to process feature set: ${message}` });
  }
});

router.get("/agent/feature-sets", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db.select().from(featureSetsTable).orderBy(featureSetsTable.createdAt);
  res.json(ListFeatureSetsResponse.parse(rows));
});

router.get("/agent/feature-sets/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const [row] = await db.select().from(featureSetsTable).where(eq(featureSetsTable.id, id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(GetFeatureSetResponse.parse(row));
});

router.post("/agent/train", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = RunTrainBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [featureSet] = await db
    .select()
    .from(featureSetsTable)
    .where(eq(featureSetsTable.id, parsed.data.featureSetId));
  if (!featureSet || featureSet.status !== "completed" || !featureSet.csvObjectPath) {
    res.status(404).json({ error: "Completed feature set not found" });
    return;
  }

  const [run] = await db
    .insert(trainingRunsTable)
    .values({ featureSetId: featureSet.id, status: "running" })
    .returning();

  try {
    const objectFile = await objectStorage.getObjectEntityFile(featureSet.csvObjectPath);
    const [contents] = await objectFile.download();
    const csv = contents.toString("utf8");
    const { header, rows: csvRows } = parseCsv(csv);
    const titleIdx = header.indexOf("title");
    const scoreIdx = header.indexOf("score_normalized");
    const categoryIdx = header.indexOf("category");

    const rows: FeatureRow[] = csvRows.map((cells) => ({
      title: titleIdx >= 0 ? cells[titleIdx] ?? "" : "",
      category: categoryIdx >= 0 ? cells[categoryIdx] ?? "" : "",
      score: 0,
      titleLength: 0,
      wordCount: 0,
      hasNumber: false,
      score_normalized: scoreIdx >= 0 ? Number(cells[scoreIdx] ?? 0) : 0,
    }));

    const result = trainOnFeatureRows(rows);

    const [completed] = await db
      .update(trainingRunsTable)
      .set({
        status: "completed",
        metrics: result.metrics,
        predictedTopics: result.predictedTopics,
        completedAt: new Date(),
      })
      .where(eq(trainingRunsTable.id, run.id))
      .returning();

    res.status(201).json(RunTrainResponse.parse(completed));
  } catch (err) {
    req.log.error({ err }, "Training run failed");
    const message = err instanceof Error ? err.message : "Training failed";
    await db
      .update(trainingRunsTable)
      .set({ status: "failed", errorMessage: message, completedAt: new Date() })
      .where(eq(trainingRunsTable.id, run.id));
    res.status(502).json({ error: `Training failed: ${message}` });
  }
});

router.get("/agent/training-runs", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db.select().from(trainingRunsTable).orderBy(trainingRunsTable.createdAt);
  res.json(ListTrainingRunsResponse.parse(rows));
});

router.get("/agent/training-runs/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const [row] = await db.select().from(trainingRunsTable).where(eq(trainingRunsTable.id, id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(GetTrainingRunResponse.parse(row));
});

export default router;
