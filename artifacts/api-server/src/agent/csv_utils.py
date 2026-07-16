# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# src/agent/csv_utils.py
# CSV parsing utilities that correctly handle quoted fields.
#
# IMPORTANT: Never use str.split(",") on raw CSV — quoted fields that contain
# commas will be corrupted.  Always use this module or Python's csv stdlib.
# (Mirrors the TypeScript parseCsv fix in lib/agent-pipeline/src/csv.ts)
# =============================================================================

import csv
import io
from typing import Any


def parse_csv(text: str) -> list[dict[str, Any]]:
    """
    Parse a CSV string into a list of row dicts.
    Handles quoted fields, embedded commas, and newlines correctly.
    """
    reader = csv.DictReader(io.StringIO(text.strip()))
    return [dict(row) for row in reader]


def parse_csv_line(line: str) -> list[str]:
    """
    Parse a single CSV line into a list of field strings.
    Safely handles quoted fields with embedded commas.
    """
    reader = csv.reader(io.StringIO(line))
    return next(reader, [])


def dict_to_csv(rows: list[dict[str, Any]], fieldnames: list[str] | None = None) -> str:
    """
    Serialise a list of row dicts to a CSV string.
    If fieldnames is None, uses the keys of the first row.
    """
    if not rows:
        return ""
    fields = fieldnames or list(rows[0].keys())
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(rows)
    return buf.getvalue()
