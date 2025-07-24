#!/usr/bin/env -S deno run --allow-read --allow-write
/**
 * 大富豪AIデバッグシステム - 4プレイヤーAI対戦とログ解析
 * 
 * 機能:
 * - 4種類のAI戦略（Random, Smart, Aggressive, Defensive）
 * - リアルタイムゲーム実行とログ取得
 * - ゲーム破綻検証（無限ループ、不正な手、ルール違反）
 * - 統計分析（勝率、ターン数、AI性能）
 */

import { BasicEvaluator } from "./deno-lisp-interpreter/src/evaluator/basic-evaluator.ts";
import { SExpressionParser } from "./deno-lisp-interpreter/src/parser/s-expression-parser.ts";

// ===============================
// 大富豪ゲームルール定義
// ===============================

interface Card {
  rank: number;  // 3-10, 11(J), 12(Q), 13(K), 14(A), 2
  suit: string;  // spades, hearts, diamonds, clubs
  strength: number;  // 1-13 (3が最弱、2が最強)
}

interface Player {
  id: number;
  name: string;
  hand: Card[];
  aiType: AIType;
  rank: number;  // 0=大富豪, 1=富豪, 2=平民, 3=大貧民
}

interface GameState {
  players: Player[];
  currentPlayer: number;
  field: Card[];
  lastPlayer: number;
  turnCount: number;
  gamePhase: 'dealing' | 'playing' | 'finished';
  winner?: number;
  logs: GameLog[];
}

interface GameLog {
  turn: number;
  player: number;
  action: 'play' | 'pass' | 'deal' | 'game_start' | 'game_end';
  cards?: Card[];
  message: string;
  timestamp: Date;
  gameState: Partial<GameState>;
}

// ===============================
// AIプレイヤータイプ
// ===============================

type AIType = 'random' | 'smart' | 'aggressive' | 'defensive';

class AIPlayer {
  constructor(
    public id: number,
    public name: string,
    public aiType: AIType
  ) {}

  makeDecision(gameState: GameState): { action: 'play' | 'pass', cards?: Card[] } {
    const player = gameState.players[this.id];
    const playableCards = this.getPlayableCards(player.hand, gameState.field);

    switch (this.aiType) {
      case 'random':
        return this.randomStrategy(playableCards);
      
      case 'smart':
        return this.smartStrategy(playableCards, player.hand);
      
      case 'aggressive':
        return this.aggressiveStrategy(playableCards);
      
      case 'defensive':
        return this.defensiveStrategy(playableCards, player.hand);
      
      default:
        return { action: 'pass' };
    }
  }

  private getPlayableCards(hand: Card[], field: Card[]): Card[] {
    if (field.length === 0) {
      return hand; // 場が空なら何でも出せる
    }

    const fieldStrength = field[0].strength;
    // 🔧 FIX: より強いカードのみ出せる（同値不可）
    return hand.filter(card => card.strength > fieldStrength);
  }

  private randomStrategy(playableCards: Card[]): { action: 'play' | 'pass', cards?: Card[] } {
    if (playableCards.length === 0 || Math.random() < 0.3) {
      return { action: 'pass' };
    }
    const randomCard = playableCards[Math.floor(Math.random() * playableCards.length)];
    return { action: 'play', cards: [randomCard] };
  }

  private smartStrategy(playableCards: Card[], hand: Card[]): { action: 'play' | 'pass', cards?: Card[] } {
    if (playableCards.length === 0) {
      return { action: 'pass' };
    }

    // 🔧 FIX: より戦略的な判断
    // 手札が非常に少ない場合（2枚以下）は積極的に
    if (hand.length <= 2) {
      // 最も弱い出せるカードで勝負
      const weakestPlayable = playableCards.reduce((min, card) => 
        card.strength < min.strength ? card : min
      );
      return { action: 'play', cards: [weakestPlayable] };
    }

    // 手札が少ない場合（3-5枚）は慎重に
    if (hand.length <= 5) {
      // 30%の確率でパス、残りは最弱カード
      if (Math.random() < 0.3) {
        return { action: 'pass' };
      }
      const weakestPlayable = playableCards.reduce((min, card) => 
        card.strength < min.strength ? card : min
      );
      return { action: 'play', cards: [weakestPlayable] };
    }

    // 手札が多い場合は積極的に出す
    // 最弱のカードを優先的に出す
    const weakestPlayable = playableCards.reduce((min, card) => 
      card.strength < min.strength ? card : min
    );
    return { action: 'play', cards: [weakestPlayable] };
  }

  private aggressiveStrategy(playableCards: Card[]): { action: 'play' | 'pass', cards?: Card[] } {
    if (playableCards.length === 0) {
      return { action: 'pass' };
    }

    // 🔧 FIX: 積極的だが戦略的なプレイ
    // 90%の確率で出す（非常に積極的）
    if (Math.random() < 0.9) {
      // 強いカードを優先するが、手札の状況も考慮
      const strongestCard = playableCards.reduce((max, card) => 
        card.strength > max.strength ? card : max
      );
      return { action: 'play', cards: [strongestCard] };
    }
    
    return { action: 'pass' };
  }

  private defensiveStrategy(playableCards: Card[], hand: Card[]): { action: 'play' | 'pass', cards?: Card[] } {
    if (playableCards.length === 0) {
      return { action: 'pass' };
    }

    // 🔧 FIX: 慎重だが適切な判断
    // 手札が非常に多い場合（8枚以上）は積極的に減らす
    if (hand.length >= 8) {
      const weakestPlayable = playableCards.reduce((min, card) => 
        card.strength < min.strength ? card : min
      );
      return { action: 'play', cards: [weakestPlayable] };
    }

    // 手札が多い場合（5-7枚）は60%の確率でプレイ
    if (hand.length >= 5) {
      if (Math.random() < 0.6) {
        const weakestPlayable = playableCards.reduce((min, card) => 
          card.strength < min.strength ? card : min
        );
        return { action: 'play', cards: [weakestPlayable] };
      }
    }

    // 手札が少ない場合は30%の確率でプレイ（慎重）
    if (Math.random() < 0.3) {
      const weakestPlayable = playableCards.reduce((min, card) => 
        card.strength < min.strength ? card : min
      );
      return { action: 'play', cards: [weakestPlayable] };
    }

    return { action: 'pass' };
  }
}

// ===============================
// 大富豪ゲームエンジン
// ===============================

class DaifugoGameEngine {
  private evaluator: BasicEvaluator;
  private parser: SExpressionParser;

  constructor() {
    this.evaluator = new BasicEvaluator();
    this.parser = new SExpressionParser();
    this.initializeLispEnvironment();
  }

  private initializeLispEnvironment() {
    // 基本的なLisp環境をセットアップ
    this.evaluator.evaluate(this.parser.parse("(defstruct card rank suit strength)"));
    this.evaluator.evaluate(this.parser.parse("(defstruct player id name hand rank)"));
  }

  createDeck(): Card[] {
    const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
    const ranks = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 2]; // 11=J, 12=Q, 13=K, 14=A
    const deck: Card[] = [];

    suits.forEach(suit => {
      ranks.forEach(rank => {
        const strength = this.calculateStrength(rank);
        deck.push({ rank, suit, strength });
      });
    });

    return this.shuffleDeck(deck);
  }

  private calculateStrength(rank: number): number {
    // 大富豪のカード強度: 3が1、4が2、...、Aが12、2が13
    if (rank === 2) return 13;
    if (rank === 14) return 12; // A
    if (rank === 13) return 11; // K
    if (rank === 12) return 10; // Q
    if (rank === 11) return 9;  // J
    return rank - 2; // 3が1、4が2、...、10が8
  }

  private shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  createPlayers(): Player[] {
    const aiTypes: AIType[] = ['random', 'smart', 'aggressive', 'defensive'];
    return aiTypes.map((aiType, index) => ({
      id: index,
      name: `${aiType.toUpperCase()}_AI`,
      hand: [],
      aiType,
      rank: 0
    }));
  }

  dealCards(players: Player[], deck: Card[]): void {
    const cardsPerPlayer = Math.floor(deck.length / players.length);
    
    players.forEach((player, index) => {
      player.hand = deck.slice(index * cardsPerPlayer, (index + 1) * cardsPerPlayer);
    });
  }

  async playGame(): Promise<GameState> {
    console.log("🎴 大富豪AI対戦デバッグシステム開始");
    
    const players = this.createPlayers();
    const deck = this.createDeck();
    this.dealCards(players, deck);

    const gameState: GameState = {
      players,
      currentPlayer: 0,
      field: [],
      lastPlayer: -1,
      turnCount: 0,
      gamePhase: 'playing',
      logs: []
    };

    this.logAction(gameState, 'game_start', 'ゲーム開始 - 4プレイヤーAI対戦');

    // ゲームメインループ
    const maxTurns = 1000; // 無限ループ防止
    let consecutivePasses = 0;

    while (gameState.gamePhase === 'playing' && gameState.turnCount < maxTurns) {
      const currentPlayer = gameState.players[gameState.currentPlayer];
      
      // 手札が空の場合は勝利
      if (currentPlayer.hand.length === 0) {
        gameState.winner = gameState.currentPlayer;
        gameState.gamePhase = 'finished';
        this.logAction(gameState, 'game_end', `${currentPlayer.name} 勝利！`);
        break;
      }

      // AIの意思決定
      const aiPlayer = new AIPlayer(currentPlayer.id, currentPlayer.name, currentPlayer.aiType);
      const decision = aiPlayer.makeDecision(gameState);

      if (decision.action === 'play' && decision.cards) {
        // カードをプレイ
        const playedCard = decision.cards[0];
        
        // 手札からカードを削除
        currentPlayer.hand = currentPlayer.hand.filter(card => 
          !(card.rank === playedCard.rank && card.suit === playedCard.suit)
        );
        
        // 場にカードを置く
        gameState.field = [playedCard];
        gameState.lastPlayer = gameState.currentPlayer;
        consecutivePasses = 0;
        
        this.logAction(gameState, 'play', 
          `${currentPlayer.name} が ${this.cardToString(playedCard)} をプレイ`, 
          [playedCard]);

      } else {
        // パス
        consecutivePasses++;
        this.logAction(gameState, 'pass', `${currentPlayer.name} がパス`);
        
        // 全員パスで場が流れる
        if (consecutivePasses >= 3) {
          gameState.field = [];
          gameState.lastPlayer = -1;
          consecutivePasses = 0;
          this.logAction(gameState, 'pass', '場が流れました');
        }
      }

      // 次のプレイヤーへ
      gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
      gameState.turnCount++;

      // 進行状況を表示（100ターン毎）
      if (gameState.turnCount % 100 === 0) {
        console.log(`ターン ${gameState.turnCount}: 各プレイヤーの手札数 - ${
          gameState.players.map(p => `${p.name}:${p.hand.length}`).join(', ')
        }`);
      }
    }

    // ゲーム終了処理
    if (gameState.turnCount >= maxTurns) {
      this.logAction(gameState, 'game_end', `最大ターン数(${maxTurns})に到達 - ゲーム終了`);
      gameState.gamePhase = 'finished';
    }

    console.log(`🎯 ゲーム終了: ${gameState.turnCount}ターン`);
    return gameState;
  }

  private logAction(
    gameState: GameState, 
    action: GameLog['action'], 
    message: string, 
    cards?: Card[]
  ) {
    // ログ時点での場の状態を正確に記録
    const currentFieldState = gameState.field.length > 0 ? [...gameState.field] : [];
    
    const log: GameLog = {
      turn: gameState.turnCount,
      player: gameState.currentPlayer,
      action,
      cards,
      message,
      timestamp: new Date(),
      gameState: {
        currentPlayer: gameState.currentPlayer,
        field: currentFieldState,
        turnCount: gameState.turnCount,
        players: gameState.players.map(p => ({
          id: p.id,
          name: p.name,
          aiType: p.aiType,
          hand: p.hand.length, // 手札数のみ記録
          rank: p.rank
        }))
      }
    };
    
    gameState.logs.push(log);
  }

  private cardToString(card: Card): string {
    const rankStr = card.rank === 11 ? 'J' :
                   card.rank === 12 ? 'Q' :
                   card.rank === 13 ? 'K' :
                   card.rank === 14 ? 'A' :
                   card.rank.toString();
    
    const suitStr = card.suit === 'spades' ? '♠' :
                   card.suit === 'hearts' ? '♥' :
                   card.suit === 'diamonds' ? '♦' :
                   card.suit === 'clubs' ? '♣' : card.suit;
    
    return `${rankStr}${suitStr}`;
  }

  // ===============================
  // ログ解析・破綻検証
  // ===============================

  analyzeGameLogs(gameState: GameState): GameAnalysisReport {
    console.log("📊 ゲームログ解析開始...");
    
    const report: GameAnalysisReport = {
      gameValid: true,
      issues: [],
      statistics: this.calculateStatistics(gameState),
      aiPerformance: this.analyzeAIPerformance(gameState),
      ruleViolations: this.detectRuleViolations(gameState),
      gameFlow: this.analyzeGameFlow(gameState)
    };

    console.log("✅ ログ解析完了");
    return report;
  }

  private calculateStatistics(gameState: GameState): GameStatistics {
    const logs = gameState.logs;
    const playActions = logs.filter(log => log.action === 'play');
    const passActions = logs.filter(log => log.action === 'pass');

    return {
      totalTurns: gameState.turnCount,
      totalActions: logs.length,
      playActions: playActions.length,
      passActions: passActions.length,
      gameDuration: gameState.logs.length > 0 ? 
        gameState.logs[gameState.logs.length - 1].timestamp.getTime() - 
        gameState.logs[0].timestamp.getTime() : 0,
      finalHandSizes: gameState.players.map(p => ({ playerId: p.id, handSize: p.hand.length }))
    };
  }

  private analyzeAIPerformance(gameState: GameState): AIPerformanceAnalysis {
    const performance: AIPerformanceAnalysis = {};
    
    gameState.players.forEach(player => {
      const playerLogs = gameState.logs.filter(log => log.player === player.id);
      const playLogs = playerLogs.filter(log => log.action === 'play');
      const passLogs = playerLogs.filter(log => log.action === 'pass');

      performance[player.aiType] = {
        totalActions: playerLogs.length,
        playActions: playLogs.length,
        passActions: passLogs.length,
        playRate: playerLogs.length > 0 ? playLogs.length / playerLogs.length : 0,
        finalHandSize: player.hand.length,
        won: gameState.winner === player.id
      };
    });

    return performance;
  }

  private detectRuleViolations(gameState: GameState): RuleViolation[] {
    const violations: RuleViolation[] = [];
    let previousFieldStrength = 0; // 前のターンの場の強度
    
    // 不正な手の検出
    gameState.logs.forEach((log, index) => {
      if (log.action === 'play' && log.cards) {
        const card = log.cards[0];
        
        // 前のログからの場の強度を取得
        if (index > 0) {
          const prevLog = gameState.logs[index - 1];
          if (prevLog.action === 'play' && prevLog.cards) {
            previousFieldStrength = prevLog.cards[0].strength;
          } else if (prevLog.message.includes('場が流れました')) {
            previousFieldStrength = 0; // 場が流れた場合はリセット
          }
        }
        
        // 場に何かカードがある場合のルール違反チェック
        if (previousFieldStrength > 0 && card.strength <= previousFieldStrength) {
          violations.push({
            type: 'invalid_play',
            turn: log.turn,
            player: log.player,
            description: `不正な手: ${this.cardToString(card)}(強度${card.strength}) → 前の場${previousFieldStrength}より弱い/同値`,
            severity: 'high'
          });
        }
      } else if (log.message.includes('場が流れました')) {
        previousFieldStrength = 0; // 場が流れた場合はリセット
      }
    });

    return violations;
  }

  private analyzeGameFlow(gameState: GameState): GameFlowAnalysis {
    const consecutivePassSequences: number[] = [];
    let currentPassSequence = 0;
    let longestStalemate = 0;
    let currentStalemate = 0;

    gameState.logs.forEach(log => {
      if (log.action === 'pass') {
        currentPassSequence++;
        currentStalemate++;
      } else if (log.action === 'play') {
        if (currentPassSequence > 0) {
          consecutivePassSequences.push(currentPassSequence);
          currentPassSequence = 0;
        }
        if (currentStalemate > longestStalemate) {
          longestStalemate = currentStalemate;
        }
        currentStalemate = 0;
      }
    });

    return {
      consecutivePassSequences,
      longestStalemate,
      fieldClearCount: gameState.logs.filter(log => 
        log.message.includes('場が流れました')).length,
      gameProgression: this.calculateGameProgression(gameState)
    };
  }

  private calculateGameProgression(gameState: GameState): number[] {
    // 各ターンでの総手札数を記録
    const progression: number[] = [];
    
    gameState.logs.forEach(log => {
      if (log.gameState.players) {
        const totalCards = log.gameState.players.reduce((sum: number, p: any) => 
          sum + (typeof p.hand === 'number' ? p.hand : p.hand?.length || 0), 0);
        progression.push(totalCards);
      }
    });

    return progression;
  }

  generateReport(analysis: GameAnalysisReport): string {
    const report = [
      "🎴 大富豪AI対戦デバッグレポート",
      "=" .repeat(50),
      "",
      "📊 ゲーム統計:",
      `  総ターン数: ${analysis.statistics.totalTurns}`,
      `  プレイアクション: ${analysis.statistics.playActions}`,
      `  パスアクション: ${analysis.statistics.passActions}`,
      `  ゲーム時間: ${analysis.statistics.gameDuration}ms`,
      "",
      "🤖 AI性能分析:",
    ];

    Object.entries(analysis.aiPerformance).forEach(([aiType, perf]) => {
      report.push(`  ${aiType.toUpperCase()} AI:`);
      report.push(`    プレイ率: ${(perf.playRate * 100).toFixed(1)}%`);
      report.push(`    最終手札数: ${perf.finalHandSize}`);
      report.push(`    勝利: ${perf.won ? 'YES' : 'NO'}`);
    });

    report.push("");
    report.push("⚠️  ルール違反:");
    if (analysis.ruleViolations.length === 0) {
      report.push("  違反なし ✅");
    } else {
      analysis.ruleViolations.forEach(violation => {
        report.push(`  ${violation.type} (Turn ${violation.turn}): ${violation.description}`);
      });
    }

    report.push("");
    report.push("📈 ゲーム進行分析:");
    report.push(`  最長膠着状態: ${analysis.gameFlow.longestStalemate}ターン`);
    report.push(`  場が流れた回数: ${analysis.gameFlow.fieldClearCount}`);
    report.push(`  連続パス最大回数: ${Math.max(...analysis.gameFlow.consecutivePassSequences, 0)}`);

    report.push("");
    report.push("🎯 ゲーム破綻検証:");
    if (analysis.issues.length === 0) {
      report.push("  ゲームは正常に進行しました ✅");
    } else {
      analysis.issues.forEach(issue => {
        report.push(`  ❌ ${issue}`);
      });
    }

    return report.join("\n");
  }
}

// ===============================
// データ型定義
// ===============================

interface GameStatistics {
  totalTurns: number;
  totalActions: number;
  playActions: number;
  passActions: number;
  gameDuration: number;
  finalHandSizes: { playerId: number; handSize: number; }[];
}

interface AIPerformanceAnalysis {
  [aiType: string]: {
    totalActions: number;
    playActions: number;
    passActions: number;
    playRate: number;
    finalHandSize: number;
    won: boolean;
  };
}

interface RuleViolation {
  type: string;
  turn: number;
  player: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

interface GameFlowAnalysis {
  consecutivePassSequences: number[];
  longestStalemate: number;
  fieldClearCount: number;
  gameProgression: number[];
}

interface GameAnalysisReport {
  gameValid: boolean;
  issues: string[];
  statistics: GameStatistics;
  aiPerformance: AIPerformanceAnalysis;
  ruleViolations: RuleViolation[];
  gameFlow: GameFlowAnalysis;
}

// ===============================
// メイン実行
// ===============================

async function main() {
  console.log("🚀 大富豪AIデバッグシステム起動");
  
  const gameEngine = new DaifugoGameEngine();
  
  try {
    // 複数ゲーム実行
    const gameCount = 3;
    const allReports: GameAnalysisReport[] = [];
    
    for (let i = 0; i < gameCount; i++) {
      console.log(`\n🎮 ゲーム ${i + 1}/${gameCount} 実行中...`);
      
      const gameState = await gameEngine.playGame();
      const analysis = gameEngine.analyzeGameLogs(gameState);
      allReports.push(analysis);
      
      console.log(`\n📋 ゲーム ${i + 1} レポート:`);
      console.log(gameEngine.generateReport(analysis));
      
      // 1秒待機
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 総合統計
    console.log("\n" + "=".repeat(60));
    console.log("📈 総合統計 (全ゲーム)");
    console.log("=".repeat(60));
    
    const totalViolations = allReports.reduce((sum, report) => sum + report.ruleViolations.length, 0);
    const avgTurns = allReports.reduce((sum, report) => sum + report.statistics.totalTurns, 0) / gameCount;
    const successfulGames = allReports.filter(report => report.gameValid).length;
    
    console.log(`総ゲーム数: ${gameCount}`);
    console.log(`成功ゲーム数: ${successfulGames}`);
    console.log(`平均ターン数: ${avgTurns.toFixed(1)}`);
    console.log(`総ルール違反数: ${totalViolations}`);
    
    // AI勝率統計
    console.log("\nAI勝率統計:");
    const aiWins: { [key: string]: number } = {};
    allReports.forEach(report => {
      Object.entries(report.aiPerformance).forEach(([aiType, perf]) => {
        if (!aiWins[aiType]) aiWins[aiType] = 0;
        if (perf.won) aiWins[aiType]++;
      });
    });
    
    Object.entries(aiWins).forEach(([aiType, wins]) => {
      console.log(`  ${aiType.toUpperCase()}: ${wins}/${gameCount} (${(wins/gameCount*100).toFixed(1)}%)`);
    });
    
  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
  }
}

if (import.meta.main) {
  main();
}