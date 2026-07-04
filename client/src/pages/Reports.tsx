import { useEffect, useState } from 'react';
import { leadsApi } from '../services/api';
import type { Lead } from '../types';
import { 
  Users, 
  TrendingUp, 
  UserCheck, 
  PieChart, 
  Mail,
  Phone,
  BarChart3,
  Award
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ReferrerStats {
  id: string;
  name: string;
  email: string;
  phone: string;
  total: number;
  won: number;
  lost: number;
  other: number;
  successRate: number;
}

interface SourceStats {
  name: string;
  total: number;
  won: number;
  percentage: number;
}

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [referrerStats, setReferrerStats] = useState<ReferrerStats[]>([]);
  const [sourceStats, setSourceStats] = useState<SourceStats[]>([]);
  const [activeTab, setActiveTab] = useState<'referrals' | 'sources'>('referrals');

  // KPI states
  const [totalReferred, setTotalReferred] = useState(0);
  const [overallSuccessRate, setOverallSuccessRate] = useState(0);
  const [topReferrer, setTopReferrer] = useState('-');
  const [topSource, setTopSource] = useState('-');

  useEffect(() => {
    leadsApi.getAll()
      .then((data) => {
        calculateStats(data);
      })
      .catch(() => {
        toast.error('Failed to load report metrics');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const calculateStats = (allLeads: Lead[]) => {
    // 1. Calculate Referrer Statistics
    const refMap: Record<string, ReferrerStats> = {};
    let totalRefReferred = 0;
    let totalRefWon = 0;

    allLeads.forEach(lead => {
      if (lead.referrerId) {
        totalRefReferred++;
        const refId = lead.referrerId._id;
        const status = lead.status;

        if (!refMap[refId]) {
          refMap[refId] = {
            id: refId,
            name: lead.referrerId.name,
            email: lead.referrerId.email || '',
            phone: lead.referrerId.phone || '',
            total: 0,
            won: 0,
            lost: 0,
            other: 0,
            successRate: 0
          };
        }

        refMap[refId].total++;
        if (status === 'Won') {
          refMap[refId].won++;
          totalRefWon++;
        } else if (status === 'Lost') {
          refMap[refId].lost++;
        } else {
          refMap[refId].other++;
        }
      }
    });

    const referrersList = Object.values(refMap).map(ref => {
      ref.successRate = ref.total > 0 ? Math.round((ref.won / ref.total) * 100) : 0;
      return ref;
    }).sort((a, b) => b.total - a.total);

    setReferrerStats(referrersList);
    setTotalReferred(totalRefReferred);
    setOverallSuccessRate(totalRefReferred > 0 ? Math.round((totalRefWon / totalRefReferred) * 100) : 0);
    setTopReferrer(referrersList.length > 0 ? referrersList[0].name : '-');

    // 2. Calculate Source Statistics
    const srcMap: Record<string, { total: number; won: number }> = {};
    let totalLeadsWithSource = 0;

    allLeads.forEach(lead => {
      const srcName = lead.source?.trim() || 'Direct / Organic';
      totalLeadsWithSource++;
      if (!srcMap[srcName]) {
        srcMap[srcName] = { total: 0, won: 0 };
      }
      srcMap[srcName].total++;
      if (lead.status === 'Won') {
        srcMap[srcName].won++;
      }
    });

    const sourcesList = Object.entries(srcMap).map(([name, stats]) => ({
      name,
      total: stats.total,
      won: stats.won,
      percentage: totalLeadsWithSource > 0 ? Math.round((stats.total / totalLeadsWithSource) * 100) : 0
    })).sort((a, b) => b.total - a.total);

    setSourceStats(sourcesList);
    setTopSource(sourcesList.length > 0 ? sourcesList[0].name : '-');
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-sm font-bold text-gray-400 dark:text-zinc-550">
        Loading analytics reports...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 w-full max-w-none space-y-6 bg-[#f4f6fb] dark:bg-zinc-950 min-h-screen">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-800 dark:text-zinc-100 tracking-tight">Analytics & Reports</h1>
        <p className="text-sm text-gray-400 font-semibold mt-1">Acquisition channels performance, referrer conversions, and success ratios</p>
      </div>

      {/* KPI Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1 */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-850 rounded-3xl p-6 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Referred Leads</p>
            <p className="text-2xl font-black text-gray-800 dark:text-zinc-150 mt-1">{totalReferred}</p>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-850 rounded-3xl p-6 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Referral Success Rate</p>
            <p className="text-2xl font-black text-gray-800 dark:text-zinc-150 mt-1">{overallSuccessRate}%</p>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-850 rounded-3xl p-6 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Top Referrer</p>
            <p className="text-lg font-black text-gray-800 dark:text-zinc-150 mt-1 truncate">{topReferrer}</p>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-850 rounded-3xl p-6 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
            <PieChart className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Top Source Channel</p>
            <p className="text-lg font-black text-gray-800 dark:text-zinc-150 mt-1 truncate">{topSource}</p>
          </div>
        </div>

      </div>

      {/* Tabs */}
      <div className="flex bg-gray-200/60 dark:bg-zinc-900 p-1.5 rounded-2xl w-fit gap-1 select-none border border-gray-150/40 dark:border-zinc-850">
        <button
          type="button"
          onClick={() => setActiveTab('referrals')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-150 focus:outline-none ${
            activeTab === 'referrals'
              ? 'bg-white dark:bg-zinc-850 text-indigo-650 dark:text-indigo-400 shadow-sm'
              : 'text-gray-500 hover:text-gray-850 dark:hover:text-zinc-200'
          }`}
        >
          Referrer Performance
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sources')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-150 focus:outline-none ${
            activeTab === 'sources'
              ? 'bg-white dark:bg-zinc-850 text-indigo-650 dark:text-indigo-400 shadow-sm'
              : 'text-gray-500 hover:text-gray-850 dark:hover:text-zinc-200'
          }`}
        >
          Acquisition Sources
        </button>
      </div>

      {/* Content Render */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-850 rounded-3xl p-6 shadow-sm">
        
        {activeTab === 'referrals' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-850">
              <h2 className="text-base font-extrabold text-gray-800 dark:text-zinc-100 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-500" />
                Referrer Success Leaderboard
              </h2>
              <span className="text-[10px] uppercase font-bold text-gray-400 bg-slate-50 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                Sorted by total leads
              </span>
            </div>

            {referrerStats.length === 0 ? (
              <div className="py-16 text-center text-sm font-semibold text-gray-450">
                No referral leads found in the system yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-zinc-850 text-gray-400 uppercase tracking-widest text-[10px] font-bold">
                      <th className="py-3 px-4">Referrer Name</th>
                      <th className="py-3 px-4">Contact Info</th>
                      <th className="py-3 px-4 text-center">Total Referred</th>
                      <th className="py-3 px-4 text-center">Won (Success)</th>
                      <th className="py-3 px-4 text-center">Lost</th>
                      <th className="py-3 px-4 text-center">Other Stages</th>
                      <th className="py-3 px-4 text-right">Success Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrerStats.map((ref) => (
                      <tr key={ref.id} className="border-b border-gray-50 last:border-0 dark:border-zinc-850/50 hover:bg-slate-50/40 dark:hover:bg-zinc-800/10 transition-colors">
                        <td className="py-4 px-4 font-black text-gray-800 dark:text-zinc-150">{ref.name}</td>
                        <td className="py-4 px-4 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                          <div className="space-y-1">
                            {ref.email && (
                              <div className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400" />{ref.email}</div>
                            )}
                            {ref.phone && (
                              <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" />{ref.phone}</div>
                            )}
                            {!ref.email && !ref.phone && <span className="italic text-gray-400">No contact info</span>}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center font-extrabold text-gray-800 dark:text-zinc-200">{ref.total}</td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450">
                            {ref.won}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450">
                            {ref.lost}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-slate-450">{ref.other}</td>
                        <td className="py-4 px-4 text-right">
                          <div className="inline-flex flex-col items-end">
                            <span className={`text-sm font-black ${
                              ref.successRate >= 70 ? 'text-emerald-600 dark:text-emerald-400' :
                              ref.successRate >= 40 ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'
                            }`}>
                              {ref.successRate}%
                            </span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Ratio</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-850">
              <h2 className="text-base font-extrabold text-gray-800 dark:text-zinc-100 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                Acquisition Channels Share
              </h2>
              <span className="text-[10px] uppercase font-bold text-gray-400 bg-slate-50 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                Sorted by lead volume
              </span>
            </div>

            {sourceStats.length === 0 ? (
              <div className="py-16 text-center text-sm font-semibold text-gray-450">
                No leads source data available yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {sourceStats.map((src, idx) => (
                  <div 
                    key={idx}
                    className="bg-slate-50/50 dark:bg-zinc-800/10 border border-border/40 rounded-2xl p-5 hover:bg-slate-50 dark:hover:bg-zinc-850/50 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-black text-slate-800 dark:text-zinc-150 truncate">{src.name}</h4>
                        <span className="text-[10px] font-bold text-gray-400">
                          {src.percentage}% Share
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 block">Acquisition Channel</span>
                    </div>

                    <div className="mt-5">
                      <div className="flex items-baseline justify-between mb-3.5">
                        <span className="text-2xl font-black text-gray-800 dark:text-zinc-150">
                          {src.total} <span className="text-xs font-semibold text-gray-450">leads</span>
                        </span>
                        <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-450 px-2.5 py-0.5 rounded">
                          {src.won} Won
                        </span>
                      </div>

                      {/* Percentage Bar inside card */}
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            idx === 0 ? 'bg-indigo-500' :
                            idx === 1 ? 'bg-violet-500' :
                            idx === 2 ? 'bg-amber-500' : 'bg-slate-450'
                          }`}
                          style={{ width: `${src.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
