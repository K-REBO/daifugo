import { test, expect } from '@playwright/test';

test.describe('New Layout System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Load modules
    await page.addScriptTag({
      path: './js/card.js',
      type: 'module'
    });
    
    await page.addScriptTag({
      path: './js/player.js',
      type: 'module'
    });
  });

  test('should render 3 CPUs in single row at top', async ({ page }) => {
    await page.evaluate(() => {
      const { PlayerManager } = window.PlayerModule;
      const playerManager = new PlayerManager(4); // 1 human + 3 CPU
      playerManager.renderPlayersUI();
    });
    
    // Wait for rendering
    await page.waitForTimeout(500);
    
    // Check for single row layout
    const playersArea = page.locator('#players-area');
    await expect(playersArea).toHaveClass(/flex/);
    
    // Should have 3 CPU players
    const cpuPlayers = page.locator('.cpu-player');
    await expect(cpuPlayers).toHaveCount(3);
    
    // Check they are horizontally arranged
    const playersContainer = playersArea.locator('> div').first();
    await expect(playersContainer).toHaveClass(/space-x-4/);
  });

  test('should render 6 CPUs in two rows at top', async ({ page }) => {
    await page.evaluate(() => {
      const { PlayerManager } = window.PlayerModule;
      const playerManager = new PlayerManager(7); // 1 human + 6 CPU
      playerManager.renderPlayersUI();
    });
    
    // Wait for rendering
    await page.waitForTimeout(500);
    
    // Should have 6 CPU players total
    const cpuPlayers = page.locator('.cpu-player');
    await expect(cpuPlayers).toHaveCount(6);
    
    // Should have two rows
    const playersArea = page.locator('#players-area');
    const rows = playersArea.locator('> div');
    await expect(rows).toHaveCount(2);
    
    // Each row should be flex with spacing
    await expect(rows.first()).toHaveClass(/flex/);
    await expect(rows.first()).toHaveClass(/space-x-3/);
    await expect(rows.last()).toHaveClass(/flex/);
    await expect(rows.last()).toHaveClass(/space-x-3/);
  });

  test('should show compact CPU players in multi-row layout', async ({ page }) => {
    await page.evaluate(() => {
      const { PlayerManager } = window.PlayerModule;
      const playerManager = new PlayerManager(8); // 1 human + 7 CPU
      playerManager.renderPlayersUI();
    });
    
    // Wait for rendering
    await page.waitForTimeout(500);
    
    // Should have compact class for multi-row
    const compactPlayers = page.locator('.cpu-player-compact');
    await expect(compactPlayers).toHaveCount(7);
    
    // Should have top class for all
    const topPlayers = page.locator('.cpu-player-top');
    await expect(topPlayers).toHaveCount(7);
  });

  test('should maintain turn indicators in new layout', async ({ page }) => {
    await page.evaluate(() => {
      const { PlayerManager } = window.PlayerModule;
      const playerManager = new PlayerManager(4);
      
      // Set second player (CPU1) as current turn
      playerManager.setCurrentPlayer(1);
      playerManager.renderPlayersUI();
    });
    
    // Wait for rendering
    await page.waitForTimeout(500);
    
    // Should have one player with turn indicator
    const turnIndicator = page.locator('.cpu-player:has-text("● ターン")');
    await expect(turnIndicator).toHaveCount(1);
    
    // Should have yellow ring for current player
    const currentPlayer = page.locator('.cpu-player.ring-yellow-400');
    await expect(currentPlayer).toHaveCount(1);
  });

  test('should work with field area positioning', async ({ page }) => {
    // Check field area is properly positioned relative to CPU area
    const playersArea = page.locator('#players-area');
    const fieldArea = page.locator('#field-area');
    
    await expect(playersArea).toBeVisible();
    await expect(fieldArea).toBeVisible();
    
    // Field should have proper margins
    await expect(fieldArea).toHaveClass(/mb-6/);
    await expect(fieldArea).toHaveClass(/mt-4/);
  });
});