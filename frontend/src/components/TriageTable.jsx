import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Fallback values if config endpoint fails
let CATEGORY_BADGE = {
  billing: 'badge bg-primary',
  refund: 'badge bg-primary',
  technical: 'badge bg-info text-dark',
  complaint: 'badge bg-warning text-dark',
  account: 'badge bg-secondary',
  inquiry: 'badge bg-light text-dark border',
  spam: 'badge bg-dark',
  unclear: 'badge bg-dark',
  unknown: 'badge bg-danger',
};

const PRIORITY_ROW = { P0: 'table-danger', P1: 'table-warning', P2: 'table-info', P3: '' };
const PRIORITY_BADGE = { P0: 'badge bg-danger', P1: 'badge bg-warning text-dark', P2: 'badge bg-info text-dark', P3: 'badge bg-secondary' };

function ConfidenceBadge({ value, isApiFailure }) {
  if (isApiFailure) {
    return <span className="badge bg-dark">N/A</span>;
  }
  const pct = Math.round((value || 0) * 100);
  let cls = 'badge ';
  if (value >= 0.85) cls += 'bg-success';
  else if (value >= 0.70) cls += 'bg-warning text-dark';
  else cls += 'bg-danger';
  return <span className={cls}>{pct}%</span>;
}

export default function TriageTable({ messages }) {
  const [sortField, setSortField] = useState('triage.priority');
  const [sortDir, setSortDir] = useState('asc');
  const [filterHuman, setFilterHuman] = useState(false);
  const [filterPriority, setFilterPriority] = useState('');
  const [filterText, setFilterText] = useState('');
  const [selectedMsg, setSelectedMsg] = useState(null);

  // Fetch dynamic categories to update badge map
  useEffect(() => {
    axios.get('/api/configuration').then(res => {
      if (res.data.categories) {
        const newBadgeMap = { ...CATEGORY_BADGE };
        res.data.categories.forEach((c, idx) => {
          if (!newBadgeMap[c.value]) {
            // Assign a color based on index for unknown new categories
            const colors = ['bg-primary', 'bg-success', 'bg-info', 'bg-warning', 'bg-secondary'];
            newBadgeMap[c.value] = `badge ${colors[idx % colors.length]}`;
          }
        });
        CATEGORY_BADGE = newBadgeMap;
      }
    }).catch(() => {});
  }, []);

  function toggleSort(field) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }

  const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };

  // Apply filters
  let displayed = messages;
  if (filterHuman) displayed = displayed.filter(m => m.triage?.needsHuman);
  if (filterPriority) displayed = displayed.filter(m => m.triage?.priority === filterPriority);
  if (filterText) {
    const term = filterText.toLowerCase();
    displayed = displayed.filter(m => 
      m.rawText.toLowerCase().includes(term) || 
      (m.triage?.summary || '').toLowerCase().includes(term)
    );
  }

  // Apply sort
  displayed = [...displayed].sort((a, b) => {
    let aVal, bVal;
    if (sortField === 'triage.priority') {
      aVal = priorityOrder[a.triage?.priority] ?? 99;
      bVal = priorityOrder[b.triage?.priority] ?? 99;
    } else if (sortField === 'triage.confidence') {
      aVal = a.triage?.confidence ?? 0;
      bVal = b.triage?.confidence ?? 0;
    } else if (sortField === 'status') {
      aVal = a.status || '';
      bVal = b.status || '';
    } else {
      aVal = a.triage?.category || '';
      bVal = b.triage?.category || '';
    }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  if (messages.length === 0) return null;

  return (
    <>
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white border-bottom-0 pt-3 pb-0">
          <div className="row align-items-center mb-2">
            <div className="col-md-4">
              <span className="fw-bold fs-5">
                <i className="bi bi-table me-2 text-primary"></i>
                Results ({displayed.length})
              </span>
            </div>
            <div className="col-md-8">
              <div className="d-flex gap-2 justify-content-md-end">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  style={{ width: '200px' }}
                  placeholder="Search text or summary..."
                  value={filterText}
                  onChange={e => setFilterText(e.target.value)}
                />
                <select 
                  className="form-select form-select-sm" 
                  style={{ width: '120px' }}
                  value={filterPriority}
                  onChange={e => setFilterPriority(e.target.value)}
                >
                  <option value="">All Priorities</option>
                  <option value="P0">P0 Only</option>
                  <option value="P1">P1 Only</option>
                  <option value="P2">P2 Only</option>
                  <option value="P3">P3 Only</option>
                </select>
                <div className="form-check d-flex align-items-center ms-2 mb-0">
                  <input
                    className="form-check-input me-2 mt-0"
                    type="checkbox"
                    id="filterHuman"
                    checked={filterHuman}
                    onChange={e => setFilterHuman(e.target.checked)}
                  />
                  <label className="form-check-label small fw-semibold text-danger" htmlFor="filterHuman">
                    Human Review Only
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 small" style={{ borderTop: '1px solid #dee2e6' }}>
            <thead className="table-light">
              <tr>
                <th style={{ width: '25%' }}>Message</th>
                <th style={{ cursor: 'pointer', width: '10%' }} onClick={() => toggleSort('triage.category')}>
                  Category {sortField === 'triage.category' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th style={{ cursor: 'pointer', width: '10%' }} onClick={() => toggleSort('triage.priority')}>
                  Priority {sortField === 'triage.priority' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th style={{ width: '30%' }}>Summary & Action</th>
                <th style={{ width: '10%', textAlign: 'center' }}>Needs Human</th>
                <th style={{ cursor: 'pointer', width: '10%' }} onClick={() => toggleSort('triage.confidence')}>
                  Conf {sortField === 'triage.confidence' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th style={{ cursor: 'pointer', width: '5%' }} onClick={() => toggleSort('status')}>
                  Status {sortField === 'status' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((msg) => (
                <tr 
                  key={msg._id} 
                  className={`${PRIORITY_ROW[msg.triage?.priority] || ''} position-relative`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedMsg(msg)}
                  title="Click to view details"
                >
                  <td className="font-monospace" style={{ wordBreak: 'break-word', color: '#555' }}>
                    {msg.rawText.slice(0, 80)}{msg.rawText.length > 80 ? '…' : ''}
                    {msg.inputWarnings?.length > 0 && (
                      <i className="bi bi-exclamation-triangle-fill text-warning ms-1" title={msg.inputWarnings.join(', ')}></i>
                    )}
                  </td>
                  <td>
                    {msg.triage ? (
                      msg.triage.isApiFailure ? (
                        <span className="badge bg-danger"><i className="bi bi-exclamation-triangle me-1"></i>API Failed – Retry</span>
                      ) : (
                        <span className={CATEGORY_BADGE[msg.triage.category] || 'badge bg-secondary'}>
                          {msg.triage.category}
                        </span>
                      )
                    ) : '-'}
                  </td>
                  <td>
                    {msg.triage ? (
                      msg.triage.isApiFailure ? (
                        <span className="text-muted">-</span>
                      ) : (
                        <span className={PRIORITY_BADGE[msg.triage.priority] || 'badge bg-secondary'}>
                          {msg.triage.priority}
                        </span>
                      )
                    ) : '-'}
                  </td>
                  <td>
                    {msg.triage ? (
                      <div>
                        {msg.triage.isApiFailure ? (
                          <strong className="text-danger"><i className="bi bi-x-circle me-1"></i>Processing Failed</strong>
                        ) : (
                          <strong>{msg.triage.summary}</strong>
                        )}
                        <div className="text-muted mt-1" style={{ fontSize: '0.9em' }}>
                          <i className="bi bi-arrow-return-right me-1"></i>
                          {msg.triage.isApiFailure ? 'Check system health and retry.' : msg.triage.suggestedAction}
                        </div>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="text-center">
                    {msg.triage ? (
                      msg.triage.needsHuman
                        ? <span className="badge bg-danger rounded-pill"><i className="bi bi-person-fill"></i> Yes</span>
                        : <span className="text-success"><i className="bi bi-check2"></i> No</span>
                    ) : '-'}
                  </td>
                  <td>
                    {msg.triage ? <ConfidenceBadge value={msg.triage.confidence} isApiFailure={msg.triage.isApiFailure} /> : '-'}
                  </td>
                  <td>
                    {msg.status === 'completed' && <i className="bi bi-check-circle-fill text-success" title="Completed"></i>}
                    {msg.status === 'pending' && <i className="bi bi-hourglass-split text-secondary" title="Pending"></i>}
                    {msg.status === 'processing' && <span className="spinner-border spinner-border-sm text-primary" title="Processing"></span>}
                    {msg.status === 'failed' && <i className="bi bi-x-circle-fill text-danger" title="Failed"></i>}
                  </td>
                </tr>
              ))}
              {displayed.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted fst-italic">
                    No messages match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Details Modal */}
      {selectedMsg && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1" onClick={() => setSelectedMsg(null)}>
            <div className="modal-dialog modal-lg modal-dialog-centered" onClick={e => e.stopPropagation()}>
              <div className="modal-content border-0 shadow-lg">
                <div className="modal-header bg-dark text-white border-bottom-0">
                  <h5 className="modal-title">
                    <i className="bi bi-envelope-open me-2"></i>
                    Message Details
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedMsg(null)}></button>
                </div>
                <div className="modal-body p-0">
                  <div className="p-4 bg-light">
                    <h6 className="fw-bold text-uppercase text-muted small mb-2">Customer Message</h6>
                    <div className="p-3 bg-white border rounded font-monospace" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {selectedMsg.rawText}
                    </div>
                    {selectedMsg.inputWarnings?.length > 0 && (
                      <div className="mt-2 small text-warning fw-semibold">
                        <i className="bi bi-exclamation-triangle-fill me-1"></i>
                        Warnings: {selectedMsg.inputWarnings.join(', ')}
                      </div>
                    )}
                  </div>
                  
                  {selectedMsg.triage ? (
                    <div className="p-4">
                      <div className="row g-4">
                        <div className="col-md-6">
                          <h6 className="fw-bold text-uppercase text-muted small mb-3">Triage Decision</h6>
                          <table className="table table-sm table-borderless">
                            <tbody>
                              <tr>
                                <th style={{ width: '40%' }}>Category</th>
                                <td><span className={CATEGORY_BADGE[selectedMsg.triage.category] || 'badge bg-secondary'}>{selectedMsg.triage.category}</span></td>
                              </tr>
                              <tr>
                                <th>Priority</th>
                                <td><span className={PRIORITY_BADGE[selectedMsg.triage.priority] || 'badge bg-secondary'}>{selectedMsg.triage.priority}</span></td>
                              </tr>
                              <tr>
                                <th>Needs Human</th>
                                <td>
                                  {selectedMsg.triage.needsHuman 
                                    ? <span className="text-danger fw-bold"><i className="bi bi-exclamation-circle me-1"></i>Yes</span> 
                                    : <span className="text-success fw-bold"><i className="bi bi-check-circle me-1"></i>No</span>}
                                </td>
                              </tr>
                              <tr>
                                <th>Confidence</th>
                                <td><ConfidenceBadge value={selectedMsg.triage.confidence} isApiFailure={selectedMsg.triage.isApiFailure} /></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div className="col-md-6">
                          <h6 className="fw-bold text-uppercase text-muted small mb-3">Review & Validation</h6>
                          <table className="table table-sm table-borderless">
                            <tbody>
                              <tr>
                                <th style={{ width: '40%' }}>Review Status</th>
                                <td>
                                  <span className={`badge ${selectedMsg.triage.reviewStatus === 'auto_accepted' ? 'bg-success' : selectedMsg.triage.reviewStatus === 'failed' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                                    {selectedMsg.triage.reviewStatus}
                                  </span>
                                </td>
                              </tr>
                              {selectedMsg.triage.reviewReason && (
                                <tr>
                                  <th>Reason</th>
                                  <td className="small text-muted">{selectedMsg.triage.reviewReason}</td>
                                </tr>
                              )}
                              <tr>
                                <th>JSON Valid</th>
                                <td>
                                  {selectedMsg.triage.validationStatus === 'valid' 
                                    ? <span className="text-success"><i className="bi bi-check"></i> Valid</span>
                                    : <span className="text-danger"><i className="bi bi-tools"></i> Repaired / Invalid</span>}
                                </td>
                              </tr>
                              <tr>
                                <th>Latency</th>
                                <td>{selectedMsg.triage.latencyMs} ms</td>
                              </tr>
                              <tr>
                                <th>Tokens</th>
                                <td>
                                  <span className="small text-muted">
                                    In: {selectedMsg.triage.inputTokens || 0} | Out: {selectedMsg.triage.outputTokens || 0}
                                  </span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      {selectedMsg.triage.rawModelOutput && (
                        <div className="mt-3 pt-2 border-top">
                          <h6 className="fw-bold text-uppercase text-muted small mb-2">Raw LLM Output</h6>
                          <pre className="bg-dark text-light p-2 rounded small mb-0" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                            {selectedMsg.triage.rawModelOutput}
                          </pre>
                        </div>
                      )}
                      
                      <div className="mt-4 pt-3 border-top">
                        <h6 className="fw-bold text-uppercase text-muted small mb-2">Summary</h6>
                        <p className="mb-3">{selectedMsg.triage.summary}</p>
                        
                        <h6 className="fw-bold text-uppercase text-muted small mb-2">Suggested Action</h6>
                        <p className="mb-0 text-primary fw-semibold">{selectedMsg.triage.suggestedAction}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted">
                      <p className="mb-0 fst-italic">This message has not been successfully triaged yet.</p>
                      <p className="small">Status: {selectedMsg.status}</p>
                    </div>
                  )}
                </div>
                <div className="modal-footer bg-light border-top-0">
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedMsg(null)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
