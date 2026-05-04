const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: './.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// Import routes
const aiRoutes = require('./routes/ai');
const trainingRoutes = require('./routes/training');
const conversationRoutes = require('./routes/conversations');
const authRoutes = require('./routes/auth');
const statsRoutes = require('./routes/stats');

// Import middleware
const { authenticateToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');

// Security middleware
app.use(helmet());
app.use(cors({
  origin: true, // Allow all origins for local development to avoid port/IP mismatches
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'CrashCue+ AI API'
  });
});

// API routes
app.use('/api/ai', aiRoutes);
app.use('/api/training', authenticateToken, trainingRoutes);
app.use('/api/conversations', authenticateToken, conversationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/stats', authenticateToken, statsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CrashCue+ AI API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      ai: '/api/ai',
      training: '/api/training',
      conversations: '/api/conversations',
      auth: '/api/auth',
      stats: '/api/stats'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CrashCue+ AI API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🌐 Accessible externally via your machine's LAN IP at port ${PORT}`);
});

module.exports = app;









