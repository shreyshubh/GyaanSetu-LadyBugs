import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { t } from './utils/i18n';
import { AuthProvider, useAuth } from './context/AuthContext';
import useOfflineSync from './hooks/useOfflineSync';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Syllabus from './pages/Syllabus';
import Quiz from './pages/Quiz';
import Profile from './pages/Profile';
import Signup from './pages/Signup';
import Career from './pages/Career';
import Explanation from './pages/Explanation';
import Notes from './pages/Notes';
import Landing from './pages/Landing';
import Sidebar from './components/layout/Sidebar';

const OfflineBanner = () => {
  const { isOnline, syncStatus } = useOfflineSync();
  const { user } = useAuth();
  const lang = user?.language || 'en';
  
  if (isOnline && !syncStatus) return null;

  const bg = !isOnline ? 'var(--warning)' : syncStatus === 'synced' ? 'var(--success)' : syncStatus === 'error' ? 'var(--danger)' : 'var(--accent)';
  const text = !isOnline ? `⚡ ${t('you_are_offline', lang)}` : syncStatus === 'syncing' ? `🔄 ${t('syncing', lang)}` : syncStatus === 'synced' ? `✅ ${t('synced', lang)}!` : `❌ ${t('sync_failed', lang)}`;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, background: bg, color: '#fff', textAlign: 'center', padding: '8px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
      {text}
    </div>
  );
};


const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  if (!user) return <Navigate to="/login" />;
  
  return (
    <div className="layout-container">
      <div className={`mobile-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <button 
          className="mobile-menu-btn" 
          onClick={() => setSidebarOpen(true)}
          style={{ display: 'none', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', marginBottom: '24px' }}
        >
          ☰
        </button>
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <OfflineBanner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/syllabus" element={<ProtectedRoute><Syllabus /></ProtectedRoute>} />
          <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/career" element={<ProtectedRoute><Career /></ProtectedRoute>} />
          <Route path="/explanation" element={<ProtectedRoute><Explanation /></ProtectedRoute>} />
          <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
