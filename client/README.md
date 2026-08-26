# ResolveFlow_AI Frontend Client

The standalone web application for **ResolveFlow_AI**, built with **Next.js, React, Tailwind CSS, Lucide Icons, Recharts**, and **Zustand**.

---

## 📁 Directory Structure

```
client/
├── src/
│   ├── components/           # Reusable UI modules
│   │   ├── AgentTimeline/    # Live reasoning telemetry sidebar
│   │   ├── AppShell/         # Navigation, header, fast demo switcher
│   │   ├── DraftReviewPanel/ # Human approval & editing panel
│   │   ├── MetricGrid/       # KPI dashboard cards
│   │   ├── ProtectedRoute/   # Role-based route guard
│   │   └── TicketThread/     # Message feed with citations
│   ├── pages/                # Next.js Application Routes
│   │   ├── index.js          # Landing page
│   │   ├── login.js          # Authentication & demo quick login
│   │   ├── register.js       # User sign up
│   │   ├── dashboard.js      # Executive & Agent Command Center
│   │   ├── queue.js          # Human-in-the-loop triage queue
│   │   ├── knowledge-base.js # RAG knowledge base & vector playground
│   │   ├── integrations.js   # Third-party omnichannel hub
│   │   ├── settings.js       # System health & profile settings
│   │   ├── tickets/
│   │   │   ├── index.js      # Ticket desk & filtering
│   │   │   └── [id].js       # 3-Pane real-time resolution workspace
│   │   └── _app.js           # Global state & styles initialization
│   ├── services/             # Axios API & Socket.IO client
│   ├── store/                # Zustand state stores (authStore, ticketStore)
│   └── styles/               # Glassmorphism & dark theme Tailwind styles
├── .env.example              # Environment variables template
├── .gitignore                # Standalone repository git ignore
├── next.config.js
├── tailwind.config.js
├── package.json
└── README.md
```

---

## ⚡ Quickstart (Running Standalone)

### 1. Install Dependencies
```bash
cd client
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Make sure `NEXT_PUBLIC_API_URL` points to `http://localhost:5000/api` and `NEXT_PUBLIC_SOCKET_URL` points to `http://localhost:5000`.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## ☁️ Render Cloud Deployment

To deploy this frontend web app as a Web Service on **Render**:

1. Go to [Render Dashboard](https://dashboard.render.com/) > **New** > **Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name:** `resolveflow-frontend`
   - **Root Directory:** `client`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `NEXT_PUBLIC_API_URL`: `https://your-backend-api.onrender.com/api`
   - `NEXT_PUBLIC_SOCKET_URL`: `https://your-backend-api.onrender.com`
5. Click **Create Web Service**.

---

## 🔐 Default Demo Accounts

* **Support Agent:** `agent@resolveflow.ai` / `Password123!`
* **Administrator:** `admin@resolveflow.ai` / `Password123!`
* **Customer:** `customer@acme.com` / `Password123!`
