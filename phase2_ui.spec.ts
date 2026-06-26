import { test, expect } from '@playwright/test';

test('Phase 2 UI verification', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  // Verify Header
  await expect(page.getByText('RoutePilot')).toBeVisible();
  await expect(page.getByText('Phase 2 Engine')).toBeVisible();

  // Verify Capture View
  await expect(page.getByText('Import Jobsheet')).toBeVisible();
  await expect(page.getByRole('button', { name: 'SELECT SCREENSHOTS' })).toBeVisible();

  // Navigate to Route
  await page.getByRole('button', { name: 'Route' }).click();
  await expect(page.getByText('Your Route')).toBeVisible();
  await expect(page.getByPlaceholder('Search customer or address...')).toBeVisible();

  // Navigate to Stats (Settings icon in my code triggers view change to stats/settings)
  // In App.tsx:
  // <button onClick={() => setView('stats')} ...><BarChart3 /></button>
  // <button onClick={() => setView('settings')} ...><SettingsIcon /></button>

  await page.getByRole('button', { name: 'Config' }).click();
  await expect(page.getByText('Settings')).toBeVisible();
  await expect(page.getByText('Address Engine v2')).toBeVisible();
});
