/**
 * Telemetry Endpoint
 * Receives telemetry data from the Chrome Extension
 */

import express from 'express';
import logger from '../utils/logger.js';
import {
  clipsSavedCounter,
  clipsDeduplicatedCounter,
  tagsAppliedCounter,
  activeUsersGauge,
  extensionErrorsCounter
} from './metrics.js';

const router = express.Router();

// Store active users (simple in-memory, would use Redis in production)
const activeUsers = new Set();

/**
 * POST /api/telemetry/clip-saved
 * Record when a clip is saved
 */
router.post('/clip-saved', (req, res) => {
  try {
    const { source, isDuplicate, tags, userId } = req.body;

    // Validate required fields
    if (!source || !['web', 'native'].includes(source)) {
      return res.status(400).json({
        error: 'Invalid source. Must be "web" or "native"'
      });
    }

    // Increment clips saved counter
    clipsSavedCounter.inc({ source });

    // Track duplicates
    if (isDuplicate) {
      clipsDeduplicatedCounter.inc();
    }

    // Track tags applied
    if (Array.isArray(tags)) {
      tags.forEach(tag => {
        tagsAppliedCounter.inc({ tag });
      });
    }

    // Track active user
    if (userId) {
      activeUsers.add(userId);
      activeUsersGauge.set(activeUsers.size);
    }

    logger.info('Clip saved telemetry received', {
      source,
      isDuplicate,
      tagCount: tags?.length || 0,
      userId: userId ? 'present' : 'none'
    });

    res.status(201).json({
      message: 'Telemetry recorded',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error recording clip-saved telemetry', { error: error.message });
    res.status(500).json({
      error: 'Failed to record telemetry'
    });
  }
});

/**
 * POST /api/telemetry/error
 * Record extension errors
 */
router.post('/error', (req, res) => {
  try {
    const { errorType, component, message, stack, userId } = req.body;

    if (!errorType || !component) {
      return res.status(400).json({
        error: 'errorType and component are required'
      });
    }

    // Increment error counter
    extensionErrorsCounter.inc({
      error_type: errorType,
      component
    });

    logger.error('Extension error reported', {
      errorType,
      component,
      message,
      userId: userId ? 'present' : 'none',
      stack: stack ? 'present' : 'none'
    });

    res.status(201).json({
      message: 'Error telemetry recorded',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error recording error telemetry', { error: error.message });
    res.status(500).json({
      error: 'Failed to record error telemetry'
    });
  }
});

/**
 * POST /api/telemetry/heartbeat
 * Track active users (heartbeat every 5 minutes from extension)
 */
router.post('/heartbeat', (req, res) => {
  try {
    const { userId, version, platform } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'userId is required'
      });
    }

    // Add to active users
    activeUsers.add(userId);
    activeUsersGauge.set(activeUsers.size);

    logger.debug('Heartbeat received', { userId, version, platform });

    res.status(200).json({
      message: 'Heartbeat recorded',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error recording heartbeat', { error: error.message });
    res.status(500).json({
      error: 'Failed to record heartbeat'
    });
  }
});

/**
 * POST /api/telemetry/batch
 * Receive multiple telemetry events in a single request
 */
router.post('/batch', (req, res) => {
  try {
    const { events } = req.body;

    if (!Array.isArray(events)) {
      return res.status(400).json({
        error: 'events must be an array'
      });
    }

    let processed = 0;
    let failed = 0;

    events.forEach(event => {
      try {
        const { type, data } = event;

        switch (type) {
          case 'clip-saved':
            if (data.source) {
              clipsSavedCounter.inc({ source: data.source });
              if (data.isDuplicate) clipsDeduplicatedCounter.inc();
              if (Array.isArray(data.tags)) {
                data.tags.forEach(tag => tagsAppliedCounter.inc({ tag }));
              }
              processed++;
            }
            break;

          case 'error':
            if (data.errorType && data.component) {
              extensionErrorsCounter.inc({
                error_type: data.errorType,
                component: data.component
              });
              processed++;
            }
            break;

          case 'heartbeat':
            if (data.userId) {
              activeUsers.add(data.userId);
              processed++;
            }
            break;

          default:
            logger.warn('Unknown telemetry event type', { type });
            failed++;
        }
      } catch (err) {
        failed++;
        logger.error('Error processing batch event', { error: err.message });
      }
    });

    // Update active users gauge
    activeUsersGauge.set(activeUsers.size);

    logger.info('Batch telemetry processed', { processed, failed, total: events.length });

    res.status(201).json({
      message: 'Batch telemetry processed',
      processed,
      failed,
      total: events.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error processing batch telemetry', { error: error.message });
    res.status(500).json({
      error: 'Failed to process batch telemetry'
    });
  }
});

/**
 * GET /api/telemetry/stats
 * Get current telemetry statistics
 */
router.get('/stats', (req, res) => {
  res.json({
    activeUsers: activeUsers.size,
    timestamp: new Date().toISOString()
  });
});

// Clean up old active users every 30 minutes
setInterval(() => {
  activeUsers.clear();
  activeUsersGauge.set(0);
  logger.info('Active users cleared (periodic cleanup)');
}, 30 * 60 * 1000);

export default router;
