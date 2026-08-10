const assert = require('assert');

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- Starting API Verification ---');
  let failures = 0;
  
  // Helper to run a test block
  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   ${err.message}`);
      failures++;
    }
  }

  // 1. Health and Configuration
  await test('GET /api/health/database - Database connectivity', async () => {
    const res = await fetch(`${API_URL}/health/database`);
    assert.strictEqual(res.status, 200, 'Health endpoint should return 200');
    const data = await res.json();
    assert.strictEqual(data.database.connectionState, 'connected', 'Database should be connected');
    assert.strictEqual(data.database.databaseName, 'triage_system', 'Should use triage_system DB');
  });

  await test('GET /api/configuration - Returns config without secrets', async () => {
    const res = await fetch(`${API_URL}/configuration`);
    const data = await res.json();
    assert(data.categories.length > 0, 'Categories exist');
    assert(data.aiSettings.promptVersion, 'AI settings exist');
    assert(!data.aiSettings.GEMINI_API_KEY, 'API key should not be exposed');
  });

  // 2. Dataset Creation & Validation
  let datasetId = null;
  let messageIds = [];

  await test('POST /api/datasets/paste - Empty input fails validation', async () => {
    const res = await fetch(`${API_URL}/datasets/paste`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] })
    });
    assert.strictEqual(res.status, 400, 'Empty messages should 400');
  });

  await test('POST /api/datasets/paste - Valid input creates dataset', async () => {
    const res = await fetch(`${API_URL}/datasets/paste`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Dataset',
        messages: [
          'My payment failed',
          'App is crashing',
          '???' // garbage text
        ]
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201, 'Should create successfully');
    assert.strictEqual(data.dataset.messageCount, 3, 'Should track count');
    assert.strictEqual(data.messages.length, 3, 'Should return messages');
    
    datasetId = data.dataset._id;
    messageIds = data.messages.map(m => m._id);
  });

  // 3. Triage Process
  await test('POST /api/triage/message/:id - Single message triage', async () => {
    // Triage the first message
    const res = await fetch(`${API_URL}/triage/message/${messageIds[0]}`, { method: 'POST' });
    const data = await res.json();
    assert.strictEqual(res.status, 200, 'Single triage should succeed');
    assert(data.triageResult, 'Should return triage result');
    assert.strictEqual(data.triageResult.messageId, messageIds[0]);
    assert(data.triageResult.category, 'Must have a category');
    assert(['valid', 'invalid'].includes(data.triageResult.validationStatus), 'Output should have a validation status');
  });

  await test('POST /api/triage/batch/:datasetId - Batch triage remaining', async () => {
    const res = await fetch(`${API_URL}/triage/batch/${datasetId}`, { method: 'POST' });
    const data = await res.json();
    // It could be 2 or 3 depending on whether the single triage hit the quota and failed (status='failed' gets retried)
    assert([2, 3].includes(data.total), 'Should triage remaining (or failed) messages');
    
    // The third message was '???' (garbage)
    const garbageResult = data.results.find(r => r.needsHuman === true && r.category === 'unclear');
    assert(garbageResult, 'Should have safely pre-filtered garbage input');
  });

  // 4. Human Review & Evaluation
  await test('POST /api/reviews/:id - Create human review', async () => {
    const res = await fetch(`${API_URL}/reviews/${messageIds[0]}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'billing',
        priority: 'P1',
        needsHuman: false
      })
    });
    assert.strictEqual(res.status, 201, 'Review should be created');
  });

  await test('POST /api/evaluation/run/:datasetId - Run evaluation', async () => {
    const res = await fetch(`${API_URL}/evaluation/run/${datasetId}`, { method: 'POST' });
    const data = await res.json();
    assert.strictEqual(res.status, 201, 'Evaluation should run');
    // Only 1 message has both AI triage and Human review
    assert.strictEqual(data.datasetSize, 1, 'Evaluates only matched messages');
    assert(data.confusionMatrix, 'Confusion matrix generated');
  });

  console.log('--- Verification Complete ---');
  if (failures > 0) {
    console.error(`\nFound ${failures} failures.`);
    process.exit(1);
  } else {
    console.log('\nAll tests passed successfully! 🎉');
    process.exit(0);
  }
}

runTests();
