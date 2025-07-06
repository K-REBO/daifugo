import { test, expect } from '@playwright/test';

test.describe('Complete Game Integration', () => {
  test('should load complete game system and allow playing', async ({ page }) => {
    await page.goto('/');
    
    // Wait for game system to load
    await page.waitForTimeout(3000);
    
    // Check if start game button appears
    const startButton = page.locator('#start-game-button');
    await expect(startButton).toBeVisible();
    await expect(startButton).toHaveText('🎮 ゲーム開始');
    
    // Start the game
    await startButton.click();
    
    // Wait for game to initialize
    await page.waitForTimeout(2000);
    
    // Check if game elements are present
    const gameStatus = page.locator('#game-status');
    await expect(gameStatus).toContainText('のターン');
    
    // Check if players are rendered
    const cpuPlayers = page.locator('.cpu-player');
    await expect(cpuPlayers).toHaveCount(3);
    
    // Check if human player has cards
    const humanCards = page.locator('#human-cards .card');
    await expect(humanCards.first()).toBeVisible();
    
    // Check if game controls are enabled
    const playButton = page.locator('#play-button');
    const passButton = page.locator('#pass-button');
    
    // Initially disabled until cards selected
    await expect(playButton).toBeDisabled();
    
    // Pass button should be enabled when it's human turn
    if (await gameStatus.textContent() === 'あなたのターン') {
      await expect(passButton).toBeEnabled();
    }
    
    console.log('✅ Complete game integration test passed');
  });

  test('should handle card selection and playing', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Start game
    await page.click('#start-game-button');
    await page.waitForTimeout(2000);
    
    // Wait for human turn or force it by passing CPU turns
    let attempts = 0;
    while (attempts < 10) {
      const gameStatus = await page.locator('#game-status').textContent();
      if (gameStatus?.includes('あなた')) {
        break;
      }
      await page.waitForTimeout(1000);
      attempts++;
    }
    
    // If it's human turn, test card interaction
    const gameStatus = await page.locator('#game-status').textContent();
    if (gameStatus?.includes('あなた')) {
      // Select a card
      const firstCard = page.locator('#human-cards .card').first();
      await firstCard.click();
      
      // Check if card is selected
      await expect(firstCard).toHaveClass(/card-selected/);
      
      // Play button should be enabled
      const playButton = page.locator('#play-button');
      await expect(playButton).toBeEnabled();
      
      // Try to play the card
      await playButton.click();
      
      // Wait for result
      await page.waitForTimeout(1000);
      
      // Card should be deselected after play
      await expect(firstCard).not.toHaveClass(/card-selected/);
    }
    
    console.log('✅ Card selection and playing test passed');
  });

  test('should show PWA features alongside game', async ({ page }) => {
    await page.goto('/');
    
    // Check PWA elements
    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveAttribute('href', './manifest.json');
    
    // Check if game system loads with PWA
    await page.waitForTimeout(3000);
    
    const startButton = page.locator('#start-game-button');
    await expect(startButton).toBeVisible();
    
    // Check PWA meta tags are present
    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveAttribute('content', '#059669');
    
    console.log('✅ PWA + Game integration test passed');
  });

  test('should handle responsive layout for different player counts', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Start game
    await page.click('#start-game-button');
    await page.waitForTimeout(2000);
    
    // Check if layout adapts
    const playersArea = page.locator('#players-area');
    await expect(playersArea).toBeVisible();
    
    // Check if human cards area is responsive
    const humanCards = page.locator('#human-cards');
    await expect(humanCards).toHaveClass(/flex/);
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(1000);
    
    // Layout should still work
    await expect(playersArea).toBeVisible();
    await expect(humanCards).toBeVisible();
    
    console.log('✅ Responsive layout test passed');
  });

  test('should handle CPU AI turns automatically', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Start game
    await page.click('#start-game-button');
    await page.waitForTimeout(2000);
    
    // Monitor game status changes (CPU turns)
    let statusChanges = 0;
    let lastStatus = '';
    
    for (let i = 0; i < 10; i++) {
      const currentStatus = await page.locator('#game-status').textContent();
      if (currentStatus !== lastStatus) {
        statusChanges++;
        lastStatus = currentStatus;
        console.log(`Status change ${statusChanges}: ${currentStatus}`);
      }
      await page.waitForTimeout(1000);
    }
    
    // Should have multiple status changes as CPU players take turns
    expect(statusChanges).toBeGreaterThan(1);
    
    // Check if field cards update during gameplay
    const fieldCards = page.locator('#field-cards');
    await expect(fieldCards).toBeVisible();
    
    console.log('✅ CPU AI automation test passed');
  });
});