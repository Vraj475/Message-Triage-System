import React from 'react';

export default function StatsBar({ messages }) {
  const total = messages.length;
  const flagged = messages.filter(m => m.triage?.needs_human).length;
  const p0 = messages.filter(m => m.triage?.priority === 'P0').length;
  const p1 = messages.filter(m => m.triage?.priority === 'P1').length;
  const p2 = messages.filter(m => m.triage?.priority === 'P2').length;
  const p3 = messages.filter(m => m.triage?.priority === 'P3').length;

  return (
    <div className="row g-2 mb-3">
      <div className="col">
        <div className="card text-center border-0 bg-dark text-white">
          <div className="card-body py-2">
            <div className="fs-4 fw-bold">{total}</div>
            <div className="small text-secondary">Total</div>
          </div>
        </div>
      </div>
      <div className="col">
        <div className="card text-center border-0 bg-warning bg-opacity-25">
          <div className="card-body py-2">
            <div className="fs-4 fw-bold text-warning">{flagged}</div>
            <div className="small text-secondary">Needs Human</div>
          </div>
        </div>
      </div>
      <div className="col">
        <div className="card text-center border-0 bg-danger bg-opacity-25">
          <div className="card-body py-2">
            <div className="fs-4 fw-bold text-danger">{p0}</div>
            <div className="small text-secondary">P0 Critical</div>
          </div>
        </div>
      </div>
      <div className="col">
        <div className="card text-center border-0" style={{ background: 'rgba(253,126,20,0.15)' }}>
          <div className="card-body py-2">
            <div className="fs-4 fw-bold text-warning">{p1}</div>
            <div className="small text-secondary">P1 High</div>
          </div>
        </div>
      </div>
      <div className="col">
        <div className="card text-center border-0 bg-info bg-opacity-10">
          <div className="card-body py-2">
            <div className="fs-4 fw-bold text-info">{p2}</div>
            <div className="small text-secondary">P2 Medium</div>
          </div>
        </div>
      </div>
      <div className="col">
        <div className="card text-center border-0 bg-secondary bg-opacity-10">
          <div className="card-body py-2">
            <div className="fs-4 fw-bold text-secondary">{p3}</div>
            <div className="small text-secondary">P3 Low</div>
          </div>
        </div>
      </div>
    </div>
  );
}
