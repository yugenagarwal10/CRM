import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { leadsApi } from '../services/api';
import type { Lead, LeadStatus } from '../types';
import StatusBadge from '../components/StatusBadge';
import LeadForm from '../components/LeadForm';
import ImportModal from '../components/ImportModal';
import KanbanColumn from '../components/KanbanColumn';
import { useStatuses } from '../context/StatusContext';
import {
  Search,
  Plus,
  Building2,
  Mail,
  Phone,
  Pencil,
  Trash2,
  LayoutGrid,
  List,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';

type ViewMode = 'list' | 'kanban';

export default function Leads() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { statuses } = useStatuses();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? '');
  const [view, setView] = useState<ViewMode>('kanban');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Lead> | undefined>();
  const [defaultStatus, setDefaultStatus] = useState<LeadStatus>('New');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await leadsApi.getAll({
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setLeads(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, statusFilter]);

  useEffect(() => {
    const s = searchParams.get('status') ?? '';
    setStatusFilter(s);
  }, [searchParams]);

  const handleSave = async (data: Partial<Lead>) => {
    if (data._id) {
      await leadsApi.update(data._id, data);
    } else {
      await leadsApi.create(data);
    }
    await load();
  };

  const handleDelete = async (id: string) => {
    await leadsApi.delete(id);
    setDeleteId(null);
    await load();
  };

  // Kanban helpers
  const handleDrop = (leadId: string, newStatus: LeadStatus) => {
    setLeads((prev) =>
      prev.map((l) => (l._id === leadId ? { ...l, status: newStatus } : l))
    );
  };

  const handleAddLead = (status: LeadStatus) => {
    setDefaultStatus(status);
    setEditing(undefined);
    setFormOpen(true);
  };

  const byStatus = (status: LeadStatus) => {
    if (!search) return leads.filter((l) => l.status === status);
    const q = search.toLowerCase();
    return leads.filter(
      (l) =>
        l.status === status &&
        (l.name.toLowerCase().includes(q) ||
          l.company?.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q))
    );
  };

  return (
    <div className={`flex flex-col h-full ${view === 'kanban' ? 'bg-[#F7F8FA]' : 'bg-background'}`}>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-8 py-4 sm:py-5 bg-white border-b border-gray-100 shrink-0">
        <div className="flex items-center justify-between sm:block w-full sm:w-auto">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Leads</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {leads.length} lead{leads.length !== 1 ? 's' : ''} total
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          {/* Search — only in list mode */}
          {view === 'list' && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                className="pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30
                  placeholder:text-gray-300 text-gray-600 w-48 transition-all"
                placeholder="Search leads…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

          {/* Status filter — only in list mode */}
          {view === 'list' && (
            <select
              className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-primary/30 text-gray-600 transition-all"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                if (e.target.value) setSearchParams({ status: e.target.value });
                else setSearchParams({});
              }}
            >
              <option value="">All Statuses</option>
              {statuses.map((s) => (
                <option key={s._id} value={s.name}>{s.name}</option>
              ))}
            </select>
          )}

          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === 'list'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === 'kanban'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Kanban
            </button>
          </div>
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 text-sm font-semibold rounded-xl
              hover:bg-gray-50 shadow-sm transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Import from Excel
          </button>
          <button
            onClick={() => {
              setEditing(undefined);
              setDefaultStatus(statuses.length > 0 ? statuses[0].name : 'New');
              setFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl
              hover:bg-primary/90 shadow-md shadow-primary/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>
      </div>
      {view === 'list' && (
        <div className="flex-1 overflow-y-auto p-8">
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <p className="text-sm text-gray-400">No leads found.</p>
                <button
                  onClick={() => { setEditing(undefined); setFormOpen(true); }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-xl text-sm hover:opacity-90 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add your first lead
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Name</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Company</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Contact</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr
                        key={lead._id}
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group"
                      >
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-gray-800">{lead.name}</span>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          {lead.company && (
                            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                              <Building2 className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate max-w-[160px]">{lead.company}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          <div className="space-y-0.5">
                            {lead.email && (
                              <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                                <Mail className="w-3 h-3" />{lead.email}
                              </div>
                            )}
                            {lead.phone && (
                              <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                                <Phone className="w-3 h-3" />{lead.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={lead.status} />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/leads/${lead._id}`)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-600 transition"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setEditing(lead); setFormOpen(true); }}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-600 transition"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteId(lead._id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      {view === 'kanban' && (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-4 h-full p-6 min-w-max">
            {statuses.map((status) => (
              <KanbanColumn
                key={status._id}
                status={status.name}
                leads={byStatus(status.name)}
                onDrop={handleDrop}
                onAddLead={handleAddLead}
              />
            ))}
          </div>
        </div>
      )}
      <LeadForm
        open={formOpen}
        initial={editing ?? { status: defaultStatus }}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />
      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={load}
      />
    {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl mx-4 p-6">
            <h3 className="text-base font-bold text-gray-800 mb-1">Delete Lead?</h3>
            <p className="text-sm text-gray-400 mb-6">
              This will permanently delete the lead and all its reminders.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
