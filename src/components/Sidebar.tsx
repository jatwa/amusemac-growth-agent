import React from 'react';
import {
  LayoutDashboard,
  Search,
  Database,
  KanbanSquare,
  Send,
  CalendarCheck,
  BarChart3,
  ThumbsUp,
  Settings,
  Mail,
  ShieldCheck,
  History
} from 'lucide-react';
import { UserAccount, Organization } from '../types/saas';
import { canAccessAdminPanel } from '../services/entitlementService';

interface SidebarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  dueFollowUpsCount: number;
  user?: UserAccount | null;
  org?: Organization;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onNavigate,
  dueFollowUpsCount,
  user,
  org
}) => {
  const isAdminAuthorized = canAccessAdminPanel(user || null, org);

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

  // Filter navigation items: Super Admin item shown ONLY to SUPER_ADMIN users
  const visibleNavItems = allNavItems.filter(item => !item.requiresAdmin || isAdminAuthorized);

  return (
    <aside className="w-64 bg-[#10121a] border-r border-[#202436] flex flex-col justify-between py-6 min-h-[calc(100vh-5rem)]">
      <div className="space-y-1 px-3">
        <div className="px-4 py-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
          Growth Navigation
        </div>

        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#f5b82e]/20 to-[#f5b82e]/5 text-[#f5b82e] border-l-4 border-[#f5b82e] shadow-lg shadow-[#f5b82e]/5 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#181b29]'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#f5b82e]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#f5b82e]/20 text-[#f5b82e] rounded-full">
                  {item.badge}
                </span>
              )}

              {item.count !== undefined && item.count > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full animate-pulse">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Brand Credit */}
      <div className="px-6 pt-4 border-t border-[#1e2235]">
        <div className="p-3.5 rounded-xl bg-[#161824] border border-[#272b3f] text-center">
          <p className="text-xs font-semibold text-slate-300">AMUSEMAC STUDIO</p>
          <p className="text-[11px] text-[#f5b82e] font-bold mt-0.5 tracking-wider">MAD ABOUT CINEMA</p>
        </div>
      </div>
    </aside>
  );
};
