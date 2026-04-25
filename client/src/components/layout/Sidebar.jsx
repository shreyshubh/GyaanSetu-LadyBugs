import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../utils/i18n';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, changeLanguage } = useAuth();
  const lang = user?.language || 'en';
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div style={{ padding: '32px 24px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)' }}>
          GyaanSetu
        </div>
        <button 
          onClick={onClose} 
          style={{ display: 'none', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-secondary)' }}
          className="mobile-close-btn"
        >
          ✕
        </button>
      </div>
      
      <nav style={{ flexGrow: 1, padding: '0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <NavLink 
          to="/dashboard" 
          style={({ isActive }) => ({
            padding: '12px 16px',
            margin: '0 16px',
            borderRadius: '12px',
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            background: isActive ? 'var(--accent-light)' : 'transparent',
            fontWeight: isActive ? 700 : 600,
            transition: 'all 200ms ease'
          })}
        >
          {t('dashboard', lang)}
        </NavLink>
        <NavLink 
          to="/syllabus"
          style={({ isActive }) => ({
            padding: '12px 16px',
            margin: '0 16px',
            borderRadius: '12px',
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            background: isActive ? 'var(--accent-light)' : 'transparent',
            fontWeight: isActive ? 700 : 600,
            transition: 'all 200ms ease'
          })}
        >
          {t('syllabus', lang)}
        </NavLink>
        <NavLink 
          to="/quiz"
          style={({ isActive }) => ({
            padding: '12px 16px',
            margin: '0 16px',
            borderRadius: '12px',
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            background: isActive ? 'var(--accent-light)' : 'transparent',
            fontWeight: isActive ? 700 : 600,
            transition: 'all 200ms ease'
          })}
        >
          {t('quiz', lang)}
        </NavLink>
        <NavLink 
          to="/explanation"
          style={({ isActive }) => ({
            padding: '12px 16px',
            margin: '0 16px',
            borderRadius: '12px',
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            background: isActive ? 'var(--accent-light)' : 'transparent',
            fontWeight: isActive ? 700 : 600,
            transition: 'all 200ms ease'
          })}
        >
          {t('explanation', lang)}
        </NavLink>
        <NavLink 
          to="/career"
          style={({ isActive }) => ({
            padding: '12px 16px',
            margin: '0 16px',
            borderRadius: '12px',
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            background: isActive ? 'var(--accent-light)' : 'transparent',
            fontWeight: isActive ? 700 : 600,
            transition: 'all 200ms ease'
          })}
        >
          {t('career', lang)}
        </NavLink>
        <NavLink 
          to="/profile"
          style={({ isActive }) => ({
            padding: '12px 16px',
            margin: '0 16px',
            borderRadius: '12px',
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            background: isActive ? 'var(--accent-light)' : 'transparent',
            fontWeight: isActive ? 700 : 600,
            transition: 'all 200ms ease'
          })}
        >
          {t('profile', lang)}
        </NavLink>
      </nav>

      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button 
            onClick={() => changeLanguage('en')}
            className="btn-secondary" 
            style={{ flex: 1, padding: '6px', fontSize: '11px', ...(lang === 'en' ? { background: 'var(--accent-light)', borderColor: 'var(--accent)', color: 'var(--accent)' } : {}) }}
          >
            EN
          </button>
          <button 
            onClick={() => changeLanguage('hi')}
            className="btn-secondary" 
            style={{ flex: 1, padding: '6px', fontSize: '11px', ...(lang === 'hi' ? { background: 'var(--accent-light)', borderColor: 'var(--accent)', color: 'var(--accent)' } : {}) }}
          >
            HI
          </button>
        </div>
        <div className="sync-indicator">
          <div className="sync-dot synced"></div>
          {t('synced', lang)}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
