// symbol-table.ts - シンボルテーブル実装

import { LispValue } from "../parser/s-expression-parser.ts";

// 前方宣言
export class Symbol {
  public readonly name: string;
  public readonly isKeyword: boolean;
  private _value: LispValue | Symbol | undefined;
  private _isDefined: boolean = false;

  constructor(name: string, isKeyword: boolean = false) {
    this.name = name;
    this.isKeyword = isKeyword;
    
    // キーワードは自己評価する
    if (isKeyword) {
      this._value = this;
      this._isDefined = true;
    }
  }

  setValue(value: LispValue | Symbol): void {
    this._value = value;
    this._isDefined = true;
  }

  getValue(): LispValue | Symbol {
    if (!this._isDefined) {
      throw new Error(`Undefined symbol: ${this.name}`);
    }
    return this._value!;
  }

  isDefined(): boolean {
    return this._isDefined;
  }

  toString(): string {
    return this.name;
  }

  toJSON(): any {
    return {
      type: "symbol",
      name: this.name,
      isKeyword: this.isKeyword,
      isDefined: this._isDefined
    };
  }
}


/**
 * シンボルテーブル
 */
export class SymbolTable {
  private symbols: Map<string, Symbol> = new Map();
  private keywordSymbols: Map<string, Symbol> = new Map();

  constructor() {
    // 特殊シンボルの初期化
    this.initializeSpecialSymbols();
  }

  /**
   * 特殊シンボルの初期化
   */
  private initializeSpecialSymbols(): void {
    // 論理値シンボル
    const tSymbol = new Symbol("t");
    const nilSymbol = new Symbol("nil");
    
    tSymbol.setValue(true);
    nilSymbol.setValue(null);
    
    this.symbols.set("t", tSymbol);
    this.symbols.set("nil", nilSymbol);
  }

  /**
   * シンボルをインターン
   */
  intern(name: string): Symbol {
    if (this.symbols.has(name)) {
      return this.symbols.get(name)!;
    }
    
    const symbol = new Symbol(name);
    this.symbols.set(name, symbol);
    return symbol;
  }

  /**
   * キーワードシンボルをインターン
   */
  internKeyword(name: string): Symbol {
    const keywordName = name.startsWith(":") ? name : `:${name}`;
    
    if (this.keywordSymbols.has(keywordName)) {
      return this.keywordSymbols.get(keywordName)!;
    }
    
    const keyword = new Symbol(keywordName, true);
    this.keywordSymbols.set(keywordName, keyword);
    return keyword;
  }

  /**
   * シンボルを検索
   */
  lookup(name: string): Symbol | null {
    return this.symbols.get(name) || null;
  }

  /**
   * キーワードシンボルを検索
   */
  lookupKeyword(name: string): Symbol | null {
    const keywordName = name.startsWith(":") ? name : `:${name}`;
    return this.keywordSymbols.get(keywordName) || null;
  }

  /**
   * シンボルに値を定義
   */
  define(symbol: Symbol, value: LispValue | Symbol): void {
    symbol.setValue(value);
  }

  /**
   * シンボルの値を取得
   */
  getValue(symbol: Symbol): LispValue | Symbol {
    return symbol.getValue();
  }

  /**
   * 名前でシンボルの値を取得
   */
  getValueByName(name: string): LispValue | Symbol {
    const symbol = this.lookup(name);
    if (!symbol) {
      throw new Error(`Symbol not found: ${name}`);
    }
    return symbol.getValue();
  }

  /**
   * 真偽値の判定
   */
  isTruthy(symbol: Symbol): boolean {
    try {
      const value = symbol.getValue();
      return value !== null && value !== false;
    } catch {
      return false;
    }
  }

  /**
   * シンボル数を取得
   */
  getSymbolCount(): number {
    return this.symbols.size;
  }

  /**
   * 全シンボルを取得
   */
  getAllSymbols(): Symbol[] {
    return Array.from(this.symbols.values());
  }

  /**
   * 全キーワードシンボルを取得
   */
  getAllKeywords(): Symbol[] {
    return Array.from(this.keywordSymbols.values());
  }

  /**
   * シンボルテーブルの統計情報
   */
  getStatistics(): {
    totalSymbols: number;
    definedSymbols: number;
    undefinedSymbols: number;
    keywords: number;
  } {
    const allSymbols = this.getAllSymbols();
    const definedCount = allSymbols.filter(s => s.isDefined()).length;
    
    return {
      totalSymbols: allSymbols.length,
      definedSymbols: definedCount,
      undefinedSymbols: allSymbols.length - definedCount,
      keywords: this.keywordSymbols.size
    };
  }

  /**
   * デバッグ用：シンボルテーブルの内容を出力
   */
  debug(): void {
    console.log("=== Symbol Table Debug ===");
    console.log("Regular Symbols:");
    for (const [name, symbol] of this.symbols) {
      const status = symbol.isDefined() ? "DEFINED" : "UNDEFINED";
      console.log(`  ${name}: ${status}`);
    }
    
    console.log("Keyword Symbols:");
    for (const [name, symbol] of this.keywordSymbols) {
      console.log(`  ${name}: KEYWORD`);
    }
    
    const stats = this.getStatistics();
    console.log(`Statistics: ${stats.totalSymbols} total, ${stats.definedSymbols} defined, ${stats.keywords} keywords`);
  }

  /**
   * パッケージ修飾シンボルの処理
   */
  parsePackageSymbol(name: string): { packageName: string | null; symbolName: string } {
    const colonIndex = name.indexOf(":");
    if (colonIndex === -1) {
      return { packageName: null, symbolName: name };
    }
    
    return {
      packageName: name.substring(0, colonIndex),
      symbolName: name.substring(colonIndex + 1)
    };
  }

  /**
   * パッケージ修飾シンボルのインターン
   */
  internPackageSymbol(packageName: string, symbolName: string): Symbol {
    const fullName = `${packageName}:${symbolName}`;
    return this.intern(fullName);
  }

  /**
   * シンボルテーブルのクリア（テスト用）
   */
  clear(): void {
    this.symbols.clear();
    this.keywordSymbols.clear();
    this.initializeSpecialSymbols();
  }
}