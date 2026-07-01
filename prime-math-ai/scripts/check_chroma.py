"""Quick diagnostic: inspect ChromaDB collection stats."""
import os, sys, json
from collections import Counter

# Add parent to path so we can import
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import chromadb
from chromadb.config import Settings
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./data/chroma_db")
CHROMA_COLLECTION  = os.getenv("CHROMA_COLLECTION_NAME", "grade11_math")

print(f"ChromaDB path: {os.path.abspath(CHROMA_PERSIST_DIR)}")
print(f"Collection name: {CHROMA_COLLECTION}")
print()

try:
    chroma = chromadb.PersistentClient(
        path=CHROMA_PERSIST_DIR,
        settings=Settings(anonymized_telemetry=False)
    )
    collections = chroma.list_collections()
    print(f"Collections in DB: {[c.name for c in collections]}")
    print()

    col = chroma.get_collection(CHROMA_COLLECTION)
    total = col.count()
    print(f"Total documents in '{CHROMA_COLLECTION}': {total}")
    print()

    # Get all metadata
    results = col.get(include=["metadatas", "documents"])
    metas = results["metadatas"]
    docs  = results["documents"]

    # Page stats
    pages = [m.get("page") for m in metas if m.get("page")]
    page_counts = Counter(pages)
    if pages:
        print(f"Pages covered: {min(pages)} to {max(pages)}")
        print(f"Unique pages: {len(set(pages))}")
    else:
        print("No page metadata found")

    # Topic stats
    topics = Counter(m.get("topic", "unknown") for m in metas)
    print(f"\nTopic distribution:")
    for t, c in topics.most_common():
        print(f"  {t}: {c} chunks")

    # Type stats
    types = Counter(m.get("type", "unknown") for m in metas)
    print(f"\nType distribution:")
    for t, c in types.most_common():
        print(f"  {t}: {c} chunks")

    # Scanned vs text
    scanned = Counter(m.get("is_scanned", "N/A") for m in metas)
    print(f"\nScanned status:")
    for s, c in scanned.most_common():
        print(f"  is_scanned={s}: {c} chunks")

    # Sample a few documents
    print(f"\n--- Sample documents (first 3) ---")
    for i in range(min(3, len(docs))):
        print(f"\n[Doc {i+1}] Meta: {json.dumps(metas[i], indent=2)}")
        print(f"Text preview: {docs[i][:200]}...")

    # Pages with most chunks
    print(f"\n--- Pages with most chunks (top 10) ---")
    for page, count in page_counts.most_common(10):
        print(f"  Page {page}: {count} chunks")

except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
