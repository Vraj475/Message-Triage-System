import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';

export default function Sidebar() {
  const [aiStatus, setAiStatus] = useState({ reachable: false, provider: 'gemini' });

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await axios.get('/api/health/ai');
        setAiStatus({
          reachable: res.data.reachable || res.data.configured || false,
          provider: res.data.provider || 'gemini',
        });
      } catch {
        setAiStatus({ reachable: false, provider: 'offline' });
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside
      style={{
        width: '240px',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        zIndex: 1000,
        userSelect: 'none',
      }}
    >
      <div>
        {/* Logo / Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="var(--accent)" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            TriageAI
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--accent)',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
            }}
          >
            OPS
          </span>
        </div>

        {/* Navigation Links */}
        <nav style={{ padding: '16px 0' }}>
          {[
            { to: '/', label: 'Dashboard', icon: 'bi-grid-1x2-fill' },
            { to: '/upload', label: 'Messages & Paste', icon: 'bi-file-earmark-plus-fill' },
            { to: '/eval', label: 'Evaluation', icon: 'bi-clipboard-data-fill' },
            { to: '/health', label: 'System Health', icon: 'bi-heart-pulse-fill' },
          ].map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 24px',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--bg-elevated)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 500,
                fontSize: '13px',
                transition: 'all 150ms ease',
              })}
            >
              <i className={`bi ${link.icon}`} style={{ fontSize: '16px' }}></i>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* AI Provider Status Footer */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--bg-primary)',
          fontSize: '12px',
        }}
      >
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <span className={aiStatus.reachable ? 'dot-healthy' : 'dot-down'} />
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
              {aiStatus.provider.toUpperCase()}
            </span>
          </div>
          <span style={{ color: aiStatus.reachable ? 'var(--success)' : 'var(--danger)', fontSize: '11px', fontWeight: 600 }}>
            {aiStatus.reachable ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>
    </aside>
  );
}
