"use client";

import * as React from "react";
import { onAuthStateChanged, signInWithCustomToken, signOut } from "firebase/auth";
import { clientAuth, firebaseClientConfigured } from "@/lib/firebase/client";
import type { UserRole } from "@/types/session";

interface AuthState {
  role: UserRole | null;
  uid: string | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  firebaseConfigured: boolean;
  login: (passkey: string) => Promise<{ role: UserRole }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({
    role: null,
    uid: null,
    loading: true,
  });

  const refresh = React.useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const data = (await res.json()) as { role: UserRole | null };
      setState((s) => ({ ...s, role: data.role }));
    } catch {
      // Network hiccup — keep the last known role rather than bouncing the user.
    }
  }, []);

  React.useEffect(() => {
    refresh().finally(() => setState((s) => ({ ...s, loading: false })));
  }, [refresh]);

  React.useEffect(() => {
    if (!firebaseClientConfigured || !clientAuth) return;
    const unsubscribe = onAuthStateChanged(clientAuth, (user) => {
      setState((s) => ({ ...s, uid: user?.uid ?? null }));
    });
    return unsubscribe;
  }, []);

  const login = React.useCallback(async (passkey: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passkey }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error ?? "That access key isn't recognized.");
    }
    if (firebaseClientConfigured && clientAuth && data.customToken) {
      try {
        await signInWithCustomToken(clientAuth, data.customToken);
      } catch (error) {
        console.error("Firebase sign-in failed:", error);
      }
    }
    setState((s) => ({ ...s, role: data.role as UserRole }));
    return { role: data.role as UserRole };
  }, []);

  const logout = React.useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    if (firebaseClientConfigured && clientAuth) {
      try {
        await signOut(clientAuth);
      } catch {
        // ignore — cookie is already cleared server-side
      }
    }
    setState((s) => ({ ...s, role: null, uid: null }));
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({ ...state, firebaseConfigured: firebaseClientConfigured, login, logout, refresh }),
    [state, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
