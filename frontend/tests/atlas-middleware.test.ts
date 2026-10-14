import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomBytes } from 'node:crypto';
import { SignJWT } from 'jose';
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';

test('invalid and expired cookies permit login and are cleared, valid sessions preserve navigation', async () => {
  const previous = process.env.JWT_SECRET;
  const key = randomBytes(48).toString('hex');
  process.env.JWT_SECRET = key;
  const request = (path: string, cookie?: string) => new NextRequest(`http://localhost${path}`, { headers: cookie ? { cookie: `session=${cookie}` } : {} });
  try {
    const invalidLogin = await middleware(request('/login', 'invalid'));
    assert.equal(invalidLogin.headers.get('location'), null);
    assert.equal(invalidLogin.cookies.get('session')?.value, '');
    const invalidAtlas = await middleware(request('/atlas', 'invalid'));
    assert.equal(invalidAtlas.headers.get('location'), 'http://localhost/login');
    const token = await new SignJWT({ userId: 'test-user', role: 'admin' }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('5m').sign(new TextEncoder().encode(key));
    assert.equal((await middleware(request('/atlas', token))).headers.get('location'), null);
    assert.equal((await middleware(request('/login', token))).headers.get('location'), 'http://localhost/');
    const expired = await new SignJWT({ userId: 'test-user', role: 'admin' }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime(1).sign(new TextEncoder().encode(key));
    assert.equal((await middleware(request('/login', expired))).headers.get('location'), null);
    assert.equal((await middleware(request('/atlas'))).headers.get('location'), 'http://localhost/login');
  } finally {
    if (previous === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previous;
  }
});
