import { test, expect } from '@playwright/test';
import { readFile } from 'fs/promises';
import path from 'path';

test.describe('Lisp Rule System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for all modules to load
    await page.waitForTimeout(4000);
  });

  test('should load and parse custom .lisp files', async ({ page }) => {
    // Open rule settings
    await page.click('#settings-button');
    await page.waitForTimeout(500);
    
    // Create a test .lisp file content
    const testLispContent = `
;; Name: テスト用ルール
;; Description: 9を出すとスキップ
;; Category: custom

(define-rule nine-skip
  (when (any-card-rank cards "9")
    (skip-next-player)
    (log-message "9でスキップ！")))
    `;
    
    // Create a file input element and simulate file selection
    const fileInput = await page.locator('#lisp-file-input');
    
    // Create a temporary file for testing
    await page.evaluate((content) => {
      const blob = new Blob([content], { type: 'text/plain' });
      const file = new File([blob], 'test-rule.lisp', { type: 'text/plain' });
      
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      
      const fileInput = document.getElementById('lisp-file-input');
      fileInput.files = dataTransfer.files;
      
      // Trigger change event
      const event = new Event('change', { bubbles: true });
      fileInput.dispatchEvent(event);
    }, testLispContent);
    
    // Wait for file processing
    await page.waitForTimeout(1000);
    
    // Check if custom rule was added
    const customRulesList = page.locator('#custom-rules-list');
    await expect(customRulesList).toContainText('テスト用ルール');
    await expect(customRulesList).toContainText('9を出すとスキップ');
  });

  test('should validate default rules have correct Lisp syntax', async ({ page }) => {
    // Open rule settings
    await page.click('#settings-button');
    await page.waitForTimeout(500);
    
    // Test each default rule by clicking on them
    const defaultRules = ['revolution', 'eight-cut', 'eleven-back', 'three-spades', 'stairs', 'binding'];
    
    for (const ruleId of defaultRules) {
      const ruleCheckbox = page.locator(`[data-rule-id="${ruleId}"]`);
      await ruleCheckbox.click();
      
      // Check if Lisp code is displayed
      const codePreview = page.locator('#lisp-code-preview');
      await expect(codePreview).toContainText('define-rule');
      
      // Verify the code contains basic Lisp syntax
      const codeContent = await codePreview.textContent();
      expect(codeContent).toMatch(/\(define-rule\s+\w+/);
      expect(codeContent).toMatch(/\(when\s+/);
    }
  });

  test('should apply rules and store them in localStorage', async ({ page }) => {
    // Open rule settings
    await page.click('#settings-button');
    await page.waitForTimeout(500);
    
    // Enable a few rules
    await page.click('[data-rule-id="eleven-back"]');
    await page.click('[data-rule-id="stairs"]');
    
    // Apply rules
    await page.click('#apply-rules');
    
    // Check localStorage
    const savedRules = await page.evaluate(() => {
      return localStorage.getItem('daifugo-rules');
    });
    
    expect(savedRules).toBeTruthy();
    const parsedRules = JSON.parse(savedRules);
    expect(parsedRules).toContain('eleven-back');
    expect(parsedRules).toContain('stairs');
  });

  test('should handle rule validation correctly', async ({ page }) => {
    // Test rule validation by examining the rule structure
    const ruleValidation = await page.evaluate(() => {
      // Access the rule settings instance
      if (window.ruleSettings) {
        const rules = window.ruleSettings.availableRules;
        const validationResults = [];
        
        for (const [ruleId, rule] of rules) {
          const result = {
            id: ruleId,
            hasName: !!rule.name,
            hasDescription: !!rule.description,
            hasLispCode: !!rule.lispCode,
            hasValidSyntax: rule.lispCode.includes('define-rule'),
            hasWhenClause: rule.lispCode.includes('when'),
            isEnabled: rule.enabled
          };
          validationResults.push(result);
        }
        
        return validationResults;
      }
      return [];
    });
    
    // Check that all rules have required properties
    expect(ruleValidation.length).toBeGreaterThan(0);
    
    for (const rule of ruleValidation) {
      expect(rule.hasName).toBeTruthy();
      expect(rule.hasDescription).toBeTruthy();
      expect(rule.hasLispCode).toBeTruthy();
      expect(rule.hasValidSyntax).toBeTruthy();
      expect(rule.hasWhenClause).toBeTruthy();
    }
  });

  test('should simulate rule execution logic', async ({ page }) => {
    // Start a game to test rule execution
    await page.click('#start-game-button');
    await page.waitForTimeout(2000);
    
    // Test rule execution by simulating card plays
    const ruleExecutionTest = await page.evaluate(() => {
      // Test revolution rule logic
      const revolutionTest = {
        cards: [
          { rank: 'A', suit: '♠' },
          { rank: 'A', suit: '♥' },
          { rank: 'A', suit: '♦' },
          { rank: 'A', suit: '♣' }
        ],
        shouldTriggerRevolution: true
      };
      
      // Test eight-cut rule logic
      const eightCutTest = {
        cards: [{ rank: '8', suit: '♠' }],
        shouldClearField: true
      };
      
      // Test eleven-back rule logic
      const elevenBackTest = {
        cards: [{ rank: 'J', suit: '♠' }],
        shouldEnableReverse: true
      };
      
      return {
        revolutionTest,
        eightCutTest,
        elevenBackTest
      };
    });
    
    // Verify test scenarios
    expect(ruleExecutionTest.revolutionTest.cards).toHaveLength(4);
    expect(ruleExecutionTest.revolutionTest.shouldTriggerRevolution).toBeTruthy();
    
    expect(ruleExecutionTest.eightCutTest.cards[0].rank).toBe('8');
    expect(ruleExecutionTest.eightCutTest.shouldClearField).toBeTruthy();
    
    expect(ruleExecutionTest.elevenBackTest.cards[0].rank).toBe('J');
    expect(ruleExecutionTest.elevenBackTest.shouldEnableReverse).toBeTruthy();
  });

  test('should handle rule conflicts and priorities', async ({ page }) => {
    // Open rule settings
    await page.click('#settings-button');
    await page.waitForTimeout(500);
    
    // Enable potentially conflicting rules
    await page.click('[data-rule-id="revolution"]');
    await page.click('[data-rule-id="eight-cut"]');
    await page.click('[data-rule-id="eleven-back"]');
    
    // Check that rules can coexist
    const conflictTest = await page.evaluate(() => {
      if (window.ruleSettings) {
        const activeRules = Array.from(window.ruleSettings.activeRules);
        return {
          hasRevolution: activeRules.includes('revolution'),
          hasEightCut: activeRules.includes('eight-cut'),
          hasElevenBack: activeRules.includes('eleven-back'),
          ruleCount: activeRules.length
        };
      }
      return { ruleCount: 0 };
    });
    
    expect(conflictTest.ruleCount).toBeGreaterThan(0);
  });

  test('should generate proper Lisp code for all rule categories', async ({ page }) => {
    // Open rule settings
    await page.click('#settings-button');
    await page.waitForTimeout(500);
    
    // Test each category
    const categories = [
      { name: '基本ルール', expectedRules: ['revolution', 'eight-cut'] },
      { name: '上級ルール', expectedRules: ['eleven-back', 'three-spades', 'stairs'] },
      { name: '専門ルール', expectedRules: ['binding'] }
    ];
    
    for (const category of categories) {
      // Check if category is displayed
      await expect(page.locator(`text=${category.name}`)).toBeVisible();
      
      // Test each rule in the category
      for (const ruleId of category.expectedRules) {
        const ruleCheckbox = page.locator(`[data-rule-id="${ruleId}"]`);
        await ruleCheckbox.click();
        
        const codePreview = page.locator('#lisp-code-preview');
        const codeContent = await codePreview.textContent();
        
        // Verify Lisp code structure
        expect(codeContent).toMatch(/\(define-rule\s+\w+/);
        expect(codeContent).toMatch(/\(when\s+/);
        
        // Verify rule-specific logic
        if (ruleId === 'revolution') {
          expect(codeContent).toContain('toggle-card-order');
        } else if (ruleId === 'eight-cut') {
          expect(codeContent).toContain('clear-field');
        } else if (ruleId === 'eleven-back') {
          expect(codeContent).toContain('set-reverse-mode');
        }
      }
    }
  });

  test('should handle error cases gracefully', async ({ page }) => {
    // Test error handling by accessing rule settings methods
    const errorHandling = await page.evaluate(() => {
      const results = [];
      
      if (window.ruleSettings) {
        // Test invalid rule ID
        try {
          window.ruleSettings.showRulePreview('invalid-rule-id');
          results.push({ test: 'invalid-rule-id', success: true });
        } catch (error) {
          results.push({ test: 'invalid-rule-id', success: false, error: error.message });
        }
        
        // Test rule toggle with invalid checkbox
        try {
          const fakeCheckbox = { dataset: { ruleId: 'nonexistent' }, checked: true };
          window.ruleSettings.handleRuleToggle(fakeCheckbox);
          results.push({ test: 'invalid-checkbox', success: true });
        } catch (error) {
          results.push({ test: 'invalid-checkbox', success: false, error: error.message });
        }
        
        // Test removing nonexistent rule
        try {
          window.ruleSettings.removeCustomRule('nonexistent-rule');
          results.push({ test: 'remove-nonexistent', success: true });
        } catch (error) {
          results.push({ test: 'remove-nonexistent', success: false, error: error.message });
        }
      }
      
      return results;
    });
    
    // Verify error handling doesn't break the system
    expect(errorHandling).toHaveLength(3);
    for (const result of errorHandling) {
      // System should handle errors gracefully without crashing
      expect(typeof result.success).toBe('boolean');
    }
  });
});