# 🤖 ResolveFlow_AI — AI-Powered Customer Support Platform

**A full-stack, agentic customer support system** that turns plain-English support tickets into knowledge-base-grounded, AI-drafted responses — auto-sent when confidence is high, escalated to a human when it isn't. Every step of the reasoning chain is logged, streamed live to the agent dashboard, and fully auditable.

Think **Zendesk / Intercom**, but with an explicit, inspectable multi-agent reasoning layer sitting between the customer's question and the answer they receive.

---

## ✨ Key Features

- **🔗 5-Agent Orchestration Chain** — every message runs through Retrieval → Drafting → Confidence → Escalation → Monitoring agents, each emitting its own timeline event.
- **📚 Retrieval-Augmented Generation (RAG)** — support docs (PDFs, FAQs, policies, macros) are chunked, embedded, and stored in a vector store; every AI response is grounded in retrieved context with inline source citations.
- **🎯 Confidence-Scored Auto-Resolution** — responses are only auto-sent when the AI's confidence clears the bar; otherwise the ticket is escalated with a specific reason (`NO_RELEVANT_CONTEXT`, `AMBIGUOUS_QUERY`, `NEGATIVE_SENTIMENT`, `POLICY_SENSITIVE`, `LOW_CONFIDENCE`).
- **📡 Real-Time Agent Timeline** — Socket.IO streams every agent event live to the dashboard; a color-coded timeline shows exactly how each answer was produced.
- **🔌 Real Third-Party Integrations** — Gmail (ticket intake + replies), Slack (escalation alerts), an embeddable website chat widget, and Google Sheets (CSAT/analytics export), all behind OAuth with encrypted token storage.
- **🧩 Layered AI Fallback** — prefers OpenRouter, falls back to Google Gemini, and falls back further to a deterministic canned-response matcher, so the app degrades gracefully with zero API keys configured.
- **🗂️ Full Audit Trail** — every resolution run, retry, and agent decision is persisted for compliance and quality review.
- **🔐 Role-Based Access & Security** — JWT auth, bcrypt password hashing, encrypted OAuth credentials, rate-limited auth routes, and PII redaction before content reaches any third-party LLM.

---

## 🏛️ Architecture

The system is a **completely decoupled Backend (`server/`) and Frontend (`client/`)** monorepo:

```
AI-Customer-Support/
├── server/                     # Standalone Backend API (Port 5000)
│   └── src/
│       ├── config/             # env, MongoDB connection, Socket.IO setup
│       ├── routes/             # auth, tickets, resolutions, knowledge-base, integrations, notifications
│       ├── controllers/        # request parsing & response shaping only
│       ├── services/           # business logic (tickets, resolutions, AI, embeddings, integrations)
│       ├── agents/             # orchestrator + retrieval/drafting/confidence/escalation/monitoring agents
│       ├── integrations/       # Gmail, Slack, website widget, Google Sheets (common baseIntegration interface)
│       ├── models/             # Mongoose schemas
│       └── queues/             # BullMQ embedding & resolution queues (in-memory fallback if no Redis)
│
├── client/                     # Standalone Frontend (Port 3000)
│   └── src/
│       ├── components/         # AppShell, MetricGrid, TicketThread, DraftReviewPanel, AgentTimeline...
│       ├── pages/               # Next.js Pages Router (dashboard, tickets, queue, knowledge-base, ...)
│       ├── store/               # Zustand auth & ticket stores
│       └── services/            # api.js (Axios), socket.js (Socket.IO client)
│
├── spec.md                     # Full technical specification
├── render.yaml                 # Render Blueprint for 1-click cloud deployment
├── start-backend.bat/.ps1      # Windows launchers for the backend
├── start-frontend.bat/.ps1     # Windows launchers for the frontend
└── package.json                # Root convenience scripts
```

### Agent Chain

```
Customer message
      │
      ▼
 Retrieval Agent    → vector similarity search over the knowledge base
      │
      ▼
 Drafting Agent      → drafts a response grounded strictly in retrieved context
      │
      ▼
 Confidence Agent    → scores relevance + self-assessment → AUTO_SEND or ESCALATE
      │
      ├── AUTO_SEND ──────────────► sent to customer
      │
      └── ESCALATE
            │
            ▼
       Escalation Agent  → classifies reason, routes to agent queue
            │
            ▼
       Monitoring Agent  → emits timeline events for every step (streamed live via Socket.IO)
```

---

## 🧰 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js (Pages Router), React 19, Tailwind CSS, Zustand, Axios, Socket.IO client, Recharts, lucide-react |
| **Backend** | Node.js, Express, MongoDB + Mongoose, JWT, BullMQ (ioredis), Socket.IO, Helmet, Morgan, express-validator, bcryptjs |
| **AI / RAG** | OpenRouter API, Google Generative AI (Gemini), LangChain, MongoDB Atlas Vector Search (or Pinecone) |
| **Integrations** | Gmail, Slack, embeddable Website Chat Widget, Google Sheets — all via OAuth with encrypted credential storage |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (optional — an in-memory database spins up automatically if `MONGODB_URI` is blank)
- Redis (optional — BullMQ falls back to an in-memory queue if not configured)

### Option 1: Run Backend and Frontend in Separate Terminals (Recommended)

**Terminal 1 — Backend API (Port 5000)**
```bash
cd server
npm install    # first time only
npm run dev
```
- API Server: `http://localhost:5000`
- Zero-config MongoDB: starts an in-memory database automatically if `MONGODB_URI` is blank.

**Terminal 2 — Frontend Client (Port 3000)**
```bash
cd client
npm install    # first time only
npm run dev
```
- Web Application: `http://localhost:3000`

### Option 2: 1-Click Launchers (Windows)
- Double-click `start-backend.bat` (or run `./start-backend.ps1`)
- Double-click `start-frontend.bat` (or run `./start-frontend.ps1`)

### Option 3: Run Concurrently from Root
```bash
npm run dev
```

---

## 🔑 Environment Variables

**`server/.env`**
| Variable | Description |
| :--- | :--- |
| `NODE_ENV` | `development` \| `production` |
| `CLIENT_URL` | Frontend origin, used for CORS |
| `JWT_SECRET` | Secret used to sign/verify JWTs |
| `CREDENTIAL_ENCRYPTION_KEY` | 32-char key used to encrypt OAuth tokens at rest |
| `MONGODB_URI` | MongoDB connection string (optional — falls back to in-memory) |
| `OPENROUTER_API_KEY` | Preferred AI generation provider |
| `GEMINI_API_KEY` | Fallback AI generation provider (Google Gemini) |
| `GROQ_API_KEY` / `GROQ_MODEL` | Groq LLM inference credentials & model |
| `REDIS_URL` | Optional — enables BullMQ background queues |

**`client/.env`**
| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Backend REST API base URL |
| `NEXT_PUBLIC_SOCKET_URL` | Backend Socket.IO URL |

See each package's `.env.example` for the full list.

---

## ☁️ Deploying on Render

### Option A: Blueprint (Automated 1-Click)
1. Push your repository to GitHub.
2. Go to the [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint**.
3. Connect this repository — Render auto-detects `render.yaml` and provisions both services.
4. Add your `GROQ_API_KEY` and optional `MONGODB_URI` in the Render dashboard.

### Option B: Deploy Backend & Frontend Manually

**Backend Web Service**
- Root Directory: `server` · Environment: `Node`
- Build Command: `npm install` · Start Command: `npm start`
- Env vars: `NODE_ENV`, `CLIENT_URL`, `JWT_SECRET`, `CREDENTIAL_ENCRYPTION_KEY`, `GROQ_API_KEY`, `GROQ_MODEL`, `MONGODB_URI`

**Frontend Web Service**
- Root Directory: `client` · Environment: `Node`
- Build Command: `npm install && npm run build` · Start Command: `npm start`
- Env vars: `NODE_ENV`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`

### 🌐 A Note on Email Delivery in Production

Render's free tier blocks all outbound raw SMTP ports (`25`, `465`, `587`) to prevent spam abuse. This means:

| Environment | Outbound SMTP Ports | Result |
| :--- | :--- | :--- |
| **Local** (`localhost:3000`) | ✅ Open | Real delivery to the recipient's inbox |
| **Render (Free Tier)** | ⛔ Blocked | Falls back to a sandboxed email simulation so the app doesn't hang or crash |

To test live email delivery, run the app locally and send from **Integrations → Gmail → Send Live Support Email**. A paid Render plan or an HTTP-based email API (e.g., SendGrid, Postmark, Resend) removes this restriction in production.

---

## 🔐 Default Demo Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Support Agent** | `agent@resolveflow.ai` | `Password123!` |
| **Administrator** | `admin@resolveflow.ai` | `Password123!` |
| **Customer** | `customer@acme.com` | `Password123!` |

> Change or remove these before deploying to a public/production environment.

---

## 📡 API Overview

| Area | Endpoints |
| :--- | :--- |
| **Auth** | `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` |
| **Tickets** | `GET/POST /api/tickets` · `GET/PUT/DELETE /api/tickets/:id` · `POST /api/tickets/:id/messages` · `POST /api/tickets/:id/escalate` · `POST /api/tickets/:id/resolve` |
| **Knowledge Base** | `GET/POST /api/knowledge-base` · `GET /api/knowledge-base/:id/status` · `DELETE /api/knowledge-base/:id` |
| **Resolutions** | `GET /api/resolutions/:id` · `GET /api/resolutions/:id/timeline` · `POST /api/resolutions/:id/approve` · `POST /api/resolutions/:id/edit` · `POST /api/resolutions/:id/retry` |
| **Integrations** | `GET /api/integrations` · `GET /api/integrations/status` · `GET /api/integrations/oauth/:provider/start` · `GET /api/integrations/oauth/:provider/callback` |
| **Notifications** | `GET /api/notifications` |
| **Health** | `GET /api/health` |

Full request/response contracts are documented in [`spec.md`](./spec.md).

---

## 🖥️ Frontend Pages

`/` (landing) · `/login` · `/register` · `/dashboard` (metrics + live AI activity feed) · `/knowledge-base` (upload & embedding status) · `/tickets` and `/tickets/[id]` (thread + AI draft + agent-chain sidebar) · `/queue` (escalation queue with SLA countdowns) · `/integrations` (OAuth connections) · `/settings`

---

## 🔒 Security

- Passwords hashed with bcrypt (cost factor 12)
- JWT-based auth with protected routes and role separation (`admin` / `agent` / `customer`)
- OAuth access & refresh tokens encrypted at rest via `CREDENTIAL_ENCRYPTION_KEY`
- HTTP security headers via Helmet, CORS locked to `CLIENT_URL`
- Rate-limited auth endpoints, request validation via express-validator
- PII (card numbers, national ID patterns) redacted from ticket content before it reaches any LLM provider
- Missing/expired integration credentials surface as explicit `INTEGRATION_NOT_CONNECTED` / `AUTH_EXPIRED` errors rather than silent failures

---

## 📄 License

No license specified yet — add one (MIT is a common default) if you plan to accept external contributions or open-source this project. |
