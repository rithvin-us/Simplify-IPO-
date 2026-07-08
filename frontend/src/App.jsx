import React from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import WorkspaceLayout from './pages/WorkspaceLayout.jsx';
import Wizard from './pages/Wizard.jsx';
import ExtractionPreview from './pages/ExtractionPreview.jsx';
import ValidationPanel from './pages/ValidationPanel.jsx';
import DraftViewer from './pages/DraftViewer.jsx';
import ReviewView from './pages/ReviewView.jsx';
import ExportSummary from './pages/ExportSummary.jsx';

function Topbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  if (!user) return null;
  return (
    <div className="topbar">
      <div className="brand">
        <Link to="/" style={{ color: '#fff' }}>IPOW</Link>
        <small>IPO Drafting Workspace</small>
      </div>
      <div className="user">
        {user.full_name} · <span className="mono">{user.role}</span>
        <button className="ghost sm" onClick={() => { logout(); nav('/login'); }}>Sign out</button>
      </div>
    </div>
  );
}

function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <Topbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/w/:id" element={<Protected><WorkspaceLayout /></Protected>}>
          <Route index element={<Navigate to="wizard" replace />} />
          <Route path="wizard" element={<Wizard />} />
          <Route path="extraction" element={<ExtractionPreview />} />
          <Route path="validation" element={<ValidationPanel />} />
          <Route path="draft" element={<DraftViewer />} />
          <Route path="review" element={<ReviewView />} />
          <Route path="export" element={<ExportSummary />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
