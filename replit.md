# Hakase Clinical Trial Hub

## Overview
A full-stack clinical trial intelligence platform for clinical researchers, sponsors, and CROs. Combines live data from ClinicalTrials.gov, FDA FAERS, PubMed, and OpenFDA with ML-powered analysis.

## Architecture
- **Backend**: FastAPI (Python) on port 8000
- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS 4 + Framer Motion on port 5000
- **Data Sources**: ClinicalTrials.gov v2 API, OpenFDA FAERS, PubMed NCBI

## Running
- **API Server**: `cd backend && PORT=8000 python3 server.py`
- **Frontend**: `cd frontend && pnpm --filter @workspace/hakase-clinical run dev`

## Key Features
- **Landing Page**: Fully animated with Framer Motion — dark theme, scroll animations, parallax effects, mouse glow, animated background mesh
- **Clinical Trial Hub**: 6-stage simulation engine (Discovery, Site Selection, Regulatory, Enrollment, Execution, Outcomes) — Protocol Design removed for cleaner flow
- **Trial Explorer**: Live search of ClinicalTrials.gov
- **Safety Intelligence**: OpenFDA FAERS adverse event analysis with PRR/ROR signals
- **KOL Finder**: PubMed authorship-based Key Opinion Leader identification
- **Enrollment Simulation**: Monte Carlo simulation (P10/P50/P90) with cost modeling
- **Site Intelligence**: Site ranking by trial history, geographic diversity
- **Evidence Library**: PubMed literature mining

## Backend Structure
```
backend/
  server.py          # Entry point (uvicorn)
  api/
    main.py          # FastAPI app
    routers/         # trial_hub.py, trials.py, safety.py, etc.
    services/        # ctgov.py, openfda.py, pubmed.py, analysis.py, deep_learning.py
    modules/         # llm.py, reasoning_retriever.py
```

## Frontend Structure
```
frontend/
  artifacts/hakase-clinical/src/
    pages/
      LandingPage.tsx   # Framer Motion animated landing page (dark theme)
      Dashboard.tsx     # Main app shell + navigation
    components/modules/
      ClinicalTrialHub.tsx  # 6-stage trial simulation hub
      TrialExplorer.tsx
      SafetyIntelligence.tsx
      KOLFinder.tsx
      EnrollmentSimulation.tsx
      ProtocolStudio.tsx
      ...
```

## Clinical Trial Hub Stages
1. Discovery & Feasibility → `/api/trial-hub/stage1/discovery`
2. Site Selection → `/api/trial-hub/stage3/site-selection`
3. Regulatory & IND → `/api/trial-hub/stage4/regulatory`
4. Enrollment Simulation → `/api/trial-hub/stage5/enrollment`
5. Execution → `/api/trial-hub/stage6/execution`
6. Outcomes & Analysis → `/api/trial-hub/stage7/outcomes`

## Python Dependencies
uvicorn, fastapi, httpx, pydantic, numpy, scipy, pyyaml, scikit-learn, pymupdf, torch

## Node Dependencies
framer-motion, react, vite, tailwindcss, radix-ui, tanstack-query, wouter, recharts, lucide-react
