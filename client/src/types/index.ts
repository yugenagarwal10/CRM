export type LeadStatus = string;

export interface Status {
  _id: string;
  name: string;
  color: string;
  order: number;
  type: 'standard' | 'won' | 'lost';
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Referrer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  _id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
  status: LeadStatus;
  inactiveLimitDays: number;
  lastActivityAt: string;
  nextFollowUpDate?: string;
  referrerId?: Referrer | null;
  referrer?: {
    name: string;
    email?: string;
    phone?: string;
  };
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Source {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadRef {
  _id: string;
  name: string;
  company: string;
}

export interface Reminder {
  _id: string;
  leadId: string | LeadRef;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  note: string;
  createdAt: string;
  updatedAt: string;
}

export const LEAD_STATUSES: LeadStatus[] = [
  'New',
  'Contacted',
  'Qualified',
  'Proposal Sent',
  'Won',
  'Lost',
];

export type ActivityType =
  | 'lead_created'
  | 'status_changed'
  | 'reminder_created'
  | 'call'
  | 'email'
  | 'meeting'
  | 'note'
  | 'other';

export interface Activity {
  _id: string;
  leadId: string;
  type: ActivityType;
  title: string;
  description?: string;
  createdAt: string;
}

