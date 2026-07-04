import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Info
} from 'lucide-react';
import { sourcesApi } from '../services/api';
import type { Source } from '../types';
import toast from 'react-hot-toast';

export default function SourcesSettings() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  
  // Form States
  const [sourceName, setSourceName] = useState('');

  // Delete Confirmation States
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState<string>('');

  const loadSources = async () => {
    try {
      setLoading(true);
      const data = await sourcesApi.getAll();
      setSources(data);
    } catch {
      toast.error('Failed to load lead sources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleOpenAddModal = () => {
    setEditingSource(null);
    setSourceName('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (src: Source) => {
    setEditingSource(src);
    setSourceName(src.name);
    setModalOpen(true);
  };

  const handleSaveSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceName.trim()) {
      toast.error('Please enter a source name');
      return;
    }

    try {
      setLoading(true);
      if (editingSource) {
        // Edit mode
        await sourcesApi.update(editingSource._id, { name: sourceName.trim() });
        toast.success('Lead source updated successfully');
      } else {
        // Add mode
        await sourcesApi.create({ name: sourceName.trim() });
        toast.success('New lead source added');
      }
      setModalOpen(false);
      loadSources();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const triggerDeleteConfirm = (id: string, name: string) => {
    setDeleteTargetId(id);
    setDeleteTargetName(name);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;

    try {
      setLoading(true);
      await sourcesApi.delete(deleteTargetId);
      toast.success('Lead source deleted');
      setDeleteTargetId(null);
      loadSources();
    } catch {
      toast.error('Failed to delete source');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 w-full max-w-none space-y-6 bg-[#f0f2f5] dark:bg-zinc-950 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 dark:text-zinc-100 tracking-tight">Lead Sources Master</h1>
          <p className="text-sm text-gray-400 font-semibold mt-1">Manage channels (e.g., Google, References, WhatsApp) where leads are acquired</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/25 active:scale-95 duration-150 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4.5 h-4.5" />
          Add Source Channel
        </button>
      </div>

      {/* Info Alert Box */}
      <div className="flex items-start gap-3.5 p-5 bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100/30 dark:border-indigo-900/20 rounded-3xl">
        <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 leading-relaxed">
          Configuring sources here provides selectors when adding or updating lead profiles. Make sure to keep source names clear and concise.
        </div>
      </div>

      {/* Sources Grid List */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-850 rounded-3xl p-6 shadow-sm">
        {loading && sources.length === 0 ? (
          <div className="py-12 text-center text-sm font-bold text-gray-400">Loading sources...</div>
        ) : sources.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-sm font-extrabold text-gray-700 dark:text-zinc-300">No Lead Sources configured yet</p>
            <p className="text-xs text-gray-400">Click "Add Source Channel" above to build your acquisition list.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sources.map((src) => (
              <div 
                key={src._id}
                className="bg-slate-50/50 dark:bg-zinc-800/10 border border-border/40 rounded-2xl p-5 hover:bg-slate-50 transition duration-150 flex items-center justify-between group"
              >
                <div className="min-w-0 pr-2">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-zinc-150 truncate">{src.name}</h3>
                  <p className="text-[10px] text-gray-400 font-semibold mt-1">Acquisition Channel</p>
                </div>
                
                {/* Actions container */}
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEditModal(src)}
                    className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-gray-100 hover:border-gray-200 text-gray-500 hover:text-gray-800 transition"
                    title="Edit Name"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => triggerDeleteConfirm(src._id, src.name)}
                    className="p-2 rounded-xl bg-white hover:bg-rose-50 border border-gray-100 hover:border-rose-100 text-gray-500 hover:text-rose-600 transition"
                    title="Delete Channel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
              {/* Save Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 mx-4 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-zinc-850 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800 dark:text-zinc-100">
                {editingSource ? 'Edit Lead Source' : 'Add Lead Source'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-lg text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSource} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Source Name
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground transition"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="e.g. Google Search, Reference"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-155 dark:border-zinc-850">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-muted-foreground bg-secondary hover:bg-muted rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-sm font-semibold text-white bg-primary rounded-xl hover:opacity-90 disabled:opacity-50 transition"
                >
                  {loading ? 'Saving...' : 'Save Source'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTargetId(null)} />
          <div className="relative z-10 w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-850 p-6 mx-4 space-y-4">
            <h3 className="text-base font-bold text-gray-800 dark:text-zinc-100">Delete Lead Source?</h3>
            <p className="text-xs text-gray-500 leading-relaxed font-semibold">
              Are you sure you want to delete source <span className="font-extrabold text-rose-500">"{deleteTargetName}"</span>? Leads currently linked to this source name will retain their label string.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 text-xs font-bold text-muted-foreground bg-secondary hover:bg-muted rounded-xl transition"
              >
                No, Keep
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
