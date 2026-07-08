import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useParams, Link } from 'react-router-dom';
import api from '../api.js';

const TABS = [
  ['wizard', '1 · Wizard'],
  ['extraction', '2 · Extraction'],
  ['validation', '3 · Validation'],
  ['draft', '4 · Draft'],
  ['review', '5 · Review'],
  ['export', '6 · Export'],
];

export default function WorkspaceLayout() {
  const { id } = useParams();
  const [ws, setWs] = useState(null);

  useEffect(() => {
    api.get(`/workspaces/${id}`).then((r) => setWs(r.data)).catch(() => setWs(null));
  }, [id]);

  return (
    <div className="container">
      <div className="spread">
        <div>
          <Link to="/" className="muted">← All workspaces</Link>
          <h1 style={{ margin: '.3rem 0 0' }}>{ws ? ws.workspace.company_name : 'Workspace'}</h1>
          {ws && <span className="muted mono">{ws.workspace.cin || 'CIN pending'}</span>}
        </div>
        {ws && <div className="score" title="Draft Health Score">{ws.health.score}<span style={{ fontSize: '1rem' }} className="muted">/100</span></div>}
      </div>

      <div className="pill-nav">
        {TABS.map(([path, label]) => (
          <NavLink key={path} to={path} className={({ isActive }) => (isActive ? 'active' : '')}>{label}</NavLink>
        ))}
      </div>

      <Outlet context={{ workspaceId: id, workspace: ws }} />
    </div>
  );
}
