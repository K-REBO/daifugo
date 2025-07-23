// basic-evaluator.ts - 基本評価器実装

import { LispValue, LispSymbol, LispKeyword, LispQuote, LispFunction, LispBuiltin, SExpressionParser } from "../parser/s-expression-parser.ts";
import { SymbolTable, Symbol } from "../core/symbol-table.ts";
import { StructSystem } from "../core/struct-system.ts";
import { FileLoader } from "../core/file-loader.ts";
import { PackageSystem } from "../core/package-system.ts";

/**
 * 環境（変数と関数のスコープ）
 */
export class Environment {
  private bindings: Map<string, LispValue> = new Map();
  private parent: Environment | null = null;

  constructor(parent: Environment | null = null) {
    this.parent = parent;
  }

  /**
   * 変数を定義
   */
  define(name: string, value: LispValue): void {
    this.bindings.set(name, value);
  }

  /**
   * 変数を取得
   */
  get(name: string): LispValue {
    if (this.bindings.has(name)) {
      return this.bindings.get(name)!;
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    throw new Error(`Undefined variable: ${name}`);
  }

  /**
   * 変数が定義されているかチェック
   */
  has(name: string): boolean {
    return this.bindings.has(name) || (this.parent ? this.parent.has(name) : false);
  }
}


/**
 * 基本評価器
 */
export class BasicEvaluator {
  private globalEnv: Environment;
  private structSystem: StructSystem;
  private fileLoader: FileLoader;
  private packageSystem: PackageSystem;
  private symbolTable: SymbolTable;
  private gensymCounter: number = 0;
  private symbolCache: Map<string, LispValue> = new Map();

  constructor() {
    this.globalEnv = new Environment();
    this.symbolTable = new SymbolTable();
    this.structSystem = new StructSystem();
    this.packageSystem = new PackageSystem();
    this.fileLoader = new FileLoader();
    this.initializeBuiltins();
  }

  /**
   * StructSystemを設定
   */
  setStructSystem(structSystem: any): void {
    this.structSystem = structSystem;
  }

  /**
   * 組み込み関数の初期化
   */
  private initializeBuiltins(): void {
    // 算術演算
    this.globalEnv.define("+", { type: "builtin", name: "+", fn: this.add.bind(this) } as LispBuiltin);
    this.globalEnv.define("-", { type: "builtin", name: "-", fn: this.subtract.bind(this) } as LispBuiltin);
    this.globalEnv.define("*", { type: "builtin", name: "*", fn: this.multiply.bind(this) } as LispBuiltin);
    this.globalEnv.define("/", { type: "builtin", name: "/", fn: this.divide.bind(this) } as LispBuiltin);
    
    // 比較演算
    this.globalEnv.define(">", { type: "builtin", name: ">", fn: this.greaterThan.bind(this) } as LispBuiltin);
    this.globalEnv.define("<", { type: "builtin", name: "<", fn: this.lessThan.bind(this) } as LispBuiltin);
    this.globalEnv.define("=", { type: "builtin", name: "=", fn: this.equal.bind(this) } as LispBuiltin);
    this.globalEnv.define("<=", { type: "builtin", name: "<=", fn: this.lessThanOrEqual.bind(this) } as LispBuiltin);
    this.globalEnv.define(">=", { type: "builtin", name: ">=", fn: this.greaterThanOrEqual.bind(this) } as LispBuiltin);
    
    // 数学関数
    this.globalEnv.define("sqrt", { type: "builtin", name: "sqrt", fn: this.sqrt.bind(this) } as LispBuiltin);
    
    // リスト操作
    this.globalEnv.define("list", { type: "builtin", name: "list", fn: this.list.bind(this) } as LispBuiltin);
    
    // Lisp関数
    this.globalEnv.define("eql", { type: "builtin", name: "eql", fn: this.eql.bind(this) } as LispBuiltin);
    this.globalEnv.define("symbolp", { type: "builtin", name: "symbolp", fn: this.symbolp.bind(this) } as LispBuiltin);
    this.globalEnv.define("string=", { type: "builtin", name: "string=", fn: this.stringEqual.bind(this) } as LispBuiltin);
    this.globalEnv.define("symbol-name", { type: "builtin", name: "symbol-name", fn: this.symbolName.bind(this) } as LispBuiltin);
    this.globalEnv.define("make-hash-table", { type: "builtin", name: "make-hash-table", fn: this.makeHashTable.bind(this) } as LispBuiltin);
    this.globalEnv.define("gethash", { type: "builtin", name: "gethash", fn: this.gethash.bind(this) } as LispBuiltin);
    this.globalEnv.define("format", { type: "builtin", name: "format", fn: this.format.bind(this) } as LispBuiltin);
    this.globalEnv.define("funcall", { type: "builtin", name: "funcall", fn: this.funcall.bind(this) } as LispBuiltin);
    this.globalEnv.define("every", { type: "builtin", name: "every", fn: this.every.bind(this) } as LispBuiltin);
    this.globalEnv.define("mapcar", { type: "builtin", name: "mapcar", fn: this.mapcar.bind(this) } as LispBuiltin);
    this.globalEnv.define("some", { type: "builtin", name: "some", fn: this.some.bind(this) } as LispBuiltin);
    this.globalEnv.define("remove-if", { type: "builtin", name: "remove-if", fn: this.removeIf.bind(this) } as LispBuiltin);
    this.globalEnv.define("length", { type: "builtin", name: "length", fn: this.length.bind(this) } as LispBuiltin);
    this.globalEnv.define("count", { type: "builtin", name: "count", fn: this.count.bind(this) } as LispBuiltin);
    this.globalEnv.define("car", { type: "builtin", name: "car", fn: this.car.bind(this) } as LispBuiltin);
    this.globalEnv.define("cdr", { type: "builtin", name: "cdr", fn: this.cdr.bind(this) } as LispBuiltin);
    this.globalEnv.define("incf", { type: "builtin", name: "incf", fn: this.incf.bind(this) } as LispBuiltin);
    this.globalEnv.define("error", { type: "builtin", name: "error", fn: this.error.bind(this) } as LispBuiltin);
    
    // シンボル操作関数
    this.globalEnv.define("intern", { type: "builtin", name: "intern", fn: this.intern.bind(this) } as LispBuiltin);
    this.globalEnv.define("make-symbol", { type: "builtin", name: "make-symbol", fn: this.makeSymbol.bind(this) } as LispBuiltin);
    this.globalEnv.define("symbol-package", { type: "builtin", name: "symbol-package", fn: this.symbolPackage.bind(this) } as LispBuiltin);
    this.globalEnv.define("find-symbol", { type: "builtin", name: "find-symbol", fn: this.findSymbol.bind(this) } as LispBuiltin);
    this.globalEnv.define("gensym", { type: "builtin", name: "gensym", fn: this.gensym.bind(this) } as LispBuiltin);
    
    // ファイル操作関数
    this.globalEnv.define("load", { type: "builtin", name: "load", fn: this.load.bind(this) } as LispBuiltin);
    
    // リスト生成関数
    this.globalEnv.define("make-list", { type: "builtin", name: "make-list", fn: this.makeList.bind(this) } as LispBuiltin);
    
    // 論理値
    this.globalEnv.define("t", true);
    this.globalEnv.define("nil", null);
  }

  /**
   * シンボルを定義（テスト用）
   */
  defineSymbol(name: string, value: LispValue): void {
    this.globalEnv.define(name, value);
  }

  /**
   * 式を評価
   */
  evaluate(expr: LispValue, env: Environment = this.globalEnv): LispValue {
    // リテラル値
    if (typeof expr === "number" || typeof expr === "string") {
      return expr;
    }

    // シンボル
    if (this.isSymbol(expr)) {
      return env.get(expr.value);
    }

    // キーワード
    if (this.isKeyword(expr)) {
      return expr;
    }

    // クォート
    if (this.isQuote(expr)) {
      return expr.value;
    }

    // リスト（関数呼び出し）
    if (Array.isArray(expr)) {
      if (expr.length === 0) {
        return [];
      }

      const first = expr[0];
      
      // 特殊フォーム
      if (this.isSymbol(first)) {
        switch (first.value) {
          case "if":
            return this.evaluateIf(expr, env);
          case "cond":
            return this.evaluateCond(expr, env);
          case "when":
            return this.evaluateWhen(expr, env);
          case "unless":
            return this.evaluateUnless(expr, env);
          case "defun":
            return this.evaluateDefun(expr, env);
          case "defparameter":
            return this.evaluateDefparameter(expr, env);
          case "defvar":
            return this.evaluateDefvar(expr, env);
          case "let":
            return this.evaluateLet(expr, env);
          case "dolist":
            return this.evaluateDolist(expr, env);
          case "dotimes":
            return this.evaluateDotimes(expr, env);
          case "lambda":
            return this.evaluateLambda(expr, env);
          case "handler-case":
            return this.evaluateHandlerCase(expr, env);
          case "progn":
            return this.evaluateProgn(expr, env);
          case "quote":
            return expr[1];
          case "and":
            return this.evaluateAnd(expr, env);
          case "or":
            return this.evaluateOr(expr, env);
          case "setf":
            return this.evaluateSetf(expr, env);
          case "defstruct":
            return this.evaluateDefstruct(expr, env);
          case "defpackage":
            return this.evaluateDefpackage(expr, env);
          case "in-package":
            return this.evaluateInPackage(expr, env);
          case "defvar":
            return this.evaluateDefvar(expr, env);
          case "defun":
            return this.evaluateDefun(expr, env); 
          case "case":
            return this.evaluateCase(expr, env);
        }
      }

      // 関数呼び出し
      return this.evaluateFunctionCall(expr, env);
    }

    throw new Error(`Cannot evaluate expression: ${JSON.stringify(expr)}`);
  }

  /**
   * 型チェック関数
   */
  private isSymbol(value: LispValue): value is LispSymbol {
    return typeof value === "object" && value !== null && "type" in value && value.type === "symbol";
  }

  private isKeyword(value: LispValue): value is LispKeyword {
    return typeof value === "object" && value !== null && "type" in value && value.type === "keyword";
  }

  private isQuote(value: LispValue): value is LispQuote {
    return typeof value === "object" && value !== null && "type" in value && value.type === "quote";
  }

  private isFunction(value: LispValue): value is LispFunction {
    return typeof value === "object" && value !== null && "type" in value && value.type === "function";
  }

  private isBuiltin(value: LispValue): value is LispBuiltin {
    return typeof value === "object" && value !== null && "type" in value && value.type === "builtin";
  }

  /**
   * 関数呼び出しの評価
   */
  private evaluateFunctionCall(expr: LispValue[], env: Environment): LispValue {
    const func = this.evaluate(expr[0], env);
    const args = expr.slice(1);

    if (this.isBuiltin(func)) {
      const evaluatedArgs = args.map(arg => this.evaluate(arg, env));
      return func.fn(...evaluatedArgs);
    }

    if (this.isFunction(func)) {
      const evaluatedArgs = args.map(arg => this.evaluate(arg, env));
      return this.callUserFunction(func, evaluatedArgs);
    }

    throw new Error(`Not a function: ${JSON.stringify(func)}`);
  }

  /**
   * ユーザー定義関数の呼び出し
   */
  private callUserFunction(func: LispFunction, args: LispValue[]): LispValue {
    if (args.length !== func.params.length) {
      throw new Error(`Wrong number of arguments: expected ${func.params.length}, got ${args.length}`);
    }

    const newEnv = new Environment(func.closure);
    for (let i = 0; i < func.params.length; i++) {
      newEnv.define(func.params[i], args[i]);
    }

    // 関数本体の評価
    return this.evaluate(func.body, newEnv);
  }

  /**
   * if式の評価
   */
  private evaluateIf(expr: LispValue[], env: Environment): LispValue {
    if (expr.length < 3 || expr.length > 4) {
      throw new Error("if requires 2 or 3 arguments");
    }

    const condition = this.evaluate(expr[1], env);
    if (this.isTruthy(condition)) {
      return this.evaluate(expr[2], env);
    } else if (expr.length === 4) {
      return this.evaluate(expr[3], env);
    }
    return null;
  }

  /**
   * cond式の評価
   */
  private evaluateCond(expr: LispValue[], env: Environment): LispValue {
    const clauses = expr.slice(1);
    
    for (const clause of clauses) {
      if (!Array.isArray(clause) || clause.length !== 2) {
        throw new Error("cond clause must have exactly 2 elements");
      }
      
      const condition = clause[0];
      const result = clause[1];
      
      // t は常に真
      if (this.isSymbol(condition) && condition.value === "t") {
        return this.evaluate(result, env);
      }
      
      if (this.isTruthy(this.evaluate(condition, env))) {
        return this.evaluate(result, env);
      }
    }
    
    return null;
  }

  /**
   * when式の評価
   */
  private evaluateWhen(expr: LispValue[], env: Environment): LispValue {
    if (expr.length < 2) {
      throw new Error("when requires at least 1 argument");
    }

    const condition = expr[1];
    const body = expr.slice(2);

    if (this.isTruthy(this.evaluate(condition, env))) {
      return this.evaluateSequence(body, env);
    }

    return null;
  }

  /**
   * unless式の評価
   */
  private evaluateUnless(expr: LispValue[], env: Environment): LispValue {
    if (expr.length < 2) {
      throw new Error("unless requires at least 1 argument");
    }

    const condition = expr[1];
    const body = expr.slice(2);

    if (!this.isTruthy(this.evaluate(condition, env))) {
      return this.evaluateSequence(body, env);
    }

    return null;
  }

  /**
   * 複数の式を順番に評価し、最後の結果を返すヘルパーメソッド
   */
  private evaluateSequence(expressions: LispValue[], env: Environment): LispValue {
    let result: LispValue = null;
    for (const expr of expressions) {
      result = this.evaluate(expr, env);
    }
    return result;
  }

  /**
   * defun式の評価
   */
  private evaluateDefun(expr: LispValue[], env: Environment): LispValue {
    if (expr.length < 4) {
      throw new Error("defun requires at least 3 arguments");
    }

    const name = expr[1];
    const params = expr[2];
    
    // docstringの有無を確認
    let body: LispValue;
    let docstring: string | null = null;
    
    if (expr.length === 4) {
      // (defun name params body)
      body = expr[3];
    } else if (expr.length === 5 && typeof expr[3] === "string") {
      // (defun name params "docstring" body)
      docstring = expr[3];
      body = expr[4];
    } else {
      // 複数の式を持つ場合、progn形式で結合
      body = expr.slice(3);
    }

    if (!this.isSymbol(name)) {
      throw new Error("Function name must be a symbol");
    }

    if (!Array.isArray(params)) {
      throw new Error("Parameters must be a list");
    }

    const paramNames = params.map(param => {
      if (!this.isSymbol(param)) {
        throw new Error("All parameters must be symbols");
      }
      return param.value;
    });

    const func: LispFunction = {
      type: "function",
      params: paramNames,
      body: body,
      closure: env
    };

    this.globalEnv.define(name.value, func);
    return name;
  }

  /**
   * let式の評価
   */
  private evaluateLet(expr: LispValue[], env: Environment): LispValue {
    if (expr.length !== 3) {
      throw new Error("let requires exactly 2 arguments");
    }

    const bindings = expr[1];
    const body = expr[2];

    if (!Array.isArray(bindings)) {
      throw new Error("let bindings must be a list");
    }

    const newEnv = new Environment(env);
    
    for (const binding of bindings) {
      if (!Array.isArray(binding) || binding.length !== 2) {
        throw new Error("let binding must have exactly 2 elements");
      }
      
      const name = binding[0];
      const value = binding[1];
      
      if (!this.isSymbol(name)) {
        throw new Error("let binding name must be a symbol");
      }
      
      newEnv.define(name.value, this.evaluate(value, env));
    }

    return this.evaluate(body, newEnv);
  }

  /**
   * 真偽値の判定
   */
  private isTruthy(value: LispValue): boolean {
    return value !== null && value !== false;
  }

  /**
   * 組み込み関数の実装
   */
  private add(...args: LispValue[]): number {
    return args.reduce((sum: number, arg) => {
      if (typeof arg !== "number") {
        throw new Error("+ requires numeric arguments");
      }
      return sum + arg;
    }, 0);
  }

  private subtract(...args: LispValue[]): number {
    if (args.length === 0) {
      throw new Error("- requires at least one argument");
    }
    
    if (args.length === 1) {
      if (typeof args[0] !== "number") {
        throw new Error("- requires numeric arguments");
      }
      return -args[0];
    }
    
    const first = args[0];
    if (typeof first !== "number") {
      throw new Error("- requires numeric arguments");
    }
    
    return args.slice(1).reduce((diff: number, arg) => {
      if (typeof arg !== "number") {
        throw new Error("- requires numeric arguments");
      }
      return diff - arg;
    }, first);
  }

  private multiply(...args: LispValue[]): number {
    return args.reduce((product: number, arg) => {
      if (typeof arg !== "number") {
        throw new Error("* requires numeric arguments");
      }
      return product * arg;
    }, 1);
  }

  private divide(...args: LispValue[]): number {
    if (args.length === 0) {
      throw new Error("/ requires at least one argument");
    }
    
    if (args.length === 1) {
      if (typeof args[0] !== "number") {
        throw new Error("/ requires numeric arguments");
      }
      if (args[0] === 0) {
        throw new Error("Division by zero");
      }
      return 1 / args[0];
    }
    
    const first = args[0];
    if (typeof first !== "number") {
      throw new Error("/ requires numeric arguments");
    }
    
    return args.slice(1).reduce((quotient: number, arg) => {
      if (typeof arg !== "number") {
        throw new Error("/ requires numeric arguments");
      }
      if (arg === 0) {
        throw new Error("Division by zero");
      }
      return quotient / arg;
    }, first);
  }

  private greaterThan(a: LispValue, b: LispValue): boolean {
    if (typeof a !== "number" || typeof b !== "number") {
      throw new Error("> requires numeric arguments");
    }
    return a > b;
  }

  private lessThan(a: LispValue, b: LispValue): boolean {
    if (typeof a !== "number" || typeof b !== "number") {
      throw new Error("< requires numeric arguments");
    }
    return a < b;
  }

  private equal(a: LispValue, b: LispValue): boolean {
    return a === b;
  }

  private list(...args: LispValue[]): LispValue[] {
    return args;
  }

  private lessThanOrEqual(a: LispValue, b: LispValue): boolean {
    if (typeof a !== "number" || typeof b !== "number") {
      throw new Error("<= requires numeric arguments");
    }
    return a <= b;
  }

  private greaterThanOrEqual(a: LispValue, b: LispValue): boolean {
    if (typeof a !== "number" || typeof b !== "number") {
      throw new Error(">= requires numeric arguments");
    }
    return a >= b;
  }

  private sqrt(x: LispValue): number {
    if (typeof x !== "number") {
      throw new Error("sqrt requires a numeric argument");
    }
    if (x < 0) {
      throw new Error("sqrt of negative number");
    }
    return Math.sqrt(x);
  }

  private eql(a: LispValue, b: LispValue): boolean {
    // Common Lispのeql: 同じオブジェクトか、同じ値の数値/文字
    if (a === b) return true;
    if (typeof a === "number" && typeof b === "number") return a === b;
    if (typeof a === "string" && typeof b === "string") return a === b;
    if (this.isSymbol(a) && this.isSymbol(b)) return a.value === b.value;
    return false;
  }

  private symbolp(value: LispValue): boolean {
    return this.isSymbol(value);
  }

  private stringEqual(a: LispValue, b: LispValue): boolean {
    if (typeof a !== "string" || typeof b !== "string") {
      throw new Error("string= requires string arguments");
    }
    return a === b;
  }

  private symbolName(symbol: LispValue): string {
    if (!this.isSymbol(symbol)) {
      throw new Error("symbol-name requires a symbol argument");
    }
    return symbol.value;
  }

  /**
   * defparameter式の評価
   */
  private evaluateDefparameter(expr: LispValue[], env: Environment): LispValue {
    if (expr.length !== 3 && expr.length !== 4) {
      throw new Error("defparameter requires 2 or 3 arguments");
    }

    const name = expr[1];
    const value = expr[2];
    const docstring = expr.length === 4 ? expr[3] : null;

    if (!this.isSymbol(name)) {
      throw new Error("defparameter name must be a symbol");
    }

    const evaluatedValue = this.evaluate(value, env);
    env.define(name.value, evaluatedValue);
    
    return name;
  }

  private evaluateDefvar(expr: LispValue[], env: Environment): LispValue {
    if (expr.length !== 2 && expr.length !== 3 && expr.length !== 4) {
      throw new Error("defvar requires 1, 2, or 3 arguments");
    }

    const name = expr[1];
    const value = expr.length >= 3 ? expr[2] : null;
    const docstring = expr.length === 4 ? expr[3] : null;

    if (!this.isSymbol(name)) {
      throw new Error("defvar name must be a symbol");
    }

    // defvarは変数が既に存在する場合は再定義しない
    if (!env.has(name.value) && value !== null) {
      const evaluatedValue = this.evaluate(value, env);
      env.define(name.value, evaluatedValue);
    }

    return name;
  }

  /**
   * and式の評価
   */
  private evaluateAnd(expr: LispValue[], env: Environment): LispValue {
    const forms = expr.slice(1);
    
    for (const form of forms) {
      const result = this.evaluate(form, env);
      if (!this.isTruthy(result)) {
        return result;
      }
    }
    
    return forms.length > 0 ? this.evaluate(forms[forms.length - 1], env) : true;
  }

  /**
   * or式の評価
   */
  private evaluateOr(expr: LispValue[], env: Environment): LispValue {
    const forms = expr.slice(1);
    
    for (const form of forms) {
      const result = this.evaluate(form, env);
      if (this.isTruthy(result)) {
        return result;
      }
    }
    
    return null;
  }

  /**
   * defstruct式の評価
   */
  private evaluateDefstruct(expr: LispValue[], env: Environment): LispValue {

    if (expr.length < 2) {
      throw new Error("defstruct requires at least a struct name");
    }

    const nameExpr = expr[1];
    if (typeof nameExpr !== "object" || nameExpr === null || !(("type" in nameExpr)) || 
        nameExpr.type !== "symbol") {
      throw new Error("defstruct name must be a symbol");
    }

    const structName = nameExpr.value;
    const fields: string[] = [];

    // フィールド名を抽出
    for (let i = 2; i < expr.length; i++) {
      const fieldExpr = expr[i];
      if (typeof fieldExpr === "object" && fieldExpr !== null && "type" in fieldExpr && 
          fieldExpr.type === "symbol") {
        fields.push(fieldExpr.value);
      }
    }

    // 構造体を定義
    this.structSystem.defineStruct(structName, fields);

    // 生成された関数を評価器に登録
    this.registerStructFunctions(structName);

    return nameExpr;
  }

  /**
   * make-hash-table関数の実装
   * Common Lispハッシュテーブルの基本実装
   */
  private makeHashTable(...args: LispValue[]): LispValue {
    // 簡単な実装：Mapを使用してハッシュテーブルをシミュレート
    const hashTable = new Map<string, LispValue>();
    
    // hash-tableオブジェクトを表現
    return {
      type: "hash-table",
      map: hashTable,
      test: "eq" // デフォルトテスト（Common Lispの仕様）
    } as any;
  }

  /**
   * gethash関数の実装
   * ハッシュテーブルからキーに対応する値を取得
   */
  private gethash(key: LispValue, hashTable: any, defaultValue?: LispValue): LispValue {
    if (!this.isHashTable(hashTable)) {
      throw new Error("gethash second argument must be a hash table");
    }

    const keyStr = this.hashTableKeyToString(key);
    const map = hashTable.map as Map<string, LispValue>;
    
    if (map.has(keyStr)) {
      return map.get(keyStr)!;
    }
    
    return defaultValue !== undefined ? defaultValue : null;
  }

  /**
   * ハッシュテーブルかどうかをチェック
   */
  private isHashTable(value: any): boolean {
    return value && typeof value === "object" && value.type === "hash-table" && value.map instanceof Map;
  }

  /**
   * ハッシュテーブルのキーを内部文字列表現に変換
   * 異なる型のキーを区別するためにプレフィックスを使用
   */
  private hashTableKeyToString(key: LispValue): string {
    if (typeof key === "string") {
      return `str:${key}`;
    }
    if (typeof key === "number") {
      return `num:${key}`;
    }
    if (this.isSymbol(key)) {
      return `sym:${key.value}`;
    }
    if (this.isKeyword(key)) {
      return `kwd:${key.value}`;
    }
    // その他のオブジェクト型
    return `obj:${JSON.stringify(key)}`;
  }

  /**
   * 構造体関数を評価器に登録
   */
  private registerStructFunctions(structName: string): void {
    if (!this.structSystem) return;

    // make-struct関数
    const constructor = this.structSystem.getConstructor(structName);
    this.defineSymbol(`make-${structName}`, constructor);

    // struct-field関数
    const structDef = this.structSystem.getStructDefinition(structName);
    const allFields = structDef.getAllFields(this.structSystem);
    
    for (const fieldName of allFields) {
      const accessor = this.structSystem.getAccessor(structName, fieldName);
      this.defineSymbol(`${structName}-${fieldName}`, accessor);
    }

    // struct-p関数
    const predicate = this.structSystem.getPredicate(structName);
    this.defineSymbol(`${structName}-p`, predicate);
  }

  /**
   * format関数の実装
   */
  private format(stream: LispValue, control: LispValue, ...args: LispValue[]): LispValue {
    if (typeof control !== "string") {
      throw new Error("format control must be a string");
    }
    
    // 簡単な実装：~A、~%を処理
    let result = control;
    let argIndex = 0;
    
    result = result.replace(/~A/g, () => {
      if (argIndex < args.length) {
        const arg = args[argIndex++];
        if (typeof arg === "string") return arg;
        if (typeof arg === "number") return arg.toString();
        if (this.isSymbol(arg)) return arg.value;
        return JSON.stringify(arg);
      }
      return "";
    });
    
    result = result.replace(/~%/g, "\n");
    
    if (stream === true || (this.isSymbol(stream) && stream.value === "t")) {
      console.log(result);
      return null;
    }
    
    return result;
  }

  /**
   * funcall関数の実装
   */
  private funcall(fn: LispValue, ...args: LispValue[]): LispValue {
    if (this.isFunction(fn)) {
      return this.callUserFunction(fn, args);
    }
    if (this.isBuiltin(fn)) {
      return fn.fn(...args);
    }
    if (this.isSymbol(fn)) {
      const func = this.globalEnv.get(fn.value);
      return this.funcall(func, ...args);
    }
    throw new Error(`Cannot call ${JSON.stringify(fn)}`);
  }

  /**
   * every関数の実装
   */
  private every(predicate: LispValue, ...sequences: LispValue[]): LispValue {
    if (sequences.length === 0) return true;
    
    const seq = sequences[0];
    if (!Array.isArray(seq)) {
      throw new Error("every requires a sequence");
    }
    
    for (const item of seq) {
      const result = this.funcall(predicate, item);
      if (!this.isTruthy(result)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * length関数の実装
   */
  private length(sequence: LispValue): number {
    if (Array.isArray(sequence)) {
      return sequence.length;
    }
    if (typeof sequence === "string") {
      return sequence.length;
    }
    throw new Error("length requires a sequence");
  }

  /**
   * count関数の実装
   */
  private count(item: LispValue, sequence: LispValue, options?: any): number {
    if (!Array.isArray(sequence)) {
      throw new Error("count requires a sequence");
    }
    
    let count = 0;
    for (const seqItem of sequence) {
      if (this.eql(item, seqItem)) {
        count++;
      }
    }
    
    return count;
  }

  /**
   * dolist特殊フォームの実装
   */
  private evaluateDolist(expr: LispValue[], env: Environment): LispValue {
    const { varName, body } = this.parseIterationSpec(expr, "dolist");
    
    const listExpr = expr[1][1];
    const list = this.evaluate(listExpr, env);
    if (!Array.isArray(list)) {
      throw new Error("dolist requires a list");
    }
    
    return this.executeIteration(varName, list, body, env);
  }

  /**
   * dotimes特殊フォームの実装
   */
  private evaluateDotimes(expr: LispValue[], env: Environment): LispValue {
    const { varName, body } = this.parseIterationSpec(expr, "dotimes");
    
    const countExpr = expr[1][1];
    const count = this.evaluate(countExpr, env);
    if (typeof count !== "number" || count < 0 || !Number.isInteger(count)) {
      throw new Error("dotimes count must be a non-negative integer");
    }
    
    const indices = Array.from({ length: count }, (_, i) => i);
    return this.executeIteration(varName, indices, body, env);
  }

  /**
   * 反復構造の仕様解析ヘルパー
   */
  private parseIterationSpec(expr: LispValue[], formName: string): { varName: string; body: LispValue } {
    if (expr.length !== 3) {
      throw new Error(`${formName} requires exactly 2 arguments`);
    }
    
    const spec = expr[1];
    const body = expr[2];
    
    if (!Array.isArray(spec) || spec.length !== 2) {
      throw new Error(`${formName} spec must be (var ${formName === 'dolist' ? 'list' : 'count'})`);
    }
    
    const varName = spec[0];
    if (!this.isSymbol(varName)) {
      throw new Error(`${formName} variable must be a symbol`);
    }
    
    return { varName: varName.value, body };
  }

  /**
   * 反復実行ヘルパー
   */
  private executeIteration(varName: string, values: LispValue[], body: LispValue, env: Environment): LispValue {
    const newEnv = new Environment(env);
    
    for (const value of values) {
      newEnv.define(varName, value);
      this.evaluate(body, newEnv);
    }
    
    return null;
  }

  /**
   * lambda特殊フォームの実装
   * 無名関数を作成し、レキシカルクロージャをサポート
   */
  private evaluateLambda(expr: LispValue[], env: Environment): LispValue {
    if (expr.length < 3) {
      throw new Error("lambda requires at least 2 arguments: parameters and body");
    }

    const params = expr[1];
    const body = expr[2];

    if (!Array.isArray(params)) {
      throw new Error("lambda parameters must be a list");
    }

    const paramNames = params.map(param => {
      if (!this.isSymbol(param)) {
        throw new Error("lambda parameter must be a symbol");
      }
      return param.value;
    });

    // lambdaは無名関数を作成し、現在の環境をクロージャとして保持
    const func: LispFunction = {
      type: "function",
      params: paramNames,
      body: body,
      closure: env
    };

    return func;
  }

  /**
   * handler-case特殊フォームの実装
   * Common Lispのエラーハンドリング機構の基本実装
   */
  private evaluateHandlerCase(expr: LispValue[], env: Environment): LispValue {
    if (expr.length < 2) {
      throw new Error("handler-case requires at least a body expression");
    }
    
    const body = expr[1];
    const handlers = expr.slice(2);
    
    try {
      return this.evaluate(body, env);
    } catch (caughtError) {
      // 適切なエラーハンドラーを検索して実行
      const matchedHandler = this.findMatchingErrorHandler(handlers, caughtError);
      if (matchedHandler) {
        return this.evaluate(matchedHandler, env);
      }
      
      // マッチするハンドラーがない場合はエラーを再発生
      throw caughtError;
    }
  }

  /**
   * エラーに対応するハンドラーを検索
   */
  private findMatchingErrorHandler(handlers: LispValue[], error: any): LispValue | null {
    for (const handler of handlers) {
      if (!Array.isArray(handler) || handler.length < 2) {
        continue;
      }
      
      const errorType = handler[0];
      const handlerBody = handler[1];
      
      if (!this.isSymbol(errorType)) {
        continue;
      }
      
      // error型は汎用ハンドラー（すべてのエラーをキャッチ）
      if (errorType.value === "error") {
        return handlerBody;
      }
      
      // 特定のエラー型のマッチング
      if (this.matchesErrorType(errorType.value, error)) {
        return handlerBody;
      }
    }
    
    return null;
  }

  /**
   * エラーが指定された型にマッチするかチェック
   */
  private matchesErrorType(errorTypeName: string, error: any): boolean {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    switch (errorTypeName) {
      case "arithmetic-error":
        return errorMessage.includes("Division by zero") || 
               errorMessage.includes("arithmetic") ||
               errorMessage.includes("requires numeric arguments");
      
      case "type-error":
        return errorMessage.includes("requires") && errorMessage.includes("arguments");
      
      case "undefined-variable":
        return errorMessage.includes("Undefined variable");
      
      default:
        return false;
    }
  }

  /**
   * progn特殊フォームの実装
   */
  private evaluateProgn(expr: LispValue[], env: Environment): LispValue {
    let result: LispValue = null;
    
    for (let i = 1; i < expr.length; i++) {
      result = this.evaluate(expr[i], env);
    }
    
    return result;
  }

  /**
   * car関数の実装
   */
  private car(list: LispValue): LispValue {
    if (!Array.isArray(list)) {
      throw new Error("car requires a list");
    }
    return list.length > 0 ? list[0] : null;
  }

  /**
   * cdr関数の実装
   */
  private cdr(list: LispValue): LispValue {
    if (!Array.isArray(list)) {
      throw new Error("cdr requires a list");
    }
    return list.length > 0 ? list.slice(1) : [];
  }

  /**
   * incf関数の実装（マクロ的な機能）
   */
  private incf(place: LispValue, delta: LispValue = 1): LispValue {
    if (!this.isSymbol(place)) {
      throw new Error("incf requires a symbol");
    }
    
    const current = this.globalEnv.get(place.value);
    if (typeof current !== "number") {
      throw new Error("incf requires a numeric variable");
    }
    
    const newValue = current + (typeof delta === "number" ? delta : 1);
    this.globalEnv.define(place.value, newValue);
    return newValue;
  }

  /**
   * mapcar関数の実装
   * 各シーケンスの対応する要素に関数を適用し、結果のリストを返す
   */
  private mapcar(fn: LispValue, ...sequences: LispValue[]): LispValue[] {
    if (sequences.length === 0) {
      throw new Error("mapcar requires at least one sequence");
    }

    // すべてのシーケンスの型をチェック
    for (const seq of sequences) {
      if (!Array.isArray(seq)) {
        throw new Error("mapcar requires list arguments");
      }
    }

    // 最短のシーケンスの長さを取得（Common Lispの仕様）
    const minLength = Math.min(...sequences.map(seq => (seq as LispValue[]).length));
    
    const results: LispValue[] = [];
    for (let i = 0; i < minLength; i++) {
      const args = sequences.map(seq => (seq as LispValue[])[i]);
      const result = this.funcall(fn, ...args);
      results.push(result);
    }

    return results;
  }

  /**
   * some関数の実装
   * シーケンスの要素に述語を適用し、一つでも真なら真を返す
   */
  private some(predicate: LispValue, ...sequences: LispValue[]): LispValue {
    if (sequences.length === 0) return null;
    
    const seq = sequences[0];
    if (!Array.isArray(seq)) {
      throw new Error("some requires a sequence");
    }
    
    for (const item of seq) {
      const result = this.funcall(predicate, item);
      if (this.isTruthy(result)) {
        return true;
      }
    }
    
    return null;
  }

  /**
   * remove-if関数の実装
   * 述語が真を返す要素を除去した新しいリストを返す
   */
  private removeIf(predicate: LispValue, sequence: LispValue): LispValue[] {
    if (!Array.isArray(sequence)) {
      throw new Error("remove-if requires a sequence");
    }
    
    const results: LispValue[] = [];
    for (const item of sequence) {
      const result = this.funcall(predicate, item);
      if (!this.isTruthy(result)) {
        results.push(item);
      }
    }
    
    return results;
  }

  /**
   * setf特殊フォームの実装
   * Common Lispのsetfマクロの基本実装
   * (setf place value) の形式で様々な場所に値を設定
   */
  private evaluateSetf(expr: LispValue[], env: Environment): LispValue {
    if (expr.length !== 3) {
      throw new Error("setf requires exactly 2 arguments: place and value");
    }

    const place = expr[1];
    const value = this.evaluate(expr[2], env);

    // ハッシュテーブルアクセスの場合: (setf (gethash key hash-table) value)
    if (Array.isArray(place) && place.length >= 3) {
      const placeOp = place[0];
      if (this.isSymbol(placeOp) && placeOp.value === "gethash") {
        return this.setfGethash(place, value, env);
      }
    }

    // 変数の場合: (setf symbol value)
    if (this.isSymbol(place)) {
      env.define(place.value, value);
      return value;
    }

    throw new Error(`setf: unsupported place type: ${JSON.stringify(place)}`);
  }

  /**
   * setf + gethashの組み合わせを処理
   */
  private setfGethash(place: LispValue[], value: LispValue, env: Environment): LispValue {
    const key = this.evaluate(place[1], env);
    const hashTable = this.evaluate(place[2], env);
    
    if (!this.isHashTable(hashTable)) {
      throw new Error("setf gethash requires a hash table as second argument");
    }

    const keyStr = this.hashTableKeyToString(key);
    const map = hashTable.map as Map<string, LispValue>;
    map.set(keyStr, value);
    
    return value;
  }

  /**
   * error関数の実装
   * Common Lispのerror関数 - エラーを明示的に発生させる
   */
  private error(...args: LispValue[]): never {
    const message = this.formatErrorMessage(args);
    throw new Error(message);
  }

  /**
   * エラーメッセージをフォーマット
   */
  private formatErrorMessage(args: LispValue[]): string {
    if (args.length === 0) {
      return "Error";
    }
    
    const firstArg = args[0];
    let message: string;
    
    // メインメッセージの構築
    if (typeof firstArg === "string") {
      message = firstArg;
    } else if (this.isSymbol(firstArg)) {
      message = `Error: ${firstArg.value}`;
    } else {
      message = `Error: ${JSON.stringify(firstArg)}`;
    }
    
    // 追加引数があれば含める
    if (args.length > 1) {
      const additionalArgs = args.slice(1).map(arg => this.valueToString(arg)).join(", ");
      message += ` (${additionalArgs})`;
    }
    
    return message;
  }

  /**
   * LispValueを文字列表現に変換
   */
  private valueToString(value: LispValue): string {
    if (typeof value === "string") return value;
    if (typeof value === "number") return value.toString();
    if (this.isSymbol(value)) return value.value;
    if (this.isKeyword(value)) return `:${value.value}`;
    return JSON.stringify(value);
  }

  // === Symbol System Helper Methods ===
  
  /**
   * 文字列引数の検証
   */
  private validateStringArgument(value: LispValue, functionName: string, argPosition: string = "first"): string {
    if (typeof value !== "string") {
      throw new Error(`${functionName} ${argPosition} argument must be a string`);
    }
    return value;
  }
  
  /**
   * 非インターンシンボルの作成
   */
  private createUninternedSymbol(name: string): LispSymbol {
    return {
      type: "symbol",
      value: name,
      package: null,
      interned: false
    } as LispSymbol;
  }

  /**
   * intern関数の実装
   * 文字列をシンボルに変換し、シンボルテーブルに登録
   */
  private intern(name: LispValue, packageName?: LispValue): LispValue {
    const nameStr = this.validateStringArgument(name, "intern");

    // パッケージ指定がある場合の処理は簡略化
    if (packageName !== undefined) {
      this.validateStringArgument(packageName, "intern", "second");
    }

    const symbol = this.symbolTable.intern(nameStr);
    return this.symbolToLispValue(symbol);
  }

  /**
   * make-symbol関数の実装
   * 非インターンシンボルを作成
   */
  private makeSymbol(name: LispValue): LispValue {
    const nameStr = this.validateStringArgument(name, "make-symbol");
    return this.createUninternedSymbol(nameStr);
  }

  /**
   * symbol-package関数の実装
   * シンボルのパッケージを返す
   */
  private symbolPackage(symbol: LispValue): LispValue {
    if (!this.isSymbol(symbol)) {
      throw new Error("symbol-package argument must be a symbol");
    }

    // 簡略化：すべてのシンボルはcommon-lisp-userパッケージに属するとする
    return {
      type: "symbol",
      value: "COMMON-LISP-USER"
    } as LispSymbol;
  }

  /**
   * find-symbol関数の実装
   * シンボルテーブルからシンボルを検索
   */
  private findSymbol(name: LispValue, packageName?: LispValue): LispValue {
    const nameStr = this.validateStringArgument(name, "find-symbol");

    const symbol = this.symbolTable.lookup(nameStr);
    return symbol ? this.symbolToLispValue(symbol) : null;
  }

  /**
   * gensym関数の実装
   * 一意な非インターンシンボルを生成
   */
  private gensym(prefix?: LispValue): LispValue {
    const prefixStr = prefix && typeof prefix === "string" ? prefix : "G";
    const uniqueName = `#:${prefixStr}${this.gensymCounter++}`;
    return this.createUninternedSymbol(uniqueName);
  }

  /**
   * SymbolTableのSymbolをLispValueに変換
   */
  private symbolToLispValue(symbol: Symbol): LispValue {
    const symbolName = symbol.name;
    
    // キャッシュから検索
    if (this.symbolCache.has(symbolName)) {
      return this.symbolCache.get(symbolName)!;
    }
    
    // 新しいLispValueを作成してキャッシュに保存
    const lispValue = {
      type: "symbol",
      value: symbolName,
      package: null,
      interned: true
    } as LispSymbol;
    
    this.symbolCache.set(symbolName, lispValue);
    return lispValue;
  }

  // === File Loading System ===
  
  /**
   * Lispコードの行が評価対象かどうかを判定
   */
  private isEvaluatableLine(line: string): boolean {
    const trimmed = line.trim();
    return Boolean(
      trimmed && 
      !this.isCommentLine(trimmed) && 
      this.isLispExpression(trimmed)
    );
  }

  /**
   * コメント行かどうかを判定
   */
  private isCommentLine(line: string): boolean {
    return line.startsWith(';;') || line.startsWith(';;;');
  }

  /**
   * Lisp式の開始かどうかを判定
   */
  private isLispExpression(line: string): boolean {
    return line.startsWith('(');
  }
  
  /**
   * ファイルコンテンツを評価可能な行に分割
   */
  private parseFileContent(content: string): string[] {
    return content.split('\n').filter(this.isEvaluatableLine.bind(this));
  }
  
  /**
   * 単一のLisp式を安全に評価
   */
  private safeEvaluateLine(line: string, parser: SExpressionParser): LispValue | null {
    try {
      const expr = parser.parse(line);
      return this.evaluate(expr);
    } catch (parseError) {
      console.warn(`Parse error in line: ${line.slice(0, 50)}...`);
      return null;
    }
  }
  
  /**
   * load関数の実装
   * Lispファイルを読み込んで評価する（同期版）
   */
  private load(filename: LispValue): LispValue {
    if (typeof filename !== "string") {
      throw new Error("load argument must be a string filename");
    }
    
    try {
      const content = Deno.readTextFileSync(filename);
      const parser = new SExpressionParser();
      const evaluableLines = this.parseFileContent(content);
      
      let successCount = 0;
      for (const line of evaluableLines) {
        const result = this.safeEvaluateLine(line, parser);
        if (result !== null) {
          successCount++;
        }
      }
      
      console.log(`Loaded ${successCount}/${evaluableLines.length} expressions from ${filename}`);
      return true;
    } catch (error) {
      console.warn(`Warning: Could not load file ${filename}: ${error}`);
      return false;
    }
  }

  // === Package System ===
  
  /**
   * パッケージ名を正規化（キーワードまたはシンボルから文字列を抽出）
   */
  private normalizePackageName(nameExpr: LispValue): string {
    if (this.isKeyword(nameExpr)) {
      return nameExpr.value;
    } else if (this.isSymbol(nameExpr)) {
      return nameExpr.value;
    } else {
      throw new Error("Package name must be a keyword or symbol");
    }
  }
  
  /**
   * パッケージ関連の共通戻り値作成
   */
  private createPackageResult(packageName: string): LispSymbol {
    return {
      type: "symbol",
      value: packageName
    } as LispSymbol;
  }
  
  /**
   * defpackage式の評価
   */
  private evaluateDefpackage(expr: LispValue[], env: Environment): LispValue {
    if (expr.length < 2) {
      throw new Error("defpackage requires at least a package name");
    }
    
    const packageName = this.normalizePackageName(expr[1]);
    
    // パッケージを作成（簡略化実装）
    this.packageSystem.definePackage(packageName, ["common-lisp"], this.symbolTable);
    
    return this.createPackageResult(packageName);
  }
  
  /**
   * in-package式の評価
   */
  private evaluateInPackage(expr: LispValue[], env: Environment): LispValue {
    if (expr.length !== 2) {
      throw new Error("in-package requires exactly one package name");
    }
    
    const packageName = this.normalizePackageName(expr[1]);
    
    // パッケージを切り替える
    this.packageSystem.setCurrentPackage(packageName);
    
    return this.createPackageResult(packageName);
  }

  // === Additional Special Forms ===
  
  /**
   * シンボル引数の検証とヘルパー
   */
  private validateSymbolArgument(expr: LispValue, functionName: string, position: string = "argument"): string {
    if (!this.isSymbol(expr)) {
      throw new Error(`${functionName} ${position} must be a symbol`);
    }
    return expr.value;
  }
  
  /**
   * シンボル結果の作成
   */
  private createSymbolResult(symbolName: string): LispSymbol {
    return {
      type: "symbol",
      value: symbolName
    } as LispSymbol;
  }
  
  
  /**
   * case式の評価 - 条件分岐
   */
  private evaluateCase(expr: LispValue[], env: Environment): LispValue {
    if (expr.length < 2) {
      throw new Error("case requires at least a key expression");
    }
    
    const keyValue = this.evaluate(expr[1], env);
    const clauses = expr.slice(2);
    
    for (const clause of clauses) {
      if (!this.isValidCaseClause(clause)) {
        continue;
      }
      
      const [keys, ...forms] = clause as LispValue[];
      
      if (this.isDefaultClause(keys) || this.matchesKey(keyValue, keys)) {
        return this.evaluateProgn([{ type: "symbol", value: "progn" }, ...forms], env);
      }
    }
    
    return null; // マッチしない場合はnil
  }

  /**
   * case句の妥当性をチェック
   */
  private isValidCaseClause(clause: LispValue): boolean {
    return Array.isArray(clause) && clause.length >= 2;
  }

  /**
   * デフォルト句（t または otherwise）かチェック
   */
  private isDefaultClause(keys: LispValue): boolean {
    return this.isSymbol(keys) && (keys.value === "t" || keys.value === "otherwise");
  }

  /**
   * キーがマッチするかチェック
   */
  private matchesKey(keyValue: LispValue, keys: LispValue): boolean {
    if (Array.isArray(keys)) {
      return keys.some(key => this.lispEqual(keyValue, key));
    } else {
      return this.lispEqual(keyValue, keys);
    }
  }
  
  /**
   * Lisp値の等価性比較
   */
  private lispEqual(value1: LispValue, value2: LispValue): boolean {
    if (typeof value1 !== typeof value2) {
      return false;
    }
    
    if (typeof value1 === "string" || typeof value1 === "number" || typeof value1 === "boolean") {
      return value1 === value2;
    }
    
    if (this.isSymbol(value1) && this.isSymbol(value2)) {
      return value1.value === value2.value;
    }
    
    if (this.isKeyword(value1) && this.isKeyword(value2)) {
      return value1.value === value2.value;
    }
    
    return false;
  }

  // === Additional Built-in Functions ===
  
  /**
   * make-list関数の実装
   * 指定された長さのリストを作成
   */
  private makeList(size: LispValue, initialElement?: LispValue): LispValue {
    if (typeof size !== "number" || size < 0) {
      throw new Error("make-list size must be a non-negative integer");
    }
    
    const element = initialElement !== undefined ? initialElement : null;
    const result: LispValue[] = [];
    
    for (let i = 0; i < size; i++) {
      result.push(element);
    }
    
    return result;
  }
}