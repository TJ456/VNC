require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const http = require('http');
const WebSocket = require('ws');
const cron = require('node-cron');

// Import database
const prisma = require('./config/database');

// Import routes
const healthRoutes = require('./routes/health');
const sessionRoutes = require('./routes/sessions');
const threatRoutes = require('./routes/threats');
const metricsRoutes = require('./routes/metrics');
const simulationRoutes = require('./routes/simulation');
const firewallRoutes = require('./routes/firewall');
const analyticsRoutes = require('./routes/analytics');
const mlRoutes = require('./routes/ml');

// Import services
const VNCMonitorService = require('./services/VNCMonitorService');
const WebSocketService = require('./services/WebSocketService');
const MetricsService = require('./services/MetricsService');

const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocket.Server({ server });
const wsService = new WebSocketService(wss);

// Initialize services
const vncMonitor = new VNCMonitorService(prisma, wsService);
const metricsService = new MetricsService(prisma);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    ['http://localhost:3000'],
  credentials: true,
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Make services available to routes
app.use((req, res, next) => {
  req.prisma = prisma;
  req.wsService = wsService;
  req.vncMonitor = vncMonitor;
  req.metricsService = metricsService;
  next();
});

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/threats', threatRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/simulate-attack', simulationRoutes);
app.use('/api/firewall', firewallRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ml', mlRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'VNC Protection Platform Express Backend',
    version: '1.0.0',
    status: 'active',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      sessions: '/api/sessions',
      threats: '/api/threats',
      metrics: '/api/metrics',
      simulation: '/api/simulate-attack',
      firewall: '/api/firewall',
      analytics: '/api/analytics',
      ml: '/api/ml',
      websocket: '/ws'
    }
  });
});

// WebSocket endpoint
app.get('/ws', (req, res) => {
  res.json({
    message: 'WebSocket endpoint available',
    url: `ws://${req.get('host')}/ws`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500,
      timestamp: new Date().toISOString()
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      status: 404,
      path: req.originalUrl,
      timestamp: new Date().toISOString()
    }
  });
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log(`WebSocket client connected from ${req.socket.remoteAddress}`);
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      wsService.handleMessage(ws, data);
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to VNC Protection Platform',
    timestamp: new Date().toISOString()
  }));
});

// Cron jobs for periodic tasks
cron.schedule('*/5 * * * *', async () => {
  // Update system metrics every 5 minutes
  try {
    await metricsService.updateSystemMetrics();
  } catch (error) {
    console.error('Error updating system metrics:', error);
  }
});

cron.schedule('0 * * * *', async () => {
  // Clean up expired firewall rules every hour
  try {
    await prisma.firewallRule.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
    console.log('Cleaned up expired firewall rules');
  } catch (error) {
    console.error('Error cleaning up firewall rules:', error);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  
  // Close WebSocket server
  wss.close();
  
  // Stop VNC monitoring
  vncMonitor.stop();
  
  // Close database connections
  await prisma.$disconnect();
  
  // Close HTTP server
  server.close(() => {
    console.log('Server closed successfully');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Start server
server.listen(PORT, HOST, async () => {
  console.log('🛡️  VNC Protection Platform Express Backend');
  console.log('==========================================');
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`🔌 WebSocket available on ws://${HOST}:${PORT}/ws`);
  console.log(`📊 API Documentation: http://${HOST}:${PORT}/api/health`);
  console.log('==========================================');
  
  // Test database connection
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Start VNC monitoring
    vncMonitor.start();
    console.log('✅ VNC monitoring service started');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
});

module.exports = app;