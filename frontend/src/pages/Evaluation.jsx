import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EvalReport from '../components/EvalReport';

export default function Evaluation() {
  const [datasets, setDatasets] = useState([]);
  const [activeDatasetId, setActiveDatasetId] = useState('');
  const [messages, setMessages] = useState([]);
  const [labels, setLabels] = useState({});   // message_id -> {category, priority, needsHuman}
  const [savedReviews, setSavedReviews] = useState({}); // message_id -> reviewId

  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);

  const [report, setReport] = useState(null);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState(null);

  // Initial load
  useEffect(() => {
    // 1. Fetch config (categories/priorities)
    axios.get('/api/configuration').then(res => {
      setCategories(res.data.categories || []);
      setPriorities(res.data.priorities || []);
    }).catch(err => {
      setError(err.response?.data?.error || err.message || 'Failed to load system config.');
    });

    // 2. Fetch datasets and select first if available
    axios.get('/api/datasets').then(res => {
      setDatasets(res.data);
      if (res.data.length > 0) {
        setActiveDatasetId(res.data[0]._id);
      }
    }).catch(err => {
      setError(err.response?.data?.error || err.message || 'Failed to load datasets.');
    });

    // 3. Fetch all human reviews to prepopulate saved states
    axios.get('/api/reviews').then(res => {
      const reviewMap = {};
      const labelMap = {};
      res.data.forEach(r => {
        reviewMap[r.messageId] = r._id;
        labelMap[r.messageId] = {
          category: r.category,
          priority: r.priority,
          needsHuman: r.needsHuman
        };
      });
      setSavedReviews(reviewMap);
      setLabels(labelMap);
    }).catch(() => { });

    // 4. Fetch past evaluation runs
    loadRuns();
  }, []);

  // When active dataset changes, load its messages
  useEffect(() => {
    if (activeDatasetId) {
      setLoading(true);
      setError(null);
      axios.get(`/api/datasets/${activeDatasetId}/messages`)
        .then(res => setMessages(res.data))
        .catch(err => {
          setError(err.response?.data?.error || err.message || 'Failed to load dataset messages.');
          setMessages([]);
        })
        .finally(() => setLoading(false));
    } else {
      setMessages([]);
    }
  }, [activeDatasetId]);

  function loadRuns() {
    axios.get('/api/evaluation').then(res => {
      setRuns(res.data);
      if (res.data.length > 0) setReport(res.data[0]);
    }).catch(() => { });
  }

  function updateLabel(msgId, field, value) {
    setLabels(prev => ({
      ...prev,
      [msgId]: { ...prev[msgId], [field]: value }
    }));
  }

  async function saveLabel(msg) {
    const label = labels[msg._id];
    if (!label?.category || !label?.priority || label?.needsHuman === undefined) {
      setError('Please set category, priority, and needs-human before saving.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const isExisting = savedReviews[msg._id];
      if (isExisting) {
        // Update
        await axios.put(`/api/reviews/${msg._id}`, {
          category: label.category,
          priority: label.priority,
          needsHuman: label.needsHuman,
        });
      } else {
        // Create
        const res = await axios.post(`/api/reviews/${msg._id}`, {
          category: label.category,
          priority: label.priority,
          needsHuman: label.needsHuman,
        });
        setSavedReviews(prev => ({ ...prev, [msg._id]: res.data._id }));
      }
    } catch (err) {
      setError('Save failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleRunEvaluation() {
    if (!activeDatasetId) return;
    setEvaluating(true);
    setError(null);
    try {
      const res = await axios.post(`/api/evaluation/run/${activeDatasetId}`);
      if (res.data.error) {
        setError(res.data.error);
      } else {
        setReport(res.data);
        await loadRuns();
      }
    } catch (err) {
      setError('Evaluation failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setEvaluating(false);
    }
  }

  return (
    <>
      <h4 className="fw-bold mb-4">
        <i className="bi bi-clipboard-check me-2 text-success"></i>
        Evaluation & Metrics
      </h4>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2" />
          <strong>Error:</strong> {error}
          <button type="button" className="btn-close" onClick={() => setError(null)} />
        </div>
      )}

      {report ? (
        <EvalReport report={report} onSelectRun={setReport} runs={runs} />
      ) : (
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          No evaluation runs found. Label messages below and click "Run Evaluation".
        </div>
      )}

      <div className="card shadow-sm">
        <div className="card-header fw-semibold bg-white d-flex justify-content-between align-items-center">
          <div>
            <i className="bi bi-person-check me-2 text-primary"></i>
            Ground Truth Labeling
          </div>
          <div className="d-flex gap-2 align-items-center">
            <span className="small text-muted me-2">Select Dataset:</span>
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={activeDatasetId}
              onChange={e => setActiveDatasetId(e.target.value)}
            >
              <option value="">-- None --</option>
              {datasets.map(ds => (
                <option key={ds._id} value={ds._id}>{ds.name} ({ds.messageCount})</option>
              ))}
            </select>
            <button
              className="btn btn-primary btn-sm ms-3"
              onClick={handleRunEvaluation}
              disabled={evaluating || !activeDatasetId}
            >
              {evaluating ? (
                <><span className="spinner-border spinner-border-sm me-1"></span>Running...</>
              ) : (
                <><i className="bi bi-play-fill me-1"></i>Run Evaluation</>
              )}
            </button>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary"></span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-5 text-muted fst-italic">
              No messages found in this dataset.
            </div>
          ) : (
            <table className="table table-bordered table-hover mb-0 small">
              <thead className="table-secondary">
                <tr>
                  <th style={{ width: '30%' }}>Message</th>
                  <th style={{ width: '15%' }}>AI Decision</th>
                  <th style={{ width: '15%' }}>Your Category</th>
                  <th style={{ width: '15%' }}>Your Priority</th>
                  <th style={{ width: '15%' }}>Needs Human?</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {messages.map(msg => {
                  const isSaved = !!savedReviews[msg._id];
                  const label = labels[msg._id] || {};
                  const triage = msg.triage;

                  return (
                    <tr key={msg._id} className={isSaved ? 'table-success' : ''}>
                      <td className="font-monospace" style={{ wordBreak: 'break-word', color: '#555' }}>
                        {msg.rawText.slice(0, 150)}{msg.rawText.length > 150 ? '…' : ''}
                      </td>
                      <td>
                        {triage ? (
                          <>
                            <div><span className="badge bg-secondary mb-1">{triage.priority}</span></div>
                            <div className="fw-semibold text-dark">{triage.category}</div>
                            <div className="text-muted" style={{ fontSize: '0.8em' }}>{Math.round(triage.confidence * 100)}% conf</div>
                          </>
                        ) : (
                          <span className="text-muted fst-italic">Not triaged</span>
                        )}
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm border-secondary"
                          value={label.category || ''}
                          onChange={e => updateLabel(msg._id, 'category', e.target.value)}
                        >
                          <option value="">-- pick --</option>
                          {categories.map(c => <option key={c.value} value={c.value} title={c.description}>{c.label}</option>)}
                          <option value="unknown">Unknown</option>
                        </select>
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm border-secondary"
                          value={label.priority || ''}
                          onChange={e => updateLabel(msg._id, 'priority', e.target.value)}
                        >
                          <option value="">-- pick --</option>
                          {priorities.map(p => <option key={p.value} value={p.value} title={p.description}>{p.label}</option>)}
                        </select>
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm border-secondary"
                          value={label.needsHuman === undefined ? '' : String(label.needsHuman)}
                          onChange={e => updateLabel(msg._id, 'needsHuman', e.target.value === 'true')}
                        >
                          <option value="">-- pick --</option>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </td>
                      <td className="text-center align-middle">
                        <button
                          className={`btn btn-sm ${isSaved ? 'btn-success' : 'btn-outline-primary'}`}
                          onClick={() => saveLabel(msg)}
                          disabled={loading}
                          style={{ minWidth: '70px' }}
                        >
                          {isSaved ? <><i className="bi bi-check2 me-1"></i>Saved</> : 'Save'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
