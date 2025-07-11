// main.ts - Deno Lisp Interpreter Entry Point

import { join } from "@std/path";

/**
 * Deno Lisp Interpreter
 * 既存のLispDaifugoEngineコードをJavaScript環境で実行するためのインタープリター
 */

class DenoLispInterpreter {
  private version = "0.1.0";
  
  constructor() {
    console.log(`Deno Lisp Interpreter v${this.version}`);
    console.log(`Running on Deno ${Deno.version.deno}`);
  }

  /**
   * Lispファイルを読み込んで実行（将来実装）
   */
  async loadFile(filePath: string): Promise<void> {
    try {
      const absolutePath = join(Deno.cwd(), filePath);
      const content = await Deno.readTextFile(absolutePath);
      
      console.log(`Loading Lisp file: ${filePath}`);
      console.log(`File size: ${content.length} characters`);
      
      // 基本的なLisp構造の検証
      const hasDefpackage = content.includes("defpackage");
      const hasDefstruct = content.includes("defstruct");
      const hasDefun = content.includes("defun");
      
      console.log("Lisp structure analysis:");
      console.log(`  defpackage: ${hasDefpackage ? "✅" : "❌"}`);
      console.log(`  defstruct: ${hasDefstruct ? "✅" : "❌"}`);
      console.log(`  defun: ${hasDefun ? "✅" : "❌"}`);
      
      // TODO: 実際のLisp解析・実行はPhase 2以降で実装
      console.log("⚠️  Actual Lisp execution not yet implemented");
      
    } catch (error) {
      console.error(`Error loading file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * インタープリターの状態表示
   */
  showStatus(): void {
    console.log("\n=== Deno Lisp Interpreter Status ===");
    console.log(`Version: ${this.version}`);
    console.log(`Deno: ${Deno.version.deno}`);
    console.log(`TypeScript: ${Deno.version.typescript}`);
    console.log(`V8: ${Deno.version.v8}`);
    
    console.log("\nImplemented features:");
    console.log("  ❌ S-expression parsing");
    console.log("  ❌ Symbol evaluation");
    console.log("  ❌ Function definition (defun)");
    console.log("  ❌ Struct system (defstruct)");
    console.log("  ❌ Package system (defpackage)");
    console.log("  ✅ File loading");
    
    console.log("\nTarget Lisp files:");
    console.log("  - LispDaifugoEngine/src/core/card-system.lisp");
    console.log("  - LispDaifugoEngine/src/core/game-engine.lisp");
    console.log("  - LispDaifugoEngine/src/rules/*.lisp");
  }
}

/**
 * メイン実行関数
 */
async function main(): Promise<void> {
  const interpreter = new DenoLispInterpreter();
  
  // コマンドライン引数処理
  const args = Deno.args;
  
  if (args.length === 0) {
    // 引数がない場合はステータス表示
    interpreter.showStatus();
  } else {
    // ファイルパスが指定された場合は読み込み
    const filePath = args[0];
    await interpreter.loadFile(filePath);
  }
}

// スクリプトとして実行された場合のみmain()を呼び出し
if (import.meta.main) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    Deno.exit(1);
  });
}

export { DenoLispInterpreter };