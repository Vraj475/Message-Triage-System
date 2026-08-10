import React, { useState } from 'react';

const PRIORITY_ROW = {
  P0: 'table-danger',
  P1: 'table-warning',
  P2: 'table-info',
  P3: '',
};

const PRIORITY_BADGE = {
  P0: 'badge bg-danger',
  P1: 'badge bg-warning text-dark',
  P2: 'badge bg-info text-dark',
  P3: 'badge bg-secondary',
};

const CATEGORY_BADGE = {
  billing: 'badge bg-primary',
  refund: 'badge bg-primary',
  technical: 'badge bg-info text-dark',
  complaint: 'badge bg-warning text-dark',
  account: 'badge bg-secondary',
  inquiry: 'badge bg-light text-dark border',
  spam: 'badge bg-dark',
  unclear: 'badge bg-dark',
};

function ConfidenceBadge({ value }) {
  const pct = Math.round(value * 100);
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

  function toggleSort(field) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }

  const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };

  let displayed = filterHuman ? messages.filter(m => m.triage?.needs_human) : messages;
  displayed = [...displayed].sort((a, b) => {
    let aVal, bVal;
    if (sortField === 'triage.priority') {
      aVal = priorityOrder[a.triage?.priority] ?? 99;
      bVal = priorityOrder[b.triage?.priority] ?? 99;
    } else if (sortField === 'triage.confidence') {
      aVal = a.triage?.confidence ?? 0;
      bVal = b.triage?.confidence ?? 0;
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
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <span className="fw-semibold">
          <i className="bi bi-table me-2"></i>
          Triage Results ({displayed.length} shown)
        </span>
        <div className="form-check mb-0">
          <input
            className="form-check-input"
            type="checkbox"
            id="filterHuman"
            checked={filterHuman}
            onChange={e => setFilterHuman(e.target.checked)}
          />
          <label className="form-check-label small" htmlFor="filterHuman">
            Show flagged only
          </label>
        </div>
      </div>
      <div className="table-responsive">
        <table className="table table-bordered table-hover mb-0 small">
          <thead className="table-dark">
            <tr>
              <th style={{ width: '30%' }}>Message Preview</th>
              <th
                style={{ cursor: 'pointer' }}
                onClick={() => toggleSort('triage.category')}
              >
                Category {sortField === 'triage.category' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th
                style={{ cursor: 'pointer' }}
                onClick={() => toggleSort('triage.priority')}
              >
                Priority {sortField === 'triage.priority' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th>Summary</th>
              <th>Suggested Action</th>
              <th>Needs Human</th>
              <th
                style={{ cursor: 'pointer' }}
                onClick={() => toggleSort('triage.confidence')}
              >
                Confidence {sortField === 'triage.confidence' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((msg) => (
              <tr key={msg._id} className={PRIORITY_ROW[msg.triage?.priority]}>
                <td className="font-monospace" style={{ maxWidth: '250px', wordBreak: 'break-word' }}>
                  {msg.raw_text.slice(0, 100)}{msg.raw_text.length > 100 ? '…' : ''}
                </td>
                <td>
                  <span className={CATEGORY_BADGE[msg.triage?.category] || 'badge bg-secondary'}>
                    {msg.triage?.category}
                  </span>
                </td>
                <td>
                  <span className={PRIORITY_BADGE[msg.triage?.priority] || 'badge bg-secondary'}>
                    {msg.triage?.priority}
                  </span>
                </td>
                <td>{msg.triage?.summary}</td>
                <td>{msg.triage?.suggested_action}</td>
                <td className="text-center">
                  {msg.triage?.needs_human
                    ? <span className="text-danger fw-bold">🚨 Yes</span>
                    : <span className="text-success">✓ No</span>}
                </td>
                <td>
                  <ConfidenceBadge value={msg.triage?.confidence || 0} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
