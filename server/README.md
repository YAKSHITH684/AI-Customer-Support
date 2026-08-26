# ResolveFlow_AI Backend Server

The standalone backend API and multi-agent AI orchestration engine for **ResolveFlow_AI**. Built with **Node.js, Express, MongoDB / Mongoose, Socket.IO, LangChain**, Groq LLM inference, and vector similarity search.

---

## 📁 Directory Structure

```
server/
├── src/
│   ├── agents/               # 5-Agent Multi-Agent Chain
│   │   ├── agentOrchestrator.js  # Pipeline coordinator
│   │   ├── retrievalAgent.js     # Vector search & relevance scoring
│   │   ├── draftingAgent.js      # Context synthesis & citations
│   │   ├── confidenceAgent.js    # Multi-factor confidence evaluation
│   │   ├── escalationAgent.js    # Routing & human queue triggering
│   │   └── monitoringAgent.js    # Socket.IO telemetry emitter
│   ├── config/               # Environment, database, and socket setup
│   │   ├── env.js
│   │   ├── db.js             # MongoDB + In-memory fallback
│   │   └── socket.js         # Real-time WebSocket layer
│   ├── controllers/          # Express route controllers
│   ├── integrations/         # Third-party adapters (Gmail, Slack, Sheets)
│   ├── middlewares/          # Auth JWT & validation middleware
│   ├── models/               # Mongoose data schemas
│   ├── routes/               # REST API endpoints
│   ├── services/             # AI (Groq/Gemini), Embedding, Auth, and RAG services
│   ├── tests/                # Automated verification tests
│   └── utils/                # Crypto & Seed data generator
├── uploads/                  # Uploaded knowledge documents
├── .env.example              # Environment variables template
├── .gitignore                # Standalone repository git ignore
├── package.json
└── README.md
```

---

## ⚡ Quickstart (Running Standalone)

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Note: If `MONGODB_URI` is left blank, the server automatically starts an in-memory MongoDB instance with zero configuration required).*

### 3. Run Development Server
```bash
npm run dev
```
The server will boot on `http://localhost:5000` with WebSocket telemetry active.

### 4. (Optional) Run Database Seeding Manually
```bash
npm run seed
```

### 5. Run End-to-End Test Suite
```bash
node src/tests/e2eVerification.js
```

---

## ☁️ Render Cloud Deployment

To deploy this backend as a Web Service on **Render**:

1. Go to [Render Dashboard](https://dashboard.render.com/) > **New** > **Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name:** `resolveflow-backend`
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (or leave default for Render)
   - `CLIENT_URL`: `https://your-frontend-app.onrender.com`
   - `JWT_SECRET`: `your_secure_secret_key`
   - `CREDENTIAL_ENCRYPTION_KEY`: `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef`
   - `GROQ_API_KEY`: `gsk_...`
   - `GROQ_MODEL`: `openai/gpt-oss-120b`
   - `MONGODB_URI`: `mongodb+srv://...` (or Atlas connection string)
5. Click **Create Web Service**.

---

## 📡 Key API Endpoints

* `GET /api/health` — System status and AI provider diagnostics
* `POST /api/auth/login` — JWT authentication
* `GET /api/tickets` — List support tickets with filter queries
* `POST /api/tickets` — Ingest new ticket & trigger multi-agent pipeline
* `GET /api/tickets/:id` — Get ticket details, active resolution, and reasoning logs
* `POST /api/resolutions/:id/approve` — Human agent draft approval & dispatch
* `POST /api/knowledge-base/search` — Semantic vector cosine similarity search
* `POST /api/integrations/:provider/execute` — Execute third-party integration actions
