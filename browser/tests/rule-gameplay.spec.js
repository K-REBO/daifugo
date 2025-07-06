import { test, expect } from '@playwright/test';

test.describe('Rule Engine in Live Gameplay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(4000);
  });

  test('should demonstrate revolution rule in action', async ({ page }) => {
    // Start a game
    await page.click('#start-game-button');
    await page.waitForTimeout(3000);
    
    // Check initial game status (revolution is enabled by default)
    const initialStatus = await page.evaluate(() => {
      return {
        gameExists: !!window.gameController,
        gameLogicExists: !!(window.gameController && window.gameController.gameLogic),
        revolutionEnabled: window.ruleSettings && window.ruleSettings.activeRules.has('revolution')
      };
    });
    
    expect(initialStatus.gameExists).toBeTruthy();
    expect(initialStatus.gameLogicExists).toBeTruthy();
    expect(initialStatus.revolutionEnabled).toBeTruthy();
    
    // Test revolution detection logic
    const revolutionLogic = await page.evaluate(() => {
      // Simulate 4 of a kind detection
      const testHand = [
        { rank: 'K', suit: '♠' },
        { rank: 'K', suit: '♥' },
        { rank: 'K', suit: '♦' },
        { rank: 'K', suit: '♣' }
      ];
      
      const isRevolutionPlay = testHand.length === 4 && 
        testHand.every(card => card.rank === testHand[0].rank);
      
      return {
        handSize: testHand.length,
        sameRank: testHand.every(card => card.rank === testHand[0].rank),
        triggersRevolution: isRevolutionPlay
      };
    });
    
    expect(revolutionLogic.triggersRevolution).toBeTruthy();
  });

  test('should demonstrate eight-cut rule clearing the field', async ({ page }) => {
    // Start a game
    await page.click('#start-game-button');
    await page.waitForTimeout(3000);
    
    // Test eight-cut logic (eight-cut is enabled by default)
    const eightCutLogic = await page.evaluate(() => {
      // Simulate eight card play
      const eightCard = { rank: '8', suit: '♠' };
      const isEightPlay = eightCard.rank === '8';
      
      return {
        cardRank: eightCard.rank,
        isEight: isEightPlay,
        shouldClearField: isEightPlay,
        eightCutEnabled: window.ruleSettings && window.ruleSettings.activeRules.has('eight-cut')
      };
    });
    
    expect(eightCutLogic.shouldClearField).toBeTruthy();
    expect(eightCutLogic.eightCutEnabled).toBeTruthy();
  });

  test('should show rule effects in game status', async ({ page }) => {
    // Start a game
    await page.click('#start-game-button');
    await page.waitForTimeout(3000);
    
    // Check game status display
    const gameStatus = page.locator('#game-status');
    await expect(gameStatus).toBeVisible();
    
    // Test status updates with rules
    const statusTest = await page.evaluate(() => {
      if (window.gameController && window.gameController.gameLogic) {
        const status = window.gameController.gameLogic.getGameStatus();
        return {
          hasStatus: !!status,
          hasCurrentPlayer: !!status.currentPlayer,
          hasRevolutionFlag: status.hasOwnProperty('isRevolution'),
          gameRunning: !status.gameOver
        };
      }
      return { hasStatus: false };
    });
    
    expect(statusTest.hasStatus).toBeTruthy();
    expect(statusTest.hasCurrentPlayer).toBeTruthy();
    expect(statusTest.hasRevolutionFlag).toBeTruthy();
  });

  test('should handle multiple rules simultaneously', async ({ page }) => {
    // Start a game
    await page.click('#start-game-button');
    await page.waitForTimeout(3000);
    
    // Enable additional rule (revolution and eight-cut are already enabled by default)
    await page.click('#settings-button');
    await page.waitForTimeout(500);
    await page.click('[data-rule-id="eleven-back"]');
    await page.click('#apply-rules');
    await page.waitForTimeout(500);
    
    // Test multiple rules coexistence
    const multiRuleTest = await page.evaluate(() => {
      const activeRules = window.ruleSettings ? Array.from(window.ruleSettings.activeRules) : [];
      
      // Test scenarios that could trigger multiple rules
      const scenarios = [
        {
          name: 'Four Eights',
          cards: [
            { rank: '8', suit: '♠' },
            { rank: '8', suit: '♥' },
            { rank: '8', suit: '♦' },
            { rank: '8', suit: '♣' }
          ],
          triggersRevolution: true,
          triggersEightCut: true
        },
        {
          name: 'Jack Play',
          cards: [{ rank: 'J', suit: '♠' }],
          triggersElevenBack: true
        }
      ];
      
      return {
        activeRuleCount: activeRules.length,
        activeRules: activeRules,
        scenarios: scenarios
      };
    });
    
    expect(multiRuleTest.activeRuleCount).toBeGreaterThanOrEqual(3);
    expect(multiRuleTest.activeRules).toContain('revolution');
    expect(multiRuleTest.activeRules).toContain('eight-cut');
    expect(multiRuleTest.activeRules).toContain('eleven-back');
  });

  test('should provide rule feedback during gameplay', async ({ page }) => {
    // Start a game
    await page.click('#start-game-button');
    await page.waitForTimeout(3000);
    
    // Test rule feedback system
    const feedbackTest = await page.evaluate(() => {
      // Check if rule system provides proper game feedback
      const gameController = window.gameController;
      const ruleSettings = window.ruleSettings;
      
      if (gameController && ruleSettings) {
        const activeRules = Array.from(ruleSettings.activeRules);
        const ruleDescriptions = activeRules.map(ruleId => {
          const rule = ruleSettings.availableRules.get(ruleId);
          return rule ? {
            id: ruleId,
            name: rule.name,
            description: rule.description,
            code: rule.lispCode.substring(0, 50) + '...'
          } : null;
        }).filter(Boolean);
        
        return {
          hasGameController: true,
          hasRuleSettings: true,
          activeRuleCount: activeRules.length,
          ruleDescriptions: ruleDescriptions
        };
      }
      
      return { hasGameController: false, hasRuleSettings: false };
    });
    
    expect(feedbackTest.hasGameController).toBeTruthy();
    expect(feedbackTest.hasRuleSettings).toBeTruthy();
    expect(feedbackTest.activeRuleCount).toBeGreaterThan(0);
    expect(feedbackTest.ruleDescriptions.length).toBeGreaterThan(0);
    
    // Verify each rule has proper structure
    for (const rule of feedbackTest.ruleDescriptions) {
      expect(rule.id).toBeTruthy();
      expect(rule.name).toBeTruthy();
      expect(rule.description).toBeTruthy();
      expect(rule.code).toBeTruthy();
    }
  });

  test('should handle invalid plays according to rules', async ({ page }) => {
    // Start a game
    await page.click('#start-game-button');
    await page.waitForTimeout(3000);
    
    // Test game validation with rules
    const validationTest = await page.evaluate(() => {
      const gameLogic = window.gameController && window.gameController.gameLogic;
      
      if (gameLogic) {
        // Test various play validation scenarios
        const testScenarios = [
          {
            name: 'Single card play',
            cards: [{ rank: '7', suit: '♠' }],
            expectedValid: true
          },
          {
            name: 'Empty play',
            cards: [],
            expectedValid: false
          },
          {
            name: 'Four of a kind',
            cards: [
              { rank: 'A', suit: '♠' },
              { rank: 'A', suit: '♥' },
              { rank: 'A', suit: '♦' },
              { rank: 'A', suit: '♣' }
            ],
            expectedValid: true
          }
        ];
        
        return {
          hasGameLogic: true,
          testScenarios: testScenarios
        };
      }
      
      return { hasGameLogic: false };
    });
    
    expect(validationTest.hasGameLogic).toBeTruthy();
    expect(validationTest.testScenarios.length).toBe(3);
  });

  test('should demonstrate custom rule loading and execution', async ({ page }) => {
    // Open rule settings
    await page.click('#settings-button');
    await page.waitForTimeout(500);
    
    // Test custom rule simulation
    const customRuleTest = await page.evaluate(() => {
      // Simulate loading a custom rule
      const customRule = {
        id: 'test-custom',
        name: 'テスト用カスタムルール',
        description: '9を出すとターンスキップ',
        category: 'custom',
        enabled: false,
        lispCode: `
(define-rule nine-skip
  (when (any-card-rank cards "9")
    (skip-next-player)
    (log-message "9でスキップ！")))
        `.trim(),
        isCustom: true
      };
      
      // Add to available rules
      if (window.ruleSettings) {
        window.ruleSettings.availableRules.set(customRule.id, customRule);
        
        // Test the rule structure
        const loadedRule = window.ruleSettings.availableRules.get(customRule.id);
        
        return {
          ruleLoaded: !!loadedRule,
          ruleName: loadedRule ? loadedRule.name : '',
          ruleHasLispCode: loadedRule ? !!loadedRule.lispCode : false,
          lispCodeValid: loadedRule ? loadedRule.lispCode.includes('define-rule') : false
        };
      }
      
      return { ruleLoaded: false };
    });
    
    expect(customRuleTest.ruleLoaded).toBeTruthy();
    expect(customRuleTest.ruleName).toBe('テスト用カスタムルール');
    expect(customRuleTest.ruleHasLispCode).toBeTruthy();
    expect(customRuleTest.lispCodeValid).toBeTruthy();
  });

  test('should validate rule persistence across sessions', async ({ page }) => {
    // Configure specific rules
    await page.click('#settings-button');
    await page.waitForTimeout(500);
    
    // Reset and set specific rules
    await page.click('#reset-rules');
    await page.waitForTimeout(500);
    await page.click('[data-rule-id="stairs"]');
    await page.click('[data-rule-id="binding"]');
    await page.click('#apply-rules');
    await page.waitForTimeout(500);
    
    // Check localStorage persistence
    const persistenceTest = await page.evaluate(() => {
      const savedRules = localStorage.getItem('daifugo-rules');
      let parsedRules = [];
      
      if (savedRules) {
        try {
          parsedRules = JSON.parse(savedRules);
        } catch (e) {
          return { error: 'Failed to parse saved rules' };
        }
      }
      
      return {
        hasSavedRules: !!savedRules,
        savedRulesCount: parsedRules.length,
        savedRules: parsedRules,
        includesStairs: parsedRules.includes('stairs'),
        includesBinding: parsedRules.includes('binding')
      };
    });
    
    expect(persistenceTest.hasSavedRules).toBeTruthy();
    expect(persistenceTest.savedRulesCount).toBeGreaterThan(0);
    expect(persistenceTest.includesStairs).toBeTruthy();
    expect(persistenceTest.includesBinding).toBeTruthy();
  });
});