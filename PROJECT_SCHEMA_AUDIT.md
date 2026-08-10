# PROJECT SCHEMA AUDIT — Customer Message Triage System

**Audit Date:** 2026-08-10  
**Auditor:** Senior MERN Architect  
**Phase:** 1 — Read-Only Audit (No modifications made)

---

## 1. Database Connection

| Item | Value |
|---|---|
| **Connection method** | Mongoose via `mongoose.connect()` in `config/db.js` |
| **URI source** | `process.env.MONGODB_URI` from `.env` |
| **Configured URI** | `mongodb://127.0.0.1:27017/triage_system` |
| **Database name** | `triage_system` |
| **Authentication** | None (local development) |

> **WARNING — Security Issue:** The `db.js` file logs the full `MONGODB_URI` to the console on successful connection (line 6). If the URI ever contains credentials, they would be printed to stdout/logs.

> **NOTE:** The `.env.example` file uses database name `triage_system`, which matches `.env`. This is consistent.

---

## 2. MongoDB Collections Created

Based on the Mongoose models, these collections will be auto-created:

| Collection | Model File | Model Name |
|---|---|---|
| `messages` | `backend/models/Message.js` | `Message` |
| `groundtruths` | `backend/models/GroundTruth.js` | `GroundTruth` |

**Missing collections vs. requirements:**
- No `Dataset` / `Batch` collection — batches are only tracked as a UUID string field on `Message.batch_id`, with no first-class batch entity
- No `TriageResult` collection — triage data is embedded inside the `Message` document as a subdocument
- No `EvaluationRun` collection — evaluation is computed on-the-fly in the route handler, never persisted
- No `Configuration` collection or service — all business values are hardcoded

---

## 3. Mongoose Models — Detailed Schema Analysis

### 3A. Message Model

**File:** `backend/models/Message.js`

| Field | Type | Required | Issues |
|---|---|---|---|
| `raw_text` | String | Yes | No `normalizedText` stored separately |
| `batch_id` | String (UUID) | Yes | Not an ObjectId ref — no batch entity exists |
| `is_garbage` | Boolean | default false | Works |
| `triage` | Subdocument | Yes | **Critical:** Triage is embedded, not a separate document |
| `triage.category` | String enum | Yes | Enum is hardcoded in schema |
| `triage.priority` | String enum | Yes | Enum is hardcoded in schema |
| `triage.summary` | String | Yes | Works |
| `triage.suggested_action` | String | Yes | Works |
| `triage.needs_human` | Boolean | Yes | Works |
| `triage.confidence` | Number 0-1 | Yes | Works |
| `meta.tokens_input` | Number | default 0 | Works |
| `meta.tokens_output` | Number | default 0 | Works |
| `meta.cost_usd` | Number | default 0 | Always 0, never computed |
| `meta.latency_ms` | Number | default 0 | Works |
| `error` | String | default null | Works |
| `created_at` | Date | default now | Works |

**Missing fields per requirements:**
- `externalId`
- `normalizedText` (only `raw_text` exists)
- `source` (upload/paste/manual/demo)
- `status` (pending/processing/completed/failed)
- `inputWarnings` (array of strings)
- `updatedAt`
- Triage fields: `reviewStatus`, `reviewReason`, `modelName`, `promptVersion`, `schemaVersion`, `rawModelOutput`, `validationStatus`, `validationErrors`

### 3B. GroundTruth Model

**File:** `backend/models/GroundTruth.js`

| Field | Type | Required | Issues |
|---|---|---|---|
| `message_id` | ObjectId ref | Yes, unique | Works |
| `raw_text` | String | Yes | Redundant copy of message text |
| `human_label.category` | String | no validation | No enum validation — accepts any string |
| `human_label.priority` | String | no validation | No enum validation |
| `human_label.needs_human` | Boolean | no validation | Works |
| `ai_decision.category` | String | no validation | No enum validation |
| `ai_decision.priority` | String | no validation | No enum validation |
| `ai_decision.needs_human` | Boolean | no validation | Works |
| `ai_confidence` | Number | not required | Works |
| `agrees_category` | Boolean | computed in pre-save | Works |
| `agrees_priority` | Boolean | computed in pre-save | Works |
| `agrees_human_flag` | Boolean | computed in pre-save | Works |
| `created_at` | Date | default now | Works |

**Missing fields per requirements:**
- `originalTriageResultId`
- `reviewerNote`
- `reviewerId`
- `updatedAt`

> **CRITICAL BUG:** The `pre('save')` hook computes agreement fields, but the route uses `findOneAndUpdate` with `upsert`, which **bypasses save hooks**. Agreement fields (`agrees_category`, `agrees_priority`, `agrees_human_flag`) will **never be computed** for upserted documents. They will remain `undefined`, causing the evaluation report to produce incorrect results.

---

## 4. API Endpoints — Inventory

### Existing Endpoints

| Method | Path | File | Status |
|---|---|---|---|
| `GET` | `/api/health` | `server.js` L19 | Basic (no DB check) |
| `POST` | `/api/messages/batch` | `routes/messages.js` L22 | Works but synchronous |
| `GET` | `/api/messages` | `routes/messages.js` L103 | Works |
| `GET` | `/api/messages/batches` | `routes/messages.js` L118 | Works |
| `GET` | `/api/messages/:id` | `routes/messages.js` L144 | Works |
| `POST` | `/api/evaluation/label` | `routes/evaluation.js` L9 | Agreement bug |
| `GET` | `/api/evaluation/labels` | `routes/evaluation.js` L48 | Works |
| `GET` | `/api/evaluation/report` | `routes/evaluation.js` L58 | Loads ALL messages into memory |

### Missing Endpoints (per requirements)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/datasets/upload` | Upload file to create a dataset |
| `POST` | `/api/datasets/paste` | Paste text to create a dataset |
| `GET` | `/api/datasets` | List all datasets |
| `GET` | `/api/datasets/:datasetId` | Get dataset details |
| `GET` | `/api/datasets/:datasetId/messages` | Get messages in a dataset |
| `POST` | `/api/triage/message/:messageId` | Triage a single message |
| `POST` | `/api/triage/batch/:datasetId` | Triage a batch |
| `GET` | `/api/triage/batch/:datasetId/status` | Batch processing status |
| `GET` | `/api/triage/message/:messageId` | Get triage result for message |
| `GET` | `/api/triage/results` | List all triage results |
| `GET` | `/api/reviews` | List human reviews |
| `POST` | `/api/reviews/:messageId` | Create human review |
| `PUT` | `/api/reviews/:messageId` | Update human review |
| `POST` | `/api/evaluation/ground-truth` | Submit ground truth |
| `POST` | `/api/evaluation/run/:datasetId` | Run evaluation |
| `GET` | `/api/evaluation/:runId` | Get evaluation run |
| `GET` | `/api/evaluation/:runId/failures` | Get failure cases |
| `GET` | `/api/configuration` | Get system config |
| `PUT` | `/api/configuration` | Update system config |
| `GET` | `/api/health/database` | Database health |

---

## 5. Frontend Pages to API Mapping

| Page | Component | API Called | Notes |
|---|---|---|---|
| `/` Dashboard | `Dashboard.jsx` | `GET /api/messages` | On mount, loads last 200 |
| `/` Dashboard | `UploadPanel.jsx` | `POST /api/messages/batch` | Paste or JSON file upload |
| `/` Dashboard | `StatsBar.jsx` | (computed from state) | No API call |
| `/` Dashboard | `TriageTable.jsx` | (computed from state) | No API call |
| `/eval` Evaluation | `Evaluation.jsx` | `GET /api/messages?limit=20` | `limit` param NOT handled by backend |
| `/eval` Evaluation | `Evaluation.jsx` | `GET /api/evaluation/report` | Works |
| `/eval` Evaluation | `Evaluation.jsx` | `GET /api/evaluation/labels` | Works |
| `/eval` Evaluation | `Evaluation.jsx` | `POST /api/evaluation/label` | Agreement fields broken |

> **WARNING — Frontend-Backend Mismatch:** `Evaluation.jsx` sends `GET /api/messages?limit=20`, but the backend route handler does not read `req.query.limit`. The backend always returns up to 200 messages. The frontend then does `.slice(0, 20)` client-side, which works as a workaround but is wasteful.

---

## 6. What Is Implemented

| Feature | Status | Notes |
|---|---|---|
| Gemini AI integration | Yes | With system prompt, JSON output mode |
| OpenRouter fallback | Yes | Used when `OPENROUTER_API_KEY` set and no `GEMINI_API_KEY` |
| Garbage pre-filter | Yes | Saves API quota for empty/junk input |
| JSON validation of AI output | Yes | Validates all 6 fields + types |
| Auto-enforce `needs_human` rules | Yes | Low confidence, P0, unclear |
| Safe fallback on AI failure | Yes | Returns valid triage with `confidence: 0` |
| Rate limiting (batch delay) | Yes | 5 messages/chunk, 3s delay between chunks |
| Prompt injection defense | Yes | In system prompt + classified as `spam` |
| Message truncation (1500 chars) | Yes | Before sending to AI |
| Color-coded triage table | Yes | Priority-based row colors, category/confidence badges |
| Sortable table columns | Yes | Priority, category, confidence |
| Filter by needs_human | Yes | Checkbox in table header |
| Ground truth labeling UI | Yes | Select dropdowns for category/priority/needs_human |
| Evaluation report display | Yes | Agreement rates, system stats, failure table |

---

## 7. What Is Missing

| Required Feature | Status |
|---|---|
| Dataset/Batch entity model | Missing |
| Separate TriageResult model | Missing (embedded in Message) |
| Separate HumanLabel/HumanReview model | Missing (GroundTruth partially covers this) |
| EvaluationRun model (persisted) | Missing (computed on-the-fly) |
| Configuration model/service | Missing (all hardcoded) |
| Message `status` field | Missing |
| Message `normalizedText` field | Missing |
| Message `source` field | Missing |
| Message `inputWarnings` field | Missing |
| Triage `reviewStatus` field | Missing |
| Triage `modelName` field | Missing |
| Triage `promptVersion` field | Missing |
| Triage `rawModelOutput` field | Missing |
| Triage `validationStatus` field | Missing |
| AI retry on failure (max 1) | No retry logic |
| Dataset CRUD endpoints | Missing |
| Triage-specific endpoints | Missing |
| Human review CRUD endpoints | Missing |
| Configuration endpoints | Missing |
| Database health endpoint | Missing |
| Message detail/inspect view | No way to click and view a full message |
| Processing progress indicator | Partial (text estimate, no real-time updates) |
| Search/filter in triage results | Partial (only needs_human filter) |
| CSV upload support | Missing |
| Confusion matrix | Missing |
| Provisional labels on categories/priorities | Not communicated in UI |
| README.md | Missing |
| Test files | Missing |
| Runtime validation (Joi/Zod) | Missing |

---

## 8. Partially Implemented Features

| Feature | What Works | What is Missing |
|---|---|---|
| Batch processing | Processes messages, saves results | No Dataset entity, no batch status tracking, no async processing |
| Evaluation | Computes agreement rates on-the-fly | Not persisted as EvaluationRun, agreement bug with upsert, no confusion matrix |
| Health check | Returns `{status: ok}` | No database connectivity check, no collection stats |
| Error handling | Global error handler middleware | No input validation middleware, no request-level validation |
| Human labeling | UI works for setting labels | Agreement fields not computed (upsert bypasses pre-save hook) |

---

## 9. Schema Mismatches

| Location A | Location B | Mismatch |
|---|---|---|
| `Message.triage.category` enum in Mongoose | `VALID_CATEGORIES` in triageService.js | Same values but defined twice — no single source of truth |
| `Message.triage.category` enum in Mongoose | `CATEGORIES` in Evaluation.jsx | Same values but defined a third time |
| `Message.triage.category` enum in Mongoose | `CATEGORY_BADGE` keys in TriageTable.jsx | Same values but defined a fourth time |
| `GroundTruth.human_label.category` | No enum validation | Accepts any arbitrary string — can create labels that don't match category list |

---

## 10. Hardcoded Business Values

| Value | Location | Issue |
|---|---|---|
| Categories list | Message.js L6, triageService.js L119, Evaluation.jsx L5, TriageTable.jsx L17 | Duplicated 4 times. Cannot be changed without editing 4 files. |
| Priority list | Same 4 locations | Duplicated 4 times |
| Priority definitions (P0-P3) | Only in AI system prompt | Not configurable, not displayed in UI |
| Category definitions | Only in AI system prompt | Not configurable, not displayed in UI |
| Confidence threshold (0.70) | triageService.js L131 | Hardcoded |
| Batch size (5) | messages.js L41 | Hardcoded |
| Batch delay (3000ms) | messages.js L42 | Hardcoded |
| Max messages per batch (100) | messages.js L36 | Hardcoded |
| Max input length (1500 chars) | triageService.js L167 | Hardcoded |
| System prompt | triageService.js L3-66 | Embedded as giant string |

---

## 11. Security and Reliability Issues

| # | Severity | Issue | Location |
|---|---|---|---|
| S1 | HIGH | `.env` contains a real `GEMINI_API_KEY` — if committed, key is leaked. No root-level `.gitignore` | `.env` |
| S2 | HIGH | `db.js` logs full MongoDB URI to console — could leak credentials | `config/db.js` L6 |
| S3 | MEDIUM | No input sanitization on `raw_text` before storing in MongoDB | `routes/messages.js` L74 |
| S4 | MEDIUM | `evaluation/report` loads ALL messages with `Message.find({})` into memory — will crash with large datasets | `routes/evaluation.js` L87 |
| S5 | MEDIUM | `POST /api/messages/batch` is synchronous — for 100 messages with 3s delays, HTTP request blocks ~60 seconds | `routes/messages.js` L22 |
| S6 | MEDIUM | No rate limiting on API endpoints | `server.js` |
| S7 | MEDIUM | CORS is fully open (`app.use(cors())`) — any origin can call the API | `server.js` L15 |
| S8 | HIGH | GroundTruth `pre('save')` hook is bypassed by `findOneAndUpdate` — agreement fields are never computed | `routes/evaluation.js` L21 |
| S9 | MEDIUM | No retry logic when Gemini API call fails — single attempt only | `triageService.js` L173-184 |
| S10 | LOW | `errorHandler.js` exposes stack traces when `NODE_ENV` is not `production` | `middleware/errorHandler.js` L6 |
| S11 | MEDIUM | Gemini model is initialized at module load time — if `GEMINI_API_KEY` is missing, backend may crash on startup | `triageService.js` L78-88 |
| S12 | MEDIUM | `.env` shows `GEMINI_MODEL=gemini-3.5-flash-lite` but `.env.example` says `gemini-2.0-flash-lite` — mismatch | `.env` |

---

## 12. Backend Server Status

| Check | Result |
|---|---|
| Port 3000 (from .env) | Not responding |
| Port 5000 (code default) | Not responding |
| Port 5173 (Vite frontend) | Not responding |

The user's terminal metadata indicated `npm start` and `npm run dev` were running, but neither server responded to HTTP requests during this audit. This could be due to MongoDB not running, a crash on startup, or the processes having since terminated.

---

## 13. Summary of Critical Issues Requiring Immediate Attention

1. **GroundTruth agreement fields never computed** (S8) — The entire evaluation feature is silently broken
2. **No Dataset/Batch model** — Cannot track upload status, source, or batch metadata
3. **Triage embedded in Message** — Cannot independently query, version, or audit triage results
4. **No Configuration service** — Categories, priorities, and thresholds are hardcoded 4x across the codebase
5. **Category/priority enums duplicated in 4 places** — Will drift and cause mismatches
6. **No runtime request validation** — Backend accepts any JSON shape without error
7. **No retry on AI failure** — Single point of failure per message
8. **No tests, no README** — No way to verify correctness or onboard new developers
9. **Evaluation report loads entire message collection into memory** — Will not scale

---

## 14. Recommendations for Phase 2

1. Create `Dataset`, `TriageResult`, `HumanReview`, `EvaluationRun`, and `Configuration` models
2. Refactor `Message` model to separate triage results into their own collection
3. Fix the GroundTruth agreement computation (use `save()` instead of `findOneAndUpdate`, or compute in the route)
4. Create a shared constants/config module as the single source of truth for categories, priorities, and thresholds
5. Add Joi or Zod for request validation
6. Add retry logic to triage service
7. Add database health endpoint
8. Add all missing API endpoints per the specification
9. Create comprehensive tests
10. Create README.md
