from typing import Literal

from pydantic import BaseModel


Article = Literal["der", "die", "das"]


class Word(BaseModel):
    german: str
    english: str
    type: str
    example: str
    context: str | None = None
    article: Article | None = None
    needsReview: bool | None = None


class Sentence(BaseModel):
    original: str
    translation: str
    words: list[Word]
    index: int


class ExtractWordsRequest(BaseModel):
    text: str
    existing_words: list[Word] = []


class ExtractSentencesRequest(BaseModel):
    text: str
    dictionary_words: list[Word] = []


class ParseDictionaryRequest(BaseModel):
    filename: str
    content: str


class TranslateBatchRequest(BaseModel):
    words: list[str]


class GistRequest(BaseModel):
    token: str


class SaveGistRequest(GistRequest):
    words: list[Word]


class DeleteGistWordsRequest(GistRequest):
    german_words: list[str]
