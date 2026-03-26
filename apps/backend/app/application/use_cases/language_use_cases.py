from __future__ import annotations

import re
from typing import Any

from ...adapters.outbound.translation_client import translate_word
from ...domain.entities import Sentence, Word
from ...domain.language_rules import VERB_ENDINGS, extract_article, lemmatize_word


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
