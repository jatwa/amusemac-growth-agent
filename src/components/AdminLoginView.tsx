import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { AuthSession, loginAdminServer } from '../services/authService';

interface AdminLoginViewProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  onLoginSuccess
}) => {
  const [email, setEmail] = useState('admin@amusemacstudio.in');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const session = await loginAdminServer(email, password);
      setIsLoading(false);
      onLoginSuccess(session);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Invalid admin credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c15] text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#f5b82e]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#1e2338] border border-[#2d3659] text-xs font-semibold text-[#f5b82e]">
            <ShieldCheck className="w-4 h-4" />
            <span>ADMIN LOGIN</span>
          </div>
          <h1 className="text-2xl font-bold font-display text-white">AMUSEMAC GROWTH AGENT</h1>
          <p className="text-xs text-slate-400">
            Sign in as Company Admin to manage growth operations & buyer demand discovery.
          </p>
        </div>

        <form onSubmit={handleAdminSubmit} className="glass-card p-6 sm:p-8 rounded-3xl border border-[#262b48] space-y-4 shadow-2xl">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="text-slate-300 block text-xs font-semibold mb-1">Work Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#121422] border border-[#2a2f4c] text-white text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#f5b82e]"
              placeholder="admin@amusemacstudio.in"
            />
          </div>

          <div>
            <label className="text-slate-300 block text-xs font-semibold mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#121422] border border-[#2a2f4c] text-white text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#f5b82e]"
              placeholder="Enter admin password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-gold py-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-[#f5b82e]/20"
          >
            <Lock className="w-4 h-4" />
            <span>{isLoading ? 'Authenticating Admin...' : 'SIGN IN'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
