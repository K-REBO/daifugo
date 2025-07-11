// struct-system.ts - 構造体システム実装

import { LispValue } from "../parser/s-expression-parser.ts";
import { Symbol } from "./symbol-table.ts";
import { BasicEvaluator } from "../evaluator/basic-evaluator.ts";

/**
 * 構造体定義
 */
export class StructDefinition {
  public readonly name: string;
  public readonly fields: string[];
  public readonly parentStruct: string | null;

  constructor(name: string, fields: string[], parentStruct: string | null = null) {
    this.name = name;
    this.fields = fields;
    this.parentStruct = parentStruct;
  }

  /**
   * 全フィールド（継承を含む）を取得
   */
  getAllFields(structSystem: StructSystem): string[] {
    if (this.parentStruct) {
      const parent = structSystem.getStructDefinition(this.parentStruct);
      return [...parent.getAllFields(structSystem), ...this.fields];
    }
    return [...this.fields];
  }

  /**
   * 指定されたフィールドが存在するかチェック
   */
  hasField(fieldName: string, structSystem: StructSystem): boolean {
    return this.getAllFields(structSystem).includes(fieldName);
  }
}

/**
 * 構造体インスタンス
 */
export class StructInstance {
  public readonly structName: string;
  private fields: Map<string, LispValue> = new Map();

  constructor(structName: string, fieldValues: LispValue[] = []) {
    this.structName = structName;
  }

  /**
   * フィールド値を設定
   */
  setValue(fieldName: string, value: LispValue): void {
    this.fields.set(fieldName, value);
  }

  /**
   * フィールド値を取得
   */
  getValue(fieldName: string): LispValue {
    if (!this.fields.has(fieldName)) {
      throw new Error(`Field '${fieldName}' not found in struct '${this.structName}'`);
    }
    return this.fields.get(fieldName)!;
  }

  /**
   * フィールドが存在するかチェック
   */
  hasField(fieldName: string): boolean {
    return this.fields.has(fieldName);
  }

  /**
   * 全フィールドを取得
   */
  getAllFields(): Map<string, LispValue> {
    return new Map(this.fields);
  }

  /**
   * JSON表現
   */
  toJSON(): any {
    return {
      type: "struct",
      structName: this.structName,
      fields: Object.fromEntries(this.fields)
    };
  }

  /**
   * 文字列表現
   */
  toString(): string {
    const fieldStrings = Array.from(this.fields.entries())
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
    return `#<${this.structName} ${fieldStrings}>`;
  }
}

/**
 * 構造体システム
 */
export class StructSystem {
  private structDefinitions: Map<string, StructDefinition> = new Map();
  private constructors: Map<string, Function> = new Map();
  private accessors: Map<string, Map<string, Function>> = new Map();
  private predicates: Map<string, Function> = new Map();

  /**
   * 構造体を定義
   */
  defineStruct(name: string, fields: string[], parentStruct: string | null = null): void {
    const structDef = new StructDefinition(name, fields, parentStruct);
    this.structDefinitions.set(name, structDef);

    // 関数を生成
    this.generateConstructor(structDef);
    this.generateAccessors(structDef);
    this.generatePredicate(structDef);
  }

  /**
   * 構造体が定義されているかチェック
   */
  isStructDefined(name: string): boolean {
    return this.structDefinitions.has(name);
  }

  /**
   * 構造体定義を取得
   */
  getStructDefinition(name: string): StructDefinition {
    if (!this.structDefinitions.has(name)) {
      throw new Error(`Struct '${name}' is not defined`);
    }
    return this.structDefinitions.get(name)!;
  }

  /**
   * 構造体インスタンスを作成
   */
  createInstance(structName: string, fieldValues: LispValue[] = []): StructInstance {
    const structDef = this.getStructDefinition(structName);
    const instance = new StructInstance(structName);
    
    // 全フィールドを取得（継承を含む）
    const allFields = structDef.getAllFields(this);
    
    // フィールドに値を設定
    for (let i = 0; i < allFields.length; i++) {
      const fieldName = allFields[i];
      const value = i < fieldValues.length ? fieldValues[i] : null;
      instance.setValue(fieldName, value);
    }

    return instance;
  }

  /**
   * コンストラクタ関数を生成
   */
  private generateConstructor(structDef: StructDefinition): void {
    const constructor = (...args: LispValue[]) => {
      return this.createInstance(structDef.name, args);
    };
    
    this.constructors.set(structDef.name, constructor);
  }

  /**
   * アクセサ関数を生成
   */
  private generateAccessors(structDef: StructDefinition): void {
    const accessorMap = new Map<string, Function>();
    const allFields = structDef.getAllFields(this);
    
    for (const fieldName of allFields) {
      const accessor = (instance: StructInstance) => {
        if (!this.isInstanceOfStruct(instance, structDef.name)) {
          throw new Error(`Expected ${structDef.name}, got ${instance.structName}`);
        }
        return instance.getValue(fieldName);
      };
      
      accessorMap.set(fieldName, accessor);
    }
    
    this.accessors.set(structDef.name, accessorMap);
  }

  /**
   * 述語関数を生成
   */
  private generatePredicate(structDef: StructDefinition): void {
    const predicate = (value: any) => {
      if (!(value instanceof StructInstance)) {
        return false;
      }
      
      // 直接の型チェック
      if (value.structName === structDef.name) {
        return true;
      }
      
      // 継承チェック
      return this.isInstanceOfStruct(value, structDef.name);
    };
    
    this.predicates.set(structDef.name, predicate);
  }

  /**
   * 継承チェック
   */
  private isInstanceOfStruct(instance: StructInstance, structName: string): boolean {
    if (instance.structName === structName) {
      return true;
    }
    
    if (this.structDefinitions.has(instance.structName)) {
      const instanceStructDef = this.structDefinitions.get(instance.structName)!;
      if (instanceStructDef.parentStruct) {
        return instanceStructDef.parentStruct === structName || 
               this.isInstanceOfStruct(instance, instanceStructDef.parentStruct);
      }
    }
    
    return false;
  }

  /**
   * コンストラクタ関数を取得
   */
  getConstructor(structName: string): Function {
    if (!this.constructors.has(structName)) {
      throw new Error(`Constructor for struct '${structName}' not found`);
    }
    return this.constructors.get(structName)!;
  }

  /**
   * アクセサ関数を取得
   */
  getAccessor(structName: string, fieldName: string): Function {
    if (!this.accessors.has(structName)) {
      throw new Error(`Accessors for struct '${structName}' not found`);
    }
    
    const accessorMap = this.accessors.get(structName)!;
    if (!accessorMap.has(fieldName)) {
      throw new Error(`Accessor for field '${fieldName}' in struct '${structName}' not found`);
    }
    
    return accessorMap.get(fieldName)!;
  }

  /**
   * 述語関数を取得
   */
  getPredicate(structName: string): Function {
    if (!this.predicates.has(structName)) {
      throw new Error(`Predicate for struct '${structName}' not found`);
    }
    return this.predicates.get(structName)!;
  }

  /**
   * 評価器との統合
   */
  integrateWithEvaluator(evaluator: BasicEvaluator): void {
    // BasicEvaluatorが直接defstructを処理するようになったので、
    // 既存の関数のみ登録
    this.registerFunctionsWithEvaluator(evaluator);
  }

  /**
   * defstruct特殊フォームを評価器に追加
   */
  private addDefstructToEvaluator(evaluator: BasicEvaluator): void {
    // BasicEvaluatorを拡張してdefstructを処理
    const originalEvaluate = evaluator.evaluate.bind(evaluator);
    
    evaluator.evaluate = (expr: LispValue, env?: any) => {
      if (Array.isArray(expr) && expr.length > 0) {
        const first = expr[0];
        if (typeof first === "object" && first !== null && "type" in first && 
            first.type === "symbol" && first.value === "defstruct") {
          return this.evaluateDefstruct(expr, evaluator);
        }
      }
      return originalEvaluate(expr, env);
    };
  }

  /**
   * defstruct式を評価
   */
  private evaluateDefstruct(expr: LispValue[], evaluator: BasicEvaluator): LispValue {
    if (expr.length < 2) {
      throw new Error("defstruct requires at least a struct name");
    }

    const nameExpr = expr[1];
    if (typeof nameExpr !== "object" || nameExpr === null || !("type" in nameExpr) || 
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
    this.defineStruct(structName, fields);

    // 生成された関数を評価器に登録
    this.registerStructFunctions(evaluator, structName);

    return nameExpr;
  }

  /**
   * 構造体関数を評価器に登録
   */
  private registerStructFunctions(evaluator: BasicEvaluator, structName: string): void {
    // make-struct関数
    const constructor = this.getConstructor(structName);
    evaluator.defineSymbol(`make-${structName}`, constructor);

    // struct-field関数
    const structDef = this.getStructDefinition(structName);
    const allFields = structDef.getAllFields(this);
    
    for (const fieldName of allFields) {
      const accessor = this.getAccessor(structName, fieldName);
      evaluator.defineSymbol(`${structName}-${fieldName}`, accessor);
    }

    // struct-p関数
    const predicate = this.getPredicate(structName);
    evaluator.defineSymbol(`${structName}-p`, predicate);
  }

  /**
   * 全関数を評価器に登録
   */
  private registerFunctionsWithEvaluator(evaluator: BasicEvaluator): void {
    for (const structName of this.structDefinitions.keys()) {
      this.registerStructFunctions(evaluator, structName);
    }
  }

  /**
   * 統計情報を取得
   */
  getStatistics(): {
    totalStructs: number;
    totalConstructors: number;
    totalAccessors: number;
    totalPredicates: number;
  } {
    let totalAccessors = 0;
    for (const accessorMap of this.accessors.values()) {
      totalAccessors += accessorMap.size;
    }

    return {
      totalStructs: this.structDefinitions.size,
      totalConstructors: this.constructors.size,
      totalAccessors,
      totalPredicates: this.predicates.size
    };
  }

  /**
   * デバッグ用：構造体システムの内容を出力
   */
  debug(): void {
    console.log("=== Struct System Debug ===");
    for (const [name, structDef] of this.structDefinitions) {
      console.log(`Struct: ${name}`);
      console.log(`  Fields: ${structDef.fields.join(", ")}`);
      console.log(`  Parent: ${structDef.parentStruct || "none"}`);
      console.log(`  All Fields: ${structDef.getAllFields(this).join(", ")}`);
    }
    
    const stats = this.getStatistics();
    console.log(`Statistics: ${stats.totalStructs} structs, ${stats.totalConstructors} constructors, ${stats.totalAccessors} accessors, ${stats.totalPredicates} predicates`);
  }
}