// package-system.ts - パッケージシステム実装

import { LispValue } from "../parser/s-expression-parser.ts";
import { Symbol, SymbolTable } from "./symbol-table.ts";
import { BasicEvaluator } from "../evaluator/basic-evaluator.ts";

/**
 * パッケージ定義
 */
export class Package {
  public readonly name: string;
  public readonly useList: string[];
  private symbols: Map<string, Symbol> = new Map();
  private exportedSymbols: Set<string> = new Set();
  private shadowedSymbols: Set<string> = new Set();

  constructor(name: string, useList: string[] = []) {
    this.name = name;
    this.useList = [...useList];
  }

  /**
   * シンボルを追加
   */
  addSymbol(symbol: Symbol): void {
    this.symbols.set(symbol.name, symbol);
  }

  /**
   * シンボルを取得
   */
  getSymbol(name: string): Symbol | null {
    return this.symbols.get(name) || null;
  }

  /**
   * シンボルが存在するかチェック
   */
  hasSymbol(name: string): boolean {
    return this.symbols.has(name);
  }

  /**
   * シンボルをエクスポート
   */
  exportSymbol(name: string): void {
    if (this.hasSymbol(name)) {
      this.exportedSymbols.add(name);
    }
  }

  /**
   * シンボルがエクスポートされているかチェック
   */
  isExported(name: string): boolean {
    return this.exportedSymbols.has(name);
  }

  /**
   * 全シンボルを取得
   */
  getAllSymbols(): Symbol[] {
    return Array.from(this.symbols.values());
  }

  /**
   * エクスポートされたシンボルを取得
   */
  getExportedSymbols(): Symbol[] {
    return Array.from(this.exportedSymbols)
      .map(name => this.symbols.get(name))
      .filter(symbol => symbol !== undefined) as Symbol[];
  }

  /**
   * 統計情報を取得
   */
  getStatistics(): {
    totalSymbols: number;
    exportedSymbols: number;
    shadowedSymbols: number;
    usedPackages: number;
  } {
    return {
      totalSymbols: this.symbols.size,
      exportedSymbols: this.exportedSymbols.size,
      shadowedSymbols: this.shadowedSymbols.size,
      usedPackages: this.useList.length
    };
  }
}

/**
 * パッケージシステム
 */
export class PackageSystem {
  private packages: Map<string, Package> = new Map();
  private currentPackage: string = "common-lisp-user";

  constructor() {
    // デフォルトパッケージの初期化
    this.initializeDefaultPackages();
  }

  /**
   * デフォルトパッケージの初期化
   */
  private initializeDefaultPackages(): void {
    // common-lispパッケージ
    const commonLisp = new Package("common-lisp", []);
    this.packages.set("common-lisp", commonLisp);

    // common-lisp-userパッケージ
    const commonLispUser = new Package("common-lisp-user", ["common-lisp"]);
    this.packages.set("common-lisp-user", commonLispUser);

    // keywordパッケージ
    const keyword = new Package("keyword", []);
    this.packages.set("keyword", keyword);
  }

  /**
   * パッケージを定義
   */
  definePackage(name: string, useList: string[], symbolTable: SymbolTable): void {
    // 使用パッケージの存在チェック
    for (const usedPackage of useList) {
      if (!this.packages.has(usedPackage)) {
        throw new Error(`Package '${usedPackage}' not found`);
      }
    }

    // 循環依存チェック
    this.checkCircularDependency(name, useList);

    const pkg = new Package(name, useList);
    this.packages.set(name, pkg);
  }

  /**
   * 循環依存チェック
   */
  private checkCircularDependency(packageName: string, useList: string[]): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const checkCycle = (pkgName: string): boolean => {
      if (recursionStack.has(pkgName)) {
        return true; // 循環発見
      }
      if (visited.has(pkgName)) {
        return false; // 既に訪問済み
      }

      visited.add(pkgName);
      recursionStack.add(pkgName);

      // 現在のパッケージの依存関係をチェック
      const pkg = this.packages.get(pkgName);
      if (pkg) {
        for (const dep of pkg.useList) {
          if (checkCycle(dep)) {
            return true;
          }
        }
      }

      recursionStack.delete(pkgName);
      return false;
    };

    // 新しいパッケージから依存関係をチェック
    for (const usedPackage of useList) {
      if (checkCycle(usedPackage)) {
        throw new Error(`Circular dependency detected involving package '${packageName}'`);
      }
    }
  }

  /**
   * パッケージが定義されているかチェック
   */
  isPackageDefined(name: string): boolean {
    return this.packages.has(name);
  }

  /**
   * パッケージを取得
   */
  getPackage(name: string): Package {
    if (!this.packages.has(name)) {
      throw new Error(`Package '${name}' not found`);
    }
    return this.packages.get(name)!;
  }

  /**
   * 現在のパッケージを取得
   */
  getCurrentPackage(): string {
    return this.currentPackage;
  }

  /**
   * 現在のパッケージを設定
   */
  setCurrentPackage(name: string): void {
    if (!this.packages.has(name)) {
      throw new Error(`Package '${name}' not found`);
    }
    this.currentPackage = name;
  }

  /**
   * パッケージを使用
   */
  usePackage(packageName: string): void {
    const currentPkg = this.getPackage(this.currentPackage);
    if (!currentPkg.useList.includes(packageName)) {
      currentPkg.useList.push(packageName);
    }
  }

  /**
   * 修飾シンボルを解析
   */
  parseQualifiedSymbol(symbolName: string): { packageName: string | null; symbolName: string } {
    const colonIndex = symbolName.indexOf(":");
    if (colonIndex === -1) {
      return { packageName: null, symbolName };
    }

    const packageName = symbolName.substring(0, colonIndex);
    const symbol = symbolName.substring(colonIndex + 1);
    return { packageName, symbolName: symbol };
  }

  /**
   * 修飾シンボルをインターン
   */
  internQualifiedSymbol(qualifiedName: string, symbolTable: SymbolTable): Symbol {
    const { packageName, symbolName } = this.parseQualifiedSymbol(qualifiedName);
    
    if (packageName) {
      const pkg = this.getPackage(packageName);
      const fullSymbolName = `${packageName}:${symbolName}`;
      const symbol = symbolTable.intern(fullSymbolName);
      pkg.addSymbol(symbol);
      return symbol;
    } else {
      return this.internSymbol(symbolName, symbolTable);
    }
  }

  /**
   * 現在のパッケージでシンボルをインターン
   */
  internSymbol(symbolName: string, symbolTable: SymbolTable): Symbol {
    const currentPkg = this.getPackage(this.currentPackage);
    const fullSymbolName = this.currentPackage === "common-lisp-user" ? 
      symbolName : `${this.currentPackage}:${symbolName}`;
    
    const symbol = symbolTable.intern(fullSymbolName);
    currentPkg.addSymbol(symbol);
    return symbol;
  }

  /**
   * シンボルを検索
   */
  findSymbol(symbolName: string, symbolTable: SymbolTable): Symbol | null {
    const currentPkg = this.getPackage(this.currentPackage);
    
    // 現在のパッケージで検索
    if (currentPkg.hasSymbol(symbolName)) {
      return currentPkg.getSymbol(symbolName);
    }

    // 使用パッケージで検索
    for (const usedPackageName of currentPkg.useList) {
      const usedPkg = this.getPackage(usedPackageName);
      const qualifiedName = `${usedPackageName}:${symbolName}`;
      
      if (usedPkg.hasSymbol(qualifiedName) && usedPkg.isExported(qualifiedName)) {
        return usedPkg.getSymbol(qualifiedName);
      }
    }

    return null;
  }

  /**
   * シンボルをエクスポート
   */
  exportSymbol(symbolName: string): void {
    const currentPkg = this.getPackage(this.currentPackage);
    currentPkg.exportSymbol(symbolName);
  }

  /**
   * シンボルをインポート
   */
  importSymbol(symbolName: string, fromPackage: string, symbolTable: SymbolTable): Symbol | null {
    const sourcePkg = this.getPackage(fromPackage);
    const qualifiedName = `${fromPackage}:${symbolName}`;
    
    if (sourcePkg.hasSymbol(qualifiedName) && sourcePkg.isExported(qualifiedName)) {
      const symbol = sourcePkg.getSymbol(qualifiedName);
      const currentPkg = this.getPackage(this.currentPackage);
      
      // 現在のパッケージに非修飾名でシンボルを追加
      const localSymbol = symbolTable.intern(symbolName);
      localSymbol.setValue(symbol!.getValue());
      currentPkg.addSymbol(localSymbol);
      
      return localSymbol;
    }

    return null;
  }

  /**
   * パッケージ数を取得
   */
  getPackageCount(): number {
    return this.packages.size;
  }

  /**
   * 全パッケージを取得
   */
  getAllPackages(): Package[] {
    return Array.from(this.packages.values());
  }

  /**
   * 評価器との統合
   */
  integrateWithEvaluator(evaluator: BasicEvaluator): void {
    // defpackage特殊フォームを評価器に追加
    this.addDefpackageToEvaluator(evaluator);
    
    // in-package特殊フォームを評価器に追加
    this.addInPackageToEvaluator(evaluator);
  }

  /**
   * defpackage特殊フォームを評価器に追加
   */
  private addDefpackageToEvaluator(evaluator: BasicEvaluator): void {
    const originalEvaluate = evaluator.evaluate.bind(evaluator);
    
    evaluator.evaluate = (expr: LispValue, env?: any) => {
      if (Array.isArray(expr) && expr.length > 0) {
        const first = expr[0];
        if (typeof first === "object" && first !== null && "type" in first && 
            first.type === "symbol" && first.value === "defpackage") {
          return this.evaluateDefpackage(expr, evaluator);
        }
        if (typeof first === "object" && first !== null && "type" in first && 
            first.type === "symbol" && first.value === "in-package") {
          return this.evaluateInPackage(expr, evaluator);
        }
      }
      return originalEvaluate(expr, env);
    };
  }

  /**
   * in-package特殊フォームを評価器に追加
   */
  private addInPackageToEvaluator(evaluator: BasicEvaluator): void {
    // defpackageToEvaluatorで処理済み
  }

  /**
   * defpackage式を評価
   */
  private evaluateDefpackage(expr: LispValue[], evaluator: BasicEvaluator): LispValue {
    if (expr.length < 2) {
      throw new Error("defpackage requires at least a package name");
    }

    const nameExpr = expr[1];
    let packageName: string;

    // パッケージ名の抽出
    if (typeof nameExpr === "object" && nameExpr !== null && "type" in nameExpr && 
        nameExpr.type === "keyword") {
      packageName = nameExpr.value;
    } else if (typeof nameExpr === "object" && nameExpr !== null && "type" in nameExpr && 
               nameExpr.type === "symbol") {
      packageName = nameExpr.value;
    } else {
      throw new Error("defpackage name must be a symbol or keyword");
    }

    // 使用パッケージの抽出
    const useList: string[] = [];
    for (let i = 2; i < expr.length; i++) {
      const option = expr[i];
      if (Array.isArray(option) && option.length >= 2) {
        const optionName = option[0];
        if (typeof optionName === "object" && optionName !== null && "type" in optionName && 
            optionName.type === "keyword" && optionName.value === "use") {
          
          for (let j = 1; j < option.length; j++) {
            const usePackage = option[j];
            if (typeof usePackage === "object" && usePackage !== null && "type" in usePackage && 
                usePackage.type === "keyword") {
              useList.push(usePackage.value);
            }
          }
        }
      }
    }

    // パッケージを定義
    const symbolTable = new SymbolTable(); // 簡略化のため新規作成
    this.definePackage(packageName, useList, symbolTable);

    return { type: "symbol", value: packageName };
  }

  /**
   * in-package式を評価
   */
  private evaluateInPackage(expr: LispValue[], evaluator: BasicEvaluator): LispValue {
    if (expr.length !== 2) {
      throw new Error("in-package requires exactly one argument");
    }

    const nameExpr = expr[1];
    let packageName: string;

    // パッケージ名の抽出
    if (typeof nameExpr === "object" && nameExpr !== null && "type" in nameExpr && 
        nameExpr.type === "keyword") {
      packageName = nameExpr.value;
    } else if (typeof nameExpr === "object" && nameExpr !== null && "type" in nameExpr && 
               nameExpr.type === "symbol") {
      packageName = nameExpr.value;
    } else {
      throw new Error("in-package name must be a symbol or keyword");
    }

    // パッケージを切り替え
    this.setCurrentPackage(packageName);

    return { type: "symbol", value: packageName };
  }

  /**
   * 統計情報を取得
   */
  getStatistics(): {
    totalPackages: number;
    totalSymbols: number;
    totalExportedSymbols: number;
    currentPackage: string;
  } {
    let totalSymbols = 0;
    let totalExportedSymbols = 0;

    for (const pkg of this.packages.values()) {
      const stats = pkg.getStatistics();
      totalSymbols += stats.totalSymbols;
      totalExportedSymbols += stats.exportedSymbols;
    }

    return {
      totalPackages: this.packages.size,
      totalSymbols,
      totalExportedSymbols,
      currentPackage: this.currentPackage
    };
  }

  /**
   * デバッグ用：パッケージシステムの内容を出力
   */
  debug(): void {
    console.log("=== Package System Debug ===");
    console.log(`Current Package: ${this.currentPackage}`);
    
    for (const [name, pkg] of this.packages) {
      console.log(`Package: ${name}`);
      console.log(`  Use List: ${pkg.useList.join(", ")}`);
      console.log(`  Symbols: ${pkg.getAllSymbols().length}`);
      console.log(`  Exported: ${pkg.getExportedSymbols().length}`);
    }
    
    const stats = this.getStatistics();
    console.log(`Statistics: ${stats.totalPackages} packages, ${stats.totalSymbols} symbols, ${stats.totalExportedSymbols} exported`);
  }
}