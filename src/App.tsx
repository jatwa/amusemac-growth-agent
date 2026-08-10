import React, { useState, useEffect } from 'react';
import { Lead, SalesStatus, FeedbackRating, UserFeedbackLog, ClientProfile } from './types/lead';
import { Organization, UserRole, OrgUsage, UsageCheckResult } from './types/saas';
import { INITIAL_LEADS } from './data/seedLeads';
import { INITIAL_ORGANIZATIONS } from './data/plansCatalog';
import { AMUSEMAC_CLIENT_PROFILE, SECONDARY_CLIENT_PROFILE } from './data/clientProfiles';
import {
  getOrgLeads,
  saveOrgLeads,
  getOrgClientProfile,
  saveOrgClientProfile,
  DEFAULT_CUSTOMER_PROFILE,
  loadOrganizationsList,
  saveOrganizationsList
} from './services/tenantStore';
import { getOrgUsage, trackOrgUsage, checkPlanAllowance } from './services/usageMetering';
import { getCurrentSession, logoutUser, AuthSession } from './services/authService';
import { canAccessAdminPanel } from './services/entitlementService';

import { PublicMarketingView } from './components/PublicMarketingView';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { SearchHomeView } from './components/SearchHomeView';
import { DashboardView } from './components/DashboardView';
import { LeadHunterView } from './components/LeadHunterView';
import { SearchHistoryView } from './components/SearchHistoryView';
import { LeadsDatabaseView } from './components/LeadsDatabaseView';
import { PipelineView } from './components/PipelineView';
import { EmailInboxView } from './components/EmailInboxView';
import { OutreachView } from './components/OutreachView';
import { FollowUpsView } from './components/FollowUpsView';
import { AnalyticsView } from './components/AnalyticsView';
import { FeedbackView } from './components/FeedbackView';
import { SettingsView } from './components/SettingsView';
import { SuperAdminView } from './components/SuperAdminView';
import { LeadIntelligenceModal } from './components/LeadIntelligenceModal';
import { OnboardingWizardModal } from './components/OnboardingWizardModal';
import { PlanLimitModal } from './components/PlanLimitModal';
import { AuthModal } from './components/AuthModal';
import { initThemeListener } from './services/themeService';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('search');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Initialize System Theme Listener
  useEffect(() => {
    const cleanup = initThemeListener();
    return cleanup;
  }, []);

  // Real Authentication Session State
  const [authSession, setAuthSession] = useState<AuthSession | null>(getCurrentSession);

  // SaaS Organizations & User Role State
  const [organizations, setOrganizations] = useState<Organization[]>(loadOrganizationsList);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(() => {
    return authSession ? authSession.organization : null;
  });
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(() => {
    return authSession ? authSession.user.role : null;
  });

  // Client Profile State (Isolated by Organization)
  const [activeProfile, setActiveProfile] = useState<ClientProfile>(() => {
    return activeOrg ? getOrgClientProfile(activeOrg.orgId) : DEFAULT_CUSTOMER_PROFILE;
  });

  // CRM Leads State (Isolated by Organization)
  const [leads, setLeads] = useState<Lead[]>(() => {
    if (!activeOrg) return [];
    return getOrgLeads(activeOrg.orgId, activeOrg.orgId === 'amusemac-studio' ? INITIAL_LEADS : []);
  });

  // Usage Metering State
  const [orgUsage, setOrgUsage] = useState<OrgUsage>(() => {
    if (!activeOrg) {
      return {
        orgId: '',
        billingPeriod: '',
        leadsDiscovered: 0,
        searchesRun: 0,
        enrichmentCreditsUsed: 0,
        aiResearchCount: 0,
        decisionMakersFound: 0,
        emailsSent: 0,
        whatsAppMessagesSent: 0,
        enrichmentRequests: 0,
        exportsCreated: 0,
        outreachActionsCount: 0
      };
    }
    return getOrgUsage(activeOrg.orgId);
  });

  // Selected Lead & Modal States
  const [selectedLead, setSelectedLead] = useState<Lead | null>(leads[0] || null);
  const [intelligenceReportLead, setIntelligenceReportLead] = useState<Lead | null>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [limitCheckResult, setLimitCheckResult] = useState<UsageCheckResult | null>(null);

  // Settings State
  const [webhookUrl, setWebhookUrl] = useState<string>(activeOrg?.sheetsWebhookUrl || '');
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => localStorage.getItem('amusemac_gemini_key') || '');
  const [feedbackLogs, setFeedbackLogs] = useState<UserFeedbackLog[]>([]);

  // When Authenticated Session Changes
  const handleAuthenticated = (session: AuthSession) => {
    setAuthSession(session);
    setCurrentUserRole(session.user.role);
    handleSwitchOrg(session.organization);
  };

  const handleLogout = () => {
    logoutUser();
    setAuthSession(null);
    setActiveOrg(null);
    setCurrentUserRole(null);
    setLeads([]);
  };

  // When Active Organization Changes -> Load Tenant-Isolated Data
  const handleSwitchOrg = (newOrg: Organization) => {
    setActiveOrg(newOrg);
    const tenantLeads = getOrgLeads(newOrg.orgId, newOrg.orgId === 'amusemac-studio' ? INITIAL_LEADS : []);
    const tenantProfile = getOrgClientProfile(newOrg.orgId);
    const usage = getOrgUsage(newOrg.orgId);

    setLeads(tenantLeads);
    setActiveProfile(tenantProfile);
    setOrgUsage(usage);
    setSelectedLead(tenantLeads[0] || null);
    setWebhookUrl(newOrg.sheetsWebhookUrl || '');
  };

  // Save Leads to Tenant-Isolated Storage
  useEffect(() => {
    if (activeOrg?.orgId) {
      saveOrgLeads(activeOrg.orgId, leads);
    }
  }, [leads, activeOrg?.orgId]);

  // Save Client Profile to Tenant-Isolated Storage
  useEffect(() => {
    if (activeOrg?.orgId) {
      saveOrgClientProfile(activeOrg.orgId, activeProfile);
    }
  }, [activeProfile, activeOrg?.orgId]);

  // Save Organizations List
  useEffect(() => {
    saveOrganizationsList(organizations);
  }, [organizations]);

  // Usage Metering Tracker Helper
  const handleTrackUsage = (actionType: 'leads' | 'searches' | 'ai_research' | 'decision_makers' | 'emails', count: number = 1) => {
    if (!activeOrg) return;
    const updated = trackOrgUsage(activeOrg.orgId, actionType, count);
    setOrgUsage(updated);
  };

  // Allowance Checker Helper
  const handleCheckAllowance = (actionType: 'leads' | 'searches' | 'ai_research' | 'decision_makers' | 'emails', count: number = 1) => {
    if (!activeOrg) return { allowed: false, currentUsage: 0, limit: 0, message: 'Unauthenticated' };
    return checkPlanAllowance(activeOrg, actionType, count);
  };

  // Lead Operations
  const handleAddLeads = (newLeads: Lead[]) => {
    setLeads(prev => {
      const existingIds = new Set(prev.map(l => l.leadId));
      const filtered = newLeads.filter(l => !existingIds.has(l.leadId));
      return [...filtered, ...prev];
    });
  };

  const handleUpdateLeadStatus = (leadId: string, status: SalesStatus) => {
    setLeads(prev =>
      prev.map(lead =>
        lead.leadId === leadId ? { ...lead, outreachStatus: status } : lead
      )
    );
    if (selectedLead && selectedLead.leadId === leadId) {
      setSelectedLead(prev => prev ? { ...prev, outreachStatus: status } : null);
    }
  };

  const handleUpdateLeadDetails = (leadId: string, updates: Partial<Lead>) => {
    setLeads(prev =>
      prev.map(lead =>
        lead.leadId === leadId ? { ...lead, ...updates } : lead
      )
    );
    if (selectedLead && selectedLead.leadId === leadId) {
      setSelectedLead(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleUpdateLeadFeedback = (leadId: string, rating: FeedbackRating) => {
    handleUpdateLeadDetails(leadId, { userFeedback: rating });
    const target = leads.find(l => l.leadId === leadId);
    if (target) {
      const logEntry: UserFeedbackLog = {
        id: `FB-${Date.now()}`,
        leadId,
        companyName: target.companyName,
        feedback: rating,
        timestamp: new Date().toISOString()
      };
      setFeedbackLogs(prev => [logEntry, ...prev]);
    }
  };

  const handleUpdateOrg = (orgId: string, updates: Partial<Organization>) => {
    setOrganizations(prev =>
      prev.map(o => o.orgId === orgId ? { ...o, ...updates } : o)
    );
    if (activeOrg && activeOrg.orgId === orgId) {
      setActiveOrg(prev => prev ? ({ ...prev, ...updates }) : null);
    }
  };

  const handleAddOrganization = (newOrg: Organization) => {
    setOrganizations(prev => [...prev, newOrg]);
    handleSwitchOrg(newOrg);
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const dueFollowUpsCount = leads.filter(l => l.followUpDate && l.followUpDate <= todayStr && l.outreachStatus !== 'WON' && l.outreachStatus !== 'LOST').length;

  // Unauthenticated Public Marketing View vs Auth Modal
  if (!authSession || !activeOrg || !currentUserRole) {
    return (
      <>
        <PublicMarketingView
          onLoginClick={() => setShowAuthModal(true)}
          onSignUpClick={() => setShowAuthModal(true)}
          onStartFreeSearch={() => setShowAuthModal(true)}
        />
        <AuthModal
          isOpen={showAuthModal}
          onAuthenticated={(sess) => {
            setShowAuthModal(false);
            handleAuthenticated(sess);
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#f1f5f9] flex flex-col font-sans">
      {/* Header Bar */}
      <Header
        leads={leads}
        onNavigate={setActiveTab}
        sheetsSynced={Boolean(webhookUrl)}
        webhookUrl={webhookUrl}
        activeProfile={activeProfile}
        activeOrg={activeOrg}
        organizations={organizations}
        onSelectOrg={handleSwitchOrg}
        currentUserRole={currentUserRole}
        onSelectRole={setCurrentUserRole}
        orgUsage={orgUsage}
        onOpenOnboarding={() => setShowOnboardingModal(true)}
        userName={authSession.user.name}
        userEmail={authSession.user.email}
        onLogout={handleLogout}
      />

      {/* Main Body Layout */}
      <div className="flex-1 flex max-w-[1700px] w-full mx-auto px-4 sm:px-6 py-6 gap-6">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onNavigate={setActiveTab}
          dueFollowUpsCount={dueFollowUpsCount}
          user={authSession.user}
          org={activeOrg}
        />

        {/* View Component Renderer */}
        <main className="flex-1 min-w-0">
          {(activeTab === 'search' || activeTab === 'hunter') && (
            <SearchHomeView
              existingLeads={leads}
              onAddLeads={handleAddLeads}
              onNavigate={setActiveTab}
              webhookUrl={webhookUrl}
              activeProfile={activeProfile}
              activePlanId={activeOrg.planId}
              onOpenIntelligenceReport={setIntelligenceReportLead}
              onCheckAllowance={handleCheckAllowance}
              onTrackUsage={handleTrackUsage}
              onShowLimitModal={setLimitCheckResult}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              leads={leads}
              onNavigate={setActiveTab}
              onSelectLead={setSelectedLead}
            />
          )}

          {activeTab === 'hunter' && (
            <LeadHunterView
              existingLeads={leads}
              onAddLeads={handleAddLeads}
              onNavigate={setActiveTab}
              webhookUrl={webhookUrl}
              activeProfile={activeProfile}
              onOpenIntelligenceReport={setIntelligenceReportLead}
              onCheckAllowance={handleCheckAllowance}
              onTrackUsage={handleTrackUsage}
              onShowLimitModal={setLimitCheckResult}
            />
          )}

          {activeTab === 'history' && (
            <SearchHistoryView
              activeOrg={activeOrg}
              onRepeatSearch={(q, loc) => {
                setActiveTab('hunter');
              }}
            />
          )}

          {activeTab === 'leads' && (
            <LeadsDatabaseView
              leads={leads}
              onSelectLead={setSelectedLead}
              onUpdateLeadStatus={handleUpdateLeadStatus}
              onNavigate={setActiveTab}
              webhookUrl={webhookUrl}
            />
          )}

          {activeTab === 'pipeline' && (
            <PipelineView
              leads={leads}
              onUpdateLeadStatus={handleUpdateLeadStatus}
              onUpdateLeadDetails={handleUpdateLeadDetails}
              onSelectLead={setSelectedLead}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'inbox' && (
            <EmailInboxView
              leads={leads}
              onSelectLead={setSelectedLead}
              onUpdateLeadStatus={handleUpdateLeadStatus}
              onUpdateLeadDetails={handleUpdateLeadDetails}
            />
          )}

          {activeTab === 'outreach' && (
            <OutreachView
              leads={leads}
              selectedLead={selectedLead}
              onSelectLead={setSelectedLead}
              onUpdateLeadStatus={handleUpdateLeadStatus}
              onUpdateLeadDetails={handleUpdateLeadDetails}
            />
          )}

          {activeTab === 'followups' && (
            <FollowUpsView
              leads={leads}
              onSelectLead={setSelectedLead}
              onNavigate={setActiveTab}
              onUpdateLeadStatus={handleUpdateLeadStatus}
              onUpdateLeadDetails={handleUpdateLeadDetails}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              leads={leads}
              onSelectLead={setSelectedLead}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'feedback' && (
            <FeedbackView
              leads={leads}
              onUpdateLeadFeedback={handleUpdateLeadFeedback}
              feedbackLogs={feedbackLogs}
            />
          )}

          {activeTab === 'admin' && (
            canAccessAdminPanel(authSession?.user || null, activeOrg) ? (
              <SuperAdminView
                organizations={organizations}
                activeOrg={activeOrg}
                onSelectOrg={handleSwitchOrg}
                onUpdateOrg={handleUpdateOrg}
                onAddOrganization={handleAddOrganization}
                clientProfiles={[activeProfile]}
                leads={leads}
              />
            ) : (
              <div className="glass-card p-12 rounded-3xl border border-rose-500/30 text-center space-y-6 max-w-xl mx-auto my-12 animate-fadeIn">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-2xl flex items-center justify-center mx-auto">
                  403
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold font-display text-white">Access Forbidden</h2>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    The Platform Admin Panel is strictly restricted to platform <strong className="text-white">SUPER_ADMIN</strong> accounts.
                    Customer subscription plans (<span className="text-[#f5b82e] font-bold">{activeOrg.planId}</span>) do not grant access to multi-tenant platform administration.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('search')}
                  className="btn-gold px-6 py-3 rounded-xl font-bold text-xs"
                >
                  Return to Customer Search Workspace
                </button>
              </div>
            )
          )}

          {activeTab === 'settings' && (
            <SettingsView
              leads={leads}
              webhookUrl={webhookUrl}
              onUpdateWebhookUrl={(url) => {
                setWebhookUrl(url);
                handleUpdateOrg(activeOrg.orgId, { sheetsWebhookUrl: url });
              }}
              geminiApiKey={geminiApiKey}
              onUpdateGeminiApiKey={setGeminiApiKey}
              onImportLeads={handleAddLeads}
              activeOrg={activeOrg}
            />
          )}
        </main>
      </div>

      {/* Intelligence Report Modal */}
      {intelligenceReportLead && (
        <LeadIntelligenceModal
          lead={intelligenceReportLead}
          onClose={() => setIntelligenceReportLead(null)}
          onOpenCompose={(lead) => {
            setSelectedLead(lead);
            setActiveTab('inbox');
          }}
        />
      )}

      {/* 14-Step Customer Onboarding Wizard Modal */}
      <OnboardingWizardModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        onComplete={(newProfile) => {
          setActiveProfile(newProfile);
          setActiveTab('hunter');
        }}
        existingProfile={activeProfile}
      />

      {/* Plan Limit Exceeded Modal */}
      <PlanLimitModal
        checkResult={limitCheckResult}
        onClose={() => setLimitCheckResult(null)}
        onUpgradePlan={() => {
          setActiveTab('admin');
        }}
      />
    </div>
  );
}
