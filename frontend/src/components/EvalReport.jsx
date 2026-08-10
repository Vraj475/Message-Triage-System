import React from 'react';

export default function EvalReport({ report, onSelectRun, runs }) {
  if (!report || report.message) {
    return (
      <div className="alert alert-info">
        <i className="bi bi-info-circle me-2"></i>
        {report?.message || 'No evaluation data yet. Label at least 10 messages below.'}
      </div>
    );
  }

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header fw-semibold bg-dark text-white d-flex justify-content-between align-items-center">
        <div>
          <i className="bi bi-clipboard-data me-2"></i>
          Evaluation Report
        </div>
        {runs && runs.length > 0 && (
          <div className="d-flex align-items-center">
            <span className="small text-muted me-2">Past Runs:</span>
            <select 
              className="form-select form-select-sm bg-dark text-white border-secondary" 
              style={{ width: 'auto', outline: 'none', boxShadow: 'none' }}
              value={report._id || ''}
              onChange={e => {
                const selected = runs.find(r => r._id === e.target.value);
                if (selected && onSelectRun) onSelectRun(selected);
              }}
            >
              {runs.map(r => (
                <option key={r._id} value={r._id}>
                  {new Date(r.createdAt).toLocaleString()} — {r.name} ({r.datasetSize} msgs)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="card-body bg-light">
        
        {/* Agreement Rates */}
        <h6 className="fw-bold text-muted text-uppercase small mb-3">Agreement Rates vs Ground Truth</h6>
        <div className="row g-3 mb-4">
          {[
            { label: 'Exact Match', value: report.exactDecisionMatchRate, variant: 'success' },
            { label: 'Category', value: report.categoryAccuracy, variant: 'primary' },
            { label: 'Priority', value: report.priorityAccuracy, variant: 'warning' },
            { label: 'Human Flag', value: report.humanEscalationAccuracy, variant: 'info' },
          ].map(stat => (
            <div key={stat.label} className="col-md-3 col-6">
              <div className={`card text-center border-${stat.variant} h-100 shadow-sm`}>
                <div className="card-body py-3">
                  <div className={`fs-2 fw-bold text-${stat.variant}`}>{stat.value !== null ? `${stat.value}%` : 'N/A'}</div>
                  <div className="small text-muted fw-semibold">{stat.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* System Stats */}
        <h6 className="fw-bold text-muted text-uppercase small mb-3">System Performance (Avg per message)</h6>
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body py-3">
                <div className="fw-semibold small text-muted">Latency</div>
                <div className="fs-4">{report.averageLatencyMs} <span className="fs-6 text-muted">ms</span></div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body py-3">
                <div className="fw-semibold small text-muted">Tokens (In / Out)</div>
                <div className="fs-4">{report.averageInputTokens} / {report.averageOutputTokens}</div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 bg-success bg-opacity-10 shadow-sm h-100">
              <div className="card-body py-3">
                <div className="fw-semibold small text-muted">API Cost</div>
                <div className="fs-5 text-success">{report.estimatedCost === 0 ? '$0.00 (Free tier)' : `$${report.estimatedCost}`}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Optimization Note */}
        {report.optimizationIdea && (
          <div className="alert alert-secondary border-secondary mb-4 small shadow-sm">
            <i className="bi bi-lightbulb-fill text-warning me-2 fs-5" style={{verticalAlign: 'middle'}}></i>
            <strong>Optimization idea:</strong> {report.optimizationIdea}
          </div>
        )}

        {/* Failure Cases */}
        {report.failureCases?.length > 0 && (
          <>
            <h6 className="fw-bold text-muted text-uppercase small mb-3 border-top pt-4">Where the system fails ({report.failureCases.length} cases)</h6>
            <div className="table-responsive">
              <table className="table table-bordered align-middle bg-white small shadow-sm">
                <thead className="table-light">
                  <tr>
                    <th style={{width: '35%'}}>Message Preview</th>
                    <th>Human Cat</th>
                    <th>AI Cat</th>
                    <th>Human Pri</th>
                    <th>AI Pri</th>
                    <th>Conf</th>
                  </tr>
                </thead>
                <tbody>
                  {report.failureCases.map((f, i) => (
                    <tr key={i}>
                      <td className="font-monospace text-muted">{f.rawTextPreview}…</td>
                      <td className="fw-semibold">{f.humanCategory}</td>
                      <td className={!f.categoryMatch ? 'table-danger fw-bold text-danger' : 'text-success'}>
                        {f.aiCategory} {!f.categoryMatch && <i className="bi bi-x-circle-fill ms-1"></i>}
                      </td>
                      <td className="fw-semibold">{f.humanPriority}</td>
                      <td className={!f.priorityMatch ? 'table-danger fw-bold text-danger' : 'text-success'}>
                        {f.aiPriority} {!f.priorityMatch && <i className="bi bi-x-circle-fill ms-1"></i>}
                      </td>
                      <td>{Math.round((f.aiConfidence || 0) * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
