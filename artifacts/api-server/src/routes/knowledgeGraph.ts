import { Router, type IRouter } from "express";
import {
  db,
  usersTable,
  profilesTable,
  dataSourcesTable,
  scrapeJobsTable,
  featureSetsTable,
  trainingRunsTable,
  testRunsTable,
} from "@workspace/db";
import { GetKnowledgeGraphResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/rbac";

const router: IRouter = Router();

interface Node {
  id: string;
  entityType: string;
  label: string;
  detail?: Record<string, unknown>;
}
interface Edge {
  source: string;
  target: string;
  relation: string;
}

router.get("/knowledge-graph", requireAuth, async (_req, res): Promise<void> => {
  const [users, profiles, dataSources, scrapeJobs, featureSets, trainingRuns, testRuns] =
    await Promise.all([
      db.select().from(usersTable),
      db.select().from(profilesTable),
      db.select().from(dataSourcesTable),
      db.select().from(scrapeJobsTable),
      db.select().from(featureSetsTable),
      db.select().from(trainingRunsTable),
      db.select().from(testRunsTable),
    ]);

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  for (const u of users) {
    nodes.push({
      id: `user-${u.id}`,
      entityType: "user",
      label: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email,
      detail: { email: u.email, role: u.role },
    });
  }

  for (const p of profiles) {
    nodes.push({
      id: `profile-${p.id}`,
      entityType: "profile",
      label: p.headline || `Profile #${p.id}`,
      detail: { isPublic: p.isPublic, skills: p.skills },
    });
    edges.push({ source: `user-${p.userId}`, target: `profile-${p.id}`, relation: "has_profile" });
  }

  for (const d of dataSources) {
    nodes.push({
      id: `dataSource-${d.id}`,
      entityType: "dataSource",
      label: d.name,
      detail: { category: d.category, baseUrl: d.baseUrl },
    });
  }

  for (const j of scrapeJobs) {
    nodes.push({
      id: `scrapeJob-${j.id}`,
      entityType: "scrapeJob",
      label: `Scrape #${j.id} (${j.status})`,
      detail: { status: j.status, recordsScraped: j.recordsScraped },
    });
    edges.push({ source: `dataSource-${j.dataSourceId}`, target: `scrapeJob-${j.id}`, relation: "scraped_from" });
    if (j.triggeredByUserId) {
      edges.push({ source: `user-${j.triggeredByUserId}`, target: `scrapeJob-${j.id}`, relation: "triggered" });
    }
  }

  for (const f of featureSets) {
    nodes.push({
      id: `featureSet-${f.id}`,
      entityType: "featureSet",
      label: `Feature Set #${f.id} (${f.status})`,
      detail: { rowCount: f.rowCount, featureNames: f.featureNames },
    });
    edges.push({ source: `scrapeJob-${f.scrapeJobId}`, target: `featureSet-${f.id}`, relation: "processed_into" });
  }

  for (const t of trainingRuns) {
    nodes.push({
      id: `trainingRun-${t.id}`,
      entityType: "trainingRun",
      label: `Training Run #${t.id} (${t.status})`,
      detail: { metrics: t.metrics, predictedTopics: t.predictedTopics },
    });
    edges.push({ source: `featureSet-${t.featureSetId}`, target: `trainingRun-${t.id}`, relation: "trained_on" });
  }

  for (const r of testRuns) {
    nodes.push({
      id: `testRun-${r.id}`,
      entityType: "testRun",
      label: `${r.suiteType} run #${r.id} (${r.status})`,
      detail: { total: r.total, passed: r.passed, failed: r.failed },
    });
  }

  res.json(GetKnowledgeGraphResponse.parse({ nodes, edges }));
});

export default router;
