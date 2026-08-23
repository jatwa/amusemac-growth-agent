import React, { useState } from 'react';
import { Search, Database, GitPullRequest, Inbox, Send, Calendar, Clock, UserCheck, LogOut, Menu, X, ShieldCheck, Zap, History } from 'lucide-react';
import { AuthSession } from '../services/authService';
import { Lead, SalesStatus } from '../types/lead';
import { DEFAULT_CUSTOMER_PROFILE } from '../services/tenantStore';
import { SearchHomeView } from './SearchHomeView';
import { LeadsDatabaseView } from './LeadsDatabaseView';
import { PipelineView } from './PipelineView';
import { EmailInboxView } from './EmailInboxView';
import { OutreachView } from './OutreachView';
import { FollowUpsView } from './FollowUpsView';
import { SearchHistoryView } from './SearchHistoryView';

interface TeamMemberShellProps {
  authSession: AuthSession;
  onLogout: () => void;
  leads: Lead[];
  onAddLeads: (leads: Lead[]) => void;
  onUpdateLeadStatus: (leadId: string, status: SalesStatus) => void;
  onUpdateLeadDetails: (leadId: string, updates: Partial<Lead>) => void;
  onTrackUsage: (actionType: any, count?: number) => void;
}

export const TeamMemberShell: React.FC<TeamMemberShellProps> = ({
  authSession,
  onLogout,
  leads,
  onAddLeads,
  onUpdateLeadStatus,
  onUpdateLeadDetails,
  onTrackUsage
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'leads' | 'pipeline' | 'inbox' | 'outreach' | 'followups' | 'history'>('search');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(leads[0] || null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dedicated Operational Navigation for Team Members ONLY (Zero Admin/Billing/Pricing links)
  const navItems = [
    { id: 'search', label: 'Search', icon: Search },
    { id: 'history', label: 'Search History', icon: History },
    { id: 'leads', label: 'Leads Database', icon: Database },
    { id: 'pipeline', label: 'Sales Pipeline', icon: GitPullRequest },
    { id: 'inbox', label: 'Email & Threads', icon: Inbox },
    { id: 'outreach', label: 'Outreach', icon: Send },
    { id: 'followups', label: 'Follow-ups', icon: Calendar }
  ];

  return (
    <div className="min-h-screen bg-[#0b0c15] text-white flex flex-col font-sans">
      {/* Team Member Top Header */}
      <header className="sticky top-0 z-40 bg-[#10121f]/95 backdrop-blur-md border-b border-[#21263d] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold flex items-center justify-center text-sm shadow-md">
            AG
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-white font-display">Amusemac Growth Operations</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                TEAM MEMBER WORKSPACE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Welcome, <strong className="text-white">{authSession.user.name}</strong> ({authSession.user.email})
            </p>
          </div>
        </div>

        {/* Desktop Team Navigation */}
        <nav className="hidden lg:flex items-center space-x-1.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-md shadow-emerald-500/10'
                    : 'text-slate-300 hover:text-white hover:bg-[#181c30]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout (NO ADMIN BUTTON, NO PRICING, NO BILLING) */}
        <div className="hidden sm:flex items-center space-x-3">
          <div className="text-right">
            <span className="text-[11px] font-bold text-emerald-400 block">GROWTH PRO (Entitlement)</span>
            <span className="text-[10px] text-slate-400 block">{authSession.organization.companyName || authSession.organization.orgId}</span>
          </div>
          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-[#171a2b] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-[#272c48] transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl bg-[#181c30] text-slate-300 border border-[#272e4d]"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Team Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#121524] border-b border-[#242944] p-4 space-y-2 animate-fadeIn z-30">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-4 py-3 rounded-xl text-xs font-semibold flex items-center space-x-3 ${
                  isActive ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-[#1a1e35]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={onLogout}
            className="w-full px-4 py-3 rounded-xl text-xs font-semibold flex items-center space-x-3 text-rose-400 hover:bg-rose-500/10"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* Main Operational View */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        {activeTab === 'search' && (
          <SearchHomeView
            existingLeads={leads}
            onAddLeads={onAddLeads}
            onNavigate={(tab) => setActiveTab(tab as any)}
            webhookUrl=""
            activeProfile={DEFAULT_CUSTOMER_PROFILE}
            activePlanId="PRO"
            onOpenIntelligenceReport={() => {}}
            onCheckAllowance={() => ({ allowed: true })}
            onTrackUsage={onTrackUsage}
            onShowLimitModal={() => {}}
          />
        )}

        {activeTab === 'leads' && (
          <LeadsDatabaseView
            leads={leads}
            onSelectLead={setSelectedLead}
            onUpdateLeadStatus={onUpdateLeadStatus}
            onNavigate={(tab) => setActiveTab(tab as any)}
            webhookUrl=""
          />
        )}

        {activeTab === 'pipeline' && (
          <PipelineView
            leads={leads}
            onUpdateLeadStatus={onUpdateLeadStatus}
            onUpdateLeadDetails={onUpdateLeadDetails}
            onSelectLead={setSelectedLead}
            onNavigate={(tab) => setActiveTab(tab as any)}
          />
        )}

        {activeTab === 'inbox' && (
          <EmailInboxView
            leads={leads}
            onSelectLead={setSelectedLead}
            onUpdateLeadStatus={onUpdateLeadStatus}
            onUpdateLeadDetails={onUpdateLeadDetails}
            activeOrg={authSession.organization}
          />
        )}

        {activeTab === 'outreach' && (
          <OutreachView
            leads={leads}
            selectedLead={selectedLead}
            onSelectLead={setSelectedLead}
            onUpdateLeadStatus={onUpdateLeadStatus}
            onUpdateLeadDetails={onUpdateLeadDetails}
            activeOrg={authSession.organization}
          />
        )}

        {activeTab === 'history' && (
          <SearchHistoryView
            activeOrg={authSession.organization}
            onRepeatSearch={(query, location) => {
              setActiveTab('search');
            }}
          />
        )}

        {activeTab === 'followups' && (
          <FollowUpsView
            leads={leads}
            onSelectLead={setSelectedLead}
            onNavigate={(tab) => setActiveTab(tab as any)}
            onUpdateLeadStatus={onUpdateLeadStatus}
            onUpdateLeadDetails={onUpdateLeadDetails}
          />
        )}
      </main>
    </div>
  );
};
