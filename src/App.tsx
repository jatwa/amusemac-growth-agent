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
import { initThemeListener } from './services/themeService';
import { AdminLoginView } from './components/AdminLoginView';

export function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);
  const [activeTab, setActiveTab] = useState<string>('search');
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Initialize System Theme Listener
  useEffect(() => {
    const cleanup = initThemeListener();
    return cleanup;
  }, []);


  // Real Authentication Session State
  const [authSession, setAuthSession] = useState<AuthSession | null>(getCurrentSession);

  // Presence Heartbeat Loop (Sends heartbeat every 30 seconds when authenticated)
  useEffect(() => {
    if (!authSession || !authSession.token) return;

    const sendHeartbeat = async () => {
      try {
        const token = authSession.token;
        await fetch('/api/auth/presence/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ sessionId: token })
        });
      } catch (e) {
        // Silent error handling for background presence ping
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [authSession?.token]);

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

  // CRM Leads State (Isolated by Organization - REAL_PUBLIC ONLY)
  const [leads, setLeads] = useState<Lead[]>(() => {
    if (!activeOrg) return [];
    return getOrgLeads(activeOrg.orgId, []);
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

  // Unauthenticated Admin Login View
  if (!authSession || !activeOrg || !currentUserRole) {
    return (
      <AdminLoginView
        onLoginSuccess={(session) => {
          handleAuthenticated(session);
        }}
      />
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
        onOpenOnboarding={() => {}}
        userName={authSession.user.name}
        userEmail={authSession.user.email}
        onLogout={handleLogout}
        activeTab={activeTab}
        dueFollowUpsCount={dueFollowUpsCount}
      />

      {/* Main Body Layout */}
      <div className="flex-1 flex max-w-[1700px] w-full mx-auto px-2 sm:px-6 py-4 sm:py-6 gap-4 sm:gap-6 min-w-0">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onNavigate={setActiveTab}
          dueFollowUpsCount={dueFollowUpsCount}
          user={authSession.user}
          org={activeOrg}
        />

        {/* View Component Renderer */}
        <main className="flex-1 min-w-0 overflow-hidden">
          {activeTab === 'search' && (
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
              activeOrg={activeOrg}
            />
          )}

          {activeTab === 'outreach' && (
            <OutreachView
              leads={leads}
              selectedLead={selectedLead}
              onSelectLead={setSelectedLead}
              onUpdateLeadStatus={handleUpdateLeadStatus}
              onUpdateLeadDetails={handleUpdateLeadDetails}
              activeOrg={activeOrg}
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
            <SuperAdminView
              organizations={organizations}
              activeOrg={activeOrg}
              onSelectOrg={handleSwitchOrg}
              onUpdateOrg={handleUpdateOrg}
              onAddOrganization={handleAddOrganization}
              clientProfiles={[activeProfile]}
              leads={leads}
            />
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
          activeOrg={activeOrg}
        />
      )}
    </div>
  );
}
