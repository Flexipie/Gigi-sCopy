/**
 * SQLite Database for Clip Storage
 * Handles cross-device clip synchronization
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'clips.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

/**
 * Initialize database schema
 */
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clips (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      title TEXT,
      url TEXT,
      tags TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER,
      folder_id TEXT,
      source TEXT,
      dup_count INTEGER DEFAULT 1,
      device_id TEXT,
      synced_at INTEGER NOT NULL,
      deleted INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_created_at ON clips(created_at);
    CREATE INDEX IF NOT EXISTS idx_synced_at ON clips(synced_at);
    CREATE INDEX IF NOT EXISTS idx_device_id ON clips(device_id);
    CREATE INDEX IF NOT EXISTS idx_deleted ON clips(deleted);
  `);
}

// Initialize on load
initDatabase();

/**
 * Save or update a clip
 */
export function saveClip(clip) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO clips (
      id, text, title, url, tags, created_at, updated_at,
      folder_id, source, dup_count, device_id, synced_at, deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    clip.id,
    clip.text,
    clip.title || null,
    clip.url || null,
    JSON.stringify(clip.tags || []),
    clip.createdAt,
    clip.updatedAt || null,
    clip.folderId || null,
    clip.source || null,
    clip.dupCount || 1,
    clip.deviceId || null,
    Date.now(),
    clip.deleted || 0
  );

  return {
    ...clip,
    syncedAt: Date.now()
  };
}

/**
 * Get all non-deleted clips
 */
export function getAllClips() {
  const stmt = db.prepare(`
    SELECT * FROM clips 
    WHERE deleted = 0 
    ORDER BY created_at DESC
  `);

  return stmt.all().map(parseClip);
}

/**
 * Get clips modified after a specific timestamp
 */
export function getClipsSince(timestamp) {
  const stmt = db.prepare(`
    SELECT * FROM clips 
    WHERE synced_at > ? 
    ORDER BY created_at DESC
  `);

  return stmt.all(timestamp).map(parseClip);
}

/**
 * Get a single clip by ID
 */
export function getClipById(id) {
  const stmt = db.prepare('SELECT * FROM clips WHERE id = ?');
  const clip = stmt.get(id);
  return clip ? parseClip(clip) : null;
}

/**
 * Delete a clip (soft delete)
 */
export function deleteClip(id) {
  const stmt = db.prepare(`
    UPDATE clips 
    SET deleted = 1, synced_at = ? 
    WHERE id = ?
  `);

  const result = stmt.run(Date.now(), id);
  return result.changes > 0;
}

/**
 * Hard delete all soft-deleted clips older than X days
 */
export function cleanupDeletedClips(daysOld = 30) {
  const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
  
  const stmt = db.prepare(`
    DELETE FROM clips 
    WHERE deleted = 1 AND synced_at < ?
  `);

  const result = stmt.run(cutoffTime);
  return result.changes;
}

/**
 * Get clip count statistics
 */
export function getStats() {
  const stmt = db.prepare(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN deleted = 0 THEN 1 END) as active,
      COUNT(CASE WHEN deleted = 1 THEN 1 END) as deleted,
      COUNT(DISTINCT device_id) as devices
    FROM clips
  `);

  return stmt.get();
}

/**
 * Parse database row to clip object
 */
function parseClip(row) {
  return {
    id: row.id,
    text: row.text,
    title: row.title,
    url: row.url,
    tags: JSON.parse(row.tags || '[]'),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    folderId: row.folder_id,
    source: row.source,
    dupCount: row.dup_count,
    deviceId: row.device_id,
    syncedAt: row.synced_at,
    deleted: row.deleted === 1
  };
}

/**
 * Close database connection
 */
export function closeDatabase() {
  db.close();
}

export default db;
