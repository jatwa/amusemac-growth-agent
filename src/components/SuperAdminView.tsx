import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  Users,
  Search,
  Activity,
  Server,
  Key,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Sliders,
  Plus,
  RefreshCw,
  Zap,
  Award,
  Globe
} from 'lucide-react';
import { ClientProfile, Lead } from '../types/lead';
import { Organization, OrgStatus, PlanId } from '../types/saas';
import { resetOrgUsage } from '../services/usageMetering';

interface SuperAdminViewProps {
  organizations: Organization[];
  activeOrg: Organization;
  onSelectOrg: (org: Organization) => void;
  onUpdateOrg: (orgId: string, updates: Partial<Organization>) => void;
  onAddOrganization: (org: Organization) => void;
  clientProfiles: ClientProfile[];
  leads: Lead[];
}

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({
  organizations,
  activeOrg,
  onSelectOrg,
  onUpdateOrg,
  onAddOrganization,
  clientProfiles,
  leads
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newPlan, setNewPlan] = useState<PlanId>('PRO');
  const [statusNotice, setStatusNotice] = useState('');

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName || !newAdminEmail) return;

    const orgId = newCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '-') + `-${Date.now().toString().slice(-4)}`;
    const newOrg: Organization = {
      orgId,
      companyName: newCompanyName,
      tagline: 'SaaS Client Workspace',
      website: 'https://',
      status: 'TRIAL',
      planId: newPlan,
      trialEndDate: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
      emailConfig: {
        provider: 'CUSTOM_SMTP',
        email: newAdminEmail,
        status: 'SIMULATED'
      },
      sheetsWebhookUrl: '',
      createdAt: new Date().toISOString().slice(0, 10),
      renewalDate: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
      adminEmail: newAdminEmail,
      adminName: newCompanyName + ' Admin',
      notes: 'Created via Super Admin Dashboard'
    };

    onAddOrganization(newOrg);
    setShowAddModal(false);
    setNewCompanyName('');
    setNewAdminEmail('');
    setStatusNotice(`Customer Organization "${newCompanyName}" created successfully!`);
    setTimeout(() => setStatusNotice(''), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Super Admin Header */}
      <div className="glass-card-gold p-6 rounded-2xl flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-500/30 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>AMUSEMAC SAAS SUPER ADMIN</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            CUSTOMER <span className="text-gold-gradient">ORGANIZATIONS</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Manage customer workspaces, subscription plans, status flags, usage limits, and platform health
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-gold px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-[#f5b82e]/20"
        >
          <Plus className="w-4 h-4" />
          <span>CREATE NEW CUSTOMER ORG</span>
        </button>
      </div>

      {statusNotice && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Top Diagnostics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="glass-card p-5 rounded-2xl border border-[#202436]">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Customer Orgs</span>
          <span className="text-2xl font-black font-mono text-white mt-1 block">{organizations.length}</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-[#202436]">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Active Workspace</span>
          <span className="text-sm font-bold text-[#f5b82e] mt-2 block truncate">{activeOrg.companyName}</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-[#202436]">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Active Subscription Plan</span>
          <span className="text-sm font-bold text-emerald-400 mt-2 block font-mono">{activeOrg.planId}</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-[#202436]">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">System Backend API</span>
          <span className="text-xs font-bold text-emerald-400 mt-2 block flex items-center space-x-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Port 3001 Online</span>
          </span>
        </div>
      </div>

      {/* Organizations Directory */}
      <div className="glass-card p-6 rounded-2xl border border-[#202436] space-y-5">
        <h3 className="text-base font-bold text-white font-display">Customer Workspace Directory & Subscriptions</h3>

        <div className="space-y-4">
          {organizations.map((org) => {
            const isSelected = org.orgId === activeOrg.orgId;

            return (
              <div
                key={org.orgId}
                className={`p-5 rounded-2xl border transition-all ${
                  isSelected ? 'border-[#f5b82e] bg-[#f5b82e]/5' : 'border-[#22273c] bg-[#141624]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-bold text-white font-display">{org.companyName}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        org.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        org.status === 'TRIAL' ? 'bg-[#f5b82e]/20 text-[#f5b82e] border-[#f5b82e]/30' :
                        'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      }`}>
                        {org.status}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {org.planId} PLAN
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Admin: {org.adminName} ({org.adminEmail}) • Created: {org.createdAt}</p>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    {/* Status Select */}
                    <select
                      value={org.status}
                      onChange={(e) => onUpdateOrg(org.orgId, { status: e.target.value as OrgStatus })}
                      className="bg-[#191c2b] border border-[#2b3046] text-slate-200 rounded-xl px-3 py-1.5 outline-none font-semibold"
                    >
                      <option value="TRIAL">TRIAL</option>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="PAST_DUE">PAST_DUE</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>

                    {/* Plan Select */}
                    <select
                      value={org.planId}
                      onChange={(e) => onUpdateOrg(org.orgId, { planId: e.target.value as PlanId })}
                      className="bg-[#191c2b] border border-[#2b3046] text-[#f5b82e] rounded-xl px-3 py-1.5 outline-none font-bold"
                    >
                      <option value="LITE">LITE PLAN ($99)</option>
                      <option value="PRO">PRO PLAN ($299)</option>
                      <option value="ENTERPRISE">ENTERPRISE ($999)</option>
                    </select>

                    {/* Reset Usage */}
                    <button
                      onClick={() => { resetOrgUsage(org.orgId); setStatusNotice(`Usage reset for ${org.companyName}`); setTimeout(() => setStatusNotice(''), 3000); }}
                      className="px-3 py-1.5 rounded-xl bg-[#1e2235] text-slate-300 hover:text-white border border-[#2c324a] flex items-center space-x-1"
                      title="Reset Monthly Usage Counters"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#f5b82e]" />
                      <span>Reset Usage</span>
                    </button>

                    {/* Select Active Workspace */}
                    <button
                      onClick={() => onSelectOrg(org)}
                      className={`px-4 py-1.5 rounded-xl font-bold transition-all ${
                        isSelected
                          ? 'bg-[#f5b82e] text-[#0c0d12]'
                          : 'bg-[#1e2235] text-slate-300 hover:text-white border border-[#2a3048]'
                      }`}
                    >
                      {isSelected ? 'ACTIVE WORKSPACE' : 'SWITCH WORKSPACE'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Customer Org Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateCustomer} className="bg-[#141622] border border-[#2c324a] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-xs">
            <h3 className="text-lg font-bold text-white font-display">Create Customer Organization</h3>

            <div className="space-y-3">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Company / Organization Name</label>
                <input
                  type="text"
                  required
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="e.g. Apex Media House"
                  className="w-full bg-[#151724] border border-[#2a2f47] text-white rounded-xl px-3 py-2.5 outline-none focus:border-[#f5b82e]"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Customer Admin Email</label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin@apexmedia.in"
                  className="w-full bg-[#151724] border border-[#2a2f47] text-white rounded-xl px-3 py-2.5 outline-none focus:border-[#f5b82e]"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Initial Subscription Plan</label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value as PlanId)}
                  className="w-full bg-[#151724] border border-[#2a2f47] text-[#f5b82e] font-bold rounded-xl px-3 py-2.5 outline-none"
                >
                  <option value="LITE">LITE PLAN ($99/mo • 100 leads)</option>
                  <option value="PRO">PRO PLAN ($299/mo • 500 leads)</option>
                  <option value="ENTERPRISE">ENTERPRISE ($999/mo • 5000 leads)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-gold px-5 py-2 rounded-xl text-xs font-bold"
              >
                Create Workspace
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
