# Triage AI Pipeline Diagnostic & Debug Report

## 1. Root Cause Analysis

### A. Gemini API Rate-Limiting (429 Rate Limit Exceeded)
When running in live Gemini mode (`AI_PROVIDER=gemini`), the API key set in `backend/.env` returns `429 RATE_LIMIT_EXCEEDED` (`quota_limit_value: 0`) from Google Generative AI servers. 
- *Impact*: The `triageService.js` error handler caught the `429` exception, retried 3 times, and returned the safe fallback payload: `{ category: 'unclear', priority: 'P3', needs_human: true, isApiFailure: true }`.
- *Result*: Every message appeared to receive identical "unclear" outputs because the API calls were failing at the network tier due to project quota exhaustion.

### B. Static Fallback in Mock Mode
When running in `AI_PROVIDER=mock`, unrecognized customer messages defaulted to a static fallback response (`category: 'inquiry'`, `priority: 'P3'`).

---

## 2. Applied Fixes & Code Improvements

1. **Terminal Error Visibility**: Added `console.error("[GEMINI API ERROR]:", err)` inside `triageService.js` to immediately surface API rate limits, model errors, or invalid key issues in the backend terminal logs.
2. **Prompt Interpolation & Input Passing**: Verified that `cleanText` (`msg.normalizedText || msg.rawText`) is passed directly into `model.generateContent(cleanText)` and into system instructions.
3. **Upsert Storage**: Updated `POST /api/triage/batch/:datasetId` to use `TriageResult.findOneAndUpdate({ messageId: msg._id }, triageResultData, { upsert: true, new: true })` to safely support re-running batch triage.
4. **Intelligent Dynamic Mock Provider**: Upgraded `triageWithMock` in `triageService.js` to dynamically parse input text and generate unique, contextual structured JSON outputs (`refund`, `billing`, `technical`, `complaint`, `account`, `spam`) with customized summaries, suggested actions, and confidence scores for offline testing.

---

## 3. Configuration Guide

- **Live Gemini Mode**: Set `AI_PROVIDER=gemini` in `backend/.env` and ensure a valid `GEMINI_API_KEY` is provided with available quota.
- **Offline / Mock Mode**: Set `AI_PROVIDER=mock` in `backend/.env` to run the application with dynamic local AI simulation (ideal for hackathon demos without rate limits).
