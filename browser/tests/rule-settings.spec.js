import { test, expect } from '@playwright/test';

test.describe('Lisp Rule Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for all modules to load
    await page.waitForTimeout(4000);
  });

  test('should open rule settings modal', async ({ page }) => {
    // Click settings button
    await page.click('#settings-button');
    
    // Wait for modal to appear
    await page.waitForTimeout(500);
    
    // Check if modal is visible
    const modal = page.locator('#rule-settings-modal');
    await expect(modal).toBeVisible();
    
    // Check modal content with more specific selectors
    await expect(page.locator('#rule-settings-modal h2')).toContainText('ルール設定');
    await expect(page.locator('#rule-settings-modal h3').first()).toContainText('利用可能なルール');
  });

  test('should display default rules with checkboxes', async ({ page }) => {
    await page.click('#settings-button');
    await page.waitForTimeout(500);
    
    // Check for basic rules
    const revolutionRule = page.locator('text=革命');
    await expect(revolutionRule).toBeVisible();
    
    const eightCutRule = page.locator('text=8切り');
    await expect(eightCutRule).toBeVisible();
    
    // Check checkboxes exist
    const checkboxes = page.locator('.rule-checkbox');
    await expect(checkboxes).toHaveCount(6); // 6 default rules
    
    // Revolution and 8-cut should be checked by default
    const revolutionCheckbox = page.locator('[data-rule-id="revolution"]');
    await expect(revolutionCheckbox).toBeChecked();
    
    const eightCutCheckbox = page.locator('[data-rule-id="eight-cut"]');
    await expect(eightCutCheckbox).toBeChecked();
  });

  test('should toggle rule checkboxes', async ({ page }) => {
    await page.click('#settings-button');
    await page.waitForTimeout(500);
    
    // Find an unchecked advanced rule
    const elevenBackCheckbox = page.locator('[data-rule-id="eleven-back"]');
    await expect(elevenBackCheckbox).not.toBeChecked();
    
    // Click to enable it
    await elevenBackCheckbox.click();
    await expect(elevenBackCheckbox).toBeChecked();
    
    // Click to disable revolution
    const revolutionCheckbox = page.locator('[data-rule-id="revolution"]');
    await revolutionCheckbox.click();
    await expect(revolutionCheckbox).not.toBeChecked();
  });

  test('should show Lisp code preview when clicking rules', async ({ page }) => {
    await page.click('#settings-button');
    await page.waitForTimeout(500);
    
    // Click on revolution rule
    const revolutionCheckbox = page.locator('[data-rule-id="revolution"]');
    await revolutionCheckbox.click();
    
    // Check if Lisp code is shown
    const codePreview = page.locator('#lisp-code-preview');
    await expect(codePreview).toContainText('define-rule revolution');
    await expect(codePreview).toContainText('toggle-card-order');
  });

  test('should apply and save rule settings', async ({ page }) => {
    await page.click('#settings-button');
    await page.waitForTimeout(500);
    
    // Enable an advanced rule
    const stairsCheckbox = page.locator('[data-rule-id="stairs"]');
    await stairsCheckbox.click();
    
    // Apply rules
    await page.click('#apply-rules');
    
    // Should show confirmation message
    await expect(page.locator('text=ルールを適用しました')).toBeVisible({ timeout: 2000 });
    
    // Modal should close
    const modal = page.locator('#rule-settings-modal');
    await expect(modal).toBeHidden();
  });

  test('should reset rules to defaults', async ({ page }) => {
    await page.click('#settings-button');
    await page.waitForTimeout(500);
    
    // Enable some advanced rules
    await page.click('[data-rule-id="stairs"]');
    await page.click('[data-rule-id="binding"]');
    
    // Reset to defaults
    await page.click('#reset-rules');
    
    // Should show confirmation
    await expect(page.locator('text=デフォルトルールに戻しました')).toBeVisible({ timeout: 2000 });
    
    // Check that only default rules are enabled
    await expect(page.locator('[data-rule-id="revolution"]')).toBeChecked();
    await expect(page.locator('[data-rule-id="eight-cut"]')).toBeChecked();
    await expect(page.locator('[data-rule-id="stairs"]')).not.toBeChecked();
    await expect(page.locator('[data-rule-id="binding"]')).not.toBeChecked();
  });

  test('should close modal with close button', async ({ page }) => {
    await page.click('#settings-button');
    await page.waitForTimeout(500);
    
    // Modal should be visible
    const modal = page.locator('#rule-settings-modal');
    await expect(modal).toBeVisible();
    
    // Click close button
    await page.click('#close-rule-settings');
    
    // Modal should be hidden
    await expect(modal).toBeHidden();
  });

  test('should display rule categories correctly', async ({ page }) => {
    await page.click('#settings-button');
    await page.waitForTimeout(500);
    
    // Check for category headers
    await expect(page.locator('text=🎯 基本ルール')).toBeVisible();
    await expect(page.locator('text=⚡ 上級ルール')).toBeVisible();
    await expect(page.locator('text=🔥 専門ルール')).toBeVisible();
    
    // Check that rules are organized under categories
    const basicSection = page.locator('text=🎯 基本ルール').locator('..').locator('..');
    await expect(basicSection.locator('text=革命')).toBeVisible();
    await expect(basicSection.locator('text=8切り')).toBeVisible();
  });
});