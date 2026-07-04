import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { leadsApi, remindersApi } from "../services/api";
import type { Lead, Reminder } from "../types";
import StatusBadge from "../components/StatusBadge";
import { useStatuses } from "../context/StatusContext";
import {
  Users,
  AlertTriangle,
  Clock,
  Info,
  Award,
  Zap,
  Activity,
  ArrowRight,
  SlidersHorizontal,
  Calendar,
  X,
} from "lucide-react";

/* ─── Types ─────────────────────────────── */
interface DashData {
  leads: Lead[];
  idleLeads: Lead[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { statuses } = useStatuses();
  const [data, setData] = useState<DashData | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [inactiveModalOpen, setInactiveModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>(
    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()],
  );

  useEffect(() => {
    leadsApi.getAll().then((leads) => {
      // Calculate idle leads
      const now = Date.now();
      const idle = leads.filter((l) => {
        const matched = statuses.find((st) => st.name === l.status);
        if (matched && (matched.type === "won" || matched.type === "lost"))
          return false;
        if (l.status === "Won" || l.status === "Lost") return false;

        const lastAct = l.lastActivityAt
          ? new Date(l.lastActivityAt).getTime()
          : new Date(l.createdAt).getTime();
        const diffDays = Math.floor((now - lastAct) / (1000 * 60 * 60 * 24));
        return diffDays >= (l.inactiveLimitDays ?? 2);
      });

      setData({ leads, idleLeads: idle });

      const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const counts = daysOfWeek.map(
        (_, dayIndex) =>
          leads.filter((l) => new Date(l.createdAt).getDay() === dayIndex)
            .length,
      );
      const maxVal = Math.max(...counts);
      if (maxVal > 0) {
        setSelectedDay(daysOfWeek[counts.indexOf(maxVal)]);
      }
    });

    // Fetch overdue and today's reminders
    remindersApi.getAll({ filter: "all" }).then((rems) => {
      const todayStr = new Date().toISOString().split("T")[0];
      const urgentRems = rems.filter((r) => r.date <= todayStr);
      setReminders(urgentRems);
    });
  }, [statuses]);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">
            Loading Dashboard...
          </p>
        </div>
      </div>
    );
  }

  const { leads, idleLeads } = data;
  const totalLeads = leads.length;

  // Lead status counts dynamically calculated based on type
  const wonCount = leads.filter((l) => {
    const st = statuses.find((s) => s.name === l.status);
    return st ? st.type === "won" : l.status === "Won";
  }).length;

  const lostCount = leads.filter((l) => {
    const st = statuses.find((s) => s.name === l.status);
    return st ? st.type === "lost" : l.status === "Lost";
  }).length;

  const activeCount = totalLeads - wonCount - lostCount;

  // Percentages
  const conversionRate = totalLeads > 0 ? (wonCount / totalLeads) * 100 : 0;
  const activePercent = totalLeads > 0 ? (activeCount / totalLeads) * 100 : 0;

  // Calculate top 5 referrers
  interface TopReferrer {
    name: string;
    total: number;
    won: number;
  }
  const refMap: Record<string, { name: string; total: number; won: number }> =
    {};
  leads.forEach((l) => {
    if (l.referrerId) {
      const refName = l.referrerId.name;
      if (!refMap[refName]) {
        refMap[refName] = { name: refName, total: 0, won: 0 };
      }
      refMap[refName].total++;
      if (l.status === "Won") {
        refMap[refName].won++;
      }
    }
  });

  const topReferrers: TopReferrer[] = Object.values(refMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const fmtPercent = (val: number) => {
    return `${val.toFixed(1)}%`;
  };

  // Weekly Histogram
  const getWeeklyCount = (dayIndex: number) => {
    return leads.filter((l) => new Date(l.createdAt).getDay() === dayIndex)
      .length;
  };

  const sunVal = getWeeklyCount(0);
  const monVal = getWeeklyCount(1);
  const tueVal = getWeeklyCount(2);
  const wedVal = getWeeklyCount(3);
  const thuVal = getWeeklyCount(4);
  const friVal = getWeeklyCount(5);
  const satVal = getWeeklyCount(6);

  const maxWeekly = Math.max(
    sunVal,
    monVal,
    tueVal,
    wedVal,
    thuVal,
    friVal,
    satVal,
    1,
  );
  const getPercentHeight = (val: number) => {
    if (val === 0) return "0%";
    return `${Math.max(12, (val / maxWeekly) * 90)}%`;
  };

  const weeklyData = [
    { day: "Sun", value: sunVal, height: getPercentHeight(sunVal) },
    { day: "Mon", value: monVal, height: getPercentHeight(monVal) },
    { day: "Tue", value: tueVal, height: getPercentHeight(tueVal) },
    { day: "Wed", value: wedVal, height: getPercentHeight(wedVal) },
    { day: "Thu", value: thuVal, height: getPercentHeight(thuVal) },
    { day: "Fri", value: friVal, height: getPercentHeight(friVal) },
    { day: "Sat", value: satVal, height: getPercentHeight(satVal) },
  ];

  const totalWeeklyLeads =
    sunVal + monVal + tueVal + wedVal + thuVal + friVal + satVal;

  // Recent leads
  const recentLeads = [...leads]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  const getIdleDays = (lead: Lead) => {
    const lastAct = lead.lastActivityAt
      ? new Date(lead.lastActivityAt).getTime()
      : new Date(lead.createdAt).getTime();
    return Math.floor((Date.now() - lastAct) / (1000 * 60 * 60 * 24));
  };

  // ── Donut Chart Calculations ──────────────────────────
  const circ = 471.2; // Circumference for r = 75
  const activeSegments = [
    { name: "Won", count: wonCount, color: "#009bf2" }, // Sky Blue
    { name: "Active", count: activeCount, color: "#a855f7" }, // Purple
    { name: "Lost", count: lostCount, color: "#eab308" }, // Yellow
  ].filter((s) => s.count > 0);

  const numSegments = activeSegments.length;
  const gapPx = numSegments > 1 ? 4 : 0; // 4px gap between slices
  const totalGapPx = numSegments * gapPx;
  const remainingPx = circ - totalGapPx;

  let currentOffset = 0;
  const segmentsWithLayout = activeSegments.map((s) => {
    const sharePx = totalLeads > 0 ? (s.count / totalLeads) * remainingPx : 0;
    const offset = currentOffset;
    currentOffset += sharePx + gapPx;
    return {
      ...s,
      sharePx,
      offset: -offset,
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-slate-50 to-indigo-50/20 text-slate-900 pb-16 antialiased">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="px-8 pt-8 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 bg-white/40 backdrop-blur-md sticky top-0 z-40">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Lead Tracker
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Overview
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {idleLeads.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-600 animate-pulse">
              <AlertTriangle className="w-4 h-4" />
              <span>{idleLeads.length} Inactive Leads</span>
            </div>
          )}
          <button
            onClick={() => navigate("/leads")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 active:scale-95"
          >
            <span>View Leads</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Content Grid ──────────────────────────────────── */}
      <div className="px-8 mt-8 space-y-8">
        {/* ── Urgent Reminders Section ────────────────────── */}
        {reminders.length > 0 && (
          <div className="bg-gradient-to-r from-rose-50/70 to-pink-50/70 dark:from-rose-950/20 dark:to-pink-950/20 border border-rose-100 dark:border-rose-900/30 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 shrink-0 flex items-center justify-center">
                  <Clock className="w-5.5 h-5.5 text-rose-550 animate-pulse" />
                </div>
                <h2 className="text-[17px] font-black text-slate-850 dark:text-zinc-100 tracking-tight">
                  Urgent Reminders & Scheduled Follow-ups
                </h2>
              </div>
              <span className="text-[11px] font-black bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-xl uppercase tracking-wider shadow-sm shadow-rose-500/10">
                {reminders.length} Action Needed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {reminders.map((rem) => {
                const leadInfo = rem.leadId as any;
                const isOverdue =
                  rem.date < new Date().toISOString().split("T")[0];
                return (
                  <div
                    key={rem._id}
                    onClick={() => navigate(`/leads/${leadInfo?._id}`)}
                    className="bg-white dark:bg-zinc-900 hover:shadow-lg hover:shadow-rose-500/5 border border-rose-100/60 dark:border-rose-900/10 hover:border-rose-300 dark:hover:border-rose-700/50 p-5 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between group relative"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[15px] font-bold text-rose-600 dark:text-rose-400 tracking-widest truncate max-w-[80%]">
                          {leadInfo?.name || "Unknown Lead"}
                        </span>
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${isOverdue ? "bg-rose-500 animate-ping" : "bg-amber-400"}`}
                        />
                      </div>
                      <h4 className="text-[14.5px] font-bold text-slate-850 dark:text-zinc-150 leading-snug group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                        {rem.title}
                      </h4>
                    </div>

                    <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800/80 text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {rem.date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {rem.time}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Row 1: Stat Cards ────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Leads */}
          <div className="relative group bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-2xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" />
            <div className="flex items-center justify-between relative z-10">
              <span className="text-[13px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                Total Leads
              </span>
              <Info className="w-4 h-4 text-slate-300 hover:text-slate-400 cursor-pointer transition" />
            </div>
            <div className="mt-6 flex items-baseline gap-3 relative z-10">
              <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                {totalLeads.toLocaleString()}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600">
                Active & Closed
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400 mt-2">
              Total leads added till now
            </p>
          </div>

          {/* Card 2: Won Leads */}
          <div className="relative group bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-2xl hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" />
            <div className="flex items-center justify-between relative z-10">
              <span className="text-[13px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-500" />
                Won
              </span>
              <Info className="w-4 h-4 text-slate-300 hover:text-slate-400 cursor-pointer transition" />
            </div>
            <div className="mt-6 flex items-baseline gap-3 relative z-10">
              <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                {wonCount.toLocaleString()}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600">
                {fmtPercent(conversionRate)} Conversion
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400 mt-2">
              Leads successfully won
            </p>
          </div>

          {/* Card 3: Active Leads */}
          <div className="relative group bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-2xl hover:shadow-amber-500/5 hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" />
            <div className="flex items-center justify-between relative z-10">
              <span className="text-[13px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                In Progress
              </span>
              <Info className="w-4 h-4 text-slate-300 hover:text-slate-400 cursor-pointer transition" />
            </div>
            <div className="mt-6 flex items-baseline gap-3 relative z-10">
              <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                {activeCount.toLocaleString()}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-600">
                {fmtPercent(activePercent)} Active
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400 mt-2">
              Leads currently in pipeline
            </p>
          </div>

          {/* Card 4: Inactive Leads */}
          <div
            onClick={() => setInactiveModalOpen(true)}
            className="relative group bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-2xl hover:shadow-rose-500/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" />
            <div className="flex items-center justify-between relative z-10">
              <span className="text-[13px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-5 h-5 text-rose-500 animate-pulse" />
                Inactive Leads
              </span>
              <Info className="w-4 h-4 text-slate-300 hover:text-slate-400 cursor-pointer transition" />
            </div>
            <div className="mt-6 flex items-baseline gap-3 relative z-10">
              <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                {idleLeads.length.toLocaleString()}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600">
                Action Required
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400 mt-2">
              No activity for 2-3+ days
            </p>
          </div>
        </div>

        {/* ── Funnel Stage Flow ────────────────── */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" />
                Leads by Status
              </h2>
              <p className="text-xs font-semibold text-slate-400 mt-1">
                Current distribution of your leads
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6 gap-4 relative">
            {statuses.map((s) => {
              const count = leads.filter((l) => l.status === s.name).length;
              const percent = totalLeads > 0 ? (count / totalLeads) * 100 : 0;

              const getBorderColorClass = (colorName: string) => {
                const borderMap: Record<string, string> = {
                  indigo: "border-indigo-500",
                  blue: "border-blue-500",
                  purple: "border-purple-500",
                  amber: "border-amber-500",
                  emerald: "border-emerald-500",
                  rose: "border-rose-500",
                  teal: "border-teal-500",
                  orange: "border-orange-500",
                  pink: "border-pink-500",
                  gray: "border-gray-500",
                };
                return borderMap[colorName] || "border-indigo-500";
              };

              const getTextColorClass = (colorName: string) => {
                const textMap: Record<string, string> = {
                  indigo: "text-indigo-600 bg-indigo-50",
                  blue: "text-blue-600 bg-blue-50",
                  purple: "text-purple-600 bg-purple-50",
                  amber: "text-amber-700 bg-amber-50",
                  emerald: "text-emerald-700 bg-emerald-50",
                  rose: "text-rose-600 bg-rose-50",
                  teal: "text-teal-700 bg-teal-50",
                  orange: "text-orange-700 bg-orange-50",
                  pink: "text-pink-650 bg-pink-50",
                  gray: "text-gray-700 bg-gray-100",
                };
                return textMap[colorName] || "text-indigo-600 bg-indigo-50";
              };

              return (
                <div
                  key={s._id}
                  className={`bg-slate-50/50 rounded-2xl p-5 border-b-4 ${getBorderColorClass(s.color)} hover:bg-slate-50 transition duration-300`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${getTextColorClass(s.color)}`}
                    >
                      {s.name}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {fmtPercent(percent)}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-800 mt-3 truncate">
                    {s.name}
                  </h3>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {count}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
        {/* Top Referrers Table */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Top 5 Referrers
              </h3>
            </div>
            <button
              onClick={() => navigate("/reports")}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-755 flex items-center gap-0.5 transition"
            >
              View Analytics
            </button>
          </div>

          <div className="overflow-x-auto">
            {topReferrers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No referrers recorded yet.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Referrer Name</th>
                    <th className="pb-3 font-semibold text-center">Referred</th>
                    <th className="pb-3 font-semibold text-right">Won</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50/50">
                  {topReferrers.map((ref, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/50 group transition-colors duration-200"
                    >
                      <td className="py-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-955/20 flex items-center justify-center border border-amber-100/30">
                          <span className="text-[11px] font-black text-amber-600 dark:text-amber-400">
                            #{idx + 1}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-slate-800">
                          {ref.name}
                        </span>
                      </td>
                      <td className="py-3 text-center text-sm font-extrabold text-slate-700">
                        {ref.total}
                      </td>
                      <td className="py-3 text-right">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[12px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450">
                          {ref.won} Won
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        {/* ── Row 2: Charts Grid ────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Lead Activity Histogram */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  New Leads Added
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  Leads created by day of week
                </p>
              </div>
              <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl text-xs font-bold">
                {totalWeeklyLeads} Added This Week
              </div>
            </div>

            {/* Weekly Histogram chart */}
            <div className="mt-8 flex items-end justify-between h-[200px] px-4 relative">
              {weeklyData.map((item) => (
                <div
                  key={item.day}
                  className="flex flex-col items-center flex-1 group cursor-pointer"
                  onClick={() => setSelectedDay(item.day)}
                >
                  <div className="w-8 bg-slate-50 hover:bg-slate-100 rounded-full h-[150px] flex items-end overflow-hidden relative transition-colors duration-300">
                    <div
                      style={{ height: item.height }}
                      className={`w-full rounded-full transition-all duration-500 ${
                        selectedDay === item.day
                          ? "bg-gradient-to-t from-indigo-600 to-violet-500 shadow-lg shadow-indigo-500/20"
                          : "bg-indigo-100/70 hover:bg-indigo-200/80"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-xs mt-3 font-semibold transition-colors ${
                      selectedDay === item.day
                        ? "text-indigo-600 font-bold"
                        : "text-slate-400"
                    }`}
                  >
                    {item.day}
                  </span>

                  {/* Active Tooltip */}
                  {selectedDay === item.day && (
                    <div className="absolute top-[-30px] flex flex-col items-center animate-bounce z-10">
                      <span className="text-[11px] font-bold text-white bg-slate-900 px-2.5 py-1 rounded-xl shadow-lg">
                        {item.value} Leads
                      </span>
                      <div className="w-2 h-2 bg-slate-900 rotate-45 mt-[-4px]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Column 2 of Row 2: Donut Chart + Top 5 Referrers Stack */}
          <div className="lg:col-span-1 space-y-6 flex flex-col justify-between">
            {/* Lead Share Donut Chart */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
                  Lead Status Share
                </h3>
              </div>

              {/* Circular Donut Visual (Flat Ends + White Spacers) */}
              <div className="my-6 flex items-center justify-center relative">
                {totalLeads === 0 ? (
                  <div className="w-[220px] h-[220px] rounded-full border-[20px] border-slate-100 flex items-center justify-center text-xs text-slate-400 font-semibold">
                    No Data
                  </div>
                ) : (
                  <svg width="220" height="220" className="rotate-[-90deg]">
                    <circle
                      cx="110"
                      cy="110"
                      r="75"
                      fill="none"
                      stroke="#F1F5F9"
                      strokeWidth="20"
                    />
                    {segmentsWithLayout.map((s, idx) => (
                      <circle
                        key={idx}
                        cx="110"
                        cy="110"
                        r="75"
                        fill="none"
                        stroke={s.color}
                        strokeWidth="22"
                        strokeDasharray={`${s.sharePx} ${circ}`}
                        strokeDashoffset={s.offset}
                        className="transition-all duration-1000 ease-out"
                      />
                    ))}
                  </svg>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    Total Leads
                  </span>
                  <span className="text-3xl font-black text-slate-800 mt-1">
                    {totalLeads}
                  </span>
                </div>
              </div>

              {/* Distribution Legend & Values */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-[#009bf2]" />
                    <span className="font-semibold text-slate-500">Won</span>
                  </div>
                  <span className="font-bold text-slate-800">{wonCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-[#a855f7]" />
                    <span className="font-semibold text-slate-500">Active</span>
                  </div>
                  <span className="font-bold text-slate-800">
                    {activeCount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-[#eab308]" />
                    <span className="font-semibold text-slate-500">Lost</span>
                  </div>
                  <span className="font-bold text-slate-800">{lostCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 3: Recent Leads Table (Full Width) ── */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  Recent Leads
                </h3>
              </div>
              <button
                onClick={() => navigate("/leads")}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 transition"
              >
                Show All
              </button>
            </div>

            <div className="overflow-x-auto">
              {recentLeads.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No leads added yet.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Lead Name</th>
                      <th className="pb-3 font-semibold">Company</th>
                      <th className="pb-3 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50/50">
                    {recentLeads.map((lead) => (
                      <tr
                        key={lead._id}
                        className="hover:bg-slate-50/50 group cursor-pointer transition-colors duration-200"
                        onClick={() => navigate(`/leads/${lead._id}`)}
                      >
                        <td className="py-3.5 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center overflow-hidden border border-indigo-100 shadow-sm">
                            <span className="text-xs font-bold text-white">
                              {lead.name
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {lead.name}
                          </span>
                        </td>
                        <td className="py-3.5 text-xs font-semibold text-slate-500">
                          {lead.company || "Private"}
                        </td>
                        <td className="py-3.5 text-right">
                          <StatusBadge status={lead.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Inactive Leads Detail Modal */}
      {inactiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setInactiveModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-850">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-rose-500 animate-pulse" />
                <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-100">
                  Inactive Leads Details
                </h3>
              </div>
              <button
                onClick={() => setInactiveModalOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List Body */}
            <div className="p-6 max-h-[400px] overflow-y-auto space-y-3.5 scrollbar-thin">
              {idleLeads.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-8">
                  All leads are active! Excellent work.
                </p>
              ) : (
                idleLeads.map((lead) => {
                  const idleDays = getIdleDays(lead);
                  return (
                    <div
                      key={lead._id}
                      onClick={() => {
                        setInactiveModalOpen(false);
                        navigate(`/leads/${lead._id}`);
                      }}
                      className="p-4 rounded-2xl bg-rose-50/[0.15] border border-rose-100/10 hover:bg-rose-50/20 hover:border-rose-150 transition cursor-pointer flex items-center justify-between gap-4 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5">
                          <p className="text-sm font-extrabold text-slate-800 dark:text-zinc-150 group-hover:text-rose-600 transition truncate">
                            {lead.name}
                          </p>
                          <StatusBadge status={lead.status} />
                        </div>
                        <p className="text-xs font-semibold text-slate-450 mt-1">
                          {lead.company || "Private Company"}
                        </p>
                      </div>
                      <span className="text-xs font-black bg-rose-100 text-rose-750 dark:bg-rose-950/40 dark:text-rose-400 px-3 py-1.5 rounded-xl shrink-0">
                        {idleDays} Days Idle
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
