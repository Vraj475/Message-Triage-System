# TriageAI - Customer Message Triage System ⚡

![TriageAI Dashboard Banner](https://via.placeholder.com/1200x400/0f1117/e8eaf0?text=TriageAI+-+Intelligent+Customer+Support)

TriageAI is a high-performance, AI-powered internal operations dashboard built for modern customer support teams. It takes raw batches of customer messages and uses advanced LLMs (Gemini / OpenRouter) to instantly triage, categorize, and prioritize them, completely removing the bottleneck of manual initial reviews.

## 🚀 Features

*   **Intelligent Auto-Triage**: Automatically assigns categories (Billing, Technical, Refund, etc.), priority levels (P0-P3), and confidence scores to incoming messages.
*   **Human-in-the-Loop Evaluation**: Ground truth evaluation module where human agents can override AI decisions.
*   **Performance Metrics & Confusion Matrix**: Real-time evaluation dashboard comparing AI predictions vs. Human ground-truth to measure Category Match, Priority Match, and Escalation Accuracy.
*   **Batch Processing**: Upload hundreds of messages at once and process them efficiently with built-in rate-limit handling and smart retries.
*   **Modern "Dark Ops" UI**: A clinical, high-contrast, professional-grade interface optimized for operations teams handling high volumes of data. Built with React and tailored CSS variables.
*   **Extensible AI Providers**: Seamlessly switch between Google Gemini, OpenRouter, or Mock AI for local testing.

## 🛠 Tech Stack

**Frontend**
*   React 18 + Vite
*   React Router DOM v6
*   Axios for API communication
*   Bootstrap 5 (headless usage) + Custom CSS Token System

**Backend**
*   Node.js 20 + Express
*   MongoDB (Mongoose ODM)
*   `@google/generative-ai` & OpenRouter integrations

## 📦 Installation & Setup

### Prerequisites
*   Node.js v18 or v20+
*   MongoDB (running locally on port `27017` or via MongoDB Atlas)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/triage-ai.git
cd triage-ai
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/triage_system
AI_PROVIDER=gemini # options: gemini, openrouter, mock
GEMINI_API_KEY=your_gemini_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
```
Start the backend server:
```bash
npm start
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```
Start the frontend development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## 🧠 System Architecture

1.  **Data Ingestion**: Users paste raw text messages into the Upload portal. The backend creates a unique `Dataset` and distinct `Message` documents.
2.  **Triage Pipeline**: The Batch API pulls all pending messages and processes them sequentially (with jitter/delay) through the selected AI provider.
3.  **Strict JSON Generation**: The system prompt aggressively enforces a JSON schema to ensure the LLM returns structured data (`category`, `priority`, `needsHuman`, `summary`).
4.  **Guardrails**: Messages shorter than 10 characters immediately trigger a fallback offline triage (`needsHuman: true`), saving API costs.
5.  **Metrics Generation**: Evaluation algorithms compute exactly where the LLM deviates from human logic.

## 📂 Project Structure

```text
├── backend/
│   ├── controllers/      # Route handlers
│   ├── models/           # Mongoose schemas (Dataset, Message, Review)
│   ├── routes/           # Express API routes
│   ├── services/         # Core AI logic (triageService.js)
│   ├── server.js         # Backend entry point
│   └── .env
└── frontend/
    ├── src/
    │   ├── components/   # Reusable UI components (TriageTable, EvalReport, etc.)
    │   ├── pages/        # Main route views (Dashboard, Upload, Evaluation)
    │   ├── styles/       # CSS tokens and design system (variables.css)
    │   ├── App.jsx       # Routing & Layout
    │   └── main.jsx
    └── vite.config.js
```

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License
This project is licensed under the MIT License - see the LICENSE file for details.
