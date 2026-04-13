from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import trials, safety, publications, compliance, simulation, sites, protocol

app = FastAPI(
    title="Hakase Clinical Trial Hub API",
    version="2.0.0",
    description="Comprehensive clinical trial intelligence powered by ClinicalTrials.gov, OpenFDA, PubMed, and FDA FAERS.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trials.router, prefix="/api")
app.include_router(safety.router, prefix="/api")
app.include_router(publications.router, prefix="/api")
app.include_router(compliance.router, prefix="/api")
app.include_router(simulation.router, prefix="/api")
app.include_router(sites.router, prefix="/api")
app.include_router(protocol.router, prefix="/api")


@app.get("/api/healthz")
async def health():
    return {"status": "ok", "version": "2.0.0"}


@app.get("/api/data-sources")
async def data_sources():
    return {
        "sources": [
            {
                "name": "ClinicalTrials.gov",
                "description": "US National Library of Medicine registry of clinical studies",
                "url": "https://clinicaltrials.gov",
                "apiVersion": "v2",
                "coverage": "500,000+ trials worldwide",
            },
            {
                "name": "FDA FAERS",
                "description": "FDA Adverse Event Reporting System via OpenFDA",
                "url": "https://open.fda.gov/data/faers/",
                "apiVersion": "1.0",
                "coverage": "20M+ adverse event reports",
            },
            {
                "name": "OpenFDA Drug Labels",
                "description": "FDA drug labeling information",
                "url": "https://open.fda.gov/apis/drug/label/",
                "apiVersion": "1.0",
                "coverage": "140,000+ drug labels",
            },
            {
                "name": "PubMed / NCBI",
                "description": "Biomedical literature database",
                "url": "https://pubmed.ncbi.nlm.nih.gov",
                "apiVersion": "E-utilities",
                "coverage": "36M+ articles",
            },
        ]
    }
