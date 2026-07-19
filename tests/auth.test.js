import request from 'supertest';
import app from '../src/app.js';

describe('auth routes', () => {
  test('register returns 201 with token and apiKey', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@relay.com',
        password: 'Pass1234',
        name: 'Test User',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toEqual(expect.any(String));
    expect(response.body.data.apiKey).toMatch(/^whr_/);
    expect(response.body.data.user.email).toBe('test@relay.com');
    expect(response.body.data.user.passwordHash).toBeUndefined();
    expect(response.body.data.user.apiKey).toBeUndefined();
  });

  test('duplicate email returns 409', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'dup@relay.com',
        password: 'Pass1234',
        name: 'First User',
      });

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'dup@relay.com',
        password: 'Pass1234',
        name: 'Second User',
      });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Email already registered');
  });

  test('login with wrong password returns 401', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'login@relay.com',
        password: 'Pass1234',
        name: 'Login User',
      });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@relay.com',
        password: 'WrongPass1',
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Invalid email or password');
  });

  test('rotate-key with valid JWT returns a new apiKey', async () => {
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'rotate@relay.com',
        password: 'Pass1234',
        name: 'Rotate User',
      });

    const oldApiKey = registerResponse.body.data.apiKey;
    const token = registerResponse.body.data.token;

    const response = await request(app)
      .post('/api/auth/rotate-key')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.apiKey).toMatch(/^whr_/);
    expect(response.body.data.apiKey).not.toBe(oldApiKey);
  });
});
