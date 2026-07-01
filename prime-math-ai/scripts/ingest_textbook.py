"""
scripts/ingest_textbook.py
─────────────────────────
Ingests a scanned Grade 11 Math textbook PDF into ChromaDB.
Handles: text extraction, OCR for scanned pages, image/graph captioning via GPT-4o vision.

Cost optimizations:
- Skips decorative images (boxes, borders, dividers) under size threshold
- Skips near-duplicate images using perceptual hashing
- Batches OCR: if page is scanned, skip individual image extraction (OCR covers it)
- Uses 'low' detail for small images, 'high' only for large ones
"""

import os
import base64
import hashlib
import logging
from typing import Optional

import fitz  # PyMuPDF
# chromadb replaced by Qdrant Cloud
from openai import OpenAI
from PIL import Image
import io
import tiktoken
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

# ── Config ───────────────────────────────────────────────────────────────────
OPENAI_API_KEY       = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL         = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
EMBEDDING_MODEL      = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-large")
CHROMA_PERSIST_DIR   = os.getenv("CHROMA_PERSIST_DIR", "./data/chroma_db")
CHROMA_COLLECTION    = os.getenv("CHROMA_COLLECTION_NAME", "grade11_math")
MAX_TOKENS_PER_CHUNK = 800
CHUNK_OVERLAP_TOKENS = 100

# ── Image filtering thresholds ───────────────────────────────────────────────
MIN_IMAGE_BYTES      = 20_000   # skip images under ~20 KB (decorative boxes, borders)
MIN_IMAGE_DIMENSION  = 80       # skip images narrower or shorter than 80px (dividers, icons)
MAX_IMAGES_PER_PAGE  = 5        # only process the largest N images per page (avoids 20-call pages)

client = OpenAI(api_key=OPENAI_API_KEY)
enc    = tiktoken.encoding_for_model("gpt-4o")


# ── Helpers ──────────────────────────────────────────────────────────────────

def pdf_page_to_image_b64(page: fitz.Page, dpi: int = 150) -> str:
    """Render a full PDF page to base64 PNG for OCR.
    Using 150 DPI instead of 200 — still readable, smaller payload."""
    mat = fitz.Matrix(dpi / 72, dpi / 72)
    pix = page.get_pixmap(matrix=mat, colorspace=fitz.csRGB)
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def extract_page_image_b64(page: fitz.Page, img_index: int) -> Optional[tuple[str, int, int, int]]:
    """Extract an embedded image. Returns (b64, width, height, bytes) or None."""
    try:
        doc   = page.parent
        xrefs = page.get_images(full=True)
        if img_index >= len(xrefs):
            return None
        xref  = xrefs[img_index][0]
        base  = doc.extract_image(xref)
        raw   = base["image"]
        image = Image.open(io.BytesIO(raw)).convert("RGB")
        w, h  = image.size
        buf   = io.BytesIO()
        image.save(buf, format="PNG", optimize=True)
        b64   = base64.b64encode(buf.getvalue()).decode("utf-8")
        return b64, w, h, len(raw)
    except Exception as e:
        log.warning(f"Image extraction failed: {e}")
        return None


def is_decorative(w: int, h: int, raw_bytes: int) -> bool:
    """Return True if the image is likely a decorative element, not a math diagram."""
    if raw_bytes < MIN_IMAGE_BYTES:
        return True
    if w < MIN_IMAGE_DIMENSION or h < MIN_IMAGE_DIMENSION:
        return True
    # Very wide + very short = horizontal divider/rule
    if w > 400 and h < 30:
        return True
    # Nearly square and tiny = bullet/icon
    if w < 120 and h < 120:
        return True
    return False


def image_hash(b64: str) -> str:
    """MD5 of raw bytes — catch exact duplicate images appearing multiple times."""
    return hashlib.md5(base64.b64decode(b64)).hexdigest()


def describe_image(b64: str, w: int, h: int, context_hint: str = "") -> str:
    """Describe a math image/graph using vision.
    Uses 'low' detail for smaller images to save tokens."""
    detail = "high" if (w > 400 and h > 300) else "low"
    system = (
        "You are a math education assistant. Describe this image from a Grade 11 "
        "mathematics textbook concisely. Focus on: axes labels, variable names, "
        "key points, equations shown, and the mathematical concept illustrated. "
        "Plain text only, no commentary."
    )
    user_content = []
    if context_hint:
        user_content.append({"type": "text", "text": f"Page context: {context_hint[:200]}"})
    user_content.append({
        "type": "image_url",
        "image_url": {"url": f"data:image/png;base64,{b64}", "detail": detail}
    })
    resp = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user_content}
        ],
        max_tokens=300,  # reduced from 400 — descriptions don't need to be long
    )
    return resp.choices[0].message.content.strip()


def ocr_page(b64: str) -> str:
    """OCR a full scanned page using vision."""
    resp = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": (
                    "This is a scanned page from a Grade 11 mathematics textbook. "
                    "Extract ALL text exactly as it appears. Use LaTeX for equations "
                    "(e.g. $x^2$, $\\frac{a}{b}$). Preserve headings, numbered lists, "
                    "and box labels. Do not add commentary or descriptions."
                )},
                {"type": "image_url", "image_url": {
                    "url": f"data:image/png;base64,{b64}",
                    "detail": "high"   # keep high for OCR accuracy
                }}
            ]
        }],
        max_tokens=2000,
    )
    return resp.choices[0].message.content.strip()


def chunk_text(text: str, source_meta: dict) -> list[dict]:
    tokens  = enc.encode(text)
    chunks  = []
    start   = 0
    chunk_i = 0
    while start < len(tokens):
        end       = min(start + MAX_TOKENS_PER_CHUNK, len(tokens))
        chunk_str = enc.decode(tokens[start:end])
        chunks.append({"text": chunk_str, "metadata": {**source_meta, "chunk_index": chunk_i}})
        chunk_i  += 1
        if end == len(tokens):
            break
        start = end - CHUNK_OVERLAP_TOKENS
    return chunks


def embed_texts(texts: list[str]) -> list[list[float]]:
    BATCH = 100
    all_embeddings = []
    for i in range(0, len(texts), BATCH):
        resp = client.embeddings.create(model=EMBEDDING_MODEL, input=texts[i:i+BATCH])
        all_embeddings.extend([r.embedding for r in resp.data])
    return all_embeddings


# ── Topic detection ──────────────────────────────────────────────────────────

CHAPTER_KEYWORDS = {
    "functions":           ["function", "domain", "range", "mapping", "f(x)"],
    "trigonometry":        ["sin", "cos", "tan", "angle", "radian", "degree", "triangle"],
    "algebra":             ["equation", "solve", "variable", "expression", "polynomial", "factor"],
    "sequences_series":    ["sequence", "series", "arithmetic", "geometric", "nth term", "sigma"],
    "probability":         ["probability", "event", "sample space", "permutation", "combination"],
    "statistics":          ["mean", "median", "mode", "standard deviation", "variance", "data"],
    "analytical_geometry": ["line", "distance", "midpoint", "gradient", "circle", "parabola"],
    "calculus":            ["derivative", "limit", "rate of change", "instantaneous", "tangent"],
    "euclidean_geometry":  ["theorem", "proof", "congruent", "similar", "polygon", "angle"],
    "finance":             ["interest", "depreciation", "annuity", "loan", "compound", "present value"],
}

def detect_topic(text: str) -> str:
    text_lower = text.lower()
    scores = {t: sum(1 for kw in kws if kw in text_lower) for t, kws in CHAPTER_KEYWORDS.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "general"


# ── Main ingestion ────────────────────────────────────────────────────────────

def ingest_pdf(pdf_path: str, start_page: int = 0, end_page: Optional[int] = None,
               progress_callback=None):
    """
    Ingest a PDF into ChromaDB.

    Args:
        pdf_path: Path to the PDF file.
        start_page: 0-indexed start page.
        end_page: 0-indexed end page (None = all pages).
        progress_callback: Optional callable(dict) that receives progress updates:
            {"phase": str, "page": int, "total_pages": int, "chunks": int, "detail": str}
    """
    def _notify(phase, page=0, total_pages=0, chunks=0, detail=""):
        if progress_callback:
            try:
                progress_callback({
                    "phase": phase,
                    "page": page,
                    "total_pages": total_pages,
                    "chunks": chunks,
                    "detail": detail,
                })
            except Exception:
                pass  # Never let callback errors break ingestion

    log.info(f"Opening PDF: {pdf_path}")
    log.info(f"Using model: {OPENAI_MODEL} | Embeddings: {EMBEDDING_MODEL}")
    doc      = fitz.open(pdf_path)
    total    = len(doc)
    end_page = end_page or total
    pages_to_process = min(end_page, total)
    log.info(f"Pages to process: {start_page} → {pages_to_process} (of {total} total)")

    _notify("init", total_pages=pages_to_process - start_page, detail="Opening PDF and connecting to ChromaDB")

    # ── Qdrant Cloud ──
    from app.rag import ensure_collection, get_existing_ids, upsert_chunks as _qdrant_upsert
    ensure_collection()
    existing_ids = get_existing_ids()
    log.info(f"Qdrant ready — {len(existing_ids)} existing chunks in collection")

    all_chunks   = []
    seen_img_hashes = set()  # catch duplicate images across pages
    api_calls    = 0

    for page_num in range(start_page, pages_to_process):
        page       = doc[page_num]
        page_index = page_num - start_page + 1
        total_to_do = pages_to_process - start_page
        log.info(f"Processing page {page_num + 1}/{total}")

        _notify("extracting", page=page_index, total_pages=total_to_do,
                chunks=len(all_chunks), detail=f"Processing page {page_num + 1}")

        # ── Step 1: Text extraction or OCR ──────────────────────────────────
        raw_text  = page.get_text("text").strip()
        is_scanned = len(raw_text) < 100

        if is_scanned:
            log.info(f"  → Scanned page — running OCR")
            _notify("extracting", page=page_index, total_pages=total_to_do,
                    chunks=len(all_chunks), detail=f"OCR on scanned page {page_num + 1}")
            page_b64 = pdf_page_to_image_b64(page)
            raw_text = ocr_page(page_b64)
            api_calls += 1

        if raw_text:
            topic     = detect_topic(raw_text)
            base_meta = {
                "source":     "grade11_math_textbook",
                "page":       page_num + 1,
                "topic":      topic,
                "type":       "text",
                "is_scanned": str(is_scanned),
            }
            for chunk in chunk_text(raw_text, base_meta):
                all_chunks.append(chunk)

        # ── Step 2: Embedded images / graphs ────────────────────────────────
        images = page.get_images(full=True)

        if not images:
            continue

        log.info(f"  → {len(images)} embedded image(s) found — filtering...")

        # Extract metadata for all images first, then sort by size, take top N
        image_candidates = []
        for img_i, _ in enumerate(images):
            result = extract_page_image_b64(page, img_i)
            if not result:
                continue
            b64, w, h, raw_bytes = result

            if is_decorative(w, h, raw_bytes):
                log.info(f"     ✗ Image {img_i}: {w}×{h}px {raw_bytes//1024}KB — decorative, skipped")
                continue

            img_hash = image_hash(b64)
            if img_hash in seen_img_hashes:
                log.info(f"     ✗ Image {img_i}: duplicate, skipped")
                continue

            seen_img_hashes.add(img_hash)
            image_candidates.append((img_i, b64, w, h, raw_bytes))

        # Sort by area (largest first), take only top MAX_IMAGES_PER_PAGE
        image_candidates.sort(key=lambda x: x[2] * x[3], reverse=True)
        image_candidates = image_candidates[:MAX_IMAGES_PER_PAGE]

        if not image_candidates:
            log.info(f"  → No meaningful images after filtering")
            continue

        log.info(f"  → Processing {len(image_candidates)} meaningful image(s)")

        for img_i, b64, w, h, raw_bytes in image_candidates:
            log.info(f"     ✓ Image {img_i}: {w}×{h}px {raw_bytes//1024}KB — describing...")
            _notify("extracting", page=page_index, total_pages=total_to_do,
                    chunks=len(all_chunks), detail=f"Describing image on page {page_num + 1}")
            description = describe_image(b64, w, h, context_hint=raw_text[:200])
            api_calls  += 1
            topic       = detect_topic(description)
            img_meta    = {
                "source":      "grade11_math_textbook",
                "page":        page_num + 1,
                "topic":       topic,
                "type":        "image",
                "image_index": img_i,
                "dimensions":  f"{w}x{h}",
            }
            all_chunks.append({"text": f"[DIAGRAM] {description}", "metadata": img_meta})

    doc.close()
    log.info(f"Total API vision/OCR calls made: {api_calls}")

    _notify("embedding", chunks=len(all_chunks), detail="Deduplicating and preparing embeddings")

    # ── Deduplicate + Upsert into Qdrant Cloud ──────────────────────────────
    seen   = set()
    unique = []
    for chunk in all_chunks:
        uid = hashlib.md5(chunk["text"].encode()).hexdigest()
        if uid not in seen and uid not in existing_ids:
            seen.add(uid)
            unique.append(chunk)

    skipped = len(all_chunks) - len(unique)
    log.info(f"New chunks to embed: {len(unique)} (skipped {skipped} duplicates)")
    _notify("embedding", chunks=len(unique), detail=f"Embedding {len(unique)} new chunks")

    # ── Embed and upsert in batches ──────────────────────────────────────────
    UPSERT_BATCH  = 50
    total_written = 0
    total_batches = (len(unique) + UPSERT_BATCH - 1) // UPSERT_BATCH

    for i in range(0, len(unique), UPSERT_BATCH):
        batch  = unique[i:i+UPSERT_BATCH]
        texts  = [c["text"] for c in batch]
        embeds = embed_texts(texts)
        written = _qdrant_upsert(batch, embeds, existing_ids)
        total_written += written
        batch_num = i // UPSERT_BATCH + 1
        log.info(f"  Upserted batch {batch_num}/{total_batches} ({written} new chunks)")
        _notify("upserting", chunks=total_written,
                detail=f"Upserted batch {batch_num}/{total_batches}")

    final_count = total_written
    log.info(f"✅ Ingestion complete. Added {final_count} new documents to Qdrant.")
    _notify("completed", chunks=final_count,
            detail=f"Done! Added {final_count} new documents. Total in collection growing.")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Ingest Grade 11 Math textbook PDF into ChromaDB")
    parser.add_argument("pdf_path", help="Path to the PDF file")
    parser.add_argument("--start-page", type=int, default=0)
    parser.add_argument("--end-page",   type=int, default=None)
    args = parser.parse_args()
    ingest_pdf(args.pdf_path, args.start_page, args.end_page)