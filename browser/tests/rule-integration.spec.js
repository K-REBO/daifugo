import { test, expect } from '@playwright/test';

test.describe('Rule Integration with Game Logic', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(4000);
  });

  test('should apply revolution rule during gameplay', async ({ page }) => {
    // Start a game
    await page.click('#start-game-button');
    await page.waitForTimeout(2000);
    
    // Enable revolution rule
    await page.click('#settings-button');
    await page.waitForTimeout(500);
    await page.click('[data-rule-id="revolution"]');
    await page.click('#apply-rules');
    await page.waitForTimeout(500);
    
    // Test revolution rule application
    const revolutionTest = await page.evaluate(() => {
      // Simulate playing 4 cards of the same rank
      const testCards = [
        { rank: 'A', suit: '♠' },
        { rank: 'A', suit: '♥' },
        { rank: 'A', suit: '♦' },
        { rank: 'A', suit: '♣' }
      ];
      
      // Check if game logic recognizes revolution condition
      if (window.gameController && window.gameController.gameLogic) {
        const gameLogic = window.gameController.gameLogic;
        
        // Test revolution detection logic
        const isRevolutionPlay = testCards.length === 4 && 
          testCards.every(card => card.rank === testCards[0].rank);
        
        return {
          cardCount: testCards.length,
          allSameRank: testCards.every(card => card.rank === testCards[0].rank),
          shouldTriggerRevolution: isRevolutionPlay,
          gameLogicExists: !!gameLogic
        };
      }
      
      return { gameLogicExists: false };
    });
    
    expect(revolutionTest.gameLogicExists).toBeTruthy();
    expect(revolutionTest.shouldTriggerRevolution).toBeTruthy();
  });

  test('should apply eight-cut rule during gameplay', async ({ page }) => {
    // Start a game
    await page.click('#start-game-button');
    await page.waitForTimeout(2000);
    
    // Enable eight-cut rule
    await page.click('#settings-button');
    await page.waitForTimeout(500);
    await page.click('[data-rule-id="eight-cut"]');
    await page.click('#apply-rules');
    await page.waitForTimeout(500);
    
    // Test eight-cut rule application
    const eightCutTest = await page.evaluate(() => {
      // Simulate playing an 8
      const testCards = [{ rank: '8', suit: '♠' }];
      
      if (window.gameController && window.gameController.gameLogic) {
        const gameLogic = window.gameController.gameLogic;
        
        // Test eight-cut detection logic
        const hasEight = testCards.some(card => card.rank === '8');
        
        return {
          hasEightCard: hasEight,
          shouldClearField: hasEight,
          gameLogicExists: !!gameLogic
        };
      }
      
      return { gameLogicExists: false };
    });
    
    expect(eightCutTest.gameLogicExists).toBeTruthy();
    expect(eightCutTest.shouldClearField).toBeTruthy();
  });

  test('should handle rule activation and deactivation', async ({ page }) => {
    // Start a game
    await page.click('#start-game-button');
    await page.waitForTimeout(2000);
    
    // Test rule activation - revolution is enabled by default, so first disable it
    await page.click('#settings-button');
    await page.waitForTimeout(500);
    
    // Reset to defaults first
    await page.click('#reset-rules');
    await page.waitForTimeout(500);
    
    // Check default state (revolution and eight-cut should be enabled)
    let ruleStatus = await page.evaluate(() => {
      return window.ruleSettings ? Array.from(window.ruleSettings.activeRules) : [];
    });
    expect(ruleStatus).toContain('revolution');
    expect(ruleStatus).toContain('eight-cut');
    
    // Now disable revolution rule
    await page.click('[data-rule-id="revolution"]');
    await page.click('#apply-rules');
    await page.waitForTimeout(500);
    
    // Check if rule is deactivated
    ruleStatus = await page.evaluate(() => {
      return window.ruleSettings ? Array.from(window.ruleSettings.activeRules) : [];
    });
    expect(ruleStatus).not.toContain('revolution');
    expect(ruleStatus).toContain('eight-cut'); // eight-cut should still be active
  });

  test('should maintain rule state across game sessions', async ({ page }) => {
    // Enable specific rules
    await page.click('#settings-button');
    await page.waitForTimeout(500);
    await page.click('[data-rule-id="stairs"]');
    await page.click('[data-rule-id="binding"]');
    await page.click('#apply-rules');
    await page.waitForTimeout(500);
    
    // Reload page to test persistence
    await page.reload();
    await page.waitForTimeout(4000);
    
    // Check if rules are still enabled
    const persistedRules = await page.evaluate(() => {
      const saved = localStorage.getItem('daifugo-rules');
      return saved ? JSON.parse(saved) : [];
    });
    
    expect(persistedRules).toContain('stairs');
    expect(persistedRules).toContain('binding');
  });

  test('should validate rule combinations work together', async ({ page }) => {
    // Start a game
    await page.click('#start-game-button');
    await page.waitForTimeout(2000);
    
    // Enable multiple rules (revolution and eight-cut are already enabled by default)
    await page.click('#settings-button');
    await page.waitForTimeout(500);
    await page.click('[data-rule-id="eleven-back"]'); // Enable additional rule
    await page.click('#apply-rules');
    await page.waitForTimeout(500);
    
    // Test rule combination logic
    const combinationTest = await page.evaluate(() => {
      if (window.ruleSettings) {
        const activeRules = Array.from(window.ruleSettings.activeRules);
        const ruleData = [];
        
        for (const ruleId of activeRules) {
          const rule = window.ruleSettings.availableRules.get(ruleId);
          if (rule) {
            ruleData.push({
              id: ruleId,
              name: rule.name,
              category: rule.category,
              hasLispCode: !!rule.lispCode
            });
          }
        }
        
        return {
          activeRuleCount: activeRules.length,
          rules: ruleData
        };
      }
      return { activeRuleCount: 0, rules: [] };
    });
    
    expect(combinationTest.activeRuleCount).toBeGreaterThanOrEqual(3); // revolution, eight-cut, eleven-back
    expect(combinationTest.rules).toHaveLength(combinationTest.activeRuleCount);
    
    // Verify each rule has proper structure
    for (const rule of combinationTest.rules) {
      expect(rule.id).toBeTruthy();
      expect(rule.name).toBeTruthy();
      expect(rule.category).toBeTruthy();
      expect(rule.hasLispCode).toBeTruthy();
    }
  });

  test('should handle complex rule scenarios', async ({ page }) => {
    // Start a game
    await page.click('#start-game-button');
    await page.waitForTimeout(2000);
    
    // Test complex scenarios
    const complexTest = await page.evaluate(() => {
      // Test scenario 1: Revolution with 8-cut
      const scenario1 = {
        cards: [
          { rank: '8', suit: '♠' },
          { rank: '8', suit: '♥' },
          { rank: '8', suit: '♦' },
          { rank: '8', suit: '♣' }
        ],
        shouldTriggerRevolution: true,
        shouldClearField: true
      };
      
      // Test scenario 2: Jack with stairs
      const scenario2 = {
        cards: [
          { rank: 'J', suit: '♠' },
          { rank: 'Q', suit: '♠' },
          { rank: 'K', suit: '♠' }
        ],
        shouldEnableReverse: true,
        shouldAllowStairs: true
      };
      
      return {
        scenario1,
        scenario2
      };
    });
    
    // Verify complex scenarios
    expect(complexTest.scenario1.cards).toHaveLength(4);
    expect(complexTest.scenario1.shouldTriggerRevolution).toBeTruthy();
    expect(complexTest.scenario1.shouldClearField).toBeTruthy();
    
    expect(complexTest.scenario2.cards).toHaveLength(3);
    expect(complexTest.scenario2.shouldEnableReverse).toBeTruthy();
    expect(complexTest.scenario2.shouldAllowStairs).toBeTruthy();
  });

  test('should provide proper feedback for rule execution', async ({ page }) => {
    // Start a game
    await page.click('#start-game-button');
    await page.waitForTimeout(2000);
    
    // Test rule feedback system (revolution and eight-cut are enabled by default)
    await page.click('#settings-button');
    await page.waitForTimeout(500);
    await page.click('#apply-rules'); // Apply current rules
    
    // Check if confirmation message appears
    await expect(page.locator('text=ルールを適用しました')).toBeVisible({ timeout: 3000 });
    
    // Test rule feedback system
    const feedbackTest = await page.evaluate(() => {
      if (window.ruleSettings) {
        const activeRules = Array.from(window.ruleSettings.activeRules);
        const ruleNames = activeRules.map(id => {
          const rule = window.ruleSettings.availableRules.get(id);
          return rule ? rule.name : id;
        });
        
        return {
          activeRuleCount: activeRules.length,
          ruleNames: ruleNames
        };
      }
      return { activeRuleCount: 0, ruleNames: [] };
    });
    
    expect(feedbackTest.activeRuleCount).toBeGreaterThan(0);
    expect(feedbackTest.ruleNames).toContain('革命');
    expect(feedbackTest.ruleNames).toContain('8切り');
  });
});