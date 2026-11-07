import { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('talenthub_v2_token');
      const storedUser = localStorage.getItem('talenthub_v2_user');
      if (storedToken && storedUser) {
        try {
          // Verify with server /auth/me
          const { data } = await client.get('/auth/me');
          setUser(data);
          localStorage.setItem('talenthub_v2_user', JSON.stringify(data));
        } catch (err) {
          localStorage.removeItem('talenthub_v2_token');
          localStorage.removeItem('talenthub_v2_user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (tokenData) => {
    localStorage.setItem('talenthub_v2_token', tokenData.access_token);
    localStorage.setItem('talenthub_v2_user', JSON.stringify(tokenData));
    setUser(tokenData);
  };

  const logout = () => {
    localStorage.removeItem('talenthub_v2_token');
    localStorage.removeItem('talenthub_v2_user');
    setUser(null);
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    try {
      const { data } = await client.get('/auth/me');
      setUser(data);
      localStorage.setItem('talenthub_v2_user', JSON.stringify(data));
    } catch (e) {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
