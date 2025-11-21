/**
 * Simple route tests for backend API
 */

import request from 'supertest';
import app from '../server.js';

describe('Backend API Routes', () => {
  // Prevent test timeout issues
  jest.setTimeout(10000);
  

  describe('Health Endpoints', () => {
    test('GET /health should return 200', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
    });

    test('GET /health/detailed should return system info', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
    });

    test('GET /health/live should return liveness', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body.status).toBe('alive');
    });

    test('GET /health/ready should return readiness', async () => {
      const response = await request(app)
        .get('/health/ready')
        .expect(200);

      expect(response.body.status).toBe('ready');
    });
  });

  describe('Metrics Endpoint', () => {
    test('GET /metrics should return Prometheus metrics', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('http_requests_total');
      expect(response.text).toContain('http_request_duration_seconds');
    });
  });

  describe('Telemetry Endpoint', () => {
    test('POST /api/telemetry should accept telemetry data', async () => {
      const telemetryData = {
        event: 'clip_saved',
        timestamp: Date.now(),
        metadata: {
          tags: ['test'],
          source: 'context_menu'
        }
      };

      const response = await request(app)
        .post('/api/telemetry')
        .send(telemetryData)
        .expect(200);

      expect(response.body.status).toBe('received');
    });

    test('POST /api/telemetry should reject invalid data', async () => {
      await request(app)
        .post('/api/telemetry')
        .send({})
        .expect(400);
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for unknown routes', async () => {
      await request(app)
        .get('/unknown-route')
        .expect(404);
    });

    test('should handle malformed JSON', async () => {
      await request(app)
        .post('/api/telemetry')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);
    });
  });

  describe('CORS Headers', () => {
    test('should include CORS headers with origin', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      // CORS headers present when origin is set
      expect(response.headers.vary).toContain('Origin');
    });

    test('should handle OPTIONS preflight', async () => {
      await request(app)
        .options('/api/telemetry')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST');
      
      // Just check it doesn't error
    });
  });

  describe('Security Headers', () => {
    test('should include security headers from helmet', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });
});
