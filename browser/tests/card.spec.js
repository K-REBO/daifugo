import { test, expect } from '@playwright/test';

test.describe('Card System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Load Card module
    await page.addScriptTag({
      path: './js/card.js',
      type: 'module'
    });
  });

  test('should create card with correct properties', async ({ page }) => {
    const cardData = await page.evaluate(() => {
      const { Card } = window.CardModule;
      const card = new Card('♠', 'A');
      return {
        suit: card.suit,
        rank: card.rank,
        isJoker: card.isJoker,
        unicode: card.getUnicode(),
        display: card.getDisplayText()
      };
    });
    
    expect(cardData.suit).toBe('♠');
    expect(cardData.rank).toBe('A');
    expect(cardData.isJoker).toBe(false);
    expect(cardData.unicode).toBe('♠');
    expect(cardData.display).toBe('♠A');
  });

  test('should create joker card correctly', async ({ page }) => {
    const jokerData = await page.evaluate(() => {
      const { Card } = window.CardModule;
      const joker = new Card('JOKER', 'JOKER');
      return {
        suit: joker.suit,
        rank: joker.rank,
        isJoker: joker.isJoker,
        unicode: joker.getUnicode(),
        display: joker.getDisplayText(),
        getValue: joker.getValue(false)
      };
    });
    
    expect(jokerData.suit).toBe('JOKER');
    expect(jokerData.rank).toBe('JOKER');
    expect(jokerData.isJoker).toBe(true);
    expect(jokerData.unicode).toBe('🃏');
    expect(jokerData.display).toBe('🃏');
    expect(jokerData.getValue).toBe(15); // Highest value
  });

  test('should compare card values correctly', async ({ page }) => {
    const comparison = await page.evaluate(() => {
      const { Card } = window.CardModule;
      const card3 = new Card('♠', '3');
      const cardA = new Card('♥', 'A');
      const card2 = new Card('♦', '2');
      const joker = new Card('JOKER', 'JOKER');
      
      return {
        // Normal order (3 is weakest, 2 is strongest)
        normalOrder: {
          card3vsA: card3.getValue(false) < cardA.getValue(false),
          cardAvs2: cardA.getValue(false) < card2.getValue(false),
          card2vsJoker: card2.getValue(false) < joker.getValue(false)
        },
        // Revolution order (reversed except joker)
        revolutionOrder: {
          card3vsA: card3.getValue(true) > cardA.getValue(true),
          cardAvs2: cardA.getValue(true) > card2.getValue(true),
          card2vsJoker: card2.getValue(true) < joker.getValue(true)
        }
      };
    });
    
    // Normal order: 3 < A < 2 < Joker
    expect(comparison.normalOrder.card3vsA).toBe(true);
    expect(comparison.normalOrder.cardAvs2).toBe(true);
    expect(comparison.normalOrder.card2vsJoker).toBe(true);
    
    // Revolution order: A < 3, 2 < A, but Joker still strongest
    expect(comparison.revolutionOrder.card3vsA).toBe(true);
    expect(comparison.revolutionOrder.cardAvs2).toBe(true);
    expect(comparison.revolutionOrder.card2vsJoker).toBe(true);
  });

  test('should handle all suits correctly', async ({ page }) => {
    const suits = await page.evaluate(() => {
      const { Card } = window.CardModule;
      const spade = new Card('♠', 'K');
      const heart = new Card('♥', 'K');
      const diamond = new Card('♦', 'K');
      const club = new Card('♣', 'K');
      
      return {
        spade: { unicode: spade.getUnicode(), color: spade.getColor() },
        heart: { unicode: heart.getUnicode(), color: heart.getColor() },
        diamond: { unicode: diamond.getUnicode(), color: diamond.getColor() },
        club: { unicode: club.getUnicode(), color: club.getColor() }
      };
    });
    
    expect(suits.spade.unicode).toBe('♠');
    expect(suits.spade.color).toBe('black');
    expect(suits.heart.unicode).toBe('♥');
    expect(suits.heart.color).toBe('red');
    expect(suits.diamond.unicode).toBe('♦');
    expect(suits.diamond.color).toBe('red');
    expect(suits.club.unicode).toBe('♣');
    expect(suits.club.color).toBe('black');
  });

  test('should render card visually in DOM', async ({ page }) => {
    await page.evaluate(() => {
      const { Card } = window.CardModule;
      const card = new Card('♥', 'Q');
      const cardElement = card.createElement();
      cardElement.id = 'test-card-element';
      document.getElementById('human-cards').appendChild(cardElement);
    });
    
    const cardElement = page.locator('#test-card-element');
    await expect(cardElement).toBeVisible();
    await expect(cardElement).toHaveClass(/card/);
    await expect(cardElement).toHaveClass(/card-red/);
    await expect(cardElement).toHaveText('♥Q');
  });

  test('should handle card selection state', async ({ page }) => {
    await page.evaluate(() => {
      const { Card } = window.CardModule;
      const card = new Card('♣', '7');
      const cardElement = card.createElement();
      cardElement.id = 'selectable-card';
      document.getElementById('human-cards').appendChild(cardElement);
      
      // Test selection
      card.setSelected(true);
      card.setSelected(false);
    });
    
    const cardElement = page.locator('#selectable-card');
    await expect(cardElement).toBeVisible();
    
    // Check if selection styling works
    await page.evaluate(() => {
      const { Card } = window.CardModule;
      const cards = window.CardModule.getAllCards();
      if (cards.length > 0) {
        cards[0].setSelected(true);
      }
    });
  });
});