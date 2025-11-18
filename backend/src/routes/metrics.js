/**
 * Prometheus Metrics Endpoint
 * Exposes metrics for request count, latency, and errors
 */

import express from 'express';
import client from 'prom-client';

const router = express.Router();

// Create a Registry to register metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics for the application

/**
 * HTTP Request Counter
 * Tracks total number of HTTP requests by method, route, and status code
 */
export const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

/**
 * HTTP Request Duration Histogram
 * Tracks request latency/duration in seconds
 */
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5], // Buckets in seconds
  registers: [register]
});

/**
 * Error Counter
 * Tracks total number of errors by type and route
 */
export const errorCounter = new client.Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['method', 'route', 'error_type', 'status_code'],
  registers: [register]
});

/**
 * Extension-specific metrics
 */
export const clipsSavedCounter = new client.Counter({
  name: 'extension_clips_saved_total',
  help: 'Total number of clips saved by the extension',
  labelNames: ['source'], // web or native
  registers: [register]
});

export const clipsDeduplicatedCounter = new client.Counter({
  name: 'extension_clips_deduplicated_total',
  help: 'Total number of duplicate clips detected',
  registers: [register]
});

export const tagsAppliedCounter = new client.Counter({
  name: 'extension_tags_applied_total',
  help: 'Total number of tags applied to clips',
  labelNames: ['tag'],
  registers: [register]
});

export const activeUsersGauge = new client.Gauge({
  name: 'extension_active_users',
  help: 'Number of active extension users',
  registers: [register]
});

export const extensionErrorsCounter = new client.Counter({
  name: 'extension_errors_total',
  help: 'Total number of errors reported by the extension',
  labelNames: ['error_type', 'component'],
  registers: [register]
});

/**
 * GET /metrics
 * Returns metrics in Prometheus format
 */
router.get('/', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to collect metrics' });
  }
});

/**
 * GET /metrics/json
 * Returns metrics in JSON format (easier for debugging)
 */
router.get('/json', async (req, res) => {
  try {
    const metrics = await register.getMetricsAsJSON();
    res.json({
      timestamp: new Date().toISOString(),
      metrics: metrics
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to collect metrics' });
  }
});

/**
 * POST /metrics/reset
 * Reset all metrics (useful for testing)
 * Only available in development mode
 */
router.post('/reset', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Metrics reset is only available in development mode'
    });
  }

  register.resetMetrics();
  res.json({
    message: 'Metrics reset successfully',
    timestamp: new Date().toISOString()
  });
});

export default router;
export { register };
