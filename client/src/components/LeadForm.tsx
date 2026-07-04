import { useState, useEffect, useRef } from 'react';
import type { Lead, Referrer, Source } from '../types';
import { ChevronDown, Check } from 'lucide-react';
import { useStatuses } from '../context/StatusContext';
import { referrersApi, leadsApi, sourcesApi } from '../services/api';

interface Props {
  open: boolean;
  initial?: Partial<Lead>;
  onClose: () => void;
  onSave: (data: Partial<Lead>) => Promise<void>;
}

const empty: Partial<Lead> = {
  name: '',
  company: '',
  email: '',
  phone: '',
  notes: '',
  status: 'New',
  inactiveLimitDays: 2,
};

const getStatusDot = (color: string) => {
  const mapping: Record<string, string> = {
    indigo: 'bg-indigo-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
    teal: 'bg-teal-500',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500',
    gray: 'bg-gray-500',
  };
  return mapping[color] || 'bg-indigo-500';
};

export default function LeadForm({ open, initial, onClose, onSave }: Props) {
  const { statuses } = useStatuses();
  const [form, setForm] = useState<Partial<Lead>>(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Custom dropdown open state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Referrer & Suggestion States
  interface SuggestionItem {
    name: string;
    email: string;
    phone: string;
    source: 'referrer' | 'lead';
  }
  const [referrerName, setReferrerName] = useState('');
  const [referrerEmail, setReferrerEmail] = useState('');
  const [referrerPhone, setReferrerPhone] = useState('');
  const [allReferrers, setAllReferrers] = useState<Referrer[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [referrerSuggestions, setReferrerSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);

  useEffect(() => {
    const defaultStatus = statuses.length > 0 ? statuses[0].name : 'New';
    setForm(initial ? { ...empty, status: defaultStatus, ...initial } : { ...empty, status: defaultStatus });
    setReferrerName(initial?.referrerId?.name || '');
    setReferrerEmail(initial?.referrerId?.email || '');
    setReferrerPhone(initial?.referrerId?.phone || '');
    setError('');
    setDropdownOpen(false);
    setShowSuggestions(false);
  }, [initial, open]);

  useEffect(() => {
    if (open) {
      referrersApi.getAll().then((data) => {
        setAllReferrers(data);
      }).catch(console.error);

      leadsApi.getAll().then((data) => {
        const currentId = initial?._id;
        const filteredLeads = currentId ? data.filter(l => l._id !== currentId) : data;
        setAllLeads(filteredLeads);
      }).catch(console.error);

      sourcesApi.getAll().then((data) => {
        setSources(data);
      }).catch(console.error);
    }
  }, [open, initial]);

  const handleReferrerNameChange = (val: string) => {
    setReferrerName(val);
    if (val.trim()) {
      const q = val.toLowerCase();
      const filteredRefs = allReferrers
        .filter(r => r.name.toLowerCase().includes(q))
        .map(r => ({
          name: r.name,
          email: r.email,
          phone: r.phone,
          source: 'referrer' as const
        }));
      
      const filteredLeads = allLeads
        .filter(l => l.name.toLowerCase().includes(q))
        .map(l => ({
          name: l.name,
          email: l.email,
          phone: l.phone,
          source: 'lead' as const
        }));

      setReferrerSuggestions([...filteredRefs, ...filteredLeads]);
      setShowSuggestions(true);
    } else {
      setReferrerSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectReferrer = (ref: SuggestionItem) => {
    setReferrerName(ref.name);
    setReferrerEmail(ref.email);
    setReferrerPhone(ref.phone);
    setShowSuggestions(false);
  };

  // Click outside custom dropdown to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 1. Name validation
    if (!form.name?.trim()) {
      setError('Name is required');
      return;
    }

    // 2. Email validation (if filled)
    if (form.email && form.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim())) {
        setError('Please enter a valid email address');
        return;
      }
    }

    // 3. Phone validation (if filled, min 10 digits/characters standard checks)
    if (form.phone && form.phone.trim() !== '') {
      const phoneRegex = /^\+?[0-9\s\-()]{10,20}$/;
      if (!phoneRegex.test(form.phone.trim())) {
        setError('Please enter a valid phone number (at least 10 digits)');
        return;
      }
    }

    setLoading(true);
    try {
      await onSave({
        ...form,
        referrer: {
          name: referrerName,
          email: referrerEmail,
          phone: referrerPhone,
        }
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const selectedStatus = form.status ?? (statuses.length > 0 ? statuses[0].name : 'New');
  const matchedCfg = statuses.find(s => s.name === selectedStatus);
  const selectedDotClass = matchedCfg ? getStatusDot(matchedCfg.color) : 'bg-indigo-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-border mx-4 overflow-hidden">
        <div className="px-6 py-5 border-b border-border/80 bg-zinc-50/50 dark:bg-zinc-800/10">
          <h2 className="text-lg font-bold text-foreground">
            {initial?._id ? 'Edit Lead Profile' : 'Add New Lead'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {error && (
            <p className="text-sm text-red-800 bg-destructive/10 border border-destructive/20 px-3 py-2.5 rounded-xl font-black animate-shake">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
            
            {/* Left Section: Lead Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block select-none border-b border-border/40 pb-2">
                Lead Information
              </h3>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Name <span className="text-destructive font-black">*</span>
                </label>
                <input
                  className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground transition"
                  value={form.name ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Company
                  </label>
                  <input
                    className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground transition"
                    value={form.company ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                    placeholder="Acme Corp"
                  />
                </div>

                {/* Premium Custom Status Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition select-none hover:bg-secondary/40"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${selectedDotClass}`} />
                      <span className="font-semibold truncate">{selectedStatus}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute left-0 right-0 z-50 mt-1.5 bg-white dark:bg-zinc-850 rounded-xl shadow-xl border border-border overflow-hidden animate-fadeIn py-1">
                      {statuses.map((s) => {
                        const dotClass = getStatusDot(s.color);
                        const isSelected = selectedStatus === s.name;
                        return (
                          <button
                            key={s._id}
                            type="button"
                            onClick={() => {
                              setForm((p) => ({ ...p, status: s.name }));
                              setDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-xs sm:text-sm transition-colors hover:bg-secondary/65 ${
                              isSelected ? 'bg-secondary/80 font-bold' : 'text-foreground'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={`w-2.5 h-2.5 rounded-full ${dotClass}`} />
                              <span>{s.name}</span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-primary" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground transition"
                  value={form.email ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="john@acme.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground transition"
                  value={form.phone ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="e.g. 9876543210"
                  type='tel'
                  maxLength={10}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Inactivity Alert (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground transition"
                    value={form.inactiveLimitDays ?? 2}
                    onChange={(e) => setForm((p) => ({ ...p, inactiveLimitDays: parseInt(e.target.value) || 2 }))}
                    placeholder="2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Lead Source
                  </label>
                  <select
                    className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground transition"
                    value={form.source ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))}
                  >
                    <option value="">Select Source...</option>
                    {sources.map(src => (
                      <option key={src._id} value={src.name}>{src.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Right Section: Notes & Referral Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block select-none border-b border-border/40 pb-2">
                Notes & Referrals
              </h3>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Notes
                </label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground transition resize-none"
                  value={form.notes ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Add any notes here..."
                />
              </div>

              {/* Referral Info Section */}
              <div className="bg-slate-50/50 dark:bg-zinc-800/10 border border-border/40 rounded-2xl p-5 space-y-4">
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">
                  Referral Info
                </span>

                <div className="relative">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Referrer Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground transition"
                    value={referrerName}
                    onChange={(e) => handleReferrerNameChange(e.target.value)}
                    placeholder="Search name..."
                    onFocus={() => {
                      if (referrerName.trim() && referrerSuggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                  />
                  {showSuggestions && referrerSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 z-50 mt-1 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-border overflow-hidden max-h-[160px] overflow-y-auto animate-fadeIn">
                      {referrerSuggestions.map((ref, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectReferrer(ref);
                          }}
                          className="w-full px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-zinc-850/50 transition-colors border-b last:border-b-0 border-border/30 text-foreground block"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[13px] font-semibold text-slate-600 dark:text-zinc-300">
                              {ref.name}
                            </span>
                            <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              ref.source === 'lead' 
                                ? 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400' 
                                : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                            }`}>
                              {ref.source === 'lead' ? 'Lead' : 'Referrer'}
                            </span>
                          </div>
                          {ref.phone || ref.email ? (
                            <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 font-medium">
                              {ref.phone} {ref.email ? `| ${ref.email}` : ''}
                            </div>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground transition"
                      value={referrerEmail}
                      onChange={(e) => setReferrerEmail(e.target.value)}
                      placeholder="Email..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Phone
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground transition"
                      value={referrerPhone}
                      onChange={(e) => setReferrerPhone(e.target.value)}
                      placeholder="Phone..."
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-muted-foreground bg-secondary hover:bg-muted rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-primary rounded-xl hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading ? 'Saving...' : initial?._id ? 'Save Changes' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
