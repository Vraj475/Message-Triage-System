import React, { useState } from 'react';
import { CategoryBadge, PriorityBadge } from './ui/Badge';

export default function TriageTable({ messages = [] }) {
  const [expandedId, setExpandedId] = useState(null);
  const [showRawMap, setShowRawMap] = useState({});
  const [filterHuman, setFilterHuman] = useState(false);
  const [filterPriority, setFilterPriority] = useState('');
  const [filterText, setFilterText] = useState('');

  const filteredMessages = messages.filter(m => {
    if (filterHuman && !m.triage?.needsHuman) return false;
    if (filterPriority && m.triage?.priority !== filterPriority) return false;
    if (filterText) {
      const q = filterText.toLowerCase();
      const rawMatch = m.rawText?.toLowerCase().includes(q);
      const sumMatch = m.triage?.summary?.toLowerCase().includes(q);
      const catMatch = m.triage?.category?.toLowerCase().includes(q);
      if (!rawMatch && !sumMatch && !catMatch) return false;
    }
    return true;
  });

  function toggleExpand(id) {
    setExpandedId(prev => prev === id ? null : id);
  }

  function toggleRaw(id, e) {
    e.stopPropagation();
    setShowRawMap(prev => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="card shadow-sm">
      {/* Table Header Controls */}
      <div className="card-header bg-white d-flex flex-wrap justify-content-between align-items-center gap-2 py-3">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-table text-primary"></i>
          <span className="fw-semibold text-primary">Triage Results</span>
          <span className="badge bg-secondary ms-1">{filteredMessages.length} items</span>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          <input
            type="text"
            className="form-control form-control-sm"
            style={{ width: '180px' }}
            placeholder="Search text or category..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
          />

          <select
            className="form-select form-select-sm"
            style={{ width: '110px' }}
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="P0">P0 - Critical</option>
            <option value="P1">P1 - High</option>
            <option value="P2">P2 - Medium</option>
            <option value="P3">P3 - Low</option>
          </select>

          <div className="form-check form-switch mb-0 ms-2">
            <input
              className="form-check-input"
              type="checkbox"
              id="filterHuman"
              checked={filterHuman}
              onChange={e => setFilterHuman(e.target.checked)}
            />
            <label className="form-check-label small fw-semibold text-warning" htmlFor="filterHuman">
              Escalated Only
            </label>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0 small" style={{ borderTop: '1px solid var(--border)' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ width: '40px', textAlign: 'center' }}>#</th>
              <th style={{ width: '30%' }}>Message Preview</th>
              <th style={{ width: '12%' }}>Category</th>
              <th style={{ width: '10%' }}>Priority</th>
              <th style={{ width: '12%' }}>Confidence</th>
              <th style={{ width: '14%' }}>Status</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMessages.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center text-muted py-4">
                  No triage messages found matching current filters.
                </td>
              </tr>
            ) : (
              filteredMessages.map((msg, idx) => {
                const isExpanded = expandedId === msg._id;
                const confPct = Math.round((msg.triage?.confidence || 0) * 100);
                const confColor = msg.triage?.confidence >= 0.7 ? 'var(--success)' : msg.triage?.confidence >= 0.4 ? 'var(--warning)' : 'var(--danger)';

                return (
                  <React.Fragment key={msg._id}>
                    <tr
                      style={{
                        backgroundColor: isExpanded ? 'var(--bg-elevated)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 100ms ease',
                      }}
                      onClick={() => toggleExpand(msg._id)}
                    >
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td className="font-mono" style={{ color: 'var(--text-secondary)', wordBreak: 'break-word' }}>
                        {msg.rawText.slice(0, 75)}{msg.rawText.length > 75 ? '…' : ''}
                      </td>
                      <td>
                        <CategoryBadge category={msg.triage?.category} isApiFailure={msg.triage?.isApiFailure} />
                      </td>
                      <td>
                        <PriorityBadge priority={msg.triage?.priority} />
                      </td>
                      <td>
                        {msg.triage ? (
                          <div className="d-flex align-items-center gap-2">
                            <div
                              style={{
                                width: '40px',
                                height: '4px',
                                backgroundColor: 'var(--bg-elevated)',
                                borderRadius: '2px',
                                overflow: 'hidden',
                                border: '1px solid var(--border)',
                              }}
                            >
                              <div style={{ width: `${confPct}%`, height: '100%', backgroundColor: confColor }} />
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>{confPct}%</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        {msg.status === 'completed' && !msg.triage?.isApiFailure ? (
                          <div className="d-flex align-items-center gap-1" style={{ color: 'var(--success)', fontWeight: 600, fontSize: '11px' }}>
                            <span className="dot-healthy" /> Done
                          </div>
                        ) : msg.status === 'processing' ? (
                          <div className="d-flex align-items-center gap-1" style={{ color: 'var(--warning)', fontWeight: 600, fontSize: '11px' }}>
                            <span className="dot-processing" /> Processing
                          </div>
                        ) : msg.triage?.isApiFailure || msg.status === 'failed' ? (
                          <div className="d-flex align-items-center gap-1" style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '11px' }}>
                            <span className="dot-down" /> API Failed
                          </div>
                        ) : (
                          <div className="d-flex align-items-center gap-1" style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '11px' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--text-muted)' }} /> Pending
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-sm p-1"
                          style={{ color: isExpanded ? 'var(--accent)' : 'var(--text-secondary)', background: 'none', border: 'none' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(msg._id);
                          }}
                          title="Toggle Details"
                        >
                          <i className={`bi ${isExpanded ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`} style={{ fontSize: '15px' }} />
                        </button>
                      </td>
                    </tr>

                    {/* Inline Expandable Row Detail Drawer */}
                    {isExpanded && (
                      <tr style={{ backgroundColor: 'var(--bg-surface)' }}>
                        <td colSpan="7" className="p-0">
                          <div
                            style={{
                              padding: '16px 24px',
                              borderBottom: '1px solid var(--border)',
                              borderTop: '1px solid var(--border)',
                              backgroundColor: 'var(--bg-primary)',
                            }}
                          >
                            <div className="row g-3">
                              {/* Full Raw Message */}
                              <div className="col-12">
                                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                  Full Customer Message
                                </div>
                                <div
                                  className="font-mono p-2 rounded"
                                  style={{
                                    backgroundColor: 'var(--bg-elevated)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border)',
                                    fontSize: '12px',
                                    whiteSpace: 'pre-wrap',
                                  }}
                                >
                                  {msg.rawText}
                                </div>
                              </div>

                              {/* Summary & Action */}
                              {msg.triage && (
                                <>
                                  <div className="col-md-6">
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                      AI Summary
                                    </div>
                                    <div style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
                                      {msg.triage.summary || 'N/A'}
                                    </div>
                                  </div>
                                  <div className="col-md-6">
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                      Suggested Action
                                    </div>
                                    <div style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '13px' }}>
                                      {msg.triage.suggestedAction || 'N/A'}
                                    </div>
                                  </div>

                                  {/* Metadata Badges & Performance */}
                                  <div className="col-12 d-flex flex-wrap align-items-center justify-content-between pt-2 border-top border-secondary">
                                    <div className="d-flex align-items-center gap-2">
                                      <span className="badge" style={{ backgroundColor: msg.triage.needsHuman ? 'rgba(240, 164, 41, 0.2)' : 'rgba(62, 207, 142, 0.2)', color: msg.triage.needsHuman ? 'var(--warning)' : 'var(--success)', border: '1px solid currentColor' }}>
                                        {msg.triage.needsHuman ? 'Escalated to Human' : 'Auto-Accepted'}
                                      </span>
                                      <span className="badge" style={{ backgroundColor: msg.triage.validationStatus === 'valid' ? 'rgba(62, 207, 142, 0.2)' : 'rgba(242, 95, 92, 0.2)', color: msg.triage.validationStatus === 'valid' ? 'var(--success)' : 'var(--danger)', border: '1px solid currentColor' }}>
                                        JSON {msg.triage.validationStatus || 'valid'}
                                      </span>
                                    </div>
                                    <div className="font-mono text-muted" style={{ fontSize: '11px' }}>
                                      Latency: <strong>{msg.triage.latencyMs || 0}ms</strong> | Tokens: In {msg.triage.inputTokens || 0} / Out {msg.triage.outputTokens || 0}
                                      {msg.triage.rawModelOutput && (
                                        <button
                                          className="btn btn-link btn-sm text-decoration-none p-0 ms-3"
                                          style={{ color: 'var(--accent)', fontSize: '11px' }}
                                          onClick={(e) => toggleRaw(msg._id, e)}
                                        >
                                          {showRawMap[msg._id] ? 'Hide raw output' : 'Show raw output'}
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Raw LLM Model Output Toggle Block */}
                                  {showRawMap[msg._id] && msg.triage.rawModelOutput && (
                                    <div className="col-12 mt-2">
                                      <pre
                                        className="font-mono p-2 rounded"
                                        style={{
                                          backgroundColor: '#000',
                                          color: 'var(--success)',
                                          fontSize: '11px',
                                          maxHeight: '120px',
                                          overflowY: 'auto',
                                          border: '1px solid var(--border)',
                                        }}
                                      >
                                        {msg.triage.rawModelOutput}
                                      </pre>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
