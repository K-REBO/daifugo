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
    while (this.position < this.length && /\s/.test(this.input[this.position])) {
      this.advance();
    }
  }

  readNumber() {
    let num = '';
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
      str += this.input[this.position];
      this.advance();
    }
    this.advance(); // Skip closing quote
    return str;
  }

  readSymbol() {
    let symbol = '';
    while (this.position < this.length && 
           /[a-zA-Z0-9_+\-*/<>=?]/.test(this.input[this.position])) {
      symbol += this.input[this.position];
      this.advance();
    }
    return symbol;
  }

  readAtom() {
    this.skipWhitespace();
    const ch = this.peek();
    
    if (ch === null) return null;
    
    if (ch === '"') {
      return this.readString();
    }
    
    if (/[0-9]/.test(ch)) {
      return this.readNumber();
    }
    
    return this.readSymbol();
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
      } else {
        const atom = this.readAtom();
        if (atom !== null) {
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

module.exports = { parse };