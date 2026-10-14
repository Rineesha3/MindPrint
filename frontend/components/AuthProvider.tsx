"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  User,
  changePassword as apiChangePassword,
  clearToken,
  deleteAccount as apiDeleteAccount,
  fetchMe,
  login as apiLogin,
  logout as apiLogout,
  registerAccount,
  setToken,
  updateName as apiUpdateName,
} from "@/lib/auth";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
  changePassword: (currentPassword: string | null, newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .catch(() => setUser(null)) // API unreachable — continue as a guest
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const res = await registerAccount(email, password, name);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    clearToken();
    setUser(null);
  }, []);

  const updateName = useCallback(async (name: string) => {
    const updated = await apiUpdateName(name);
    setUser(updated);
  }, []);

  const changePassword = useCallback(
    async (currentPassword: string | null, newPassword: string) => {
      await apiChangePassword(currentPassword, newPassword);
      setUser((u) => (u ? { ...u, has_password: true } : u));
    },
    []
  );

  const deleteAccount = useCallback(async () => {
    await apiDeleteAccount();
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateName, changePassword, deleteAccount }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
