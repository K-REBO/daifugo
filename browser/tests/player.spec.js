import { test, expect } from '@playwright/test';

test.describe('Player Management System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Load Card module first (dependency)
    await page.addScriptTag({
      path: './js/card.js',
      type: 'module'
    });
    
    // Load Player module
    await page.addScriptTag({
      path: './js/player.js',
      type: 'module'
    });
  });

  test('should create human player correctly', async ({ page }) => {
    const playerData = await page.evaluate(() => {
      const { Player } = window.PlayerModule;
      const human = new Player('Player1', 'human');
      return {
        name: human.name,
        type: human.type,
        isHuman: human.isHuman(),
        cardCount: human.getCardCount(),
        canPlay: human.canPlay()
      };
    });
    
    expect(playerData.name).toBe('Player1');
    expect(playerData.type).toBe('human');
    expect(playerData.isHuman).toBe(true);
    expect(playerData.cardCount).toBe(0);
    expect(playerData.canPlay).toBe(false);
  });

  test('should create CPU players correctly', async ({ page }) => {
    const cpuData = await page.evaluate(() => {
      const { Player } = window.PlayerModule;
      const cpu1 = new Player('CPU1', 'cpu', 'easy');
      const cpu2 = new Player('CPU2', 'cpu', 'medium');
      const cpu3 = new Player('CPU3', 'cpu', 'hard');
      
      return {
        cpu1: {
          name: cpu1.name,
          type: cpu1.type,
          difficulty: cpu1.difficulty,
          isHuman: cpu1.isHuman()
        },
        cpu2: {
          name: cpu2.name,
          difficulty: cpu2.difficulty
        },
        cpu3: {
          name: cpu3.name,
          difficulty: cpu3.difficulty
        }
      };
    });
    
    expect(cpuData.cpu1.name).toBe('CPU1');
    expect(cpuData.cpu1.type).toBe('cpu');
    expect(cpuData.cpu1.difficulty).toBe('easy');
    expect(cpuData.cpu1.isHuman).toBe(false);
    expect(cpuData.cpu2.difficulty).toBe('medium');
    expect(cpuData.cpu3.difficulty).toBe('hard');
  });

  test('should manage player hands correctly', async ({ page }) => {
    const handData = await page.evaluate(() => {
      const { Player } = window.PlayerModule;
      const { Card } = window.CardModule;
      
      const player = new Player('TestPlayer', 'human');
      const cards = [
        new Card('♠', 'A'),
        new Card('♥', 'K'),
        new Card('♦', '10')
      ];
      
      // Add cards to hand
      cards.forEach(card => player.addCard(card));
      
      // Get hand info
      const handCount = player.getCardCount();
      const handCards = player.getHand();
      
      // Remove a card
      const removedCard = player.removeCard(0);
      
      return {
        initialCount: handCount,
        afterRemoveCount: player.getCardCount(),
        removedCardDisplay: removedCard.getDisplayText(),
        remainingCards: player.getHand().map(c => c.getDisplayText())
      };
    });
    
    expect(handData.initialCount).toBe(3);
    expect(handData.afterRemoveCount).toBe(2);
    expect(handData.removedCardDisplay).toBe('♠A');
    expect(handData.remainingCards).toEqual(['♥K', '♦10']);
  });

  test('should handle player status correctly', async ({ page }) => {
    const statusData = await page.evaluate(() => {
      const { Player } = window.PlayerModule;
      const { Card } = window.CardModule;
      
      const player = new Player('StatusTest', 'human');
      
      // Initial status
      const initialStatus = {
        canPlay: player.canPlay(),
        isFinished: player.isFinished(),
        isTurn: player.isTurn()
      };
      
      // Add cards and set turn
      player.addCard(new Card('♠', '7'));
      player.setTurn(true);
      
      const withCardStatus = {
        canPlay: player.canPlay(),
        isFinished: player.isFinished(),
        isTurn: player.isTurn()
      };
      
      // Remove all cards (finished)
      player.removeCard(0);
      
      const finishedStatus = {
        canPlay: player.canPlay(),
        isFinished: player.isFinished()
      };
      
      return {
        initial: initialStatus,
        withCard: withCardStatus,
        finished: finishedStatus
      };
    });
    
    // Initial: no cards, not turn
    expect(statusData.initial.canPlay).toBe(false);
    expect(statusData.initial.isFinished).toBe(true);
    expect(statusData.initial.isTurn).toBe(false);
    
    // With card and turn
    expect(statusData.withCard.canPlay).toBe(true);
    expect(statusData.withCard.isFinished).toBe(false);
    expect(statusData.withCard.isTurn).toBe(true);
    
    // Finished (no cards)
    expect(statusData.finished.canPlay).toBe(false);
    expect(statusData.finished.isFinished).toBe(true);
  });

  test('should manage game with multiple players (3-6)', async ({ page }) => {
    const gameData = await page.evaluate(() => {
      const { PlayerManager } = window.PlayerModule;
      
      // Test 4 players
      const game4 = new PlayerManager(4);
      const players4 = game4.getAllPlayers();
      
      // Test 6 players
      const game6 = new PlayerManager(6);
      const players6 = game6.getAllPlayers();
      
      return {
        game4: {
          playerCount: players4.length,
          humanCount: players4.filter(p => p.isHuman()).length,
          cpuCount: players4.filter(p => !p.isHuman()).length,
          playerNames: players4.map(p => p.name)
        },
        game6: {
          playerCount: players6.length,
          humanCount: players6.filter(p => p.isHuman()).length,
          cpuCount: players6.filter(p => !p.isHuman()).length
        }
      };
    });
    
    // 4 players: 1 human + 3 CPU
    expect(gameData.game4.playerCount).toBe(4);
    expect(gameData.game4.humanCount).toBe(1);
    expect(gameData.game4.cpuCount).toBe(3);
    expect(gameData.game4.playerNames).toContain('あなた');
    expect(gameData.game4.playerNames).toContain('CPU1');
    
    // 6 players: 1 human + 5 CPU  
    expect(gameData.game6.playerCount).toBe(6);
    expect(gameData.game6.humanCount).toBe(1);
    expect(gameData.game6.cpuCount).toBe(5);
  });

  test('should handle turn management', async ({ page }) => {
    const turnData = await page.evaluate(() => {
      const { PlayerManager } = window.PlayerModule;
      
      const game = new PlayerManager(3);
      const players = game.getAllPlayers();
      
      // Initial state
      const initialTurn = game.getCurrentPlayer();
      const initialIndex = game.getCurrentPlayerIndex();
      
      // Next turn
      game.nextTurn();
      const secondTurn = game.getCurrentPlayer();
      const secondIndex = game.getCurrentPlayerIndex();
      
      // Skip to specific player
      game.setCurrentPlayer(2);
      const thirdTurn = game.getCurrentPlayer();
      const thirdIndex = game.getCurrentPlayerIndex();
      
      return {
        initial: {
          player: initialTurn.name,
          index: initialIndex
        },
        second: {
          player: secondTurn.name,
          index: secondIndex
        },
        third: {
          player: thirdTurn.name,
          index: thirdIndex
        }
      };
    });
    
    expect(turnData.initial.index).toBe(0);
    expect(turnData.second.index).toBe(1);
    expect(turnData.third.index).toBe(2);
    expect(turnData.initial.player).toBe('あなた');
  });

  test('should render players in UI correctly', async ({ page }) => {
    await page.evaluate(() => {
      const { PlayerManager } = window.PlayerModule;
      
      const game = new PlayerManager(4);
      game.renderPlayersUI();
    });
    
    // Wait for rendering to complete
    await page.waitForTimeout(500);
    
    // Check for CPU players
    const cpuPlayers = page.locator('.cpu-player');
    await expect(cpuPlayers).toHaveCount(3);
    
    // Check for player names
    const playerNames = page.locator('.player-name');
    await expect(playerNames).toHaveCount(3); // 3 CPU players shown
    
    // Check players area contains content
    const playersArea = page.locator('#players-area');
    await expect(playersArea).not.toBeEmpty();
  });
});