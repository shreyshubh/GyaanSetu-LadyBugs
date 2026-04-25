import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { t } from '../utils/i18n';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lang, setLang] = useState('en');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, changeLanguage } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setIsLoading(true);
      await login(email, password);
      if (lang !== 'en') changeLanguage(lang);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
        <h1 style={{ textAlign: 'center', fontSize: 'var(--text-2xl)' }}>GyaanSetu</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '32px' }}>
          Your personalized learning assistant
        </p>

        {error && (
          <div style={{ background: 'var(--danger)', color: 'white', padding: '12px', borderRadius: '12px', marginBottom: '16px', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

          <button type="submit" className="btn-primary" style={{ marginTop: '16px' }} disabled={isLoading}>
            {isLoading ? 'Logging in...' : t('login', lang)}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: 'var(--text-sm)' }}>
          <Link to="/signup" style={{ color: 'var(--accent)' }}>New here? {t('signup', lang)}</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
