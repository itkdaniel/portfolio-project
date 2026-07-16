# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/agent/process.py
# Feature extraction: converts scraped records into a feature row list.
# Ported from lib/agent-pipeline/src/process.ts.
# =============================================================================

from typing import Any


def process_records(
    feature_names: list[str],
    records: list[dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    """
    Extract specified feature columns from raw scraped records.

    If no records are provided (e.g. when re-processing from stored data),
    returns a minimal synthetic row set for demonstration purposes.

    Parameters
    ----------
    feature_names : list[str]
        Column names to extract (e.g. ["title", "score", "category"]).
    records : list[dict] | None
        Raw scraped records.  None triggers synthetic fallback.

    Returns
    -------
    list[dict[str, Any]]
        Rows with exactly the requested feature columns (missing → None).
    """
    if not records:
        # Synthetic fallback for demonstration when no in-memory records exist
        return [
            {name: f"synthetic_{name}_{i}" for name in feature_names}
            for i in range(10)
        ]

    rows: list[dict[str, Any]] = []
    for rec in records:
        row = {name: rec.get(name) for name in feature_names}
        rows.append(row)
    return rows
