/**
 * Gigi's Copy Tool - Backend Service
 * Provides health checks, metrics, and telemetry collection for the Chrome Extension
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import logger from './utils/logger.js';
import healthRouter from './routes/health.js';
import metricsRouter from './routes/metrics.js';
import telemetryRouter from './routes/telemetry.js';
import clipsRouter from './routes/clips.js';
import { metricsMiddleware } from './middleware/metricsMiddleware.js';

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
app.use(helmet());

// CORS configuration - allow Chrome extension to communicate
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['chrome-extension://*', 'http://localhost:*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Metrics middleware - tracks all requests
app.use(metricsMiddleware);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Routes
app.use('/health', healthRouter);
app.use('/metrics', metricsRouter);
app.use('/api/telemetry', telemetryRouter);
app.use('/api/clips', clipsRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Gigi\'s Copy Tool Backend',
    version: '1.0.0',
    status: 'running',
    environment: NODE_ENV,
    endpoints: {
      health: '/health',
      metrics: '/metrics',
      telemetry: '/api/telemetry',
      clips: '/api/clips',
      sync: '/api/clips?since=<timestamp>'
    },
    documentation: 'https://github.com/Flexipie/Gigi-sCopy'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableEndpoints: ['/health', '/metrics', '/api/telemetry']
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path
  });

  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: NODE_ENV === 'development' ? err.message : 'An error occurred',
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Graceful shutdown
const server = app.listen(PORT, () => {
  logger.info(`🚀 Backend service started`, {
    port: PORT,
    environment: NODE_ENV,
    nodeVersion: process.version
  });
  logger.info(`📊 Health check available at http://localhost:${PORT}/health`);
  logger.info(`📈 Metrics available at http://localhost:${PORT}/metrics`);
}).on('error', (err) => {
  logger.error('Failed to start server', { error: err.message });
  console.error('Server start error:', err);
  process.exit(1);
});

// Handle shutdown signals
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
