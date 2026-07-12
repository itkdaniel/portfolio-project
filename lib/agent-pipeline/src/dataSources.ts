export type DataSourceCategory = "news" | "tech" | "crypto" | "stocks" | "sports";

export interface DataSourceDefinition {
  key: string;
  name: string;
  category: DataSourceCategory;
  baseUrl: string;
  description: string;
}

export const DATA_SOURCE_DEFINITIONS: DataSourceDefinition[] = [
  {
    key: "hacker-news",
    name: "Hacker News Top Stories",
    category: "news",
    baseUrl: "https://hacker-news.firebaseio.com/v0",
    description:
      "Top 20 trending stories from Hacker News (tech/startup news), ranked by community score.",
  },
  {
    key: "github-trending",
    name: "GitHub Trending Repositories",
    category: "tech",
    baseUrl: "https://api.github.com/search/repositories",
    description:
      "Top 20 GitHub repositories created in the last 7 days, ranked by star count.",
  },
  {
    key: "coingecko-crypto",
    name: "CoinGecko Top Cryptocurrencies",
    category: "crypto",
    baseUrl: "https://api.coingecko.com/api/v3",
    description:
      "Top 20 cryptocurrencies by market cap with live price and 24h change.",
  },
  {
    key: "stooq-stocks",
    name: "Stooq Large-Cap Stock Watchlist",
    category: "stocks",
    baseUrl: "https://stooq.com/q/l",
    description:
      "Live quotes for a watchlist of large-cap US stocks (AAPL, MSFT, GOOGL, AMZN, TSLA, NVDA, META).",
  },
  {
    key: "thesportsdb-events",
    name: "TheSportsDB Upcoming Events",
    category: "sports",
    baseUrl: "https://www.thesportsdb.com/api/v1/json/3",
    description: "Upcoming English Premier League fixtures and events.",
  },
];

export function getDataSourceDefinition(key: string): DataSourceDefinition | undefined {
  return DATA_SOURCE_DEFINITIONS.find((d) => d.key === key);
}
