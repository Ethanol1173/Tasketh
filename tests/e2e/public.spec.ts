import { test, expect } from '@playwright/test';
test('landing, responsive layout, and working navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Less planning. More doing.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Get Started', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('link', { name: 'Get Started', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Choose Your Vibe' })).toBeVisible();
});
test('all six themes preview instantly, persist on reload, and carry into signup', async ({
  page,
}) => {
  await page.goto('/onboarding/theme');
  for (const [id, name] of [
    ['midnight', 'Midnight'],
    ['plum', 'Plum'],
    ['forest', 'Forest'],
    ['rose', 'Rose'],
    ['ivory', 'Ivory'],
    ['obsidian', 'Obsidian'],
  ]) {
    await page.getByRole('button', { name: new RegExp(name) }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', id);
  }
  await page.getByRole('button', { name: /Plum/ }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'plum');
  await page.getByRole('link', { name: 'This feels like me' }).click();
  await expect(page.locator('input[name="selected_theme"]')).toHaveValue('plum');
  await expect(page.getByLabel('Username *', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Confirm Password *', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
test('password visibility, recovery navigation, and private route protection', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Password *', { exact: true }).fill('SecretExample123');
  await page.getByRole('button', { name: 'Show Password *', exact: true }).click();
  await expect(page.getByLabel('Password *', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('link', { name: 'Forgot your password?' }).click();
  await expect(page.getByRole('heading', { name: 'Let’s get you back in.' })).toBeVisible();
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
});
test('recommendation endpoint rejects anonymous or unconfigured callers and bad origins', async ({
  request,
}) => {
  const response = await request.post('/api/recommendations', { data: { available_minutes: 30 } });
  expect([401, 503]).toContain(response.status());
  const denied = await request.post('/api/recommendations', {
    headers: { origin: 'https://untrusted.example' },
    data: { available_minutes: 30 },
  });
  expect(denied.status()).toBe(403);
});
test('no unhandled browser errors on the public journey', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('link', { name: 'Get Started', exact: true }).click();
  await page.getByRole('link', { name: 'This feels like me' }).click();
  await page.getByRole('link', { name: 'Privacy & recommendations', exact: false }).first().click();
  await expect(page.getByRole('heading', { name: 'Privacy & recommendations', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
