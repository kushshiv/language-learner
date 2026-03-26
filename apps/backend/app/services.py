from __future__ import annotations

import csv
import io
import json
import re
from urllib.parse import quote
from typing import Any

import httpx
from pypdf import PdfReader

from .models import Sentence, Word

VERB_ENDINGS = ["test", "tet", "ten", "te", "est", "et", "en", "st", "t", "n", "e"]
NOUN_ENDINGS = ["ern", "en", "er", "es", "e", "n", "s"]
ADJECTIVE_ENDINGS = ["lich", "isch", "haft", "voll", "sam", "los", "bar", "ig", "e", "en", "er", "es", "em", "n"]

GIST_FILENAME = "german-words.json"
GIST_DESCRIPTION = "German Language Learner - Word Database"


def lemmatize_word(word: str, word_type: str) -> str:
    lower = word.lower()
    if word_type == "verb":
        if lower.endswith("en") and len(lower) > 3:
            return lower
        for ending in VERB_ENDINGS:
            if lower.endswith(ending) and len(lower) > len(ending) + 2:
                return lower[: -len(ending)] + "en"
        return lower if lower.endswith("en") else f"{lower}en"
    if word_type == "noun":
        for ending in NOUN_ENDINGS:
            if lower.endswith(ending) and len(lower) > len(ending) + 2:
                stem = lower[: -len(ending)]
                if len(stem) >= 3:
                    return stem[0].upper() + stem[1:]
        return word[:1].upper() + word[1:].lower()
    for ending in ADJECTIVE_ENDINGS:
        if lower.endswith(ending) and len(lower) > len(ending) + 2:
            stem = lower[: -len(ending)]
            if len(stem) >= 3:
                return stem
    return lower


def extract_article(word: str, context: str, word_type: str) -> str | None:
    if word_type != "noun":
        return None
    lower_context = context.lower()
    index = lower_context.find(word.lower())
    if index == -1:
        return None
    before = lower_context[max(0, index - 15) : index].strip() + " "
    if before.endswith("der "):
        return "der"
    if before.endswith("die "):
        return "die"
    if before.endswith("das "):
        return "das"
    return None


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


async def extract_words(text: str, existing_words: list[Word]) -> list[Word]:
    existing = {w.german.lower().strip() for w in existing_words}
    sentences = [s.strip() for s in re.split(r"[.!?]+", re.sub(r"[^\w\säöüÄÖÜß]", " ", text)) if s.strip()]
    found: dict[str, Word] = {}

    for sentence in sentences:
        tokens = [t.strip() for t in sentence.split() if 2 < len(t) < 20]
        for token in tokens:
            clean = re.sub(r"[^\wäöüÄÖÜß]", "", token)
            if len(clean) < 3:
                continue
            lower = clean.lower()
            word_type: str | None = None
            if token[:1].isalpha() and token[:1] == token[:1].upper():
                word_type = "noun"
            elif any(lower.endswith(e) for e in VERB_ENDINGS):
                word_type = "verb"
            elif any(lower.endswith(e) for e in ["ig", "lich", "isch", "bar", "sam", "los", "voll", "haft"]):
                word_type = "adjective"
            if not word_type:
                continue
            lemma = lemmatize_word(clean, word_type)
            key = lemma.lower().strip()
            if key in found or key in existing:
                continue
            eng = await translate_word(lemma)
            found[key] = Word(
                german=lemma,
                english=eng,
                type=word_type,
                example=sentence[:50],
                context=sentence,
                article=extract_article(clean, sentence, word_type),
            )
    return list(found.values())[:100]


async def extract_sentences(text: str, dictionary_words: list[Word]) -> list[Sentence]:
    dictionary = {w.german.lower().strip(): w for w in dictionary_words}
    raw = [s.strip() for s in re.split(r"([.!?]+[\s\n]|[\n]{2,})", text) if 10 < len(s.strip()) < 500]
    result: list[Sentence] = []
    for i, original in enumerate(raw):
        if len(original) < 5:
            continue
        words: list[Word] = []
        seen: set[str] = set()
        for token in original.split():
            key = re.sub(r"[^\wäöüÄÖÜß]", "", token).lower()
            if len(key) < 3 or key in seen:
                continue
            if key in dictionary:
                words.append(dictionary[key])
                seen.add(key)
        translation = await translate_word(original)
        result.append(Sentence(original=original, translation=translation, words=words, index=i))
    return result


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


def parse_pdf(file_bytes: bytes) -> tuple[str, int]:
    reader = PdfReader(io.BytesIO(file_bytes))
    text = " ".join(page.extract_text() or "" for page in reader.pages).strip()
    return text, len(reader.pages)


async def translate_batch(words: list[str]) -> list[str]:
    return [await translate_word(w) for w in words]


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
