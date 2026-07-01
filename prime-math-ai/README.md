# 📐 Prime AI – Grade 11 Mathematics Assistant

> RAG-powered AI tutor and teaching assistant for Ethiopian Grade 11 Math students and teachers.  
> Built with **OpenAI GPT-4o**, **ChromaDB**, **FastAPI**, and **Streamlit**.

---

## 🗂️ Project Structure

```
prime-math-ai/
├── app/
│   ├── __init__.py
│   ├── main.py          ← FastAPI backend (deploy to Render)
│   └── rag.py           ← Core RAG: retrieval + generation logic
├── streamlit_app/
│   └── app.py           ← Streamlit UI (local testing + optional Render deploy)
├── scripts/
│   └── ingest_textbook.py  ← PDF ingestion script
├── data/
│   └── chroma_db/       ← ChromaDB vector store (auto-created)
├── uploads/             ← Uploaded PDFs (auto-created)
├── .streamlit/
│   └── config.toml      ← Streamlit theme config
├── .env.example         ← Copy to .env and fill in your keys
├── render.yaml          ← Render deployment config
├── Procfile             ← Render fallback start command
└── requirements.txt
```

---

## ⚡ Quick Start

### 1. Clone & Install

```bash
git clone <your-repo>
cd prime-math-ai
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and set your OPENAI_API_KEY
```

### 3. Install System Dependencies (for OCR)

```bash
# Ubuntu/Debian
sudo apt-get install -y tesseract-ocr poppler-utils

# macOS
brew install tesseract poppler

# Windows: download installers from GitHub
```

### 4. Ingest the Textbook PDF

```bash
# Full textbook
python scripts/ingest_textbook.py /path/to/grade11_math.pdf

# Specific page range (useful for testing)
python scripts/ingest_textbook.py /path/to/grade11_math.pdf --start-page 0 --end-page 50
```

This will:
- Extract text from native PDF pages
- OCR scanned/image pages using GPT-4o Vision
- Describe graphs and diagrams using GPT-4o Vision
- Chunk and embed everything into ChromaDB

---

## 🖥️ Running Locally

### Streamlit UI (recommended for testing)

```bash
streamlit run streamlit_app/app.py
# Opens at http://localhost:8501
```

### FastAPI Backend

```bash
uvicorn app.main:app --reload --port 8000
# API at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### Use Streamlit → API (instead of direct RAG)

```bash
# In .env, set:
STREAMLIT_API_BASE_URL=http://localhost:8000

# Then run both:
uvicorn app.main:app --port 8000 &
streamlit run streamlit_app/app.py
```

---

## 🚀 Deploying to Render

### Method A: render.yaml (Recommended)

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New → Blueprint**
3. Connect your GitHub repo — Render will read `render.yaml` automatically
4. Set the `OPENAI_API_KEY` secret in the Render dashboard
5. Deploy!

After the first deploy, update `STREAMLIT_API_BASE_URL` in the Streamlit service's env vars to point to your live API URL (e.g. `https://prime-ai-math-api.onrender.com`).

### Method B: Manual

**FastAPI service:**
- Build: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Add a **Disk** (5GB) mounted at `/opt/render/project/data`
- Set env var: `CHROMA_PERSIST_DIR=/opt/render/project/data/chroma_db`

**Streamlit service (optional):**
- Build: `pip install -r requirements.txt`
- Start: `streamlit run streamlit_app/app.py --server.port $PORT --server.address 0.0.0.0`
- Set env var: `STREAMLIT_API_BASE_URL=https://your-api.onrender.com`

> **Note:** After deploying, ingest the PDF via the API's `/ingest` endpoint or run the script against the Render shell.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/` | Health check |
| GET  | `/health` | DB status + document count |
| GET  | `/topics` | List all indexed topics |
| POST | `/lesson-notes` | Generate lesson notes |
| POST | `/quiz` | Generate a quiz |
| POST | `/lesson-plan` | Generate a teacher lesson plan |
| POST | `/real-life-examples` | Generate real-world examples |
| POST | `/chat` | Multi-turn Q&A with the textbook |
| POST | `/ingest` | Upload & ingest a PDF (background) |

Interactive docs: `http://localhost:8000/docs`

---

## 🌟 Features

| Feature | Description |
|---------|-------------|
| 📋 **Lesson Notes** | Structured notes with objectives, worked examples, formulas |
| 📝 **Quiz Generator** | Multiple-choice quizzes (easy/medium/hard) with answers |
| 🗂️ **Lesson Plan** | Teacher-ready plans with timing, Bloom's taxonomy objectives |
| 🌍 **Real-Life Examples** | Ethiopian-context applications of each topic |
| 💬 **Chat** | Multi-turn Q&A grounded in the actual textbook |
| 🔍 **RAG** | Semantic search over embedded textbook (text + OCR + images) |

---

## 📦 How Scanned Pages Are Handled

1. **Text pages**: PyMuPDF extracts text directly
2. **Scanned/image pages** (< 100 chars extracted): GPT-4o Vision OCRs the page
3. **Embedded images/graphs**: GPT-4o Vision describes each image in detail
4. All content is chunked, embedded via `text-embedding-3-large`, and stored in ChromaDB

---

## 🛠️ Customization

- **Add more topics**: Edit `CHAPTER_KEYWORDS` in `scripts/ingest_textbook.py`
- **Change chunk size**: Edit `MAX_TOKENS_PER_CHUNK` in `ingest_textbook.py`
- **Add new features**: Add a function in `app/rag.py` + a new endpoint in `app/main.py` + a new page in `streamlit_app/app.py`
- **Website integration**: Call the FastAPI endpoints from your website's frontend

---

## 🔑 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | **Required** |
| `OPENAI_MODEL` | GPT model to use | `gpt-4o` |
| `OPENAI_EMBEDDING_MODEL` | Embedding model | `text-embedding-3-large` |
| `CHROMA_PERSIST_DIR` | ChromaDB storage path | `./data/chroma_db` |
| `CHROMA_COLLECTION_NAME` | Collection name | `grade11_math` |
| `STREAMLIT_API_BASE_URL` | API URL for Streamlit | (empty = direct mode) |
