/**
 * Clips API - Cross-Device Sync Endpoints
 * Provides CRUD operations for clips with sync support
 */

import express from 'express';
import logger from '../utils/logger.js';
import {
  saveClip,
  getAllClips,
  getClipsSince,
  getClipById,
  deleteClip,
  getStats
} from '../db/database.js';

const router = express.Router();

/**
 * POST /api/clips
 * Create or update a clip
 */
router.post('/', (req, res) => {
  try {
    const clipData = req.body;

    // Validate required fields
    if (!clipData.id || !clipData.text || !clipData.createdAt) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['id', 'text', 'createdAt']
      });
    }

    const savedClip = saveClip(clipData);

    logger.info('Clip saved', {
      id: savedClip.id,
      deviceId: savedClip.deviceId,
      textLength: savedClip.text.length
    });

    res.status(201).json({
      message: 'Clip saved successfully',
      clip: savedClip
    });
  } catch (error) {
    logger.error('Error saving clip', { error: error.message });
    res.status(500).json({
      error: 'Failed to save clip',
      message: error.message
    });
  }
});

/**
 * POST /api/clips/batch
 * Upload multiple clips at once (more efficient)
 */
router.post('/batch', (req, res) => {
  try {
    const { clips } = req.body;

    if (!Array.isArray(clips)) {
      return res.status(400).json({
        error: 'clips must be an array'
      });
    }

    const savedClips = [];
    const errors = [];

    clips.forEach((clip, index) => {
      try {
        if (clip.id && clip.text && clip.createdAt) {
          const saved = saveClip(clip);
          savedClips.push(saved);
        } else {
          errors.push({
            index,
            error: 'Missing required fields',
            clip: clip.id || 'unknown'
          });
        }
      } catch (err) {
        errors.push({
          index,
          error: err.message,
          clip: clip.id || 'unknown'
        });
      }
    });

    logger.info('Batch clips saved', {
      total: clips.length,
      saved: savedClips.length,
      errors: errors.length
    });

    res.status(201).json({
      message: 'Batch save completed',
      saved: savedClips.length,
      errors: errors.length,
      clips: savedClips,
      ...(errors.length > 0 && { errorDetails: errors })
    });
  } catch (error) {
    logger.error('Error in batch save', { error: error.message });
    res.status(500).json({
      error: 'Failed to save clips',
      message: error.message
    });
  }
});

/**
 * GET /api/clips
 * Get all clips (with optional since parameter for incremental sync)
 */
router.get('/', (req, res) => {
  try {
    const { since } = req.query;

    let clips;
    if (since) {
      const timestamp = parseInt(since);
      if (isNaN(timestamp)) {
        return res.status(400).json({
          error: 'Invalid since parameter',
          message: 'since must be a timestamp in milliseconds'
        });
      }
      clips = getClipsSince(timestamp);
      logger.info('Incremental sync requested', { since: timestamp, count: clips.length });
    } else {
      clips = getAllClips();
      logger.info('Full sync requested', { count: clips.length });
    }

    res.json({
      clips,
      count: clips.length,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Error fetching clips', { error: error.message });
    res.status(500).json({
      error: 'Failed to fetch clips',
      message: error.message
    });
  }
});

/**
 * GET /api/clips/:id
 * Get a specific clip by ID
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const clip = getClipById(id);

    if (!clip) {
      return res.status(404).json({
        error: 'Clip not found',
        id
      });
    }

    if (clip.deleted) {
      return res.status(410).json({
        error: 'Clip was deleted',
        id
      });
    }

    res.json({ clip });
  } catch (error) {
    logger.error('Error fetching clip', { error: error.message, id: req.params.id });
    res.status(500).json({
      error: 'Failed to fetch clip',
      message: error.message
    });
  }
});

/**
 * PUT /api/clips/:id
 * Update an existing clip
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Ensure ID matches
    updates.id = id;

    // Check if clip exists
    const existing = getClipById(id);
    if (!existing) {
      return res.status(404).json({
        error: 'Clip not found',
        id
      });
    }

    // Merge updates with existing data
    const updatedClip = saveClip({
      ...existing,
      ...updates,
      updatedAt: Date.now()
    });

    logger.info('Clip updated', { id });

    res.json({
      message: 'Clip updated successfully',
      clip: updatedClip
    });
  } catch (error) {
    logger.error('Error updating clip', { error: error.message, id: req.params.id });
    res.status(500).json({
      error: 'Failed to update clip',
      message: error.message
    });
  }
});

/**
 * DELETE /api/clips/:id
 * Soft delete a clip
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const deleted = deleteClip(id);

    if (!deleted) {
      return res.status(404).json({
        error: 'Clip not found',
        id
      });
    }

    logger.info('Clip deleted', { id });

    res.json({
      message: 'Clip deleted successfully',
      id
    });
  } catch (error) {
    logger.error('Error deleting clip', { error: error.message, id: req.params.id });
    res.status(500).json({
      error: 'Failed to delete clip',
      message: error.message
    });
  }
});

/**
 * GET /api/clips/stats
 * Get database statistics
 */
router.get('/stats/summary', (req, res) => {
  try {
    const stats = getStats();

    res.json({
      stats,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Error fetching stats', { error: error.message });
    res.status(500).json({
      error: 'Failed to fetch stats',
      message: error.message
    });
  }
});

export default router;
