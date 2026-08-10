import React from 'react';

export default function StatCard({ title, value, subtext, accentColor = 'var(--accent)' }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '20px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '4px',
          backgroundColor: accentColor,
        }}
      />
      <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
        {title}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: '6px' }}>
        {value}
      </div>
      {subtext && (
        <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 500 }}>
          {subtext}
        </div>
      )}
    </div>
  );
}
