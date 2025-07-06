/**
 * Game Debug System
 * Records game state, player actions, and provides debugging tools
 */

class GameDebugSystem {
  constructor() {
    console.log('🔍 GameDebugSystem constructor called');
    this.gameHistory = [];
    this.currentSession = {
      sessionId: this.generateSessionId(),
      startTime: new Date().toISOString(),
      gameStates: [],
      playerActions: [],
      ruleEvents: [],
      errors: []
    };
    this.isRecording = false;
    
    console.log('🔍 Setting up debug UI...');
    this.setupUI();
    console.log('🔍 GameDebugSystem constructor complete');
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return 'debug_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Setup debug UI
   */
  setupUI() {
    console.log('🔍 Setting up debug UI...');
    
    // Ensure DOM is ready before creating UI elements
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => this.createUIElements(), 500);
      });
    } else {
      setTimeout(() => this.createUIElements(), 100);
    }
  }

  /**
   * Create UI elements
   */
  createUIElements() {
    console.log('🔍 Creating debug UI elements...');
    this.createDebugButton();
    this.createDebugModal();
    this.attachEventListeners();
    console.log('🔍 Debug UI setup complete');
  }

  /**
   * Create debug button in game UI
   */
  createDebugButton() {
    console.log('🔍 Creating debug button element...');
    const debugButton = document.createElement('button');
    debugButton.id = 'debug-button';
    debugButton.className = 'fixed top-16 right-4 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm z-50 transition-colors';
    debugButton.innerHTML = '🔍 Debug';
    debugButton.title = 'ゲームデバッグ情報を表示';
    
    console.log('🔍 Appending debug button to body...');
    document.body.appendChild(debugButton);
    console.log('🔍 Debug button created and added to DOM');
    
    // Verify button exists
    const addedButton = document.getElementById('debug-button');
    if (addedButton) {
      console.log('✅ Debug button successfully added to DOM');
    } else {
      console.error('❌ Debug button not found in DOM after creation');
    }
  }

  /**
   * Create debug modal
   */
  createDebugModal() {
    const modalHTML = `
      <div id="debug-modal" class="fixed inset-0 bg-black bg-opacity-75 z-50 hidden">
        <div class="flex items-center justify-center min-h-screen p-4">
          <div class="bg-gray-800 rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold text-white">🔍 ゲームデバッグ情報</h2>
              <button id="close-debug-modal" class="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            
            <div class="grid md:grid-cols-3 gap-6 mb-6">
              <!-- Control Panel -->
              <div class="bg-gray-700 rounded-lg p-4">
                <h3 class="text-lg font-semibold text-white mb-3">📊 記録制御</h3>
                <div class="space-y-3">
                  <button id="start-recording" class="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded">
                    ⏺️ 記録開始
                  </button>
                  <button id="stop-recording" class="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded">
                    ⏹️ 記録停止
                  </button>
                  <button id="clear-debug" class="w-full bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded">
                    🗑️ データクリア
                  </button>
                </div>
                <div class="mt-3 text-sm text-gray-300">
                  状態: <span id="recording-status" class="font-semibold">停止中</span>
                </div>
              </div>
              
              <!-- Export Panel -->
              <div class="bg-gray-700 rounded-lg p-4">
                <h3 class="text-lg font-semibold text-white mb-3">💾 エクスポート</h3>
                <div class="space-y-3">
                  <button id="export-json" class="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded">
                    📄 JSON保存
                  </button>
                  <button id="export-log" class="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded">
                    📝 ログ保存
                  </button>
                  <button id="copy-clipboard" class="w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded">
                    📋 クリップボード
                  </button>
                </div>
              </div>
              
              <!-- Stats Panel -->
              <div class="bg-gray-700 rounded-lg p-4">
                <h3 class="text-lg font-semibold text-white mb-3">📈 統計</h3>
                <div class="space-y-2 text-sm text-gray-300">
                  <div>記録時間: <span id="session-duration" class="text-white">--</span></div>
                  <div>アクション数: <span id="action-count" class="text-white">0</span></div>
                  <div>ゲーム状態: <span id="game-state-count" class="text-white">0</span></div>
                  <div>エラー数: <span id="error-count" class="text-white">0</span></div>
                </div>
              </div>
            </div>
            
            <div class="grid md:grid-cols-2 gap-6">
              <!-- Game History -->
              <div>
                <h3 class="text-lg font-semibold text-white mb-4">🎮 ゲーム履歴</h3>
                <div id="debug-game-history" class="bg-gray-900 rounded p-4 h-64 overflow-y-auto text-sm">
                  <div class="text-gray-500">ゲーム履歴がここに表示されます...</div>
                </div>
              </div>
              
              <!-- Current Game State -->
              <div>
                <h3 class="text-lg font-semibold text-white mb-4">🎯 現在の状態</h3>
                <div id="debug-current-state" class="bg-gray-900 rounded p-4 h-64 overflow-y-auto text-sm">
                  <div class="text-gray-500">現在のゲーム状態がここに表示されます...</div>
                </div>
              </div>
            </div>
            
            <!-- Player Actions Log -->
            <div class="mt-6">
              <h3 class="text-lg font-semibold text-white mb-4">👥 プレイヤーアクション</h3>
              <div id="debug-player-actions" class="bg-gray-900 rounded p-4 h-48 overflow-y-auto text-sm">
                <div class="text-gray-500">プレイヤーアクションがここに表示されます...</div>
              </div>
            </div>
            
            <!-- Rule Events Log -->
            <div class="mt-6">
              <h3 class="text-lg font-semibold text-white mb-4">⚡ ルールイベント</h3>
              <div id="debug-rule-events" class="bg-gray-900 rounded p-4 h-48 overflow-y-auto text-sm">
                <div class="text-gray-500">ルールイベントがここに表示されます...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Debug button
    document.getElementById('debug-button')?.addEventListener('click', () => {
      this.showDebugModal();
    });

    // Modal controls
    document.getElementById('close-debug-modal')?.addEventListener('click', () => {
      this.hideDebugModal();
    });

    // Recording controls
    document.getElementById('start-recording')?.addEventListener('click', () => {
      this.startRecording();
    });

    document.getElementById('stop-recording')?.addEventListener('click', () => {
      this.stopRecording();
    });

    document.getElementById('clear-debug')?.addEventListener('click', () => {
      this.clearDebugData();
    });

    // Export controls
    document.getElementById('export-json')?.addEventListener('click', () => {
      this.exportJSON();
    });

    document.getElementById('export-log')?.addEventListener('click', () => {
      this.exportLog();
    });

    document.getElementById('copy-clipboard')?.addEventListener('click', () => {
      this.copyToClipboard();
    });

    // Auto-update timer
    setInterval(() => {
      this.updateStats();
    }, 1000);
  }

  /**
   * Start recording game state
   */
  startRecording() {
    this.isRecording = true;
    this.currentSession.startTime = new Date().toISOString();
    
    const statusEl = document.getElementById('recording-status');
    if (statusEl) {
      statusEl.textContent = '記録中';
      statusEl.className = 'font-semibold text-green-400';
    }
    
    console.log('🔍 Debug recording started');
    this.recordEvent('system', 'recording_started', { timestamp: new Date().toISOString() });
  }

  /**
   * Stop recording game state
   */
  stopRecording() {
    this.isRecording = false;
    
    const statusEl = document.getElementById('recording-status');
    if (statusEl) {
      statusEl.textContent = '停止中';
      statusEl.className = 'font-semibold text-red-400';
    }
    
    console.log('🔍 Debug recording stopped');
    this.recordEvent('system', 'recording_stopped', { timestamp: new Date().toISOString() });
  }

  /**
   * Record game state snapshot
   */
  recordGameState() {
    if (!this.isRecording) return;

    const gameState = this.captureGameState();
    this.currentSession.gameStates.push({
      timestamp: new Date().toISOString(),
      state: gameState
    });

    this.updateDebugDisplay();
  }

  /**
   * Record player action
   */
  recordPlayerAction(playerName, action, details = {}) {
    if (!this.isRecording) return;

    const actionRecord = {
      timestamp: new Date().toISOString(),
      player: playerName,
      action: action,
      details: details
    };

    this.currentSession.playerActions.push(actionRecord);
    this.updateDebugDisplay();
    
    console.log(`🎮 Player Action: ${playerName} - ${action}`, details);
  }

  /**
   * Record rule event
   */
  recordRuleEvent(ruleName, event, details = {}) {
    if (!this.isRecording) return;

    const ruleRecord = {
      timestamp: new Date().toISOString(),
      rule: ruleName,
      event: event,
      details: details
    };

    this.currentSession.ruleEvents.push(ruleRecord);
    this.updateDebugDisplay();
    
    console.log(`⚡ Rule Event: ${ruleName} - ${event}`, details);
  }

  /**
   * Record error
   */
  recordError(error, context = {}) {
    const errorRecord = {
      timestamp: new Date().toISOString(),
      error: error.toString(),
      stack: error.stack,
      context: context
    };

    this.currentSession.errors.push(errorRecord);
    this.updateDebugDisplay();
    
    console.error('🚨 Debug Error:', error, context);
  }

  /**
   * Record general event
   */
  recordEvent(category, event, details = {}) {
    if (!this.isRecording) return;

    console.log(`📝 Debug Event [${category}]: ${event}`, details);
  }

  /**
   * Capture current game state
   */
  captureGameState() {
    const state = {
      timestamp: new Date().toISOString()
    };

    try {
      // Game Controller state
      if (window.gameController) {
        state.gameController = {
          gameState: window.gameController.gameState,
          selectedCards: window.gameController.selectedCards?.length || 0,
          humanPlayerExists: !!window.gameController.humanPlayer
        };
      }

      // Game Logic state
      if (window.gameController?.gameLogic) {
        const gameLogic = window.gameController.gameLogic;
        const gameStatus = gameLogic.getGameStatus();
        
        state.gameLogic = {
          gameStatus: gameStatus,
          fieldCards: gameLogic.getFieldCards()?.map(card => ({
            suit: card.suit,
            rank: card.rank,
            isJoker: card.isJoker
          })) || [],
          isGameOver: gameLogic.isGameOver(),
          finishRanking: gameLogic.getFinishRanking()
        };
      }

      // Player states
      if (window.gameController?.playerManager) {
        const players = window.gameController.playerManager.getAllPlayers();
        state.players = players.map(player => ({
          name: player.name,
          isHuman: player.isHuman(),
          cardCount: player.getCardCount(),
          isTurn: player.isTurn(),
          isFinished: player.isFinished(),
          hand: player.isHuman() ? player.getHand().map(card => ({
            suit: card.suit,
            rank: card.rank,
            isJoker: card.isJoker
          })) : null // CPUの手札は記録しない
        }));
      }

      // Rule settings
      if (window.ruleSettings) {
        state.rules = {
          activeRules: Array.from(window.ruleSettings.activeRules),
          availableRulesCount: window.ruleSettings.availableRules.size
        };
      }

      // Browser info
      state.browser = {
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        url: window.location.href
      };

    } catch (error) {
      this.recordError(error, { context: 'captureGameState' });
      state.captureError = error.toString();
    }

    return state;
  }

  /**
   * Show debug modal
   */
  showDebugModal() {
    const modal = document.getElementById('debug-modal');
    if (modal) {
      modal.classList.remove('hidden');
      this.updateDebugDisplay();
    }
  }

  /**
   * Hide debug modal
   */
  hideDebugModal() {
    const modal = document.getElementById('debug-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  /**
   * Update debug display
   */
  updateDebugDisplay() {
    this.updateGameHistory();
    this.updateCurrentState();
    this.updatePlayerActions();
    this.updateRuleEvents();
  }

  /**
   * Update game history display
   */
  updateGameHistory() {
    const container = document.getElementById('debug-game-history');
    if (!container) return;

    const recentStates = this.currentSession.gameStates.slice(-10);
    
    if (recentStates.length === 0) {
      container.innerHTML = '<div class="text-gray-500">ゲーム状態の記録がありません</div>';
      return;
    }

    container.innerHTML = recentStates.map(record => `
      <div class="mb-2 p-2 bg-gray-800 rounded">
        <div class="text-yellow-400 text-xs">${new Date(record.timestamp).toLocaleTimeString()}</div>
        <div class="text-gray-300 text-xs mt-1">
          Players: ${record.state.players?.length || 0} | 
          Field: ${record.state.gameLogic?.fieldCards?.length || 0} cards |
          Turn: ${record.state.gameLogic?.gameStatus?.currentPlayer || 'N/A'}
        </div>
      </div>
    `).join('');

    container.scrollTop = container.scrollHeight;
  }

  /**
   * Update current state display
   */
  updateCurrentState() {
    const container = document.getElementById('debug-current-state');
    if (!container) return;

    const currentState = this.captureGameState();
    
    container.innerHTML = `
      <div class="text-green-400 font-mono text-xs">
        ${JSON.stringify(currentState, null, 2)}
      </div>
    `;

    container.scrollTop = container.scrollHeight;
  }

  /**
   * Update player actions display
   */
  updatePlayerActions() {
    const container = document.getElementById('debug-player-actions');
    if (!container) return;

    const recentActions = this.currentSession.playerActions.slice(-20);
    
    if (recentActions.length === 0) {
      container.innerHTML = '<div class="text-gray-500">プレイヤーアクションの記録がありません</div>';
      return;
    }

    container.innerHTML = recentActions.map(action => `
      <div class="mb-1 p-2 bg-gray-800 rounded">
        <div class="text-blue-400 text-xs">${new Date(action.timestamp).toLocaleTimeString()}</div>
        <div class="text-white text-sm">${action.player}: ${action.action}</div>
        ${Object.keys(action.details).length > 0 ? 
          `<div class="text-gray-400 text-xs mt-1">${JSON.stringify(action.details)}</div>` : ''}
      </div>
    `).join('');

    container.scrollTop = container.scrollHeight;
  }

  /**
   * Update rule events display
   */
  updateRuleEvents() {
    const container = document.getElementById('debug-rule-events');
    if (!container) return;

    const recentEvents = this.currentSession.ruleEvents.slice(-15);
    
    if (recentEvents.length === 0) {
      container.innerHTML = '<div class="text-gray-500">ルールイベントの記録がありません</div>';
      return;
    }

    container.innerHTML = recentEvents.map(event => `
      <div class="mb-1 p-2 bg-gray-800 rounded">
        <div class="text-purple-400 text-xs">${new Date(event.timestamp).toLocaleTimeString()}</div>
        <div class="text-white text-sm">${event.rule}: ${event.event}</div>
        ${Object.keys(event.details).length > 0 ? 
          `<div class="text-gray-400 text-xs mt-1">${JSON.stringify(event.details)}</div>` : ''}
      </div>
    `).join('');

    container.scrollTop = container.scrollHeight;
  }

  /**
   * Update statistics
   */
  updateStats() {
    const durationEl = document.getElementById('session-duration');
    const actionCountEl = document.getElementById('action-count');
    const stateCountEl = document.getElementById('game-state-count');
    const errorCountEl = document.getElementById('error-count');

    if (durationEl && this.currentSession.startTime) {
      const duration = Date.now() - new Date(this.currentSession.startTime).getTime();
      const minutes = Math.floor(duration / 60000);
      const seconds = Math.floor((duration % 60000) / 1000);
      durationEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    if (actionCountEl) {
      actionCountEl.textContent = this.currentSession.playerActions.length;
    }

    if (stateCountEl) {
      stateCountEl.textContent = this.currentSession.gameStates.length;
    }

    if (errorCountEl) {
      errorCountEl.textContent = this.currentSession.errors.length;
    }
  }

  /**
   * Clear debug data
   */
  clearDebugData() {
    this.currentSession = {
      sessionId: this.generateSessionId(),
      startTime: new Date().toISOString(),
      gameStates: [],
      playerActions: [],
      ruleEvents: [],
      errors: []
    };

    this.updateDebugDisplay();
    console.log('🗑️ Debug data cleared');
  }

  /**
   * Export debug data as JSON
   */
  exportJSON() {
    const debugData = {
      exportTime: new Date().toISOString(),
      session: this.currentSession,
      systemInfo: {
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        url: window.location.href
      }
    };

    const jsonString = JSON.stringify(debugData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `daifugo_debug_${this.currentSession.sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('💾 Debug data exported as JSON');
  }

  /**
   * Export debug data as readable log
   */
  exportLog() {
    let logContent = `大富豪ゲーム デバッグログ\n`;
    logContent += `=====================================\n`;
    logContent += `セッションID: ${this.currentSession.sessionId}\n`;
    logContent += `開始時刻: ${this.currentSession.startTime}\n`;
    logContent += `エクスポート時刻: ${new Date().toISOString()}\n\n`;

    // Player Actions
    logContent += `プレイヤーアクション (${this.currentSession.playerActions.length}件)\n`;
    logContent += `-------------------------------------\n`;
    this.currentSession.playerActions.forEach(action => {
      logContent += `[${action.timestamp}] ${action.player}: ${action.action}\n`;
      if (Object.keys(action.details).length > 0) {
        logContent += `  詳細: ${JSON.stringify(action.details)}\n`;
      }
    });

    // Rule Events
    logContent += `\nルールイベント (${this.currentSession.ruleEvents.length}件)\n`;
    logContent += `-------------------------------------\n`;
    this.currentSession.ruleEvents.forEach(event => {
      logContent += `[${event.timestamp}] ${event.rule}: ${event.event}\n`;
      if (Object.keys(event.details).length > 0) {
        logContent += `  詳細: ${JSON.stringify(event.details)}\n`;
      }
    });

    // Errors
    if (this.currentSession.errors.length > 0) {
      logContent += `\nエラー (${this.currentSession.errors.length}件)\n`;
      logContent += `-------------------------------------\n`;
      this.currentSession.errors.forEach(error => {
        logContent += `[${error.timestamp}] ${error.error}\n`;
        logContent += `  コンテキスト: ${JSON.stringify(error.context)}\n`;
      });
    }

    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `daifugo_debug_log_${this.currentSession.sessionId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('📝 Debug log exported');
  }

  /**
   * Copy debug data to clipboard
   */
  async copyToClipboard() {
    const debugData = {
      session: this.currentSession,
      exportTime: new Date().toISOString()
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(debugData, null, 2));
      console.log('📋 Debug data copied to clipboard');
      
      // Show feedback
      const button = document.getElementById('copy-clipboard');
      if (button) {
        const originalText = button.textContent;
        button.textContent = '✅ コピー完了';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }
}

// Global export
window.GameDebugSystemModule = {
  GameDebugSystem
};

// ES6 module export
export { GameDebugSystem };