# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/agent/scrape.py
# Async scraper implementations for each data source.
# Ported from lib/agent-pipeline/src/scrape.ts.
# All scrapers use httpx for async HTTP and return a list of record dicts.
# =============================================================================

from typing import Any

import httpx

from src.agent.data_sources import get_definition
from src.config import get_settings

_HEADERS = {"User-Agent": "synaptiq-agent/2.0 (Synaptic Applications)"}


async def _fetch_json(url: str, timeout: int = 30) -> Any:
    """Async HTTP GET with standard headers; raises on non-2xx."""
    async with httpx.AsyncClient(headers=_HEADERS, timeout=timeout) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return resp.json()


# ---------------------------------------------------------------------------
# Per-source scrapers
# ---------------------------------------------------------------------------

async def _scrape_hacker_news() -> list[dict[str, Any]]:
    """Fetch top-20 Hacker News stories with title + score."""
    ids: list[int] = await _fetch_json(
        "https://hacker-news.firebaseio.com/v0/topstories.json"
    )
    top = ids[:20]
    records: list[dict[str, Any]] = []
    async with httpx.AsyncClient(headers=_HEADERS, timeout=10) as client:
        for story_id in top:
            try:
                resp = await client.get(
                    f"https://hacker-news.firebaseio.com/v0/item/{story_id}.json"
                )
                resp.raise_for_status()
                item: dict[str, Any] = resp.json()
                if item and item.get("type") == "story":
                    records.append({
                        "title": item.get("title", ""),
                        "score": item.get("score", 0),
                        "url": item.get("url", ""),
                        "category": "tech",
                        "source": "hacker-news",
                    })
            except Exception:
                continue
    return records


async def _scrape_coin_gecko() -> list[dict[str, Any]]:
    """Fetch top-20 cryptos by market cap from CoinGecko."""
    url = (
        "https://api.coingecko.com/api/v3/coins/markets"
        "?vs_currency=usd&order=market_cap_desc&per_page=20&page=1"
    )
    coins: list[dict[str, Any]] = await _fetch_json(url)
    return [
        {
            "title": coin.get("name", ""),
            "score": int(coin.get("market_cap_rank", 0)),
            "url": f"https://www.coingecko.com/en/coins/{coin.get('id', '')}",
            "category": "crypto",
            "source": "coin-gecko",
            "price_usd": coin.get("current_price"),
            "market_cap": coin.get("market_cap"),
            "price_change_24h": coin.get("price_change_percentage_24h"),
        }
        for coin in coins
    ]


async def _scrape_crypto_panic() -> list[dict[str, Any]]:
    """Fetch latest crypto news from CryptoPanic (public API)."""
    url = "https://cryptopanic.com/api/v1/posts/?auth_token=public&kind=news"
    try:
        data: dict[str, Any] = await _fetch_json(url)
        results: list[dict[str, Any]] = data.get("results", [])
        return [
            {
                "title": item.get("title", ""),
                "score": item.get("votes", {}).get("positive", 0),
                "url": item.get("url", ""),
                "category": "crypto",
                "source": "crypto-panic",
            }
            for item in results[:20]
        ]
    except Exception:
        # CryptoPanic rate-limits aggressively; gracefully return empty on failure
        return []


# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------

_SCRAPERS = {
    "hacker-news": _scrape_hacker_news,
    "coin-gecko": _scrape_coin_gecko,
    "crypto-panic": _scrape_crypto_panic,
}


async def scrape_data_source(source_name: str) -> list[dict[str, Any]]:
    """
    Run the scraper for the given data source name.
    Raises ValueError if the source is unknown.
    """
    scraper = _SCRAPERS.get(source_name)
    if scraper is None:
        raise ValueError(f"No scraper registered for source: {source_name!r}")
    settings = get_settings()
    return await scraper()
