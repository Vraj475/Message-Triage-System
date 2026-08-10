require('dotenv').config();
const mongoose = require('mongoose');
const Dataset = require('../models/Dataset');
const Message = require('../models/Message');
const TriageResult = require('../models/TriageResult');
const HumanReview = require('../models/HumanReview');
const EvaluationRun = require('../models/EvaluationRun');

async function resetDatabase() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/triage_system';
  console.log(`Connecting to MongoDB...`);
  
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB. Resetting database...');

    const datasetRes = await Dataset.deleteMany({});
    const messageRes = await Message.deleteMany({});
    const triageRes = await TriageResult.deleteMany({});
    const reviewRes = await HumanReview.deleteMany({});
    const evalRes = await EvaluationRun.deleteMany({});

    console.log('--- Database Reset Complete ---');
    console.log(`Deleted Datasets:        ${datasetRes.deletedCount}`);
    console.log(`Deleted Messages:        ${messageRes.deletedCount}`);
    console.log(`Deleted TriageResults:   ${triageRes.deletedCount}`);
    console.log(`Deleted HumanReviews:    ${reviewRes.deletedCount}`);
    console.log(`Deleted EvaluationRuns:  ${evalRes.deletedCount}`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error resetting database:', err);
    process.exit(1);
  }
}

resetDatabase();
