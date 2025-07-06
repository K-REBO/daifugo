import { test, expect } from '@playwright/test';

test.describe('Game Logic System', () => {
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
  });

  test('should create and shuffle deck correctly', async ({ page }) => {
    const deckData = await page.evaluate(() => {
      const { PlayerManager } = window.PlayerModule;
      const { GameLogic } = window.GameModule;
      
      const playerManager = new PlayerManager(4);
      const game = new GameLogic(playerManager);
      
      game.createDeck();
      
      return {
        deckSize: game.deck.length,
        hasJokers: game.deck.filter(card => card.isJoker).length,
        hasAllSuits: ['♠', '♥', '♦', '♣'].every(suit => 
          game.deck.some(card => card.suit === suit)
        ),
        hasAllRanks: ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'].every(rank =>
          game.deck.some(card => card.rank === rank)
        )
      };
    });
    
    expect(deckData.deckSize).toBe(54); // 52 + 2 jokers
    expect(deckData.hasJokers).toBe(2);
    expect(deckData.hasAllSuits).toBe(true);
    expect(deckData.hasAllRanks).toBe(true);
  });

  test('should start game and deal cards correctly', async ({ page }) => {
    const gameStartData = await page.evaluate(() => {
      const { PlayerManager } = window.PlayerModule;
      const { GameLogic } = window.GameModule;
      
      const playerManager = new PlayerManager(4);
      const game = new GameLogic(playerManager);
      
      const started = game.startGame();
      const status = game.getGameStatus();
      const players = playerManager.getAllPlayers();
      
      return {
        gameStarted: started,
        gameState: status.gameState,
        playerCardCounts: players.map(p => p.getCardCount()),
        totalCardsDealt: players.reduce((sum, p) => sum + p.getCardCount(), 0),
        currentPlayerSet: status.currentPlayer !== undefined
      };
    });
    
    expect(gameStartData.gameStarted).toBe(true);
    expect(gameStartData.gameState).toBe('playing');
    expect(gameStartData.totalCardsDealt).toBe(52); // 54 - 2 remaining
    expect(gameStartData.playerCardCounts.every(count => count > 0)).toBe(true);
    expect(gameStartData.currentPlayerSet).toBe(true);
  });

  test('should validate card plays correctly', async ({ page }) => {
    const validationData = await page.evaluate(() => {
      const { PlayerManager } = window.PlayerModule;
      const { GameLogic } = window.GameModule;
      const { Card } = window.CardModule;
      
      const playerManager = new PlayerManager(4);
      const game = new GameLogic(playerManager);
      
      // Test cards
      const cards1 = [new Card('♠', '7')];
      const cards2 = [new Card('♥', '7'), new Card('♦', '7')]; // Same rank
      const cards3 = [new Card('♠', '8'), new Card('♥', '9')]; // Different ranks
      const cards4 = [new Card('♠', 'A'), new Card('♥', 'A'), new Card('♦', 'A'), new Card('♣', 'A')]; // Revolution
      const cards5 = [new Card('♠', '8')]; // 8-cut
      
      const results = {
        singleCard: game.canPlayCards(cards1),
        sameRank: game.canPlayCards(cards2),
        differentRank: game.canPlayCards(cards3),
        revolution: game.canPlayCards(cards4),
        eightCut: game.canPlayCards(cards5),
        emptyCards: game.canPlayCards([])
      };
      
      return results;
    });
    
    expect(validationData.singleCard.valid).toBe(true);
    expect(validationData.sameRank.valid).toBe(true);
    expect(validationData.differentRank.valid).toBe(false);
    expect(validationData.revolution.valid).toBe(true);
    expect(validationData.revolution.special).toBe('revolution');
    expect(validationData.eightCut.valid).toBe(true);
    expect(validationData.eightCut.special).toBe('8cut');
    expect(validationData.emptyCards.valid).toBe(false);
  });

  test('should handle card playing and turn progression', async ({ page }) => {
    const turnData = await page.evaluate(() => {
      const { PlayerManager } = window.PlayerModule;
      const { GameLogic } = window.GameModule;
      const { Card } = window.CardModule;
      
      const playerManager = new PlayerManager(3);
      const game = new GameLogic(playerManager);
      
      // Manually set up players with specific cards
      const players = playerManager.getAllPlayers();
      players[0].hand = [new Card('♠', '7'), new Card('♥', '10')];
      players[1].hand = [new Card('♦', '9'), new Card('♣', 'K')];
      players[2].hand = [new Card('♠', 'A'), new Card('♥', '2')];
      
      playerManager.setCurrentPlayer(0);
      
      // First player plays 7
      const play1 = game.playCards([new Card('♠', '7')]);
      const status1 = game.getGameStatus();
      
      // Second player plays 9 (should work - 9 > 7)
      const play2 = game.playCards([new Card('♦', '9')]);
      const status2 = game.getGameStatus();
      
      return {
        firstPlay: play1,
        firstTurnIndex: status1.currentPlayer,
        secondPlay: play2,
        secondTurnIndex: status2.currentPlayer,
        fieldCards: game.getFieldCards().map(c => c.getDisplayText())
      };
    });
    
    expect(turnData.firstPlay.success).toBe(true);
    expect(turnData.secondPlay.success).toBe(true);
    expect(turnData.fieldCards).toEqual(['♦9']);
  });

  test('should handle pass functionality', async ({ page }) => {
    const passData = await page.evaluate(() => {
      const { PlayerManager } = window.PlayerModule;
      const { GameLogic } = window.GameModule;
      const { Card } = window.CardModule;
      
      const playerManager = new PlayerManager(3);
      const game = new GameLogic(playerManager);
      
      // Set up game state
      game.lastPlayedCards = [new Card('♠', 'K')];
      game.fieldCards = [new Card('♠', 'K')];
      
      // Test passing
      const pass1 = game.passTurn();
      const status1 = game.getGameStatus();
      
      const pass2 = game.passTurn();
      const status2 = game.getGameStatus();
      
      // After 2 passes (out of 3 players), field should clear
      return {
        firstPass: pass1,
        secondPass: pass2,
        skipCount: game.skipCount,
        fieldCleared: game.fieldCards.length === 0
      };
    });
    
    expect(passData.firstPass.success).toBe(true);
    expect(passData.secondPass.success).toBe(true);
    expect(passData.fieldCleared).toBe(true);
  });

  test('should handle revolution mode correctly', async ({ page }) => {
    const revolutionData = await page.evaluate(() => {
      const { PlayerManager } = window.PlayerModule;
      const { GameLogic } = window.GameModule;
      const { Card } = window.CardModule;
      
      const playerManager = new PlayerManager(3);
      const game = new GameLogic(playerManager);
      
      // Manually set up player
      const player = playerManager.getCurrentPlayer();
      player.hand = [
        new Card('♠', '7'), new Card('♥', '7'), 
        new Card('♦', '7'), new Card('♣', '7'),
        new Card('♠', '3')
      ];
      
      // Play revolution (4 of a kind)
      const revolutionCards = [
        new Card('♠', '7'), new Card('♥', '7'), 
        new Card('♦', '7'), new Card('♣', '7')
      ];
      
      const beforeRevolution = game.isRevolution;
      const playResult = game.playCards(revolutionCards);
      const afterRevolution = game.isRevolution;
      
      // Test card values in revolution mode
      const card3 = new Card('♠', '3');
      const card2 = new Card('♥', '2');
      
      return {
        beforeRevolution,
        afterRevolution,
        playResult: playResult.success,
        special: playResult.special,
        card3Value: card3.getValue(true), // revolution mode
        card2Value: card2.getValue(true)  // revolution mode
      };
    });
    
    expect(revolutionData.beforeRevolution).toBe(false);
    expect(revolutionData.afterRevolution).toBe(true);
    expect(revolutionData.playResult).toBe(true);
    expect(revolutionData.special).toBe('revolution');
    expect(revolutionData.card3Value).toBeGreaterThan(revolutionData.card2Value); // 3 > 2 in revolution
  });

  test('should detect game over condition', async ({ page }) => {
    const gameOverData = await page.evaluate(() => {
      const { PlayerManager } = window.PlayerModule;
      const { GameLogic } = window.GameModule;
      const { Card } = window.CardModule;
      
      const playerManager = new PlayerManager(3);
      const game = new GameLogic(playerManager);
      
      // Set up game state - all players have cards
      const players = playerManager.getAllPlayers();
      players[0].hand = [new Card('♠', '7')]; // playing
      players[1].hand = [new Card('♥', '8')]; // playing
      players[2].hand = [new Card('♦', '9')]; // playing
      
      const gameOverBefore = game.isGameOver();
      
      // Finish two players, leaving only one
      players[0].hand = []; // finished
      players[1].hand = []; // finished
      // players[2] still has cards
      
      const gameOverAfter = game.isGameOver();
      
      return {
        gameOverBefore,
        gameOverAfter,
        playersWithCards: players.filter(p => !p.isFinished()).length
      };
    });
    
    expect(gameOverData.gameOverBefore).toBe(false);
    expect(gameOverData.gameOverAfter).toBe(true); // Only 1 player left = game over
  });
});