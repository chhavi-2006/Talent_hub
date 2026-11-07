import { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('finpay_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWallet = async () => {
    try {
      const res = await client.get('/wallet/mine');
      setWallet(res.data);
    } catch (err) {
      console.warn('Could not fetch wallet data:', err);
    }
  };

  useEffect(() => {
    if (user && user.role === 'STUDENT') {
      fetchWallet();
    }
    setLoading(false);
  }, [user]);

  const login = (authData) => {
    localStorage.setItem('finpay_token', authData.access_token);
    localStorage.setItem('finpay_user', JSON.stringify(authData));
    setUser(authData);
  };

  const logout = () => {
    localStorage.removeItem('finpay_token');
    localStorage.removeItem('finpay_user');
    setUser(null);
    setWallet(null);
  };

  const refreshWallet = async () => {
    if (user && user.role === 'STUDENT') {
      await fetchWallet();
    }
  };

  const updateTier = async (newTier) => {
    const res = await client.post('/wallet/tier', { new_tier: newTier });
    if (user) {
      const updatedUser = { ...user, wallet_tier: newTier };
      setUser(updatedUser);
      localStorage.setItem('finpay_user', JSON.stringify(updatedUser));
    }
    await refreshWallet();
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        loading,
        login,
        logout,
        refreshWallet,
        updateTier,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
