import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { percySnapshot } from '@percy/playwright';
import { getJwtToken, loginWithToken } from './helpers/auth';

const viewports = [
  { width: 320, height: 800 },
  { width: 375, height: 800 },
  { width: 768, height: 900 },
  { width: 1024, height: 900 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 }
];

const hasAuthCreds = Boolean(process.env.E2E_EMAIL && process.env.E2E_PASSWORD);

function percyEnabled(): boolean {
  return Boolean(process.env.PERCY_SERVER_ADDRESS);
}

test.describe('Visual regression (pixel baseline)', () => {
  for (const vp of viewports) {
    test(`login - ${vp.width}x${vp.height}`, async ({ page }) => {
      await page.setViewportSize(vp);
      await page.goto('/login');
      await expect(page).toHaveScreenshot(`login-${vp.width}.png`, { fullPage: true });
      if (percyEnabled()) await percySnapshot(page, `login-${vp.width}`);
    });
  }

  test.describe('Authenticated', () => {
    test.skip(!hasAuthCreds, 'Set E2E_EMAIL e E2E_PASSWORD per abilitare i test auth');

    for (const vp of viewports) {
      test(`home (auth) - ${vp.width}x${vp.height}`, async ({ page, request }) => {
        await page.setViewportSize(vp);
        const token = await getJwtToken(request);
        await loginWithToken(page, token);
        await page.goto('/home');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveScreenshot(`home-${vp.width}.png`, { fullPage: true });
        if (percyEnabled()) await percySnapshot(page, `home-${vp.width}`);
      });
    }
  });
});

test.describe('A11y smoke (WCAG 2.2 AA, baseline)', () => {
  test.skip(!hasAuthCreds, 'Set E2E_EMAIL e E2E_PASSWORD per abilitare i test auth');

  test('home has no serious/critical violations', async ({ page, request }) => {
    const token = await getJwtToken(request);
    await loginWithToken(page, token);
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    const seriousOrWorse = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
    expect(seriousOrWorse).toEqual([]);
  });
});
