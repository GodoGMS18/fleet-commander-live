import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User } from '@/types';
import { mockLogin, getStoredUser, storeUser } from '@/mock/auth';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({ user: null, loading: true, login: async () => 'error', logout: () => {} });

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const u = await mockLogin(email, password);
    if (!u) return 'Invalid email or password';
    setUser(u);
    if (remember) storeUser(u);
    return null;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    storeUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}
