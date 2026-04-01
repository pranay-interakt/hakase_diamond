# Hakase-AI: Technical Architecture & Design Philosophy

## The Problem: The "Hallucination" Trap
In clinical trial feasibility, traditional Large Language Models (LLMs) are dangerous if used unguided.
- **The Issue**: If a protocol says "Phase II", an LLM might guess a "20% dropout rate" based on general training data. In reality, that specific disease and drug class might have a 45% dropout rate.
- **The Consequence**: A CRO makes an $80M enrollment assumption based on a "stochastic guess" instead of historical clinical record.

## Our Philosophy: **"Grounding before Reasoning"**
Hakase-AI is built on a "Grounding First" architecture. The AI follows this sequence:
1. **Structural Identification (PageIndex)**: Identify exactly where the Indication, Phase, and Drug Name are in the 100-page PDF.
2. **External Data Retrieval**: Use those keywords to query **PubMed** (Enrollment rates), **ClinicalTrials.gov** (Site history), and **OpenFDA** (Safety signals).
3. **Reasoned Synthesis**: Only *after* fetching real data does the LLM synthesize the final report using the fetched facts as strict context.

---

## PageIndex (Vectory-less RAG)
Traditional Vector RAG fails on clinical protocols. Here is why:
- **Similarity vs. Structure**: "Study design" and "Safety monitoring" appear on almost every page of a protocol. A vector search will return hundreds of irrelevant snippets.
- **PageIndex Traversal**: We index the PDF into a hierarchical tree:
    ```
    1.0 Synopsis (Page 4-8)
    2.0 Objectives (Page 10)
    3.0 Design & Methodology (Page 15-25)
        3.1 Enrollment (Page 18)
        3.2 Statistics (Page 22)
    ```
- **Result**: When Hakase-AI needs to "Benchmark the enrollment rate," it deliberately jumps to **Section 3.1** instead of doing a "keyword search," ensuring 100% accurate context for the LLM.

---

## Multi-Pass Data Pipelines
- **Pass 1 (Extractor)**: Targeted LLM extraction focused on mapping metadata keys (NCT mapping).
- **Pass 2 (Grounding Engine)**: Asynchronous polling of NIH/NCBI/FDA APIs.
- **Pass 3 (Analytics Engine)**: Synthesis of the final report, generating "Strategic Next Steps" and "Regulatory Shortcomings" grounded in the Pass 2 data.

---

## Regulatory Compliance Forensics
The "Regulatory Forensics" feature uses a drug-to-toxin mapping. By querying the FAERS (FDA Adverse Event Reporting System), the engine can identify if the protocol's safety monitoring is sufficient for known historical toxicities of that specific drug class.

*Design Revision 4.3 — Hakase-AI Technical Specs — 2024*
