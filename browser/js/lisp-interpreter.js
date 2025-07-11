// Deno Lisp Interpreter Browser Integration
// DenoのLispインタープリターをブラウザで動作させるための統合層

class BrowserLispInterpreter {
    constructor() {
        this.packages = new Map();
        this.currentPackage = 'common-lisp-user';
        this.globalEnv = new Map();
        this.structs = new Map();
        this.loadedFiles = new Set();
        
        this.initializeBuiltins();
        this.initializePackages();
    }

    initializeBuiltins() {
        // 基本的な算術演算
        this.globalEnv.set('+', (...args) => args.reduce((a, b) => a + b, 0));
        this.globalEnv.set('-', (...args) => args.length === 1 ? -args[0] : args.reduce((a, b) => a - b));
        this.globalEnv.set('*', (...args) => args.reduce((a, b) => a * b, 1));
        this.globalEnv.set('/', (...args) => args.reduce((a, b) => a / b));
        
        // 比較演算
        this.globalEnv.set('=', (a, b) => a === b);
        this.globalEnv.set('<', (a, b) => a < b);
        this.globalEnv.set('>', (a, b) => a > b);
        this.globalEnv.set('<=', (a, b) => a <= b);
        this.globalEnv.set('>=', (a, b) => a >= b);
        
        // リスト操作
        this.globalEnv.set('list', (...args) => args);
        this.globalEnv.set('length', (arr) => Array.isArray(arr) ? arr.length : 0);
        this.globalEnv.set('car', (arr) => Array.isArray(arr) && arr.length > 0 ? arr[0] : null);
        this.globalEnv.set('cdr', (arr) => Array.isArray(arr) && arr.length > 0 ? arr.slice(1) : []);
        
        // 型チェック
        this.globalEnv.set('symbolp', (val) => typeof val === 'string' && val.startsWith(':'));
        this.globalEnv.set('numberp', (val) => typeof val === 'number');
        this.globalEnv.set('stringp', (val) => typeof val === 'string');
        
        // 出力
        this.globalEnv.set('format', (stream, fmt, ...args) => {
            let result = fmt;
            args.forEach(arg => {
                result = result.replace(/~A/, this.lispToString(arg));
            });
            result = result.replace(/~%/g, '\n');
            
            if (stream === true || stream === 't') {
                console.log(result);
                return null;
            }
            return result;
        });
    }

    initializePackages() {
        // 基本パッケージの設定
        this.packages.set('common-lisp-user', {
            name: 'common-lisp-user',
            exports: new Set(),
            symbols: new Map()
        });
        
        this.packages.set('daifugo-card-system', {
            name: 'daifugo-card-system',
            exports: new Set(['create-card', 'create-deck', 'shuffle-deck', 'card-rank', 'card-suit']),
            symbols: new Map()
        });
        
        this.packages.set('daifugo-player-system', {
            name: 'daifugo-player-system',
            exports: new Set(['create-players', 'add-card-to-hand', 'remove-card-from-hand']),
            symbols: new Map()
        });
        
        this.packages.set('daifugo-game-engine', {
            name: 'daifugo-game-engine',
            exports: new Set(['create-game', 'start-game', 'play-card', 'pass-turn']),
            symbols: new Map()
        });
    }

    async evaluate(expression) {
        try {
            const parsed = this.parse(expression);
            return await this.evaluateExpression(parsed);
        } catch (error) {
            throw new Error(`Evaluation error: ${error.message}`);
        }
    }

    parse(expression) {
        // 簡単なS式パーサー
        const tokens = this.tokenize(expression);
        return this.parseTokens(tokens);
    }

    tokenize(expression) {
        const tokens = [];
        let current = '';
        let inString = false;
        
        for (let i = 0; i < expression.length; i++) {
            const char = expression[i];
            
            if (char === '"' && !inString) {
                inString = true;
                current += char;
            } else if (char === '"' && inString) {
                inString = false;
                current += char;
            } else if (inString) {
                current += char;
            } else if (char === '(' || char === ')') {
                if (current.trim()) {
                    tokens.push(current.trim());
                    current = '';
                }
                tokens.push(char);
            } else if (char === ' ' || char === '\t' || char === '\n') {
                if (current.trim()) {
                    tokens.push(current.trim());
                    current = '';
                }
            } else {
                current += char;
            }
        }
        
        if (current.trim()) {
            tokens.push(current.trim());
        }
        
        return tokens;
    }

    parseTokens(tokens) {
        if (tokens.length === 0) return null;
        
        const token = tokens.shift();
        
        if (token === '(') {
            const expr = [];
            while (tokens.length > 0 && tokens[0] !== ')') {
                expr.push(this.parseTokens(tokens));
            }
            tokens.shift(); // remove ')'
            return expr;
        } else if (token === ')') {
            throw new Error('Unexpected )');
        } else {
            return this.parseAtom(token);
        }
    }

    parseAtom(token) {
        // 数値
        if (!isNaN(token)) {
            return parseFloat(token);
        }
        
        // 文字列
        if (token.startsWith('"') && token.endsWith('"')) {
            return token.slice(1, -1);
        }
        
        // キーワード
        if (token.startsWith(':')) {
            return token;
        }
        
        // シンボル
        return token;
    }

    async evaluateExpression(expr) {
        if (expr === null || expr === undefined) {
            return null;
        }
        
        // リテラル値
        if (typeof expr === 'number' || typeof expr === 'string') {
            return expr;
        }
        
        // シンボル
        if (typeof expr === 'string') {
            if (this.globalEnv.has(expr)) {
                return this.globalEnv.get(expr);
            }
            throw new Error(`Undefined symbol: ${expr}`);
        }
        
        // リスト（関数呼び出し）
        if (Array.isArray(expr)) {
            if (expr.length === 0) {
                return [];
            }
            
            const [operator, ...args] = expr;
            
            // 特殊フォーム
            if (operator === 'quote') {
                return args[0];
            }
            
            if (operator === 'if') {
                const [condition, thenExpr, elseExpr] = args;
                const condResult = await this.evaluateExpression(condition);
                return condResult ? await this.evaluateExpression(thenExpr) : await this.evaluateExpression(elseExpr);
            }
            
            if (operator === 'defun') {
                const [name, params, body] = args;
                const func = async (...callArgs) => {
                    const localEnv = new Map(this.globalEnv);
                    params.forEach((param, i) => {
                        localEnv.set(param, callArgs[i]);
                    });
                    return await this.evaluateWithEnv(body, localEnv);
                };
                this.globalEnv.set(name, func);
                return name;
            }
            
            if (operator === 'let') {
                const [bindings, body] = args;
                const localEnv = new Map(this.globalEnv);
                
                for (const [name, value] of bindings) {
                    localEnv.set(name, await this.evaluateExpression(value));
                }
                
                return await this.evaluateWithEnv(body, localEnv);
            }
            
            // LispDaifugoEngine特有の関数
            if (operator === 'create-deck') {
                return this.createDeck();
            }
            
            if (operator === 'create-card') {
                const [rank, suit] = await Promise.all(args.map(arg => this.evaluateExpression(arg)));
                return this.createCard(rank, suit);
            }
            
            if (operator === 'create-game') {
                const [playerCount] = await Promise.all(args.map(arg => this.evaluateExpression(arg)));
                return this.createGame(playerCount);
            }
            
            // 通常の関数呼び出し
            const func = await this.evaluateExpression(operator);
            if (typeof func === 'function') {
                const evaluatedArgs = await Promise.all(args.map(arg => this.evaluateExpression(arg)));
                return await func(...evaluatedArgs);
            }
            
            throw new Error(`Cannot call ${operator}`);
        }
        
        return expr;
    }

    async evaluateWithEnv(expr, env) {
        const oldEnv = this.globalEnv;
        this.globalEnv = env;
        try {
            return await this.evaluateExpression(expr);
        } finally {
            this.globalEnv = oldEnv;
        }
    }

    // LispDaifugoEngine実装
    createDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
        const deck = [];
        
        for (const suit of suits) {
            for (const rank of ranks) {
                deck.push(this.createCard(rank, suit));
            }
        }
        
        // ジョーカー追加
        deck.push(this.createCard('JOKER', 'RED'));
        deck.push(this.createCard('JOKER', 'BLACK'));
        
        return deck;
    }

    createCard(rank, suit) {
        return {
            type: 'card',
            rank: rank,
            suit: suit,
            strength: this.calculateCardStrength(rank),
            toString: () => `${rank}${suit}`
        };
    }

    calculateCardStrength(rank) {
        const strengthMap = {
            '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '8': 6, '9': 7, '10': 8,
            'J': 9, 'Q': 10, 'K': 11, 'A': 12, '2': 13, 'JOKER': 14
        };
        return strengthMap[rank] || 0;
    }

    createGame(playerCount = 4) {
        return {
            type: 'game-state',
            players: Array(playerCount).fill().map((_, i) => ({
                id: i + 1,
                name: `Player ${i + 1}`,
                hand: [],
                rank: null
            })),
            currentPlayer: 0,
            field: [],
            deck: this.createDeck(),
            phase: 'setup',
            turnDirection: 1,
            revolutionActive: false,
            logs: []
        };
    }

    lispToString(value) {
        if (value === null || value === undefined) {
            return 'nil';
        }
        
        if (typeof value === 'string') {
            return value;
        }
        
        if (typeof value === 'number') {
            return value.toString();
        }
        
        if (Array.isArray(value)) {
            return '(' + value.map(v => this.lispToString(v)).join(' ') + ')';
        }
        
        if (typeof value === 'object' && value.type === 'card') {
            return `#<CARD ${value.rank}${value.suit}>`;
        }
        
        if (typeof value === 'object' && value.type === 'game-state') {
            return `#<GAME-STATE :PLAYERS ${value.players.length} :PHASE ${value.phase}>`;
        }
        
        return value.toString();
    }

    // パッケージ操作
    switchPackage(packageName) {
        if (this.packages.has(packageName)) {
            this.currentPackage = packageName;
            return packageName;
        }
        throw new Error(`Package ${packageName} not found`);
    }

    getCurrentPackage() {
        return this.currentPackage;
    }

    getStats() {
        return {
            packages: this.packages.size,
            symbols: this.globalEnv.size,
            structs: this.structs.size,
            loadedFiles: this.loadedFiles.size,
            currentPackage: this.currentPackage
        };
    }
}

// グローバルインスタンス
window.BrowserLispInterpreter = BrowserLispInterpreter;

// 使用例とテスト
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrowserLispInterpreter;
}