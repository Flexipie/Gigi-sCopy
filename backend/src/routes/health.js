/**
 * Health Check Endpoint
 * Provides application health status and diagnostics
 */

import express from 'express';
import os from 'os';

const router = express.Router();

// In-memory storage for health status
const healthStatus = {
  startTime: Date.now(),
  requestCount: 0,
  errorCount: 0,
  lastError: null
};

/**
 * Update health status
 */
export function updateHealthStatus(data) {
  Object.assign(healthStatus, data);
}

/**
 * Increment request count
 */
export function incrementRequestCount() {
  healthStatus.requestCount++;
}

/**
 * Record error
 */
export function recordError(error) {
  healthStatus.errorCount++;
  healthStatus.lastError = {
    message: error.message,
    timestamp: new Date().toISOString()
  };
}

/**
 * GET /health
 * Basic health check - returns 200 if service is running
 */
router.get('/', (req, res) => {
  const uptime = Date.now() - healthStatus.startTime;
  const uptimeSeconds = Math.floor(uptime / 1000);

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: {
      milliseconds: uptime,
      seconds: uptimeSeconds,
      human: formatUptime(uptimeSeconds)
    },
    service: {
      name: 'Gigi\'s Copy Tool Backend',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

/**
 * GET /health/detailed
 * Detailed health check with system metrics
 */
router.get('/detailed', (req, res) => {
  const uptime = Date.now() - healthStatus.startTime;
  const uptimeSeconds = Math.floor(uptime / 1000);

  // System metrics
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsagePercent = ((usedMemory / totalMemory) * 100).toFixed(2);

  // Process metrics
  const processMemory = process.memoryUsage();

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: {
      milliseconds: uptime,
      seconds: uptimeSeconds,
      human: formatUptime(uptimeSeconds)
    },
    service: {
      name: 'Gigi\'s Copy Tool Backend',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid
    },
    metrics: {
      requestCount: healthStatus.requestCount,
      errorCount: healthStatus.errorCount,
      errorRate: healthStatus.requestCount > 0 
        ? ((healthStatus.errorCount / healthStatus.requestCount) * 100).toFixed(2) + '%'
        : '0%'
    },
    system: {
      hostname: os.hostname(),
      cpus: os.cpus().length,
      loadAverage: os.loadavg(),
      memory: {
        total: formatBytes(totalMemory),
        free: formatBytes(freeMemory),
        used: formatBytes(usedMemory),
        usagePercent: memoryUsagePercent + '%'
      },
      process: {
        heapUsed: formatBytes(processMemory.heapUsed),
        heapTotal: formatBytes(processMemory.heapTotal),
        external: formatBytes(processMemory.external),
        rss: formatBytes(processMemory.rss)
      }
    },
    ...(healthStatus.lastError && {
      lastError: healthStatus.lastError
    })
  });
});

/**
 * GET /health/ready
 * Readiness probe - checks if service is ready to handle traffic
 */
router.get('/ready', (req, res) => {
  // Check if critical dependencies are available
  const isReady = true; // Add actual readiness checks here

  if (isReady) {
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /health/live
 * Liveness probe - checks if service is alive
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

/**
 * Helper: Format uptime in human-readable format
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Helper: Format bytes in human-readable format
 */
function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export default router;
