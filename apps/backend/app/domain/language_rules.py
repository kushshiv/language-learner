from __future__ import annotations

VERB_ENDINGS = ["test", "tet", "ten", "te", "est", "et", "en", "st", "t", "n", "e"]
NOUN_ENDINGS = ["ern", "en", "er", "es", "e", "n", "s"]
ADJECTIVE_ENDINGS = ["lich", "isch", "haft", "voll", "sam", "los", "bar", "ig", "e", "en", "er", "es", "em", "n"]


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
