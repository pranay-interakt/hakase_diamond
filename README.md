# Hakase-AI: Clinical Trial Analytics Platform (Vectory-less RAG)

Welcome to **Hakase-AI**, an AI-driven, data-grounded clinical trial feasibility platform designed specifically for Clinical Research Organizations (CROs) to accelerate protocol de-risking and site selection.

Unlike traditional AI assistants that "guess" metrics, Hakase-AI is architected with a **Vectory-less RAG (PageIndex)** design that bridges the gap between unstructured protocol PDFs and the real-world statistical truth found in global medical databases.

---

## 📽️ The "Why" behind Hakase-AI
Clinical trial protocols are notoriously long (150+ pages), dense, and often analyzed manually. This leads to:
1. **Hallucinated Feasibility**: AI models guessing dropout rates or success probabilities without real data.
2. **Slow Site Selection**: Scouring through thousands of historical sites without a grounded performance score.
3. **Regulatory Blindness**: Missing critical FDA/EMA updates during the initial protocol design phase.

**Hakase-AI** solves this by providing a "Smart Search" layer that extracts protocol metadata and benches it against **live APIs** (OpenFDA, PubMed, ClinicalTrials.gov) in a unified analytical dossier.

---

## 🏗️ Core Technology Stack

### 1. **PageIndex (Vectory-less RAG)**
Traditional Vector DBs fail on clinical protocols because "similarity search" often gets lost in the legal boilerplate. 
- **Structural Traversal**: Instead of chunking, Hakase-AI builds a hierarchical index of the protocol's Table of Contents and Section Headers.
- **PageIndex Reasoning**: When you ask for "Sample Size", the AI doesn't search for "Patient" (which matches everything); it identifies the **Statistics** branch of the document tree and zooms into the specific page, eliminating hallucinations.

### 2. **Deep Literature Grounding**
- **PubMed Heuristics**: Automatically sweeps the NLM PubMed database to fetch true historical dropout and recruitment rates for the same phase/indication.
- **OpenFDA Toxicology**: Directly queries the FDA Safety Event database (`api.fda.gov`) for the drug intervention to warn about historical adverse event signals.
- **CT.gov V2 Sites**: Aggregates site-level performance metrics based on similar completed trials.

---

## 🚀 Key Features

- **Dynamic Region Lockdown**: Automatically parses the protocol's intended countries and locks site recommendations strictly to those regions, with an explicit fallback to **Global (Unspecified)** for multi-national trials.
- **Protocol Overview Dashboard**: Real-time extraction of Phase, Study Design, Target Enrollment, and Geography.
- **Regulatory Compliance Forensics**: Identifies protocol "shortcomings" and suggests specific safety monitoring amendments based on historical drug toxicology.
- **Source Transparency**: Every metric (dropout, enrollment rate, risk score) is cited back to the actual literature/PubMed articles found during the analysis.

---

## 🛠️ How to Start

### 1. **System Prerequisite**
Ensure **Ollama** is installed and running `llama3:8b`.
```bash
ollama run llama3
```

### 2. **Start the Backend**
```bash
cd backend
pip install -r requirements.txt
python3 main.py
```
*API running on: http://localhost:8000*

### 3. **Start the Frontend**
```bash
cd frontend/artifacts/hakase-clinical
npm install
npm run dev
```
*Dashboard running on: http://localhost:5173*

---

## 📁 Technical Folder Structure
- **`/backend`**: The Python FastAPI engine orchestrating structured extraction and API grounding.
- **`/frontend/artifacts/hakase-clinical`**: The React/Tailwind/Vite dashboard providing the high-fidelity UI experience.
- **`/requirements`**: Detailed technical specifications, regulatory design docs, and architectural blueprints for Hakase-AI.
- **`/PageIndex`**: The vectorless retrieval module powering the document reasoning.

---

**Hakase-AI — Grounding Clinical Decisions in Reality.**
