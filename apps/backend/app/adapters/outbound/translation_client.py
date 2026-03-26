from __future__ import annotations

from typing import Any
from urllib.parse import quote

import httpx


async def translate_word(word: str) -> str:
    async with httpx.AsyncClient(timeout=10.0) as client:
        urls: list[tuple[str, dict[str, Any] | None]] = [
            ("https://libretranslate.de/translate", {"q": word, "source": "de", "target": "en", "format": "text"}),
            (f"https://api.mymemory.translated.net/get?q={quote(word)}&langpair=de|en", None),
        ]
        for url, payload in urls:
            try:
                if payload:
                    res = await client.post(url, json=payload)
                    if res.is_success:
                        translated = res.json().get("translatedText")
                        if translated and translated.lower() != word.lower():
                            return translated.strip()
                else:
                    res = await client.get(url)
                    if res.is_success:
                        translated = res.json().get("responseData", {}).get("translatedText")
                        if translated and translated.lower() != word.lower():
                            return translated.strip()
            except Exception:
                continue
    return word[:1].upper() + word[1:].lower()


async def translate_batch(words: list[str]) -> list[str]:
    return [await translate_word(w) for w in words]
