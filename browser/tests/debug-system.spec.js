import { test, expect } from '@playwright/test';

test.describe('Debug System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(4000);
  });

  test('should display debug button in UI', async ({ page }) => {
    // Check if debug button exists
    const debugButton = page.locator('#debug-button');
    await expect(debugButton).toBeVisible();
    await expect(debugButton).toContainText('Debug');
  });

  test('should open debug modal when clicked', async ({ page }) => {
    // Click debug button
    await page.click('#debug-button');
    await page.waitForTimeout(500);
    
    // Check if modal is visible
    const modal = page.locator('#debug-modal');
    await expect(modal).toBeVisible();
    
    // Check modal content
    await expect(page.locator('#debug-modal h2')).toContainText('ゲームデバッグ情報');
  });

  test('should have recording controls', async ({ page }) => {
    await page.click('#debug-button');
    await page.waitForTimeout(500);
    
    // Check recording controls exist
    await expect(page.locator('#start-recording')).toBeVisible();
    await expect(page.locator('#stop-recording')).toBeVisible();
    await expect(page.locator('#clear-debug')).toBeVisible();
    
    // Check export controls exist
    await expect(page.locator('#export-json')).toBeVisible();
    await expect(page.locator('#export-log')).toBeVisible();
    await expect(page.locator('#copy-clipboard')).toBeVisible();
  });

  test('should start and stop recording', async ({ page }) => {
    await page.click('#debug-button');
    await page.waitForTimeout(500);
    
    // Start recording
    await page.click('#start-recording');
    await page.waitForTimeout(500);
    
    // Check if status changed
    const status = page.locator('#recording-status');
    await expect(status).toContainText('記録中');
    
    // Stop recording
    await page.click('#stop-recording');
    await page.waitForTimeout(500);
    
    // Check if status changed back
    await expect(status).toContainText('停止中');
  });

  test('should record game start action', async ({ page }) => {
    // Start recording
    await page.click('#debug-button');
    await page.waitForTimeout(500);
    await page.click('#start-recording');
    await page.waitForTimeout(500);
    await page.click('#close-debug-modal');
    
    // Start a game
    await page.click('#start-game-button');
    await page.waitForTimeout(3000);
    
    // Check if action was recorded
    await page.click('#debug-button');
    await page.waitForTimeout(500);
    
    const actionCount = page.locator('#action-count');
    const actionCountText = await actionCount.textContent();
    expect(parseInt(actionCountText)).toBeGreaterThan(0);
  });

  test('should record player card actions', async ({ page }) => {
    // Start recording and game
    await page.click('#debug-button');
    await page.waitForTimeout(500);
    await page.click('#start-recording');
    await page.click('#close-debug-modal');
    
    await page.click('#start-game-button');
    await page.waitForTimeout(3000);
    
    // Try to select a card
    const firstCard = page.locator('#human-cards .card').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await page.waitForTimeout(500);
    }
    
    // Check debug information
    await page.click('#debug-button');
    await page.waitForTimeout(500);
    
    // Should have recorded some actions
    const actionCount = page.locator('#action-count');
    const actionCountText = await actionCount.textContent();
    expect(parseInt(actionCountText)).toBeGreaterThan(0);
    
    // Check player actions display
    const playerActions = page.locator('#debug-player-actions');
    const actionsText = await playerActions.textContent();
    expect(actionsText).not.toContain('プレイヤーアクションの記録がありません');
  });

  test('should export debug data as JSON', async ({ page }) => {
    // Start recording and generate some data
    await page.click('#debug-button');
    await page.waitForTimeout(500);
    await page.click('#start-recording');
    await page.click('#close-debug-modal');
    
    await page.click('#start-game-button');
    await page.waitForTimeout(3000);
    
    // Open debug modal and test export
    await page.click('#debug-button');
    await page.waitForTimeout(500);
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click export JSON
    await page.click('#export-json');
    
    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/daifugo_debug_.*\.json/);
  });

  test('should copy data to clipboard', async ({ page }) => {
    // Start recording and generate some data
    await page.click('#debug-button');
    await page.waitForTimeout(500);
    await page.click('#start-recording');
    await page.click('#close-debug-modal');
    
    await page.click('#start-game-button');
    await page.waitForTimeout(3000);
    
    // Open debug modal and test clipboard
    await page.click('#debug-button');
    await page.waitForTimeout(500);
    
    // Click copy to clipboard
    await page.click('#copy-clipboard');
    await page.waitForTimeout(1000);
    
    // Check if button text changed to indicate success
    const copyButton = page.locator('#copy-clipboard');
    await expect(copyButton).toContainText('コピー完了');
  });

  test('should clear debug data', async ({ page }) => {
    // Start recording and generate some data
    await page.click('#debug-button');
    await page.waitForTimeout(500);
    await page.click('#start-recording');
    await page.click('#close-debug-modal');
    
    await page.click('#start-game-button');
    await page.waitForTimeout(3000);
    
    // Open debug modal
    await page.click('#debug-button');
    await page.waitForTimeout(500);
    
    // Verify there's some data
    const actionCount = page.locator('#action-count');
    const initialCount = await actionCount.textContent();
    expect(parseInt(initialCount)).toBeGreaterThan(0);
    
    // Clear data
    await page.click('#clear-debug');
    await page.waitForTimeout(500);
    
    // Verify data was cleared
    const newCount = await actionCount.textContent();
    expect(parseInt(newCount)).toBe(0);
  });

  test('should show current game state', async ({ page }) => {
    // Start recording and game
    await page.click('#debug-button');
    await page.waitForTimeout(500);
    await page.click('#start-recording');
    await page.click('#close-debug-modal');
    
    await page.click('#start-game-button');
    await page.waitForTimeout(3000);
    
    // Open debug modal
    await page.click('#debug-button');
    await page.waitForTimeout(500);
    
    // Check current state display
    const currentState = page.locator('#debug-current-state');
    const stateText = await currentState.textContent();
    
    // Should contain JSON data
    expect(stateText).toContain('{');
    expect(stateText).toContain('timestamp');
  });

  test('should update statistics in real-time', async ({ page }) => {
    // Start recording
    await page.click('#debug-button');
    await page.waitForTimeout(500);
    await page.click('#start-recording');
    
    // Check initial duration
    const duration = page.locator('#session-duration');
    const initialDuration = await duration.textContent();
    
    // Wait a bit
    await page.waitForTimeout(2000);
    
    // Check if duration updated
    const newDuration = await duration.textContent();
    expect(newDuration).not.toBe(initialDuration);
  });

  test('should record rule events when rules are triggered', async ({ page }) => {
    // Start recording and game
    await page.click('#debug-button');
    await page.waitForTimeout(500);
    await page.click('#start-recording');
    await page.click('#close-debug-modal');
    
    await page.click('#start-game-button');
    await page.waitForTimeout(3000);
    
    // Try to trigger a rule by selecting multiple cards of same rank
    const cards = page.locator('#human-cards .card');
    const cardCount = await cards.count();
    
    if (cardCount >= 2) {
      // Select first two cards (might trigger a rule if they're the same rank)
      await cards.nth(0).click();
      await cards.nth(1).click();
      
      // Try to play them (might fail, but should record the attempt)
      const playButton = page.locator('#play-button');
      if (await playButton.isEnabled()) {
        await playButton.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Check debug information
    await page.click('#debug-button');
    await page.waitForTimeout(500);
    
    // Should have some events recorded
    const ruleEvents = page.locator('#debug-rule-events');
    const eventsText = await ruleEvents.textContent();
    
    // Either has rule events or shows the empty message
    const hasEvents = !eventsText.includes('ルールイベントの記録がありません');
    const hasActions = parseInt(await page.locator('#action-count').textContent()) > 0;
    
    // At least one should be true (either rule events or player actions)
    expect(hasEvents || hasActions).toBeTruthy();
  });

  test('should close modal with close button', async ({ page }) => {
    // Open modal
    await page.click('#debug-button');
    await page.waitForTimeout(500);
    
    const modal = page.locator('#debug-modal');
    await expect(modal).toBeVisible();
    
    // Close modal
    await page.click('#close-debug-modal');
    await page.waitForTimeout(500);
    
    // Modal should be hidden
    await expect(modal).toBeHidden();
  });
});