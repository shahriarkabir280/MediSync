# MediSync Backend

Express 5 REST API and Socket.IO server for MediSync. See the [root README](../README.md) for the full project overview.

## Quick start

From the repository root:

```bash
npm install
cp backend/.env.example backend/.env   # then fill in your values
npm run init-db                        # apply backend/schema.sql
npm run dev                            # http://localhost:3001
```

The server refuses to start if `JWT_SECRET`, `SUPABASE_URL` or `SUPABASE_KEY` is missing. Set `DIAGNOSTIC_EMAIL` / `DIAGNOSTIC_PASSWORD` to enable the diagnostic center login. Optional integrations (SMTP, Gemini, SSLCommerz) are disabled when their keys are not set. Without an SSLCommerz store ID, payments use a built-in mock checkout.

## Layout

```
backend/
├── server.js          App entry: middleware, route mounting, Socket.IO bootstrap
├── config/
│   ├── env.js         Loads and validates backend/.env (imported first)
│   └── db.js          Supabase client and pg pool
├── middleware/
│   ├── auth.js        JWT verification, roles (doctor / patient / diagnostic), ownership checks
│   └── chatIdentity.js  Maps doctors to chat identities; blocks impersonation in chat
├── routes/            One Express router per domain (19 modules)
├── controllers/       Request handlers and business logic
├── lib/
│   ├── websocketServer.js   Socket.IO (token-authenticated): chat, typing, presence, WebRTC signalling
│   ├── uniqueIdGenerator.js Human-readable IDs for doctors, patients and records
│   └── arcjet.js            Rate limiting / bot protection (currently disabled in server.js)
├── utils/             Image and notification helpers
├── schema.sql         PostgreSQL schema (46 tables, idempotent)
├── seed.js            Sample data
├── scripts/           Database init, migrations, and maintenance scripts
└── uploads/           User-uploaded files (git-ignored)
```

## API

All endpoints are under `/api`: `auth`, `doctors`, `patients`, `appointments`, `prescriptions`, `lab`, `billing`, `wallet`, `payment`, `chat`, `email`, `notifications`, `calendar`, `analytics`, `blog`, `website`, `help`, `products`.

See [docs/api-reference.md](../docs/api-reference.md) for request and response details, and [docs/testing-guide.md](../docs/testing-guide.md) for manual testing with curl.
