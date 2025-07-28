// s-expression-parser.ts - S式パーサー実装

/**
 * Lispの値の型定義
 */
export type LispValue = 
  | number 
  | string 
  | boolean
  | null
  | Function
  | LispSymbol 
  | LispKeyword 
  | LispQuote 
  | LispFunction
  | LispBuiltin
  | LispValue[]
  | any; // StructInstance等の拡張型を許可

export interface LispSymbol {
  type: "symbol";
  value: string;
}

export interface LispKeyword {
  type: "keyword";
  value: string;
}

export interface LispQuote {
  type: "quote";
  value: LispValue;
}

export interface LispFunction {
  type: "function";
  params: string[];
  body: LispValue;
  closure?: any; // Environment は循環参照を避けるため any で定義
}

export interface LispBuiltin {
  type: "builtin";
  name: string;
  fn: Function;
}

/**
 * トークンの型定義
 */
interface Token {
  type: "LPAREN" | "RPAREN" | "SYMBOL" | "NUMBER" | "STRING" | "KEYWORD" | "QUOTE" | "EOF";
  value: string;
  position: number;
}

/**
 * S式パーサー
 */
export class SExpressionParser {
  private input: string = "";
  private position: number = 0;
  private current: number = 0;

  /**
   * S式文字列を解析してLispValueに変換
   */
  parse(input: string): LispValue[] {
    this.input = input.trim();
    this.position = 0;
    this.current = 0;

    if (this.input.length === 0) {
      return [];
    }

    const results: LispValue[] = [];
    
    while (this.current < this.input.length) {
      this.skipWhitespace();
      this.skipComments();
      
      if (this.current >= this.input.length) {
        break;
      }
      
      const expr = this.parseExpression();
      results.push(expr);
      
      this.skipWhitespace();
      this.skipComments();
    }

    return results;
  }

  /**
   * 単一の式を解析
   */
  private parseExpression(): LispValue {
    this.skipWhitespace();

    if (this.current >= this.input.length) {
      throw new Error("Unexpected end of input");
    }

    const char = this.input[this.current];

    switch (char) {
      case "(":
        return this.parseList();
      case "'":
        return this.parseQuote();
      case '"':
        return this.parseString();
      case ":":
        return this.parseKeyword();
      default:
        if (this.isDigit(char) || (char === "-" && this.isDigit(this.peek()))) {
          return this.parseNumber();
        } else if (this.isSymbolChar(char)) {
          return this.parseSymbol();
        } else {
          throw new Error(`Unexpected character '${char}' at position ${this.current}`);
        }
    }
  }

  /**
   * リストを解析 "(element1 element2 ...)"
   */
  private parseList(): LispValue[] {
    this.current++; // '(' をスキップ
    const elements: LispValue[] = [];

    this.skipWhitespace();

    // 空リストのチェック
    if (this.current < this.input.length && this.input[this.current] === ")") {
      this.current++; // ')' をスキップ
      return elements;
    }

    // 要素を解析
    while (this.current < this.input.length) {
      this.skipWhitespace();
      this.skipComments();

      if (this.current >= this.input.length) {
        throw new Error("Unclosed list: missing ')'");
      }

      if (this.input[this.current] === ")") {
        this.current++; // ')' をスキップ
        return elements;
      }

      elements.push(this.parseExpression());
    }

    throw new Error("Unclosed list: missing ')'");
  }

  /**
   * クォートを解析 "'expression"
   */
  private parseQuote(): LispQuote {
    this.current++; // "'" をスキップ
    const value = this.parseExpression();
    return { type: "quote", value };
  }

  /**
   * 文字列を解析 "\"text\""
   */
  private parseString(): string {
    this.current++; // 開始の '"' をスキップ
    let value = "";

    while (this.current < this.input.length) {
      const char = this.input[this.current];

      if (char === '"') {
        this.current++; // 終了の '"' をスキップ
        return value;
      }

      if (char === "\\") {
        this.current++; // エスケープ文字をスキップ
        if (this.current >= this.input.length) {
          throw new Error("Unterminated string: unexpected end of input");
        }
        
        const escaped = this.input[this.current];
        switch (escaped) {
          case "n":
            value += "\n";
            break;
          case "t":
            value += "\t";
            break;
          case "r":
            value += "\r";
            break;
          case "\\":
            value += "\\";
            break;
          case '"':
            value += '"';
            break;
          default:
            value += escaped;
        }
      } else {
        value += char;
      }

      this.current++;
    }

    throw new Error("Unterminated string: missing closing quote");
  }

  /**
   * キーワードを解析 ":keyword"
   */
  private parseKeyword(): LispKeyword {
    this.current++; // ':' をスキップ
    const value = this.readSymbolChars();
    
    if (value.length === 0) {
      throw new Error("Empty keyword");
    }

    return { type: "keyword", value };
  }

  /**
   * 数値を解析
   */
  private parseNumber(): number {
    let value = "";

    // 負号の処理
    if (this.input[this.current] === "-") {
      value += "-";
      this.current++;
    }

    // 整数部分
    while (this.current < this.input.length && this.isDigit(this.input[this.current])) {
      value += this.input[this.current];
      this.current++;
    }

    // 小数点の処理
    if (this.current < this.input.length && this.input[this.current] === ".") {
      value += ".";
      this.current++;

      // 小数部分
      while (this.current < this.input.length && this.isDigit(this.input[this.current])) {
        value += this.input[this.current];
        this.current++;
      }
    }

    const result = parseFloat(value);
    if (isNaN(result)) {
      throw new Error(`Invalid number: ${value}`);
    }

    return result;
  }

  /**
   * シンボルを解析
   */
  private parseSymbol(): LispSymbol {
    const value = this.readSymbolChars();
    
    if (value.length === 0) {
      throw new Error("Empty symbol");
    }

    return { type: "symbol", value };
  }

  /**
   * シンボル文字列を読み取り
   */
  private readSymbolChars(): string {
    let value = "";

    while (this.current < this.input.length) {
      const char = this.input[this.current];

      if (this.isSymbolChar(char)) {
        value += char;
        this.current++;
      } else {
        break;
      }
    }

    return value;
  }

  /**
   * 空白文字をスキップ
   */
  private skipWhitespace(): void {
    while (this.current < this.input.length) {
      const char = this.input[this.current];
      if (char === " " || char === "\t" || char === "\n" || char === "\r") {
        this.current++;
      } else {
        break;
      }
    }
  }

  /**
   * コメントをスキップ
   */
  private skipComments(): void {
    while (this.current < this.input.length && this.input[this.current] === ';') {
      // 行末まで読み飛ばす
      while (this.current < this.input.length && this.input[this.current] !== '\n') {
        this.current++;
      }
      // 改行文字も読み飛ばす
      if (this.current < this.input.length && this.input[this.current] === '\n') {
        this.current++;
      }
      this.skipWhitespace();
    }
  }

  /**
   * 次の文字を先読み（現在位置は移動しない）
   */
  private peek(): string {
    if (this.current + 1 >= this.input.length) {
      return "";
    }
    return this.input[this.current + 1];
  }

  /**
   * 数字かどうかをチェック
   */
  private isDigit(char: string): boolean {
    return char >= "0" && char <= "9";
  }

  /**
   * シンボルに使用可能な文字かどうかをチェック
   */
  private isSymbolChar(char: string): boolean {
    if (char >= "a" && char <= "z") return true;
    if (char >= "A" && char <= "Z") return true;
    if (char >= "0" && char <= "9") return true;
    
    // Lispシンボルでよく使われる特殊文字
    const specialChars = "-+*/_=<>!?&%$#@";
    return specialChars.includes(char);
  }
}