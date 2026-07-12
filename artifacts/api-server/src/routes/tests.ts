import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { db, testRunsTable } from "@workspace/db";
import { RunTestSuiteBody, ListTestRunsResponse, RunTestSuiteResponse, GetTestRunResponse, ListTestSuitesResponse } from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middlewares/rbac";

const router: IRouter = Router();
const execFileAsync = promisify(execFile);

const SUITE_TYPES = ["unit", "ddt", "bdd", "regression", "e2e"] as const;
type SuiteType = (typeof SUITE_TYPES)[number];

const workspaceRoot = process.cwd().endsWith(path.join("artifacts", "api-server"))
  ? path.resolve(process.cwd(), "../..")
  : process.cwd();
const apiServerDir = path.resolve(workspaceRoot, "artifacts/api-server");

interface VitestJsonReport {
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  startTime: number;
  testResults: { message?: string }[];
}

async function executeSuite(suiteType: SuiteType): Promise<{
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  output: string;
}> {
  const startedAt = Date.now();
  try {
    await execFileAsync(
      "npx",
      ["vitest", "run", `src/__tests__/${suiteType}.test.ts`, "--reporter=json", "--outputFile=.vitest-report.json"],
      { cwd: apiServerDir, timeout: 60_000 },
    );
  } catch {
    // vitest exits non-zero when tests fail; report file is still written.
  }

  const fs = await import("fs/promises");
  const reportPath = path.join(apiServerDir, ".vitest-report.json");
  const raw = await fs.readFile(reportPath, "utf8");
  const report = JSON.parse(raw) as VitestJsonReport;

  return {
    total: report.numTotalTests ?? 0,
    passed: report.numPassedTests ?? 0,
    failed: report.numFailedTests ?? 0,
    durationMs: Date.now() - startedAt,
    output: JSON.stringify(report.testResults?.map((r) => r.message).filter(Boolean) ?? []),
  };
}

router.get("/tests/suites", requireAuth, async (_req, res): Promise<void> => {
  const summaries = await Promise.all(
    SUITE_TYPES.map(async (suiteType) => {
      const [lastRun] = await db
        .select()
        .from(testRunsTable)
        .where(eq(testRunsTable.suiteType, suiteType))
        .orderBy(desc(testRunsTable.createdAt))
        .limit(1);
      return { suiteType, lastRun: lastRun ?? null };
    }),
  );
  res.json(ListTestSuitesResponse.parse(summaries));
});

router.get("/tests/runs", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db.select().from(testRunsTable).orderBy(desc(testRunsTable.createdAt));
  res.json(ListTestRunsResponse.parse(rows));
});

router.post("/tests/runs", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = RunTestSuiteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [run] = await db
    .insert(testRunsTable)
    .values({ suiteType: parsed.data.suiteType, status: "running" })
    .returning();

  try {
    const result = await executeSuite(parsed.data.suiteType);
    const [completed] = await db
      .update(testRunsTable)
      .set({
        status: "completed",
        total: result.total,
        passed: result.passed,
        failed: result.failed,
        durationMs: result.durationMs,
        output: result.output,
        completedAt: new Date(),
      })
      .where(eq(testRunsTable.id, run.id))
      .returning();

    res.status(201).json(RunTestSuiteResponse.parse(completed));
  } catch (err) {
    req.log.error({ err }, "Test suite execution failed");
    const message = err instanceof Error ? err.message : "Test execution failed";
    const [failed] = await db
      .update(testRunsTable)
      .set({ status: "failed", output: message, completedAt: new Date() })
      .where(eq(testRunsTable.id, run.id))
      .returning();
    res.status(500).json({ error: message, run: failed });
  }
});

router.get("/tests/runs/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const [row] = await db.select().from(testRunsTable).where(eq(testRunsTable.id, id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(GetTestRunResponse.parse(row));
});

export default router;
