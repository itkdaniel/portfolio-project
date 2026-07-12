import { mkdir, writeFile } from "fs/promises";
import path from "path";
import {
  DATA_SOURCE_DEFINITIONS,
  getDataSourceDefinition,
  scrapeDataSource,
  processRecords,
  trainOnFeatureRows,
  parseCsv as parseFeatureCsv,
  type FeatureRow,
} from "@workspace/agent-pipeline";

/**
 * Python-factory-style CLI for the Nexus agent pipeline. Mirrors the shape of
 * a `--flag=value` argparse tool while running real fetches/processing/training
 * against the local filesystem (not object storage) so it can be scripted
 * independently of the API server.
 *
 * Usage:
 *   pnpm --filter @workspace/scripts run agent -- --scrape=hacker-news --path=./data/raw
 *   pnpm --filter @workspace/scripts run agent -- --process=./data/raw/hacker-news.json --features=title,category,score_normalized
 *   pnpm --filter @workspace/scripts run agent -- --train=./data/features/hacker-news.csv
 */

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (const raw of argv) {
    const match = /^--([^=]+)=(.*)$/.exec(raw);
    if (match) {
      args[match[1]] = match[2];
    }
  }
  return args;
}

function printAvailableSources(): void {
  console.log("Available data sources (use the key with --scrape=<key>):");
  for (const d of DATA_SOURCE_DEFINITIONS) {
    console.log(`  ${d.key.padEnd(20)} [${d.category}]  ${d.description}`);
  }
}

function parseFeatureRows(csv: string): FeatureRow[] {
  const { header, rows } = parseFeatureCsv(csv);
  const titleIdx = header.indexOf("title");
  const categoryIdx = header.indexOf("category");
  const scoreNormIdx = header.indexOf("score_normalized");
  return rows.map((cells) => ({
    title: titleIdx >= 0 ? cells[titleIdx] ?? "" : "",
    category: categoryIdx >= 0 ? cells[categoryIdx] ?? "" : "",
    score: 0,
    titleLength: 0,
    wordCount: 0,
    hasNumber: false,
    score_normalized: scoreNormIdx >= 0 ? Number(cells[scoreNormIdx] ?? 0) : 0,
  }));
}

async function runScrape(sourceKey: string, destDir: string): Promise<void> {
  const definition = getDataSourceDefinition(sourceKey);
  if (!definition) {
    console.error(`Unknown data source: "${sourceKey}"`);
    printAvailableSources();
    process.exitCode = 1;
    return;
  }

  console.log(`Scraping "${definition.name}" (${definition.baseUrl})...`);
  const result = await scrapeDataSource(sourceKey);
  await mkdir(destDir, { recursive: true });
  const destFile = path.join(destDir, `${sourceKey}.json`);
  await writeFile(destFile, JSON.stringify({ records: result.records, raw: result.raw }, null, 2), "utf8");
  console.log(`Scraped ${result.records.length} records -> ${destFile}`);
}

async function runProcess(sourcePath: string, featuresCsv: string): Promise<void> {
  const { readFile } = await import("fs/promises");
  const raw = JSON.parse(await readFile(sourcePath, "utf8")) as { records: unknown[] };
  const features = featuresCsv ? featuresCsv.split(",").map((f) => f.trim()).filter(Boolean) : [];

  const result = processRecords(raw.records as never, features);
  const destDir = path.join(path.dirname(path.dirname(sourcePath)), "features");
  await mkdir(destDir, { recursive: true });
  const baseName = path.basename(sourcePath, path.extname(sourcePath));
  const destFile = path.join(destDir, `${baseName}.csv`);
  await writeFile(destFile, result.csv, "utf8");
  console.log(`Processed ${result.rows.length} rows with features [${result.featureNames.join(", ")}] -> ${destFile}`);
}

async function runTrain(csvPath: string): Promise<void> {
  const { readFile } = await import("fs/promises");
  const csv = await readFile(csvPath, "utf8");
  const rows = parseFeatureRows(csv);
  const result = trainOnFeatureRows(rows);

  console.log(`Trained on ${rows.length} rows.`);
  console.log("Metrics:", JSON.stringify(result.metrics, null, 2));
  console.log("Top predicted trending topics:");
  for (const topic of result.predictedTopics) {
    console.log(`  ${topic.topic.padEnd(20)} score=${topic.score}`);
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.scrape) {
    await runScrape(args.scrape, args.path ?? "./data/raw");
    return;
  }
  if (args.process) {
    await runProcess(args.process, args.features ?? "");
    return;
  }
  if (args.train) {
    await runTrain(args.train);
    return;
  }

  console.log("Nexus agent pipeline CLI");
  console.log("");
  console.log("Commands:");
  console.log("  --scrape=<sourceKey> --path=<destDir>       Scrape a real trending-topic source to local JSON.");
  console.log("  --process=<sourceJsonPath> --features=<csv>  Engineer features from a scraped JSON file into CSV.");
  console.log("  --train=<featureCsvPath>                     Train the keyword-trend scorer on a feature CSV.");
  console.log("");
  printAvailableSources();
}

main().catch((err) => {
  console.error("Agent CLI failed:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
