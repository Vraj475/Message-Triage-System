import React from 'react';

export function CategoryBadge({ category, isApiFailure }) {
  if (isApiFailure) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 600,
          backgroundColor: 'rgba(242, 95, 92, 0.15)',
          color: 'var(--danger)',
          border: '1px solid var(--danger)',
        }}
      >
        <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '10px' }} />
        API Failed
      </span>
    );
  }

  const catMap = {
    billing: { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' },
    technical: { bg: 'rgba(167, 139, 250, 0.15)', color: 'var(--purple)', border: 'rgba(167, 139, 250, 0.3)' },
    complaint: { bg: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', border: 'rgba(249, 115, 22, 0.3)' },
    refund: { bg: 'rgba(240, 164, 41, 0.15)', color: 'var(--warning)', border: 'rgba(240, 164, 41, 0.3)' },
    account: { bg: 'rgba(20, 184, 166, 0.15)', color: '#2dd4bf', border: 'rgba(20, 184, 166, 0.3)' },
    inquiry: { bg: 'rgba(100, 116, 139, 0.15)', color: '#94a3b8', border: 'rgba(100, 116, 139, 0.3)' },
    spam: { bg: 'rgba(85, 90, 122, 0.15)', color: 'var(--text-muted)', border: 'rgba(85, 90, 122, 0.3)' },
    unclear: { bg: 'rgba(242, 95, 92, 0.15)', color: 'var(--danger)', border: 'var(--danger)' },
    unknown: { bg: 'rgba(242, 95, 92, 0.15)', color: 'var(--danger)', border: 'var(--danger)' },
  };

  const style = catMap[category?.toLowerCase()] || catMap.inquiry;

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        textTransform: 'lowercase',
      }}
    >
      {category || 'unclear'}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const prioMap = {
    P0: { bg: 'var(--danger)', color: '#ffffff' },
    P1: { bg: 'var(--warning)', color: '#0f1117' },
    P2: { bg: 'var(--accent)', color: '#ffffff' },
    P3: { bg: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
  };

  const style = prioMap[priority] || prioMap.P3;

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '10px',
        fontSize: '10px',
        fontWeight: 700,
        backgroundColor: style.bg,
        color: style.color,
        border: style.border || 'none',
        letterSpacing: '0.03em',
      }}
    >
      {priority || 'P3'}
    </span>
  );
}
