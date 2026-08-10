import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Evaluation from './pages/Evaluation';

export default function App() {
  const location = useLocation();

  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-dark px-3">
        <span className="navbar-brand fw-bold">
          <i className="bi bi-funnel-fill me-2"></i>
          Customer Message Triage System
        </span>
        <div className="d-flex gap-3">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'text-white fw-bold' : 'text-secondary'}`}
          >
            Dashboard
          </Link>
          <Link
            to="/eval"
            className={`nav-link ${location.pathname === '/eval' ? 'text-white fw-bold' : 'text-secondary'}`}
          >
            Evaluation
          </Link>
        </div>
      </nav>

      {/* Page Content */}
      <div className="container-fluid px-4 py-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/eval" element={<Evaluation />} />
        </Routes>
      </div>
    </>
  );
}
