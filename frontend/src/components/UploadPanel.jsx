import React, { useState } from 'react';
import axios from 'axios';

export default function UploadPanel({ onUploadComplete }) {
  const [pasteText, setPasteText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmitPaste() {
    const lines = pasteText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) {
      setError('Please paste at least one message (one per line).');
      return;
    }
    await submitMessages(lines, 'paste');
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const messages = Array.isArray(parsed) ? parsed : parsed.messages || [];
      if (messages.length === 0) {
        setError('JSON file contains no messages.');
        return;
      }
      await submitMessages(messages, 'upload', file.name);
    } catch (err) {
      setError('Could not parse JSON file. Expected an array of strings or objects.');
    }
    // Reset file input
    e.target.value = '';
  }

  async function submitMessages(messages, source, fileName) {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = source === 'upload' ? '/api/datasets/upload' : '/api/datasets/paste';
      const response = await axios.post(endpoint, {
        messages,
        fileName,
      });
      setSuccess(`Created dataset with ${response.data.total} messages. Click "Triage All Pending" to process.`);
      setPasteText('');
      onUploadComplete(response.data.dataset);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.details?.join(', ') || err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card mb-4">
      <div className="card-header fw-semibold">
        <i className="bi bi-upload me-2"></i>
        Upload Messages
      </div>
      <div className="card-body">
        {/* Paste Mode */}
        <div className="mb-3">
          <label className="form-label fw-semibold small">Paste messages (one per line)</label>
          <textarea
            className="form-control font-monospace"
            rows={4}
            placeholder={"My payment failed again\nApp keeps crashing on login\nWhere is my refund?"}
            value={pasteText}
            onChange={e => { setPasteText(e.target.value); setError(''); setSuccess(''); }}
            disabled={loading}
            style={{ fontSize: '0.85em' }}
          />
          <button
            className="btn btn-primary btn-sm mt-2"
            onClick={handleSubmitPaste}
            disabled={loading || !pasteText.trim()}
          >
            {loading ? (
              <><span className="spinner-border spinner-border-sm me-1" />Uploading...</>
            ) : (
              <><i className="bi bi-plus-circle me-1" />Create Dataset</>
            )}
          </button>
        </div>

        <div className="text-muted text-center small mb-3">— or —</div>

        {/* File Upload Mode */}
        <div>
          <label className="form-label fw-semibold small">Upload JSON file</label>
          <input
            type="file"
            accept=".json"
            className="form-control form-control-sm"
            onChange={handleFileUpload}
            disabled={loading}
          />
          <div className="form-text">Format: <code>["msg1", "msg2"]</code> or <code>[{"{"}"text":"msg"{"}"}]</code></div>
        </div>

        {success && <div className="alert alert-success mt-3 mb-0 small"><i className="bi bi-check-circle me-1"></i>{success}</div>}
        {error && <div className="alert alert-danger mt-3 mb-0 small">{error}</div>}
      </div>
    </div>
  );
}
