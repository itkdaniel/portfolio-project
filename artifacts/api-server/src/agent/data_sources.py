# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/agent/data_sources.py
# Registry of trending-topic data sources for the agent pipeline.
# Ported from lib/agent-pipeline/src/dataSources.ts.
# =============================================================================

from typing import Any

# Canonical list of data sources.  Each entry mirrors the DataSource ORM model.
DATA_SOURCE_DEFINITIONS: list[dict[str, Any]] = [
    {
        "name": "hacker-news",
        "category": "tech",
        "url": "https://hacker-news.firebaseio.com/v0/topstories.json",
        "description": "Top trending stories from Hacker News",
        "active": True,
    },
    {
        "name": "coin-gecko",
        "category": "crypto",
        "url": "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20",
        "description": "Top 20 cryptocurrencies by market cap (CoinGecko)",
        "active": True,
    },
    {
        "name": "crypto-panic",
        "category": "crypto",
        "url": "https://cryptopanic.com/api/v1/posts/?auth_token=public&kind=news",
        "description": "Crypto news from CryptoPanic",
        "active": True,
    },
]


def get_definition(name: str) -> dict[str, Any] | None:
    """Return the data source definition by name, or None if not found."""
    return next((d for d in DATA_SOURCE_DEFINITIONS if d["name"] == name), None)
