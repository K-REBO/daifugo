// main.ts - Deno Lisp Interpreter メインエントリーポイント

import { SExpressionParser } from "./parser/s-expression-parser.ts";
import { BasicEvaluator } from "./evaluator/basic-evaluator.ts";
import { SymbolTable } from "./core/symbol-table.ts";
import { StructSystem } from "./core/struct-system.ts";
import { PackageSystem } from "./core/package-system.ts";
import { FileLoader } from "./core/file-loader.ts";

/**
 * Deno Lisp Interpreter メインクラス
 */
class DenoLispInterpreter {
  private parser: SExpressionParser;
  private evaluator: BasicEvaluator;
  private symbolTable: SymbolTable;
  private structSystem: StructSystem;
  private packageSystem: PackageSystem;
  private fileLoader: FileLoader;

  constructor() {
    // 各システムの初期化
    this.parser = new SExpressionParser();
    this.evaluator = new BasicEvaluator();
    this.symbolTable = new SymbolTable();
    this.structSystem = new StructSystem();
    this.packageSystem = new PackageSystem();
    this.fileLoader = new FileLoader();

    // システム統合
    this.integrateAllSystems();
  }

  /**
   * 全システムを統合
   */
  private integrateAllSystems(): void {
    console.log("🔧 Initializing Deno Lisp Interpreter...");
    
    // 各システムを評価器に統合
    this.evaluator.setStructSystem(this.structSystem);
    this.structSystem.integrateWithEvaluator(this.evaluator);
    this.packageSystem.integrateWithEvaluator(this.evaluator);
    this.fileLoader.integrateWithEvaluator(this.evaluator);
    
    console.log("✅ All systems integrated successfully");
  }

  /**
   * Lispファイルを実行
   */
  async executeFile(filePath: string): Promise<void> {
    try {
      console.log(`📖 Loading Lisp file: ${filePath}`);
      
      // ファイルの存在確認
      try {
        const fileInfo = await Deno.stat(filePath);
        console.log(`📄 File size: ${fileInfo.size} bytes`);
      } catch (error) {
        throw new Error(`File not found: ${filePath}`);
      }

      // ファイルを読み込んで評価
      const results = await this.fileLoader.evaluateFile(filePath, this.evaluator);
      
      console.log(`✅ File executed successfully`);
      console.log(`📊 Evaluated ${results.length} expressions`);
      
      // 結果の表示
      this.displayResults(results);
      
      // システム統計の表示
      this.displaySystemStatistics();
      
    } catch (error) {
      console.error(`❌ Error executing file: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 式を直接評価
   */
  evaluateExpression(expression: string): any {
    try {
      console.log(`🔍 Evaluating: ${expression}`);
      const parsed = this.parser.parse(expression);
      let result: any;
      for (const expr of parsed) {
        result = this.evaluator.evaluate(expr);
      }
      console.log(`📤 Result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      console.error(`❌ Error evaluating expression: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * インタラクティブREPLモード
   */
  async startREPL(): Promise<void> {
    console.log("\n🎮 Starting Deno Lisp REPL");
    console.log("Type 'exit' to quit, 'help' for commands");
    
    while (true) {
      try {
        const input = prompt("lisp> ");
        
        if (!input) continue;
        
        const trimmed = input.trim();
        
        if (trimmed === "exit") {
          console.log("👋 Goodbye!");
          break;
        }
        
        if (trimmed === "help") {
          this.showHelp();
          continue;
        }
        
        if (trimmed.startsWith("load ")) {
          const filePath = trimmed.substring(5).trim();
          await this.executeFile(filePath);
          continue;
        }
        
        if (trimmed === "stats") {
          this.displaySystemStatistics();
          continue;
        }
        
        // 式を評価
        this.evaluateExpression(trimmed);
        
      } catch (error) {
        console.error(`❌ REPL Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * ヘルプ情報を表示
   */
  private showHelp(): void {
    console.log(`
📚 Deno Lisp Interpreter Commands:
  exit           - Exit the REPL
  help           - Show this help message
  load <file>    - Load and execute a Lisp file
  stats          - Show system statistics
  
🔧 Lisp Functions Available:
  Basic: +, -, *, /, =, <, >, <=, >=
  Control: if, cond, let, defun
  Structs: defstruct, make-*, *-p
  Packages: defpackage, in-package
  Files: load
  
📖 Example usage:
  (+ 1 2 3)
  (defun hello (name) (list "Hello" name))
  (hello "World")
    `);
  }

  /**
   * 実行結果を表示
   */
  private displayResults(results: any[]): void {
    console.log("\n📋 Execution Results:");
    results.forEach((result, index) => {
      console.log(`  [${index + 1}] ${JSON.stringify(result)}`);
    });
  }

  /**
   * システム統計を表示
   */
  private displaySystemStatistics(): void {
    console.log("\n📊 System Statistics:");
    
    // パッケージシステムの統計
    const packageStats = this.packageSystem.getStatistics();
    console.log(`  📦 Packages: ${packageStats.totalPackages}`);
    console.log(`  🏷️  Symbols: ${packageStats.totalSymbols}`);
    console.log(`  📤 Exported: ${packageStats.totalExportedSymbols}`);
    console.log(`  🎯 Current Package: ${packageStats.currentPackage}`);
    
    // 構造体システムの統計
    const structStats = this.structSystem.getStatistics();
    console.log(`  🏗️  Structs: ${structStats.totalStructs}`);
    console.log(`  🏭 Constructors: ${structStats.totalConstructors}`);
    console.log(`  🔍 Accessors: ${structStats.totalAccessors}`);
    console.log(`  ❓ Predicates: ${structStats.totalPredicates}`);
    
    // ファイルローダーの統計
    const fileStats = this.fileLoader.getStatistics();
    console.log(`  📁 Loaded Files: ${fileStats.loadedFiles}`);
    fileStats.totalFiles.forEach((file, index) => {
      console.log(`    [${index + 1}] ${file}`);
    });
  }
}

/**
 * メイン実行関数
 */
async function main(): Promise<void> {
  console.log("🚀 Deno Lisp Interpreter Starting...");
  
  const interpreter = new DenoLispInterpreter();
  
  // コマンドライン引数の処理
  const args = Deno.args;
  
  if (args.length === 0) {
    // 引数なし：REPLモードで開始
    await interpreter.startREPL();
  } else {
    // 引数あり：ファイルを実行
    const filePath = args[0];
    
    try {
      await interpreter.executeFile(filePath);
      console.log("\n🎉 Execution completed successfully!");
    } catch (error) {
      console.error(`\n💥 Execution failed: ${error instanceof Error ? error.message : String(error)}`);
      Deno.exit(1);
    }
  }
}

// メイン実行
if (import.meta.main) {
  main().catch((error) => {
    console.error("💥 Fatal error:", error);
    Deno.exit(1);
  });
}

export { DenoLispInterpreter };