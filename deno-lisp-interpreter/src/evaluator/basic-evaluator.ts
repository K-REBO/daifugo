// basic-evaluator.ts - 基本評価器実装

import { LispValue, LispSymbol, LispKeyword, LispQuote, LispFunction, LispBuiltin } from "../parser/s-expression-parser.ts";

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
  private structSystem: any = null;

  constructor() {
    this.globalEnv = new Environment();
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
          case "defun":
            return this.evaluateDefun(expr, env);
          case "defparameter":
            return this.evaluateDefparameter(expr, env);
          case "let":
            return this.evaluateLet(expr, env);
          case "quote":
            return expr[1];
          case "and":
            return this.evaluateAnd(expr, env);
          case "or":
            return this.evaluateOr(expr, env);
          case "defstruct":
            return this.evaluateDefstruct(expr, env);
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

    // 関数本体が配列の場合（複数の式）
    if (Array.isArray(func.body)) {
      let result: LispValue = null;
      for (const expr of func.body) {
        result = this.evaluate(expr, newEnv);
      }
      return result;
    } else {
      return this.evaluate(func.body, newEnv);
    }
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

    env.define(name.value, func);
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
    if (!this.structSystem) {
      throw new Error("StructSystem not available");
    }

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
}