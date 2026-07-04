# Lead CRM MVP

A minimal Lead Management CRM built with React + TypeScript (Vite) + Tailwind CSS on the frontend and Node.js + Express + TypeScript + MongoDB on the backend.

## Features

- **Dashboard** – Total leads, leads by status, today's & overdue reminders
- **Leads List** – Search, filter by status, add / edit / delete leads
- **Lead Detail** – Full lead info + reminder management (add / edit / delete)
- **Kanban Board** – Drag & drop leads between status columns (native HTML5 DnD, no library)
- **Reminders** – Per-lead reminders with title, date, time, and optional note

## Quick Start

### 1. Prerequisites

- Node.js 18+
- MongoDB running locally on `mongodb://localhost:27017`

### 2. Backend

```bash
cd server
npm install
npm run dev
```

Server starts on **http://localhost:5000**

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

App starts on **http://localhost:3000**

## Project Structure

```
lead-software/
├── server/               # Express + TypeScript + Mongoose
│   └── src/
│       ├── models/       # Lead.ts, Reminder.ts
│       ├── routes/       # leads.ts, reminders.ts
│       └── server.ts
└── client/               # React + Vite + TypeScript + Tailwind
    └── src/
        ├── components/   # Layout, LeadForm, ReminderForm, KanbanColumn, StatusBadge
        ├── pages/        # Dashboard, Leads, LeadDetail, Kanban
        ├── services/     # api.ts (all REST calls)
        └── types/        # index.ts (shared types)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leads` | List leads (optional `?search=&status=`) |
| POST | `/api/leads` | Create lead |
| GET | `/api/leads/:id` | Get lead by ID |
| PUT | `/api/leads/:id` | Update lead |
| DELETE | `/api/leads/:id` | Delete lead + its reminders |
| GET | `/api/reminders` | List reminders (`?filter=today\|overdue&leadId=`) |
| POST | `/api/reminders` | Create reminder |
| PUT | `/api/reminders/:id` | Update reminder |
| DELETE | `/api/reminders/:id` | Delete reminder |
