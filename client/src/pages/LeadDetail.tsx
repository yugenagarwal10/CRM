import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { leadsApi, activitiesApi, remindersApi } from "../services/api";
import type { Lead, Activity, ActivityType, Reminder } from "../types";
import StatusBadge from "../components/StatusBadge";
import LeadForm from "../components/LeadForm";
import { useStatuses } from "../context/StatusContext";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  FileText,
  Pencil,
  Trash2,
  AlertTriangle,
  MessageSquare,
  History,
  Sparkles,
  CheckCircle2,
  Send,
  MessageCircle,
  X,
  Plus,
  Calendar,
  Briefcase,
} from "lucide-react";

// Format date nicely
function formatActivityTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { statuses } = useStatuses();

  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const [leadFormOpen, setLeadFormOpen] = useState(false);
  const [deleteLeadOpen, setDeleteLeadOpen] = useState(false);

  // Custom Reminders States
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [reminderNote, setReminderNote] = useState("");

  // Delete Reminder Confirmation States
  const [deleteReminderId, setDeleteReminderId] = useState<string | null>(null);
  const [deleteReminderTitle, setDeleteReminderTitle] = useState<string>("");

  // Direct activity input states
  const [activityDesc, setActivityDesc] = useState("");
  const [submittingActivity, setSubmittingActivity] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  const loadReminders = async () => {
    if (!id) return;
    try {
      const data = await remindersApi.getAll({ leadId: id });
      setReminders(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadLead = async () => {
    if (!id) return;
    try {
      const [l, acts] = await Promise.all([
        leadsApi.getById(id),
        activitiesApi.getAll(id),
        loadReminders(),
      ]);
      setLead(l);
      setActivities(acts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleLeadSave = async (data: Partial<Lead>) => {
    if (!id) return;
    await leadsApi.update(id, data);
    await loadLead();
  };

  const handleWhatsAppFollowUp = async () => {
    if (!lead || !lead.phone) return;

    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );

    let newTab: Window | null = null;
    if (!isMobile) {
      newTab = window.open("about:blank", "_blank");
      if (newTab) {
        newTab.document.write(`
          <html>
            <head>
              <title>Opening WhatsApp...</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                  background-color: #f3f4f6;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
                  color: #4b5563;
                }
                .container {
                  text-align: center;
                  background: white;
                  padding: 24px;
                  border-radius: 16px;
                  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                }
                .spinner {
                  border: 3px solid #f3f3f3;
                  border-top: 3px solid #10b981;
                  border-radius: 50%;
                  width: 30px;
                  height: 30px;
                  animation: spin 1s linear infinite;
                  margin: 0 auto 12px auto;
                }
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="spinner"></div>
                <div>Redirecting directly to WhatsApp Web...</div>
              </div>
            </body>
          </html>
        `);
      }
    }

    setGeneratingAI(true);
    try {
      const res = await leadsApi.getAiFollowup(lead._id);
      let num = lead.phone.replace(/\D/g, ""); // keep only digits
      if (num.startsWith("0") && num.length === 11) {
        num = num.substring(1);
      }
      if (num.length === 10) {
        num = "91" + num;
      }

      const encodedText = encodeURIComponent(res.message);

      if (isMobile) {
        window.location.href = `whatsapp://send?phone=${num}&text=${encodedText}`;
      } else {
        const desktopUrl = `https://web.whatsapp.com/send?phone=${num}&text=${encodedText}`;
        if (newTab) {
          newTab.location.href = desktopUrl;
        } else {
          window.open(desktopUrl, "_blank", "noopener,noreferrer");
        }
      }
    } catch (err) {
      console.error("Failed to generate AI follow-up message:", err);
      if (newTab) newTab.close();
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!id) return;
    await leadsApi.delete(id);
    navigate("/leads");
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !reminderTitle.trim() || !reminderDate || !reminderTime) return;
    try {
      await remindersApi.create({
        leadId: id,
        title: reminderTitle.trim(),
        date: reminderDate,
        time: reminderTime,
        note: reminderNote.trim(),
      });
      toast.success("Reminder added successfully!");
      setReminderModalOpen(false);
      setReminderTitle("");
      setReminderDate("");
      setReminderTime("");
      setReminderNote("");
      await loadReminders();
      await loadLead(); // reload activity log
    } catch (err) {
      toast.error("Failed to add reminder");
    }
  };

  const handleDeleteReminder = (remId: string, title: string) => {
    setDeleteReminderId(remId);
    setDeleteReminderTitle(title);
  };

  const confirmDeleteReminder = async () => {
    if (!deleteReminderId) return;
    try {
      await remindersApi.delete(deleteReminderId);
      toast.success("Reminder deleted!");
      setDeleteReminderId(null);
      await loadReminders();
      await loadLead(); // reload activity log
    } catch (err) {
      toast.error("Failed to delete reminder");
    }
  };

  const handleLogActivityDirect = async () => {
    if (!id || !activityDesc.trim()) return;

    setSubmittingActivity(true);
    try {
      await activitiesApi.create({
        leadId: id,
        type: "other",
        title: "Comment Added",
        description: activityDesc,
      });
      setActivityDesc("");

      // Reload lead details and activities
      await loadLead();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingActivity(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
        <AlertTriangle className="w-12 h-12 text-destructive animate-pulse" />
        <p className="text-muted-foreground font-medium">Lead not found.</p>
        <button
          onClick={() => navigate("/leads")}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground text-sm font-medium rounded-lg hover:bg-muted transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </button>
      </div>
    );
  }

  // Get initials for profile picture representation
  const initials = lead.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Helper to render activity icon
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "lead_created":
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      case "status_changed":
        return <History className="w-4 h-4 text-amber-500" />;
      case "reminder_created":
        return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-indigo-500" />;
    }
  };


  const getHeaderStripBg = (type: ActivityType) => {
    switch (type) {
      case "lead_created":
        return "bg-purple-50/70 dark:bg-purple-950/20 border-b border-purple-100 dark:border-purple-900/30 text-purple-700 dark:text-purple-300";
      case "status_changed":
        return "bg-amber-50/70 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-300";
      case "reminder_created":
        return "bg-blue-50/70 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-300";
      default:
        return "bg-indigo-50/70 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/30 text-indigo-750 dark:text-indigo-300";
    }
  };

  // Dynamic Stepper statuses builder based on DB configuration
  const standardStatuses = statuses
    .filter((s) => s.type === "standard")
    .map((s) => s.name);
  const currentStatusCfg = statuses.find((s) => s.name === lead.status);

  let stepperStatuses: string[] = [];
  if (currentStatusCfg?.type === "lost") {
    stepperStatuses = [...standardStatuses, lead.status];
  } else {
    const wonStatuses = statuses
      .filter((s) => s.type === "won")
      .map((s) => s.name);
    stepperStatuses = [...standardStatuses, ...wonStatuses];
  }

  const currentIdx = stepperStatuses.indexOf(lead.status);

  return (
    <div className="p-4 sm:p-6 w-full max-w-none space-y-5 bg-[#f0f2f5] dark:bg-zinc-950 h-full xl:h-[calc(100vh-40px)] xl:max-h-[calc(100vh-40px)] xl:min-h-0 xl:overflow-hidden xl:flex xl:flex-col">
      {/* Back button and quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => navigate("/leads")}
          className="group flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all duration-200"
        >
          <div className="p-1.5 rounded-lg border border-gray-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 group-hover:bg-gray-50 transition-colors duration-200 shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Leads
        </button>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setLeadFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-white border border-gray-250 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 shadow-sm rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition duration-200"
          >
            <Pencil className="w-4 h-4 text-gray-400" />
            Edit Lead
          </button>
          <button
            onClick={() => setDeleteLeadOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 rounded-xl hover:bg-rose-100/70 transition duration-200"
          >
            <Trash2 className="w-4 h-4" />
            Delete Lead
          </button>
        </div>
      </div>

      {/* Main Grid: Interchange layouts (Left: Activity Log (2/3 width), Right: Lead Info (1/3 width)) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 xl:h-[calc(100vh-130px)] xl:min-h-0">
        {/* Left Column (2/3 width): WhatsApp Style Chat Interface */}
        <div className="xl:col-span-2 order-2 xl:order-1 xl:h-full xl:min-h-0">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-2xl flex flex-col h-[500px] sm:h-[620px] xl:h-full xl:min-h-0 shadow-sm overflow-hidden">
            {/* Header Profile Bar */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-white text-sm font-black shadow-md shadow-primary/10 select-none">
                  {initials}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-800 dark:text-zinc-100 leading-tight">
                    {lead.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                      Activity Log
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Body (Timeline thread) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#efeae2] dark:bg-zinc-950/40">
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center h-full">
                  <div className="p-4 bg-white dark:bg-zinc-900 rounded-full shadow-sm border border-gray-100 dark:border-zinc-800 mb-3">
                    <MessageSquare className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm font-bold text-gray-700 dark:text-zinc-300">
                    No events logged yet
                  </p>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">
                    Write a title and description below to add new client
                    updates.
                  </p>
                </div>
              ) : (
                // Connected vertical timeline line
                <div className="relative border-l-2 border-indigo-300 dark:border-zinc-700 ml-4 pl-6 md:ml-6 md:pl-8 py-2 space-y-6">
                  {activities.map((act) => {
                    return (
                      <div
                        key={act._id}
                        className="relative flex justify-start"
                      >
                        {/* Timeline Icon Badge centered on the vertical line */}
                        <div className="absolute -left-[42px] md:-left-[50px] top-3 w-9 h-9 rounded-full bg-white dark:bg-zinc-900 border-2 border-indigo-100 dark:border-zinc-800 flex items-center justify-center shadow-sm z-10 select-none">
                          {getActivityIcon(act.type)}
                        </div>

                        {/* Chat Bubble Card */}
                        <div className="relative w-fit max-w-[85%] bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl rounded-tl-none overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md">
                          {/* Triangle tail for chat bubble */}
                          <div className="absolute top-0 -left-1.5 w-0 h-0 border-t-[10px] border-t-white dark:border-t-zinc-900 border-l-[8px] border-l-transparent" />

                          {/* Top Header Strip */}
                          <div
                            className={`px-4 py-2 flex items-center justify-between gap-8 text-[13.5px] font-bold ${getHeaderStripBg(act.type)}`}
                          >
                            <span>
                              Added by{" "}
                              <span className="font-extrabold text-gray-800 dark:text-zinc-150">
                                {(act as any).createdBy?.name || "System"}
                              </span>
                            </span>
                            <span
                              title={new Date(act.createdAt).toLocaleString()}
                              className="text-[12px] opacity-80 font-semibold"
                            >
                              {formatActivityTime(act.createdAt)}
                            </span>
                          </div>

                          {/* Body Content Area */}
                          <div className="p-4 space-y-1.5">
                            <span className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest leading-none block">
                              {act.title}
                            </span>

                            {act.description && (
                              <p className="text-sm text-gray-850 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed font-semibold">
                                {act.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sticky Bottom Chat Input Section */}
            <div className="p-4 border-t border-gray-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 shadow-inner">
              <div className="flex items-end gap-2.5">
                <textarea
                  placeholder="Type description or detail notes here..."
                  rows={2}
                  value={activityDesc}
                  onChange={(e) => setActivityDesc(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleLogActivityDirect();
                    }
                  }}
                  className="flex-1 px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-foreground resize-none leading-relaxed placeholder:text-gray-450 transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={handleLogActivityDirect}
                  disabled={submittingActivity || !activityDesc.trim()}
                  className="p-3 rounded-full bg-primary text-white hover:opacity-90 disabled:opacity-40 transition-all shrink-0 shadow-md shadow-primary/20 flex items-center justify-center active:scale-95 duration-200"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width): Lead Profile & Details */}
        <div className="xl:col-span-1 order-1 xl:order-2 xl:h-full xl:overflow-y-auto pr-1 scrollbar-thin">
          <div className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary to-indigo-500" />

            {/* Header Area */}
            <div className="flex flex-col items-center text-center pb-5 border-b border-gray-100 dark:border-zinc-800/80">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-primary/20 mb-4 select-none">
                {initials}
              </div>
              <div className="min-w-0 w-full space-y-1">
                <h1 className="text-xl font-black text-gray-800 dark:text-zinc-100 tracking-tight leading-snug truncate">
                  {lead.name}
                </h1>
                {lead.company ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-850 rounded-lg text-gray-500 font-bold text-xs truncate max-w-full">
                    <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{lead.company}</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-gray-400 block italic">
                    No company registered
                  </span>
                )}
              </div>

              {/* Current Status Badge separately */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Status:
                </span>
                <StatusBadge status={lead.status} />
              </div>

              {/* Horizontal Pipeline Status Stepper */}
              <div className="w-full flex items-center justify-between mt-6 px-1 pb-4">
                {stepperStatuses.map((s, idx) => {
                  const isActive = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div
                      key={s}
                      className="flex-1 flex items-center last:flex-none"
                    >
                      <div className="flex flex-col items-center relative">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all duration-300 ${
                            isCurrent
                              ? s === "Won"
                                ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10"
                                : s === "Lost"
                                  ? "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/10"
                                  : "bg-primary border-primary text-white scale-110 shadow-md shadow-primary/20"
                              : isActive
                                ? "bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/30"
                                : "bg-white border-gray-200 text-gray-300 dark:bg-zinc-950 dark:border-zinc-800"
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <span
                          className={`text-[8.5px] font-black uppercase tracking-wider mt-2 absolute top-6 whitespace-nowrap ${
                            isCurrent
                              ? s === "Won"
                                ? "text-emerald-500"
                                : s === "Lost"
                                  ? "text-rose-500"
                                  : "text-primary"
                              : isActive
                                ? "text-gray-700 dark:text-zinc-300"
                                : "text-gray-300 dark:text-zinc-650"
                          }`}
                        >
                          {s}
                        </span>
                      </div>
                      {idx < stepperStatuses.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 mx-1 transition-all duration-300 ${
                            isActive && idx < currentIdx
                              ? "bg-indigo-300 dark:bg-indigo-900/60"
                              : "bg-gray-150 dark:bg-zinc-800"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grouped Contact Details Card */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest block select-none">
                Contact Information
              </h4>

              <div className="bg-gray-50 dark:bg-zinc-950/40 border border-gray-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
                {/* Email Row */}
                <div className="flex items-center gap-3.5 p-3.5 hover:bg-white dark:hover:bg-zinc-900/20 transition duration-150">
                  <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 shrink-0">
                    <Mail className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                      Email
                    </span>
                    {lead.email ? (
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-sm font-extrabold text-gray-700 dark:text-zinc-200 hover:text-primary transition truncate block mt-0.5"
                      >
                        {lead.email}
                      </a>
                    ) : (
                      <span className="text-sm font-semibold text-gray-450 italic mt-0.5 block">
                        Not provided
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-150 dark:border-zinc-850" />

                {/* Phone Row */}
                <div className="flex items-center gap-3.5 p-3.5 hover:bg-white dark:hover:bg-zinc-900/20 transition duration-150">
                  <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 shrink-0">
                    <Phone className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                      Phone
                    </span>
                    {lead.phone ? (
                      <a
                        href={`tel:${lead.phone}`}
                        className="text-sm font-extrabold text-gray-700 dark:text-zinc-200 hover:text-primary transition truncate block mt-0.5"
                      >
                        {lead.phone}
                      </a>
                    ) : (
                      <span className="text-sm font-semibold text-gray-450 italic mt-0.5 block">
                        Not provided
                      </span>
                    )}
                  </div>
                  {/* Compact WhatsApp Action Button next to phone number */}
                  {lead.phone && (
                    <button
                      onClick={handleWhatsAppFollowUp}
                      disabled={generatingAI}
                      title="Send WhatsApp Follow-up (AI Generated)"
                      className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white transition-all shadow-sm active:scale-95 duration-200 shrink-0 flex items-center justify-center"
                    >
                      {generatingAI ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <MessageCircle className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>

                <div className="border-t border-gray-150 dark:border-zinc-850" />

                {/* Reminder Date Row */}
                <div className="flex items-center gap-3.5 p-3.5 hover:bg-white dark:hover:bg-zinc-900/20 transition duration-150">
                  <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 shrink-0">
                    <Calendar className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                      Reminder Date
                    </span>
                    {lead.status === "Won" || lead.status === "Lost" ? (
                      <span className="text-sm font-extrabold text-gray-450 dark:text-zinc-555 mt-0.5 block">
                        Alerts disabled
                      </span>
                    ) : lead.lastActivityAt ? (
                      <span className="text-sm font-extrabold text-gray-700 dark:text-zinc-200 block mt-0.5">
                        {new Date(
                          new Date(lead.lastActivityAt).getTime() +
                            (lead.inactiveLimitDays ?? 2) * 24 * 60 * 60 * 1000,
                        ).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-gray-450 italic mt-0.5 block">
                        Not scheduled
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-150 dark:border-zinc-850" />

                {/* Lead Source Row */}
                <div className="flex items-center gap-3.5 p-3.5 hover:bg-white dark:hover:bg-zinc-900/20 transition duration-150">
                  <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 shrink-0">
                    <Briefcase className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                      Lead Source
                    </span>
                    {lead.source ? (
                      <span className="text-sm font-extrabold text-gray-700 dark:text-zinc-200 block mt-0.5">
                        {lead.source}
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-gray-400 italic mt-0.5 block">
                        Not specified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Referral Info Row */}
            {lead.referrerId && (
              <div className="pt-4 border-t border-gray-150 dark:border-zinc-800 space-y-3">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest block select-none">
                  Referred By
                </h4>
                <div className="bg-indigo-50/20 dark:bg-zinc-950/20 border border-indigo-100/30 dark:border-zinc-850 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-indigo-650 dark:text-indigo-400">
                      {lead.referrerId.name}
                    </span>
                  </div>
                  {lead.referrerId.email && (
                    <div className="text-sm font-bold text-gray-650 dark:text-zinc-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <a href={`mailto:${lead.referrerId.email}`} className="hover:text-primary transition">
                        {lead.referrerId.email}
                      </a>
                    </div>
                  )}
                  {lead.referrerId.phone && (
                    <div className="text-sm font-bold text-gray-650 dark:text-zinc-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <a href={`tel:${lead.referrerId.phone}`} className="hover:text-primary transition">
                        {lead.referrerId.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Custom Reminders Card Section */}
            <div className="pt-5 border-t border-gray-150 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-3 text-[11px] font-black uppercase tracking-widest text-rose-650 dark:text-rose-400 select-none">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-rose-50 dark:bg-rose-950/20">
                    <CheckCircle2 className="w-4 h-4 text-rose-500" />
                  </div>
                  Action Reminders
                </div>
                <button
                  onClick={() => setReminderModalOpen(true)}
                  className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-rose-600 dark:text-rose-400 transition duration-150"
                  title="Add Reminder"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {reminders.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">
                    No reminders scheduled.
                  </p>
                ) : (
                  reminders.map((rem) => (
                    <div
                      key={rem._id}
                      className="p-4 rounded-xl bg-slate-50/70 dark:bg-zinc-950/40 border border-gray-150 dark:border-zinc-850 flex items-start justify-between gap-2 group hover:border-indigo-200 dark:hover:border-zinc-800 transition duration-150"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold text-gray-850 dark:text-zinc-150 leading-snug">
                          {rem.title}
                        </p>
                        <p className="text-[11.5px] font-bold text-gray-500 dark:text-zinc-400 mt-1.5">
                          {rem.date} @ {rem.time}
                        </p>
                        {rem.note && (
                          <p className="text-[12px] font-semibold text-gray-450 dark:text-zinc-500 italic mt-1.5 leading-relaxed">
                            {rem.note}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteReminder(rem._id, rem.title)}
                        className="p-1 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50/50 dark:hover:bg-zinc-800 transition opacity-0 group-hover:opacity-100 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Notes Summary Card Section */}
            <div className="pt-5 border-t border-gray-150 dark:border-zinc-800">
              <div className="flex items-center gap-2 mb-3 text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 select-none">
                <div className="p-1 rounded bg-amber-50 dark:bg-amber-950/20">
                  <FileText className="w-4.5 h-4.5 text-amber-500" />
                </div>
                Notes Summary
              </div>
              <div className="p-4 rounded-2xl bg-amber-50/20 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/10 max-h-[160px] overflow-y-auto leading-relaxed shadow-sm">
                {lead.notes ? (
                  <p className="text-sm text-gray-750 dark:text-zinc-300 font-semibold whitespace-pre-wrap">
                    {lead.notes}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    No notes captured for this lead.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Lead Edit Form */}
        <LeadForm
          open={leadFormOpen}
          initial={lead}
          onClose={() => setLeadFormOpen(false)}
          onSave={handleLeadSave}
        />

        {/* Delete Lead Confirm */}
        {deleteLeadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setDeleteLeadOpen(false)}
            />
            <div className="relative z-10 w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-border mx-4 p-6">
              <div className="p-3 bg-destructive/10 text-destructive rounded-full w-fit mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                Delete Lead?
              </h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                This will permanently delete{" "}
                <span className="font-semibold text-foreground">
                  {lead.name}
                </span>{" "}
                and all associated reminders and activities. This action cannot
                be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteLeadOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-muted-foreground bg-secondary hover:bg-muted rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteLead}
                  className="px-4 py-2 text-sm font-semibold text-white bg-destructive hover:opacity-90 rounded-xl transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Reminder Add Modal */}
        {reminderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setReminderModalOpen(false)}
            />
            <div className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 mx-4 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-850">
                <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-100">
                  Add Action Reminder
                </h3>
                <button
                  onClick={() => setReminderModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAddReminder} className="p-6 space-y-4">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[13px] font-black text-gray-450 uppercase tracking-widest block">
                    Reminder Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Call client for price validation"
                    value={reminderTitle}
                    onChange={(e) => setReminderTitle(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-foreground transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Date */}
                  <div className="space-y-1">
                    <label className="text-[12px] font-black text-gray-450 uppercase tracking-widest block">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={reminderDate}
                      onChange={(e) => setReminderDate(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-foreground transition-all"
                    />
                  </div>
                  {/* Time */}
                  <div className="space-y-1">
                    <label className="text-[12px] font-black text-gray-450 uppercase tracking-widest block">
                      Time
                    </label>
                    <input
                      type="time"
                      required
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-foreground transition-all"
                    />
                  </div>
                </div>

                {/* Note */}
                <div className="space-y-1">
                  <label className="text-[12px] font-black text-gray-455 uppercase tracking-widest block">
                    Additional Note (Optional)
                  </label>
                  <textarea
                    placeholder="Enter details..."
                    rows={2}
                    value={reminderNote}
                    onChange={(e) => setReminderNote(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-foreground transition-all resize-none"
                  />
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-zinc-850 mt-5">
                  <button
                    type="button"
                    onClick={() => setReminderModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-100 dark:shadow-none"
                  >
                    Create Reminder
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {deleteReminderId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setDeleteReminderId(null)}
            />
            <div className="relative z-10 w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-border mx-4 p-6">
              <h3 className="text-lg font-bold text-foreground mb-2">
                Delete Reminder?
              </h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Are you sure you want to permanently delete the reminder{" "}
                <span className="font-semibold text-foreground">
                  "{deleteReminderTitle}"
                </span>
                ?
              </p>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-zinc-850">
                <button
                  type="button"
                  onClick={() => setDeleteReminderId(null)}
                  className="px-4 py-2.5 text-sm font-semibold text-muted-foreground bg-secondary hover:bg-muted rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteReminder}
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-destructive hover:opacity-90 rounded-xl transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
