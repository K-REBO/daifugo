// file-loader.ts - ファイルローダーシステム実装

import { LispValue } from "../parser/s-expression-parser.ts";
import { SExpressionParser } from "../parser/s-expression-parser.ts";
import { BasicEvaluator } from "../evaluator/basic-evaluator.ts";

/**
 * ファイルローダーシステム
 */
export class FileLoader {
  private parser: SExpressionParser;
  private loadedFiles: Set<string> = new Set();

  constructor() {
    this.parser = new SExpressionParser();
  }

  /**
   * ファイルを読み込む
   */
  async loadFile(filePath: string): Promise<string> {
    try {
      const content = await Deno.readTextFile(filePath);
      return content;
    } catch (error) {
      throw new Error(`Failed to load file '${filePath}': ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Lispファイルを読み込む（loadFileのエイリアス）
   */
  async loadLispFile(filePath: string): Promise<string> {
    return await this.loadFile(filePath);
  }

  /**
   * Lispファイルの内容を解析してS式のリストを取得
   */
  parseLispFile(content: string): LispValue[] {
    try {
      const expressions: LispValue[] = [];
      const lines = content.split('\n');
      let currentExpression = '';
      let parenDepth = 0;
      let inString = false;
      let escaped = false;

      for (const line of lines) {
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (escaped) {
            currentExpression += char;
            escaped = false;
            continue;
          }

          if (char === '\\') {
            escaped = true;
            currentExpression += char;
            continue;
          }

          if (char === '"') {
            inString = !inString;
            currentExpression += char;
            continue;
          }

          if (inString) {
            currentExpression += char;
            continue;
          }

          // コメントの処理（文字列内でない場合のみ）
          if (char === ';' && !inString) {
            // 行の残りをスキップ
            break;
          }

          if (char === '(') {
            parenDepth++;
            currentExpression += char;
          } else if (char === ')') {
            parenDepth--;
            currentExpression += char;
            
            // 完全なS式が完成した場合
            if (parenDepth === 0 && currentExpression.trim()) {
              try {
                const expr = this.parser.parse(currentExpression.trim());
                expressions.push(expr);
                currentExpression = '';
              } catch (e) {
                // パースエラーは無視して続行
                currentExpression = '';
              }
            }
          } else if (char.match(/\s/)) {
            // 空白文字の処理
            if (parenDepth > 0) {
              currentExpression += char;
            } else if (currentExpression.trim()) {
              // 括弧外の単独のトークン
              try {
                const expr = this.parser.parse(currentExpression.trim());
                expressions.push(expr);
                currentExpression = '';
              } catch (e) {
                // パースエラーは無視
                currentExpression = '';
              }
            }
          } else {
            currentExpression += char;
          }
        }

        // 行の終わりで改行を追加（文字列内でない場合、かつ括弧内の場合）
        if (!inString && parenDepth > 0) {
          currentExpression += '\n';
        }
      }

      // 残りの式を処理
      if (currentExpression.trim() && parenDepth === 0) {
        try {
          const expr = this.parser.parse(currentExpression.trim());
          expressions.push(expr);
        } catch (e) {
          // パースエラーは無視
        }
      }

      return expressions;
    } catch (error) {
      throw new Error(`Failed to parse Lisp file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * ファイルを読み込んで評価
   */
  async evaluateFile(filePath: string, evaluator: BasicEvaluator): Promise<LispValue[]> {
    try {
      const content = await this.loadFile(filePath);
      const expressions = this.parseLispFile(content);
      const results: LispValue[] = [];

      for (const expr of expressions) {
        try {
          // load呼び出しを処理
          if (await this.isLoadCall(expr)) {
            const loadResult = await this.handleLoadCall(expr, evaluator);
            results.push(loadResult);
          } else {
            const result = evaluator.evaluate(expr);
            results.push(result);
          }
        } catch (error) {
          // 評価エラーは記録して続行
          console.warn(`Evaluation error in ${filePath}:`, error instanceof Error ? error.message : String(error));
          results.push({ type: "symbol", value: "error" });
        }
      }

      // 読み込み済みファイルとして記録
      this.loadedFiles.add(filePath);
      
      return results;
    } catch (error) {
      throw new Error(`Failed to evaluate file '${filePath}': ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * load呼び出しかどうかを判定
   */
  private async isLoadCall(expr: LispValue): Promise<boolean> {
    if (Array.isArray(expr) && expr.length >= 2) {
      const first = expr[0];
      if (typeof first === "object" && first !== null && "type" in first && 
          first.type === "symbol" && first.value === "load") {
        return true;
      }
    }
    return false;
  }

  /**
   * load呼び出しを処理
   */
  private async handleLoadCall(expr: LispValue[], evaluator: BasicEvaluator): Promise<LispValue> {
    if (expr.length !== 2) {
      throw new Error("load requires exactly one argument");
    }

    const fileNameExpr = expr[1];
    let fileName: string;

    if (typeof fileNameExpr === "string") {
      fileName = fileNameExpr;
    } else if (typeof fileNameExpr === "object" && fileNameExpr !== null && "type" in fileNameExpr && 
               fileNameExpr.type === "string") {
      fileName = fileNameExpr.value;
    } else {
      throw new Error("load requires a string argument");
    }

    try {
      const results = await this.evaluateFile(fileName, evaluator);
      return results[results.length - 1] || { type: "symbol", value: "t" };
    } catch (error) {
      throw new Error(`load failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 評価器との統合
   */
  integrateWithEvaluator(evaluator: BasicEvaluator): void {
    // load関数を評価器に追加
    this.addLoadToEvaluator(evaluator);
    
    // require関数を評価器に追加
    this.addRequireToEvaluator(evaluator);
  }

  /**
   * load関数を評価器に追加
   */
  private addLoadToEvaluator(evaluator: BasicEvaluator): void {
    const loadFunction = async (filePath: string) => {
      if (typeof filePath !== 'string') {
        throw new Error('load requires a string argument');
      }
      
      try {
        const results = await this.evaluateFile(filePath, evaluator);
        return results[results.length - 1] || { type: "symbol", value: "t" };
      } catch (error) {
        throw new Error(`load failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    evaluator.defineSymbol('load', loadFunction);
  }

  /**
   * require関数を評価器に追加
   */
  private addRequireToEvaluator(evaluator: BasicEvaluator): void {
    const requireFunction = async (filePath: string) => {
      if (typeof filePath !== 'string') {
        throw new Error('require requires a string argument');
      }

      // 既に読み込み済みの場合はスキップ
      if (this.loadedFiles.has(filePath)) {
        return { type: "symbol", value: "t" };
      }

      try {
        const results = await this.evaluateFile(filePath, evaluator);
        return results[results.length - 1] || { type: "symbol", value: "t" };
      } catch (error) {
        throw new Error(`require failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    evaluator.defineSymbol('require', requireFunction);
  }

  /**
   * 読み込み済みファイルをクリア
   */
  clearLoadedFiles(): void {
    this.loadedFiles.clear();
  }

  /**
   * 読み込み済みファイルの取得
   */
  getLoadedFiles(): string[] {
    return Array.from(this.loadedFiles);
  }

  /**
   * ファイルが読み込み済みかチェック
   */
  isFileLoaded(filePath: string): boolean {
    return this.loadedFiles.has(filePath);
  }

  /**
   * 統計情報を取得
   */
  getStatistics(): {
    loadedFiles: number;
    totalFiles: string[];
  } {
    return {
      loadedFiles: this.loadedFiles.size,
      totalFiles: Array.from(this.loadedFiles)
    };
  }

  /**
   * デバッグ用：ファイルローダーの状態を出力
   */
  debug(): void {
    console.log("=== File Loader Debug ===");
    console.log(`Loaded Files: ${this.loadedFiles.size}`);
    for (const filePath of this.loadedFiles) {
      console.log(`  - ${filePath}`);
    }
  }
}