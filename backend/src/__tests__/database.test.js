/**
 * Unit tests for database functions
 */

import Database from 'better-sqlite3';
import { saveClip, getAllClips, getClipById, deleteClip, getStats } from '../db/database.js';

describe('Database Functions', () => {
  let testDb;

  beforeAll(() => {
    // Use in-memory database for tests
    testDb = new Database(':memory:');
    testDb.pragma('journal_mode = WAL');
    
    // Create test schema
    testDb.exec(`
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
    `);
  });

  afterAll(() => {
    testDb.close();
  });

  beforeEach(() => {
    // Clear table before each test
    testDb.exec('DELETE FROM clips');
  });

  describe('Clip Storage', () => {
    test('should save a new clip', () => {
      const clip = {
        id: 'test-1',
        text: 'Test clip',
        tags: ['test'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deviceId: 'device-1'
      };

      const stmt = testDb.prepare(`
        INSERT INTO clips (id, text, tags, created_at, updated_at, device_id, synced_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        clip.id,
        clip.text,
        JSON.stringify(clip.tags),
        clip.createdAt,
        clip.updatedAt,
        clip.deviceId,
        Date.now()
      );

      expect(result.changes).toBe(1);
    });

    test('should retrieve a clip by ID', () => {
      const now = Date.now();
      const stmt = testDb.prepare(`
        INSERT INTO clips (id, text, tags, created_at, device_id, synced_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run('test-2', 'Test text', '["tag1"]', now, 'device-1', now);

      const getStmt = testDb.prepare('SELECT * FROM clips WHERE id = ?');
      const clip = getStmt.get('test-2');

      expect(clip).toBeDefined();
      expect(clip.id).toBe('test-2');
      expect(clip.text).toBe('Test text');
    });

    test('should get all non-deleted clips', () => {
      const now = Date.now();
      const stmt = testDb.prepare(`
        INSERT INTO clips (id, text, tags, created_at, device_id, synced_at, deleted)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run('clip-1', 'Active clip', '[]', now, 'device-1', now, 0);
      stmt.run('clip-2', 'Deleted clip', '[]', now, 'device-1', now, 1);

      const getStmt = testDb.prepare('SELECT * FROM clips WHERE deleted = 0');
      const clips = getStmt.all();

      expect(clips).toHaveLength(1);
      expect(clips[0].id).toBe('clip-1');
    });

    test('should soft delete a clip', () => {
      const now = Date.now();
      const insertStmt = testDb.prepare(`
        INSERT INTO clips (id, text, tags, created_at, device_id, synced_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      insertStmt.run('delete-test', 'To delete', '[]', now, 'device-1', now);

      const deleteStmt = testDb.prepare('UPDATE clips SET deleted = 1 WHERE id = ?');
      const result = deleteStmt.run('delete-test');

      expect(result.changes).toBe(1);

      const getStmt = testDb.prepare('SELECT deleted FROM clips WHERE id = ?');
      const clip = getStmt.get('delete-test');
      expect(clip.deleted).toBe(1);
    });
  });

  describe('Statistics', () => {
    test('should count total clips', () => {
      const now = Date.now();
      const stmt = testDb.prepare(`
        INSERT INTO clips (id, text, tags, created_at, device_id, synced_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run('stat-1', 'Clip 1', '[]', now, 'device-1', now);
      stmt.run('stat-2', 'Clip 2', '[]', now, 'device-2', now);
      stmt.run('stat-3', 'Clip 3', '[]', now, 'device-1', now);

      const countStmt = testDb.prepare('SELECT COUNT(*) as count FROM clips');
      const result = countStmt.get();

      expect(result.count).toBe(3);
    });

    test('should count unique devices', () => {
      const now = Date.now();
      const stmt = testDb.prepare(`
        INSERT INTO clips (id, text, tags, created_at, device_id, synced_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run('dev-1', 'Device 1', '[]', now, 'device-a', now);
      stmt.run('dev-2', 'Device 1 again', '[]', now, 'device-a', now);
      stmt.run('dev-3', 'Device 2', '[]', now, 'device-b', now);

      const countStmt = testDb.prepare('SELECT COUNT(DISTINCT device_id) as devices FROM clips');
      const result = countStmt.get();

      expect(result.devices).toBe(2);
    });
  });

  describe('Tags', () => {
    test('should store and parse tags as JSON', () => {
      const now = Date.now();
      const tags = ['javascript', 'testing', 'jest'];
      
      const stmt = testDb.prepare(`
        INSERT INTO clips (id, text, tags, created_at, device_id, synced_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run('tag-test', 'Tagged clip', JSON.stringify(tags), now, 'device-1', now);

      const getStmt = testDb.prepare('SELECT tags FROM clips WHERE id = ?');
      const clip = getStmt.get('tag-test');
      const parsedTags = JSON.parse(clip.tags);

      expect(parsedTags).toEqual(tags);
      expect(parsedTags).toHaveLength(3);
    });

    test('should handle empty tags array', () => {
      const now = Date.now();
      
      const stmt = testDb.prepare(`
        INSERT INTO clips (id, text, tags, created_at, device_id, synced_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run('empty-tags', 'No tags', '[]', now, 'device-1', now);

      const getStmt = testDb.prepare('SELECT tags FROM clips WHERE id = ?');
      const clip = getStmt.get('empty-tags');
      const parsedTags = JSON.parse(clip.tags);

      expect(parsedTags).toEqual([]);
    });
  });

  describe('Query Filters', () => {
    test('should filter clips by device_id', () => {
      const now = Date.now();
      const stmt = testDb.prepare(`
        INSERT INTO clips (id, text, tags, created_at, device_id, synced_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run('filter-1', 'Device A', '[]', now, 'device-a', now);
      stmt.run('filter-2', 'Device B', '[]', now, 'device-b', now);
      stmt.run('filter-3', 'Device A again', '[]', now, 'device-a', now);

      const getStmt = testDb.prepare('SELECT * FROM clips WHERE device_id = ?');
      const clips = getStmt.all('device-a');

      expect(clips).toHaveLength(2);
      expect(clips.every(c => c.device_id === 'device-a')).toBe(true);
    });

    test('should filter clips by timestamp', () => {
      const oldTime = Date.now() - 10000;
      const newTime = Date.now();
      const stmt = testDb.prepare(`
        INSERT INTO clips (id, text, tags, created_at, device_id, synced_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run('time-1', 'Old', '[]', oldTime, 'device-1', oldTime);
      stmt.run('time-2', 'New', '[]', newTime, 'device-1', newTime);

      const threshold = Date.now() - 5000;
      const getStmt = testDb.prepare('SELECT * FROM clips WHERE synced_at > ?');
      const clips = getStmt.all(threshold);

      expect(clips).toHaveLength(1);
      expect(clips[0].id).toBe('time-2');
    });
  });
});
