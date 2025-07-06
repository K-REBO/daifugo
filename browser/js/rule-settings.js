/**
 * Lisp Rule Settings Management
 * Handles loading, validation, and application of .lisp rule files
 */

class RuleSettings {
  constructor() {
    this.availableRules = new Map();
    this.activeRules = new Set();
    this.ruleFiles = [];
    this.modalCreated = false;
    
    this.initializeDefaultRules();
    
    // Setup UI after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupUI());
    } else {
      // Use setTimeout to ensure DOM is fully ready
      setTimeout(() => this.setupUI(), 50);
    }
  }

  /**
   * Initialize default Daifugo rules
   */
  initializeDefaultRules() {
    // Default rules that are always available
    const defaultRules = [
      {
        id: 'revolution',
        name: '革命',
        description: '4枚同時出しで強さが逆転',
        category: 'basic',
        enabled: true,
        lispCode: `
(define-rule revolution
  (when (= (length cards) 4)
    (and (all-same-rank cards)
         (toggle-card-order))))
        `.trim()
      },
      {
        id: 'eight-cut',
        name: '8切り',
        description: '8を出すと場がリセット',
        category: 'basic',
        enabled: true,
        lispCode: `
(define-rule eight-cut
  (when (any-card-rank cards "8")
    (clear-field)))
        `.trim()
      },
      {
        id: 'eleven-back',
        name: '11バック',
        description: 'Jを出すと直前のカードより弱くてもOK',
        category: 'advanced',
        enabled: false,
        lispCode: `
(define-rule eleven-back
  (when (any-card-rank cards "J")
    (set-reverse-mode true)))
        `.trim()
      },
      {
        id: 'three-spades',
        name: 'スペードの3返し',
        description: 'ジョーカーをスペードの3で返せる',
        category: 'advanced',
        enabled: false,
        lispCode: `
(define-rule three-spades
  (when (and (last-card-joker)
             (card-is cards "♠" "3"))
    (allow-play)))
        `.trim()
      },
      {
        id: 'stairs',
        name: '階段',
        description: '連続した数字の組み合わせ',
        category: 'advanced',
        enabled: false,
        lispCode: `
(define-rule stairs
  (when (consecutive-ranks cards)
    (allow-play)))
        `.trim()
      },
      {
        id: 'binding',
        name: '縛り',
        description: '同じスートのカードが続いたら同スート縛り',
        category: 'expert',
        enabled: false,
        lispCode: `
(define-rule binding
  (when (same-suit-sequence field-history 2)
    (require-same-suit)))
        `.trim()
      }
    ];

    defaultRules.forEach(rule => {
      this.availableRules.set(rule.id, rule);
      if (rule.enabled) {
        this.activeRules.add(rule.id);
      }
    });
  }

  /**
   * Setup settings UI
   */
  setupUI() {
    console.log('🎯 Setting up rule settings UI...');
    try {
      this.createSettingsModal();
      this.attachEventListeners();
      console.log('✅ Rule settings UI ready');
    } catch (error) {
      console.error('❌ Failed to setup rule settings UI:', error);
    }
  }

  /**
   * Create settings modal HTML
   */
  createSettingsModal() {
    // Check if modal already exists
    if (document.getElementById('rule-settings-modal')) {
      console.log('🎯 Modal already exists');
      this.modalCreated = true;
      return;
    }
    
    console.log('🎯 Creating settings modal...');
    
    const modalHTML = `
      <div id="rule-settings-modal" class="fixed inset-0 bg-black bg-opacity-75 z-50 hidden">
        <div class="flex items-center justify-center min-h-screen p-4">
          <div class="bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold text-white">🎯 ルール設定</h2>
              <button id="close-rule-settings" class="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            
            <div class="grid md:grid-cols-2 gap-6">
              <!-- Rule Categories -->
              <div>
                <h3 class="text-lg font-semibold text-white mb-4">📋 利用可能なルール</h3>
                <div id="rule-categories" class="space-y-4">
                  <!-- Rules will be populated here -->
                </div>
              </div>
              
              <!-- Lisp Code Preview -->
              <div>
                <h3 class="text-lg font-semibold text-white mb-4">📝 Lispコード</h3>
                <div id="lisp-code-preview" class="bg-gray-900 rounded p-4 text-green-400 font-mono text-sm h-64 overflow-y-auto">
                  <p class="text-gray-500">ルールを選択してコードを表示</p>
                </div>
              </div>
            </div>
            
            <!-- Custom Rules Section -->
            <div class="mt-6 pt-6 border-t border-gray-600">
              <h3 class="text-lg font-semibold text-white mb-4">📁 カスタムルール (.lisp)</h3>
              <div class="flex gap-4 mb-4">
                <input type="file" id="lisp-file-input" accept=".lisp" class="hidden">
                <button id="load-lisp-file" class="button-secondary">
                  📂 .lispファイルを読み込み
                </button>
                <button id="create-new-rule" class="button-primary">
                  ✨ 新しいルールを作成
                </button>
              </div>
              <div id="custom-rules-list" class="space-y-2">
                <!-- Custom rules will be listed here -->
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex justify-end gap-4 mt-6 pt-6 border-t border-gray-600">
              <button id="reset-rules" class="button-secondary">
                🔄 デフォルトに戻す
              </button>
              <button id="apply-rules" class="button-primary">
                ✅ ルールを適用
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modalCreated = true;
    console.log('✅ Settings modal created');
    
    this.populateRuleCategories();
  }

  /**
   * Populate rule categories in the UI
   */
  populateRuleCategories() {
    const container = document.getElementById('rule-categories');
    if (!container) return;

    const categories = {
      'basic': { name: '基本ルール', icon: '🎯' },
      'advanced': { name: '上級ルール', icon: '⚡' },
      'expert': { name: '専門ルール', icon: '🔥' }
    };

    Object.entries(categories).forEach(([categoryId, categoryInfo]) => {
      const categoryRules = Array.from(this.availableRules.values())
        .filter(rule => rule.category === categoryId);

      if (categoryRules.length === 0) return;

      const categoryHTML = `
        <div class="rule-category">
          <h4 class="text-white font-semibold mb-2">
            ${categoryInfo.icon} ${categoryInfo.name}
          </h4>
          <div class="space-y-2 ml-4">
            ${categoryRules.map(rule => `
              <label class="flex items-start space-x-3 p-2 rounded hover:bg-gray-700 cursor-pointer">
                <input type="checkbox" 
                       class="rule-checkbox mt-1" 
                       data-rule-id="${rule.id}"
                       ${this.activeRules.has(rule.id) ? 'checked' : ''}>
                <div class="flex-1">
                  <div class="text-white font-medium">${rule.name}</div>
                  <div class="text-gray-400 text-sm">${rule.description}</div>
                </div>
              </label>
            `).join('')}
          </div>
        </div>
      `;

      container.insertAdjacentHTML('beforeend', categoryHTML);
    });
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    console.log('🎯 Attaching event listeners...');
    
    // Modal controls - use event delegation for dynamic content
    document.addEventListener('click', (e) => {
      if (e.target.id === 'close-rule-settings') {
        this.hideSettings();
      } else if (e.target.id === 'apply-rules') {
        this.applyRules();
      } else if (e.target.id === 'reset-rules') {
        this.resetToDefaults();
      } else if (e.target.id === 'load-lisp-file') {
        const fileInput = document.getElementById('lisp-file-input');
        if (fileInput) fileInput.click();
      }
    });

    // File loading
    document.addEventListener('change', (e) => {
      if (e.target.id === 'lisp-file-input') {
        this.handleFileLoad(e);
      } else if (e.target.classList.contains('rule-checkbox')) {
        this.handleRuleToggle(e.target);
      }
    });

    // Rule preview
    document.addEventListener('click', (e) => {
      if (e.target.closest('.rule-checkbox')) {
        const ruleId = e.target.dataset.ruleId;
        this.showRulePreview(ruleId);
      }
    });
    
    console.log('✅ Event listeners attached');
  }

  /**
   * Show settings modal
   */
  showSettings() {
    console.log('🎯 Attempting to show rule settings...');
    
    // Ensure modal is created
    if (!this.modalCreated) {
      console.log('🔧 Modal not created yet, creating now...');
      this.createSettingsModal();
    }
    
    const modal = document.getElementById('rule-settings-modal');
    if (modal) {
      modal.classList.remove('hidden');
      console.log('✅ Rule settings modal opened');
    } else {
      console.error('❌ Rule settings modal not found in DOM');
      // Try to create it if it doesn't exist
      console.log('🔧 Force creating modal...');
      this.createSettingsModal();
      
      // Wait a bit for DOM insertion
      setTimeout(() => {
        const newModal = document.getElementById('rule-settings-modal');
        if (newModal) {
          newModal.classList.remove('hidden');
          console.log('✅ Created and opened rule settings modal');
        } else {
          console.error('❌ Still cannot find modal after creation');
        }
      }, 10);
    }
  }

  /**
   * Hide settings modal
   */
  hideSettings() {
    const modal = document.getElementById('rule-settings-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  /**
   * Handle rule toggle
   */
  handleRuleToggle(checkbox) {
    const ruleId = checkbox.dataset.ruleId;
    
    if (checkbox.checked) {
      this.activeRules.add(ruleId);
    } else {
      this.activeRules.delete(ruleId);
    }

    console.log(`📋 Rule ${ruleId}: ${checkbox.checked ? 'enabled' : 'disabled'}`);
    this.showRulePreview(ruleId);
  }

  /**
   * Show Lisp code preview
   */
  showRulePreview(ruleId) {
    const rule = this.availableRules.get(ruleId);
    if (!rule) return;

    const preview = document.getElementById('lisp-code-preview');
    if (preview) {
      preview.innerHTML = `
        <div class="mb-2 text-yellow-400 font-bold">;; ${rule.name}</div>
        <div class="mb-2 text-gray-400">;; ${rule.description}</div>
        <pre class="text-green-400">${rule.lispCode}</pre>
      `;
    }
  }

  /**
   * Apply selected rules to game
   */
  applyRules() {
    const activeRulesList = Array.from(this.activeRules).map(id => {
      const rule = this.availableRules.get(id);
      return rule ? rule.name : id;
    });

    console.log('✅ Applied rules:', activeRulesList);
    
    // Show confirmation
    this.showMessage(`✅ ${activeRulesList.length}個のルールを適用しました: ${activeRulesList.join(', ')}`);
    
    this.hideSettings();
    
    // TODO: Actually integrate with game logic
    // For now, just store the settings
    localStorage.setItem('daifugo-rules', JSON.stringify(Array.from(this.activeRules)));
  }

  /**
   * Reset to default rules
   */
  resetToDefaults() {
    this.activeRules.clear();
    this.activeRules.add('revolution');
    this.activeRules.add('eight-cut');

    // Update checkboxes
    document.querySelectorAll('.rule-checkbox').forEach(checkbox => {
      const ruleId = checkbox.dataset.ruleId;
      checkbox.checked = this.activeRules.has(ruleId);
    });

    console.log('🔄 Rules reset to defaults');
    this.showMessage('🔄 デフォルトルールに戻しました');
  }

  /**
   * Handle .lisp file loading
   */
  async handleFileLoad(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const content = await file.text();
      const customRule = this.parseLispFile(file.name, content);
      
      if (customRule) {
        this.availableRules.set(customRule.id, customRule);
        this.showMessage(`📁 ${file.name} を読み込みました`);
        this.refreshCustomRulesList();
      }
    } catch (error) {
      console.error('File load error:', error);
      this.showMessage(`❌ ファイル読み込みエラー: ${error.message}`);
    }
  }

  /**
   * Parse .lisp file content
   */
  parseLispFile(fileName, content) {
    // Simple parser for demonstration
    // In real implementation, would use proper Lisp parser
    
    const nameMatch = content.match(/;;\s*Name:\s*(.+)/);
    const descMatch = content.match(/;;\s*Description:\s*(.+)/);
    
    return {
      id: fileName.replace('.lisp', ''),
      name: nameMatch ? nameMatch[1].trim() : fileName,
      description: descMatch ? descMatch[1].trim() : 'カスタムルール',
      category: 'custom',
      enabled: false,
      lispCode: content,
      isCustom: true
    };
  }

  /**
   * Refresh custom rules list
   */
  refreshCustomRulesList() {
    const container = document.getElementById('custom-rules-list');
    if (!container) return;

    const customRules = Array.from(this.availableRules.values())
      .filter(rule => rule.isCustom);

    container.innerHTML = customRules.map(rule => `
      <div class="flex items-center justify-between bg-gray-700 p-3 rounded">
        <div>
          <span class="text-white font-medium">${rule.name}</span>
          <span class="text-gray-400 text-sm ml-2">${rule.description}</span>
        </div>
        <button class="text-red-400 hover:text-red-300" onclick="ruleSettings.removeCustomRule('${rule.id}')">
          🗑️
        </button>
      </div>
    `).join('');
  }

  /**
   * Remove custom rule
   */
  removeCustomRule(ruleId) {
    this.availableRules.delete(ruleId);
    this.activeRules.delete(ruleId);
    this.refreshCustomRulesList();
    this.showMessage(`🗑️ カスタムルールを削除しました`);
  }

  /**
   * Show message to user
   */
  showMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg z-50';
    messageEl.textContent = message;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
      messageEl.remove();
    }, 3000);
  }

  /**
   * Get currently active rules
   */
  getActiveRules() {
    return Array.from(this.activeRules).map(id => this.availableRules.get(id));
  }

  /**
   * Load saved rules from localStorage
   */
  loadSavedRules() {
    const saved = localStorage.getItem('daifugo-rules');
    if (saved) {
      try {
        const ruleIds = JSON.parse(saved);
        this.activeRules = new Set(ruleIds);
      } catch (error) {
        console.error('Error loading saved rules:', error);
      }
    }
  }
}

// Global export
window.RuleSettingsModule = {
  RuleSettings
};

// ES6 module export
export { RuleSettings };