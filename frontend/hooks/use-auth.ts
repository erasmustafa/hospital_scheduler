"use client";

import { useCallback, useState } from "react";
import { getMe, login as loginRequest, logout as logoutRequest, type AuthUser } from "@/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (username = "", password = "") => {
    setLoading(true);
    try {
      const response = await loginRequest(username.trim(), password);
      setUser(response.user);
      return { ok: true as const, user: response.user };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Giris yapilirken bir hata olustu.";
      return { ok: false as const, message };
    } finally {
      setLoading(false);
    }
  }, []);

  const hydrate = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getMe();
      setUser(response.user);
      return response.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
  }, []);

  return {
    user,
    loading,
    login,
    hydrate,
    logout
  };
}
