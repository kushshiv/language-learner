from __future__ import annotations

import csv
import io
import json
from typing import Any

from ...domain.entities import Word


def parse_dictionary(filename: str, content: str) -> list[Word]:
    if filename.lower().endswith(".json"):
        payload = json.loads(content)
        items = payload if isinstance(payload, list) else payload.get("words", [])
        return [Word(**_normalize_item(item)) for item in items]
    if filename.lower().endswith(".csv"):
        reader = csv.DictReader(io.StringIO(content))
        words: list[Word] = []
        for row in reader:
            words.append(Word(**_normalize_item(row)))
        return words
    raise ValueError("Unsupported file format. Please upload a JSON or CSV file.")


def _normalize_item(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "german": str(item.get("german", "")).strip(),
        "english": str(item.get("english", "")).strip(),
        "type": str(item.get("type", "")).strip().lower(),
        "example": str(item.get("example", "")).strip(),
        "context": str(item.get("context")).strip() if item.get("context") else None,
        "article": str(item.get("article")).strip().lower() if item.get("article") else None,
    }
