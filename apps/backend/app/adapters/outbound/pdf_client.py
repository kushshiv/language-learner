from __future__ import annotations

import io

from pypdf import PdfReader


def parse_pdf(file_bytes: bytes) -> tuple[str, int]:
    reader = PdfReader(io.BytesIO(file_bytes))
    text = " ".join(page.extract_text() or "" for page in reader.pages).strip()
    return text, len(reader.pages)
