import React from 'react';

export default function ProgressBar({ completed = 0, pending = 0, failed = 0, total = 0, isProcessing = false }) {
  const safeTotal = total || (completed + pending + failed) || 1;
  const completedPct = Math.round((completed / safeTotal) * 100);
  const pendingPct = Math.round((pending / safeTotal) * 100);
  const failedPct = Math.round((failed / safeTotal) * 100);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: '12px' }}>
        <div className="d-flex align-items-center gap-2">
          {isProcessing ? (
            <>
              <span className="dot-processing" />
              <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
                Processing batch... ({completed + failed} of {safeTotal})
              </span>
            </>
          ) : (
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
              Batch Progress ({completedPct}% complete)
            </span>
          )}
        </div>
        <div className="d-flex gap-3" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          <span><strong style={{ color: 'var(--success)' }}>{completed}</strong> Done</span>
          <span><strong style={{ color: 'var(--text-muted)' }}>{pending}</strong> Pending</span>
          {failed > 0 && <span><strong style={{ color: 'var(--danger)' }}>{failed}</strong> Failed</span>}
        </div>
      </div>

      <div
        style={{
          height: '8px',
          width: '100%',
          backgroundColor: 'var(--bg-elevated)',
          borderRadius: '4px',
          overflow: 'hidden',
          display: 'flex',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ width: `${completedPct}%`, backgroundColor: 'var(--success)', transition: 'width 300ms ease' }} title={`Completed: ${completed}`} />
        <div style={{ width: `${failedPct}%`, backgroundColor: 'var(--danger)', transition: 'width 300ms ease' }} title={`Failed: ${failed}`} />
        <div style={{ width: `${pendingPct}%`, backgroundColor: 'var(--border)', transition: 'width 300ms ease' }} title={`Pending: ${pending}`} />
      </div>
    </div>
  );
}
