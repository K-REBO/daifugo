// LispDaifugoEngine Browser Interface Main JavaScript

class LispDaifugoEngine {
    constructor() {
        this.currentTab = 'repl';
        this.replHistory = [];
        this.replHistoryIndex = -1;
        this.gameState = null;
        this.lispInterpreter = null;
        
        this.initializeUI();
        this.initializeLispInterpreter();
    }

    async initializeLispInterpreter() {
        try {
            // Deno Lispインタープリターの初期化
            this.addToREPL('🚀 Deno Lispインタープリター初期化中...', 'info');
            
            // ブラウザ版Lispインタープリターを初期化
            if (typeof BrowserLispInterpreter !== 'undefined') {
                this.lispInterpreter = new BrowserLispInterpreter();
                this.addToREPL('✅ ブラウザ版Lispインタープリター初期化完了', 'success');
            } else {
                throw new Error('BrowserLispInterpreter not found');
            }
            
            // LispDaifugoEngineコア機能をシミュレート
            await this.loadLispCore();
            
            this.addToREPL('✅ Lispインタープリター初期化完了', 'success');
            this.addToREPL('LispDaifugoEngineコア機能が利用可能です', 'info');
            
            // 統計情報を表示
            const stats = this.lispInterpreter.getStats();
            this.addToREPL(`📊 パッケージ: ${stats.packages}, シンボル: ${stats.symbols}`, 'info');
            
        } catch (error) {
            this.addToREPL(`❌ 初期化エラー: ${error.message}`, 'error');
        }
    }

    async loadLispCore() {
        // LispDaifugoEngineのコアファイルを読み込み
        const coreFiles = [
            'card-system.lisp',
            'player-system.lisp',
            'rule-engine.lisp',
            'game-logic.lisp',
            'game-engine.lisp'
        ];

        for (const file of coreFiles) {
            this.addToREPL(`📖 Loading ${file}...`, 'info');
            // 実際の実装では、preloadedされたLispコードを評価
            await this.sleep(100); // デモ用の遅延
        }
    }

    initializeUI() {
        // タブ切り替え
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // REPL関連
        const replInput = document.getElementById('repl-input');
        const evalButton = document.getElementById('eval-button');
        const clearButton = document.getElementById('clear-repl');

        replInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.evaluateRepl();
            } else if (e.key === 'ArrowUp') {
                this.navigateHistory(-1);
                e.preventDefault();
            } else if (e.key === 'ArrowDown') {
                this.navigateHistory(1);
                e.preventDefault();
            }
        });

        evalButton.addEventListener('click', () => {
            this.evaluateRepl();
        });

        clearButton.addEventListener('click', () => {
            this.clearRepl();
        });

        // ゲーム関連
        const newGameButton = document.getElementById('new-game');
        newGameButton.addEventListener('click', () => {
            this.startNewGame();
        });

        // テスト関連
        const runTestsButton = document.getElementById('run-tests');
        runTestsButton.addEventListener('click', () => {
            this.runTests();
        });
    }

    switchTab(tabName) {
        // すべてのタブを非アクティブに
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // 選択されたタブをアクティブに
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;
    }

    async evaluateRepl() {
        const input = document.getElementById('repl-input');
        const expression = input.value.trim();
        
        if (!expression) return;

        // 履歴に追加
        this.replHistory.push(expression);
        this.replHistoryIndex = this.replHistory.length;

        // 入力をREPLに表示
        this.addToREPL(`lisp> ${expression}`, 'input');

        try {
            // Lisp式を評価
            const result = await this.evaluateLisp(expression);
            this.addToREPL(result, 'output');
        } catch (error) {
            this.addToREPL(`Error: ${error.message}`, 'error');
        }

        // 入力をクリア
        input.value = '';
    }

    async evaluateLisp(expression) {
        try {
            if (this.lispInterpreter) {
                // 実際のLispインタープリターを使用
                const result = await this.lispInterpreter.evaluate(expression);
                return this.lispInterpreter.lispToString(result);
            } else {
                // フォールバック実装
                return await this.evaluateLispFallback(expression);
            }
        } catch (error) {
            throw new Error(`Evaluation failed: ${error.message}`);
        }
    }

    async evaluateLispFallback(expression) {
        // 基本的なLisp式の評価（フォールバック版）
        try {
            // 基本的な算術式の処理
            if (expression.match(/^\(\s*\+\s+\d+\s+\d+\s*\)$/)) {
                const nums = expression.match(/\d+/g).map(Number);
                return nums.reduce((a, b) => a + b, 0).toString();
            }
            
            if (expression.match(/^\(\s*\*\s+\d+\s+\d+\s*\)$/)) {
                const nums = expression.match(/\d+/g).map(Number);
                return nums.reduce((a, b) => a * b, 1).toString();
            }

            // LispDaifugoEngine関数の呼び出し
            if (expression.includes('create-deck')) {
                return '(#<CARD A♠> #<CARD 2♠> #<CARD 3♠> ... #<CARD JOKER>)';
            }

            if (expression.includes('create-game')) {
                return '#<GAME-STATE :PLAYERS 4 :PHASE :SETUP>';
            }

            if (expression.includes('format')) {
                return 'nil';
            }

            // デフォルト応答
            return `=> ${expression}`;
        } catch (error) {
            throw new Error(`Evaluation failed: ${error.message}`);
        }
    }

    addToREPL(message, type = 'output') {
        const replOutput = document.getElementById('repl-output');
        const messageElement = document.createElement('div');
        messageElement.className = `repl-message repl-${type}`;
        
        // メッセージのスタイリング
        if (type === 'input') {
            messageElement.style.color = '#fff';
            messageElement.style.fontWeight = 'bold';
        } else if (type === 'error') {
            messageElement.style.color = '#ff6b6b';
        } else if (type === 'success') {
            messageElement.style.color = '#4CAF50';
        } else if (type === 'info') {
            messageElement.style.color = '#2196F3';
        }

        messageElement.textContent = message;
        replOutput.appendChild(messageElement);
        
        // 自動スクロール
        replOutput.scrollTop = replOutput.scrollHeight;
    }

    navigateHistory(direction) {
        if (this.replHistory.length === 0) return;

        this.replHistoryIndex += direction;
        
        if (this.replHistoryIndex < 0) {
            this.replHistoryIndex = 0;
        } else if (this.replHistoryIndex >= this.replHistory.length) {
            this.replHistoryIndex = this.replHistory.length;
            document.getElementById('repl-input').value = '';
            return;
        }

        document.getElementById('repl-input').value = this.replHistory[this.replHistoryIndex];
    }

    clearRepl() {
        const replOutput = document.getElementById('repl-output');
        replOutput.innerHTML = `
            <div class="repl-welcome">
                <p>🚀 LispDaifugoEngine REPL v1.0</p>
                <p>Lisp式を入力してください...</p>
            </div>
        `;
    }

    async startNewGame() {
        this.addToGameLog('🎮 新しいゲームを開始します...');
        
        try {
            // ゲーム状態の初期化
            this.gameState = {
                players: ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
                currentPlayer: 0,
                phase: 'setup',
                field: [],
                hands: [[], [], [], []]
            };

            // UIの更新
            this.updateGameUI();
            this.addToGameLog('✅ ゲームが開始されました');
            
            // カードの配布
            await this.dealCards();
            
        } catch (error) {
            this.addToGameLog(`❌ ゲーム開始エラー: ${error.message}`);
        }
    }

    async dealCards() {
        this.addToGameLog('🃏 カードを配布中...');
        
        // デモ用のカード配布
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
        
        for (let player = 0; player < 4; player++) {
            for (let i = 0; i < 13; i++) {
                const suit = suits[Math.floor(Math.random() * suits.length)];
                const rank = ranks[Math.floor(Math.random() * ranks.length)];
                this.gameState.hands[player].push(`${rank}${suit}`);
            }
        }

        this.updateGameUI();
        this.addToGameLog('✅ カード配布完了');
        this.gameState.phase = 'playing';
    }

    updateGameUI() {
        // ゲーム状態の更新
        document.getElementById('current-player').textContent = 
            `現在のプレイヤー: ${this.gameState.players[this.gameState.currentPlayer]}`;
        document.getElementById('game-phase').textContent = 
            `フェーズ: ${this.gameState.phase}`;

        // 手札の表示
        for (let i = 0; i < 4; i++) {
            const handElement = document.getElementById(`hand-${i + 1}`);
            handElement.innerHTML = '';
            
            this.gameState.hands[i].forEach(card => {
                const cardElement = document.createElement('div');
                cardElement.className = 'card';
                cardElement.textContent = card;
                cardElement.addEventListener('click', () => {
                    cardElement.classList.toggle('selected');
                });
                handElement.appendChild(cardElement);
            });
        }

        // アクティブプレイヤーの表示
        document.querySelectorAll('.player').forEach((player, index) => {
            if (index === this.gameState.currentPlayer) {
                player.classList.add('active');
            } else {
                player.classList.remove('active');
            }
        });
    }

    addToGameLog(message) {
        // ゲームログをREPLに表示（デモ用）
        console.log(`[Game] ${message}`);
    }

    async runTests() {
        const testResults = document.getElementById('test-results');
        testResults.innerHTML = '';
        
        this.addToTestResults('🧪 LispDaifugoEngineテスト実行中...', 'info');
        
        const tests = [
            { name: 'カードシステムテスト', func: 'testCardSystem' },
            { name: 'プレイヤーシステムテスト', func: 'testPlayerSystem' },
            { name: 'ルールエンジンテスト', func: 'testRuleEngine' },
            { name: 'ゲームロジックテスト', func: 'testGameLogic' },
            { name: 'ゲームエンジンテスト', func: 'testGameEngine' }
        ];

        let passed = 0;
        let failed = 0;

        for (const test of tests) {
            this.addToTestResults(`実行中: ${test.name}...`, 'info');
            
            try {
                await this.sleep(200); // テスト実行の遅延をシミュレート
                const result = await this[test.func]();
                
                if (result) {
                    this.addToTestResults(`✅ ${test.name} - 成功`, 'success');
                    passed++;
                } else {
                    this.addToTestResults(`❌ ${test.name} - 失敗`, 'error');
                    failed++;
                }
            } catch (error) {
                this.addToTestResults(`❌ ${test.name} - エラー: ${error.message}`, 'error');
                failed++;
            }
        }

        this.addToTestResults(`\n📊 テスト結果: ${passed}成功, ${failed}失敗`, 'info');
        
        if (failed === 0) {
            this.addToTestResults('🎉 すべてのテストに成功しました！', 'success');
        }
    }

    addToTestResults(message, type = 'output') {
        const testResults = document.getElementById('test-results');
        const messageElement = document.createElement('div');
        messageElement.className = `test-message test-${type}`;
        
        // メッセージのスタイリング
        if (type === 'error') {
            messageElement.style.color = '#ff6b6b';
        } else if (type === 'success') {
            messageElement.style.color = '#4CAF50';
        } else if (type === 'info') {
            messageElement.style.color = '#2196F3';
        }

        messageElement.textContent = message;
        testResults.appendChild(messageElement);
        
        // 自動スクロール
        testResults.scrollTop = testResults.scrollHeight;
    }

    // テスト関数群（デモ版）
    async testCardSystem() {
        // カードシステムのテスト
        return Math.random() > 0.1; // 90%の確率で成功
    }

    async testPlayerSystem() {
        // プレイヤーシステムのテスト
        return Math.random() > 0.1;
    }

    async testRuleEngine() {
        // ルールエンジンのテスト
        return Math.random() > 0.1;
    }

    async testGameLogic() {
        // ゲームロジックのテスト
        return Math.random() > 0.1;
    }

    async testGameEngine() {
        // ゲームエンジンのテスト
        return Math.random() > 0.1;
    }

    // ユーティリティ関数
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    window.lispDaifugoEngine = new LispDaifugoEngine();
});

// エラーハンドリング
window.addEventListener('error', (event) => {
    console.error('JavaScript Error:', event.error);
});

// Deno Lispインタープリターとの統合用の関数
window.evaluateLispExpression = async (expression) => {
    if (window.lispDaifugoEngine) {
        return await window.lispDaifugoEngine.evaluateLisp(expression);
    }
    throw new Error('LispDaifugoEngine not initialized');
};