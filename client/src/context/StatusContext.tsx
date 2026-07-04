import React, { createContext, useContext, useState, useEffect } from 'react';
import { statusesApi } from '../services/api';
import type { Status } from '../types';

interface StatusContextType {
  statuses: Status[];
  loading: boolean;
  refetchStatuses: () => Promise<void>;
  getStatusColorClasses: (statusName: string) => string;
}

const StatusContext = createContext<StatusContextType | undefined>(undefined);

const COLOR_MAP: Record<string, string> = {
  indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-300 dark:border-indigo-900/30',
  blue: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-900/30',
  purple: 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/20 dark:text-purple-300 dark:border-purple-900/30',
  amber: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/30',
  emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/30',
  rose: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-300 dark:border-rose-900/30',
  teal: 'bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/20 dark:text-teal-300 dark:border-teal-900/30',
  orange: 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/20 dark:text-orange-300 dark:border-orange-900/30',
  pink: 'bg-pink-50 text-pink-700 border border-pink-200 dark:bg-pink-950/20 dark:text-pink-300 dark:border-pink-900/30',
  gray: 'bg-gray-100 text-gray-700 border border-gray-250 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
};

export function StatusProvider({ children }: { children: React.ReactNode }) {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStatuses = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await statusesApi.getAll();
      setStatuses(data);
    } catch (err) {
      console.error('Failed to load statuses settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  // Self-healing trigger: Fetch statuses when token is set and statuses are empty
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && statuses.length === 0 && !loading) {
      fetchStatuses();
    }
  });

  const getStatusColorClasses = (statusName: string) => {
    const matched = statuses.find(s => s.name.toLowerCase() === statusName.toLowerCase());
    if (matched && COLOR_MAP[matched.color]) {
      return COLOR_MAP[matched.color];
    }
    // Default fallback based on name or standard indigo
    const nameLower = statusName.toLowerCase();
    if (nameLower.includes('won')) return COLOR_MAP.emerald;
    if (nameLower.includes('lost')) return COLOR_MAP.rose;
    if (nameLower.includes('new')) return COLOR_MAP.indigo;
    if (nameLower.includes('contact')) return COLOR_MAP.blue;
    if (nameLower.includes('qualif')) return COLOR_MAP.purple;
    
    return COLOR_MAP.indigo; // global default
  };

  return (
    <StatusContext.Provider value={{ statuses, loading, refetchStatuses: fetchStatuses, getStatusColorClasses }}>
      {children}
    </StatusContext.Provider>
  );
}

export function useStatuses() {
  const context = useContext(StatusContext);
  if (context === undefined) {
    throw new Error('useStatuses must be used within a StatusProvider');
  }
  return context;
}
