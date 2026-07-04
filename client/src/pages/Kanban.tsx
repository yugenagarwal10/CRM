import { useEffect, useState } from 'react';
import { leadsApi } from '../services/api';
import type { Lead, LeadStatus } from '../types';
import { LEAD_STATUSES } from '../types';
import KanbanColumn from '../components/KanbanColumn';
import LeadForm from '../components/LeadForm';
import { Plus, RefreshCw } from 'lucide-react';

export default function Kanban() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<LeadStatus>('New');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await leadsApi.getAll();
      setLeads(data);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    const data = await leadsApi.getAll();
    setLeads(data);
    setRefreshing(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDrop = (leadId: string, newStatus: LeadStatus) => {
    setLeads((prev) =>
      prev.map((l) => (l._id === leadId ? { ...l, status: newStatus } : l))
    );
  };

  const handleSave = async (data: Partial<Lead>) => {
    await leadsApi.create(data);
    await load();
  };

  const handleAddLead = (status: LeadStatus) => {
    setDefaultStatus(status);
    setFormOpen(true);
  };

  const byStatus = (status: LeadStatus) => leads.filter((l) => l.status === status);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F7F8FA]">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Kanban Board</h1>
          <p className="text-xs text-gray-400 mt-0.5">Drag & drop to update lead status</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => handleAddLead('New')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl
              hover:bg-primary/90 shadow-md shadow-primary/20 transition-all duration-200 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* ── Board ── */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 h-full p-6 min-w-max">
          {LEAD_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              leads={byStatus(status)}
              onDrop={handleDrop}
              onAddLead={handleAddLead}
            />
          ))}
        </div>
      </div>

      {/* ── Modal ── */}
      <LeadForm
        open={formOpen}
        initial={{ status: defaultStatus }}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
