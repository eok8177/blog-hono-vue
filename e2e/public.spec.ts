import { expect, test } from '@playwright/test';

test('public shell renders without client JavaScript', async ({ page }) => {
  await page.goto('/robots.txt');
  await expect(page).toHaveURL(/robots\.txt$/);
  await expect(page.locator('body')).toContainText('Disallow: /admin');
});

test('unknown public URL is a real 404', async ({ request }) => {
  const response = await request.get('/not-found-e2e');
  expect(response.status()).toBe(404);
});
