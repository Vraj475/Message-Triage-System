const Joi = require('joi');
const {
  CATEGORY_VALUES,
  CATEGORY_VALUES_WITH_UNKNOWN,
  PRIORITY_VALUES,
  DATASET_SOURCES,
} = require('../config/constants');

// ─── Datasets ───────────────────────────────────────────────

const datasetPasteSchema = Joi.object({
  name: Joi.string().trim().max(200).optional(),
  messages: Joi.array()
    .items(
      Joi.alternatives().try(
        Joi.string().max(10000).allow(''),
        Joi.object()    // objects with .text, .message, .body, etc.
      )
    )
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.min': 'At least one message is required',
      'array.max': 'Maximum 100 messages per batch',
    }),
});

// ─── Triage ─────────────────────────────────────────────────

const triageSingleSchema = Joi.object({
  // no body needed — messageId comes from URL param
});

const triageBatchSchema = Joi.object({
  // no body needed — datasetId comes from URL param
});

// ─── Human Review ───────────────────────────────────────────

const humanReviewCreateSchema = Joi.object({
  category: Joi.string().valid(...CATEGORY_VALUES_WITH_UNKNOWN).required(),
  priority: Joi.string().valid(...PRIORITY_VALUES).required(),
  needsHuman: Joi.boolean().required(),
  reviewerNote: Joi.string().max(1000).allow(null, '').optional(),
  reviewerId: Joi.string().max(100).allow(null, '').optional(),
});

const humanReviewUpdateSchema = Joi.object({
  category: Joi.string().valid(...CATEGORY_VALUES_WITH_UNKNOWN).optional(),
  priority: Joi.string().valid(...PRIORITY_VALUES).optional(),
  needsHuman: Joi.boolean().optional(),
  reviewerNote: Joi.string().max(1000).allow(null, '').optional(),
  reviewerId: Joi.string().max(100).allow(null, '').optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

// ─── Evaluation ─────────────────────────────────────────────

const evaluationRunSchema = Joi.object({
  name: Joi.string().trim().max(200).optional(),
});

// ─── Configuration ──────────────────────────────────────────

const configurationUpdateSchema = Joi.object({
  categories: Joi.array().items(Joi.object({
    value: Joi.string().required(),
    label: Joi.string().required(),
    description: Joi.string().allow('').required(),
  })).optional(),
  priorities: Joi.array().items(Joi.object({
    value: Joi.string().pattern(/^P[0-3]$/).required(),
    label: Joi.string().required(),
    description: Joi.string().allow('').required(),
  })).optional(),
  thresholds: Joi.object({
    confidenceForHumanReview: Joi.number().min(0).max(1).optional(),
    maxInputLength: Joi.number().integer().min(100).max(10000).optional(),
    minTextLength: Joi.number().integer().min(1).max(20).optional(),
  }).optional(),
}).min(1);

// ─── Middleware helper ──────────────────────────────────────

/**
 * Express middleware factory: validates req.body against a Joi schema.
 * Returns 400 with details on failure; calls next() on success.
 */
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: false,
      allowUnknown: false,
    });
    if (error) {
      const details = error.details.map(d => d.message);
      return res.status(400).json({
        error: 'Validation failed',
        details,
      });
    }
    req.validatedBody = value;
    next();
  };
}

/**
 * Validates a Mongoose ObjectId string.
 * Use in route params: e.g. validate that :messageId is a valid ObjectId.
 */
function validateObjectId(paramName) {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        error: `Invalid ${paramName}: must be a 24-character hex string`,
      });
    }
    next();
  };
}

module.exports = {
  datasetPasteSchema,
  triageSingleSchema,
  triageBatchSchema,
  humanReviewCreateSchema,
  humanReviewUpdateSchema,
  evaluationRunSchema,
  configurationUpdateSchema,
  validate,
  validateObjectId,
};
