import React from 'react';
import {
  Users,
  Flame,
  Thermometer,
  Snowflake,
  Send,
  MessageSquare,
  Sparkles,
  Calendar,
  FileText,
  Trophy,
  XCircle,
  TrendingUp,
  Award,
  Search,
  KanbanSquare,
  CalendarCheck,
  BarChart3,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Lead } from '../types/lead';

interface DashboardViewProps {
  leads: Lead[];
  onNavigate: (tab: string) => void;
  onSelectLead: (lead: Lead) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ leads, onNavigate, onSelectLead }) => {
  const totalLeads = leads.length;
  const hotLeads = leads.filter(l => l.priority === 'HOT').length;
  const warmLeads = leads.filter(l => l.priority === 'WARM').length;
  const coldLeads = leads.filter(l => l.priority === 'COLD').length;

  const contacted = leads.filter(l => ['CONTACTED', 'REPLIED', 'INTERESTED', 'MEETING', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'].includes(l.outreachStatus)).length;
  const replies = leads.filter(l => ['REPLIED', 'INTERESTED', 'MEETING', 'PROPOSAL', 'NEGOTIATION', 'WON'].includes(l.outreachStatus)).length;
  const interested = leads.filter(l => ['INTERESTED', 'MEETING', 'PROPOSAL', 'NEGOTIATION', 'WON'].includes(l.outreachStatus)).length;
  const meetings = leads.filter(l => ['MEETING', 'PROPOSAL', 'NEGOTIATION', 'WON'].includes(l.outreachStatus)).length;
  const proposals = leads.filter(l => ['PROPOSAL', 'NEGOTIATION', 'WON'].includes(l.outreachStatus)).length;
  const won = leads.filter(l => l.outreachStatus === 'WON').length;
  const lost = leads.filter(l => l.outreachStatus === 'LOST').length;

  const conversionRate = contacted > 0 ? ((won / contacted) * 100).toFixed(1) : '0.0';
  const avgLeadScore = totalLeads > 0 ? Math.round(leads.reduce((acc, l) => acc + (l.aiScore || 0), 0) / totalLeads) : 0;

  const topScoringLeads = [...leads].sort((a, b) => b.aiScore - a.aiScore).slice(0, 5);

  const kpiCards = [
    { title: 'Total Leads', count: totalLeads, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { title: 'Hot Leads', count: hotLeads, icon: Flame, color: 'text-[#f5b82e]', bg: 'bg-[#f5b82e]/10 border-[#f5b82e]/30' },
    { title: 'Warm Leads', count: warmLeads, icon: Thermometer, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { title: 'Cold Leads', count: coldLeads, icon: Snowflake, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
    { title: 'Contacted', count: contacted, icon: Send, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
    { title: 'Replies', count: replies, icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    { title: 'Interested', count: interested, icon: Sparkles, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
    { title: 'Meetings', count: meetings, icon: Calendar, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { title: 'Proposals', count: proposals, icon: FileText, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    { title: 'Won Deals', count: won, icon: Trophy, color: 'text-green-300', bg: 'bg-green-500/10 border-green-500/30' },
    { title: 'Lost Deals', count: lost, icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
    { title: 'Conversion Rate', count: `${conversionRate}%`, icon: TrendingUp, color: 'text-[#f5b82e]', bg: 'bg-[#f5b82e]/10 border-[#f5b82e]/30' },
    { title: 'Avg Lead Score', count: `${avgLeadScore}/100`, icon: Award, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="glass-card-gold p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#f5b82e]/20 text-[#f5b82e] text-xs font-semibold border border-[#f5b82e]/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI B2B GROWTH ENGINE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            AMUSEMAC <span className="text-gold-gradient">GROWTH DASHBOARD</span>
          </h2>
          <p className="text-sm text-slate-300 max-w-2xl">
            Automated lead qualification, decision-maker research, service matching, and personalized outreach engine built exclusively for Amusemac Studio.
          </p>
        </div>

        {/* Quick Main Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={() => onNavigate('hunter')}
            className="btn-gold px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-[#f5b82e]/20"
          >
            <Search className="w-4 h-4" />
            <span>FIND NEW LEADS</span>
          </button>
          <button
            onClick={() => onNavigate('pipeline')}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#1e2235] text-slate-200 hover:text-white hover:bg-[#282d46] border border-[#2d334e] flex items-center space-x-2 transition-colors"
          >
            <KanbanSquare className="w-4 h-4 text-blue-400" />
            <span>VIEW PIPELINE</span>
          </button>
          <button
            onClick={() => onNavigate('outreach')}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#1e2235] text-slate-200 hover:text-white hover:bg-[#282d46] border border-[#2d334e] flex items-center space-x-2 transition-colors"
          >
            <Send className="w-4 h-4 text-[#f5b82e]" />
            <span>CREATE OUTREACH</span>
          </button>
          <button
            onClick={() => onNavigate('followups')}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#1e2235] text-slate-200 hover:text-white hover:bg-[#282d46] border border-[#2d334e] flex items-center space-x-2 transition-colors"
          >
            <CalendarCheck className="w-4 h-4 text-emerald-400" />
            <span>FOLLOW-UPS</span>
          </button>
          <button
            onClick={() => onNavigate('analytics')}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#1e2235] text-slate-200 hover:text-white hover:bg-[#282d46] border border-[#2d334e] flex items-center space-x-2 transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <span>ANALYTICS</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold font-display text-white">Pipeline Summary & Analytics</h3>
          <span className="text-xs text-slate-400 font-mono">13 Metrics Active</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
          {kpiCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className={`glass-card p-4 rounded-xl border ${card.bg} hover:border-[#f5b82e]/40 transition-all duration-200 group`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors">{card.title}</span>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <div className="text-xl sm:text-2xl font-extrabold font-mono text-white tracking-tight">{card.count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Scoring Leads Table & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 High Scoring Leads */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-[#202436]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold font-display text-white flex items-center space-x-2">
                <Flame className="w-5 h-5 text-[#f5b82e]" />
                <span>Top High-Qualified Opportunities</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Highest scoring real businesses ready for Amusemac outreach</p>
            </div>
            <button
              onClick={() => onNavigate('leads')}
              className="text-xs font-semibold text-[#f5b82e] hover:underline flex items-center space-x-1"
            >
              <span>View All Leads</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#25293c] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3">Company</th>
                  <th className="pb-3 px-3">Industry</th>
                  <th className="pb-3 px-3">Primary Service</th>
                  <th className="pb-3 px-3">AI Score</th>
                  <th className="pb-3 px-3">Priority</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2233] text-xs">
                {topScoringLeads.map((lead) => (
                  <tr key={lead.leadId} className="hover:bg-[#181b29] transition-colors group">
                    <td className="py-3.5 px-3 font-semibold text-white">
                      <div>{lead.companyName}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{lead.location}</div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-300">{lead.industry}</td>
                    <td className="py-3.5 px-3 text-[#f5b82e] font-medium">{lead.primaryService}</td>
                    <td className="py-3.5 px-3">
                      <div className="inline-flex items-center space-x-1.5 font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <span>{lead.aiScore}</span>
                        <span className="text-[10px] text-slate-500">/100</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                        lead.priority === 'HOT' ? 'bg-[#f5b82e]/20 text-[#f5b82e] border-[#f5b82e]/40' :
                        lead.priority === 'WARM' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                        'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                      }`}>
                        {lead.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => {
                          onSelectLead(lead);
                          onNavigate('outreach');
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-[#21263a] hover:bg-[#f5b82e] text-slate-200 hover:text-[#0c0d12] rounded-lg transition-colors border border-[#303754]"
                      >
                        Outreach
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Amusemac Services Matrix */}
        <div className="glass-card p-6 rounded-2xl border border-[#202436] space-y-4">
          <h3 className="text-base font-bold font-display text-white flex items-center space-x-2">
            <Award className="w-5 h-5 text-[#f5b82e]" />
            <span>Amusemac Studio Services</span>
          </h3>
          <p className="text-xs text-slate-400">Target service offerings for lead matching</p>

          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {[
              'Film Production',
              'Advertising Film Production',
              'Commercial Production',
              'Branded Content',
              'Corporate Films',
              'Video Production',
              'Photography Production',
              'Production Design',
              'Art Direction',
              'Set Design',
              'Studio Rental',
              'Creative Development',
              'Visual Development',
              'AI Film Production',
              'AI Video Production',
              'End-to-End Creative Production',
              'Campaign Production'
            ].map((srv, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-[#161926] border border-[#23283c] hover:border-[#f5b82e]/40 transition-colors">
                <span className="text-xs font-medium text-slate-200">{srv}</span>
                <span className="text-[10px] text-[#f5b82e] font-mono font-semibold">Active</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
