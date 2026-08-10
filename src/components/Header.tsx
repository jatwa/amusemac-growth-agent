import React from 'react';
import { Film, Search, Sheet, Sparkles, ShieldCheck, User, Zap, BookOpen } from 'lucide-react';
import { Lead, ClientProfile } from '../types/lead';
import { Organization, UserRole, OrgUsage, SubscriptionPlan } from '../types/saas';
import { SUBSCRIPTION_PLANS } from '../data/plansCatalog';
import { applyTheme, getStoredThemePreference } from '../services/themeService';

interface HeaderProps {
  leads: Lead[];
  onNavigate: (tab: string) => void;
  sheetsSynced: boolean;
  webhookUrl: string;
  activeProfile: ClientProfile;
  activeOrg: Organization;
  organizations: Organization[];
  onSelectOrg: (org: Organization) => void;
  currentUserRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  orgUsage: OrgUsage;
  onOpenOnboarding: () => void;
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  leads,
  onNavigate,
  sheetsSynced,
  webhookUrl,
  activeProfile,
  activeOrg,
  organizations,
  onSelectOrg,
  currentUserRole,
  onSelectRole,
  orgUsage,
  onOpenOnboarding,
  userName = 'User',
  userEmail = 'user@domain.com',
  onLogout
}) => {
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const currentPlan: SubscriptionPlan = SUBSCRIPTION_PLANS[activeOrg.planId] || SUBSCRIPTION_PLANS.LITE;
  const leadsUsed = orgUsage.leadsDiscovered;
  const leadsLimit = currentPlan.monthlyLeadsLimit;
  const usagePct = Math.min(100, Math.round((leadsUsed / leadsLimit) * 100));

  return (
    <header className="h-20 bg-[#12141d]/90 backdrop-blur-md border-b border-[#262a3d] px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Organization Workspace Switcher */}
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#f5b82e] to-[#d49b19] p-0.5 shadow-lg shadow-[#f5b82e]/20 flex items-center justify-center">
          <div className="w-full h-full bg-[#0c0d12] rounded-[10px] flex items-center justify-center">
            <Film className="w-6 h-6 text-[#f5b82e]" />
          </div>
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold font-display tracking-tight text-white">
              AMUSEMAC <span className="text-gold-gradient">GROWTH AGENT</span>
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#f5b82e]/10 text-[#f5b82e] border border-[#f5b82e]/30 rounded-full">
              SaaS PLATFORM
            </span>
          </div>

          <div className="flex items-center space-x-2 mt-0.5">
            {/* Organization Workspace Select - ONLY FOR SUPER ADMIN */}
            {currentUserRole === 'SUPER_ADMIN' ? (
              <select
                value={activeOrg.orgId}
                onChange={(e) => {
                  const found = organizations.find(o => o.orgId === e.target.value);
                  if (found) onSelectOrg(found);
                }}
                className="bg-[#181a28] border border-[#2b3046] text-[#f5b82e] font-bold text-xs rounded-lg px-2.5 py-0.5 outline-none focus:border-[#f5b82e]"
              >
                {organizations.map(org => (
                  <option key={org.orgId} value={org.orgId}>🏢 {org.companyName} ({org.planId} PLAN)</option>
                ))}
              </select>
            ) : (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-[#181a28] text-[#f5b82e] border border-[#2b3046] rounded-lg">
                🏢 {activeOrg.companyName} ({activeOrg.planId} PLAN)
              </span>
            )}

            {/* Role Select */}
            {currentUserRole === 'SUPER_ADMIN' ? (
              <select
                value={currentUserRole}
                onChange={(e) => onSelectRole(e.target.value as UserRole)}
                className="bg-[#181a28] border border-[#2b3046] text-slate-300 font-semibold text-xs rounded-lg px-2 py-0.5 outline-none"
              >
                <option value="SUPER_ADMIN">👑 SUPER_ADMIN</option>
                <option value="ADMIN">💼 ADMIN</option>
                <option value="MANAGER">📈 MANAGER</option>
                <option value="SALES_USER">🎯 SALES_USER</option>
                <option value="VIEWER">👁️ VIEWER</option>
              </select>
            ) : (
              <span className="px-2 py-0.5 text-xs font-semibold bg-[#181a28] text-slate-300 border border-[#2b3046] rounded-lg">
                {currentUserRole}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Center Usage Meter Bar */}
      <div className="hidden lg:flex items-center space-x-5">
        <div className="bg-[#191c2b] border border-[#272b40] p-2.5 rounded-xl text-xs space-y-1.5 w-60">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
            <span>MONTHLY USAGE ({currentPlan.name})</span>
            <span className="font-mono text-[#f5b82e]">{leadsUsed} / {leadsLimit} Leads</span>
          </div>
          <div className="w-full bg-[#10121d] h-2 rounded-full overflow-hidden border border-[#23273e]">
            <div
              className={`h-full transition-all duration-300 ${
                usagePct > 90 ? 'bg-rose-500' : usagePct > 75 ? 'bg-amber-500' : 'bg-emerald-400'
              }`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
        </div>

        <button
          onClick={onOpenOnboarding}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1e2235] text-[#f5b82e] hover:bg-[#282d46] border border-[#f5b82e]/30 flex items-center space-x-1.5"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>ICP Wizard</span>
        </button>

        <button
          onClick={() => onNavigate('hunter')}
          className="btn-gold px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2"
        >
          <Search className="w-4 h-4" />
          <span>FIND NEW LEADS</span>
        </button>
      </div>

      {/* Right Navigation & User Menu Controls */}
      <div className="flex items-center space-x-3">
        {currentUserRole === 'SUPER_ADMIN' && (
          <button
            onClick={() => onNavigate('admin')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Super Admin</span>
          </button>
        )}

        <button
          onClick={() => {
            const current = getStoredThemePreference();
            const next = current === 'system' ? 'light' : current === 'light' ? 'dark' : 'system';
            applyTheme(next);
          }}
          className="p-2 rounded-xl bg-[#1e2235] text-slate-300 hover:text-white border border-[#2c324e] text-xs font-bold"
          title="Toggle Theme (System / Light / Dark)"
        >
          ☯️ Theme
        </button>

        <button
          onClick={() => onNavigate('settings')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
            webhookUrl
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
          }`}
          title={webhookUrl ? 'Google Sheets Connected' : 'Connect Google Sheets'}
        >
          <Sheet className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {webhookUrl ? 'Sheets Connected' : 'Connect Sheets'}
          </span>
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-1.5 rounded-xl bg-[#1c2030] text-slate-300 hover:text-white border border-[#2c3147] transition-all"
          >
            <div className="w-7 h-7 rounded-lg bg-[#f5b82e]/20 text-[#f5b82e] flex items-center justify-center font-bold text-xs">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden md:inline text-xs font-semibold max-w-[100px] truncate">{userName}</span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[#141624] border border-[#2b3046] rounded-2xl p-3 shadow-2xl space-y-2 z-50 text-xs text-slate-200">
              <div className="pb-2 border-b border-[#23273d]">
                <p className="font-bold text-white truncate">{userName}</p>
                <p className="text-[11px] text-slate-400 truncate">{userEmail}</p>
                <span className="mt-1 inline-block px-2 py-0.5 text-[10px] font-bold bg-[#f5b82e]/10 text-[#f5b82e] border border-[#f5b82e]/30 rounded-full">
                  {currentUserRole}
                </span>
              </div>

              <button
                onClick={() => { setShowUserMenu(false); onNavigate('settings'); }}
                className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-[#1f2338] text-slate-300 hover:text-white"
              >
                ⚙️ My Account & Settings
              </button>

              <button
                onClick={() => { setShowUserMenu(false); onLogout?.(); }}
                className="w-full text-left px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-bold"
              >
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
