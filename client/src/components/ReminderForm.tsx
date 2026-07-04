import { useState, useEffect } from 'react';
import type { Reminder } from '../types';

interface Props {
  open: boolean;
  leadId: string;
  initial?: Partial<Reminder>;
  onClose: () => void;
  onSave: (data: Partial<Reminder>) => Promise<void>;
}

const today = new Date().toISOString().split('T')[0];

const empty: Partial<Reminder> = {
  title: '',
  date: today,
  time: '09:00',
  note: '',
};

export default function ReminderForm({ open, leadId, initial, onClose, onSave }: Props) {
  const [form, setForm] = useState<Partial<Reminder>>(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(initial ? { ...empty, ...initial } : { ...empty, leadId });
    setError('');
  }, [initial, open, leadId]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim()) {
      setError('Title is required');
      return;
    }
    if (!form.date) {
      setError('Date is required');
      return;
    }
    setLoading(true);
    try {
      await onSave({ ...form, leadId });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-card rounded-xl shadow-2xl border border-border mx-4">
        <div className="px-6 py-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {initial?._id ? 'Edit Reminder' : 'Add Reminder'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              value={form.title ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Follow-up call"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Date <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                value={form.date ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Time <span className="text-destructive">*</span>
              </label>
              <input
                type="time"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                value={form.time ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Note (optional)
            </label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition resize-none"
              value={form.note ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              placeholder="Any extra context..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground bg-secondary rounded-lg hover:bg-muted transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading ? 'Saving...' : initial?._id ? 'Save Changes' : 'Add Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
