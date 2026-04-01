# Hakase-AI: Clinical Trial Functional Specifications

## 📋 Table of Deliverables

### 1. **PageIndex Smart-Search Protocol Parser**
- **Automatic Synopsis Indexing**: Scans and parses metadata (Phase, Indication, Intervention, Sample Size) within 15 seconds.
- **Hierarchical Section Mapping**: Correctly identifies Eligibility, Dosing, Schedule, and Statistics using anchored PageIndex headers.
- **Multi-Pass Accuracy Verification**: For critical parameters (Total Enrollment), the system runs secondary targeted queries specifically into the identified Design/Statistics pages.

### 2. **Dynamic Geographical Logic**
- **Protocol Region Extraction**: Identifies exact target countries (e.g., "United States, Australia, Spain").
- **Strict Site Filtering**: Recommendations are locked to these extracted countries to prevent "geographic drift" in site selection.
- **Global (Unspecified) State**: Automatically falls back to 100% global search if no location is parsed, labeling the UI state as "Global (Unspecified)".

### 3. **CRO Analytics & Benchmarking (Grounded)**
- **PubMed Enrollment Benchmarking**: Heuristic calculation of true historical enrollment rates based on similar condition/phase publications.
- **PubMed Dropout Synthesis**: Real-world literature mapping to cited articles (NLM citations).
- **Similar Trial Mapping**: Top 5 most relevant completed trials from ClinicalTrials.gov (NCTID mapping).

### 4. **Regulatory Forensics & Safety Modules**
- **OpenFDA adverse event querying**: Dynamic extraction of Safety Flags.
- **Shortcomings Analysis**: AI-driven identification of protocol gaps compared to FDA/EMA standards.
- **Amendment Suggestions**: Actionable structural suggestions to mitigate safety or enrollment risks.

---

## 🛠️ Requirements & Tooling
- **Backend Infrastructure**: Python 3.10+, FastAPI, PyMuPDF (fitz), BeautifulSoup4 (online intel).
- **Core LLM**: Ollama locally hosted (Llama 3 8B recommended).
- **Data APIs**: 
    - ClinicalTrials.gov V2 REST API.
    - PubMed e-utilities (NLM).
    - OpenFDA Adverse Events API.
- **Frontend Layer**: React 18+, Vite, Tailwind CSS, Lucide Icons, Framer Motion (animations).

---

## 🚦 How to Use the Analytical Dossier
1. **Upload**: Drop any clinical protocol PDF into the "Start Analysis" zone.
2. **Analysis Progress**: Wait 2-3 minutes while the backend runs the multi-pass RAG and performs external API calls.
3. **Review**:
    - **Dashboard Summary**: Success probabilities and key design strengths.
    - **Protocol Overview**: Locked geographic and metadata baseline.
    - **Safety & Regulatory**: FDA toxicology flags and amendment needs.
    - **Geography**: Validated site recommendations with TA (Therapeutic Area) scores.

*Specifications Document v1.2 — Hakase-AI Implementation Roadmap*
