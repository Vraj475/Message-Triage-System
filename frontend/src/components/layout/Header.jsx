import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Header({ datasets = [], activeDatasetId, onSelectDataset }) {
  const navigate = useNavigate();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      style={{
        height: '60px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 999,
      }}
    >
      {/* Left: Dataset Selector */}
      <div className="d-flex align-items-center gap-3">
        <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>
          Active Dataset:
        </span>
        <select
          className="form-select form-select-sm"
          style={{
            width: '260px',
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
            fontSize: '13px',
          }}
          value={activeDatasetId || ''}
          onChange={e => onSelectDataset && onSelectDataset(e.target.value)}
        >
          {datasets.length === 0 && <option value="">-- No Datasets --</option>}
          {datasets.map(ds => (
            <option key={ds._id} value={ds._id}>
              {ds.name} ({ds.messageCount || 0} msgs)
            </option>
          ))}
        </select>
      </div>

      {/* Right: New Upload Button & Time */}
      <div className="d-flex align-items-center gap-4">
        <div className="font-mono text-muted" style={{ fontSize: '12px', letterSpacing: '0.05em' }}>
        </div>
        <button
          className="btn btn-sm text-white font-semibold"
          style={{
            backgroundColor: 'var(--accent)',
            border: 'none',
            padding: '6px 16px',
            fontSize: '13px',
            borderRadius: '6px',
          }}
          onClick={() => navigate('/upload')}
        >
          <i className="bi bi-plus-lg me-1"></i>
          New Upload
        </button>
      </div>
    </header>
  );
}
