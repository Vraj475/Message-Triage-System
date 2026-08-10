const express = require('express');
const router = express.Router();
const {
  CATEGORIES,
  PRIORITIES,
  CATEGORY_VALUES,
  PRIORITY_VALUES,
  THRESHOLDS,
  BATCH_SETTINGS,
  AI_SETTINGS,
  HUMAN_REVIEW_RULES,
} = require('../config/constants');
const { validate, configurationUpdateSchema } = require('../validators');

// GET /api/configuration — return current configuration
router.get('/', (req, res) => {
  res.json({
    provisional: true,
    provisionalNote: 'Categories and P0–P3 definitions are PROVISIONAL. The company has not yet provided the final real dataset, official category list, category definitions, or exact meanings of P0–P3. These are editable placeholders.',
    categories: CATEGORIES,
    priorities: PRIORITIES,
    thresholds: THRESHOLDS,
    batchSettings: BATCH_SETTINGS,
    aiSettings: {
      promptVersion: AI_SETTINGS.promptVersion,
      schemaVersion: AI_SETTINGS.schemaVersion,
      maxRetries: AI_SETTINGS.maxRetries,
      // Do NOT expose temperature, maxOutputTokens, or API keys
    },
    humanReviewRules: HUMAN_REVIEW_RULES,
  });
});

// PUT /api/configuration — update configuration (in-memory only for now)
router.put('/', validate(configurationUpdateSchema), (req, res) => {
  // NOTE: This is a placeholder. In production, this should persist to database.
  // For now, we return the submitted values to confirm they're valid.
  res.json({
    message: 'Configuration update received and validated. Note: In this version, configuration is loaded from constants.js and changes do not persist across restarts. To make permanent changes, edit backend/config/constants.js.',
    received: req.validatedBody,
  });
});

module.exports = router;
