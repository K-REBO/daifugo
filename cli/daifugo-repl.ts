#!/usr/bin/env -S deno run --allow-read
/**
 * 大富豪専用REPL - Lisp Daifugo Interactive Game System
 * 
 * 機能:
 * - LispDaifugoEngine統合
 * - 対話型ゲームプレイ
 * - AIプレイヤー対戦
 * - リアルタイムログ表示
 */

import { DenoLispInterpreter } from "../deno-lisp-interpreter/src/main.ts";
import { SExpressionParser } from "../deno-lisp-interpreter/src/parser/s-expression-parser.ts";
import { BasicEvaluator } from "../deno-lisp-interpreter/src/evaluator/basic-evaluator.ts";

interface GameState {
  initialized: boolean;
  players: Player[];
  currentPlayer: number;
  field: Card[];
  gamePhase: 'waiting' | 'playing' | 'finished';
  turnCount: number;
}

interface Player {
  id: number;
  name: string;
  hand: Card[];
  isAI: boolean;
  aiType?: 'random' | 'smart' | 'aggressive' | 'defensive';
}

interface Card {
  rank: string;
  suit: string;
  strength: number;
}

class DaifugoREPL {
  private interpreter: DenoLispInterpreter;
  private parser: SExpressionParser;
  private evaluator: BasicEvaluator;
  private gameState: GameState;
  private lispEngineLoaded: boolean = false;
  private config: {
    cardStyle: 'text' | 'unicode';
    useColor: boolean;
  } = {
    cardStyle: 'text',
    useColor: true
  };

  constructor() {
    this.interpreter = new DenoLispInterpreter();
    this.parser = new SExpressionParser();
    this.evaluator = new BasicEvaluator();
    this.gameState = {
      initialized: false,
      players: [],
      currentPlayer: 0,
      field: [],
      gamePhase: 'waiting',
      turnCount: 0
    };
  }

  async start(): Promise<void> {
    console.log("🎴 大富豪 Lisp REPL v1.0");
    console.log("💎 LispDaifugoEngine Powered Interactive Game");
    console.log("=====================================");
    
    await this.loadLispEngine();
    
    console.log("\n🎮 ゲームコマンド:");
    console.log("  game start         - 新ゲーム開始");
    console.log("  game join <ai>     - AI追加 (random/smart/aggressive/defensive)");
    console.log("  hand               - 手札表示");
    console.log("  play <cards>       - カード出し (例: play 3s 4h)");
    console.log("  pass               - パス");
    console.log("  field              - 場の状態");
    console.log("  status             - ゲーム状況");
    console.log("  log                - ゲームログ");
    console.log("  config <setting>   - 設定変更");
    console.log("  clear              - 画面クリア");
    console.log("  help               - ヘルプ表示");
    console.log("  exit               - 終了");
    console.log("");

    await this.startREPL();
  }

  private async loadLispEngine(): Promise<void> {
    try {
      console.log("🚀 LispDaifugoEngine読み込み中...");
      
      // DenoLispInterpreterの詳細出力を抑制するため、直接実行
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      
      // 一時的にコンソール出力を抑制
      console.log = () => {};
      console.error = () => {};
      
      try {
        // コアシステムのみ読み込み（循環依存を避ける）
        await this.interpreter.executeFile("../LispDaifugoEngine/src/core/card-system.lisp");
        await this.interpreter.executeFile("../LispDaifugoEngine/src/core/player-system.lisp");
        await this.interpreter.executeFile("../LispDaifugoEngine/src/utils/card-utils.lisp");
        await this.interpreter.executeFile("../LispDaifugoEngine/src/core/game-state.lisp");
      } finally {
        // コンソール出力を復元
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
      }
      
      this.lispEngineLoaded = true;
      console.log("✅ LispDaifugoEngine読み込み完了");
      
    } catch (error) {
      console.error(`❌ エンジン読み込みエラー: ${error instanceof Error ? error.message : String(error)}`);
      console.log("⚠️  基本モードで開始します");
    }
  }

  private async startREPL(): Promise<void> {
    while (true) {
      try {
        const currentPlayerInfo = this.gameState.gamePhase === 'playing' 
          ? ` [P${this.gameState.currentPlayer + 1}]`
          : '';
        
        const input = prompt(`daifugo${currentPlayerInfo}> `);
        
        if (!input) continue;
        
        const trimmed = input.trim();
        
        if (trimmed === "exit") {
          console.log("🎌 ありがとうございました！");
          break;
        }
        
        await this.processCommand(trimmed);
        
      } catch (error) {
        console.error(`❌ エラー: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private async processCommand(command: string): Promise<void> {
    const args = command.split(/\s+/);
    const cmd = args[0];
    
    switch (cmd) {
      case "help":
        this.showHelp();
        break;
        
      case "game":
        await this.handleGameCommand(args.slice(1));
        break;
        
      case "hand":
        this.showHand();
        break;
        
      case "play":
        await this.playCards(args.slice(1));
        break;
        
      case "pass":
        await this.passTurn();
        break;
        
      case "field":
        this.showField();
        break;
        
      case "status":
        this.showGameStatus();
        break;
        
      case "log":
        this.showGameLog();
        break;
        
      case "config":
        this.handleConfigCommand(args.slice(1));
        break;
        
      case "clear":
        console.clear();
        break;
        
      default:
        // Lisp式として評価を試行
        if (command.startsWith("(") && command.endsWith(")")) {
          try {
            const result = this.interpreter.evaluateExpression(command);
            console.log(`📤 ${JSON.stringify(result)}`);
          } catch (error) {
            console.log(`❌ Lisp評価エラー: ${error instanceof Error ? error.message : String(error)}`);
          }
        } else {
          console.log(`❓ 不明なコマンド: ${cmd} (help でコマンド一覧)`);
        }
        break;
    }
  }

  private async handleGameCommand(args: string[]): Promise<void> {
    if (args.length === 0) {
      console.log("❓ game サブコマンドが必要です (start/join)");
      return;
    }
    
    switch (args[0]) {
      case "start":
        await this.startNewGame();
        break;
        
      case "join":
        if (args.length < 2) {
          console.log("❓ AIタイプを指定してください (random/smart/aggressive/defensive)");
          return;
        }
        await this.addAIPlayer(args[1] as any);
        break;
        
      default:
        console.log(`❓ 不明なゲームコマンド: ${args[0]}`);
        break;
    }
  }

  private async startNewGame(): Promise<void> {
    console.log("🎮 新しい大富豪ゲームを開始します...");
    
    // デッキを作成してシャッフル
    const deck = this.shuffleDeck(this.createDeck());
    
    // プレイヤー1（人間）を作成
    this.gameState.players = [{
      id: 0,
      name: "あなた",
      hand: [],
      isAI: false
    }];
    
    // 初期手札を配る（13枚ずつ）
    const hands = this.dealCards(deck, 1, 13);
    this.gameState.players[0].hand = hands[0];
    
    this.gameState.initialized = true;
    this.gameState.gamePhase = 'playing';
    this.gameState.currentPlayer = 0;
    this.gameState.field = [];
    this.gameState.turnCount = 1;
    
    console.log("✅ ゲーム開始！");
    console.log("💡 'game join smart' でAIプレイヤーを追加できます");
    
    this.showHand();
  }

  private async addAIPlayer(aiType: 'random' | 'smart' | 'aggressive' | 'defensive'): Promise<void> {
    if (!this.gameState.initialized) {
      console.log("❌ まずゲームを開始してください (game start)");
      return;
    }
    
    // 新しいデッキから手札を配る
    const deck = this.shuffleDeck(this.createDeck());
    const playerId = this.gameState.players.length;
    const hands = this.dealCards(deck, 1, 13);
    
    const aiPlayer: Player = {
      id: playerId,
      name: `AI-${aiType.toUpperCase()}`,
      hand: hands[0],
      isAI: true,
      aiType: aiType
    };
    
    this.gameState.players.push(aiPlayer);
    
    console.log(`🤖 ${aiPlayer.name} がゲームに参加しました (${this.gameState.players.length}プレイヤー)`);
  }

  private createInitialHand(): Card[] {
    // デモ用の初期手札（毎回新しい配列を作成）
    return [
      { rank: "3", suit: "spades", strength: 1 },
      { rank: "5", suit: "hearts", strength: 3 },
      { rank: "7", suit: "diamonds", strength: 5 },
      { rank: "9", suit: "clubs", strength: 7 },
      { rank: "J", suit: "spades", strength: 9 },
      { rank: "K", suit: "hearts", strength: 11 },
      { rank: "A", suit: "diamonds", strength: 12 }
    ].map(card => ({ ...card })); // 各カードオブジェクトを複製
  }

  private createDeck(): Card[] {
    const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
    const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
    const deck: Card[] = [];
    
    suits.forEach(suit => {
      ranks.forEach(rank => {
        deck.push({
          rank: rank,
          suit: suit,
          strength: this.calculateStrength(rank)
        });
      });
    });
    
    return deck;
  }

  private shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private dealCards(deck: Card[], playerCount: number, cardsPerPlayer: number): Card[][] {
    const hands: Card[][] = Array(playerCount).fill(null).map(() => []);
    
    for (let i = 0; i < cardsPerPlayer; i++) {
      for (let p = 0; p < playerCount; p++) {
        if (deck.length > 0) {
          hands[p].push(deck.pop()!);
        }
      }
    }
    
    return hands;
  }

  private showHand(): void {
    if (!this.gameState.initialized) {
      console.log("❌ ゲームが開始されていません");
      return;
    }
    
    const player = this.gameState.players[0]; // プレイヤー1
    console.log(`\n🂠 ${player.name}の手札 (${player.hand.length}枚):`);
    
    const handDisplay = player.hand
      .map(card => this.formatCard(card))
      .join("  ");
    
    console.log(`   ${handDisplay}\n`);
  }

  private async playCards(cardStrings: string[]): Promise<void> {
    if (!this.gameState.initialized || this.gameState.gamePhase !== 'playing') {
      console.log("❌ ゲームが進行中ではありません");
      return;
    }
    
    if (this.gameState.currentPlayer !== 0) {
      console.log("❌ あなたのターンではありません");
      return;
    }
    
    if (cardStrings.length === 0) {
      console.log("❓ 出すカードを指定してください (例: play 3s 4h)");
      return;
    }
    
    console.log(`🎴 ${cardStrings.join(", ")} を出しました`);
    
    // 出したカードを作成
    const playedCards = cardStrings.map(cs => ({
      rank: cs.slice(0, -1),
      suit: this.parseSuit(cs.slice(-1)),
      strength: this.calculateStrength(cs.slice(0, -1))
    }));
    
    // プレイヤーの手札からカードを削除
    const player = this.gameState.players[0];
    playedCards.forEach(playedCard => {
      const cardIndex = player.hand.findIndex(c => 
        c.rank === playedCard.rank && c.suit === playedCard.suit
      );
      if (cardIndex >= 0) {
        player.hand.splice(cardIndex, 1);
      }
    });
    
    // 場に追加
    this.gameState.field = playedCards;
    
    await this.nextTurn();
  }

  private async passTurn(): Promise<void> {
    if (!this.gameState.initialized || this.gameState.gamePhase !== 'playing') {
      console.log("❌ ゲームが進行中ではありません");
      return;
    }
    
    if (this.gameState.currentPlayer !== 0) {
      console.log("❌ あなたのターンではありません");
      return;
    }
    
    console.log("⏭️ パスしました");
    await this.nextTurn();
  }

  private async nextTurn(): Promise<void> {
    this.gameState.currentPlayer = (this.gameState.currentPlayer + 1) % this.gameState.players.length;
    this.gameState.turnCount++;
    
    const currentPlayer = this.gameState.players[this.gameState.currentPlayer];
    console.log(`\n👤 ${currentPlayer.name}のターン (ターン${this.gameState.turnCount})`);
    
    if (currentPlayer.isAI) {
      await this.executeAITurn(currentPlayer);
    }
  }

  private async executeAITurn(aiPlayer: Player): Promise<void> {
    // AI行動をシミュレート
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const actions = ["カードを出す", "パス"];
    const action = actions[Math.floor(Math.random() * actions.length)];
    
    console.log(`🤖 ${aiPlayer.name}: ${action}`);
    
    if (action === "カードを出す") {
      // プレイ可能なカードをチェック
      const playableCards = await this.getPlayableCardsForAI(aiPlayer.hand);
      
      if (playableCards.length > 0) {
        // ランダムにプレイ可能なカードを選択
        const selectedCard = playableCards[Math.floor(Math.random() * playableCards.length)];
        
        // 手札からカードを削除
        const cardIndex = aiPlayer.hand.findIndex(c => 
          c.rank === selectedCard.rank && c.suit === selectedCard.suit
        );
        if (cardIndex >= 0) {
          aiPlayer.hand.splice(cardIndex, 1);
        }
        
        // 場に出す
        this.gameState.field = [selectedCard];
        console.log(`   出したカード: ${this.formatCard(selectedCard)}`);
      } else {
        console.log(`🤖 ${aiPlayer.name}: プレイ可能なカードがないため、パス`);
      }
    }
    
    await this.nextTurn();
  }

  private async getPlayableCardsForAI(hand: Card[]): Promise<Card[]> {
    try {
      // javascript-api.lispのget-valid-actions-apiを使用
      const gameId = "current-game";
      const playerId = this.gameState.currentPlayer;
      
      const lispExpression = `(daifugo-javascript-api:get-valid-actions-api 
                                (daifugo-javascript-api:create-javascript-api) 
                                "${gameId}" ${playerId})`;
      
      const result = this.interpreter.evaluateExpression(lispExpression);
      
      // 結果から出せるカードを抽出
      if (result && result.data && result.data.actions) {
        return hand.filter(card => 
          this.gameState.field.length === 0 || 
          card.strength > this.gameState.field[0].strength
        );
      }
      
      // フォールバック
      return this.getPlayableCardsFallback(hand);
    } catch (error) {
      console.log(`⚠️ Lisp API処理エラー、フォールバック: ${error instanceof Error ? error.message : String(error)}`);
      return this.getPlayableCardsFallback(hand);
    }
  }

  private getPlayableCardsFallback(hand: Card[]): Card[] {
    if (this.gameState.field.length === 0) {
      return hand;
    }
    const fieldStrength = this.gameState.field[0].strength;
    return hand.filter(card => card.strength > fieldStrength);
  }

  private convertCardsToLisp(cards: Card[]): any[] {
    return cards.map(card => ({
      rank: card.rank,
      suit: card.suit,
      strength: card.strength
    }));
  }

  private convertLispToCards(lispResult: any): Card[] {
    try {
      if (Array.isArray(lispResult)) {
        return lispResult.map((item: any) => ({
          rank: item.rank || "3",
          suit: item.suit || "spades", 
          strength: item.strength || 1
        }));
      }
      return [];
    } catch (error) {
      console.log(`⚠️ Lisp結果変換エラー: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  private showField(): void {
    console.log("\n🏟️ 場の状態:");
    
    if (this.gameState.field.length === 0) {
      console.log("   空の場 - 何でも出せます");
    } else {
      const fieldDisplay = this.gameState.field
        .map(card => `${this.getCardSymbol(card)} ${card.rank}${this.getSuitSymbol(card.suit)}`)
        .join("  ");
      console.log(`   ${fieldDisplay}`);
    }
    console.log("");
  }

  private showGameStatus(): void {
    console.log("\n📊 ゲーム状況:");
    console.log(`   フェーズ: ${this.gameState.gamePhase}`);
    console.log(`   ターン: ${this.gameState.turnCount}`);
    console.log(`   プレイヤー数: ${this.gameState.players.length}`);
    
    this.gameState.players.forEach((player, index) => {
      const current = index === this.gameState.currentPlayer ? "👉 " : "   ";
      const type = player.isAI ? `(AI-${player.aiType})` : "(人間)";
      console.log(`${current}P${index + 1}: ${player.name} ${type} - ${player.hand.length}枚`);
    });
    
    console.log("");
  }

  private showGameLog(): void {
    console.log("\n📜 ゲームログ:");
    console.log(`   ターン${this.gameState.turnCount}: ${this.gameState.players[this.gameState.currentPlayer].name}のターン`);
    if (this.gameState.field.length > 0) {
      console.log(`   場: ${this.gameState.field.map(c => c.rank + this.getSuitSymbol(c.suit)).join(", ")}`);
    }
    console.log("");
  }

  private handleConfigCommand(args: string[]): void {
    if (args.length === 0) {
      console.log("\n⚙️ 現在の設定:");
      console.log(`  カード表示: ${this.config.cardStyle}`);
      console.log(`  色表示: ${this.config.useColor ? 'on' : 'off'}`);
      console.log("\n設定変更:");
      console.log("  config card-style text|unicode");
      console.log("  config color on|off");
      return;
    }
    
    const setting = args[0];
    const value = args[1];
    
    switch (setting) {
      case "card-style":
        if (value === "text" || value === "unicode") {
          this.config.cardStyle = value;
          console.log(`✅ カード表示を${value}に変更しました`);
        } else {
          console.log("❓ 使用法: config card-style text|unicode");
        }
        break;
        
      case "color":
        if (value === "on" || value === "off") {
          this.config.useColor = value === "on";
          console.log(`✅ 色表示を${value}に変更しました`);
        } else {
          console.log("❓ 使用法: config color on|off");
        }
        break;
        
      default:
        console.log(`❓ 不明な設定: ${setting}`);
        console.log("使用可能な設定: card-style, color");
        break;
    }
  }

  private showHelp(): void {
    console.log(`
🎴 大富豪 Lisp REPL - コマンド一覧

🎮 ゲームコマンド:
  game start           新しいゲームを開始
  game join <ai-type>  AIプレイヤーを追加 (random/smart/aggressive/defensive)
  hand                 現在の手札を表示
  play <cards>         カードを出す (例: play 3s 4h 5d)
  pass                 パスする
  field                場の状態を表示
  status               ゲーム全体の状況を表示
  log                  ゲームログを表示

💻 システムコマンド:
  config               設定の表示・変更
  clear                画面をクリア
  help                 このヘルプを表示
  exit                 REPLを終了

🔧 Lispコマンド:
  (+ 1 2 3)           Lisp式を直接実行
  
📖 カード記法:
  3s = 3 of Spades    h = Hearts ♥
  4h = 4 of Hearts    d = Diamonds ♦  
  5d = 5 of Diamonds  c = Clubs ♣
  6c = 6 of Clubs     s = Spades ♠
    `);
  }

  // ユーティリティメソッド
  private formatCard(card: Card): string {
    if (this.config.cardStyle === 'unicode') {
      return this.getUnicodeCard(card);
    } else {
      const colorCode = this.config.useColor ? this.getColorCode(card.suit) : '';
      const resetCode = this.config.useColor ? '\x1b[0m' : '';
      return `${colorCode}${card.rank}${this.getSuitSymbol(card.suit)}${resetCode}`;
    }
  }

  private getUnicodeCard(card: Card): string {
    // Unicode Playing Cards (U+1F0A1-U+1F0DE)
    const suits = { 'spades': 0, 'hearts': 1, 'diamonds': 2, 'clubs': 3 };
    const ranks = { 
      'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 13, 'K': 14
    };
    
    const suitOffset = suits[card.suit as keyof typeof suits] || 0;
    const rankValue = ranks[card.rank as keyof typeof ranks] || 1;
    
    // Unicode Playing Cards base: 0x1F0A1 (Ace of Spades)
    const cardCode = 0x1F0A1 + (suitOffset * 16) + (rankValue - 1);
    const unicodeCard = String.fromCodePoint(cardCode);
    
    // Unicode文字にも色を適用
    if (this.config.useColor) {
      const colorCode = this.getColorCode(card.suit);
      const resetCode = '\x1b[0m';
      return `${colorCode}${unicodeCard}${resetCode}`;
    }
    
    return unicodeCard;
  }

  private getSuitSymbol(suit: string): string {
    const symbols: { [key: string]: string } = {
      'spades': '♠',
      'hearts': '♥', 
      'diamonds': '♦',
      'clubs': '♣'
    };
    return symbols[suit] || suit;
  }

  private getColorCode(suit: string): string {
    if (!this.config.useColor) return '';
    // 赤色 (Hearts, Diamonds)
    if (suit === 'hearts' || suit === 'diamonds') {
      return '\x1b[31m'; // Red
    }
    // 黒色 (Spades, Clubs) - デフォルト色なので何もしない
    return '';
  }

  private getCardSymbol(card: Card): string {
    // トレードマークカード文字 (U+1F0A0-U+1F0DF)
    return '🂠';
  }

  private parseSuit(suitChar: string): string {
    const suitMap: { [key: string]: string } = {
      's': 'spades',
      'h': 'hearts',
      'd': 'diamonds', 
      'c': 'clubs'
    };
    return suitMap[suitChar.toLowerCase()] || 'spades';
  }

  private calculateStrength(rank: string): number {
    const strengthMap: { [key: string]: number } = {
      '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '8': 6, '9': 7, '10': 8,
      'J': 9, 'Q': 10, 'K': 11, 'A': 12, '2': 13
    };
    return strengthMap[rank] || 0;
  }
}

// メイン実行
if (import.meta.main) {
  const repl = new DaifugoREPL();
  repl.start().catch((error) => {
    console.error("💥 Fatal error:", error);
    Deno.exit(1);
  });
}

export { DaifugoREPL };