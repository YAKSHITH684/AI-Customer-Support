const express = require('express');
const http = require('http');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const { initSocket } = require('./config/socket');
const { seedIfEmpty } = require('./utils/seedData');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const knowledgeBaseRoutes = require('./routes/knowledgeBaseRoutes');
const resolutionRoutes = require('./routes/resolutionRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Real-time Socket.IO layer
initSocket(server, config.CLIENT_URL);

// Middleware Pipeline
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(compression());
app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static uploads directory for document attachments
const uploadsPath = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Embeddable Chat Widget JS route for live customer website intake
app.get('/widget.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
(function() {
  var clientServer = "${config.CLIENT_URL || 'http://localhost:3000'}";
  var apiServer = "${config.CLIENT_URL ? '' : 'http://localhost:5000'}";
  console.log("ResolveFlow AI Support Widget Loaded.");
  
  var btn = document.createElement("div");
  btn.id = "rf-widget-bubble";
  btn.innerHTML = "💬 Need Help?";
  btn.style.cssText = "position:fixed;bottom:24px;right:24px;background:linear-gradient(135deg,#6366F1,#4F46E5);color:#fff;padding:12px 20px;border-radius:9999px;font-family:sans-serif;font-weight:600;cursor:pointer;box-shadow:0 10px 25px rgba(99,102,241,0.4);z-index:999999;transition:all 0.2s;";
  btn.onmouseover = function() { btn.style.transform = "scale(1.05)"; };
  btn.onmouseout = function() { btn.style.transform = "scale(1)"; };
  btn.onclick = function() { window.open(clientServer + "/tickets", "_blank"); };
  document.body.appendChild(btn);
})();
  `);
});

// System Health Endpoint
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'ResolveFlow_AI Platform Server',
    environment: config.NODE_ENV,
    port: config.PORT,
    aiProviders: {
      groq: Boolean(config.GROQ_API_KEY),
      openRouter: Boolean(config.OPENROUTER_API_KEY),
      gemini: Boolean(config.GEMINI_API_KEY),
      ragSubstrate: 'langchain-vector-ready'
    },
    integrations: ['gmail', 'slack', 'website-widget', 'google-sheets']
  });
});

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/knowledge-base', knowledgeBaseRoutes);
app.use('/api/resolutions', resolutionRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);

  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  const errorCode = err.code || (statusCode === 401 ? 'UNAUTHORIZED' : 'INTERNAL_SERVER_ERROR');

  res.status(statusCode).json({
    success: false,
    error: err.message || 'An internal server error occurred.',
    code: errorCode,
    ...(config.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start Server
const startServer = async () => {
  try {
    await connectDB();
    await seedIfEmpty();

    server.listen(config.PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 ResolveFlow_AI Backend Server listening on port ${config.PORT}`);
      console.log(`📡 Client URL: ${config.CLIENT_URL}`);
      console.log(`⚡ Socket.IO real-time telemetry active`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};


// Graceful Shutdown
const gracefulShutdown = async () => {
  console.log('\nGracefully shutting down ResolveFlow_AI server...');
  await disconnectDB();
  server.close(() => {
    console.log('HTTP and Socket.IO server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

if (require.main === module) {
  startServer();
}

module.exports = { app, server, startServer };
