import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UploadPanel from '../components/UploadPanel';
import TriageTable from '../components/TriageTable';
import StatCard from '../components/ui/StatCard';
import ProgressBar from '../components/ui/ProgressBar';
import { useToast } from '../context/ToastContext';

export default function Dashboard({ datasets = [], activeDatasetId, onSelectDataset, onRefreshDatasets }) {
  const { addToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [triaging, setTriaging] = useState(false);
  const [error, setError] = useState(null);

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  // 3-second polling for active dataset message status
  useEffect(() => {
    let interval = null;
    if (activeDatasetId) {
      loadDatasetMessages(activeDatasetId);
      interval = setInterval(() => {
        loadDatasetMessagesSilent(activeDatasetId);
      }, 3000);
    } else {
      setMessages([]);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeDatasetId]);

  async function loadDatasetMessages(datasetId) {
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
    } catch { }
  }

  async function handleTriageBatch() {
    if (!activeDatasetId) return;
    setTriaging(true);
    setError(null);

    try {
      const res = await axios.post(`/api/triage/batch/${activeDatasetId}`);
      await loadDatasetMessages(activeDatasetId);
      if (onRefreshDatasets) onRefreshDatasets();

      if (res.data) {
        const { succeeded = 0, failed = 0 } = res.data;
        addToast(`Batch complete — ${succeeded} succeeded, ${failed} failed.`, failed > 0 ? 'warning' : 'success');
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to complete batch triage.';
      setError(errMsg);
      addToast(errMsg, 'danger');
    } finally {
      setTriaging(false);
    }
  }

  async function handleResetDatabase() {
    setResetting(true);
    setError(null);
    try {
      await axios.post('/api/admin/reset-db');
      setMessages([]);
      setShowResetModal(false);
      if (onRefreshDatasets) onRefreshDatasets();
      addToast('Database reset successfully. All datasets cleared.', 'success');
    } catch (err) {
      setError(`Failed to reset database: ${err.response?.data?.error || err.message}`);
      addToast('Failed to reset database.', 'danger');
    } finally {
      setResetting(false);
    }
  }

  // Calculate Metrics
  const totalCount = messages.length;
  const completedCount = messages.filter(m => m.status === 'completed' && !m.triage?.isApiFailure).length;
  const pendingCount = messages.filter(m => m.status === 'pending').length;
  const failedCount = messages.filter(m => m.status === 'failed' || m.triage?.isApiFailure).length;

  const triagedWithConf = messages.filter(m => m.triage && m.triage.confidence !== undefined);
  const avgConf = triagedWithConf.length > 0
    ? Math.round((triagedWithConf.reduce((acc, curr) => acc + (curr.triage.confidence || 0), 0) / triagedWithConf.length) * 100)
    : 0;

  return (
    <>
      {/* Action Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ fontSize: '20px', letterSpacing: '-0.02em' }}>
            Control Room & Triage
          </h4>
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Real-time monitoring and AI message classification panel
          </span>
        </div>
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
        <div className="alert alert-danger alert-dismissible fade show mb-4 py-2" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2" />
          <strong>System Alert:</strong> {error}
          <button type="button" className="btn-close" onClick={() => setError(null)} />
        </div>
      )}

      {/* Top Row — 4 Stat Cards Grid */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <StatCard title="Total Messages" value={totalCount} subtext="in active dataset" accentColor="var(--accent)" />
        </div>
        <div className="col-md-3">
          <StatCard title="Completed" value={completedCount} subtext="successfully triaged" accentColor="var(--success)" />
        </div>
        <div className="col-md-3">
          <StatCard title="Pending / Failed" value={`${pendingCount} / ${failedCount}`} subtext="requires triage action" accentColor="var(--warning)" />
        </div>
        <div className="col-md-3">
          <StatCard title="Avg Confidence" value={`${avgConf}%`} subtext="model certainty" accentColor="var(--purple)" />
        </div>
      </div>

      {/* Middle Section — Batch Control Panel */}
      {activeDatasetId && (
        <div className="card mb-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '20px' }}>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-cpu-fill text-primary" style={{ fontSize: '18px' }} />
              <span className="fw-semibold" style={{ fontSize: '15px' }}>Batch Triage Control</span>
            </div>

            <div className="d-flex align-items-center gap-2">
              {failedCount > 0 && (
                <button
                  className="btn btn-sm"
                  style={{
                    backgroundColor: 'transparent',
                    borderColor: 'var(--danger)',
                    color: 'var(--danger)',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                  onClick={handleTriageBatch}
                  disabled={triaging}
                >
                  <i className="bi bi-arrow-clockwise me-1" />
                  Retry Failed ({failedCount})
                </button>
              )}

              <button
                className="btn btn-sm text-white fw-bold"
                style={{
                  backgroundColor: 'var(--accent)',
                  border: 'none',
                  padding: '8px 20px',
                  fontSize: '13px',
                }}
                onClick={handleTriageBatch}
                disabled={triaging || (pendingCount === 0 && failedCount === 0)}
              >
                {triaging ? (
                  <><span className="spinner-border spinner-border-sm me-2" />Triaging Batch...</>
                ) : (
                  <><i className="bi bi-play-fill me-1" style={{ fontSize: '16px' }} />Triage All Pending ({pendingCount})</>
                )}
              </button>
            </div>
          </div>

          <ProgressBar
            completed={completedCount}
            pending={pendingCount}
            failed={failedCount}
            total={totalCount}
            isProcessing={triaging}
          />
        </div>
      )}

      {/* Main Content Area: Table / Upload Panel */}
      <div className="row g-4">
        <div className="col-12">
          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" />
              <p className="text-muted mt-2 small">Loading dataset operations...</p>
            </div>
          ) : activeDatasetId && messages.length > 0 ? (
            <TriageTable messages={messages} />
          ) : (
            <div className="text-center py-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px border-dashed var(--border)', borderRadius: '8px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-3">
                <path d="M4 4H20V16H14L12 19L10 16H4V4Z" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h5 className="fw-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No messages found</h5>
              <p className="small mb-3" style={{ color: 'var(--text-secondary)' }}>Upload or paste raw customer messages to start batch triaging.</p>
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
              <div className="modal-content" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="modal-header border-bottom border-secondary text-white">
                  <h5 className="modal-title fw-bold text-danger">
                    <i className="bi bi-exclamation-triangle-fill me-2" />
                    Reset All Database Data?
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowResetModal(false)} />
                </div>
                <div className="modal-body py-4">
                  <p className="mb-2" style={{ color: 'var(--text-primary)' }}>
                    Are you sure you want to <strong>permanently delete all datasets, messages, triage results, human reviews, and evaluation runs</strong>?
                  </p>
                  <p className="small mb-0" style={{ color: 'var(--text-muted)' }}>
                    This action cannot be undone. This clears past data for a clean test run.
                  </p>
                </div>
                <div className="modal-footer border-top border-secondary">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowResetModal(false)} disabled={resetting}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-danger btn-sm fw-bold" onClick={handleResetDatabase} disabled={resetting}>
                    {resetting ? 'Wiping Data...' : 'Yes, Wipe All Data'}
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
