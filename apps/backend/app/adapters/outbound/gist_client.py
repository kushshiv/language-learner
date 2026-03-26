from __future__ import annotations

import json
from typing import Any

import httpx

from ...domain.entities import Word

GIST_FILENAME = "german-words.json"
GIST_DESCRIPTION = "German Language Learner - Word Database"


async def _github_request(token: str, method: str, path: str, body: dict[str, Any] | None = None) -> Any:
    async with httpx.AsyncClient(timeout=20.0) as client:
        res = await client.request(
            method,
            f"https://api.github.com{path}",
            headers={"Authorization": f"token {token}", "Accept": "application/vnd.github.v3+json"},
            json=body,
        )
        res.raise_for_status()
        return res.json()


async def load_words_from_gist(token: str) -> list[Word]:
    gists = await _github_request(token, "GET", "/gists")
    target = next((g for g in gists if g.get("description") == GIST_DESCRIPTION and g.get("files", {}).get(GIST_FILENAME)), None)
    if not target:
        return []
    gist = await _github_request(token, "GET", f"/gists/{target['id']}")
    content = gist.get("files", {}).get(GIST_FILENAME, {}).get("content", "[]")
    raw = json.loads(content)
    return [Word(**w) for w in raw]


async def save_words_to_gist(token: str, words: list[Word]) -> list[Word]:
    gists = await _github_request(token, "GET", "/gists")
    target = next((g for g in gists if g.get("description") == GIST_DESCRIPTION and g.get("files", {}).get(GIST_FILENAME)), None)
    body = {
        "description": GIST_DESCRIPTION,
        "public": False,
        "files": {GIST_FILENAME: {"content": json.dumps([w.model_dump() for w in words], ensure_ascii=False, indent=2)}},
    }
    if target:
        await _github_request(token, "PATCH", f"/gists/{target['id']}", body)
    else:
        await _github_request(token, "POST", "/gists", body)
    return words


async def delete_words_from_gist(token: str, german_words: list[str]) -> list[Word]:
    words = await load_words_from_gist(token)
    lookup = {g.lower().strip() for g in german_words}
    remaining = [w for w in words if w.german.lower().strip() not in lookup]
    await save_words_to_gist(token, remaining)
    return remaining
