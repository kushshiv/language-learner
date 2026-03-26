from __future__ import annotations

from fastapi import APIRouter, File, UploadFile

from ....adapters.outbound.pdf_client import parse_pdf
from ....adapters.outbound.translation_client import translate_batch
from ....application.use_cases.language_use_cases import extract_sentences, extract_words
from ....application.use_cases.parsing_use_cases import parse_dictionary
from ....application.use_cases.sync_use_cases import delete_words_from_gist, load_words_from_gist, save_words_to_gist
from .schemas import (
    DeleteGistWordsRequest,
    ExtractSentencesRequest,
    ExtractWordsRequest,
    GistRequest,
    ParseDictionaryRequest,
    SaveGistRequest,
    TranslateBatchRequest,
)

router = APIRouter(prefix="/api/v1")


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/extract/words")
async def extract_words_route(payload: ExtractWordsRequest):
    words = await extract_words(payload.text, payload.existing_words)
    return {"words": [w.model_dump() for w in words]}


@router.post("/extract/sentences")
async def extract_sentences_route(payload: ExtractSentencesRequest):
    sentences = await extract_sentences(payload.text, payload.dictionary_words)
    return {"sentences": [s.model_dump() for s in sentences]}


@router.post("/parse/dictionary")
async def parse_dictionary_route(payload: ParseDictionaryRequest):
    words = parse_dictionary(payload.filename, payload.content)
    return {"words": [w.model_dump() for w in words]}


@router.post("/translate/batch")
async def translate_batch_route(payload: TranslateBatchRequest):
    translations = await translate_batch(payload.words)
    return {"translations": translations}


@router.post("/pdf/text")
async def pdf_text_route(file: UploadFile = File(...)):
    data = await file.read()
    text, page_count = parse_pdf(data)
    return {"text": text, "pageCount": page_count}


@router.post("/sync/gist/load")
async def gist_load_route(payload: GistRequest):
    words = await load_words_from_gist(payload.token)
    return {"words": [w.model_dump() for w in words]}


@router.post("/sync/gist/save")
async def gist_save_route(payload: SaveGistRequest):
    words = await save_words_to_gist(payload.token, payload.words)
    return {"words": [w.model_dump() for w in words]}


@router.post("/sync/gist/delete")
async def gist_delete_route(payload: DeleteGistWordsRequest):
    words = await delete_words_from_gist(payload.token, payload.german_words)
    return {"words": [w.model_dump() for w in words]}
