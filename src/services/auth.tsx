import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

const AUTH_KEY = 'anpt_auth_session';
const DEFAULT_USER = 'admin';
const DEFAULT_PASS = 'Admin@ChangeMe1';

interface AuthUser {
  username: string;
  loggedInAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  changePassword: (current: string, next: string) => Promise<{ ok: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function loadSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (parsed?.username) return parsed;
  } catch {
    // ignore
  }
  return null;
}

function saveSession(user: AuthUser | null) {
  if (user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
}

// Simple local credential store (for FYP single-user desktop tool)
// In production this would use proper hashing + Tauri secure storage.
function getStoredPassword(): string {
  return localStorage.getItem('anpt_pass') || DEFAULT_PASS;
}

function setStoredPassword(pass: string) {
  localStorage.setItem('anpt_pass', pass);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadSession());

  useEffect(() => {
    // Keep session in sync if another tab clears it
    const onStorage = (e: StorageEvent) => {
      if (e.key === AUTH_KEY) {
        setUser(loadSession());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = async (username: string, password: string) => {
    const u = username.trim().toLowerCase();
    if (u !== DEFAULT_USER) {
      return { ok: false, error: 'Invalid username or password' };
    }
    if (password !== getStoredPassword()) {
      return { ok: false, error: 'Invalid username or password' };
    }

    const session: AuthUser = {
      username: DEFAULT_USER,
      loggedInAt: new Date().toISOString(),
    };
    saveSession(session);
    setUser(session);
    return { ok: true };
  };

  const logout = () => {
    saveSession(null);
    setUser(null);
  };

  const changePassword = async (current: string, next: string) => {
    if (current !== getStoredPassword()) {
      return { ok: false, error: 'Current password is incorrect' };
    }
    if (next.length < 8) {
      return { ok: false, error: 'New password must be at least 8 characters' };
    }
    setStoredPassword(next);
    return { ok: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
