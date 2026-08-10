import React from 'react';

export default function EvalReport({ report, onSelectRun, runs = [] }) {
  if (!report || report.message) {
    return (
      <div className="alert alert-info py-3 mb-4" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
        <i className="bi bi-info-circle me-2 text-info"></i>
        {report?.message || 'No evaluation data yet. Label at least 10 messages below and run evaluation.'}
      </div>
    );
  }

  const matrix = report.confusionMatrix || {};
  const categories = Object.keys(matrix);

  return (
    <div className="card mb-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="card-header py-3 d-flex flex-wrap justify-content-between align-items-center gap-2" style={{ backgroundColor: 'transparent', borderBottom: '1px solid var(--border)' }}>
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-clipboard-data-fill text-success" style={{ fontSize: '18px' }} />
          <span className="fw-semibold" style={{ fontSize: '15px' }}>Evaluation Report</span>
          {report.name && <span className="badge ms-2" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--accent)', border: '1px solid var(--border)' }}>{report.name}</span>}
        </div>

        {runs.length > 0 && (
          <div className="d-flex align-items-center gap-2">
            <span className="small text-muted">History:</span>
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto', backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              value={report._id || ''}
              onChange={e => {
                const selected = runs.find(r => r._id === e.target.value);
                if (selected && onSelectRun) onSelectRun(selected);
              }}
            >
              {runs.map(r => (
                <option key={r._id} value={r._id}>
                  {new Date(r.createdAt).toLocaleTimeString()} — {r.name || 'Run'} ({r.datasetSize || 0} msgs)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="card-body">
        {/* Top 4 Accuracy Ring Metric Cards */}
        <div className="row g-3 mb-4">
          {[
            { label: 'Exact Decision Match', value: report.exactDecisionMatchRate, color: 'var(--success)' },
            { label: 'Category Accuracy', value: report.categoryAccuracy, color: 'var(--accent)' },
            { label: 'Priority Accuracy', value: report.priorityAccuracy, color: 'var(--warning)' },
            { label: 'Escalation Accuracy', value: report.humanEscalationAccuracy, color: 'var(--info)' },
          ].map(stat => (
            <div key={stat.label} className="col-md-3 col-6">
              <div
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '24px', fontWeight: 700, color: stat.color, lineHeight: 1.1, marginBottom: '4px' }}>
                  {stat.value !== null && stat.value !== undefined ? `${stat.value}%` : 'N/A'}
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* System Stats (Latency, Tokens, Cost) */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '6px' }}>
              <div className="text-muted small fw-semibold">Avg Latency</div>
              <div className="fs-5 fw-bold" style={{ color: 'var(--text-primary)' }}>
                {report.averageLatencyMs || 0} <span className="fs-6 text-muted font-mono">ms</span>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '6px' }}>
              <div className="text-muted small fw-semibold">Avg Tokens (In / Out)</div>
              <div className="fs-5 fw-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                {report.averageInputTokens || 0} / {report.averageOutputTokens || 0}
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '6px' }}>
              <div className="text-muted small fw-semibold">Est. Cost</div>
              <div className="fs-5 fw-bold" style={{ color: 'var(--success)' }}>
                {report.estimatedCost === 0 ? '$0.00 (Free Tier)' : `$${report.estimatedCost}`}
              </div>
            </div>
          </div>
        </div>

        {/* Confusion Matrix Grid */}
        {categories.length > 0 && (
          <div className="mt-4 pt-3 border-top border-secondary">
            <h6 className="fw-bold text-uppercase small mb-3" style={{ color: 'var(--text-secondary)' }}>
              Category Confusion Matrix Grid (Expected vs Predicted)
            </h6>
            <div className="table-responsive">
              <table className="table table-bordered align-middle text-center small mb-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                    <th style={{ textAlign: 'left' }}>Expected \ Predicted</th>
                    {categories.map(c => (
                      <th key={c} style={{ textTransform: 'capitalize' }}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categories.map(expected => (
                    <tr key={expected}>
                      <th style={{ textAlign: 'left', backgroundColor: 'var(--bg-elevated)', textTransform: 'capitalize' }}>{expected}</th>
                      {categories.map(actual => {
                        const count = matrix[expected]?.[actual] || 0;
                        const isMatch = expected === actual;
                        let bg = 'transparent';
                        if (isMatch && count > 0) bg = 'rgba(62, 207, 142, 0.18)';
                        else if (!isMatch && count > 0) bg = 'rgba(242, 95, 92, 0.18)';

                        return (
                          <td
                            key={actual}
                            style={{
                              backgroundColor: bg,
                              color: isMatch && count > 0 ? 'var(--success)' : !isMatch && count > 0 ? 'var(--danger)' : 'var(--text-muted)',
                              fontWeight: count > 0 ? 700 : 400,
                            }}
                          >
                            {count}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Failure Cases */}
        {report.failureCases?.length > 0 && (
          <div className="mt-4 pt-3 border-top border-secondary">
            <h6 className="fw-bold text-uppercase small mb-3" style={{ color: 'var(--text-secondary)' }}>
              Mismatches & Discrepancies ({report.failureCases.length} items)
            </h6>
            <div className="table-responsive">
              <table className="table table-bordered align-middle small mb-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                    <th style={{ width: '40%' }}>Message Preview</th>
                    <th>Human Cat</th>
                    <th>AI Cat</th>
                    <th>Human Pri</th>
                    <th>AI Pri</th>
                  </tr>
                </thead>
                <tbody>
                  {report.failureCases.map((f, idx) => (
                    <tr key={idx}>
                      <td className="font-mono text-secondary">{f.rawTextPreview}…</td>
                      <td className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{f.humanCategory}</td>
                      <td style={{ color: f.categoryMatch ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                        {f.aiCategory} {!f.categoryMatch && <i className="bi bi-x-circle ms-1" />}
                      </td>
                      <td className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{f.humanPriority}</td>
                      <td style={{ color: f.priorityMatch ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                        {f.aiPriority} {!f.priorityMatch && <i className="bi bi-x-circle ms-1" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
