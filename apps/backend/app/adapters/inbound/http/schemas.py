from __future__ import annotations

from pydantic import BaseModel

from ....domain.entities import Sentence, Word


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
