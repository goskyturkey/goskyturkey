import { describe, expect, it } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Simple health check test without full app
const app = express();
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        message: 'GoSkyTurkey API is running!',
        timestamp: new Date().toISOString()
    });
});

describe('Health Check API', () => {
    it('GET /api/health should return status ok', async () => {
        const response = await request(app)
            .get('/api/health')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body).toHaveProperty('status', 'ok');
        expect(response.body).toHaveProperty('message', 'GoSkyTurkey API is running!');
        expect(response.body).toHaveProperty('timestamp');
    });
});
