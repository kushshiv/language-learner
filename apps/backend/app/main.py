from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    DeleteGistWordsRequest,
    ExtractSentencesRequest,
    ExtractWordsRequest,
    GistRequest,
    ParseDictionaryRequest,
    SaveGistRequest,
    TranslateBatchRequest,
)
from .services import (
    delete_words_from_gist,
    extract_sentences,
    extract_words,
    load_words_from_gist,
    parse_dictionary,
    parse_pdf,
    save_words_to_gist,
    translate_batch,
)

app = FastAPI(title="Language Learner API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/extract/words")
async def extract_words_route(payload: ExtractWordsRequest):
    words = await extract_words(payload.text, payload.existing_words)
    return {"words": [w.model_dump() for w in words]}


@app.post("/api/v1/extract/sentences")
async def extract_sentences_route(payload: ExtractSentencesRequest):
    sentences = await extract_sentences(payload.text, payload.dictionary_words)
    return {"sentences": [s.model_dump() for s in sentences]}


@app.post("/api/v1/parse/dictionary")
async def parse_dictionary_route(payload: ParseDictionaryRequest):
    words = parse_dictionary(payload.filename, payload.content)
    return {"words": [w.model_dump() for w in words]}


@app.post("/api/v1/translate/batch")
async def translate_batch_route(payload: TranslateBatchRequest):
    translations = await translate_batch(payload.words)
    return {"translations": translations}


@app.post("/api/v1/pdf/text")
async def pdf_text_route(file: UploadFile = File(...)):
    data = await file.read()
    text, page_count = parse_pdf(data)
    return {"text": text, "pageCount": page_count}


@app.post("/api/v1/sync/gist/load")
async def gist_load_route(payload: GistRequest):
    words = await load_words_from_gist(payload.token)
    return {"words": [w.model_dump() for w in words]}


@app.post("/api/v1/sync/gist/save")
async def gist_save_route(payload: SaveGistRequest):
    words = await save_words_to_gist(payload.token, payload.words)
    return {"words": [w.model_dump() for w in words]}


@app.post("/api/v1/sync/gist/delete")
async def gist_delete_route(payload: DeleteGistWordsRequest):
    words = await delete_words_from_gist(payload.token, payload.german_words)
    return {"words": [w.model_dump() for w in words]}
