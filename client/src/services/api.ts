import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

// Create a configured Axios instance
export const apiInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically add authorization header
apiInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle api errors cleanly
apiInstance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const errorMessage = error.response?.data?.error || error.message || 'Request failed';
    return Promise.reject(new Error(errorMessage));
  }
);

// Generic request helper to maintain the exact same signatures and type safety
async function request<T>(url: string, options?: { method?: string; data?: any; params?: any }): Promise<T> {
  const response = await apiInstance({
    url,
    method: options?.method || 'GET',
    data: options?.data,
    params: options?.params,
  });
  return response as unknown as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  me: () => request<any>('/auth/me'),
  login: (data: any) => request<any>('/auth/login', { method: 'POST', data }),
  register: (data: any) => request<any>('/auth/register', { method: 'POST', data }),
};

// ─── Leads ────────────────────────────────────────────────────────────────────

export const leadsApi = {
  getAll: (params?: { search?: string; status?: string }) => {
    return request<import('../types').Lead[]>('/leads', { params });
  },

  getById: (id: string) => request<import('../types').Lead>(`/leads/${id}`),

  create: (data: Partial<import('../types').Lead>) =>
    request<import('../types').Lead>('/leads', {
      method: 'POST',
      data,
    }),

  update: (id: string, data: Partial<import('../types').Lead>) =>
    request<import('../types').Lead>(`/leads/${id}`, {
      method: 'PUT',
      data,
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/leads/${id}`, { method: 'DELETE' }),

  getAiFollowup: (id: string) =>
    request<{ message: string }>(`/leads/${id}/ai-followup`),

  batchCreate: (leads: Partial<import('../types').Lead>[]) =>
    request<{ count: number }>('/leads/batch', {
      method: 'POST',
      data: { leads },
    }),
};

// ─── Reminders ────────────────────────────────────────────────────────────────

export const remindersApi = {
  getAll: (params?: { filter?: 'today' | 'overdue' | 'all'; leadId?: string }) => {
    return request<import('../types').Reminder[]>('/reminders', { params });
  },

  create: (data: Partial<import('../types').Reminder>) =>
    request<import('../types').Reminder>('/reminders', {
      method: 'POST',
      data,
    }),

  update: (id: string, data: Partial<import('../types').Reminder>) =>
    request<import('../types').Reminder>(`/reminders/${id}`, {
      method: 'PUT',
      data,
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/reminders/${id}`, { method: 'DELETE' }),
};

// ─── Activities ──────────────────────────────────────────────────────────────

export const activitiesApi = {
  getAll: (leadId: string) =>
    request<import('../types').Activity[]>('/activities', { params: { leadId } }),

  create: (data: Partial<import('../types').Activity>) =>
    request<import('../types').Activity>('/activities', {
      method: 'POST',
      data,
    }),
};

// ─── Statuses (Master Settings) ──────────────────────────────────────────────

export const statusesApi = {
  getAll: () => request<import('../types').Status[]>('/statuses'),

  create: (data: Partial<import('../types').Status>) =>
    request<import('../types').Status>('/statuses', {
      method: 'POST',
      data,
    }),

  update: (id: string, data: Partial<import('../types').Status>) =>
    request<import('../types').Status>(`/statuses/${id}`, {
      method: 'PUT',
      data,
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/statuses/${id}`, { method: 'DELETE' }),
};

// ─── Referrers ──────────────────────────────────────────────────────────────

export const referrersApi = {
  getAll: () => request<import('../types').Referrer[]>('/referrers'),
};

// ─── Sources ────────────────────────────────────────────────────────────────

export const sourcesApi = {
  getAll: () => request<import('../types').Source[]>('/sources'),

  create: (data: Partial<import('../types').Source>) =>
    request<import('../types').Source>('/sources', {
      method: 'POST',
      data,
    }),

  update: (id: string, data: Partial<import('../types').Source>) =>
    request<import('../types').Source>(`/sources/${id}`, {
      method: 'PUT',
      data,
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/sources/${id}`, { method: 'DELETE' }),
};
