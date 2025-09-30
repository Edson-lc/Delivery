import request from 'supertest';
import app from '../src/app';
import { prisma, testHelpers } from './setup';
import bcrypt from 'bcryptjs';

describe('Authentication Routes', () => {
  beforeEach(async () => {
    // Limpar dados de teste
    await prisma.user.deleteMany();
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Criar usuário de teste
      const passwordHash = await bcrypt.hash('password123', 10);
      const testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          fullName: 'Test User',
          passwordHash,
          status: 'ativo',
        },
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject inactive user', async () => {
      // Criar usuário inativo
      const passwordHash = await bcrypt.hash('password123', 10);
      await prisma.user.create({
        data: {
          email: 'inactive@example.com',
          fullName: 'Inactive User',
          passwordHash,
          status: 'inativo',
        },
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('USER_INACTIVE');
    });

    it('should validate input data', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: '',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should enforce rate limiting', async () => {
      // Fazer múltiplas tentativas de login
      const promises = Array(6).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword',
          })
      );

      const responses = await Promise.all(promises);
      
      // A última resposta deve ser rate limited
      const lastResponse = responses[responses.length - 1];
      expect(lastResponse.status).toBe(429);
      expect(lastResponse.body.error.code).toBe('TOO_MANY_REQUESTS');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user data with valid token', async () => {
      // Criar usuário e fazer login
      const passwordHash = await bcrypt.hash('password123', 10);
      const testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          fullName: 'Test User',
          passwordHash,
          status: 'ativo',
        },
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('test@example.com');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should return 204 for logout', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(204);
    });
  });
});
