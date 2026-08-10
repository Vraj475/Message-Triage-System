require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Environment & Startup Guard Check
console.log('AI Provider:', process.env.AI_PROVIDER || 'gemini');
console.log('Gemini Key set:', !!process.env.GEMINI_API_KEY);
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'set' : 'MISSING');

if (!process.env.MONGODB_URI) {
  console.error('[FATAL] MONGODB_URI is missing from environment. Exiting.');
  process.exit(1);
}

if (process.env.AI_PROVIDER === 'gemini' && !process.env.GEMINI_API_KEY) {
  console.warn('[WARNING] AI_PROVIDER is set to gemini but GEMINI_API_KEY is missing. Falling back to mock provider.');
  process.env.AI_PROVIDER = 'mock';
}

// Unhandled Promise Rejection Trap
process.on('unhandledRejection', (err) => {
  console.error('[Unhandled Rejection]', err);
});

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// API Routes
app.use('/api', require('./routes/api'));

// Global error handler — MUST be last
app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR]', err);
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, error: err.message });
  }
  if (err.name === 'MongoNetworkError' || err.name === 'MongooseServerSelectionError') {
    return res.status(503).json({ success: false, error: 'Database service unavailable. Please check MongoDB connection.' });
  }
  res.status(err.status || 500).json({ success: false, error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
