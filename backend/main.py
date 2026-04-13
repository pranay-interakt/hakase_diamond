import sys
import os
import yaml
import json
import re

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from modules.llm import build_llm
from modules.extractor import extract_trial_entities
from modules.reasoning_retriever import ReasoningRetriever

import fitz

# ─────────────────────────────────────────────────────────
DIVIDER = "=" * 65

def load_and_clean_text(path: str) -> str:
    doc = fitz.open(path)
    text = "\n".join(page.get_text("text") for page in doc)
    doc.close()
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)
    return text.strip()

def chunk_text(text: str, size: int = 1500, overlap: int = 150) -> list:
    chunks, start, idx = [], 0, 0
    while start < len(text):
        end = min(start + size, len(text))
        chunks.append({"text": text[start:end], "id": idx})
        start += size - overlap
        idx += 1
    return chunks

def main():
    pdf_path = "/Users/pranaydinavahi/office_documents/Hakase-Redesign/frontend/attached_assets/HakaseAI_clinical_research_tool_overview_1773323094685.pdf"

    print(f"\n{DIVIDER}")
    print("  HAKASE CLINICAL REASONING TEST SUITE")
    print(DIVIDER)

    # ── 1. Load & parse ──────────────────────────────────────
    print(f"\n[1/4] Loading document: {pdf_path}")
    text = load_and_clean_text(pdf_path)
    print(f"      ✓ Total chars extracted: {len(text):,}")

    # ── 2. Config + LLM ─────────────────────────────────────
    with open("config.yaml", "r") as f:
        config = yaml.safe_load(f)
    print("\n[2/4] Initializing LLM...")
    llm = build_llm(config)
    print(f"      ✓ LLM ready")

    chunk_size   = config.get("vector_store", {}).get("chunk_size", 1500)
    chunk_overlap = config.get("vector_store", {}).get("chunk_overlap", 150)
    chunks = chunk_text(text, size=chunk_size, overlap=chunk_overlap)
    print(f"      ✓ Chunks: {len(chunks)}")

    # ── 3. ReasoningRetriever ────────────────────────────────
    print("\n[3/4] Initializing ReasoningRetriever (PageIndex + OCR + Tables + Semantic Headings)...")
    rr = ReasoningRetriever(pdf_path)
    pi = rr.page_index

    print(f"      ✓ Pages indexed: {len(pi.pages)}")
    print(f"      ✓ Sections detected: {list(pi.index.keys())}")
    
    # Show a sample of detected headings from page 1
    if pi.pages:
        sample_page = pi.pages[0]
        headings = sample_page.get("headings", [])
        tables   = sample_page.get("tables", [])
        print(f"\n      [ Page 1 Sample ]")
        print(f"        Headings detected ({len(headings)}): {headings[:5]}")
        print(f"        Table rows extracted: {len(tables)}")

    # Check table extraction across document
    total_table_rows = sum(len(p.get("tables", [])) for p in pi.pages)
    print(f"\n      ✓ Total table rows extracted across doc: {total_table_rows}")

    # ── 4a. Standard Extraction ──────────────────────────────
    print(f"\n[4a/4] Running standard extraction (PageIndex-grounded)...")
    entities = extract_trial_entities(llm, chunks, strict=True, reasoning_retriever=rr)
    print(f"\n{DIVIDER}")
    print("  EXTRACTION RESULTS")
    print(DIVIDER)
    print(json.dumps(entities, indent=2))

    # ── 4b. Agentic Exploration ──────────────────────────────
    print(f"\n{DIVIDER}")
    print("  AGENTIC EXPLORATION (goal-driven loop)")
    print(DIVIDER)

    objectives = [
        "Extract the primary endpoint and key efficacy endpoints of this clinical trial protocol.",
        "Identify the trial phase, sample size, and study design (randomisation, blinding).",
    ]

    for obj in objectives:
        print(f"\n  Objective: {obj}")
        print("  " + "-" * 60)
        result = rr.agentic_explore(objective=obj, llm=llm)
        print(f"  Agent Result:\n{result}\n")

    print(f"\n{DIVIDER}")
    print("  ALL TESTS COMPLETE")
    print(DIVIDER)

if __name__ == "__main__":
    main()