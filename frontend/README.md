# Hakase Clinical Frontend

## Overview
Hakase Clinical Frontend is the user interface for the Hakase Clinical Trial Hub. It provides a comprehensive dashboard and tools for analyzing clinical trial data, simulating trial outcomes, and generating actionable insights based on ClinicalTrials.gov, OpenFDA, PubMed, and FDA FAERS.

## Prerequisites
- Node.js (v18 or higher recommended)
- `pnpm` (v10+ recommended)

## Setup and Installation

1. **Install dependencies**
   Navigate to the repository root and install the dependencies using pnpm:
   ```bash
   pnpm install
   ```

2. **Start the Development Server**
   To run the frontend locally:
   ```bash
   pnpm --filter @workspace/hakase-clinical run dev
   ```
   Or alternatively, navigate to the application directly:
   ```bash
   cd artifacts/hakase-clinical
   pnpm run dev
   ```
   
   The development server will start on `http://localhost:5173`.

3. **Build for Production**
   To build the application for production:
   ```bash
   pnpm run build
   ```

## Workspace Structure
This repository uses a `pnpm` workspace setup:
- `artifacts/hakase-clinical/`: The main React/Vite application.
- `lib/`: Shared libraries and utilities.
- `scripts/`: Build and maintenance scripts.

## Styling
The application uses Tailwind CSS for styling and includes Radix UI primitives for accessible components.

## License
MIT License
