import type { APIRequestContext, Page } from '@playwright/test';

export async function getJwtToken(request: APIRequestContext): Promise<string> {
  const apiBase = process.env.E2E_API_URL ?? 'http://localhost:8080';
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) {
    throw new Error('Missing E2E_EMAIL or E2E_PASSWORD env vars');
  }

  const res = await request.post(`${apiBase}/api/auth/login`, {
    data: { email, password }
  });
  if (!res.ok()) {
    throw new Error(`Login failed: ${res.status()} ${res.statusText()}`);
  }
  const body = (await res.json()) as { token?: string };
  if (!body.token) throw new Error('Login response missing token');
  return body.token;
}

export async function loginWithToken(page: Page, token: string): Promise<void> {
  await page.addInitScript((t) => {
    localStorage.setItem('token', t);
  }, token);
}

