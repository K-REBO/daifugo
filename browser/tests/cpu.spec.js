import { test, expect } from '@playwright/test';

test.describe('CPU AI System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Load modules in dependency order
    await page.addScriptTag({
      path: './js/card.js',
      type: 'module'
    });
    
    await page.addScriptTag({
      path: './js/player.js',
      type: 'module'
    });
    
    await page.addScriptTag({
      path: './js/game.js',
      type: 'module'
    });
    
    await page.addScriptTag({
      path: './js/cpu-ai.js',
      type: 'module'
    });
  });

  test('should create CPU players with different thinking times', async ({ page }) => {
    const cpuData = await page.evaluate(() => {
      const { PlayerManager } = window.PlayerModule;
      const { GameLogic } = window.GameModule;
      const { CPUPlayer } = window.CPUModule;
      
      const playerManager = new PlayerManager(4);
      const game = new GameLogic(playerManager);
      const players = playerManager.getCPUPlayers();
      
      const cpuPlayers = players.map(player => {
        const cpu = new CPUPlayer(player, game);
        return {
          name: player.name,
          difficulty: player.difficulty,
          thinkingTime: cpu.thinkingTime,
          isInRange: cpu.thinkingTime >= 800 && cpu.thinkingTime <= 4000
        };
      });
      
      return cpuPlayers;
    });
    
    expect(cpuData.length).toBe(3); // 3 CPU players in 4-player game
    expect(cpuData.every(cpu => cpu.isInRange)).toBe(true);
    
    // Check difficulty distribution
    const difficulties = cpuData.map(cpu => cpu.difficulty);
    expect(difficulties).toContain('easy');
    expect(difficulties).toContain('medium');
    expect(difficulties).toContain('hard');
  });

  test('should find valid plays correctly', async ({ page }) => {
    const validPlaysData = await page.evaluate(() => {
      const { PlayerManager } = window.PlayerModule;
      const { GameLogic } = window.GameModule;
      const { CPUPlayer } = window.CPUModule;
      const { Card } = window.CardModule;
      
      const playerManager = new PlayerManager(3);
      const game = new GameLogic(playerManager);
      const cpuPlayer = playerManager.getCPUPlayers()[0];
      const ai = new CPUPlayer(cpuPlayer, game);
      
      // Set up hand with specific cards
      const hand = [
        new Card('♠', '7'),
        new Card('♥', '7'),
        new Card('♦', '9'),
        new Card('♣', 'K'),
        new Card('♠', 'A')
      ];
      
      // Test single card plays (no last played)
      const singlePlays = ai.findValidPlays(hand, []);
      
      // Test with last played card
      const lastPlayed = [new Card('♠', '8')];
      const validAfter8 = ai.findValidPlays(hand, lastPlayed);
      
      return {
        handSize: hand.length,
        singlePlaysCount: singlePlays.length,
        validAfter8Count: validAfter8.length,
        hasPairPlays: singlePlays.some(play => 
          play.length === 1 && hand.filter(c => c.rank === play[0].rank).length >= 2
        )
      };
    });
    
    expect(validPlaysData.handSize).toBe(5);
    expect(validPlaysData.singlePlaysCount).toBe(5); // All cards playable when no restriction
    expect(validPlaysData.validAfter8Count).toBeGreaterThan(0); // Some cards beat 8
  });

  test('should make different decisions based on difficulty', async ({ page }) => {
    const difficultyData = await page.evaluate(async () => {
      const { PlayerManager } = window.PlayerModule;
      const { GameLogic } = window.GameModule;
      const { CPUPlayer } = window.CPUModule;
      const { Card } = window.CardModule;
      
      const playerManager = new PlayerManager(4);
      const game = new GameLogic(playerManager);
      const cpuPlayers = playerManager.getCPUPlayers();
      
      // Set up identical hands for testing
      const testHand = [
        new Card('♠', '7'),
        new Card('♥', '8'),
        new Card('♦', '10'),
        new Card('♣', 'K')
      ];
      
      const decisions = [];
      
      for (const player of cpuPlayers) {
        player.hand = [...testHand];
        const ai = new CPUPlayer(player, game);
        const decision = ai.makeStrategyDecision();
        
        decisions.push({
          difficulty: player.difficulty,
          action: decision.action,
          hasCards: decision.cards ? decision.cards.length > 0 : false
        });
      }
      
      return decisions;
    });
    
    expect(difficultyData.length).toBe(3);
    expect(difficultyData.every(d => ['play', 'pass'].includes(d.action))).toBe(true);
    
    // Should have at least one play decision
    expect(difficultyData.some(d => d.action === 'play')).toBe(true);
  });

  test('should handle combinations correctly', async ({ page }) => {
    const combinationData = await page.evaluate(() => {
      const { PlayerManager } = window.PlayerModule;
      const { GameLogic } = window.GameModule;
      const { CPUPlayer } = window.CPUModule;
      const { Card } = window.CardModule;
      
      const playerManager = new PlayerManager(3);
      const game = new GameLogic(playerManager);
      const cpuPlayer = playerManager.getCPUPlayers()[0];
      const ai = new CPUPlayer(cpuPlayer, game);
      
      // Test combination generation
      const hand = [
        new Card('♠', '7'),
        new Card('♥', '7'),
        new Card('♦', '7'),
        new Card('♣', '9'),
        new Card('♠', 'K')
      ];
      
      const pairs = ai.generateCombinations(hand, 2);
      const triples = ai.generateCombinations(hand, 3);
      
      return {
        handSize: hand.length,
        pairsCount: pairs.length,
        triplesCount: triples.length,
        has7Pair: pairs.some(pair => 
          pair.every(card => card.rank === '7')
        ),
        has7Triple: triples.some(triple => 
          triple.every(card => card.rank === '7')
        )
      };
    });
    
    expect(combinationData.handSize).toBe(5);
    expect(combinationData.pairsCount).toBeGreaterThan(0);
    expect(combinationData.triplesCount).toBe(1); // Only one triple of 7s
    expect(combinationData.has7Triple).toBe(true);
  });

  test('should manage CPU Manager correctly', async ({ page }) => {
    const managerData = await page.evaluate(() => {
      const { PlayerManager } = window.PlayerModule;
      const { GameLogic } = window.GameModule;
      const { CPUManager } = window.CPUModule;
      
      const playerManager = new PlayerManager(4);
      const game = new GameLogic(playerManager);
      const cpuManager = new CPUManager(game);
      
      // Initialize CPU players
      cpuManager.initializeCPUPlayers();
      
      const cpuNames = Array.from(cpuManager.cpuPlayers.keys());
      const allPlayersCount = playerManager.getAllPlayers().length;
      const cpuPlayersCount = playerManager.getCPUPlayers().length;
      
      return {
        totalPlayers: allPlayersCount,
        cpuPlayers: cpuPlayersCount,
        cpuManagerSize: cpuManager.cpuPlayers.size,
        cpuNames: cpuNames,
        hasEachDifficulty: ['CPU1', 'CPU2', 'CPU3'].every(name => 
          cpuNames.includes(name)
        )
      };
    });
    
    expect(managerData.totalPlayers).toBe(4);
    expect(managerData.cpuPlayers).toBe(3);
    expect(managerData.cpuManagerSize).toBe(3);
    expect(managerData.hasEachDifficulty).toBe(true);
  });

  test('should calculate strategic scores', async ({ page }) => {
    const strategyData = await page.evaluate(() => {
      const { PlayerManager } = window.PlayerModule;
      const { GameLogic } = window.GameModule;
      const { CPUPlayer } = window.CPUModule;
      const { Card } = window.CardModule;
      
      const playerManager = new PlayerManager(3);
      const game = new GameLogic(playerManager);
      const hardPlayer = playerManager.getCPUPlayers().find(p => p.difficulty === 'hard') || 
                         playerManager.getCPUPlayers()[0]; // Fallback to first CPU
      const ai = new CPUPlayer(hardPlayer, game);
      
      const hand = [
        new Card('♠', '7'),
        new Card('♥', '7'),
        new Card('♦', '9'),
        new Card('♣', 'K'),
        new Card('♠', 'A')
      ];
      
      // Test different plays
      const lowCardPlay = [new Card('♠', '7')];
      const highCardPlay = [new Card('♠', 'A')];
      
      const lowScore = ai.calculatePlayScore(lowCardPlay, hand);
      const highScore = ai.calculatePlayScore(highCardPlay, hand);
      
      return {
        lowScore,
        highScore,
        lowIsBetter: lowScore > highScore, // Lower value cards should score higher
        scoreDifference: Math.abs(lowScore - highScore)
      };
    });
    
    expect(strategyData.lowIsBetter).toBe(true);
    expect(strategyData.scoreDifference).toBeGreaterThan(0);
  });

  test('should handle advanced strategy decisions', async ({ page }) => {
    const advancedData = await page.evaluate(() => {
      const { PlayerManager } = window.PlayerModule;
      const { GameLogic } = window.GameModule;
      const { CPUPlayer } = window.CPUModule;
      const { Card } = window.CardModule;
      
      const playerManager = new PlayerManager(3);
      const game = new GameLogic(playerManager);
      const hardPlayer = playerManager.getCPUPlayers().find(p => p.difficulty === 'hard') ||
                         playerManager.getCPUPlayers()[0]; // Fallback to first CPU
      const ai = new CPUPlayer(hardPlayer, game);
      
      // Test revolution decision
      const lowCardHand = [
        new Card('♠', '3'), new Card('♥', '3'),
        new Card('♦', '4'), new Card('♣', '4'),
        new Card('♠', 'K')
      ];
      const shouldRevolution = ai.shouldPlayRevolution(lowCardHand);
      
      // Test 8-cut decision  
      const highLastPlayed = [new Card('♠', 'A')];
      const should8Cut = ai.shouldPlay8Cut(highLastPlayed);
      
      // Test strategic pass
      const bigHand = new Array(8).fill(null).map((_, i) => 
        new Card('♠', ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'][i])
      );
      const highValidPlays = [[new Card('♠', 'A')]];
      const shouldPass = ai.shouldStrategicPass(bigHand, highLastPlayed, highValidPlays);
      
      return {
        shouldRevolution,
        should8Cut,
        shouldPass,
        lowCardCount: lowCardHand.filter(c => ['3', '4', '5', '6'].includes(c.rank)).length
      };
    });
    
    expect(advancedData.shouldRevolution).toBe(true); // 4/5 cards are low
    expect(advancedData.should8Cut).toBe(true); // High last played card
    expect(advancedData.shouldPass).toBe(true); // Large hand, forced to play high card
  });
});