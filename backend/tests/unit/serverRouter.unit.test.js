import { jest } from '@jest/globals';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const createServer = jest.fn((req, res) => res.sendStatus(201));
const deleteServer = jest.fn((req, res) => res.sendStatus(204));
const listServers = jest.fn((req, res) => res.status(200).json([]));

jest.unstable_mockModule('../../src/controllers/serverController.js', () => ({
  createServer,
  deleteServer,
  listServers,
}));

const serverRouter = (await import('../../src/routes/serverRouter.js')).default;

describe('serverRouter authorization', () => {
  let app;

  const tokenFor = (role) =>
    jwt.sign({ userId: 'test-user', role }, process.env.JWT_SECRET_KEY);

  beforeAll(() => {
    process.env.JWT_SECRET_KEY = 'server-router-test-secret';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/servers', serverRouter);
  });

  it('allows an authenticated viewer to list servers', async () => {
    await request(app)
      .get('/api/servers')
      .set('Authorization', `Bearer ${tokenFor('viewer')}`)
      .expect(200);

    expect(listServers).toHaveBeenCalled();
  });

  it.each(['viewer', 'admin', 'operator'])(
    'only allows admins and operators to create or delete servers (%s)',
    async (role) => {
      const token = tokenFor(role);
      const canManageServers = role === 'admin' || role === 'operator';
      const expectedStatus = canManageServers ? 201 : 403;

      await request(app)
        .post('/api/servers')
        .set('Authorization', `Bearer ${token}`)
        .send({ serverId: 'server-1', ip: '127.0.0.1' })
        .expect(expectedStatus);

      await request(app)
        .delete('/api/servers/server-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(canManageServers ? 204 : 403);

      expect(createServer).toHaveBeenCalledTimes(canManageServers ? 1 : 0);
      expect(deleteServer).toHaveBeenCalledTimes(canManageServers ? 1 : 0);
    }
  );
});
