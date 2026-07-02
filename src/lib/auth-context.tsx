"use client";
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { PublicUser } from "./models/user";
import { getSession } from "./auth.functions";

interface AuthContextValue {
  user: PublicUser | null;
  loading: boolean;
  isEditor: boolean;
  isSuperAdmin: boolean;
  setUser: (u: PublicUser | null) => void;
  refresh: () => Promise<void>;
}

const AuthCtx = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isEditor: false,
  isSuperAdmin: false,
  setUser: () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const u = await getSession();
      setUser(u as any);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const isEditor = user?.role === "editor" || user?.role === "super_admin";
  const isSuperAdmin = user?.role === "super_admin";

  return (
    <AuthCtx.Provider value={{ user, loading, isEditor, isSuperAdmin, setUser, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}

export { AuthCtx };
export type { AuthContextValue };
