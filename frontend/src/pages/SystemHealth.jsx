import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function SystemHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHealth();
  }, []);

  async function fetchHealth() {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/health/database');
      setHealth(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to connect to backend API.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">
          <i className="bi bi-heart-pulse me-2 text-danger"></i>
          System Health
        </h4>
        <button className="btn btn-outline-secondary btn-sm" onClick={fetchHealth} disabled={loading}>
          <i className={`bi bi-arrow-clockwise me-1 ${loading ? 'spin' : ''}`}></i>
          Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Backend Error:</strong> {error}
          <p className="mb-0 mt-2 small text-muted">Ensure MongoDB is running and the backend server is started.</p>
        </div>
      )}

      {loading && !health ? (
        <div className="text-center py-5">
          <span className="spinner-border text-primary"></span>
        </div>
      ) : health ? (
        <div className="row g-4">

          {/* Database Status */}
          <div className="col-md-6">
            <div className="card h-100" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="card-header fw-semibold" style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                <i className="bi bi-database me-2 text-primary"></i>Database (MongoDB)
              </div>
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <div className={`me-3 rounded-circle d-flex align-items-center justify-content-center ${health.database.connectionState === 'connected' ? 'bg-success' : 'bg-danger'}`} style={{ width: '48px', height: '48px' }}>
                    <i className="bi bi-hdd-network text-white fs-4"></i>
                  </div>
                  <div>
                    <h5 className="mb-0 text-capitalize" style={{ color: 'var(--text-primary)' }}>{health.database.connectionState}</h5>
                    <div className="text-muted small">Name: {health.database.databaseName || '(none)'}</div>
                  </div>
                </div>

                <h6 className="fw-semibold mt-4 mb-3 border-bottom border-secondary pb-2" style={{ color: 'var(--text-secondary)' }}>Collections</h6>
                {health.database.collections && health.database.collections.length > 0 ? (
                  <table className="table table-sm table-bordered">
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                        <th>Collection Name</th>
                        <th className="text-end">Documents</th>
                      </tr>
                    </thead>
                    <tbody>
                      {health.database.collections.map(col => (
                        <tr key={col.name}>
                          <td><code>{col.name}</code></td>
                          <td className="text-end font-monospace">{col.documentCount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-muted small fst-italic">No collections found.</div>
                )}
              </div>
            </div>
          </div>

          {/* AI Provider Status */}
          <div className="col-md-6">
            <div className="card h-100" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="card-header fw-semibold" style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                <i className="bi bi-cpu me-2 text-primary"></i>AI Provider
              </div>
              <div className="card-body">
                <div className="mb-4">
                  <h6 className="text-muted small text-uppercase fw-bold">Active Model</h6>
                  <div className="fs-5">
                    <i className="bi bi-robot me-2 text-primary"></i>
                    {health.aiProvider.activeModel}
                  </div>
                </div>

                <h6 className="text-muted small text-uppercase fw-bold mb-3">API Keys Configured</h6>

                <div className="d-flex align-items-center justify-content-between p-3 border rounded mb-2">
                  <div className="fw-semibold">Google Gemini SDK</div>
                  {health.aiProvider.geminiConfigured ? (
                    <span className="badge bg-success"><i className="bi bi-check me-1"></i>Configured</span>
                  ) : (
                    <span className="badge bg-secondary">Not configured</span>
                  )}
                </div>

                <div className="d-flex align-items-center justify-content-between p-3 border rounded">
                  <div className="fw-semibold">OpenRouter (Fallback)</div>
                  {health.aiProvider.openrouterConfigured ? (
                    <span className="badge bg-success"><i className="bi bi-check me-1"></i>Configured</span>
                  ) : (
                    <span className="badge bg-secondary">Not configured</span>
                  )}
                </div>

                <div className="alert alert-info mt-4 small mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  The application prioritizes the <strong>OpenRouter API key</strong> if provided, otherwise falling back to the native <strong>Gemini SDK</strong>. Secrets are never exposed to the client.
                </div>
              </div>
            </div>
          </div>

        </div>
      ) : null}
    </>
  );
}
