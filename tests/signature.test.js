import { sign, verify } from '../src/services/signature.service.js';

describe('signature.service', () => {
  const secret = 'a'.repeat(64);
  const timestamp = '1710000000000';
  const body = JSON.stringify({ id: 'abc', event: 'payment.success', payload: { x: 1 } });

  test('same inputs produce the same signature', () => {
    const first = sign(secret, timestamp, body);
    const second = sign(secret, timestamp, body);

    expect(first).toBe(second);
    expect(first).toHaveLength(64);
  });

  test('verify passes on a valid signature', () => {
    const signature = sign(secret, timestamp, body);

    expect(verify(secret, timestamp, body, signature)).toBe(true);
  });

  test('verify fails on tampered body', () => {
    const signature = sign(secret, timestamp, body);
    const tamperedBody = JSON.stringify({ id: 'abc', event: 'payment.success', payload: { x: 2 } });

    expect(verify(secret, timestamp, tamperedBody, signature)).toBe(false);
  });

  test('verify fails on tampered timestamp', () => {
    const signature = sign(secret, timestamp, body);

    expect(verify(secret, '1710000000001', body, signature)).toBe(false);
  });

  test('verify fails on wrong secret', () => {
    const signature = sign(secret, timestamp, body);
    const wrongSecret = 'b'.repeat(64);

    expect(verify(wrongSecret, timestamp, body, signature)).toBe(false);
  });
});
