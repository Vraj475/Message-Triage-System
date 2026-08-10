import React from 'react';

export default function EvalReport({ report }) {
  if (!report || report.message) {
    return (
      <div className="alert alert-info">
        <i className="bi bi-info-circle me-2"></i>
        {report?.message || 'No evaluation data yet. Label at least 10 messages below.'}
      </div>
    );
  }

  return (
    <div className="card mb-4">
      <div className="card-header fw-semibold bg-dark text-white">
        <i className="bi bi-clipboard-data me-2"></i>
        Evaluation Report — Ground Truth Comparison
      </div>
      <div className="card-body">
        {/* Agreement Rates */}
        <div className="row g-3 mb-4">
          {[
            { label: 'Overall Agreement', value: report.overall_agreement_rate, variant: 'success' },
            { label: 'Category Match', value: report.category_agreement_rate, variant: 'primary' },
            { label: 'Priority Match', value: report.priority_agreement_rate, variant: 'warning' },
            { label: 'Human Flag Match', value: report.human_flag_agreement_rate, variant: 'info' },
          ].map(stat => (
            <div key={stat.label} className="col-3">
              <div className={`card text-center border-${stat.variant}`}>
                <div className="card-body py-2">
                  <div className={`fs-3 fw-bold text-${stat.variant}`}>{stat.value}</div>
                  <div className="small text-muted">{stat.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* System Stats */}
        <div className="row g-2 mb-4">
          <div className="col-4">
            <div className="card border-0 bg-light">
              <div className="card-body py-2">
                <div className="fw-semibold small text-muted">Avg Latency</div>
                <div className="fs-5">{report.system_stats?.avg_latency_ms} ms/msg</div>
              </div>
            </div>
          </div>
          <div className="col-4">
            <div className="card border-0 bg-light">
              <div className="card-body py-2">
                <div className="fw-semibold small text-muted">Total Tokens Used</div>
                <div className="fs-5">{report.system_stats?.total_tokens_used?.toLocaleString()}</div>
              </div>
            </div>
          </div>
          <div className="col-4">
            <div className="card border-0 bg-success bg-opacity-10">
              <div className="card-body py-2">
                <div className="fw-semibold small text-muted">API Cost</div>
                <div className="fs-5 text-success">{report.system_stats?.cost_per_message_usd === 0 ? '$0.00 (Free tier)' : `$${report.system_stats?.cost_per_message_usd}/msg`}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Optimization Note */}
        <div className="alert alert-secondary mb-4">
          <strong>Optimization idea:</strong> {report.optimization_suggestion}
        </div>

        {/* Failure Cases */}
        {report.failures?.length > 0 && (
          <>
            <h6 className="fw-semibold">Where the system fails ({report.failures.length} cases)</h6>
            <table className="table table-sm table-bordered small">
              <thead className="table-dark">
                <tr>
                  <th>Message Preview</th>
                  <th>Human Category</th>
                  <th>AI Category</th>
                  <th>Human Priority</th>
                  <th>AI Priority</th>
                  <th>AI Confidence</th>
                  <th>Cat Match</th>
                  <th>Pri Match</th>
                </tr>
              </thead>
              <tbody>
                {report.failures.map((f, i) => (
                  <tr key={i}>
                    <td className="font-monospace">{f.raw_text_preview}…</td>
                    <td>{f.human.category}</td>
                    <td className={!f.agrees_category ? 'table-danger' : ''}>{f.ai.category}</td>
                    <td>{f.human.priority}</td>
                    <td className={!f.agrees_priority ? 'table-danger' : ''}>{f.ai.priority}</td>
                    <td>{Math.round((f.ai_confidence || 0) * 100)}%</td>
                    <td>{f.agrees_category ? '✓' : '✗'}</td>
                    <td>{f.agrees_priority ? '✓' : '✗'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
