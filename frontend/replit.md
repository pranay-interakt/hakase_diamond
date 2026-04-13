# Hakase Clinical Trial Hub

## Overview

A comprehensive clinical trial intelligence platform built as a pnpm monorepo (TypeScript) for the frontend and a Python FastAPI backend. All data is real, sourced from public APIs — no mock data.

## Architecture

### Frontend (pnpm workspace monorepo)
- **App**: React 19 + Vite on port 5000 (`frontend/artifacts/hakase-clinical`)
- **API Client**: Express 5 on port 8000 — replaced by Python FastAPI (Node server still present but not used)
- **Routing**: Wouter SPA — `/` (landing page), `/dashboard` (hub)
- **State**: Tanstack Query v5
- **UI**: Tailwind CSS 4, Radix UI, Shadcn/UI components, Recharts for data visualization

### Backend (Python FastAPI)
- **Location**: `backend/` directory, entry point `backend/server.py`
- **Port**: 8000 (configured via `PORT` env var)
- **Framework**: FastAPI + Uvicorn

### Data Sources (all free, no API keys required)
| Source | Base URL | Data |
|--------|----------|------|
| ClinicalTrials.gov v2 | `https://clinicaltrials.gov/api/v2` | 500K+ trials worldwide |
| FDA FAERS via OpenFDA | `https://api.fda.gov/drug/event.json` | 20M+ adverse event reports |
| OpenFDA Drug Labels | `https://api.fda.gov/drug/label.json` | 140K+ drug labels |
| OpenFDA Recalls | `https://api.fda.gov/drug/enforcement.json` | Recall history |
| PubMed E-utilities | `https://eutils.ncbi.nlm.nih.gov/entrez/eutils` | 36M+ biomedical articles |

## Platform Modules (8 modules)

1. **Trial Explorer** — Real-time search of ClinicalTrials.gov
2. **Safety Intelligence** — FDA FAERS adverse events, serious outcomes, recall history, temporal trends
3. **Site Intelligence** — Site recommendations ranked by enrollment rate, startup time, experience
4. **Regulatory Compliance** — ICH E6/E8/E9, FDA 21 CFR, CONSORT, WHO ICTRP rule checking
5. **Enrollment Simulation** — Monte Carlo (1K iterations) with rates derived from real ClinicalTrials.gov data
6. **Evidence Library** — PubMed search with automatic evidence level classification
7. **KOL Finder** — PubMed authorship mining to identify Key Opinion Leaders by condition/intervention; returns real investigators ranked by publication count + first/senior authorship
8. **Protocol Studio** — 5-tab powerhouse: Analysis (compliance/success probability), Named Amendments (live re-check with impact delta), Strategies (real endpoint/masking/allocation patterns from ClinicalTrials.gov), Sites (region-selectable site recommendations), KOLs (disease-area investigators)

## Backend API Routes

```
GET  /api/healthz
GET  /api/data-sources
GET  /api/trials/search?condition=&intervention=&phase=&status=
GET  /api/trials/{nct_id}
GET  /api/trials/similar?nct_id=
GET  /api/trials/{nct_id}/sites
GET  /api/safety/profile?drug=
GET  /api/safety/adverse-events?drug=
GET  /api/safety/faers-timeline?drug=
GET  /api/safety/recalls?drug=
GET  /api/publications/search?q=
GET  /api/publications/evidence-map?condition=&intervention=
GET  /api/publications/abstract/{pmid}
POST /api/compliance/check
GET  /api/compliance/check/{nct_id}
GET  /api/compliance/regulations
POST /api/simulation/enrollment
POST /api/simulation/protocol-impact
GET  /api/sites/recommend?condition=
POST /api/protocol/analyze-upload (PDF upload)
POST /api/protocol/analyze-text
GET  /api/protocol/strategies?condition=&phase=
GET  /api/kols/find?condition=&intervention=&limit=
```

## Workflows
- `Start application` — `cd frontend && PORT=5000 pnpm --filter @workspace/hakase-clinical run dev`
- `API Server` — `cd backend && PORT=8000 python3 server.py`

## Key Files
- `backend/api/main.py` — FastAPI app with CORS
- `backend/api/routers/` — Route handlers for each module
- `backend/api/services/ctgov.py` — ClinicalTrials.gov v2 client
- `backend/api/services/openfda.py` — OpenFDA + FAERS client
- `backend/api/services/pubmed.py` — PubMed E-utilities client
- `backend/api/services/analysis.py` — Similarity scoring, Monte Carlo simulation, enrollment statistics
- `backend/api/services/compliance_rules.py` — ICH/FDA regulatory rule engine
- `frontend/artifacts/hakase-clinical/src/lib/api.ts` — Frontend API client
- `frontend/artifacts/hakase-clinical/src/components/modules/` — All 8 hub module components
- `frontend/artifacts/hakase-clinical/src/pages/Dashboard.tsx` — Main hub shell with sidebar nav

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. Run `pnpm run typecheck` from the `frontend/` root to typecheck all packages.

## Development
- Package manager: pnpm
- Node.js version: 20
- Python version: 3.12
- Frontend hot reload: yes (Vite HMR)
- Backend: Uvicorn with manual restart required for changes
