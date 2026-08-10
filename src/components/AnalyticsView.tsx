import React from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Award,
  Users,
  Building,
  MapPin,
  Flame,
  Trophy,
  Star
} from 'lucide-react';
import { Lead } from '../types/lead';

interface AnalyticsViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onNavigate: (tab: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ leads, onSelectLead, onNavigate }) => {
  const total = leads.length;

  const hotCount = leads.filter(l => l.priority === 'HOT').length;
  const warmCount = leads.filter(l => l.priority === 'WARM').length;
  const coldCount = leads.filter(l => l.priority === 'COLD').length;

  const avgAiScore = total > 0 ? Math.round(leads.reduce((a, b) => a + b.aiScore, 0) / total) : 0;
  const avgContactability = total > 0 ? Math.round(leads.reduce((a, b) => a + (b.contactabilityScore || 0), 0) / total) : 0;

  const contacted = leads.filter(l => ['CONTACTED', 'REPLIED', 'INTERESTED', 'MEETING', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'].includes(l.outreachStatus)).length;
  const replied = leads.filter(l => ['REPLIED', 'INTERESTED', 'MEETING', 'PROPOSAL', 'NEGOTIATION', 'WON'].includes(l.outreachStatus)).length;
  const meetings = leads.filter(l => ['MEETING', 'PROPOSAL', 'NEGOTIATION', 'WON'].includes(l.outreachStatus)).length;
  const proposals = leads.filter(l => ['PROPOSAL', 'NEGOTIATION', 'WON'].includes(l.outreachStatus)).length;
  const won = leads.filter(l => l.outreachStatus === 'WON').length;
  const lost = leads.filter(l => l.outreachStatus === 'LOST').length;

  const replyRate = contacted > 0 ? ((replied / contacted) * 100).toFixed(1) : '0.0';
  const meetingRate = contacted > 0 ? ((meetings / contacted) * 100).toFixed(1) : '0.0';
  const proposalRate = contacted > 0 ? ((proposals / contacted) * 100).toFixed(1) : '0.0';
  const conversionRate = contacted > 0 ? ((won / contacted) * 100).toFixed(1) : '0.0';

  // Industry Breakdown
  const industryCounts: Record<string, number> = {};
  leads.forEach(l => {
    industryCounts[l.industry] = (industryCounts[l.industry] || 0) + 1;
  });

  const sortedIndustries = Object.entries(industryCounts).sort((a, b) => b[1] - a[1]);
  const mostCommonIndustry = sortedIndustries[0]?.[0] || 'Advertising agencies';

  // Location Breakdown
  const locationCounts: Record<string, number> = {};
  leads.forEach(l => {
    const loc = l.location.split(',')[0].trim();
    locationCounts[loc] = (locationCounts[loc] || 0) + 1;
  });
  const sortedLocations = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]);

  // Service Breakdown
  const serviceCounts: Record<string, number> = {};
  leads.forEach(l => {
    serviceCounts[l.primaryService] = (serviceCounts[l.primaryService] || 0) + 1;
  });
  const sortedServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]);
  const bestPerformingService = sortedServices[0]?.[0] || 'Advertising Film Production';

  // Top 10 Leads
  const top10Leads = [...leads].sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0)).slice(0, 10);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="glass-card-gold p-6 rounded-2xl flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#f5b82e]/20 text-[#f5b82e] text-xs font-semibold border border-[#f5b82e]/30 mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>SALES PIPELINE INTELLIGENCE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            GROWTH <span className="text-gold-gradient">ANALYTICS DASHBOARD</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Pipeline performance metrics, industry distributions, service demand, and conversion funnels
          </p>
        </div>
      </div>

      {/* Metric Highlights Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="glass-card p-4 rounded-xl border border-[#202436]">
          <span className="text-xs text-slate-400">Total Leads</span>
          <div className="text-2xl font-extrabold font-mono text-white mt-1">{total}</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-[#f5b82e]/30">
          <span className="text-xs text-[#f5b82e]">Avg AI Score</span>
          <div className="text-2xl font-extrabold font-mono text-[#f5b82e] mt-1">{avgAiScore}/100</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-cyan-500/30">
          <span className="text-xs text-cyan-400">Contactability</span>
          <div className="text-2xl font-extrabold font-mono text-cyan-400 mt-1">{avgContactability}%</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-purple-500/30">
          <span className="text-xs text-purple-400">Reply Rate</span>
          <div className="text-2xl font-extrabold font-mono text-purple-400 mt-1">{replyRate}%</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-emerald-500/30">
          <span className="text-xs text-emerald-400">Meeting Rate</span>
          <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">{meetingRate}%</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-green-500/40">
          <span className="text-xs text-green-300">Win Rate</span>
          <div className="text-2xl font-extrabold font-mono text-green-300 mt-1">{conversionRate}%</div>
        </div>
      </div>

      {/* Visual Funnel & Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Industry Distribution Bar Chart */}
        <div className="glass-card p-6 rounded-2xl border border-[#202436] space-y-4">
          <h3 className="text-base font-bold font-display text-white flex items-center space-x-2">
            <Building className="w-5 h-5 text-[#f5b82e]" />
            <span>Leads by Industry</span>
          </h3>

          <div className="space-y-3">
            {sortedIndustries.map(([ind, count], idx) => {
              const pct = Math.round((count / total) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{ind}</span>
                    <span className="font-mono text-slate-400">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-[#181b2a] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#f5b82e] to-[#d49b19] h-full rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority & Channel Distribution */}
        <div className="glass-card p-6 rounded-2xl border border-[#202436] space-y-6">
          <h3 className="text-base font-bold font-display text-white flex items-center space-x-2">
            <Flame className="w-5 h-5 text-[#f5b82e]" />
            <span>Lead Quality Distribution</span>
          </h3>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-4 rounded-xl bg-[#f5b82e]/10 border border-[#f5b82e]/30">
              <span className="text-xs text-[#f5b82e] font-bold block">HOT Leads</span>
              <span className="text-2xl font-extrabold font-mono text-white mt-1 block">{hotCount}</span>
            </div>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <span className="text-xs text-amber-400 font-bold block">WARM Leads</span>
              <span className="text-2xl font-extrabold font-mono text-white mt-1 block">{warmCount}</span>
            </div>
            <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              <span className="text-xs text-cyan-400 font-bold block">COLD Leads</span>
              <span className="text-2xl font-extrabold font-mono text-white mt-1 block">{coldCount}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#161927] border border-[#24293e] space-y-2">
            <span className="text-xs text-slate-400 uppercase font-semibold">Top Performing Service Match</span>
            <div className="text-lg font-extrabold text-[#f5b82e]">{bestPerformingService}</div>
            <p className="text-xs text-slate-300">Most requested Amusemac service across active qualified pipeline.</p>
          </div>
        </div>
      </div>

      {/* Top 10 Highest Scoring Leads Leaderboard */}
      <div className="glass-card p-6 rounded-2xl border border-[#202436] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold font-display text-white flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-[#f5b82e]" />
            <span>Top 10 Highest Scoring Opportunities</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Leaderboard</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#25293c] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 px-3">Rank</th>
                <th className="pb-3 px-3">Company</th>
                <th className="pb-3 px-3">Industry</th>
                <th className="pb-3 px-3">Primary Service</th>
                <th className="pb-3 px-3">Decision Maker</th>
                <th className="pb-3 px-3">AI Score</th>
                <th className="pb-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2233] text-xs">
              {top10Leads.map((lead, idx) => (
                <tr key={lead.leadId} className="hover:bg-[#181b29] transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-[#f5b82e]">#{idx + 1}</td>
                  <td className="py-3 px-3 font-bold text-white">{lead.companyName}</td>
                  <td className="py-3 px-3 text-slate-300">{lead.industry}</td>
                  <td className="py-3 px-3 text-[#f5b82e] font-medium">{lead.primaryService}</td>
                  <td className="py-3 px-3 text-slate-300">{lead.decisionMakerName}</td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-400">{lead.aiScore}/100</td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => {
                        onSelectLead(lead);
                        onNavigate('outreach');
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-[#f5b82e] text-[#0c0d12] rounded-lg"
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
    </div>
  );
};
