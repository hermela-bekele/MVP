"""
app/rag.py — Qdrant Cloud version
Replaces ChromaDB (which requires Render persistent disk) with
Qdrant Cloud (free hosted, survives Render restarts permanently).
"""

import os
import json
import hashlib
import logging
import shelve
from typing import Optional

from openai import OpenAI
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    Filter, FieldCondition, MatchValue
)

load_dotenv()
log = logging.getLogger(__name__)

OPENAI_API_KEY   = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL     = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
EMBEDDING_MODEL  = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-large")
EMBEDDING_DIM    = 3072   # text-embedding-3-large dimension

QDRANT_URL       = os.getenv("QDRANT_URL", "").strip()
QDRANT_API_KEY   = os.getenv("QDRANT_API_KEY", "").strip()
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "grade11_math")

REDIS_URL        = os.getenv("REDIS_URL", "").strip()
CACHE_TTL        = int(os.getenv("CACHE_TTL_SECONDS", 0))
LOCAL_CACHE_PATH = "./data/response_cache"

_openai_client = None
_qdrant_client = None
_redis_client  = None


# ── Clients ───────────────────────────────────────────────────────────────────

def get_openai_client() -> OpenAI:
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAI(api_key=OPENAI_API_KEY)
    return _openai_client


def get_qdrant_client() -> QdrantClient:
    global _qdrant_client
    if _qdrant_client is None:
        if not QDRANT_URL:
            raise RuntimeError("QDRANT_URL env var not set. Add it in Render Environment vars.")
        _qdrant_client = QdrantClient(
            url=QDRANT_URL,
            api_key=QDRANT_API_KEY or None,
        )
        log.info("✅ Qdrant connected: %s", QDRANT_URL[:40])
    return _qdrant_client


def ensure_collection():
    """Create the Qdrant collection if it doesn't exist yet."""
    client = get_qdrant_client()
    existing = [c.name for c in client.get_collections().collections]
    if QDRANT_COLLECTION not in existing:
        client.create_collection(
            collection_name=QDRANT_COLLECTION,
            vectors_config=VectorParams(
                size=EMBEDDING_DIM,
                distance=Distance.COSINE,
            ),
        )
        log.info("✅ Created Qdrant collection: %s", QDRANT_COLLECTION)
    return client


def get_doc_count() -> int:
    try:
        client = get_qdrant_client()
        info = client.get_collection(QDRANT_COLLECTION)
        return info.points_count or 0
    except Exception:
        return 0


def get_existing_ids() -> set:
    """Return all existing point IDs — used by ingest to skip duplicates."""
    try:
        client = get_qdrant_client()
        ids = set()
        offset = None
        while True:
            result, next_offset = client.scroll(
                collection_name=QDRANT_COLLECTION,
                limit=1000,
                offset=offset,
                with_payload=False,
                with_vectors=False,
            )
            for p in result:
                ids.add(str(p.id))
            if next_offset is None:
                break
            offset = next_offset
        return ids
    except Exception:
        return set()


# ── Cache ─────────────────────────────────────────────────────────────────────

def _get_redis():
    global _redis_client
    if _redis_client is None and REDIS_URL:
        try:
            import redis
            _redis_client = redis.from_url(
                REDIS_URL, decode_responses=True,
                socket_connect_timeout=3, socket_timeout=3
            )
            _redis_client.ping()
            log.info("✅ Redis connected")
        except Exception as e:
            log.warning("Redis unavailable, using local cache: %s", e)
            _redis_client = None
    return _redis_client


def cache_key(feature: str, **kwargs) -> str:
    normalized = {
        k: v.lower().strip() if isinstance(v, str) else v
        for k, v in kwargs.items()
    }
    payload = json.dumps({"feature": feature, **normalized}, sort_keys=True)
    return "prime:" + hashlib.md5(payload.encode()).hexdigest()


def cache_get(key: str) -> Optional[dict]:
    r = _get_redis()
    if r:
        try:
            raw = r.get(key)
            if raw:
                log.info("🔵 Cache HIT (Redis): %s", key[:20])
                return json.loads(raw)
        except Exception as e:
            log.warning("Redis get error: %s", e)
    else:
        try:
            os.makedirs("./data", exist_ok=True)
            with shelve.open(LOCAL_CACHE_PATH) as db:
                val = db.get(key)
                if val:
                    log.info("🟡 Cache HIT (local): %s", key[:20])
                    return val
        except Exception:
            pass
    return None


def cache_set(key: str, value: dict):
    r = _get_redis()
    if r:
        try:
            serialized = json.dumps(value)
            if CACHE_TTL == 0:
                r.set(key, serialized)
            else:
                r.setex(key, CACHE_TTL, serialized)
            log.info("🔵 Cache SET (Redis): %s", key[:20])
        except Exception as e:
            log.warning("Redis set error: %s", e)
    else:
        try:
            os.makedirs("./data", exist_ok=True)
            with shelve.open(LOCAL_CACHE_PATH) as db:
                db[key] = value
            log.info("🟡 Cache SET (local): %s", key[:20])
        except Exception:
            pass


def cache_stats() -> dict:
    r = _get_redis()
    if r:
        try:
            keys = r.keys("prime:*")
            info = r.info("memory")
            return {
                "backend":     "redis",
                "total_keys":  len(keys),
                "used_memory": info.get("used_memory_human", "?"),
                "ttl_seconds": CACHE_TTL,
            }
        except Exception as e:
            return {"backend": "redis", "error": str(e)}
    return {"backend": "local_shelve"}


def cache_clear():
    r = _get_redis()
    if r:
        try:
            keys = r.keys("prime:*")
            if keys:
                r.delete(*keys)
        except Exception:
            pass
    else:
        try:
            import glob
            for f in glob.glob(f"{LOCAL_CACHE_PATH}*"):
                os.remove(f)
        except Exception:
            pass


# ── Ingest helpers (called by ingest_textbook.py) ─────────────────────────────

def upsert_chunks(chunks: list[dict], embeddings: list[list[float]], existing_ids: set) -> int:
    """
    Write chunks to Qdrant. Returns number of new chunks written.
    chunks: list of {"text":..., "metadata":{page, topic, type, ...}}
    embeddings: parallel list of embedding vectors
    existing_ids: set of IDs already in Qdrant (for deduplication)
    """
    client = ensure_collection()
    points = []
    skipped = 0

    for chunk, vector in zip(chunks, embeddings):
        uid = hashlib.md5(chunk["text"].encode()).hexdigest()
        if uid in existing_ids:
            skipped += 1
            continue
        # Qdrant needs an integer or UUID — use first 16 hex chars as UUID-like int
        point_id = int(uid[:16], 16)
        points.append(PointStruct(
            id=point_id,
            vector=vector,
            payload={
                "text":     chunk["text"],
                "page":     chunk["metadata"].get("page"),
                "topic":    chunk["metadata"].get("topic", "general"),
                "type":     chunk["metadata"].get("type", "text"),
                "source":   chunk["metadata"].get("source", ""),
            }
        ))
        existing_ids.add(uid)

    if points:
        client.upsert(collection_name=QDRANT_COLLECTION, points=points)
        log.info("💾 Upserted %d new chunks (%d skipped as duplicates)", len(points), skipped)

    return len(points)


# ── Retrieval ─────────────────────────────────────────────────────────────────

def embed_query(query: str) -> list[float]:
    resp = get_openai_client().embeddings.create(
        model=EMBEDDING_MODEL, input=[query]
    )
    return resp.data[0].embedding


def retrieve(query: str, n_results: int = 6, topic_filter: Optional[str] = None) -> list[dict]:
    client = get_qdrant_client()
    count  = get_doc_count()

    if count == 0:
        log.warning("⚠️ Qdrant collection is EMPTY — no documents indexed yet!")
        return []

    q_embed = embed_query(query)
    kwargs = dict(
        collection_name=QDRANT_COLLECTION,
        query=q_embed,
        limit=min(n_results, count),
        with_payload=True,
    )
    if topic_filter:
        kwargs["query_filter"] = Filter(
            must=[FieldCondition(key="topic", match=MatchValue(value=topic_filter))]
        )

    results = client.query_points(**kwargs).points
    chunks  = []
    for r in results:
        log.info("  📄 Page %s | Topic: %s | Score: %.3f",
                 r.payload.get("page","?"), r.payload.get("topic","?"), r.score)
        chunks.append({
            "text":     r.payload.get("text", ""),
            "metadata": r.payload,
            "distance": 1 - r.score,   # cosine distance from similarity score
        })
    return chunks


def build_context(chunks: list[dict]) -> str:
    if not chunks:
        return "(No textbook content found — answering from general knowledge)"
    parts = []
    for i, c in enumerate(chunks, 1):
        m     = c["metadata"]
        label = f"[Chunk {i} | Page {m.get('page','?')} | Topic: {m.get('topic','?')}]"
        parts.append(f"{label}\n{c['text']}")
    return "\n\n---\n\n".join(parts)


def get_topics() -> list[str]:
    """Return distinct topics stored in Qdrant."""
    try:
        client = get_qdrant_client()
        # Scroll and collect unique topics
        topics = set()
        offset = None
        while True:
            result, next_offset = client.scroll(
                collection_name=QDRANT_COLLECTION,
                limit=500,
                offset=offset,
                with_payload=["topic"],
                with_vectors=False,
            )
            for p in result:
                t = p.payload.get("topic")
                if t:
                    topics.add(t)
            if next_offset is None:
                break
            offset = next_offset
        return sorted(topics)
    except Exception:
        return []


# ── System prompt ─────────────────────────────────────────────────────────────

SYSTEM_BASE = """You are Prime AI, an expert Grade 11 Mathematics tutor for Ethiopian students.
You have access to the official Grade 11 Math textbook content.
Always be clear, step-by-step, and encouraging. Use LaTeX notation for equations (wrap in $ or $$).
Cite page numbers when referencing textbook content.
If the provided textbook content does not cover the question, say so clearly and answer from general Grade 11 Math knowledge."""


# ── Feature functions ─────────────────────────────────────────────────────────

def generate_lesson_notes(topic: str, subtopic: str = "") -> dict:
    key    = cache_key("lesson_notes", topic=topic, subtopic=subtopic)
    cached = cache_get(key)
    if cached:
        return {**cached, "from_cache": True}

    chunks  = retrieve(f"{topic} {subtopic} definition formula examples", n_results=8)
    context = build_context(chunks)
    prompt  = f"""Using the textbook content below, generate comprehensive LESSON NOTES for:
Topic: {topic}
Subtopic: {subtopic or 'General Overview'}

Structure your notes as:
1. **Learning Objectives** (3-5 bullet points)
2. **Key Concepts & Definitions** (with LaTeX formulas)
3. **Worked Examples** (at least 3, step-by-step)
4. **Important Rules / Theorems**
5. **Common Mistakes to Avoid**
6. **Summary**

TEXTBOOK CONTENT:
{context}"""

    resp = get_openai_client().chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_BASE},
            {"role": "user",   "content": prompt},
        ],
        max_tokens=2000, temperature=0.3,
    )
    result = {
        "content":    resp.choices[0].message.content,
        "sources":    [{"page": c["metadata"].get("page"), "topic": c["metadata"].get("topic")} for c in chunks],
        "from_cache": False,
    }
    cache_set(key, result)
    return result


def generate_quiz(topic: str, difficulty: str = "medium", num_questions: int = 5) -> dict:
    key    = cache_key("quiz", topic=topic, difficulty=difficulty, num_questions=num_questions)
    cached = cache_get(key)
    if cached:
        return {**cached, "from_cache": True}

    chunks  = retrieve(f"{topic} problems exercises questions", n_results=8)
    context = build_context(chunks)
    prompt  = f"""Using the textbook content below, create a {difficulty.upper()} difficulty quiz on: {topic}
Generate exactly {num_questions} questions.

Format EACH question EXACTLY like this:
Q[N]: [Question text]
A) [Option 1]
B) [Option 2]
C) [Option 3]
D) [Option 4]
✓ Correct: [Letter] — [Brief explanation]

TEXTBOOK CONTENT:
{context}"""

    resp = get_openai_client().chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_BASE},
            {"role": "user",   "content": prompt},
        ],
        max_tokens=2000, temperature=0.5,
    )
    result = {
        "content":    resp.choices[0].message.content,
        "sources":    [{"page": c["metadata"].get("page")} for c in chunks],
        "from_cache": False,
    }
    cache_set(key, result)
    return result


def generate_lesson_plan(topic: str, duration_minutes: int = 80) -> dict:
    key    = cache_key("lesson_plan", topic=topic, duration_minutes=duration_minutes)
    cached = cache_get(key)
    if cached:
        return {**cached, "from_cache": True}

    chunks  = retrieve(f"{topic} lesson objectives activities", n_results=6)
    context = build_context(chunks)
    prompt  = f"""Create a detailed LESSON PLAN for a Grade 11 Math teacher:
Topic: {topic} | Duration: {duration_minutes} minutes

1. **Lesson Information**
2. **Learning Objectives** (Bloom's Taxonomy)
3. **Materials & Resources**
4. **Lesson Outline** (time-boxed)
5. **Assessment Strategies**
6. **Differentiation**
7. **Homework Assignment**

TEXTBOOK CONTENT:
{context}"""

    resp = get_openai_client().chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_BASE},
            {"role": "user",   "content": prompt},
        ],
        max_tokens=2000, temperature=0.3,
    )
    result = {
        "content":    resp.choices[0].message.content,
        "sources":    [{"page": c["metadata"].get("page")} for c in chunks],
        "from_cache": False,
    }
    cache_set(key, result)
    return result


def generate_real_life_examples(topic: str, context_country: str = "Ethiopia") -> dict:
    key    = cache_key("real_life", topic=topic, context_country=context_country)
    cached = cache_get(key)
    if cached:
        return {**cached, "from_cache": True}

    chunks  = retrieve(f"{topic} application real world", n_results=5)
    context = build_context(chunks)
    prompt  = f"""Generate 5 real-life examples of "{topic}" from Grade 11 Math,
relevant to {context_country} and East Africa.

For each:
- **Example [N]: [Title]**
- 🌍 **Context**: Real-world setting
- 📐 **The Math**: Equations and formulas
- 💡 **Why It Matters**
- 🔢 **Mini Problem**

TEXTBOOK CONTENT:
{context}"""

    resp = get_openai_client().chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_BASE},
            {"role": "user",   "content": prompt},
        ],
        max_tokens=2000, temperature=0.7,
    )
    result = {
        "content":    resp.choices[0].message.content,
        "sources":    [{"page": c["metadata"].get("page")} for c in chunks],
        "from_cache": False,
    }
    cache_set(key, result)
    return result


def chat_with_textbook(query: str, history: list[dict] = None) -> dict:
    key    = cache_key("chat", query=query)
    cached = cache_get(key)
    if cached:
        log.info("💬 Chat cache HIT: %s...", query[:50])
        return {**cached, "from_cache": True}

    chunks   = retrieve(query, n_results=6)
    context  = build_context(chunks)
    messages = [{"role": "system", "content": SYSTEM_BASE}]
    if history:
        for h in history[-6:]:
            messages.append({"role": h["role"], "content": h["content"]})
    messages.append({
        "role": "user",
        "content": f"QUESTION: {query}\n\nRELEVANT TEXTBOOK CONTENT:\n{context}\n\nProvide a clear step-by-step answer with LaTeX equations.",
    })

    resp = get_openai_client().chat.completions.create(
        model=OPENAI_MODEL,
        messages=messages,
        max_tokens=1500, temperature=0.2,
    )
    result = {
        "content":    resp.choices[0].message.content,
        "sources":    [{"page": c["metadata"].get("page"), "topic": c["metadata"].get("topic")} for c in chunks],
        "from_cache": False,
    }
    cache_set(key, result)
    return result
