# Steel Logistics & Dispatch Tracker

A full-stack web application for tracking the complete lifecycle of Delivery Orders (DOs) in a steel trading and manufacturing company — from supplier purchase through service centre processing to final customer delivery.

## Features

| Module | Description |
|--------|-------------|
| **DO Management** | Create, activate and track Delivery Orders with item lists, coil specs and dispatch progress |
| **Job Assignment** | Planning team assigns cut/slit instructions and agents to each DO; generates Job Cards |
| **SC Queue Tracker** | Field agents check in at service centres, log queue numbers and processing status |
| **Field Expenses** | Agents log cash payments with photo proof; managers approve/reject with full audit trail |
| **Delivery Log** | Record final deliveries with vehicle, location, photo; flag partial deliveries and location changes |
| **Reports** | Consolidated view per DO, per agent, per service centre — exportable to Excel |

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **State**: Zustand
- **Forms**: React Hook Form + Zod
- **Router**: React Router v7
- **Backend** (planned): Supabase (PostgreSQL + Auth + Storage)
- **Notifications**: Sonner

## Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@steelco.in | admin123 |
| Purchase | purchase@steelco.in | steel123 |
| Planner | planner@steelco.in | steel123 |
| Agent | agent1@steelco.in | agent123 |
| Agent | agent2@steelco.in | agent123 |

## Setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
