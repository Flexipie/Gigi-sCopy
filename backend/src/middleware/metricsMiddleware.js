/**
 * Metrics Middleware
 * Automatically tracks HTTP request metrics
 */

import { httpRequestCounter, httpRequestDuration, errorCounter } from '../routes/metrics.js';
import { incrementRequestCount, recordError } from '../routes/health.js';

/**
 * Middleware to track HTTP request metrics
 */
export function metricsMiddleware(req, res, next) {
  const startTime = Date.now();

  // Capture original end function
  const originalEnd = res.end;

  // Override res.end to capture metrics when response is sent
  res.end = function(...args) {
    // Calculate duration
    const duration = (Date.now() - startTime) / 1000; // Convert to seconds

    // Get route pattern (fallback to path if no route)
    const route = req.route?.path || req.path || 'unknown';
    const method = req.method;
    const statusCode = res.statusCode;

    // Record metrics
    httpRequestCounter.inc({
      method,
      route,
      status_code: statusCode
    });

    httpRequestDuration.observe(
      {
        method,
        route,
        status_code: statusCode
      },
      duration
    );

    // Track errors (4xx and 5xx status codes)
    if (statusCode >= 400) {
      const errorType = statusCode >= 500 ? 'server_error' : 'client_error';
      
      errorCounter.inc({
        method,
        route,
        error_type: errorType,
        status_code: statusCode
      });

      recordError(new Error(`HTTP ${statusCode} on ${method} ${route}`));
    }

    // Increment health status request count
    incrementRequestCount();

    // Call original end function
    originalEnd.apply(res, args);
  };

  next();
}
