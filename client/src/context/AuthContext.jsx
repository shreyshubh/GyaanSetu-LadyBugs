import { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Fake login state for now
  const [user, setUser] = useState(null);

  const login = (email, password, lang = 'en') => {
    // Fake mock user
    setUser({
      _id: 'user123',
      name: 'Riya Singh',
      email: email,
      language: lang,
      gamification: {
        current_streak: 12,
        longest_streak: 15,
        total_topics_studied: 24,
        total_quizzes_taken: 5
      }
    });
  };

  const logout = () => {
    setUser(null);
  };

  const changeLanguage = (lang) => {
    if (user) {
      setUser({ ...user, language: lang });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, changeLanguage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
