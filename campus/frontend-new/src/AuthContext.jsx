import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as api from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = api.getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .fetchMe()
      .then(setUser)
      .catch(() => api.clearTokens())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (usernameOrEmail, password) => {
    const u = await api.login(usernameOrEmail, password);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (payload) => {
    const u = await api.register(payload);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const u = await api.fetchMe();
    setUser(u);
    return u;
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const u = await api.updateMe(payload);
    setUser(u);
    return u;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
