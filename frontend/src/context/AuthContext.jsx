import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/index.js';
import { getToken, setToken } from '../api/client.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;
    authApi
      .me()
      .then(({ user: profile }) => setUser(profile))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const authenticate = useCallback(async (request) => {
    const { token, user: profile } = await request;
    setToken(token);
    setUser(profile);
    return profile;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAdmin: user?.role === 'admin',
      login: (payload) => authenticate(authApi.login(payload)),
      register: (payload) => authenticate(authApi.register(payload)),
      logout: () => {
        setToken(null);
        setUser(null);
      },
      updateUser: (patch) => setUser((prev) => ({ ...prev, ...patch })),
    }),
    [user, loading, authenticate]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
