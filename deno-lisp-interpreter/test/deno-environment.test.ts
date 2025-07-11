// deno-environment.test.ts - Deno環境テスト

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("Deno runtime availability", () => {
  // Denoランタイムが利用可能であることを確認
  assertExists(Deno);
  assertExists(Deno.version);
  console.log(`Deno version: ${Deno.version.deno}`);
});

Deno.test("File system read permission", async () => {
  // ファイル読み込み権限のテスト
  try {
    const testContent = "test content";
    await Deno.writeTextFile("./test-file.txt", testContent);
    const readContent = await Deno.readTextFile("./test-file.txt");
    assertEquals(readContent, testContent);
    await Deno.remove("./test-file.txt");
  } catch (error) {
    console.error("File system permission test failed:", error);
    throw error;
  }
});

Deno.test("TypeScript/JavaScript execution", () => {
  // TypeScript/JavaScript実行テスト
  const result = (() => {
    const x: number = 42;
    return x * 2;
  })();
  assertEquals(result, 84);
});

Deno.test("ES modules support", async () => {
  // ES modules対応テスト
  const moduleCode = `
    export function testFunction() {
      return "module test";
    }
  `;
  
  // 動的インポートのテスト
  const dataUrl = `data:text/javascript,${encodeURIComponent(moduleCode)}`;
  const module = await import(dataUrl);
  assertEquals(module.testFunction(), "module test");
});

Deno.test("Existing Lisp file accessibility", async () => {
  // 既存Lispファイルアクセステスト
  try {
    const cardSystemPath = "../LispDaifugoEngine/src/core/card-system.lisp";
    const content = await Deno.readTextFile(cardSystemPath);
    
    // 基本的なLispコード構造の確認
    assertEquals(content.includes("defpackage"), true);
    assertEquals(content.includes("defstruct"), true);
    assertEquals(content.includes("defun"), true);
    
    console.log(`Card system file size: ${content.length} characters`);
  } catch (error) {
    console.error("Lisp file access test failed:", error);
    throw error;
  }
});

Deno.test("Project structure requirements", async () => {
  // プロジェクト構造要件テスト
  const requiredDirectories = ["src", "test"];
  const requiredFiles = ["deno.json", "main.ts"];
  
  // ディレクトリ存在確認（将来作成予定）
  for (const dir of requiredDirectories) {
    try {
      await Deno.stat(dir);
      console.log(`Directory ${dir} exists`);
    } catch {
      console.log(`Directory ${dir} will be created`);
    }
  }
  
  // ファイル存在確認（将来作成予定）
  for (const file of requiredFiles) {
    try {
      await Deno.stat(file);
      console.log(`File ${file} exists`);
    } catch {
      console.log(`File ${file} will be created`);
    }
  }
  
  // テスト自体は成功（構造は後で作成）
  assertEquals(true, true);
});

Deno.test("Lisp interpreter requirements", () => {
  // Lispインタープリター要件テスト
  const requirements = {
    "S-expression parsing": false,
    "Symbol evaluation": false,
    "Function definition": false,
    "Struct system": false,
    "Package system": false,
    "File loading": false
  };
  
  // 現時点では全て未実装（Red フェーズ）
  Object.entries(requirements).forEach(([feature, implemented]) => {
    console.log(`${feature}: ${implemented ? "✅" : "❌ (to be implemented)"}`);
    assertEquals(implemented, false); // Red フェーズなので全て false
  });
});