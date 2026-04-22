# Hakase Diamond: Clinical Trial Hub

A full-stack, data-driven simulation and analysis engine for clinical trials. The Hakase Clinical Trial Hub integrates real-time intelligence from ClinicalTrials.gov, OpenFDA, PubMed, and FDA FAERS, providing actionable insights for advanced clinical trial operations, regulatory compliance, and protocol simulation.

---

## 🛠 Prerequisites and System Requirements

Before getting started, ensure your system meets the following requirements:

- **Python**: `>= 3.12`
- **Node.js**: `>= 18.x`
- **pnpm**: `>= 10.x` (Used for the frontend monorepo workspace)
- **uv**: (Recommended) Fast Python package manager for handling backend dependencies. Alternatively, `pip` can be used.

---

## 📦 Installation Guide

This project is divided into two primary environments: a Python-based intelligent backend and a React/Vite-powered frontend.

### 1. Backend Setup
The backend runs on FastAPI and handles data intelligence, LLM reasoning, and API integrations.

1. Navigate to the project root directory:
   ```bash
   cd hakasediamond
   ```
2. Install the backend dependencies using `uv` (or `pip`):
   ```bash
   # If using uv (Recommended)
   uv sync

   # Alternatively, using pip:
   pip install .
   ```

### 2. Frontend Setup
The frontend is a `pnpm` workspace containing a Vite-powered React application with Radix UI and Tailwind CSS.

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the workspace dependencies:
   ```bash
   pnpm install
   ```

---

## 🚀 Running the Application locally

To start the full application locally, you will need to run the backend and frontend in separate terminal windows.

### 1. Start the Backend API Server
The backend is served via Uvicorn.

1. Open a new terminal session at the repository root.
2. Ensure you have your virtual environment active (if applicable) and your configurations in `backend/config.yaml` are correctly set.
3. Start the server:
   ```bash
   python backend/server.py
   ```
   > **Note:** The backend API will start securely at `http://0.0.0.0:8000`. You can check the health status by visiting `http://localhost:8000/api/healthz`.

### 2. Start the Frontend Development Server
The frontend is hosted from a Vite dev server.

1. Open a second terminal session and navigate to the frontend root:
   ```bash
   cd frontend
   ```
2. Run the development environment for the application:
   ```bash
   pnpm --filter @workspace/hakase-clinical run dev
   ```
   *Alternatively, you can navigate directly to the app directory and start it:*
   ```bash
   cd artifacts/hakase-clinical
   pnpm run dev
   ```
   > **Note:** The frontend application will be instantly available at `http://localhost:5173`.

---

## 🏗 Project Architecture & Structure

- **/backend/**: Contains the core API logic (`FastAPI`), data parsing (`modules/`), and entry-point scripts.
- **/frontend/**: Contains the Vite React app workspace setup.
  - **/frontend/artifacts/hakase-clinical/**: The primary frontend web application.
- **pyproject.toml & uv.lock**: Defines the explicit Python versions, environment, and backend package locks.
- **frontend/pnpm-workspace.yaml**: Outlines the Node application architecture.

## 📜 License
MIT License
