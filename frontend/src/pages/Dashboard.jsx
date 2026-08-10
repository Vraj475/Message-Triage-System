import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UploadPanel from '../components/UploadPanel';
import TriageTable from '../components/TriageTable';
import StatsBar from '../components/StatsBar';

export default function Dashboard() {
  const [messages, setMessages] = useState([]);

  // Load existing messages on mount (last 200)
  useEffect(() => {
    axios.get('/api/messages').then(res => setMessages(res.data)).catch(() => {});
  }, []);

  function handleResults(newResults) {
    setMessages(prev => [...newResults, ...prev]);
  }

  return (
    <>
      <h4 className="fw-bold mb-4">
        <i className="bi bi-funnel me-2 text-primary"></i>
        Customer Message Triage Dashboard
      </h4>

      <UploadPanel onResults={handleResults} />

      {messages.length > 0 && (
        <>
          <StatsBar messages={messages} />
          <TriageTable messages={messages} />
        </>
      )}

      {messages.length === 0 && (
        <div className="text-center text-muted py-5">
          <i className="bi bi-inbox fs-1 d-block mb-2"></i>
          <p>Upload a batch of customer messages above to start triaging.</p>
        </div>
      )}
    </>
  );
}
