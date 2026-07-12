import { getDataSourceDefinition } from "./dataSources";

export interface ScrapedRecord {
  title: string;
  score: number;
  url?: string;
  category: string;
  raw: Record<string, unknown>;
}

export interface ScrapeResult {
  records: ScrapedRecord[];
  raw: unknown;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "User-Agent": "nexus-platform-agent/1.0" },
  });
  if (!res.ok) {
    throw new Error(`Upstream fetch failed (${res.status}): ${url}`);
  }
  return res.json();
}

async function scrapeHackerNews(): Promise<ScrapeResult> {
  const ids = (await fetchJson(
    "https://hacker-news.firebaseio.com/v0/topstories.json",
  )) as number[];
  const top = ids.slice(0, 20);
  const items = await Promise.all(
    top.map((id) =>
      fetchJson(`https://hacker-news.firebaseio.com/v0/item/${id}.json`),
    ),
  );
  const records: ScrapedRecord[] = items
    .filter((item): item is Record<string, unknown> => !!item)
    .map((item) => ({
      title: String(item.title ?? "Untitled"),
      score: Number(item.score ?? 0),
      url: typeof item.url === "string" ? item.url : undefined,
      category: "news",
      raw: item,
    }));
  return { records, raw: items };
}

async function scrapeGitHubTrending(): Promise<ScrapeResult> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const data = (await fetchJson(
    `https://api.github.com/search/repositories?q=created:>${since}&sort=stars&order=desc&per_page=20`,
  )) as { items?: Record<string, unknown>[] };
  const items = data.items ?? [];
  const records: ScrapedRecord[] = items.map((repo) => ({
    title: String(repo.full_name ?? "unknown/repo"),
    score: Number(repo.stargazers_count ?? 0),
    url: typeof repo.html_url === "string" ? repo.html_url : undefined,
    category: "tech",
    raw: repo,
  }));
  return { records, raw: data };
}

async function scrapeCoinGecko(): Promise<ScrapeResult> {
  const data = (await fetchJson(
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1",
  )) as Record<string, unknown>[];
  const records: ScrapedRecord[] = data.map((coin) => ({
    title: `${String(coin.name ?? "coin")} (${String(coin.symbol ?? "").toUpperCase()})`,
    score: Number(coin.price_change_percentage_24h ?? 0),
    url: `https://www.coingecko.com/en/coins/${String(coin.id ?? "")}`,
    category: "crypto",
    raw: coin,
  }));
  return { records, raw: data };
}

const STOCK_WATCHLIST = ["aapl.us", "msft.us", "googl.us", "amzn.us", "tsla.us", "nvda.us", "meta.us"];

function parseStooqCsv(csv: string): Record<string, string>[] {
  const lines = csv.trim().split("\n");
  const header = lines[0]?.split(",").map((h) => h.trim().toUpperCase()) ?? [];
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row: Record<string, string> = {};
    header.forEach((h, i) => {
      row[h] = cells[i] ?? "";
    });
    return row;
  });
}

async function scrapeStooqStocks(): Promise<ScrapeResult> {
  const symbols = STOCK_WATCHLIST.join(",");
  const url = `https://stooq.com/q/l/?s=${symbols}&f=sd2t2ohlcv&h&e=csv`;
  const res = await fetch(url, { headers: { "User-Agent": "nexus-platform-agent/1.0" } });
  if (!res.ok) {
    throw new Error(`Upstream fetch failed (${res.status}): ${url}`);
  }
  const csv = await res.text();
  const rows = parseStooqCsv(csv);
  const records: ScrapedRecord[] = rows.map((row) => {
    const open = Number(row.OPEN ?? 0);
    const close = Number(row.CLOSE ?? 0);
    const changePct = open > 0 ? ((close - open) / open) * 100 : 0;
    return {
      title: String(row.SYMBOL ?? "UNKNOWN").toUpperCase(),
      score: Number(changePct.toFixed(2)),
      category: "stocks",
      raw: row,
    };
  });
  return { records, raw: rows };
}

async function scrapeSportsEvents(): Promise<ScrapeResult> {
  const data = (await fetchJson(
    "https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4328",
  )) as { events?: Record<string, unknown>[] | null };
  const events = data.events ?? [];
  const records: ScrapedRecord[] = events.slice(0, 20).map((event) => ({
    title: String(event.strEvent ?? "Untitled fixture"),
    score: 1,
    category: "sports",
    raw: event,
  }));
  return { records, raw: data };
}

export async function scrapeDataSource(key: string): Promise<ScrapeResult> {
  const definition = getDataSourceDefinition(key);
  if (!definition) {
    throw new Error(`Unknown data source: ${key}`);
  }
  switch (key) {
    case "hacker-news":
      return scrapeHackerNews();
    case "github-trending":
      return scrapeGitHubTrending();
    case "coingecko-crypto":
      return scrapeCoinGecko();
    case "stooq-stocks":
      return scrapeStooqStocks();
    case "thesportsdb-events":
      return scrapeSportsEvents();
    default:
      throw new Error(`No scraper implemented for source: ${key}`);
  }
}
