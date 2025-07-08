import LispGameAdapter from '../js/lisp-game-adapter.js';
import fs from 'fs';
import path from 'path';

global.fetch = jest.fn((url) =>
  Promise.resolve({
    text: () => Promise.resolve(fs.readFileSync(path.join(process.cwd(), url), 'utf-8')),
  })
);

// browser/tests/lisp-integration.spec.js - 新規作成
describe('Pure Lisp Engine Browser Integration', () => {
  let adapter;

  beforeEach(async () => {
    adapter = new LispGameAdapter();
    await adapter.initialize();
  });

  test('should create game instance with Lisp engine', () => {
    // ブラウザでPure Lispエンジンが正常初期化されることを確認
    expect(adapter.isReady()).toBe(true);
  });
  
  test('should handle card operations in browser', () => {
    // create-deck, shuffle-deckがブラウザで動作することを確認
    const deck = adapter.createDeck();
    expect(deck).toBeDefined();
    expect(Array.isArray(deck)).toBe(true);
    expect(deck.length).toBeGreaterThan(0);
  });
  
  test('should validate plays using Lisp engine', () => {
    // ブラウザでプレイ検証がLispエンジン経由で動作することを確認
    const gameState = adapter.createGame(4);
    const cards = [adapter.createCard('♠', '3')];
    const result = adapter.validatePlay(gameState, cards);
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});
