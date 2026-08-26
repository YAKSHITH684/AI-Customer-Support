# ResolveFlow_AI — Autonomous Customer Support Platform

ResolveFlow_AI is an enterprise-grade customer support platform powered by a 5-agent multi-agent orchestration chain, real-time WebSocket telemetry, semantic vector RAG, Groq LLM inference, and an omnichannel integrations hub.

---

## 🏛️ Decoupled Backend & Frontend Architecture

The system is designed with a completely decoupled **Backend (`server/`)** and **Frontend (`client/`)** architecture:

```
Customer Support Platform/
├── server/                     # Standalone Backend (Port 5000)
│   ├── src/                    # Agents, Controllers, Models, Routes, Services
│   ├── .env.example            # Backend environment variables template
│   ├── .gitignore              # Standalone git ignore rules
│   ├── package.json            # Backend dependencies & scripts
│   └── README.md               # Dedicated server documentation & Render deployment
│
├── client/                     # Standalone Frontend (Port 3000)
│   ├── src/                    # Next.js Pages, Components, Stores, Styles
│   ├── .env.example            # Frontend environment variables template
│   ├── .gitignore              # Standalone git ignore rules
│   ├── package.json            # Frontend dependencies & scripts
│   └── README.md               # Dedicated client documentation & Render deployment
│
├── render.yaml                 # Render Blueprint for automated cloud deployment
├── start-backend.bat           # 1-Click Windows launcher for Backend
├── start-frontend.bat          # 1-Click Windows launcher for Frontend
├── start-backend.ps1           # PowerShell launcher for Backend
├── start-frontend.ps1          # PowerShell launcher for Frontend
├── package.json                # Root convenience scripts
└── README.md
```

---

## 🚀 How to Run Locally

### Option 1: Run Backend and Frontend in Separate Terminals (Recommended)

#### **Terminal 1 — Backend API Server (Port 5000)**
```bash
cd server
npm install    # (First time only)
npm run dev
```
* API Server: `http://localhost:5000`
* Zero-config MongoDB: Starts an in-memory database automatically if `MONGODB_URI` is blank.

#### **Terminal 2 — Frontend Client (Port 3000)**
```bash
cd client
npm install    # (First time only)
npm run dev
```
* Web Application: `http://localhost:3000`

---

### Option 2: 1-Click Launchers (Windows)

* Double-click [`start-backend.bat`](file:///c:/Users/yaksh/OneDrive/Doc/Customer%20Support%20Platform/start-backend.bat) (or run `./start-backend.ps1`)
* Double-click [`start-frontend.bat`](file:///c:/Users/yaksh/OneDrive/Doc/Customer%20Support%20Platform/start-frontend.bat) (or run `./start-frontend.ps1`)

---

### Option 3: Run Concurrently from Root

```bash
npm run dev
```

---

## ☁️ Deploying on Render

You can deploy the entire platform to **Render** using the included `render.yaml` Blueprint or as two separate Web Services:

### Option A: Blueprint (Automated 1-Click)
1. Push your repository to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com/) > **New** > **Blueprint**.
3. Connect your repository. Render will automatically detect `render.yaml` and provision both the backend and frontend services.
4. Add your `GROQ_API_KEY` and optional `MONGODB_URI` in the Render dashboard.

### Option B: Deploy Backend & Frontend Manually on Render

#### 1. Backend Web Service:
- **Repository:** Connect your repo
- **Root Directory:** `server`
- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment Variables:**
  - `NODE_ENV`: `production`
  - `CLIENT_URL`: `https://your-frontend-service.onrender.com`
  - `JWT_SECRET`: `your_secure_random_string`
  - `CREDENTIAL_ENCRYPTION_KEY`: `your_32_char_encryption_key`
  - `GROQ_API_KEY`: `gsk_...`
  - `GROQ_MODEL`: `openai/gpt-oss-120b`
  - `MONGODB_URI`: `mongodb+srv://...`

#### 2. Frontend Web Service:
- **Repository:** Connect your repo
- **Root Directory:** `client`
- **Environment:** `Node`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Environment Variables:**
  - `NODE_ENV`: `production`
  - `NEXT_PUBLIC_API_URL`: `https://your-backend-service.onrender.com/api`
  - `NEXT_PUBLIC_SOCKET_URL`: `https://your-backend-service.onrender.com`

---

## 🔐 Default Demo Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Support Agent** | `agent@resolveflow.ai` | `Password123!` |
| **Administrator** | `admin@resolveflow.ai` | `Password123!` |
| **Customer** | `customer@acme.com` | `Password123!` |
