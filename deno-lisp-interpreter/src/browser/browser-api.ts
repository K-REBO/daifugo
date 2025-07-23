// browser-api.ts - ブラウザ用API

import { BasicEvaluator } from "../evaluator/basic-evaluator.ts";
import { SExpressionParser } from "../parser/s-expression-parser.ts";

/**
 * ブラウザ用Daifugo Lispインタープリター
 */
export class DaifugoBrowserAPI {
  private evaluator: BasicEvaluator;
  private parser: SExpressionParser;
  private initialized: boolean = false;

  constructor() {
    this.evaluator = new BasicEvaluator();
    this.parser = new SExpressionParser();
  }

  /**
   * Daifugoエンジンを初期化
   */
  async initialize(): Promise<boolean> {
    try {
      this.initializePackage();
      this.defineStructures();
      this.defineCoreFunctions();
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error("Failed to initialize Daifugo engine:", error);
      return false;
    }
  }

  /**
   * パッケージ初期化
   */
  private initializePackage(): void {
    this.evaluator.evaluate(this.parser.parse("(defpackage :daifugo-browser (:use :common-lisp))"));
    this.evaluator.evaluate(this.parser.parse("(in-package :daifugo-browser)"));
  }

  /**
   * 基本構造体定義
   */
  private defineStructures(): void {
    const structures = [
      "(defstruct card rank suit strength)",
      "(defstruct game-state players current-player field deck)",
      "(defstruct rule-set name enabled-rules)"
    ];
    
    structures.forEach(structure => {
      this.evaluator.evaluate(this.parser.parse(structure));
    });
  }

  /**
   * コア関数定義
   */  
  private defineCoreFunctions(): void {
    const functions = [
      `(defun create-game (player-count)
         (make-game-state 
           :players (make-list player-count)
           :current-player 0
           :field nil
           :deck nil))`,
      
      `(defun create-card (rank suit strength)
         (make-card :rank rank :suit suit :strength strength))`,
      
      `(defun get-game-info (game-state)
         (list 
           (game-state-players game-state)
           (game-state-current-player game-state)
           (game-state-field game-state)))`
    ];
    
    functions.forEach(func => {
      this.evaluator.evaluate(this.parser.parse(func));
    });
  }

  /**
   * Lisp式を評価
   */
  evaluate(expression: string): any {
    if (!this.initialized) {
      throw new Error("DaifugoBrowserAPI not initialized. Call initialize() first.");
    }
    
    try {
      const parsed = this.parser.parse(expression);
      return this.evaluator.evaluate(parsed);
    } catch (error) {
      throw new Error(`Evaluation error: ${error.message}`);
    }
  }

  /**
   * ゲーム作成
   */
  createGame(playerCount: number): any {
    return this.evaluate(`(create-game ${playerCount})`);
  }

  /**
   * カード作成
   */
  createCard(rank: string, suit: string, strength: number): any {
    return this.evaluate(`(create-card '${rank} :${suit} ${strength})`);
  }

  /**
   * ゲーム情報取得
   */
  getGameInfo(gameState: any): any {
    // gameStateを一時変数に設定してから取得
    this.evaluator.evaluate(this.parser.parse(`(defvar *temp-game* '${JSON.stringify(gameState)})`));
    return this.evaluate("(get-game-info *temp-game*)");
  }

  /**
   * 初期化状態確認
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * ブラウザ対応チェック
   */
  static isBrowserSupported(): boolean {
    return typeof window !== "undefined" && typeof document !== "undefined";
  }
}

// グローバルAPIとしてエクスポート（ブラウザ用）
if (typeof window !== "undefined") {
  (window as any).DaifugoBrowserAPI = DaifugoBrowserAPI;
}