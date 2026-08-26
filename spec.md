# ResolveFlow_AI — AI-Powered Customer Support Platform
## Full Technical Specification

---

## 1. Project Overview & Tech Stack

### Project Overview
Build a full-stack **AI Customer Support Automation Platform** called **ResolveFlow_AI** that lets customers submit support tickets in natural language and receive AI-drafted, knowledge-base-grounded responses through a chain of cooperating AI agents — with automatic escalation to a human agent whenever the AI's confidence is too low to trust. The platform must ingest and chunk a company's own support documents into a vector knowledge base, run every incoming ticket through a retrieval-augmented generation (RAG) pipeline, route each response through a confidence-scored agent chain, integrate with real third-party tools (Gmail, Slack, a website chat widget, Google Sheets) over OAuth, queue and retry background jobs, stream live agent-chain events to the browser, and persist a full audit timeline of every step for compliance and quality review.

### Tech Stack
**Frontend:** Next.js (Pages Router), React 19, Tailwind CSS, Zustand, Axios, Socket.IO client, Recharts (analytics), lucide-react icons.

**Backend:** Node.js, Express, MongoDB, Mongoose, JSON Web Tokens, BullMQ on Redis (via ioredis), Socket.IO, helmet, morgan, compression, express-validator, bcryptjs.

**AI / RAG:** OpenRouter API and Google Generative AI SDK for generation; LangChain for RAG orchestration; MongoDB Atlas Vector Search (or Pinecone) as the vector store for knowledge-base embeddings.

**Integrations:** OAuth and webhook integrations covering Gmail (ticket intake + reply), Slack (agent escalation alerts), an embeddable Website Chat Widget (customer-facing intake), and Google Sheets (analytics export). Sensitive credentials are encrypted at rest with an application-level key.

---

## 2. Authentication, Ticketing, and RAG-Grounded Response Generation

### Authentication
The authentication system must support registration, login, JWT-based session handling, protected routes, an `/auth/me` profile endpoint, role separation between **admin**, **agent**, and **customer**, password hashing with bcrypt at cost factor 12, and persistent login state on the client through Zustand.

### Ticket Management
Customers must be able to create tickets (subject, description, category, file attachments), view their ticket history, and continue a conversation thread on an existing ticket. Agents must be able to list, search, filter, and claim tickets from a shared queue. Every ticket stores its channel of origin (web widget, email, manual), priority, status, tags, and assigned agent.

### Knowledge Base & RAG Pipeline
Admins upload the company's own support material (PDF manuals, FAQ documents, policy docs, macros/canned responses). The backend must extract text, chunk it, generate embeddings, and store them in a vector database. Every customer message triggers a similarity search against this knowledge base **before** any response is generated — a response that isn't grounded in retrieved context does not qualify as this project's core feature.

---

## 3. Agentic Orchestration

For every incoming ticket message, the backend must run a fixed chain of agents:

- **Retrieval Agent:** Runs the RAG similarity search against the knowledge-base vector store and returns the top relevant chunks with a relevance score.
- **Drafting Agent:** Generates a response grounded strictly in the retrieved context, with inline source references.
- **Confidence Agent:** Scores the draft (retrieval relevance + model self-assessment) and decides between `AUTO_SEND` and `ESCALATE`.
- **Escalation Agent:** When confidence is low, classifies the reason (`NO_RELEVANT_CONTEXT`, `AMBIGUOUS_QUERY`, `NEGATIVE_SENTIMENT`, `POLICY_SENSITIVE`, `LOW_CONFIDENCE`) and routes the ticket to the appropriate agent queue.
- **Monitoring Agent:** Emits timeline events for every step of the chain, for both auto-sent and escalated resolutions.

LangChain must be importable as the orchestration substrate, and the orchestrator must report `ragPipeline: 'available' | 'not-installed'` with each run.

---

## 4. Integrations, Execution, AI Generation, and Real-Time Layer

### Third-Party Integrations
The integrations layer must support **Gmail** (ingest tickets from a support inbox, send replies), **Slack** (post escalation alerts to an agent channel), a **Website Chat Widget** (embeddable JS snippet for live customer intake), and **Google Sheets** (export resolved-ticket and CSAT data for reporting). Each provider must support an OAuth start endpoint, an OAuth callback endpoint, and a connected/disconnected status. Access and refresh tokens must be encrypted at rest using `CREDENTIAL_ENCRYPTION_KEY`. A missing or expired credential must surface as a clear `INTEGRATION_NOT_CONNECTED` or `AUTH_EXPIRED` error in the resolution timeline rather than a silent failure.

### Resolution Engine
The backend must persist every agent-chain run as a **Resolution** document with one of `PENDING`, `RETRIEVING`, `DRAFTING`, `AWAITING_APPROVAL`, `AUTO_SENT`, `ESCALATED`, `FAILED`, `RETRYING`, or `CANCELLED` status, record the retrieved-context snapshot at runtime, capture input, output draft, error, duration, and retry count, and write one **ResolutionLog** row per agent event. Agents must be able to approve, edit-then-send, or reject an AI draft on an escalated ticket. BullMQ on Redis must handle embedding jobs, background retries, and SLA escalation timers, with an in-memory fallback when Redis is not configured.

### AI Response Generation
The generator must prefer **OpenRouter** when `OPENROUTER_API_KEY` is set, fall back to **Google Gemini** when `GEMINI_API_KEY` is set, and fall back to a **deterministic canned-response matcher** (keyword/FAQ matching against the knowledge base) when neither is available. The deterministic fallback must still produce a usable draft for common ticket types (password reset, billing question, shipping status, account access).

### Real-Time Layer
The Socket.IO server must broadcast agent-chain events (retrieval, drafting, confidence, escalation, monitoring) for each resolution to subscribed clients, and the agent dashboard must render those events as a live timeline. Notifications (new escalation, SLA breach warning, customer reply) must persist and appear in a notifications drawer.

---

## 5. Frontend Pages

The application uses the Next.js Pages Router. The root `/` page redirects authenticated users to the dashboard and unauthenticated users to login.

- **`/`** – Landing page featuring platform introduction, AI + human hybrid support showcase, CTA buttons, responsive layout with dark theme support.
- **`/login`** – Email/password authentication with JWT handling, Zustand persistence, validation, and error states.
- **`/register`** – Registration form with password validation, session persistence, error handling.
- **`/dashboard`** – Agent console with ticket metrics (MetricGrid: open tickets, avg resolution time, AI auto-resolve rate, escalation rate), recent ticket summaries, AI activity feed, and real-time resolution panels (AppShell layout).
- **`/knowledge-base`** – Document upload panel, chunking/embedding job status, document list with edit/delete, and knowledge-gap indicators (queries that consistently score low confidence).
- **`/tickets`** – Customer-facing ticket list and "new ticket" form; agent-facing full ticket list with filters.
- **`/tickets/[id]`** – Full ticket thread: conversation history, AI draft panel with source citations, agent approve/edit/send controls, and agent-chain timeline sidebar.
- **`/queue`** – Agent working queue: filterable list of `AWAITING_APPROVAL`/`ESCALATED` tickets with priority and SLA countdown badges, claim button.
- **`/integrations`** – Status page for Gmail, Slack, Website Widget, and Google Sheets with OAuth connection flows, reconnect buttons, status toggles.
- **`/settings`** – Profile management, role details, API key/encryption key health checks, security controls, theme settings.

---

## 6. Backend Architecture & Database Collections

### Backend Architecture
- **Routes:** HTTP routing, request validation via express-validator, middleware composition (auth, validation, error handler).
- **Controllers:** Request parsing and response shaping only (never talks directly to MongoDB).
- **Services:** Business logic ownership (ticket CRUD, resolution lifecycle, token encryption, escalation classification, notification creation, AI generation, log aggregation).
- **Agents Layer:** Holds retrieval, drafting, confidence, escalation, monitoring, and orchestrator modules.
- **Integrations Layer:** Wraps third-party SDKs behind a common interface defined in `baseIntegration.js`.
- **Queues Layer:** Wraps BullMQ and Redis.
- **Config Layer:** Centralizes environment variables, MongoDB connection (with in-memory fallback), and Socket.IO setup.

### Database Collections
- **Users:** name, email, password (`select: false`), role (`admin | agent | customer`), lastLogin.
- **Tickets:** subject, description, customer (owner), status (`open | pending | escalated | resolved | closed`), priority (`low | medium | high | urgent`), category, channel (`email | widget | manual`), tags, assignedAgent.
- **Messages:** ticketId, sender (`customer | agent | ai`), content, isAIDraft, sourceRefs, createdAt.
- **Resolutions:** ticketId, messageId, immutable retrieved-context snapshot, status, confidenceScore, retrievedSources, output, error, duration, retryCount.
- **ResolutionLogs:** resolutionId, ticketId, agent (`retrieval | drafting | confidence | escalation | monitoring`), level (`info | warning | error | success`), message, metadata.
- **KnowledgeDocuments:** owner, title, sourceType (`pdf | faq | policy | macro`), status (`processing | ready | failed`), chunkCount, uploadedAt.
- **KnowledgeChunks:** documentId, content, embedding vector, metadata (page/section reference).
- **Integrations:** owner, provider (`gmail | slack | website-widget | google-sheets | openrouter | gemini`), isConnected, scopes, encrypted tokens, expiresAt.
- **Notifications:** owner, ticketId, resolutionId, type, title, message, isRead.
- **AgentMemory:** ticketId, resolutionId, agentId, key, value, confidenceScore.

---

## 7. API Endpoints

**Health and Auth**
- `GET /api/health` – System heartbeat and status check.
- `POST /api/auth/register` – Register a new user account.
- `POST /api/auth/login` – Authenticate user and issue JWT.
- `GET /api/auth/me` – Fetch current user profile.

**Tickets**
- `GET /api/tickets/dashboard` – Aggregated ticket and resolution stats.
- `GET /api/tickets` – List tickets with pagination/filtering.
- `POST /api/tickets` – Create a new ticket (customer).
- `POST /api/tickets/:id/messages` – Post a new message; triggers the agent chain.
- `GET /api/tickets/:id` – Fetch single ticket with full thread.
- `PUT /api/tickets/:id` – Update status, priority, or assignment.
- `POST /api/tickets/:id/escalate` – Manually escalate to a human agent.
- `POST /api/tickets/:id/resolve` – Mark ticket resolved.
- `DELETE /api/tickets/:id` – Delete a ticket (admin only).

**Knowledge Base**
- `GET /api/knowledge-base` – List knowledge documents.
- `POST /api/knowledge-base` – Upload a new document (triggers chunking/embedding job).
- `GET /api/knowledge-base/:id/status` – Chunking/embedding job status.
- `DELETE /api/knowledge-base/:id` – Delete a document and its chunks.

**Resolutions**
- `GET /api/resolutions/:id` – Fetch resolution run details and context snapshot.
- `GET /api/resolutions/:id/timeline` – Fetch detailed agent timeline logs.
- `POST /api/resolutions/:id/approve` – Approve AI draft and send as-is.
- `POST /api/resolutions/:id/edit` – Edit AI draft before sending.
- `POST /api/resolutions/:id/retry` – Retry a failed resolution.

**Integrations & Notifications**
- `GET /api/integrations` – List all integration connections.
- `GET /api/integrations/status` – Provider health and token validity checks.
- `GET /api/integrations/oauth/:provider/start` – Initiate OAuth flow.
- `GET /api/integrations/oauth/:provider/callback` – Handle OAuth callback.
- `GET /api/integrations/oauth/error` – OAuth error response endpoint.
- `POST /api/integrations` – Manual integration credential setup.
- `GET /api/notifications` – List user notifications.

---

## 8. Folder Structure & Development Phases

### Frontend Structure
```
client/
└── src/
    ├── components/
    │   ├── AppShell/
    │   ├── MetricGrid/
    │   ├── TicketThread/
    │   ├── DraftReviewPanel/
    │   ├── AgentTimeline/
    │   └── ProtectedRoute/
    ├── pages/
    │   ├── _app.js
    │   ├── index.js
    │   ├── login.js
    │   ├── register.js
    │   ├── dashboard.js
    │   ├── knowledge-base.js
    │   ├── integrations.js
    │   ├── settings.js
    │   ├── queue.js
    │   └── tickets/
    │       ├── index.js
    │       └── [id].js
    ├── store/
    │   ├── authStore.js
    │   └── ticketStore.js
    └── services/
        ├── api.js
        └── socket.js
```

### Backend Structure
```
server/
└── src/
    ├── config/
    │   ├── env.js
    │   ├── db.js
    │   └── socket.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── ticketRoutes.js
    │   ├── resolutionRoutes.js
    │   ├── knowledgeBaseRoutes.js
    │   ├── integrationRoutes.js
    │   └── notificationRoutes.js
    ├── controllers/
    │   ├── authController.js
    │   ├── ticketController.js
    │   ├── resolutionController.js
    │   └── integrationController.js
    ├── services/
    │   ├── authService.js
    │   ├── ticketService.js
    │   ├── resolutionService.js
    │   ├── aiService.js
    │   ├── embeddingService.js
    │   └── integrationService.js
    ├── agents/
    │   ├── orchestrator.js
    │   ├── retrievalAgent.js
    │   ├── draftingAgent.js
    │   ├── confidenceAgent.js
    │   ├── escalationAgent.js
    │   └── monitoringAgent.js
    ├── integrations/
    │   ├── baseIntegration.js
    │   ├── gmailIntegration.js
    │   ├── slackIntegration.js
    │   ├── widgetIntegration.js
    │   └── googleSheetsIntegration.js
    ├── models/
    │   ├── User.js
    │   ├── Ticket.js
    │   ├── Message.js
    │   ├── Resolution.js
    │   ├── ResolutionLog.js
    │   ├── KnowledgeDocument.js
    │   ├── KnowledgeChunk.js
    │   ├── Integration.js
    │   └── Notification.js
    └── queues/
        ├── embeddingQueue.js
        └── resolutionQueue.js
```

### Development Phases
- **Phase 1:** Project setup (Next.js, Express, MongoDB with in-memory fallback, JWT authentication, Zustand auth store, AppShell layout).
- **Phase 2:** Ticket CRUD, thread UI, knowledge-base document upload and chunking pipeline.
- **Phase 3:** Embedding generation and vector search (RAG retrieval working end-to-end against real uploaded documents).
- **Phase 4:** Multi-agent orchestration engine (retrieval, drafting, confidence, escalation, monitoring) and the approve/edit/send resolution lifecycle.
- **Phase 5:** Third-party OAuth integrations (Gmail, Slack, Website Widget, Google Sheets) with credential encryption.
- **Phase 6:** BullMQ background queues, Socket.IO real-time event streaming, live agent timeline, and notification drawer.

---

## 9. UI, Security, and Outcome Requirements

### UI and UX Requirements
The UI must use a clean support-console aesthetic with Tailwind, be fully responsive, include loading states and skeleton loaders, render the AI draft with highlighted source citations inline, surface a right-hand agent-chain timeline with color-coded badges (retrieval / drafting / confidence / escalation / monitoring), show SLA countdown badges on queued tickets, and provide a notifications drawer accessible from the AppShell.

### Security Requirements
The application must hash passwords with bcrypt at cost 12, sign and verify JWTs with `JWT_SECRET`, encrypt OAuth access and refresh tokens at rest with `CREDENTIAL_ENCRYPTION_KEY`, set HTTP security headers via helmet, apply CORS limited to `CLIENT_URL`, rate-limit auth endpoints via express-rate-limit, validate every request body with express-validator, never log decrypted tokens, redact obvious PII (card numbers, national ID patterns) from ticket content before it is sent to any third-party LLM provider, and treat any missing or expired credential as an explicit `INTEGRATION_NOT_CONNECTED` / `AUTH_EXPIRED` error rather than a generic 500.

### Final Expected Outcome
The completed platform must let a customer submit a support ticket in plain English, have it automatically retrieved against the company's own knowledge base, receive an AI-drafted, source-cited response that is either sent automatically (when confidence is high) or routed to a human agent for review (when it isn't), watch each agent event stream in real time on the agent dashboard, and have every step logged for audit — all backed by real OAuth integrations and a full trail in MongoDB. The final application should feel like a modern support desk — close in spirit to Zendesk or Intercom, but with an explicit, inspectable agentic reasoning layer between the customer's question and the answer they receive.