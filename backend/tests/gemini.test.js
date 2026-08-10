const API_URL = 'http://localhost:5000/api';

async function testLiveGemini() {
  console.log('--- Testing Live Triage Pipeline ---');
  
  const pasteRes = await fetch(`${API_URL}/datasets/paste`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'OpenRouter Live Test',
      messages: [
        'I was double charged for my monthly plan. Please refund $29 immediately.',
        'The mobile application keeps throwing error 500 when I attempt to upload a profile picture.',
        'Your service is terrible and I demand to speak to a supervisor!'
      ]
    })
  });

  const pasteData = await pasteRes.json();
  console.log('Created dataset:', pasteData.dataset._id);
  
  const triageRes = await fetch(`${API_URL}/triage/batch/${pasteData.dataset._id}`, { method: 'POST' });
  const triageData = await triageRes.json();
  
  console.log('Batch Triage Summary:', triageData);

  const msgsRes = await fetch(`${API_URL}/datasets/${pasteData.dataset._id}/messages`);
  const msgsData = await msgsRes.json();
  
  console.log(`\nFetched ${msgsData.length} messages from database:`);
  msgsData.forEach((m, idx) => {
    console.log(`\n--- Message ${idx + 1} ---`);
    console.log('Raw Text:         ', m.rawText);
    console.log('Status:           ', m.status);
    console.log('Category:         ', m.triage?.category);
    console.log('Priority:         ', m.triage?.priority);
    console.log('Summary:          ', m.triage?.summary);
    console.log('Suggested Action: ', m.triage?.suggestedAction);
    console.log('Validation Status:', m.triage?.validationStatus);
  });
}

testLiveGemini();
