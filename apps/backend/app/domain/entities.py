from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel

Article = Literal["der", "die", "das"]


class Word(BaseModel):
    german: str
    english: str
    type: str
    example: str
    context: Optional[str] = None
    article: Optional[Article] = None
    needsReview: Optional[bool] = None


class Sentence(BaseModel):
    original: str
    translation: str
    words: list[Word]
    index: int
