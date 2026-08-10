import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Evaluation from './pages/Evaluation';
import SystemHealth from './pages/SystemHealth';

export default function App() {
  const location = useLocation();

  function navClass(path) {
    return `nav-link ${location.pathname === path ? 'text-white fw-bold' : 'text-secondary'}`;
  }

  return (
    <>
      <nav className="navbar navbar-dark px-3" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
        <span className="navbar-brand fw-bold">
          <i className="bi bi-funnel-fill me-2"></i>
          Message Triage System
          <span className="badge bg-warning text-dark ms-2" style={{ fontSize: '0.55em', verticalAlign: 'middle' }}>PROVISIONAL</span>
        </span>
        <div className="d-flex gap-3">
          <Link to="/" className={navClass('/')}>
            <i className="bi bi-speedometer2 me-1"></i>Dashboard
          </Link>
          <Link to="/eval" className={navClass('/eval')}>
            <i className="bi bi-clipboard-check me-1"></i>Evaluation
          </Link>
          <Link to="/health" className={navClass('/health')}>
            <i className="bi bi-heart-pulse me-1"></i>Health
          </Link>
        </div>
      </nav>

      {/* Triage-tool disclaimer */}
      <div className="bg-dark text-secondary text-center py-1" style={{ fontSize: '0.75em', borderBottom: '1px solid #333' }}>
        <i className="bi bi-info-circle me-1"></i>
        Internal triage tool — classifies messages only. Does not send customer replies, emails, tickets, or refunds.
        Categories and priority definitions are provisional.
      </div>

      <div className="container-fluid px-4 py-4" style={{ background: '#f8f9fa', minHeight: 'calc(100vh - 90px)' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/eval" element={<Evaluation />} />
          <Route path="/health" element={<SystemHealth />} />
        </Routes>
      </div>
    </>
  );
}
