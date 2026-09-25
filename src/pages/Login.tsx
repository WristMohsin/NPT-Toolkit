import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../services/auth';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Already logged in → go to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);
    setLoading(false);

    if (result.ok) {
      navigate('/', { replace: true });
    } else {
      setError(result.error || 'Login failed');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-signal-accent/20 border border-signal-accent/40 mb-4">
            <ShieldAlert size={28} className="text-signal-accent" />
          </div>
          <h1 className="text-2xl font-semibold text-ink-100">ANPT Toolkit</h1>
          <p className="text-sm text-ink-400 mt-1">Authorized Network Security Assessment</p>
        </div>

        {/* Login Card */}
        <div className="bg-ink-900 border border-ink-800 rounded-lg p-6 shadow-xl">
          <h2 className="text-lg font-medium text-ink-100 mb-1">Sign in</h2>
          <p className="text-xs text-ink-400 mb-6">Only authorized analysts may access this tool.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-ink-300 mb-1.5">Username</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-ink-950 border border-ink-700 rounded-md pl-9 pr-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-signal-accent"
                  placeholder="admin"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-ink-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-ink-950 border border-ink-700 rounded-md pl-9 pr-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-signal-accent"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-signal-accent hover:bg-signal-accent/90 disabled:opacity-60 text-ink-950 font-medium text-sm py-2.5 rounded-md transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-ink-800 text-center">
            <p className="text-[11px] text-ink-500">
              Default: <span className="font-mono text-ink-400">admin</span> /{' '}
              <span className="font-mono text-ink-400">Admin@ChangeMe1</span>
            </p>
            <p className="text-[11px] text-ink-500 mt-1">Change password after first login (Settings)</p>
          </div>
        </div>

        <p className="text-center text-[11px] text-ink-600 mt-6">
          This tool is for authorized security assessments only.
        </p>
      </div>
    </div>
  );
}
