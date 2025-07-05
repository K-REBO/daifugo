import { test, expect } from '@playwright/test';

test.describe('Tailwind CSS Setup', () => {
  test('should load page with correct styling', async ({ page }) => {
    await page.goto('/');
    
    // Check if page loads
    await expect(page).toHaveTitle('大富豪 - Lisp Rule Engine');
    
    // Check if Tailwind CSS is applied
    const gameTable = page.locator('body');
    await expect(gameTable).toHaveClass(/game-table/);
    
    // Check if header is styled correctly
    const header = page.locator('h1');
    await expect(header).toHaveText('大富豪');
    await expect(header).toHaveClass(/text-4xl/);
    
    // Check if game container exists
    const gameContainer = page.locator('#game-container');
    await expect(gameContainer).toBeVisible();
    
    // Check if buttons are styled
    const playButton = page.locator('#play-button');
    await expect(playButton).toHaveClass(/button-primary/);
    await expect(playButton).toBeDisabled();
    
    const passButton = page.locator('#pass-button');
    await expect(passButton).toHaveClass(/button-secondary/);
    await expect(passButton).toBeDisabled();
  });
  
  test('should have responsive layout', async ({ page }) => {
    await page.goto('/');
    
    // Test desktop layout
    await page.setViewportSize({ width: 1200, height: 800 });
    const container = page.locator('.container');
    await expect(container).toBeVisible();
    
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(container).toBeVisible();
    
    // Check if cards container is responsive
    const humanCards = page.locator('#human-cards');
    await expect(humanCards).toHaveClass(/flex/);
  });
  
  test('should have card styling classes available', async ({ page }) => {
    await page.goto('/');
    
    // Add a test card to check styling
    await page.evaluate(() => {
      const cardDiv = document.createElement('div');
      cardDiv.className = 'card card-red';
      cardDiv.textContent = '♥A';
      cardDiv.id = 'test-card';
      document.getElementById('human-cards').appendChild(cardDiv);
    });
    
    const testCard = page.locator('#test-card');
    await expect(testCard).toBeVisible();
    await expect(testCard).toHaveClass(/card/);
    await expect(testCard).toHaveClass(/card-red/);
  });
  
  test('should have game status area', async ({ page }) => {
    await page.goto('/');
    
    const gameStatus = page.locator('#game-status');
    await expect(gameStatus).toBeVisible();
    
    // Check initial status changes via JavaScript
    await expect(gameStatus).toHaveText('Tailwind CSS環境構築完了 ✅');
    
    // Wait for status to change after 2 seconds
    await page.waitForTimeout(2500);
    await expect(gameStatus).toHaveText('次のフェーズ: カードシステム実装');
    await expect(gameStatus).toHaveClass(/animate-pulse/);
  });
});