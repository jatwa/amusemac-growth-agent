import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, Zap } from 'lucide-react';
import { AuthSession } from '../services/authService';

interface AdminLoginViewProps {
  onLoginSuccess: (session: AuthSession) => void;
  onNavigateToTeamLogin: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  onLoginSuccess,
  onNavigateToTeamLogin
}) => {
  const [email, setEmail] = useState('admin@amusemacstudio.in');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      const exp = Date.now() + 86400000;
      const adminSession: AuthSession = {
        user: {
          userId: 'usr-admin-primary',
          orgId: 'amusemac-studio',
          name: 'Amusemac Workspace Admin',
          fullName: 'Amusemac Workspace Admin',
          email,
          whatsappNumber: '',
          emailVerified: true,
          whatsappVerified: false,
          role: 'ADMIN',
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        },
        organization: {
          orgId: 'amusemac-studio',
          companyName: 'Amusemac Studio Workspace',
          tagline: 'Growth Engine',
          website: 'https://amusemacstudio.in',
          status: 'ACTIVE',
          planId: 'PRO',
          adminEmail: email,
          adminName: 'Amusemac Workspace Admin',
          emailConfig: { provider: 'ZOHO', email: 'hello@amusemacstudio.in', status: 'CONNECTED' },
          sheetsWebhookUrl: '',
          createdAt: new Date().toISOString(),
          renewalDate: new Date(Date.now() + 30 * 86400000).toISOString()
        },
        token: `amu_sess_${btoa(JSON.stringify({ userId: 'usr-admin-primary', orgId: 'amusemac-studio', role: 'ADMIN', email, exp }))}`,
        expiresAt: new Date(exp).toISOString()
      };

      setIsLoading(false);
      onLoginSuccess(adminSession);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#0b0c15] text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#f5b82e]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#1e2338] border border-[#2d3659] text-xs font-semibold text-[#f5b82e]">
            <ShieldCheck className="w-4 h-4" />
            <span>WORKSPACE ADMIN LOGIN</span>
          </div>
          <h1 className="text-2xl font-bold font-display text-white">Amusemac Workspace Portal</h1>
          <p className="text-xs text-slate-400">
            Sign in as Company Admin to manage growth operations, subscription & team workspace.
          </p>
        </div>

        <form onSubmit={handleAdminSubmit} className="glass-card p-6 sm:p-8 rounded-3xl border border-[#262b48] space-y-4 shadow-2xl">
          <div>
            <label className="text-slate-300 block text-xs font-semibold mb-1">Admin Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#121422] border border-[#2a2f4c] text-white text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#f5b82e]"
              placeholder="admin@company.com"
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
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-gold py-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-[#f5b82e]/20"
          >
            <Lock className="w-4 h-4" />
            <span>{isLoading ? 'Authenticating Admin...' : 'Sign In to Admin Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onNavigateToTeamLogin}
            className="text-xs text-slate-400 hover:text-white underline font-medium transition-colors"
          >
            Are you a Team Member? Switch to Team Member Login →
          </button>
        </div>
      </div>
    </div>
  );
};
