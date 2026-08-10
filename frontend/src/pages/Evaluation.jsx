import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EvalReport from '../components/EvalReport';

const CATEGORIES = ['billing', 'technical', 'complaint', 'refund', 'account', 'inquiry', 'spam', 'unclear'];
const PRIORITIES = ['P0', 'P1', 'P2', 'P3'];

export default function Evaluation() {
  const [messages, setMessages] = useState([]);
  const [labels, setLabels] = useState({});   // message_id -> {category, priority, needs_human}
  const [report, setReport] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load recent 20 messages for labeling
    axios.get('/api/messages?limit=20').then(res => {
      setMessages(res.data.slice(0, 20));
    });
    // Load existing labels and report
    axios.get('/api/evaluation/report').then(res => setReport(res.data)).catch(() => {});
    axios.get('/api/evaluation/labels').then(res => {
      const saved = new Set(res.data.map(l => String(l.message_id)));
      setSavedIds(saved);
    });
  }, []);

  function updateLabel(msgId, field, value) {
    setLabels(prev => ({
      ...prev,
      [msgId]: { ...prev[msgId], [field]: value }
    }));
  }

  async function saveLabel(msg) {
    const label = labels[msg._id];
    if (!label?.category || !label?.priority || label?.needs_human === undefined) {
      alert('Please set category, priority, and needs-human before saving.');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/evaluation/label', {
        message_id: msg._id,
        human_category: label.category,
        human_priority: label.priority,
        human_needs_human: label.needs_human,
      });
      setSavedIds(prev => new Set([...prev, String(msg._id)]));
      // Refresh report
      const reportRes = await axios.get('/api/evaluation/report');
      setReport(reportRes.data);
    } catch (err) {
      alert('Save failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h4 className="fw-bold mb-4">
        <i className="bi bi-clipboard-check me-2 text-success"></i>
        Evaluation — Ground Truth Labeling
      </h4>

      <EvalReport report={report} />

      <div className="card">
        <div className="card-header fw-semibold">
          Label messages as ground truth ({savedIds.size} saved)
        </div>
        <div className="card-body p-0">
          <table className="table table-bordered mb-0 small">
            <thead className="table-secondary">
              <tr>
                <th style={{ width: '30%' }}>Raw Message</th>
                <th>AI said</th>
                <th>Your Category</th>
                <th>Your Priority</th>
                <th>Needs Human?</th>
                <th>Save</th>
              </tr>
            </thead>
            <tbody>
              {messages.map(msg => {
                const isSaved = savedIds.has(String(msg._id));
                const label = labels[msg._id] || {};
                return (
                  <tr key={msg._id} className={isSaved ? 'table-success' : ''}>
                    <td className="font-monospace" style={{ wordBreak: 'break-word' }}>
                      {msg.raw_text.slice(0, 120)}{msg.raw_text.length > 120 ? '…' : ''}
                    </td>
                    <td>
                      <div><span className="badge bg-secondary">{msg.triage?.priority}</span></div>
                      <div className="text-muted">{msg.triage?.category}</div>
                      <div className="text-muted">{Math.round((msg.triage?.confidence || 0) * 100)}% conf</div>
                    </td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={label.category || ''}
                        onChange={e => updateLabel(msg._id, 'category', e.target.value)}
                        disabled={isSaved}
                      >
                        <option value="">-- pick --</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={label.priority || ''}
                        onChange={e => updateLabel(msg._id, 'priority', e.target.value)}
                        disabled={isSaved}
                      >
                        <option value="">-- pick --</option>
                        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={label.needs_human === undefined ? '' : String(label.needs_human)}
                        onChange={e => updateLabel(msg._id, 'needs_human', e.target.value === 'true')}
                        disabled={isSaved}
                      >
                        <option value="">-- pick --</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </td>
                    <td>
                      {isSaved
                        ? <span className="badge bg-success">✓ Saved</span>
                        : (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => saveLabel(msg)}
                            disabled={loading}
                          >
                            Save
                          </button>
                        )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
