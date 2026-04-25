import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../utils/i18n';

const Sidebar = () => {
  const { user, changeLanguage } = useAuth();
  const lang = user?.language || 'en';
  return (
    <aside className="sidebar">
      <div style={{ padding: '24px', fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', borderBottom: '1px solid var(--border)' }}>
        GyaanSetu
      </div>
      
      <nav style={{ flexGrow: 1, paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <NavLink 
          to="/" 
          style={({ isActive }) => ({
            padding: '10px 16px',
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
            paddingLeft: isActive ? '13px' : '16px',
            fontWeight: isActive ? 600 : 400
          })}
        >
          {t('dashboard', lang)}
        </NavLink>
        <NavLink 
          to="/syllabus"
          style={({ isActive }) => ({
            padding: '10px 16px',
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
            paddingLeft: isActive ? '13px' : '16px',
            fontWeight: isActive ? 600 : 400
          })}
        >
          {t('syllabus', lang)}
        </NavLink>
        <NavLink 
          to="/quiz"
          style={({ isActive }) => ({
            padding: '10px 16px',
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
            paddingLeft: isActive ? '13px' : '16px',
            fontWeight: isActive ? 600 : 400
          })}
        >
          {t('quiz', lang)}
        </NavLink>
        <NavLink 
          to="/explanation"
          style={({ isActive }) => ({
            padding: '10px 16px',
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
            paddingLeft: isActive ? '13px' : '16px',
            fontWeight: isActive ? 600 : 400
          })}
        >
          {t('explanation', lang)}
        </NavLink>
        <NavLink 
          to="/career"
          style={({ isActive }) => ({
            padding: '10px 16px',
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
            paddingLeft: isActive ? '13px' : '16px',
            fontWeight: isActive ? 600 : 400
          })}
        >
          {t('career', lang)}
        </NavLink>
        <NavLink 
          to="/profile"
          style={({ isActive }) => ({
            padding: '10px 16px',
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
            paddingLeft: isActive ? '13px' : '16px',
            fontWeight: isActive ? 600 : 400
          })}
        >
          {t('profile', lang)}
        </NavLink>
      </nav>

      <div style={{ padding: '24px', borderTop: '1px solid var(--border)' }}>
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
