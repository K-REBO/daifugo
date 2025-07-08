class Symbol {
  constructor(name) {
    this.name = name;
  }
  
  toString() {
    return this.name;
  }
}

function sym(name) {
  return new Symbol(name);
}

module.exports = { Symbol, sym };