// ブラウザ用 Lisp インタープリター バンドル

// === 基本型定義 ===
class Environment {
    constructor(parent = null) {
        this.bindings = new Map();
        this.parent = parent;
    }

    define(name, value) {
        this.bindings.set(name, value);
    }

    get(name) {
        if (this.bindings.has(name)) {
            return this.bindings.get(name);
        }
        if (this.parent) {
            return this.parent.get(name);
        }
        throw new Error(`Undefined variable: ${name}`);
    }

    has(name) {
        return this.bindings.has(name) || (this.parent && this.parent.has(name));
    }
}

// === S式パーサー ===
class SExpressionParser {
    constructor() {
        this.tokens = [];
        this.position = 0;
    }

    parse(input) {
        if (typeof input !== 'string') {
            return input; // 既にパース済み
        }
        
        this.tokens = this.tokenize(input);
        this.position = 0;
        return this.parseExpression();
    }

    tokenize(input) {
        const tokens = [];
        let current = '';
        let inString = false;
        let escaped = false;

        for (let i = 0; i < input.length; i++) {
            const char = input[i];

            if (escaped) {
                current += char;
                escaped = false;
                continue;
            }

            if (char === '\\' && inString) {
                escaped = true;
                continue;
            }

            if (char === '"') {
                inString = !inString;
                current += char;
                continue;
            }

            if (inString) {
                current += char;
                continue;
            }

            if (char === '(' || char === ')' || char === "'") {
                if (current.trim()) {
                    tokens.push(current.trim());
                    current = '';
                }
                tokens.push(char);
            } else if (/\s/.test(char)) {
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

    parseExpression() {
        if (this.position >= this.tokens.length) {
            throw new Error('Unexpected end of input');
        }

        const token = this.tokens[this.position++];

        if (token === '(') {
            const list = [];
            while (this.position < this.tokens.length && this.tokens[this.position] !== ')') {
                list.push(this.parseExpression());
            }
            if (this.position >= this.tokens.length) {
                throw new Error('Missing closing parenthesis');
            }
            this.position++; // skip ')'
            return list;
        } else if (token === ')') {
            throw new Error('Unexpected closing parenthesis');
        } else if (token === "'") {
            // クォート処理
            const quotedExpr = this.parseExpression();
            return { type: 'quote', value: quotedExpr };
        } else {
            return this.parseAtom(token);
        }
    }

    parseAtom(token) {
        // 数値
        if (/^-?\d+(\.\d+)?$/.test(token)) {
            return parseFloat(token);
        }

        // 文字列
        if (token.startsWith('"') && token.endsWith('"')) {
            return token.slice(1, -1);
        }

        // キーワード
        if (token.startsWith(':')) {
            return { type: 'keyword', value: token };
        }


        // シンボル
        return { type: 'symbol', value: token };
    }
}

// === 基本評価器 ===
class BasicEvaluator {
    constructor() {
        this.globalEnv = new Environment();
        this.initializeBuiltins();
    }

    initializeBuiltins() {
        // 基本値
        this.globalEnv.define('nil', null);
        this.globalEnv.define('t', true);
        
        // 算術演算
        this.globalEnv.define('+', { type: 'builtin', fn: this.add.bind(this) });
        this.globalEnv.define('-', { type: 'builtin', fn: this.subtract.bind(this) });
        this.globalEnv.define('*', { type: 'builtin', fn: this.multiply.bind(this) });
        this.globalEnv.define('/', { type: 'builtin', fn: this.divide.bind(this) });

        // 比較演算
        this.globalEnv.define('>', { type: 'builtin', fn: this.greaterThan.bind(this) });
        this.globalEnv.define('<', { type: 'builtin', fn: this.lessThan.bind(this) });
        this.globalEnv.define('=', { type: 'builtin', fn: this.equal.bind(this) });

        // リスト操作
        this.globalEnv.define('list', { type: 'builtin', fn: this.list.bind(this) });
        this.globalEnv.define('cons', { type: 'builtin', fn: this.cons.bind(this) });
        this.globalEnv.define('car', { type: 'builtin', fn: this.car.bind(this) });
        this.globalEnv.define('cdr', { type: 'builtin', fn: this.cdr.bind(this) });
        this.globalEnv.define('make-list', { type: 'builtin', fn: this.makeList.bind(this) });
        this.globalEnv.define('reverse', { type: 'builtin', fn: this.reverse.bind(this) });

        // 制御構造
        this.globalEnv.define('if', { type: 'special', fn: this.evaluateIf.bind(this) });
        this.globalEnv.define('cond', { type: 'special', fn: this.evaluateCond.bind(this) });
        this.globalEnv.define('case', { type: 'special', fn: this.evaluateCase.bind(this) });

        // 定義
        this.globalEnv.define('defun', { type: 'special', fn: this.evaluateDefun.bind(this) });
        this.globalEnv.define('defvar', { type: 'special', fn: this.evaluateDefvar.bind(this) });
        this.globalEnv.define('defstruct', { type: 'special', fn: this.evaluateDefstruct.bind(this) });
        this.globalEnv.define('setf', { type: 'special', fn: this.evaluateSetf.bind(this) });

        // その他
        this.globalEnv.define('format', { type: 'builtin', fn: this.format.bind(this) });
        this.globalEnv.define('dotimes', { type: 'special', fn: this.evaluateDotimes.bind(this) });
        this.globalEnv.define('dolist', { type: 'special', fn: this.evaluateDolist.bind(this) });
        this.globalEnv.define('let', { type: 'special', fn: this.evaluateLet.bind(this) });
    }

    evaluate(expr, env = this.globalEnv) {
        if (expr === null || expr === undefined) {
            return null;
        }

        // 数値と文字列はそのまま返す
        if (typeof expr === 'number' || typeof expr === 'string') {
            return expr;
        }

        // シンボル
        if (expr && expr.type === 'symbol') {
            return env.get(expr.value);
        }

        // キーワード
        if (expr && expr.type === 'keyword') {
            return expr.value;
        }

        // クォート
        if (expr && expr.type === 'quote') {
            return expr.value;
        }

        // クォート演算子
        if (Array.isArray(expr) && expr.length === 2 && 
            expr[0] && expr[0].type === 'symbol' && expr[0].value === 'quote') {
            return expr[1];
        }

        // リスト（関数呼び出し）
        if (Array.isArray(expr)) {
            if (expr.length === 0) {
                return [];
            }

            const fn = this.evaluate(expr[0], env);
            const args = expr.slice(1);

            if (fn && fn.type === 'builtin') {
                const evaluatedArgs = args.map(arg => this.evaluate(arg, env));
                return fn.fn(evaluatedArgs);
            }

            if (fn && fn.type === 'special') {
                return fn.fn(args, env);
            }

            if (fn && fn.type === 'function') {
                const evaluatedArgs = args.map(arg => this.evaluate(arg, env));
                return this.callFunction(fn, evaluatedArgs);
            }

            throw new Error(`Not a function: ${JSON.stringify(fn)}`);
        }

        return expr;
    }

    // 算術演算
    add(args) {
        return args.reduce((sum, num) => sum + num, 0);
    }

    subtract(args) {
        if (args.length === 0) return 0;
        if (args.length === 1) return -args[0];
        return args.reduce((diff, num) => diff - num);
    }

    multiply(args) {
        return args.reduce((product, num) => product * num, 1);
    }

    divide(args) {
        if (args.length === 0) return 1;
        if (args.length === 1) return 1 / args[0];
        return args.reduce((quotient, num) => quotient / num);
    }

    // 比較演算
    greaterThan(args) {
        for (let i = 0; i < args.length - 1; i++) {
            if (args[i] <= args[i + 1]) return false;
        }
        return true;
    }

    lessThan(args) {
        for (let i = 0; i < args.length - 1; i++) {
            if (args[i] >= args[i + 1]) return false;
        }
        return true;
    }

    equal(args) {
        if (args.length < 2) return true;
        const first = args[0];
        return args.every(arg => arg === first);
    }

    // リスト操作
    list(args) {
        return args;
    }

    cons(args) {
        if (args.length !== 2) {
            throw new Error('cons requires exactly 2 arguments');
        }
        return [args[0], ...Array.isArray(args[1]) ? args[1] : [args[1]]];
    }

    car(args) {
        if (args.length !== 1 || !Array.isArray(args[0])) {
            throw new Error('car requires a list argument');
        }
        return args[0][0];
    }

    cdr(args) {
        if (args.length !== 1 || !Array.isArray(args[0])) {
            throw new Error('cdr requires a list argument');
        }
        return args[0].slice(1);
    }

    makeList(args) {
        const size = args[0] || 0;
        const element = args[1] !== undefined ? args[1] : null;
        return new Array(size).fill(element);
    }

    reverse(args) {
        if (args.length !== 1 || !Array.isArray(args[0])) {
            throw new Error('reverse requires a list argument');
        }
        return args[0].slice().reverse();
    }

    // 制御構造
    evaluateIf(args, env) {
        if (args.length < 2) {
            throw new Error('if requires at least 2 arguments');
        }
        
        const condition = this.evaluate(args[0], env);
        if (this.isTruthy(condition)) {
            return this.evaluate(args[1], env);
        } else if (args.length > 2) {
            return this.evaluate(args[2], env);
        }
        return null;
    }

    evaluateCond(args, env) {
        for (const clause of args) {
            if (!Array.isArray(clause) || clause.length === 0) continue;
            
            const condition = this.evaluate(clause[0], env);
            if (this.isTruthy(condition)) {
                if (clause.length === 1) {
                    return condition;
                }
                let result = null;
                for (let i = 1; i < clause.length; i++) {
                    result = this.evaluate(clause[i], env);
                }
                return result;
            }
        }
        return null;
    }

    evaluateCase(args, env) {
        if (args.length < 1) {
            throw new Error('case requires at least 1 argument');
        }

        const keyValue = this.evaluate(args[0], env);
        const clauses = args.slice(1);

        for (const clause of clauses) {
            if (!Array.isArray(clause) || clause.length < 2) continue;

            const keys = clause[0];
            const forms = clause.slice(1);

            // t または otherwise は常にマッチ
            if (keys && keys.type === 'symbol' && (keys.value === 't' || keys.value === 'otherwise')) {
                let result = null;
                for (const form of forms) {
                    result = this.evaluate(form, env);
                }
                return result;
            }

            // キーとのマッチをチェック
            let matches = false;
            if (Array.isArray(keys)) {
                matches = keys.some(key => this.lispEqual(keyValue, key));
            } else {
                matches = this.lispEqual(keyValue, keys);
            }

            if (matches) {
                let result = null;
                for (const form of forms) {
                    result = this.evaluate(form, env);
                }
                return result;
            }
        }

        return null;
    }

    // 定義
    evaluateDefun(args, env) {
        if (args.length < 3) {
            throw new Error('defun requires at least 3 arguments');
        }

        const nameArg = args[0];
        const params = args[1];
        const body = args.slice(2);

        if (!nameArg || nameArg.type !== 'symbol') {
            throw new Error('defun name must be a symbol');
        }

        const name = nameArg.value;
        const paramNames = [];

        if (Array.isArray(params)) {
            for (const param of params) {
                if (param && param.type === 'symbol') {
                    paramNames.push(param.value);
                }
            }
        }

        const fn = {
            type: 'function',
            params: paramNames,
            body: body,
            closure: env
        };

        env.define(name, fn);
        return { type: 'symbol', value: name };
    }

    evaluateDefvar(args, env) {
        if (args.length < 1) {
            throw new Error('defvar requires at least 1 argument');
        }

        const nameArg = args[0];
        if (!nameArg || nameArg.type !== 'symbol') {
            throw new Error('defvar name must be a symbol');
        }

        const name = nameArg.value;
        const value = args.length > 1 ? this.evaluate(args[1], env) : null;

        env.define(name, value);
        return { type: 'symbol', value: name };
    }

    evaluateDefstruct(args, env) {
        if (args.length < 1) {
            throw new Error('defstruct requires at least 1 argument');
        }

        const nameArg = args[0];
        if (!nameArg || nameArg.type !== 'symbol') {
            throw new Error('defstruct name must be a symbol');
        }

        const name = nameArg.value;
        const fields = args.slice(1).map(field => 
            field && field.type === 'symbol' ? field.value : field
        );

        // make-構造体名 関数を定義
        const makeFn = {
            type: 'builtin',
            fn: (args) => {
                const instance = { structName: name };
                for (let i = 0; i < args.length; i += 2) {
                    const key = args[i];
                    const value = args[i + 1];
                    if (key && typeof key === 'string' && key.startsWith(':')) {
                        instance[key.slice(1)] = value;
                    } else if (key && key.type === 'keyword') {
                        instance[key.value.slice(1)] = value;
                    }
                }
                return instance;
            }
        };

        env.define(`make-${name}`, makeFn);

        // アクセサ関数を定義
        fields.forEach(field => {
            const accessorFn = {
                type: 'builtin',
                fn: (args) => {
                    const obj = args[0];
                    return obj && obj[field] !== undefined ? obj[field] : null;
                }
            };
            env.define(`${name}-${field}`, accessorFn);
        });

        return { type: 'symbol', value: name };
    }

    evaluateSetf(args, env) {
        if (args.length !== 2) {
            throw new Error('setf requires exactly 2 arguments');
        }

        const place = args[0];
        const value = this.evaluate(args[1], env);

        if (place && place.type === 'symbol') {
            env.define(place.value, value);
            return value;
        }

        throw new Error('Invalid setf place');
    }

    // その他
    format(args) {
        if (args.length === 0) return '';
        
        let format = args[0];
        const values = args.slice(1);
        
        // 簡単なフォーマット処理
        format = format.replace(/~A/g, () => values.shift() || '');
        format = format.replace(/~%/g, '\n');
        
        return format;
    }

    evaluateDotimes(args, env) {
        if (args.length < 1) {
            throw new Error('dotimes requires at least 1 argument');
        }

        const spec = args[0];
        const body = args.slice(1);

        if (!Array.isArray(spec) || spec.length < 2) {
            throw new Error('dotimes requires (var count) specification');
        }

        const varName = spec[0] && spec[0].type === 'symbol' ? spec[0].value : null;
        const count = this.evaluate(spec[1], env);

        const newEnv = new Environment(env);
        let result = null;

        for (let i = 0; i < count; i++) {
            if (varName) {
                newEnv.define(varName, i);
            }
            for (const form of body) {
                result = this.evaluate(form, newEnv);
            }
        }

        return result;
    }

    evaluateDolist(args, env) {
        if (args.length < 1) {
            throw new Error('dolist requires at least 1 argument');
        }

        const spec = args[0];
        const body = args.slice(1);

        if (!Array.isArray(spec) || spec.length < 2) {
            throw new Error('dolist requires (var list) specification');
        }

        const varName = spec[0] && spec[0].type === 'symbol' ? spec[0].value : null;
        const list = this.evaluate(spec[1], env);

        if (!Array.isArray(list)) {
            throw new Error('dolist requires a list');
        }

        const newEnv = new Environment(env);
        let result = null;

        for (const item of list) {
            if (varName) {
                newEnv.define(varName, item);
            }
            for (const form of body) {
                result = this.evaluate(form, newEnv);
            }
        }

        return result;
    }

    evaluateLet(args, env) {
        if (args.length < 1) {
            throw new Error('let requires at least 1 argument');
        }

        const bindings = args[0];
        const body = args.slice(1);

        const newEnv = new Environment(env);

        if (Array.isArray(bindings)) {
            for (const binding of bindings) {
                if (Array.isArray(binding) && binding.length >= 1) {
                    const varName = binding[0] && binding[0].type === 'symbol' ? binding[0].value : null;
                    const value = binding.length > 1 ? this.evaluate(binding[1], env) : null;
                    if (varName) {
                        newEnv.define(varName, value);
                    }
                }
            }
        }

        let result = null;
        for (const form of body) {
            result = this.evaluate(form, newEnv);
        }

        return result;
    }

    // ヘルパー関数
    callFunction(fn, args) {
        if (fn.params.length !== args.length) {
            throw new Error(`Function expects ${fn.params.length} arguments, got ${args.length}`);
        }

        const newEnv = new Environment(fn.closure);
        for (let i = 0; i < fn.params.length; i++) {
            newEnv.define(fn.params[i], args[i]);
        }

        let result = null;
        for (const form of fn.body) {
            result = this.evaluate(form, newEnv);
        }

        return result;
    }

    isTruthy(value) {
        return value !== null && value !== false;
    }

    lispEqual(a, b) {
        if (a === b) return true;
        if (a && a.type === 'symbol' && b && b.type === 'symbol') {
            return a.value === b.value;
        }
        return false;
    }
}

// ブラウザ用エクスポート
window.BasicEvaluator = BasicEvaluator;
window.SExpressionParser = SExpressionParser;
window.Environment = Environment;

console.log('✅ Lisp Interpreter loaded successfully');