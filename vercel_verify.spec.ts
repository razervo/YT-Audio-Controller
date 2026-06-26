import { test, expect } from '@playwright/test';

test('Vercel production build verification', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await expect(page).toHaveTitle(/RoutePilot/i);
  await expect(page.getByText('Import Jobsheet')).toBeVisible();

  // Check for PWA manifest link in head
  const manifest = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifest).toContain('manifest.webmanifest');

  // Check for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Error:', msg.text());
    }
  });
});
