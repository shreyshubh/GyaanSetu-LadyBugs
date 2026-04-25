import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { t } from '../utils/i18n';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lang, setLang] = useState('en');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    login(email, password, lang); // Mock login after signup
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
        <h1 style={{ textAlign: 'center', fontSize: 'var(--text-2xl)' }}>GyaanSetu</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '32px' }}>
          {t('signup', lang)}
        </p>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: 'var(--text-sm)', display: 'block', marginBottom: '6px' }}>{t('name', lang)}</label>
            <input 
              type="text" 
              required 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Riya Singh"
            />
          </div>
          <div>
            <label style={{ fontSize: 'var(--text-sm)', display: 'block', marginBottom: '6px' }}>{t('email', lang)}</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="student@college.edu"
            />
          </div>
          <div>
            <label style={{ fontSize: 'var(--text-sm)', display: 'block', marginBottom: '6px' }}>{t('password', lang)}</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button 
              type="button"
              className="btn-secondary"
              style={{ flex: 1, ...(lang === 'en' ? { background: 'var(--accent-light)', borderColor: 'var(--accent)', color: 'var(--accent)' } : {}) }}
              onClick={() => setLang('en')}
            >
              English
            </button>
            <button 
              type="button"
              className="btn-secondary"
              style={{ flex: 1, ...(lang === 'hi' ? { background: 'var(--accent-light)', borderColor: 'var(--accent)', color: 'var(--accent)' } : {}) }}
              onClick={() => setLang('hi')}
            >
              हिंदी
            </button>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>
            {t('signup', lang)}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: 'var(--text-sm)' }}>
          <Link to="/login" style={{ color: 'var(--accent)' }}>Already have an account? {t('login', lang)}</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
