import { test, expect } from '@playwright/test';

test.describe('PWA Functionality', () => {
  test('should have valid manifest', async ({ page }) => {
    await page.goto('/');
    
    // Check if manifest is linked
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', './manifest.json');
    
    // Fetch and validate manifest
    const manifestResponse = await page.request.get('/manifest.json');
    expect(manifestResponse.status()).toBe(200);
    
    const manifest = await manifestResponse.json();
    expect(manifest.name).toBe('大富豪 - Lisp Rule Engine');
    expect(manifest.short_name).toBe('大富豪');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('./index.html');
  });

  test('should register service worker', async ({ page }) => {
    await page.goto('/');
    
    // Wait for service worker registration
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('./sw.js');
          return registration ? true : false;
        } catch (error) {
          return false;
        }
      }
      return false;
    });
    
    expect(swRegistered).toBe(true);
  });

  test('should have proper PWA meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check theme color
    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveAttribute('content', '#059669');
    
    // Check Apple mobile web app meta tags
    const appleMobileCapable = page.locator('meta[name="apple-mobile-web-app-capable"]');
    await expect(appleMobileCapable).toHaveAttribute('content', 'yes');
    
    const appleTitle = page.locator('meta[name="apple-mobile-web-app-title"]');
    await expect(appleTitle).toHaveAttribute('content', '大富豪');
  });

  test('should display demo cards with PWA features', async ({ page }) => {
    await page.goto('/');
    
    // Wait for PWA initialization and demo cards
    await page.waitForTimeout(2000);
    
    // Check if demo cards are displayed
    const humanCards = page.locator('#human-cards .card');
    await expect(humanCards).toHaveCount(5);
    
    // Check if cards are clickable (selection functionality)
    const firstCard = humanCards.first();
    await firstCard.click();
    
    // Verify card selection styling
    await expect(firstCard).toHaveClass(/card-selected/);
    
    // Check status updates
    const gameStatus = page.locator('#game-status');
    await expect(gameStatus).toContainText('デモカード表示中');
  });

  test('should handle offline functionality', async ({ page, context }) => {
    await page.goto('/');
    
    // Wait for service worker to be ready
    await page.waitForTimeout(1000);
    
    // Simulate offline
    await context.setOffline(true);
    
    // Refresh page to test cached resources
    await page.reload();
    
    // Page should still load from cache
    const title = page.locator('h1');
    await expect(title).toHaveText('大富豪');
    
    // Restore online
    await context.setOffline(false);
  });

  test('should have responsive design for mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check if layout adapts to mobile
    const container = page.locator('.container');
    await expect(container).toBeVisible();
    
    // Check if cards are responsive
    const humanCards = page.locator('#human-cards');
    await expect(humanCards).toHaveClass(/flex/);
    
    // Wait for demo cards
    await page.waitForTimeout(2000);
    
    // Verify cards are displayed properly on mobile
    const cards = page.locator('#human-cards .card');
    await expect(cards).toHaveCount(5);
  });
});