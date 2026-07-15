import React from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import AccessPanel from './pages/AccessPanel.jsx';
import IssuesPanel from './pages/IssuesPanel.jsx';
import Security from './pages/Security.jsx';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      aria-label="Language"
      style={{ marginRight: '.6rem', padding: '.15rem .3rem' }}
    >
      <option value="en">EN</option>
      <option value="hi">हिन्दी</option>
    </select>
  );
}

function Topbar() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const nav = useNavigate();
  if (!user) return null;
  return (
    <div className="topbar">
      <div className="brand">
        <Link to="/" style={{ color: '#fff' }}>{t('app.title')}</Link>
        <small>{t('app.subtitle')}</small>
      </div>
      <div className="user">
        <LanguageSwitcher />
        {user.full_name} · <span className="mono">{user.role}</span>
        <Link to="/security" style={{ margin: '0 .6rem' }}>{t('app.security')}</Link>
        <button className="ghost sm" onClick={() => { logout(); nav('/login'); }}>{t('app.signOut')}</button>
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
        <Route path="/security" element={<Protected><Security /></Protected>} />
        <Route path="/w/:id" element={<Protected><WorkspaceLayout /></Protected>}>
          <Route index element={<Navigate to="wizard" replace />} />
          <Route path="wizard" element={<Wizard />} />
          <Route path="extraction" element={<ExtractionPreview />} />
          <Route path="validation" element={<ValidationPanel />} />
          <Route path="draft" element={<DraftViewer />} />
          <Route path="review" element={<ReviewView />} />
          <Route path="export" element={<ExportSummary />} />
          <Route path="access" element={<AccessPanel />} />
          <Route path="issues" element={<IssuesPanel />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
