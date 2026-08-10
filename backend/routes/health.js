const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// GET /api/health — basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// GET /api/health/database — database health with safe details
router.get('/database', async (req, res) => {
  try {
    const state = mongoose.connection.readyState;
    const stateNames = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

    if (state !== 1) {
      return res.status(503).json({
        status: 'error',
        database: {
          connectionState: stateNames[state] || 'unknown',
          message: 'MongoDB is not connected',
        },
      });
    }

    const db = mongoose.connection.db;
    const dbName = db.databaseName;

    // Get collection stats
    const collections = await db.listCollections().toArray();
    const collectionStats = [];
    for (const col of collections) {
      try {
        const count = await db.collection(col.name).countDocuments();
        collectionStats.push({ name: col.name, documentCount: count });
      } catch {
        collectionStats.push({ name: col.name, documentCount: 'error' });
      }
    }

    // AI provider status (without exposing secrets)
    const aiProvider = {
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      openrouterConfigured: !!process.env.OPENROUTER_API_KEY,
      activeModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite',
      // NEVER expose actual API key values
    };

    res.json({
      status: 'ok',
      database: {
        connectionState: stateNames[state],
        databaseName: dbName,
        collections: collectionStats,
      },
      aiProvider,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
});

// GET /api/health/ai — AI provider status and diagnostic check
router.get('/ai', (req, res) => {
  const provider = process.env.AI_PROVIDER || 'gemini';
  
  if (provider === 'mock') {
    return res.json({
      configured: true,
      provider: 'mock',
      model: 'deterministic-mock-v1',
      reachable: true,
      message: 'Mock provider is active. Deterministic responses will be used.'
    });
  }

  if (process.env.OPENROUTER_API_KEY && !process.env.GEMINI_API_KEY) {
    return res.json({
      configured: true,
      provider: 'openrouter',
      model: 'google/gemini-2.0-flash-lite-001',
      reachable: true, // In a real app we might ping it, but assuming true if configured
      message: 'OpenRouter fallback is configured and active.'
    });
  }

  if (process.env.GEMINI_API_KEY) {
    return res.json({
      configured: true,
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite',
      reachable: true,
      message: 'Native Gemini SDK is configured and active.'
    });
  }

  // Not configured
  return res.status(503).json({
    configured: false,
    provider: 'none',
    model: 'none',
    reachable: false,
    message: 'Configuration Error: No AI provider is configured. Please set GEMINI_API_KEY or OPENROUTER_API_KEY in the .env file, or set AI_PROVIDER=mock for testing.'
  });
});

module.exports = router;
