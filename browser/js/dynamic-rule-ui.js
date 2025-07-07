/**
 * Dynamic Rule UI System
 * Automatically generates UI elements for local rules and handles notifications
 */

class DynamicRuleUI {
    constructor() {
        this.activeNotifications = [];
        this.ruleComponents = new Map();
        this.animationQueue = [];
        
        this.initializeSystem();
    }

    /**
     * Initialize the dynamic rule UI system
     */
    initializeSystem() {
        this.createNotificationContainer();
        this.setupEventListeners();
        this.loadRuleComponents();
        
        console.log('🎨 Dynamic Rule UI System initialized');
    }

    /**
     * Create notification container for rule alerts
     */
    createNotificationContainer() {
        if (document.getElementById('rule-notifications')) return;

        const container = document.createElement('div');
        container.id = 'rule-notifications';
        container.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2';
        container.style.pointerEvents = 'none';
        
        document.body.appendChild(container);
    }

    /**
     * Show rule activation notification
     * @param {string} ruleId - Rule identifier
     * @param {string} message - Notification message
     * @param {object} options - Display options
     */
    showRuleNotification(ruleId, message, options = {}) {
        const {
            type = 'success',
            duration = 3000,
            sound = true,
            animation = 'bounce'
        } = options;

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `
            rule-notification rule-notification-${type}
            px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300
            bg-gradient-to-r text-white font-bold text-lg
            ${this.getNotificationClasses(type)}
        `;
        
        notification.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="notification-icon text-2xl">
                    ${this.getRuleIcon(ruleId)}
                </div>
                <div class="notification-content">
                    <div class="notification-title">${this.getRuleName(ruleId)}</div>
                    <div class="notification-message text-sm opacity-90">${message}</div>
                </div>
                <div class="notification-close cursor-pointer ml-4" onclick="dynamicRuleUI.closeNotification('${notification.id}')">
                    ✕
                </div>
            </div>
        `;

        // Add unique ID
        notification.id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Add to container with animation
        const container = document.getElementById('rule-notifications');
        container.appendChild(notification);
        
        // Trigger entrance animation
        setTimeout(() => {
            notification.classList.add('notification-enter');
            if (animation === 'bounce') {
                notification.style.animation = 'ruleBounce 0.6s ease-out';
            }
        }, 10);

        // Play sound effect
        if (sound) {
            this.playRuleSound(ruleId);
        }

        // Auto-remove after duration
        setTimeout(() => {
            this.closeNotification(notification.id);
        }, duration);

        // Track active notifications
        this.activeNotifications.push({
            id: notification.id,
            ruleId,
            element: notification,
            timestamp: Date.now()
        });

        return notification.id;
    }

    /**
     * Close specific notification
     * @param {string} notificationId - Notification ID to close
     */
    closeNotification(notificationId) {
        const notification = document.getElementById(notificationId);
        if (!notification) return;

        // Exit animation
        notification.style.animation = 'ruleSlideOut 0.3s ease-in forwards';
        
        setTimeout(() => {
            notification.remove();
            
            // Remove from tracking
            this.activeNotifications = this.activeNotifications.filter(
                n => n.id !== notificationId
            );
        }, 300);
    }

    /**
     * Get notification style classes based on type
     * @param {string} type - Notification type
     * @returns {string} CSS classes
     */
    getNotificationClasses(type) {
        const classes = {
            success: 'from-green-500 to-green-600 border-green-400',
            warning: 'from-yellow-500 to-yellow-600 border-yellow-400',
            error: 'from-red-500 to-red-600 border-red-400',
            info: 'from-blue-500 to-blue-600 border-blue-400',
            special: 'from-purple-500 to-purple-600 border-purple-400'
        };
        
        return classes[type] || classes.info;
    }

    /**
     * Get rule-specific icon
     * @param {string} ruleId - Rule identifier
     * @returns {string} Icon emoji or text
     */
    getRuleIcon(ruleId) {
        const icons = {
            'eight-cut': '✂️',
            'revolution': '🔄',
            'q-bomber': '💣',
            'eleven-back': '🔙',
            'three-spades': '♠️',
            'stairs': '📈',
            'binding': '🔗',
            'seven-pass': '7️⃣'
        };
        
        return icons[ruleId] || '🎴';
    }

    /**
     * Get rule display name
     * @param {string} ruleId - Rule identifier
     * @returns {string} Display name
     */
    getRuleName(ruleId) {
        if (window.ruleSettings && window.ruleSettings.availableRules.has(ruleId)) {
            return window.ruleSettings.availableRules.get(ruleId).name;
        }
        
        const names = {
            'eight-cut': '8切り',
            'revolution': '革命',
            'q-bomber': 'Qボンバー',
            'eleven-back': '11バック',
            'three-spades': 'スペード3返し',
            'stairs': '階段',
            'binding': '縛り',
            'seven-pass': '7渡し'
        };
        
        return names[ruleId] || 'ローカルルール';
    }

    /**
     * Play sound effect for rule activation
     * @param {string} ruleId - Rule identifier
     */
    playRuleSound(ruleId) {
        // Create audio context for sound effects
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn('Audio context not available');
                return;
            }
        }

        // Rule-specific sound frequencies
        const soundMap = {
            'eight-cut': [800, 0.1], // Sharp, quick
            'revolution': [400, 0.3], // Deep, dramatic
            'q-bomber': [600, 0.2], // Explosive
            'eleven-back': [500, 0.15], // Reverse
            'three-spades': [700, 0.1], // High, quick
            'stairs': [450, 0.25], // Rising
            'binding': [550, 0.2], // Binding
            'seven-pass': [650, 0.15] // Pass
        };

        const [frequency, duration] = soundMap[ruleId] || [500, 0.2];
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.warn('Sound generation failed:', e);
        }
    }

    /**
     * Create dynamic UI for specific rule
     * @param {string} ruleId - Rule identifier
     * @param {object} ruleConfig - Rule configuration
     */
    createRuleUI(ruleId, ruleConfig) {
        // Qボンバーの数字宣言UI
        if (ruleId === 'q-bomber') {
            return this.createQBomberUI();
        }
        
        // 7渡しのカード選択UI
        if (ruleId === 'seven-pass') {
            return this.createSevenPassUI();
        }
        
        // 階段のカード組み合わせUI
        if (ruleId === 'stairs') {
            return this.createStairsUI();
        }
        
        return null;
    }

    /**
     * Create Q-bomber number declaration UI
     * @returns {HTMLElement} Q-bomber UI element
     */
    createQBomberUI() {
        const container = document.createElement('div');
        container.id = 'q-bomber-ui';
        container.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        container.innerHTML = `
            <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <h3 class="text-xl font-bold text-white mb-4 text-center">
                    💣 Qボンバー発動！
                </h3>
                <p class="text-gray-300 mb-4 text-center">
                    削除したい数字を選択してください（最大<span id="max-q-declarations">2</span>個）
                </p>
                
                <div class="grid grid-cols-4 gap-2 mb-6">
                    ${['3','4','5','6','7','8','9','10','J','Q','K','A','2'].map(num => `
                        <button class="q-number-btn bg-gray-700 hover:bg-gray-600 text-white p-3 rounded font-bold transition-colors" 
                                data-number="${num}" onclick="dynamicRuleUI.toggleQNumber('${num}')">
                            ${num}
                        </button>
                    `).join('')}
                </div>
                
                <div class="flex justify-center space-x-4">
                    <button onclick="dynamicRuleUI.executeQBomber()" 
                            class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold">
                        💣 実行
                    </button>
                    <button onclick="dynamicRuleUI.executeQBomberNoDeclaration()" 
                            class="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-bold">
                        宣言なし
                    </button>
                    <button onclick="dynamicRuleUI.cancelQBomber()" 
                            class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg">
                        キャンセル
                    </button>
                </div>
                
                <div id="q-selected-numbers" class="mt-4 text-center text-gray-300">
                    選択された数字: なし
                </div>
            </div>
        `;
        
        return container;
    }

    /**
     * Show Q-bomber UI with specified max declarations
     * @param {number} maxDeclarations - Maximum number of declarations allowed
     */
    showQBomberUI(maxDeclarations = 2) {
        const ui = this.createQBomberUI();
        document.getElementById('max-q-declarations').textContent = maxDeclarations;
        document.body.appendChild(ui);
        
        // Reset selection state
        this.qSelectedNumbers = [];
        this.qMaxDeclarations = maxDeclarations;
    }

    /**
     * Toggle number selection in Q-bomber UI
     * @param {string} number - Number to toggle
     */
    toggleQNumber(number) {
        if (!this.qSelectedNumbers) this.qSelectedNumbers = [];
        
        const index = this.qSelectedNumbers.indexOf(number);
        
        if (index !== -1) {
            // Remove number
            this.qSelectedNumbers.splice(index, 1);
        } else if (this.qSelectedNumbers.length < this.qMaxDeclarations) {
            // Add number
            this.qSelectedNumbers.push(number);
        } else {
            // Max reached, show warning
            this.showRuleNotification('q-bomber', 
                `最大${this.qMaxDeclarations}個まで選択可能です`, 
                { type: 'warning', duration: 2000 }
            );
            return;
        }
        
        this.updateQBomberUI();
    }

    /**
     * Update Q-bomber UI display
     */
    updateQBomberUI() {
        // Update button styles
        document.querySelectorAll('.q-number-btn').forEach(btn => {
            const number = btn.dataset.number;
            const isSelected = this.qSelectedNumbers.includes(number);
            
            btn.classList.toggle('bg-red-600', isSelected);
            btn.classList.toggle('bg-gray-700', !isSelected);
        });
        
        // Update selected numbers display
        const display = document.getElementById('q-selected-numbers');
        if (display) {
            display.textContent = this.qSelectedNumbers.length > 0 
                ? `選択された数字: ${this.qSelectedNumbers.join(', ')}`
                : '選択された数字: なし';
        }
    }

    /**
     * Execute Q-bomber with selected numbers
     */
    executeQBomber() {
        if (window.gameController) {
            // Execute Q-bomber through game controller
            const result = window.gameController.executeQBomber(this.qSelectedNumbers);
            
            if (result.success) {
                this.showRuleNotification('q-bomber', 
                    `数字 [${this.qSelectedNumbers.join(', ')}] を全プレイヤーから削除！`, 
                    { type: 'success', animation: 'bounce' }
                );
            } else {
                this.showRuleNotification('q-bomber', 
                    result.message || 'Qボンバー実行に失敗', 
                    { type: 'error' }
                );
            }
        }
        
        this.closeQBomberUI();
    }

    /**
     * Execute Q-bomber without number declarations
     */
    executeQBomberNoDeclaration() {
        this.qSelectedNumbers = [];
        this.executeQBomber();
    }

    /**
     * Cancel Q-bomber activation
     */
    cancelQBomber() {
        this.closeQBomberUI();
        this.showRuleNotification('q-bomber', 'Qボンバーをキャンセルしました', 
            { type: 'info', duration: 2000 }
        );
    }

    /**
     * Close Q-bomber UI
     */
    closeQBomberUI() {
        const ui = document.getElementById('q-bomber-ui');
        if (ui) {
            ui.style.animation = 'fadeOut 0.3s ease-in forwards';
            setTimeout(() => ui.remove(), 300);
        }
    }

    /**
     * Setup event listeners for rule system
     */
    setupEventListeners() {
        // Listen for rule activations from game engine
        document.addEventListener('ruleActivated', (event) => {
            const { ruleId, message, data } = event.detail;
            this.handleRuleActivation(ruleId, message, data);
        });
        
        // Listen for rule settings changes
        document.addEventListener('ruleSettingsChanged', (event) => {
            this.updateRuleComponents();
        });
    }

    /**
     * Handle rule activation event
     * @param {string} ruleId - Activated rule ID
     * @param {string} message - Rule message
     * @param {object} data - Additional rule data
     */
    handleRuleActivation(ruleId, message, data = {}) {
        // Show notification
        this.showRuleNotification(ruleId, message, {
            type: data.type || 'success',
            duration: data.duration || 3000
        });
        
        // Show special UI if needed
        if (ruleId === 'q-bomber' && data.requiresDeclaration) {
            setTimeout(() => {
                this.showQBomberUI(data.maxDeclarations || 2);
            }, 500);
        }
    }

    /**
     * Load rule components from available rules
     */
    loadRuleComponents() {
        if (window.ruleSettings) {
            window.ruleSettings.availableRules.forEach((rule, ruleId) => {
                const component = this.createRuleUI(ruleId, rule);
                if (component) {
                    this.ruleComponents.set(ruleId, component);
                }
            });
        }
    }

    /**
     * Update rule components when settings change
     */
    updateRuleComponents() {
        // Refresh components based on active rules
        this.loadRuleComponents();
    }

    /**
     * Clear all active notifications
     */
    clearAllNotifications() {
        this.activeNotifications.forEach(notification => {
            this.closeNotification(notification.id);
        });
    }
}

// CSS animations
const ruleAnimationCSS = `
@keyframes ruleBounce {
    0% { transform: translateY(-100px) scale(0.8); opacity: 0; }
    50% { transform: translateY(10px) scale(1.05); opacity: 1; }
    100% { transform: translateY(0) scale(1); opacity: 1; }
}

@keyframes ruleSlideOut {
    0% { transform: translateX(0) scale(1); opacity: 1; }
    100% { transform: translateX(100px) scale(0.8); opacity: 0; }
}

@keyframes fadeOut {
    0% { opacity: 1; }
    100% { opacity: 0; }
}

.notification-enter {
    animation: ruleBounce 0.6s ease-out;
}

.rule-notification {
    pointer-events: auto;
    backdrop-filter: blur(4px);
    border: 2px solid;
}

.rule-notification:hover {
    transform: scale(1.02);
    transition: transform 0.2s ease;
}
`;

// Inject CSS
if (!document.getElementById('rule-animation-css')) {
    const style = document.createElement('style');
    style.id = 'rule-animation-css';
    style.textContent = ruleAnimationCSS;
    document.head.appendChild(style);
}

// Global instance
window.dynamicRuleUI = new DynamicRuleUI();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DynamicRuleUI };
}

console.log('🎨 Dynamic Rule UI System loaded');