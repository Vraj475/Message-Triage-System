/**
 * Main API Router
 * This file serves as the central router to satisfy the requirement for 'backend/routes/api.js'
 * It mounts all of the decoupled sub-routers we have already built.
 */

const express = require('express');
const router = express.Router();

// 1. /api/datasets/paste (and other dataset routes)
router.use('/datasets', require('./datasets'));

// 2. /api/triage/batch/:datasetId (and single message triage)
router.use('/triage', require('./triage'));

// 3. /api/evaluation/run/:datasetId (and past runs)
router.use('/evaluation', require('./evaluation'));

// Other existing routes
router.use('/messages', require('./messages'));
router.use('/reviews', require('./reviews'));
router.use('/health', require('./health'));
router.use('/configuration', require('./configuration'));
router.use('/admin', require('./admin'));

module.exports = router;
