import React, { useState } from 'react';
import {
  Film,
  Search,
  Sheet,
  ShieldCheck,
  BookOpen,
  Menu,
  X,
  Database,
  KanbanSquare,
  Mail,
  Send,
  CalendarCheck,
  LayoutDashboard,
  History,
  Settings
} from 'lucide-react';
import { Lead, ClientProfile } from '../types/lead';
import { Organization, UserRole, OrgUsage } from '../types/saas';
import { applyTheme, getStoredThemePreference } from '../services/themeService';
import { canAccessAdminPanel } from '../services/entitlementService';

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
  activeTab?: string;
  dueFollowUpsCount?: number;
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
  onLogout,
  activeTab = 'search',
  dueFollowUpsCount = 0
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const isAdminAuthorized = canAccessAdminPanel({ role: currentUserRole } as any, activeOrg);

  const allNavItems = [
    { id: 'search', label: 'Search', icon: Search, badge: 'Intelligence' },
    { id: 'leads', label: 'Leads Database', icon: Database },
    { id: 'pipeline', label: 'Sales Pipeline', icon: KanbanSquare },
    { id: 'inbox', label: 'Email & Threads', icon: Mail, badge: 'Zoho Mail' },
    { id: 'outreach', label: 'Outreach & Approvals', icon: Send },
    { id: 'followups', label: 'Follow-ups', icon: CalendarCheck, count: dueFollowUpsCount },
    { id: 'analytics', label: 'Dashboard & Analytics', icon: LayoutDashboard },
    { id: 'history', label: 'Search History', icon: History },
    { id: 'admin', label: 'Super Admin', icon: ShieldCheck, badge: 'Multi-Tenant', requiresAdmin: true },
    { id: 'settings', label: 'Connected Accounts', icon: Settings }
  ];

  const visibleNavItems = allNavItems.filter(item => !item.requiresAdmin || isAdminAuthorized);

  const handleMobileNav = (tabId: string) => {
    onNavigate(tabId);
    setIsMobileDrawerOpen(false);
  };

  return (
    <>
      <header className="h-16 sm:h-20 bg-[#12141d]/90 backdrop-blur-md border-b border-[#262a3d] px-3 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        {/* Left: Mobile Hamburger + Brand Logo */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="p-2 rounded-xl bg-[#1c2030] text-slate-300 hover:text-white border border-[#2c3147] lg:hidden"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-[#f5b82e] to-[#d49b19] p-0.5 shadow-lg shadow-[#f5b82e]/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#0c0d12] rounded-[10px] flex items-center justify-center">
              <Film className="w-4 h-4 sm:w-6 sm:h-6 text-[#f5b82e]" />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <h1 className="text-sm sm:text-xl font-bold font-display tracking-tight text-white truncate">
                AMUSEMAC <span className="text-gold-gradient hidden xs:inline">GROWTH AGENT</span>
              </h1>
              <span className="hidden sm:inline px-2 py-0.5 text-[10px] font-semibold bg-[#f5b82e]/10 text-[#f5b82e] border border-[#f5b82e]/30 rounded-full shrink-0">
                ADMIN APP
              </span>
            </div>

            <div className="hidden sm:flex items-center space-x-2 mt-0.5">
              {currentUserRole === 'SUPER_ADMIN' ? (
                <select
                  value={activeOrg.orgId}
                  onChange={(e) => {
                    const found = organizations.find(o => o.orgId === e.target.value);
                    if (found) onSelectOrg(found);
                  }}
                  className="bg-[#181a28] border border-[#2b3046] text-[#f5b82e] font-bold text-xs rounded-lg px-2 py-0.5 outline-none focus:border-[#f5b82e]"
                >
                  {organizations.map(org => (
                    <option key={org.orgId} value={org.orgId}>🏢 {org.companyName}</option>
                  ))}
                </select>
              ) : (
                <span className="px-2 py-0.5 text-xs font-bold bg-[#181a28] text-[#f5b82e] border border-[#2b3046] rounded-lg">
                  🏢 {activeOrg.companyName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Desktop Actions */}
        <div className="hidden lg:flex items-center space-x-4">
          <button
            onClick={onOpenOnboarding}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1e2235] text-[#f5b82e] hover:bg-[#282d46] border border-[#f5b82e]/30 flex items-center space-x-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>ICP Profile</span>
          </button>

          <button
            onClick={() => onNavigate('search')}
            className="btn-gold px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md"
          >
            <Search className="w-4 h-4" />
            <span>FIND BUYER LEADS</span>
          </button>
        </div>

        {/* Right Navigation Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {currentUserRole === 'SUPER_ADMIN' && (
            <button
              onClick={() => onNavigate('admin')}
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20"
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
            className="p-2 rounded-xl bg-[#1e2235] text-slate-300 hover:text-white border border-[#2c324e] text-xs font-bold shrink-0"
            title="Toggle Theme"
          >
            ☯️ <span className="hidden sm:inline ml-1">Theme</span>
          </button>

          <button
            onClick={() => onNavigate('settings')}
            className={`hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
              webhookUrl
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
            }`}
            title={webhookUrl ? 'Google Sheets Connected' : 'Connect Google Sheets'}
          >
            <Sheet className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {webhookUrl ? 'Sheets Connected' : 'Connect Sheets'}
            </span>
          </button>

          {/* User Profile Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-1.5 p-1.5 rounded-xl bg-[#1c2030] text-slate-300 hover:text-white border border-[#2c3147] transition-all"
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
                  ⚙️ Connected Accounts
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

      {/* MOBILE SLIDE-OUT NAVIGATION DRAWER */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fadeIn"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-[#10121a] border-r border-[#202436] h-full flex flex-col justify-between p-4 z-10 animate-slideRight overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#202436]">
                <div className="flex items-center space-x-2">
                  <Film className="w-5 h-5 text-[#f5b82e]" />
                  <span className="font-bold text-sm text-white font-display">AMUSEMAC AGENT</span>
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-[#181b29] text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Organization Switcher inside Drawer */}
              <div className="p-3 rounded-xl bg-[#161824] border border-[#262a3f] space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Workspace</span>
                <span className="text-xs font-bold text-[#f5b82e] block truncate">🏢 {activeOrg.companyName}</span>
              </div>

              <div className="space-y-1">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMobileNav(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-[#f5b82e]/20 to-[#f5b82e]/5 text-[#f5b82e] border-l-4 border-[#f5b82e] font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-[#181b29]'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#f5b82e]' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className="px-2 py-0.5 text-[9px] font-semibold bg-[#f5b82e]/20 text-[#f5b82e] rounded-full">
                          {item.badge}
                        </span>
                      )}

                      {item.count !== undefined && item.count > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full">
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-[#1e2235] space-y-3">
              <button
                onClick={() => { setIsMobileDrawerOpen(false); onOpenOnboarding(); }}
                className="w-full px-3 py-2.5 rounded-xl text-xs font-bold bg-[#1e2235] text-[#f5b82e] border border-[#f5b82e]/30 flex items-center justify-center space-x-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>ICP Profile</span>
              </button>

              <div className="p-3 rounded-xl bg-[#161824] border border-[#272b3f] text-center">
                <p className="text-xs font-semibold text-slate-300">AMUSEMAC STUDIO</p>
                <p className="text-[10px] text-[#f5b82e] font-bold mt-0.5 tracking-wider">MAD ABOUT CINEMA</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
