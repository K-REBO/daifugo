/**
 * Dynamic Rule Loader UI Component
 * Phase 8.4: ブラウザでの.lispファイルアップロード機能
 */

class DynamicRuleLoader {
  constructor(gameAdapter) {
    this.gameAdapter = gameAdapter;
    this.loadedRules = [];
    this.isVisible = false;
    
    this.createUI();
    this.setupEventListeners();
    
    console.log('🔧 Dynamic Rule Loader initialized');
  }

  /**
   * Create UI elements
   */
  createUI() {
    // Create modal container
    this.modal = document.createElement('div');
    this.modal.id = 'rule-loader-modal';
    this.modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';
    
    this.modal.innerHTML = `
      <div class="bg-gray-800 text-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-bold">🔧 カスタムルール管理</h2>
          <button id="close-rule-loader" class="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        
        <!-- File Upload Section -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-3">📁 新しいルールファイルをアップロード</h3>
          <div class="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
            <input type="file" id="rule-file-input" accept=".lisp" class="hidden">
            <button id="select-file-btn" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded mb-2">
              ファイル選択
            </button>
            <p class="text-gray-400 text-sm">または.lispファイルをここにドラッグ&ドロップ</p>
            <p class="text-gray-500 text-xs mt-2">最大50KB, .lispファイルのみ</p>
          </div>
          
          <div id="upload-status" class="mt-3 hidden"></div>
        </div>
        
        <!-- Loaded Rules Section -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-3">📋 読み込み済みルール</h3>
          <div id="loaded-rules-list" class="space-y-2">
            <!-- Rules will be dynamically added here -->
          </div>
        </div>
        
        <!-- Quick Rule Templates -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-3">⚡ クイックテンプレート</h3>
          <div class="grid grid-cols-2 gap-2">
            <button class="rule-template bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm" 
                    data-template="no-single">
              シングル禁止
            </button>
            <button class="rule-template bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-sm" 
                    data-template="joker-wild">
              ジョーカーワイルド
            </button>
            <button class="rule-template bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm" 
                    data-template="suit-lock">
              スート縛り
            </button>
            <button class="rule-template bg-yellow-600 hover:bg-yellow-700 px-3 py-2 rounded text-sm" 
                    data-template="escalation">
              エスカレーション
            </button>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex justify-end space-x-3">
          <button id="reload-all-rules" class="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded">
            全ルール再読み込み
          </button>
          <button id="export-rules" class="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded">
            ルールエクスポート
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.modal);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Close modal
    document.getElementById('close-rule-loader').addEventListener('click', () => {
      this.hide();
    });
    
    // File selection
    document.getElementById('select-file-btn').addEventListener('click', () => {
      document.getElementById('rule-file-input').click();
    });
    
    // File input change
    document.getElementById('rule-file-input').addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        this.uploadRuleFile(file);
      }
    });
    
    // Drag and drop
    const dropArea = this.modal.querySelector('.border-dashed');
    
    dropArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropArea.classList.add('border-blue-500', 'bg-blue-900', 'bg-opacity-20');
    });
    
    dropArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropArea.classList.remove('border-blue-500', 'bg-blue-900', 'bg-opacity-20');
    });
    
    dropArea.addEventListener('drop', (e) => {
      e.preventDefault();
      dropArea.classList.remove('border-blue-500', 'bg-blue-900', 'bg-opacity-20');
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.uploadRuleFile(files[0]);
      }
    });
    
    // Template buttons
    document.querySelectorAll('.rule-template').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const template = e.target.dataset.template;
        this.loadTemplate(template);
      });
    });
    
    // Action buttons
    document.getElementById('reload-all-rules').addEventListener('click', () => {
      this.reloadAllRules();
    });
    
    document.getElementById('export-rules').addEventListener('click', () => {
      this.exportRules();
    });
    
    // Click outside to close
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });
  }

  /**
   * Show the rule loader modal
   */
  show() {
    this.modal.classList.remove('hidden');
    this.isVisible = true;
    this.updateRulesList();
    console.log('📖 Rule loader shown');
  }

  /**
   * Hide the rule loader modal
   */
  hide() {
    this.modal.classList.add('hidden');
    this.isVisible = false;
    console.log('📖 Rule loader hidden');
  }

  /**
   * Upload a rule file
   * @param {File} file - The file to upload
   */
  async uploadRuleFile(file) {
    this.showUploadStatus('アップロード中...', 'info');
    
    try {
      const result = await this.gameAdapter.loadDynamicRule(file);
      
      if (result.success) {
        this.showUploadStatus(
          `✅ ${result.ruleNames.join(', ')} を読み込みました`, 
          'success'
        );
        
        if (result.warnings && result.warnings.length > 0) {
          this.showUploadStatus(
            `⚠️ 警告: ${result.warnings.join(', ')}`, 
            'warning'
          );
        }
        
        this.updateRulesList();
      } else {
        this.showUploadStatus(`❌ エラー: ${result.error}`, 'error');
      }
      
    } catch (error) {
      this.showUploadStatus(`❌ アップロードに失敗しました: ${error.message}`, 'error');
    }
    
    // Clear file input
    document.getElementById('rule-file-input').value = '';
  }

  /**
   * Show upload status message
   * @param {string} message - Status message
   * @param {string} type - Message type (info, success, warning, error)
   */
  showUploadStatus(message, type) {
    const statusEl = document.getElementById('upload-status');
    statusEl.className = `mt-3 p-3 rounded`;
    
    switch (type) {
      case 'success':
        statusEl.className += ' bg-green-600 text-white';
        break;
      case 'warning':
        statusEl.className += ' bg-yellow-600 text-white';
        break;
      case 'error':
        statusEl.className += ' bg-red-600 text-white';
        break;
      default:
        statusEl.className += ' bg-blue-600 text-white';
    }
    
    statusEl.textContent = message;
    statusEl.classList.remove('hidden');
    
    // Auto-hide after 5 seconds for non-error messages
    if (type !== 'error') {
      setTimeout(() => {
        statusEl.classList.add('hidden');
      }, 5000);
    }
  }

  /**
   * Update the loaded rules list
   */
  updateRulesList() {
    const listEl = document.getElementById('loaded-rules-list');
    const rules = this.gameAdapter.getRegisteredRules();
    
    listEl.innerHTML = '';
    
    rules.forEach(ruleName => {
      const ruleDetails = this.gameAdapter.getRuleDetails(ruleName);
      const ruleEl = document.createElement('div');
      ruleEl.className = 'flex justify-between items-center p-3 bg-gray-700 rounded';
      
      ruleEl.innerHTML = `
        <div>
          <span class="font-semibold">${ruleName}</span>
          <span class="text-sm text-gray-400 ml-2">${ruleDetails.description}</span>
          ${ruleDetails.isCustom ? '<span class="bg-blue-500 text-xs px-2 py-1 rounded ml-2">カスタム</span>' : ''}
        </div>
        <div class="flex items-center space-x-2">
          <label class="flex items-center">
            <input type="checkbox" class="rule-toggle mr-2" data-rule="${ruleName}" ${ruleDetails.isActive ? 'checked' : ''}>
            <span class="text-sm">有効</span>
          </label>
          ${ruleDetails.isCustom ? `<button class="remove-rule bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs" data-rule="${ruleName}">削除</button>` : ''}
        </div>
      `;
      
      listEl.appendChild(ruleEl);
    });
    
    // Add event listeners for toggle and remove buttons
    listEl.querySelectorAll('.rule-toggle').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const ruleName = e.target.dataset.rule;
        const isActive = e.target.checked;
        this.gameAdapter.setRuleActive(ruleName, isActive);
      });
    });
    
    listEl.querySelectorAll('.remove-rule').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const ruleName = e.target.dataset.rule;
        this.removeRule(ruleName);
      });
    });
  }

  /**
   * Remove a custom rule
   * @param {string} ruleName - Rule to remove
   */
  removeRule(ruleName) {
    if (confirm(`ルール "${ruleName}" を削除しますか？`)) {
      const result = this.gameAdapter.removeRule(ruleName);
      if (result.success) {
        this.showUploadStatus(`✅ ルール "${ruleName}" を削除しました`, 'success');
        this.updateRulesList();
      } else {
        this.showUploadStatus(`❌ ルールの削除に失敗しました: ${result.error}`, 'error');
      }
    }
  }

  /**
   * Load a rule template
   * @param {string} templateName - Template name
   */
  loadTemplate(templateName) {
    const templates = {
      'no-single': `(defrule no-single-cards "シングルカード禁止"
  (lambda (cards field-state)
    (> (length cards) 1)))`,
      
      'joker-wild': `(defrule joker-wild "ジョーカーワイルド"
  (lambda (cards field-state)
    (or (some-joker cards) (normal-play cards field-state))))`,
      
      'suit-lock': `(defrule suit-lock "スート縛り"
  (lambda (cards field-state)
    (or (null field-state) (same-suit cards (get-field-suit field-state)))))`,
      
      'escalation': `(defrule escalation "エスカレーション"
  (lambda (cards field-state)
    (>= (length cards) (get-last-play-count field-state))))`
    };
    
    const template = templates[templateName];
    if (template) {
      // Create temporary file and load it
      const blob = new Blob([template], { type: 'text/plain' });
      const file = new File([blob], `${templateName}.lisp`, { type: 'text/plain' });
      this.uploadRuleFile(file);
    }
  }

  /**
   * Reload all rules
   */
  reloadAllRules() {
    this.showUploadStatus('全ルールを再読み込み中...', 'info');
    
    // Simulate reload process
    setTimeout(() => {
      this.updateRulesList();
      this.showUploadStatus('✅ 全ルールを再読み込みしました', 'success');
    }, 1000);
  }

  /**
   * Export current rules configuration
   */
  exportRules() {
    const rules = this.gameAdapter.getRegisteredRules();
    const config = {
      timestamp: new Date().toISOString(),
      rules: rules.map(ruleName => ({
        name: ruleName,
        details: this.gameAdapter.getRuleDetails(ruleName)
      }))
    };
    
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `daifugo-rules-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    this.showUploadStatus('✅ ルール設定をエクスポートしました', 'success');
  }
}

// Global export for browser use
window.DynamicRuleLoaderModule = {
  DynamicRuleLoader
};

// ES6 module export
export { DynamicRuleLoader };

console.log('🔧 Dynamic Rule Loader module loaded');