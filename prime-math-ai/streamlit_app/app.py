"""
streamlit_app/app.py
────────────────────
Streamlit frontend for Prime AI – Grade 11 Math Assistant.
Can run against the local RAG module directly OR against the deployed API.
"""

import os
import sys
import requests
import streamlit as st
from dotenv import load_dotenv

load_dotenv()

# ── Path setup so we can import app.rag directly ──────────────────────────────
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

API_BASE  = os.getenv("STREAMLIT_API_BASE_URL", "")
USE_API   = bool(API_BASE)  # If set, call the REST API; otherwise call rag.py directly

# ── Page config ───────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Prime AI – Grade 11 Math",
    page_icon="📐",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Custom CSS ────────────────────────────────────────────────────────────────
st.markdown("""
<style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap');
  
  html, body, [class*="css"] { font-family: 'Space Grotesk', sans-serif; }
  
  .main-header {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    padding: 2rem 2rem 1.5rem;
    border-radius: 12px;
    margin-bottom: 1.5rem;
    color: white;
    text-align: center;
  }
  .main-header h1 { font-size: 2.2rem; margin: 0; font-weight: 700; }
  .main-header p  { margin: 0.4rem 0 0; opacity: 0.75; }
  
  .feature-card {
    background: #f8f9ff;
    border: 1px solid #e0e4ff;
    border-left: 4px solid #5c67f2;
    border-radius: 8px;
    padding: 1rem 1.2rem;
    margin-bottom: 1rem;
  }
  .source-badge {
    display: inline-block;
    background: #eef0ff;
    color: #5c67f2;
    border-radius: 20px;
    padding: 2px 10px;
    font-size: 0.78rem;
    margin: 2px;
    font-weight: 600;
  }
  .stButton>button {
    background: linear-gradient(135deg, #5c67f2, #7b2ff7);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    padding: 0.5rem 1.5rem;
    transition: opacity 0.2s;
  }
  .stButton>button:hover { opacity: 0.88; }
  
  .chat-user    { background: #5c67f2; color: white; padding: 0.7rem 1rem; border-radius: 12px 12px 4px 12px; margin: 0.4rem 0; text-align: right; }
  .chat-ai      { background: #f0f2ff; color: #1a1a2e; padding: 0.7rem 1rem; border-radius: 12px 12px 12px 4px; margin: 0.4rem 0; }
</style>
""", unsafe_allow_html=True)


# ── Helper: call API or RAG directly ─────────────────────────────────────────

def api_post(endpoint: str, payload: dict) -> dict:
    if USE_API:
        resp = requests.post(f"{API_BASE}{endpoint}", json=payload, timeout=120)
        resp.raise_for_status()
        return resp.json()
    else:
        # Direct import
        from app.rag import (
            generate_lesson_notes, generate_quiz,
            generate_lesson_plan, generate_real_life_examples, chat_with_textbook
        )
        mapping = {
            "/lesson-notes":      lambda p: generate_lesson_notes(p["topic"], p.get("subtopic","")),
            "/quiz":              lambda p: generate_quiz(p["topic"], p.get("difficulty","medium"), p.get("num_questions",5)),
            "/lesson-plan":       lambda p: generate_lesson_plan(p["topic"], p.get("duration_minutes",80)),
            "/real-life-examples":lambda p: generate_real_life_examples(p["topic"], p.get("context_country","Ethiopia")),
            "/chat":              lambda p: chat_with_textbook(p["query"], p.get("history",[])),
        }
        return mapping[endpoint](payload)


def render_sources(sources: list):
    if not sources:
        return
    st.markdown("**📚 Sources:**")
    for s in sources:
        page  = s.get("page") or s.get("page_num")
        topic = s.get("topic", "")
        label = f"Pg. {page}" if page else "Textbook"
        if topic:
            label += f" · {topic.replace('_',' ').title()}"
        st.markdown(f'<span class="source-badge">{label}</span>', unsafe_allow_html=True)


# ── Sidebar ───────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("## 📐 Prime AI")
    st.markdown("**Grade 11 Mathematics**")
    st.divider()

    TOPICS = [
        "Functions", "Trigonometry", "Algebra", "Sequences & Series",
        "Probability", "Statistics", "Analytical Geometry",
        "Calculus (Introduction)", "Euclidean Geometry", "Financial Mathematics"
    ]

    selected_topic = st.selectbox("📌 Select Topic", TOPICS)
    st.divider()

    page = st.radio("🧭 Feature", [
        "📋 Lesson Notes",
        "📝 Quiz Generator",
        "🗂️ Lesson Plan",
        "🌍 Real-Life Examples",
        "💬 Ask the Textbook",
        "⚙️ Admin / Ingest",
    ])

    st.divider()
    if USE_API:
        st.success(f"🌐 API Mode\n`{API_BASE}`")
    else:
        st.info("💾 Local Mode (Direct RAG)")

    st.markdown("---")
    st.caption("© Prime AI · Ethiopia")


# ── Header ────────────────────────────────────────────────────────────────────
st.markdown("""
<div class="main-header">
  <h1>📐 Prime AI – Grade 11 Mathematics</h1>
  <p>Your AI-powered Ethiopian math tutor & teaching assistant</p>
</div>
""", unsafe_allow_html=True)


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE: Lesson Notes
# ═══════════════════════════════════════════════════════════════════════════════
if page == "📋 Lesson Notes":
    st.subheader("📋 Lesson Notes Generator")
    st.markdown("Generate detailed, textbook-aligned lesson notes for any Grade 11 math topic.")

    col1, col2 = st.columns([2, 1])
    with col1:
        topic    = st.text_input("Topic", value=selected_topic)
        subtopic = st.text_input("Subtopic (optional)", placeholder="e.g. Sine Rule, Compound Interest")
    with col2:
        st.markdown("<br>", unsafe_allow_html=True)
        generate = st.button("✨ Generate Lesson Notes", use_container_width=True)

    if generate and topic:
        with st.spinner("📖 Retrieving from textbook and generating notes..."):
            try:
                result = api_post("/lesson-notes", {"topic": topic, "subtopic": subtopic})
                st.markdown('<div class="feature-card">', unsafe_allow_html=True)
                st.markdown(result["content"])
                st.markdown('</div>', unsafe_allow_html=True)
                render_sources(result.get("sources", []))
                st.download_button(
                    "💾 Download Notes",
                    data=result["content"],
                    file_name=f"lesson_notes_{topic.replace(' ','_')}.md",
                    mime="text/markdown"
                )
            except Exception as e:
                st.error(f"Error: {e}")


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE: Quiz Generator
# ═══════════════════════════════════════════════════════════════════════════════
elif page == "📝 Quiz Generator":
    st.subheader("📝 Quiz Generator")
    st.markdown("Auto-generate multiple-choice quizzes from the textbook.")

    col1, col2, col3 = st.columns(3)
    with col1:
        topic = st.text_input("Topic", value=selected_topic, key="quiz_topic")
    with col2:
        difficulty = st.selectbox("Difficulty", ["easy", "medium", "hard"])
    with col3:
        num_q = st.slider("Number of Questions", 3, 15, 5)

    if st.button("🎯 Generate Quiz", use_container_width=False):
        with st.spinner("🧠 Crafting quiz questions from the textbook..."):
            try:
                result = api_post("/quiz", {"topic": topic, "difficulty": difficulty, "num_questions": num_q})

                st.markdown(f"### {difficulty.upper()} Quiz: {topic}")
                st.markdown('<div class="feature-card">', unsafe_allow_html=True)
                st.markdown(result["content"])
                st.markdown('</div>', unsafe_allow_html=True)
                render_sources(result.get("sources", []))
                st.download_button(
                    "💾 Download Quiz",
                    data=result["content"],
                    file_name=f"quiz_{topic.replace(' ','_')}_{difficulty}.md",
                    mime="text/markdown"
                )
            except Exception as e:
                st.error(f"Error: {e}")


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE: Lesson Plan
# ═══════════════════════════════════════════════════════════════════════════════
elif page == "🗂️ Lesson Plan":
    st.subheader("🗂️ Lesson Plan Generator")
    st.markdown("Create teacher-ready lesson plans aligned with the Grade 11 curriculum.")

    col1, col2 = st.columns([2, 1])
    with col1:
        topic = st.text_input("Topic", value=selected_topic, key="lp_topic")
    with col2:
        duration = st.number_input("Duration (minutes)", min_value=30, max_value=180, value=80, step=5)

    if st.button("📄 Generate Lesson Plan", use_container_width=False):
        with st.spinner("🗂️ Building lesson plan..."):
            try:
                result = api_post("/lesson-plan", {"topic": topic, "duration_minutes": duration})
                st.markdown('<div class="feature-card">', unsafe_allow_html=True)
                st.markdown(result["content"])
                st.markdown('</div>', unsafe_allow_html=True)
                render_sources(result.get("sources", []))
                st.download_button(
                    "💾 Download Lesson Plan",
                    data=result["content"],
                    file_name=f"lesson_plan_{topic.replace(' ','_')}.md",
                    mime="text/markdown"
                )
            except Exception as e:
                st.error(f"Error: {e}")


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE: Real-Life Examples
# ═══════════════════════════════════════════════════════════════════════════════
elif page == "🌍 Real-Life Examples":
    st.subheader("🌍 Real-Life Example Generator")
    st.markdown("See how Grade 11 math appears in real life — with an Ethiopian context.")

    col1, col2 = st.columns([2, 1])
    with col1:
        topic = st.text_input("Topic", value=selected_topic, key="rl_topic")
    with col2:
        country = st.text_input("Country/Region Context", value="Ethiopia")

    if st.button("🌍 Generate Real-Life Examples", use_container_width=False):
        with st.spinner("🌐 Connecting math to the real world..."):
            try:
                result = api_post("/real-life-examples", {"topic": topic, "context_country": country})
                st.markdown('<div class="feature-card">', unsafe_allow_html=True)
                st.markdown(result["content"])
                st.markdown('</div>', unsafe_allow_html=True)
                render_sources(result.get("sources", []))
            except Exception as e:
                st.error(f"Error: {e}")


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE: Chat
# ═══════════════════════════════════════════════════════════════════════════════
elif page == "💬 Ask the Textbook":
    st.subheader("💬 Ask the Textbook")
    st.markdown("Chat directly with the Grade 11 Math textbook. Ask any question!")

    if "chat_history" not in st.session_state:
        st.session_state.chat_history = []

    # Display history
    for msg in st.session_state.chat_history:
        if msg["role"] == "user":
            st.markdown(f'<div class="chat-user">👤 {msg["content"]}</div>', unsafe_allow_html=True)
        else:
            with st.container():
                st.markdown(f'<div class="chat-ai">🤖 Prime AI</div>', unsafe_allow_html=True)
                st.markdown(msg["content"])
                if msg.get("sources"):
                    render_sources(msg["sources"])

    # Input
    with st.form("chat_form", clear_on_submit=True):
        col1, col2 = st.columns([5, 1])
        with col1:
            user_input = st.text_input("Your question...", placeholder="e.g. How do I solve a quadratic equation?", label_visibility="collapsed")
        with col2:
            submitted = st.form_submit_button("Send ➤", use_container_width=True)

    if submitted and user_input:
        st.session_state.chat_history.append({"role": "user", "content": user_input})
        with st.spinner("🤔 Thinking..."):
            try:
                history_payload = [
                    {"role": m["role"], "content": m["content"]}
                    for m in st.session_state.chat_history[:-1]
                ]
                result = api_post("/chat", {"query": user_input, "history": history_payload})
                st.session_state.chat_history.append({
                    "role": "assistant",
                    "content": result["content"],
                    "sources": result.get("sources", [])
                })
                st.rerun()
            except Exception as e:
                st.error(f"Error: {e}")

    if st.session_state.chat_history:
        if st.button("🗑️ Clear Chat"):
            st.session_state.chat_history = []
            st.rerun()


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE: Admin / Ingest
# ═══════════════════════════════════════════════════════════════════════════════
elif page == "⚙️ Admin / Ingest":
    import time as _time

    st.subheader("⚙️ Admin — Textbook Ingestion")
    st.markdown("Upload and embed the Grade 11 Math PDF textbook into the vector database.")

    # ── DB Stats ──────────────────────────────────────────────────────────────
    try:
        if USE_API:
            with st.spinner("🔌 Connecting to API..."):
                health = requests.get(f"{API_BASE}/health", timeout=60).json()
            col1, col2, col3 = st.columns(3)
            col1.metric("Documents Indexed", health.get("documents_indexed", 0))
            col2.metric("API Status", health.get("status", "unknown").upper())
            # Also show topics count
            try:
                topics_resp = requests.get(f"{API_BASE}/topics", timeout=10).json()
                col3.metric("Topics Indexed", len(topics_resp.get("topics", [])))
            except Exception:
                col3.metric("Topics Indexed", "?")
        else:
            from app.rag import get_collection
            col = get_collection()
            st.metric("Documents Indexed", col.count())
    except requests.exceptions.ConnectionError:
        st.warning("⚠️ Cannot reach the API server. It may be starting up — try again in 30 seconds.")
    except requests.exceptions.Timeout:
        st.warning("⚠️ API server is taking too long to respond. Render may be cold-starting. Try again in a minute.")
    except Exception as e:
        st.warning(f"Could not fetch stats: {e}")

    st.divider()

    if USE_API:
        st.markdown("### Upload PDF via API")
        uploaded = st.file_uploader("Upload Grade 11 Math PDF", type=["pdf"])
        c1, c2 = st.columns(2)
        with c1:
            start_pg = st.number_input("Start Page (0-indexed)", min_value=0, value=0)
        with c2:
            end_pg = st.number_input("End Page (0 = all pages)", min_value=0, value=0)

        if uploaded and st.button("🚀 Start Ingestion", type="primary"):
            with st.spinner("📤 Uploading PDF to Render server..."):
                try:
                    files  = {"file": (uploaded.name, uploaded.getvalue(), "application/pdf")}
                    params = {"start_page": start_pg}
                    if end_pg > 0:
                        params["end_page"] = end_pg
                    resp = requests.post(
                        f"{API_BASE}/ingest",
                        files=files,
                        params=params,
                        timeout=300,
                    )
                    resp.raise_for_status()
                    result = resp.json()
                    job_id = result.get("job_id", "")
                    if job_id:
                        # ── Save job_id and immediately start polling ──
                        st.session_state["ingest_job_id"]      = job_id
                        st.session_state["ingest_polling"]     = True
                        st.session_state["ingest_start_chunks"] = 0
                        st.success(f"✅ Upload received! Job ID: `{job_id}` — watching progress now...")
                    else:
                        st.error("No job ID returned. Check Render logs.")
                except requests.exceptions.Timeout:
                    st.error("⏱️ Upload timed out. PDF may be too large. Try a smaller page range (e.g. 0–50).")
                except requests.exceptions.ConnectionError:
                    st.error("🔌 Cannot reach the API. The server may be starting up.")
                except Exception as e:
                    st.error(f"Upload error: {e}")

        # ── Live Progress Section ─────────────────────────────────────────────
        st.divider()
        st.markdown("### 📊 Ingestion Progress")

        # Allow manual job ID entry as fallback
        stored_job = st.session_state.get("ingest_job_id", "")
        manual_job = st.text_input(
            "Job ID — auto-filled after upload, or paste one manually",
            value=stored_job,
            placeholder="e.g. a3f2bc1d",
        )
        if manual_job and manual_job != stored_job:
            st.session_state["ingest_job_id"] = manual_job
            st.session_state["ingest_polling"] = True

        active_job = st.session_state.get("ingest_job_id", "")

        col_btn1, col_btn2 = st.columns([1, 1])
        with col_btn1:
            check_now = st.button("🔄 Check Status Once", use_container_width=True)
        with col_btn2:
            live_poll = st.button("▶ Watch Live (auto-refresh)", use_container_width=True,
                                  type="primary")

        if active_job and (check_now or live_poll or st.session_state.get("ingest_polling")):
            try:
                status_resp = requests.get(
                    f"{API_BASE}/ingest/status",
                    params={"job_id": active_job},
                    timeout=15,
                ).json()

                status = status_resp.get("status", "unknown")
                phase  = status_resp.get("phase", "")
                page   = status_resp.get("page", 0)
                total  = status_resp.get("total_pages", 1)
                chunks = status_resp.get("chunks", 0)
                detail = status_resp.get("detail", "")

                # ── Big visible status box ────────────────────────────────────
                phase_icons = {
                    "init":       "🔧 Setting up...",
                    "extracting": f"📄 Reading pages — Page {page} of {total}",
                    "embedding":  "🧠 Sending to OpenAI for embeddings...",
                    "upserting":  "💾 Writing to ChromaDB on Render disk...",
                    "completed":  "✅ Done!",
                    "failed":     "❌ Failed",
                }
                phase_label = phase_icons.get(phase, f"⏳ {phase}")

                # Progress bar
                if total > 0 and phase == "extracting":
                    pct = min(int((page / total) * 80), 80)
                elif phase == "embedding":
                    pct = 88
                elif phase == "upserting":
                    pct = 95
                elif status == "completed":
                    pct = 100
                else:
                    pct = 5

                st.progress(pct / 100)

                # Metrics row
                m1, m2, m3, m4 = st.columns(4)
                m1.metric("Status",  status.upper())
                m2.metric("Phase",   phase or "—")
                m3.metric("Page",    f"{page} / {total}" if total else "—")
                m4.metric("Chunks",  chunks)

                st.info(f"{phase_label}\n\n_{detail}_")

                if status == "completed":
                    st.success(f"🎉 **Ingestion complete!** {chunks} chunks are now in ChromaDB on Render.")
                    st.balloons()
                    st.session_state["ingest_polling"] = False
                    # Show verify links
                    verify_md = (
                        "**Verify it worked — open these in your browser:**\n"
                        "- [/health — check documents_indexed]({base}/health)\n"
                        "- [/topics — see which chapters are searchable]({base}/topics)\n"
                        "- [/cache/stats — Redis cache info]({base}/cache/stats)"
                    ).format(base=API_BASE)
                    st.markdown(verify_md)
                elif status == "failed":
                    st.error(f"❌ Ingestion failed: {detail}")
                    st.session_state["ingest_polling"] = False
                elif live_poll or st.session_state.get("ingest_polling"):
                    # Keep auto-refreshing every 4 seconds
                    _time.sleep(4)
                    st.rerun()

            except Exception as e:
                st.error(f"Could not fetch status: {e}. Try clicking Check Status again.")

        elif not active_job:
            st.info("Upload a PDF and click Start Ingestion — the Job ID will appear here automatically.")

    else:
        st.markdown("### Run Ingestion Script Directly")
        st.code("python scripts/ingest_textbook.py path/to/grade11_math.pdf", language="bash")
        st.info("With page range: `python scripts/ingest_textbook.py textbook.pdf --start-page 0 --end-page 50`")
        st.divider()
        st.markdown("### Indexed Topics")
        if st.button("🔍 Show Topics"):
            try:
                from app.rag import get_collection
                col     = get_collection()
                results = col.get(include=["metadatas"])
                topics  = sorted({m.get("topic","unknown") for m in results["metadatas"]})
                for t in topics:
                    st.markdown(f"- {t.replace('_',' ').title()}")
            except Exception as e:
                st.error(f"Error: {e}")