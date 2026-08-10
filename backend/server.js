require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const messagesRouter = require('./routes/messages');
const evaluationRouter = require('./routes/evaluation');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Connect to MongoDB local
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/messages', messagesRouter);
app.use('/api/evaluation', evaluationRouter);

// Global error handler — MUST be last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
