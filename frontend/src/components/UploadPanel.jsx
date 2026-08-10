import React, { useState } from 'react';
import axios from 'axios';

export default function UploadPanel({ onResults }) {
  const [pasteText, setPasteText] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  async function handleSubmitPaste() {
    const lines = pasteText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) {
      setError('Please paste at least one message (one per line).');
      return;
    }
    await submitMessages(lines);
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const messages = Array.isArray(parsed) ? parsed : parsed.messages || [];
      await submitMessages(messages);
    } catch (err) {
      setError('Could not parse JSON file. Expected an array of strings or objects.');
    }
  }

  async function submitMessages(messages) {
    setLoading(true);
    setError('');
    setProgress(`Processing ${messages.length} messages... (batches of 5, ~${Math.ceil(messages.length / 5) * 3}s)`);

    try {
      const response = await axios.post('/api/messages/batch', { messages }, {
        timeout: 300000,  // 5-minute timeout for large batches
      });
      onResults(response.data.results);
      setProgress('');
      setPasteText('');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Request failed');
      setProgress('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card mb-4">
      <div className="card-header fw-semibold">
        <i className="bi bi-upload me-2"></i>
        Upload Customer Messages
      </div>
      <div className="card-body">
        {/* Paste Mode */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Paste messages (one per line)</label>
          <textarea
            className="form-control font-monospace"
            rows={5}
            placeholder={"My payment failed again\nApp keeps crashing on login\nWhere is my refund?"}
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            disabled={loading}
          />
          <button
            className="btn btn-primary mt-2"
            onClick={handleSubmitPaste}
            disabled={loading || !pasteText.trim()}
          >
            {loading ? (
              <><span className="spinner-border spinner-border-sm me-2" />Triaging...</>
            ) : (
              <><i className="bi bi-cpu me-2" />Triage All</>
            )}
          </button>
        </div>

        <div className="text-muted text-center small mb-3">— or —</div>

        {/* File Upload Mode */}
        <div>
          <label className="form-label fw-semibold">Upload JSON file</label>
          <input
            type="file"
            accept=".json"
            className="form-control"
            onChange={handleFileUpload}
            disabled={loading}
          />
          <div className="form-text">Format: <code>["message 1", "message 2"]</code> or <code>[{"{"}{"\"text\""}:"msg"{"}"}]</code></div>
        </div>

        {progress && (
          <div className="alert alert-info mt-3 mb-0">
            <span className="spinner-border spinner-border-sm me-2" />
            {progress}
          </div>
        )}
        {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
      </div>
    </div>
  );
}
