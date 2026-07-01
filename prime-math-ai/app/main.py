"""
app/main.py
───────────
FastAPI backend for Prime AI – Grade 11 Math Assistant.
Deployed on Render. All endpoints consumed by the website and Streamlit app.
"""

import os
import logging
import uuid
import time
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

# ── Lifespan ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("🚀 Prime AI Math API starting up...")
    # Warm up the collection connection
    try:
        from app.rag import get_doc_count
        count = get_doc_count()
        log.info(f"✅ Qdrant ready — {count} documents indexed")
    except Exception as e:
        log.warning(f"ChromaDB not ready yet (run ingest first): {e}")
    yield
    log.info("👋 Prime AI Math API shutting down")


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Prime AI – Grade 11 Math API",
    description="RAG-powered Grade 11 Mathematics assistant for Ethiopian students and teachers.",
    version=os.getenv("APP_VERSION", "1.0.0"),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Restrict to your domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Ingestion status tracking (in-memory) ─────────────────────────────────────
# Maps job_id → {status, phase, page, total_pages, chunks, detail, started_at, ...}
_ingest_jobs: dict[str, dict] = {}


# ── Pydantic Models ───────────────────────────────────────────────────────────

class TopicRequest(BaseModel):
    topic: str = Field(..., example="Trigonometry")
    subtopic: str = Field("", example="Sine Rule")

class QuizRequest(BaseModel):
    topic: str = Field(..., example="Functions")
    difficulty: str = Field("medium", example="hard")  # easy | medium | hard
    num_questions: int = Field(5, ge=3, le=15)

class LessonPlanRequest(BaseModel):
    topic: str = Field(..., example="Sequences and Series")
    duration_minutes: int = Field(80, ge=30, le=180)

class RealLifeRequest(BaseModel):
    topic: str = Field(..., example="Quadratic Functions")
    context_country: str = Field("Ethiopia", example="Ethiopia")

class ChatMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    query: str
    history: list[ChatMessage] = []

class SourceRef(BaseModel):
    page: Optional[int]
    topic: Optional[str] = None

class ContentResponse(BaseModel):
    content: str
    sources: list[SourceRef]
    status: str = "success"


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
async def root():
    return {"message": "Prime AI Grade 11 Math API", "status": "online", "version": os.getenv("APP_VERSION", "1.0.0")}


@app.get("/health", tags=["Health"])
async def health():
    try:
        from app.rag import get_doc_count
        count = get_doc_count()
        return {"status": "healthy", "documents_indexed": count, "vector_store": "qdrant"}
    except Exception as e:
        return JSONResponse(status_code=503, content={"status": "unhealthy", "error": str(e)})


@app.get("/topics", tags=["Info"])
async def list_topics():
    """List all math topics available in the indexed textbook."""
    try:
        from app.rag import get_topics
        topics = get_topics()
        return {"topics": topics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/lesson-notes", response_model=ContentResponse, tags=["Features"])
async def lesson_notes(req: TopicRequest):
    """Generate comprehensive lesson notes for a topic."""
    try:
        from app.rag import generate_lesson_notes
        result = generate_lesson_notes(req.topic, req.subtopic)
        return ContentResponse(content=result["content"], sources=result["sources"])
    except Exception as e:
        log.error(f"lesson_notes error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/quiz", response_model=ContentResponse, tags=["Features"])
async def generate_quiz(req: QuizRequest):
    """Generate a quiz with multiple-choice questions."""
    try:
        from app.rag import generate_quiz
        result = generate_quiz(req.topic, req.difficulty, req.num_questions)
        return ContentResponse(content=result["content"], sources=result["sources"])
    except Exception as e:
        log.error(f"quiz error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/lesson-plan", response_model=ContentResponse, tags=["Features"])
async def lesson_plan(req: LessonPlanRequest):
    """Generate a teacher lesson plan."""
    try:
        from app.rag import generate_lesson_plan
        result = generate_lesson_plan(req.topic, req.duration_minutes)
        return ContentResponse(content=result["content"], sources=result["sources"])
    except Exception as e:
        log.error(f"lesson_plan error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/real-life-examples", response_model=ContentResponse, tags=["Features"])
async def real_life_examples(req: RealLifeRequest):
    """Generate real-life application examples."""
    try:
        from app.rag import generate_real_life_examples
        result = generate_real_life_examples(req.topic, req.context_country)
        return ContentResponse(content=result["content"], sources=result["sources"])
    except Exception as e:
        log.error(f"real_life error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat", response_model=ContentResponse, tags=["Features"])
async def chat(req: ChatRequest):
    """Multi-turn Q&A with the textbook."""
    try:
        from app.rag import chat_with_textbook
        history = [{"role": m.role, "content": m.content} for m in req.history]
        result  = chat_with_textbook(req.query, history)
        return ContentResponse(content=result["content"], sources=result["sources"])
    except Exception as e:
        log.error(f"chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ingest", tags=["Admin"])
async def ingest_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    start_page: int = 0,
    end_page: Optional[int] = None,
):
    """Upload and ingest a PDF textbook (runs in background)."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    upload_dir = "./uploads"
    os.makedirs(upload_dir, exist_ok=True)
    save_path  = os.path.join(upload_dir, file.filename)

    contents = await file.read()
    with open(save_path, "wb") as f:
        f.write(contents)

    job_id = str(uuid.uuid4())[:8]
    _ingest_jobs[job_id] = {
        "status": "starting",
        "phase": "init",
        "page": 0,
        "total_pages": 0,
        "chunks": 0,
        "detail": "Uploading complete, starting ingestion...",
        "filename": file.filename,
        "started_at": time.time(),
    }

    def _progress_cb(update: dict):
        """Called by the ingestion script to report progress."""
        job = _ingest_jobs.get(job_id)
        if job:
            job["status"] = "completed" if update.get("phase") == "completed" else "processing"
            job["phase"] = update.get("phase", job["phase"])
            job["page"] = update.get("page", job["page"])
            job["total_pages"] = update.get("total_pages", job["total_pages"])
            job["chunks"] = update.get("chunks", job["chunks"])
            job["detail"] = update.get("detail", job["detail"])

    def run_ingest():
        try:
            from scripts.ingest_textbook import ingest_pdf as do_ingest
            do_ingest(save_path, start_page, end_page, progress_callback=_progress_cb)
        except Exception as e:
            log.error(f"Ingestion failed for job {job_id}: {e}")
            job = _ingest_jobs.get(job_id)
            if job:
                job["status"] = "failed"
                job["detail"] = f"Error: {str(e)[:200]}"

    background_tasks.add_task(run_ingest)
    log.info(f"🚀 INGEST JOB STARTED | job_id={job_id} | file={file.filename} | pages={start_page}-{end_page or 'all'}")
    return {"message": f"Ingestion started for '{file.filename}'", "status": "processing", "job_id": job_id}


@app.get("/ingest/status", tags=["Admin"])
async def ingest_status(job_id: Optional[str] = None):
    """Check the status of an ingestion job. If no job_id, return the latest job."""
    if not _ingest_jobs:
        return {"status": "no_jobs", "detail": "No ingestion jobs have been started"}

    if job_id and job_id in _ingest_jobs:
        return {"job_id": job_id, **_ingest_jobs[job_id]}

    # Return the most recent job
    latest_id = list(_ingest_jobs.keys())[-1]
    return {"job_id": latest_id, **_ingest_jobs[latest_id]}


@app.get("/ingest/latest", tags=["Admin"])
async def ingest_latest():
    """Always returns the most recent ingest job — use this when job_id was lost due to timeout."""
    if not _ingest_jobs:
        return {"status": "no_jobs", "detail": "No ingestion jobs found. Start one via POST /ingest"}
    latest_id = list(_ingest_jobs.keys())[-1]
    job = _ingest_jobs[latest_id]
    return {
        "job_id":      latest_id,
        "status":      job.get("status"),
        "phase":       job.get("phase"),
        "page":        job.get("page", 0),
        "total_pages": job.get("total_pages", 0),
        "chunks":      job.get("chunks", 0),
        "detail":      job.get("detail", ""),
        "filename":    job.get("filename", ""),
        "started_at":  job.get("started_at"),
        "all_jobs":    list(_ingest_jobs.keys()),
    }


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", 8000)),
        reload=os.getenv("DEBUG", "false").lower() == "true",
    )
