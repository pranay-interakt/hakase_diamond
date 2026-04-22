# Hakase Clinical Backend

## Overview
Hakase Clinical Backend is the core intelligence engine for the Hakase Clinical Trial Hub. It provides a comprehensive set of APIs for clinical trial data processing, safety profiling, regulatory compliance, and trial simulation using data from ClinicalTrials.gov, OpenFDA, PubMed, and FDA FAERS.

## Prerequisites
- Python 3.12+
- `uv` package manager (recommended) or `pip`

## Setup and Installation

1. **Install dependencies**
   Navigate to the repository root and install the dependencies:
   ```bash
   uv sync
   ```
   Or using pip:
   ```bash
   pip install -r pyproject.toml
   ```

2. **Configuration**
   Ensure `config.yaml` is properly configured for your local environment (API keys, etc.).

3. **Start the API Server**
   Run the backend server locally:
   ```bash
   python server.py
   ```
   The API will be available at `http://0.0.0.0:8000`.

## Architecture
- `api/`: FastAPI routes and application setup.
- `modules/`: Core intelligent extraction and reasoning logic (LLM integration, entity extraction).
- `server.py`: Entry point for starting the FastAPI application with Uvicorn.
- `config.yaml`: Configuration variables for the service.

## License
MIT License
