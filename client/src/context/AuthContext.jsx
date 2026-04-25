import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Use env var for API base URL, fallback to localhost
  axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const { data } = await axios.get('/api/auth/me');
        setUser({ ...data, language: data.language || 'en' });
      } catch (err) {
        console.error(err);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser({ ...data, language: data.language || 'en' });
    return data;
  };

  const signup = async (name, email, password, lang = 'en') => {
    const { data } = await axios.post('/api/auth/signup', { name, email, password, language: lang });
    localStorage.setItem('token', data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser({ ...data, language: data.language || 'en' });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const changeLanguage = (lang) => {
    if (user) {
      setUser({ ...user, language: lang });
    }
  };

  // Expose setUser so pages can refresh user data after mutations
  const refreshUser = async () => {
    try {
      const { data } = await axios.get('/api/auth/me');
      setUser({ ...data, language: data.language || 'en' });
    } catch (err) {
      console.error('Refresh user error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, signup, logout, changeLanguage, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
