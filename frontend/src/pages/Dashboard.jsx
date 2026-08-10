import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UploadPanel from '../components/UploadPanel';
import TriageTable from '../components/TriageTable';
import StatsBar from '../components/StatsBar';

export default function Dashboard() {
  const [datasets, setDatasets] = useState([]);
  const [activeDatasetId, setActiveDatasetId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [triaging, setTriaging] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Load datasets on mount
  useEffect(() => {
    loadDatasets();
  }, []);

  // 3-second polling for active dataset message status
  useEffect(() => {
    let interval = null;
    if (activeDatasetId) {
      interval = setInterval(() => {
        loadDatasetMessagesSilent(activeDatasetId);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeDatasetId]);

  async function loadDatasets() {
    try {
      setError(null);
      const res = await axios.get('/api/datasets');
      setDatasets(res.data);
      if (res.data.length > 0 && !activeDatasetId) {
        loadDatasetMessages(res.data[0]._id);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load datasets.');
    }
  }

  async function loadDatasetMessages(datasetId) {
    setActiveDatasetId(datasetId);
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/datasets/${datasetId}/messages`);
      setMessages(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load dataset messages.');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadDatasetMessagesSilent(datasetId) {
    try {
      const res = await axios.get(`/api/datasets/${datasetId}/messages`);
      setMessages(res.data);
    } catch {}
  }

  async function handleUploadComplete(dataset) {
    await loadDatasets();
    loadDatasetMessages(dataset._id);
  }

  async function handleTriageBatch() {
    if (!activeDatasetId) return;
    setTriaging(true);
    setError(null);
    setProgress({ text: 'Triaging messages sequentially...', percent: 0 });

    try {
      const res = await axios.post(`/api/triage/batch/${activeDatasetId}`);
      await loadDatasetMessages(activeDatasetId);
      await loadDatasets();
      if (res.data && res.data.failed > 0) {
        setError(`Batch triage completed with ${res.data.failed} failed items. Click "Retry Failed" to retry.`);
      } else {
        setProgress(null);
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to complete batch triage.';
      setError(errMsg);
      setProgress({ text: `Error: ${errMsg}`, percent: 0, error: true });
    } finally {
      setTriaging(false);
    }
  }

  async function handleResetDatabase() {
    setResetting(true);
    setError(null);
    try {
      await axios.post('/api/admin/reset-db');
      setDatasets([]);
      setActiveDatasetId(null);
      setMessages([]);
      setShowResetModal(false);
    } catch (err) {
      setError(`Failed to reset database: ${err.response?.data?.error || err.message}`);
    } finally {
      setResetting(false);
    }
  }

  const pendingCount = messages.filter(m => m.status === 'pending' || m.status === 'failed').length;
  const completedCount = messages.filter(m => m.status === 'completed').length;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">
          <i className="bi bi-speedometer2 me-2 text-primary"></i>
          Customer Message Triage Dashboard
        </h4>
        <button
          className="btn btn-outline-danger btn-sm"
          onClick={() => setShowResetModal(true)}
          title="Clear all datasets and past triage data"
        >
          <i className="bi bi-trash3 me-1" />
          Clear All Data
        </button>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2" />
          <strong>Error:</strong> {error}
          <button type="button" className="btn-close" onClick={() => setError(null)} />
        </div>
      )}

      <div className="row">
        {/* Left column: Upload + Dataset List */}
        <div className="col-lg-4 mb-4">
          <UploadPanel onUploadComplete={handleUploadComplete} />

          {/* Dataset List */}
          <div className="card">
            <div className="card-header fw-semibold">
              <i className="bi bi-collection me-2"></i>
              Datasets ({datasets.length})
            </div>
            <div className="list-group list-group-flush" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {datasets.length === 0 && (
                <div className="list-group-item text-muted small">No datasets yet. Upload or paste messages above.</div>
              )}
              {datasets.map(ds => (
                <button
                  key={ds._id}
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${activeDatasetId === ds._id ? 'active' : ''}`}
                  onClick={() => loadDatasetMessages(ds._id)}
                >
                  <div>
                    <div className="fw-semibold small">{ds.name}</div>
                    <div className="text-muted" style={{ fontSize: '0.7em' }}>
                      {ds.source} · {ds.messageCount} msgs · {ds.status}
                    </div>
                  </div>
                  <span className={`badge ${ds.status === 'completed' ? 'bg-success' : ds.status === 'processing' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                    {ds.status}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Results */}
        <div className="col-lg-8">
          {activeDatasetId && (
            <>
              {/* Triage Action Bar */}
              {pendingCount > 0 && (
                <div className="alert alert-warning d-flex justify-content-between align-items-center mb-3">
                  <span>
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    <strong>{pendingCount}</strong> messages pending/failed triage
                  </span>
                  <div>
                    {messages.filter(m => m.status === 'failed').length > 0 && (
                      <button
                        className="btn btn-outline-danger btn-sm me-2"
                        onClick={handleTriageBatch}
                        disabled={triaging}
                      >
                        <i className="bi bi-arrow-clockwise me-1" />Retry Failed
                      </button>
                    )}
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleTriageBatch}
                      disabled={triaging}
                    >
                      {triaging ? (
                        <><span className="spinner-border spinner-border-sm me-2" />Triaging...</>
                      ) : (
                        <><i className="bi bi-cpu me-2" />Triage Batch</>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {progress && (
                <div className={`alert ${progress.error ? 'alert-danger' : 'alert-info'} mb-3`}>
                  {!progress.error && <span className="spinner-border spinner-border-sm me-2" />}
                  {progress.text}
                </div>
              )}

              {loading ? (
                <div className="text-center py-5">
                  <span className="spinner-border text-primary" />
                  <p className="text-muted mt-2">Loading messages...</p>
                </div>
              ) : (
                <>
                  {completedCount > 0 && <StatsBar messages={messages} />}
                  <TriageTable messages={messages} />
                </>
              )}
            </>
          )}

          {!activeDatasetId && datasets.length === 0 && (
            <div className="text-center text-muted py-5">
              <i className="bi bi-inbox fs-1 d-block mb-2"></i>
              <p>Upload or paste customer messages to start triaging.</p>
              <p className="small">Use the panel on the left to upload a JSON file or paste messages directly.</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Reset DB */}
      {showResetModal && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1050 }} />
          <div className="modal d-block" style={{ zIndex: 1055 }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title fw-bold">
                    <i className="bi bi-exclamation-triangle-fill me-2" />
                    Reset All Database Data?
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowResetModal(false)} />
                </div>
                <div className="modal-body py-4">
                  <p className="mb-2">
                    Are you sure you want to <strong>permanently delete all datasets, messages, triage results, human reviews, and evaluation runs</strong>?
                  </p>
                  <p className="text-muted small mb-0">
                    This action cannot be undone. This is useful for clearing past test runs before uploading the official evaluation dataset.
                  </p>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowResetModal(false)} disabled={resetting}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-danger fw-bold" onClick={handleResetDatabase} disabled={resetting}>
                    {resetting ? (
                      <><span className="spinner-border spinner-border-sm me-2" />Wiping Data...</>
                    ) : (
                      <><i className="bi bi-trash3 me-1" />Yes, Wipe All Data</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
