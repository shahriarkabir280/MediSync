# MediSync

MediSync is a full-stack healthcare platform that connects doctors, patients, and diagnostic centers through dedicated dashboards, appointment scheduling, medical records, billing, real-time chat, and payments — backed by a single Node.js/Express API and a React frontend.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Core Features](#core-features)
- [Documentation](#documentation)
- [Security Notes](#security-notes)

## Overview

The application is organized around three user-facing portals sharing one backend and database:

| Portal | Purpose |
|---|---|
| **Doctor Dashboard** | Profile and availability management, appointments, patient records, prescriptions, billing, analytics, and a lab/report workflow with PDF annotation. |
| **Patient Dashboard** | Appointment booking, medical history, billing, chat with providers, and wallet-based payments. |
| **Diagnostic Center Dashboard** | Lab order intake and report management for diagnostic partners. |

A public-facing website with an integrated blog runs alongside the dashboards for patient acquisition and general information.

## Tech Stack

| Layer | Technologies |
|---|---|
| Backend runtime | Node.js, Express 5 |
| Database | PostgreSQL via [Supabase](https://supabase.com/) (`pg`, `@supabase/supabase-js`) |
| Auth & security | JWT, `bcryptjs`, Helmet, Arcjet (rate limiting / bot protection) |
| Real-time | Socket.IO (server and client) |
| Email | Nodemailer |
| AI | Google Gemini API |
| Payments | SSLCommerz |
| Frontend framework | React 19, Vite 6, React Router 7 |
| Styling | Tailwind CSS |
| State management | Zustand |
| PDF handling | `react-pdf`, `pdf-lib`, `jspdf` |

## Project Structure

```
MediSync/
├── backend/                 Express API server
│   ├── controllers/          Request handlers (auth, appointments, billing, chat, lab, wallet, ...)
│   ├── routes/                One route module per domain
│   ├── config/                 Environment and service configuration
│   ├── lib/                    Database client, Supabase client, third-party integrations
│   ├── utils/                  Shared helpers
│   ├── uploads/                Uploaded files (reports, attachments)
│   ├── schema.sql              Database schema
│   └── server.js                Entry point
│
└── frontend/                 React (Vite) frontend
    └── src/
        ├── pages/
        │   ├── DoctorDashboard.jsx, DoctorDashboardTabs/
        │   ├── PatientDashboard/
        │   ├── DiagnosticCenter/
        │   ├── PatientLogin.jsx, PatientSignup.jsx
        │   └── PublicWebsite.jsx, BlogPost.jsx
        ├── components/, contexts/, hooks/, lib/, config/
        └── main.jsx, App.jsx
```

## Prerequisites

- Node.js 18 or later
- A PostgreSQL database (built and tested against [Supabase](https://supabase.com/))
- API credentials for: Arcjet, SMTP provider, Google Gemini, SSLCommerz

## Getting Started

### 1. Install dependencies

```bash
# Backend (project root)
npm install

# Frontend
cd frontend && npm install && cd ..
```

### 2. Configure environment variables

Create a `.env` file in the project root — see [Environment Variables](#environment-variables) below.

### 3. Initialize the database

```bash
npm run init-db
```

### 4. Seed sample data (optional, first run only)

```bash
npm run seed
```

### 5. Start the backend

```bash
npm run dev
```

The API server starts at `http://localhost:3001`.

### 6. Start the frontend

```bash
cd frontend
npm run dev
```

The frontend starts at `http://localhost:5173`.

## Environment Variables

Create a `.env` file in the project root with the following keys:

| Variable | Description |
|---|---|
| `PORT` | Backend server port (defaults to `3001`) |
| `FRONTEND_URL` | URL of the running frontend, used for CORS |
| `DATABASE_URL` | PostgreSQL connection string |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase service key |
| `JWT_SECRET` | Secret used to sign authentication tokens |
| `SMTP_ENABLED` | `true`/`false` — toggles transactional email |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | SMTP credentials for outgoing email |
| `GEMINI_API_KEY` | Google Gemini API key for AI-assisted features |
| `SSL_STORE_ID`, `SSL_STORE_PASSWORD` | SSLCommerz store credentials for payments |
| `ARCJET_KEY` | Arcjet API key for rate limiting and bot protection |

## Available Scripts

**Root — backend**

| Command | Description |
|---|---|
| `npm run dev` | Start the API server with nodemon (auto-restart on change) |
| `npm start` | Start the API server |
| `npm run init-db` | Create or migrate database tables |
| `npm run seed` | Populate the database with sample data |
| `npm run add-unique-ids` | Backfill unique IDs for existing records |

**`frontend/` — frontend**

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build |
| `npm run preview` | Preview a production build locally |
| `npm run lint` | Run ESLint |
| `npm start` | Serve a production build |

## Core Features

- **Appointments** — booking, rescheduling, cancellation, and a calendar view for doctors
- **Patient records** — demographics, medical history, prescriptions
- **Lab & diagnostics** — order management and a PDF report viewer with page-level annotation (pencil/eraser tools) plus save and download
- **Billing & wallet** — billing records, payment tracking, and an in-app wallet backed by SSLCommerz
- **Real-time chat** — Socket.IO messaging between doctors and patients
- **Notifications** — in-app and email notifications
- **Analytics** — appointment trends, patient demographics, revenue, and peak-hour reporting
- **Public website & blog** — patient-facing marketing site with content management
- **AI assistance** — Gemini-powered features for doctor and patient workflows

## Documentation

| Topic | File |
|---|---|
| API reference | `backend/API_DOCUMENTATION.md` |
| Backend testing | `backend/TESTING_GUIDE.md` |
| Frontend integration | `FRONTEND_INTEGRATION.md` |
| Setup guide | `SETUP_GUIDE.md` |
| Integration checklist | `INTEGRATION_CHECKLIST.md` |
| Chat system | `CHAT_SYSTEM_DOCS.md`, `CHAT_PRIVACY_DOCUMENTATION.md`, `CHAT_FIX_SUMMARY.md` |
| Email system | `EMAIL_SYSTEM_DOCUMENTATION.md` |
| Notifications | `NOTIFICATION_SYSTEM_DOCS.md` |
| Settings | `SETTINGS_DOCUMENTATION.md` |
| Unique ID scheme | `UNIQUE_ID_DOCUMENTATION.md` |
| File upload handling | `FILE_UPLOAD_OPTIMIZATION.md` |

## Security Notes

- Never commit `.env` files or real credentials — use `.env.example` as a template only.
- Authentication uses JWT; use a unique, high-entropy `JWT_SECRET` per environment.
- Rate limiting and bot protection are enforced by Arcjet; HTTP security headers are set via Helmet.
