import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Lead, LeadStatus } from '../types';
import { leadsApi } from '../services/api';
import { Mail, Phone, Plus } from 'lucide-react';
import { useStatuses } from '../context/StatusContext';

interface Props {
  status: LeadStatus;
  leads: Lead[];
  onDrop: (leadId: string, newStatus: LeadStatus) => void;
  onAddLead: (status: LeadStatus) => void;
}

interface ColumnCfg {
  dot: string;
  header: string;
  badge: string;
  avatarBg: string;
  tagBg: string;
  tagText: string;
}

const getColumnStyles = (color: string): ColumnCfg => {
  const stylesMap: Record<string, ColumnCfg> = {
    indigo: {
      dot: 'bg-indigo-500',
      header: 'bg-gradient-to-r from-indigo-50/60 to-violet-50/60 border-indigo-100 dark:from-zinc-900 dark:to-zinc-850 dark:border-zinc-800',
      badge: 'bg-indigo-500 text-white',
      avatarBg: 'bg-gradient-to-br from-indigo-400 to-violet-500',
      tagBg: 'bg-indigo-50 dark:bg-indigo-950/20',
      tagText: 'text-indigo-600 dark:text-indigo-400',
    },
    blue: {
      dot: 'bg-blue-500',
      header: 'bg-gradient-to-r from-blue-50/60 to-indigo-50/60 border-blue-100 dark:from-zinc-900 dark:to-zinc-850 dark:border-zinc-800',
      badge: 'bg-blue-500 text-white',
      avatarBg: 'bg-gradient-to-br from-blue-400 to-indigo-500',
      tagBg: 'bg-blue-50 dark:bg-blue-950/20',
      tagText: 'text-blue-600 dark:text-blue-400',
    },
    purple: {
      dot: 'bg-purple-500',
      header: 'bg-gradient-to-r from-purple-50/60 to-fuchsia-50/60 border-purple-100 dark:from-zinc-900 dark:to-zinc-850 dark:border-zinc-800',
      badge: 'bg-purple-500 text-white',
      avatarBg: 'bg-gradient-to-br from-purple-400 to-fuchsia-500',
      tagBg: 'bg-purple-50 dark:bg-purple-950/20',
      tagText: 'text-purple-600 dark:text-purple-400',
    },
    amber: {
      dot: 'bg-amber-500',
      header: 'bg-gradient-to-r from-amber-50/60 to-yellow-50/60 border-amber-100 dark:from-zinc-900 dark:to-zinc-850 dark:border-zinc-800',
      badge: 'bg-amber-500 text-white',
      avatarBg: 'bg-gradient-to-br from-amber-400 to-yellow-500',
      tagBg: 'bg-amber-50 dark:bg-amber-950/20',
      tagText: 'text-amber-700 dark:text-amber-450',
    },
    emerald: {
      dot: 'bg-emerald-500',
      header: 'bg-gradient-to-r from-emerald-50/60 to-green-50/60 border-emerald-100 dark:from-zinc-900 dark:to-zinc-850 dark:border-zinc-800',
      badge: 'bg-emerald-500 text-white',
      avatarBg: 'bg-gradient-to-br from-emerald-400 to-green-500',
      tagBg: 'bg-emerald-50 dark:bg-emerald-950/20',
      tagText: 'text-emerald-700 dark:text-emerald-450',
    },
    rose: {
      dot: 'bg-rose-500',
      header: 'bg-gradient-to-r from-rose-50/60 to-pink-50/60 border-rose-100 dark:from-zinc-900 dark:to-zinc-850 dark:border-zinc-800',
      badge: 'bg-rose-500 text-white',
      avatarBg: 'bg-gradient-to-br from-rose-400 to-pink-500',
      tagBg: 'bg-rose-50 dark:bg-rose-950/20',
      tagText: 'text-rose-600 dark:text-rose-455',
    },
    teal: {
      dot: 'bg-teal-500',
      header: 'bg-gradient-to-r from-teal-50/60 to-emerald-50/60 border-teal-100 dark:from-zinc-900 dark:to-zinc-850 dark:border-zinc-800',
      badge: 'bg-teal-500 text-white',
      avatarBg: 'bg-gradient-to-br from-teal-400 to-emerald-500',
      tagBg: 'bg-teal-50 dark:bg-teal-950/20',
      tagText: 'text-teal-700 dark:text-teal-450',
    },
    orange: {
      dot: 'bg-orange-500',
      header: 'bg-gradient-to-r from-orange-50/60 to-amber-50/60 border-orange-100 dark:from-zinc-900 dark:to-zinc-850 dark:border-zinc-800',
      badge: 'bg-orange-500 text-white',
      avatarBg: 'bg-gradient-to-br from-orange-400 to-amber-500',
      tagBg: 'bg-orange-50 dark:bg-orange-950/20',
      tagText: 'text-orange-755 dark:text-orange-450',
    },
    pink: {
      dot: 'bg-pink-500',
      header: 'bg-gradient-to-r from-pink-50/60 to-rose-50/60 border-pink-100 dark:from-zinc-900 dark:to-zinc-850 dark:border-zinc-800',
      badge: 'bg-pink-500 text-white',
      avatarBg: 'bg-gradient-to-br from-pink-400 to-rose-500',
      tagBg: 'bg-pink-50 dark:bg-pink-950/20',
      tagText: 'text-pink-600 dark:text-pink-450',
    },
    gray: {
      dot: 'bg-gray-500',
      header: 'bg-gradient-to-r from-gray-50/60 to-zinc-100 border-gray-250 dark:from-zinc-900 dark:to-zinc-850 dark:border-zinc-800',
      badge: 'bg-gray-500 text-white',
      avatarBg: 'bg-gradient-to-br from-gray-400 to-zinc-500',
      tagBg: 'bg-gray-100 dark:bg-zinc-800',
      tagText: 'text-gray-750 dark:text-zinc-300',
    },
  };
  return stylesMap[color] || stylesMap.indigo;
};

/* ── helpers ──────────────────────────────────────────── */
function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return '1d ago';
  return `${d}d ago`;
}

/* ── Lead Card ────────────────────────────────────────── */
function LeadCard({
  lead,
  cfg,
  onDragStart,
  onClick,
}: {
  lead: Lead;
  cfg: ColumnCfg;
  onDragStart: (e: React.DragEvent) => void;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative bg-white rounded-2xl border border-gray-100 p-4 cursor-pointer select-none
        transition-all duration-200 group
        ${hovered ? 'shadow-lg shadow-gray-200/80 -translate-y-0.5 border-gray-200' : 'shadow-sm shadow-gray-100'}`}
    >
      {/* Drag indicator stripe */}
      <div
        className={`absolute left-0 top-3 bottom-3 w-[4px] rounded-full ${cfg.dot} opacity-0 group-hover:opacity-100 transition-opacity`}
      />
      {/* Lead name */}
      <p className="text-[18px] font-black text-gray-800 leading-snug mb-3.5 line-clamp-2">
        {lead.name}
      </p>

      {/* Contact meta */}
      <div className="space-y-2 mb-4">
        {lead.email && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-gray-50 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-gray-400" />
            </div>
            <span className="text-[14px] text-gray-600 font-bold truncate">{lead.email}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-gray-50 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4 text-gray-400" />
            </div>
            <span className="text-[14px] text-gray-600 font-bold">{lead.phone}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full ${cfg.avatarBg} flex items-center justify-center shadow-sm`}
        >
          <span className="text-[12px] font-extrabold text-white tracking-wide">
            {initials(lead.name)}
          </span>
        </div>

        {/* Date */}
        <span className="text-[13px] text-gray-400 font-bold">
          {timeAgo(lead.createdAt)}
        </span>
      </div>
    </div>
  );
}

/* ── Kanban Column ────────────────────────────────────── */
export default function KanbanColumn({ status, leads, onDrop, onAddLead }: Props) {
  const navigate = useNavigate();
  const [dragOver, setDragOver] = useState(false);
  const { statuses } = useStatuses();
  const matchedStatus = statuses.find(s => s.name === status);
  const cfg = getColumnStyles(matchedStatus?.color || 'indigo');

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only fire if leaving the column entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) {
      await leadsApi.update(leadId, { status });
      onDrop(leadId, status);
    }
  };

  return (
    <div
      className={`flex flex-col w-[300px] shrink-0 rounded-2xl transition-all duration-200 ${
        dragOver
          ? 'ring-2 ring-primary/40 bg-primary/[0.03] scale-[1.01]'
          : 'bg-gray-50/80'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ── Column Header ── */}
      <div className={`px-4 py-3.5 rounded-t-2xl border ${cfg.header}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className={`w-3.5 h-3.5 rounded-full ${cfg.dot} shadow-sm`} />
            <span className="text-[16px] font-extrabold text-gray-800 tracking-wide">
              {status}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-[13px] font-extrabold px-2.5 py-0.5 rounded-full ${cfg.badge}`}>
              {leads.length}
            </span>
          </div>
        </div>
      </div>

      {/* ── Cards area ── */}
      <div className="flex-1 px-3 py-3 space-y-2.5 overflow-y-auto">
        {/* Empty drop zone */}
        {leads.length === 0 && (
          <div
            className={`flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed transition-colors ${
              dragOver ? 'border-primary/40 bg-primary/5' : 'border-gray-200'
            }`}
          >
            <p className="text-sm text-gray-400 font-bold">Drop lead here</p>
          </div>
        )}

        {leads.map((lead) => (
          <LeadCard
            key={lead._id}
            lead={lead}
            cfg={cfg}
            onDragStart={(e) => handleDragStart(e, lead._id)}
            onClick={() => navigate(`/leads/${lead._id}`)}
          />
        ))}
      </div>

      {/* ── Add card button ── */}
      <div className="px-3 pb-3">
        <button
          onClick={() => onAddLead(status)}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-400
            hover:text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100
            transition-all duration-150 group"
        >
          <Plus className="w-4 h-4 group-hover:text-primary transition-colors" />
          Add lead
        </button>
      </div>
    </div>
  );
}
