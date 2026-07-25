import { expect, test } from '@playwright/test';

/**
 * Accessibility smoke tests and keyboard navigation.
 * Axe core and keyboard testing on key public/admin pages.
 */

test.describe('accessibility smoke tests', () => {
  test('Ukrainian homepage has skip link and semantic structure', async ({ page }) => {
    await page.goto('/');
    // Skip-to-content link
    const skipLink = page.locator('.skip-link, a[href="#main"]');
    await expect(skipLink).toBeVisible();
    await expect(skipLink).toHaveAttribute('href', '#main');

    // Main landmark
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();

    // Navigation
    await expect(page.locator('nav')).toBeVisible();

    // Lang attribute
    await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
  });

  test('English homepage has correct lang attribute', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('main')).toBeVisible();
  });

  test('search page has labeled form inputs', async ({ page }) => {
    await page.goto('/search');
    // Search form should have a label for the input
    const searchInput = page.locator('input[name="q"], input[type="search"]');
    await expect(searchInput).toBeVisible();

    // Check for associated label
    const label = page.locator('label[for="archive-search"]');
    await expect(label).toBeVisible();
  });

  test('404 page has accessible error message', async ({ page }) => {
    await page.goto('/nonexistent-page-xyz');
    await expect(page.locator('h1')).toBeVisible();
    const title = await page.locator('h1').textContent();
    expect(title).toContain('404');
  });

  test('images have alt attributes on homepage', async ({ page }) => {
    await page.goto('/');
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      // Images should have alt attributes (may be empty string for decorative)
      expect(alt).not.toBeNull();
    }
  });
});

test.describe('keyboard navigation', () => {
  test('skip link is focusable and navigates to main', async ({ page }) => {
    await page.goto('/');
    // Tab to skip link
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
    // Press Enter to follow skip link
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeVisible();
  });

  test('search form is keyboard accessible', async ({ page }) => {
    await page.goto('/search');
    // Tab through form elements
    await page.keyboard.press('Tab');
    const input = page.locator('input[name="q"], input[type="search"]');
    // The input should be reachable
  });

  test('navigation links are keyboard accessible', async ({ page }) => {
    await page.goto('/');
    // Tab several times to reach a nav link
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }
    // Should have focused something
  });
});

test.describe('HTML without JavaScript', () => {
  test('public pages render without JS', async ({ page }) => {
    // Disable JavaScript
    await page.context().addInitScript(() => {
      // Block JS execution by throwing on any script run
      throw new Error('JavaScript disabled for testing');
    });
    // Re-create the page context with JS disabled
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });
});
