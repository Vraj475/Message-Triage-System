import React, { useState } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';

export default function UploadPanel({ onUploadComplete }) {
  const { addToast } = useToast();
  const [pasteText, setPasteText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const parsedLines = pasteText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  async function handleSubmitPaste() {
    if (parsedLines.length === 0) {
      setError('Please paste at least one message (one per line).');
      return;
    }
    await submitMessages(parsedLines, 'paste');
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
    e.target.value = '';
  }

  async function submitMessages(messages, source, fileName) {
    setLoading(true);
    setError('');

    try {
      const endpoint = source === 'upload' ? '/api/datasets/upload' : '/api/datasets/paste';
      const response = await axios.post(endpoint, {
        messages,
        fileName,
      });
      addToast(`Dataset created with ${response.data.total} messages.`, 'success');
      setPasteText('');
      if (onUploadComplete) onUploadComplete(response.data.dataset);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.details?.join(', ') || err.message || 'Upload failed';
      setError(msg);
      addToast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card mb-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <div className="card-header fw-semibold py-3 d-flex align-items-center justify-content-between" style={{ backgroundColor: 'transparent', borderBottom: '1px solid var(--border)' }}>
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-cloud-arrow-up-fill text-primary"></i>
          <span>Upload Customer Messages</span>
        </div>
        {parsedLines.length > 0 && (
          <span className="badge" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--accent)', border: '1px solid var(--border)' }}>
            {parsedLines.length} message{parsedLines.length === 1 ? '' : 's'} detected
          </span>
        )}
      </div>
      <div className="card-body">
        {/* Monospace Paste Box with Dashed Border */}
        <div
          style={{
            border: '2px dashed var(--border)',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-primary)',
            padding: '16px',
            marginBottom: '16px',
          }}
        >
          <label className="form-label fw-semibold small  mb-2">
            Paste raw customer messages (one line per message)
          </label>
          <textarea
            className="form-control font-mono"
            rows={5}
            placeholder={"I was charged twice for subscription\nPlease refund $29 immediately\nApp keeps crashing when I login"}
            value={pasteText}
            onChange={e => { setPasteText(e.target.value); setError(''); }}
            disabled={loading}
            style={{
              fontSize: '12px',
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border)',
            }}
          />
          <div className="d-flex justify-content-between align-items-center mt-3">
            <span style={{ fontSize: '11px' }}>
              Each line is stored as a separate pending message.
            </span>
            <button
              className="btn btn-sm text-white fw-bold"
              style={{ backgroundColor: 'var(--accent)', border: 'none', padding: '6px 16px' }}
              onClick={handleSubmitPaste}
              disabled={loading || parsedLines.length === 0}
            >
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-1" />Creating...</>
              ) : (
                <><i className="bi bi-plus-lg me-1" />Upload Dataset</>
              )}
            </button>
          </div>
        </div>

        {/* JSON File Upload */}
        <div className="d-flex align-items-center gap-3 pt-2 border-top border-secondary">
          <div style={{ flex: 1 }}>
            <label className="form-label fw-semibold small text-muted mb-1">
              Upload JSON file
            </label>
            <input
              type="file"
              accept=".json"
              className="form-control form-control-sm"
              style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
              onChange={handleFileUpload}
              disabled={loading}
            />
          </div>
        </div>

        {error && (
          <div className="alert alert-danger mt-3 mb-0 small py-2">
            <i className="bi bi-exclamation-triangle me-1"></i>{error}
          </div>
        )}
      </div>
    </div>
  );
}
