/**
 * Pure Lisp Environment Abstraction Layer
 * 
 * This module provides environment-independent implementations of operations
 * that would normally depend on JavaScript built-ins.
 */

// Environment Interface Definition
class EnvironmentInterface {
  // Logging operations
  debug(message) { throw new Error('debug() must be implemented'); }
  error(message) { throw new Error('error() must be implemented'); }
  warn(message) { throw new Error('warn() must be implemented'); }
  
  // Time operations
  now() { throw new Error('now() must be implemented'); }
  
  // Data structure operations
  isArray(obj) { throw new Error('isArray() must be implemented'); }
  freeze(obj) { throw new Error('freeze() must be implemented'); }
  keys(obj) { throw new Error('keys() must be implemented'); }
  
  // Serialization operations
  stringify(obj) { throw new Error('stringify() must be implemented'); }
}

// JavaScript Environment Implementation
class JavaScriptEnvironment extends EnvironmentInterface {
  debug(message) { 
    if (typeof console !== 'undefined' && console.debug) {
      console.debug(message);
    }
  }
  
  error(message) {
    if (typeof console !== 'undefined' && console.error) {
      console.error(message);
    }
  }
  
  warn(message) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(message);
    }
  }
  
  now() {
    return typeof Date !== 'undefined' ? Date.now() : 0;
  }
  
  isArray(obj) {
    return Array.isArray(obj);
  }
  
  freeze(obj) {
    if (typeof Object !== 'undefined' && Object.freeze) {
      return Object.freeze(obj);
    }
    // For pure environments, return the object as-is (immutability handled differently)
    return obj;
  }
  
  keys(obj) {
    if (typeof Object !== 'undefined' && Object.keys) {
      return Object.keys(obj);
    }
    // Fallback for pure Lisp environments
    const keys = [];
    for (const key in obj) {
      if (obj.hasOwnProperty && obj.hasOwnProperty(key)) {
        keys.push(key);
      }
    }
    return keys;
  }
  
  stringify(obj) {
    if (typeof JSON !== 'undefined' && JSON.stringify) {
      return JSON.stringify(obj);
    }
    // Simple fallback serialization
    return String(obj);
  }
}

// Pure Lisp Environment Implementation (No JS Dependencies)
class PureLispEnvironment extends EnvironmentInterface {
  constructor() {
    super();
    this.logBuffer = [];
    this.timeCounter = 0;
  }
  
  debug(message) {
    // Store debug messages in buffer instead of using console
    this.logBuffer.push({ type: 'debug', message, timestamp: this.timeCounter++ });
  }
  
  error(message) {
    this.logBuffer.push({ type: 'error', message, timestamp: this.timeCounter++ });
    // In pure environment, we might want to throw or handle differently
    throw new Error(message);
  }
  
  warn(message) {
    this.logBuffer.push({ type: 'warn', message, timestamp: this.timeCounter++ });
  }
  
  now() {
    // Return logical time instead of real time
    return this.timeCounter++;
  }
  
  isArray(obj) {
    return Array.isArray(obj);
  }
  
  freeze(obj) {
    // In pure Lisp, we simulate immutability by copying
    if (this.isArray(obj)) {
      return [...obj]; // Shallow copy for arrays
    }
    if (obj && typeof obj === 'object') {
      return { ...obj }; // Shallow copy for objects
    }
    return obj; // Primitives are already immutable
  }
  
  keys(obj) {
    if (!obj || typeof obj !== 'object') return [];
    
    const keys = [];
    for (const key in obj) {
      keys.push(key);
    }
    return keys;
  }
  
  stringify(obj) {
    // Pure Lisp serialization
    if (obj === null) return 'nil';
    if (obj === undefined) return 'nil';
    if (typeof obj === 'string') return `"${obj}"`;
    if (typeof obj === 'number') return String(obj);
    if (typeof obj === 'boolean') return obj ? 't' : 'nil';
    
    if (this.isArray(obj)) {
      return '(' + obj.map(item => this.stringify(item)).join(' ') + ')';
    }
    
    if (typeof obj === 'object') {
      const pairs = this.keys(obj).map(key => `${key} ${this.stringify(obj[key])}`);
      return '{' + pairs.join(' ') + '}';
    }
    
    return String(obj);
  }
  
  // Additional pure Lisp operations
  getLogs() {
    return [...this.logBuffer];
  }
  
  clearLogs() {
    this.logBuffer = [];
  }
  
  getLogicalTime() {
    return this.timeCounter;
  }
}

// Mock Environment for Testing
class MockEnvironment extends EnvironmentInterface {
  constructor() {
    super();
    this.operations = [];
  }
  
  debug(message) { this.operations.push({ op: 'debug', args: [message] }); }
  error(message) { this.operations.push({ op: 'error', args: [message] }); }
  warn(message) { this.operations.push({ op: 'warn', args: [message] }); }
  now() { this.operations.push({ op: 'now', args: [] }); return 42; }
  isArray(obj) { this.operations.push({ op: 'isArray', args: [obj] }); return Array.isArray(obj); }
  freeze(obj) { this.operations.push({ op: 'freeze', args: [obj] }); return obj; }
  keys(obj) { this.operations.push({ op: 'keys', args: [obj] }); return Object.keys(obj); }
  stringify(obj) { this.operations.push({ op: 'stringify', args: [obj] }); return JSON.stringify(obj); }
  
  getOperations() { return [...this.operations]; }
  clearOperations() { this.operations = []; }
}

// Environment Factory
class EnvironmentFactory {
  static createJavaScript() {
    return new JavaScriptEnvironment();
  }
  
  static createPureLisp() {
    return new PureLispEnvironment();
  }
  
  static createMock() {
    return new MockEnvironment();
  }
  
  static detect() {
    // Auto-detect environment capabilities
    if (typeof console !== 'undefined' && typeof Date !== 'undefined' && typeof JSON !== 'undefined') {
      return this.createJavaScript();
    } else {
      return this.createPureLisp();
    }
  }
}

module.exports = {
  EnvironmentInterface,
  JavaScriptEnvironment,
  PureLispEnvironment,
  MockEnvironment,
  EnvironmentFactory
};