const { Symbol } = require('./symbol');

class Parser {
  constructor(input) {
    this.input = input;
    this.position = 0;
    this.length = input.length;
  }

  peek() {
    if (this.position >= this.length) return null;
    return this.input[this.position];
  }

  advance() {
    if (this.position < this.length) {
      this.position++;
    }
  }

  skipWhitespace() {
    while (this.position < this.length) {
      const ch = this.input[this.position];
      if (/\s/.test(ch)) {
        this.advance();
      } else if (ch === ';') {
        // Skip comment line
        while (this.position < this.length && this.input[this.position] !== '\n') {
          this.advance();
        }
      } else {
        break;
      }
    }
  }

  readNumber() {
    let num = '';
    // Handle negative sign
    if (this.input[this.position] === '-') {
      num += '-';
      this.advance();
    }
    while (this.position < this.length && /[0-9]/.test(this.input[this.position])) {
      num += this.input[this.position];
      this.advance();
    }
    return parseInt(num, 10);
  }

  readString() {
    let str = '';
    this.advance(); // Skip opening quote
    while (this.position < this.length && this.input[this.position] !== '"') {
      if (this.input[this.position] === '\\') {
        this.advance(); // Skip escape character
        if (this.position < this.length) {
          str += this.input[this.position];
          this.advance();
        }
      } else {
        str += this.input[this.position];
        this.advance();
      }
    }
    this.advance(); // Skip closing quote
    return str;
  }

  readSymbol() {
    let symbol = '';
    while (this.position < this.length && 
           /[a-zA-Z0-9_+\-*/<>=?!]/.test(this.input[this.position])) {
      symbol += this.input[this.position];
      this.advance();
    }
    return symbol;
  }

  readAtom() {
    this.skipWhitespace();
    const ch = this.peek();
    
    if (ch === null) return undefined; // End of input
    
    if (ch === '"') {
      return this.readString();
    }
    
    if (/[0-9]/.test(ch) || (ch === '-' && this.position + 1 < this.length && /[0-9]/.test(this.input[this.position + 1]))) {
      return this.readNumber();
    }
    
    const symbol = this.readSymbol();
    if (symbol === '') return undefined; // No valid symbol
    
    // Convert special literals
    if (symbol === 'nil' || symbol === 'null') return null;
    if (symbol === 't' || symbol === 'true') return true;
    if (symbol === 'false') return false;
    
    return new Symbol(symbol);
  }

  readList() {
    const list = [];
    this.advance(); // Skip opening paren
    
    while (true) {
      this.skipWhitespace();
      const ch = this.peek();
      
      if (ch === null) {
        throw new Error('Unmatched parentheses');
      }
      
      if (ch === ')') {
        this.advance();
        break;
      }
      
      if (ch === '(') {
        list.push(this.readList());
      } else if (ch === "'") {
        this.advance(); // Skip quote
        list.push(new Symbol('quote'));
        const expr = this.parseExpression();
        if (expr !== null) {
          list.push(expr);
        }
      } else {
        const atom = this.readAtom();
        // Always push atoms, including null (which represents nil in Lisp)
        if (atom !== undefined) {
          list.push(atom);
        }
      }
    }
    
    return list;
  }

  parseExpression() {
    this.skipWhitespace();
    const ch = this.peek();
    
    if (ch === null) return null;
    
    if (ch === '(') {
      return this.readList();
    }
    
    if (ch === ')') {
      throw new Error('Unmatched parentheses');
    }
    
    if (ch === "'") {
      this.advance(); // Skip quote
      const expr = this.parseExpression();
      return [new Symbol('quote'), expr];
    }
    
    return this.readAtom();
  }
}

function parse(input) {
  const parser = new Parser(input);
  const result = parser.parseExpression();
  
  parser.skipWhitespace();
  if (parser.position < parser.length) {
    throw new Error('Unmatched parentheses');
  }
  
  return result;
}

function parseMultipleExpressions(content) {
  const expressions = [];
  
  // Split content into lines and process each expression
  const lines = content.split('\n');
  let currentExpr = '';
  let parenCount = 0;
  let inString = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and comments
    if (line === '' || line.startsWith(';')) {
      continue;
    }
    
    // Add line to current expression
    if (currentExpr) {
      currentExpr += ' ' + line;
    } else {
      currentExpr = line;
    }
    
    // Count parentheses to determine if expression is complete
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (!inString) {
        if (char === '(') parenCount++;
        else if (char === ')') parenCount--;
        else if (char === '"') inString = true;
      } else {
        if (char === '"' && line[j-1] !== '\\') inString = false;
      }
    }
    
    // If parentheses are balanced, parse the expression
    if (parenCount === 0 && !inString && currentExpr) {
      try {
        const parser = new Parser(currentExpr);
        const expr = parser.parseExpression();
        expressions.push(expr);
      } catch (e) {
        console.error('Parse error:', e.message, 'in:', currentExpr.substring(0, 100) + '...');
      }
      currentExpr = '';
    }
  }
  
  return expressions;
}

module.exports = { parse, parseMultipleExpressions };