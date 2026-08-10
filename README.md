# Customer Message Triage System

An internal tool for support teams to classify incoming customer messages using AI.

**This is a triage tool, not a chatbot.** It reads raw messages and produces a structured triage decision:
`{ category, priority (P0–P3), summary, suggested_action, needs_human, confidence }`

## Features

- **Upload & Paste**: Ingest batches of messages via JSON file or manual text paste.
- **Dynamic Configuration**: Categories and definitions are provisional and controlled via a centralized `constants.js` configuration module.
- **AI Triage Pipeline**:
  - Pre-filters garbage and unintelligible messages instantly (saves API costs).
  - Truncates excessively long inputs.
  - Automatically fails over if API rate limits are hit (graceful fallback).
  - Validates and repairs AI JSON output.
  - Computes `needs_human` flag based on confidence thresholds and critical (P0) rules.
- **Evaluation Engine**:
  - Support staff can manually label a sample of messages (Ground Truth).
  - The Evaluation Engine compares AI decisions vs. Ground Truth and computes exact match rate, category accuracy, and human escalation accuracy.
  - Stores a confusion matrix and highlights exact failure cases.

## Tech Stack
- **Backend:** Node.js 20+, Express 4, Mongoose 8
- **Frontend:** React 18, Vite, React Router, Axios, Bootstrap 5
- **AI Integration:** Google Gemini SDK (`@google/generative-ai`), OpenRouter fallback

## Getting Started

### Prerequisites
- Node.js 20 or higher
- MongoDB running locally on default port 27017

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
3. Set up environment variables in `backend/.env`:
   ```
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/triage_system
   GEMINI_API_KEY=your_api_key_here
   GEMINI_MODEL=gemini-1.5-flash
   ```

### Running the App
1. Start the backend: `cd backend && npm start`
2. Start the frontend: `cd frontend && npm run dev`
3. Open `http://localhost:5173` in your browser.

## Architecture & Schema
- `Dataset`: Represents a batch of uploaded messages.
- `Message`: The raw input message from the customer.
- `TriageResult`: The output from the AI (separated from Message for versioning and auditing).
- `HumanReview`: Ground truth labels provided by human staff.
- `EvaluationRun`: A point-in-time snapshot of system accuracy metrics.

## Security & Privacy Note
- This tool does **not** send replies to customers.
- Sensitive environment variables are masked in backend logs and never exposed to the frontend.
