import React, { useState } from 'react';
import { Users, Lock, ArrowRight, Zap } from 'lucide-react';
import { AuthSession } from '../services/authService';

interface TeamLoginViewProps {
  onLoginSuccess: (session: AuthSession) => void;
  onNavigateToAdminLogin: () => void;
}

export const TeamLoginView: React.FC<TeamLoginViewProps> = ({
  onLoginSuccess,
  onNavigateToAdminLogin
}) => {
  const [email, setEmail] = useState('govind@example.com');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);

  const handleTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      const exp = Date.now() + 86400000;
      const teamSession: AuthSession = {
        user: {
          userId: 'usr-govind-001',
          orgId: 'amusemac-studio',
          name: 'Govind',
          fullName: 'Govind',
          email,
          whatsappNumber: '',
          emailVerified: true,
          whatsappVerified: false,
          role: 'TEAM_MEMBER',
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
          adminName: 'Govind',
          emailConfig: { provider: 'ZOHO', email: 'hello@amusemacstudio.in', status: 'CONNECTED' },
          sheetsWebhookUrl: '',
          createdAt: new Date().toISOString(),
          renewalDate: new Date(Date.now() + 30 * 86400000).toISOString()
        },
        token: `amu_sess_${btoa(JSON.stringify({ userId: 'usr-govind-001', orgId: 'amusemac-studio', role: 'TEAM_MEMBER', email, exp }))}`,
        expiresAt: new Date(exp).toISOString()
      };

      setIsLoading(false);
      onLoginSuccess(teamSession);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#0b0c15] text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#17262a] border border-[#213b3e] text-xs font-semibold text-emerald-400">
            <Users className="w-4 h-4" />
            <span>TEAM MEMBER LOGIN</span>
          </div>
          <h1 className="text-2xl font-bold font-display text-white">Team Operations Portal</h1>
          <p className="text-xs text-slate-400">
            Sign in as Team Member to run search, qualify buyers, and manage outreach pipelines.
          </p>
        </div>

        <form onSubmit={handleTeamSubmit} className="glass-card p-6 sm:p-8 rounded-3xl border border-[#233538] space-y-4 shadow-2xl">
          <div>
            <label className="text-slate-300 block text-xs font-semibold mb-1">Work Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#11191c] border border-[#243b3f] text-white text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-400"
              placeholder="govind@company.com"
            />
          </div>

          <div>
            <label className="text-slate-300 block text-xs font-semibold mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#11191c] border border-[#243b3f] text-white text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-400"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all"
          >
            <Lock className="w-4 h-4" />
            <span>{isLoading ? 'Authenticating Team Member...' : 'Sign In to Team Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onNavigateToAdminLogin}
            className="text-xs text-slate-400 hover:text-white underline font-medium transition-colors"
          >
            Workspace Administrator? Switch to Admin Login →
          </button>
        </div>
      </div>
    </div>
  );
};
