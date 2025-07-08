// Main entry point for the Daifugo browser game
// Complete game system with PWA

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎴 大富豪 - Lisp Rule Engine');
    console.log('🚀 Complete game system starting...');
    
    // Initialize PWA (temporarily disabled due to module loading issues)
    // await initializePWA();
    
    // Load game modules
    await loadGameModules();
    
    // Initialize game controller with a small delay to ensure modules are ready
    setTimeout(() => {
        initializeGameController();
    }, 100);
    
    // Update status
    const gameStatus = document.getElementById('game-status');
    gameStatus.textContent = '🎮 ゲームシステム準備完了 - ゲーム開始ボタンをクリック！';
});

/**
 * Load all game modules for Lisp engine
 */
async function loadGameModules() {
    console.log('📦 Loading Lisp game modules with code splitting...');
    
    try {
        // Load module loader first
        const { moduleLoader } = await import('./module-loader.js');
        window.moduleLoader = moduleLoader;
        
        // Load core modules first (required for basic functionality)
        console.log('🎯 Loading core modules...');
        const coreModules = await moduleLoader.loadCoreModules();
        
        // Load game controller
        console.log('📦 Loading Game Controller...');
        await moduleLoader.loadModule('gameController', './lisp-game-controller.js');
        
        // Preload optional modules in background
        console.log('🚀 Preloading optional modules...');
        moduleLoader.preloadModules([
            { name: 'ruleSettings', path: './rule-settings.js' },
            { name: 'dynamicRuleUI', path: './dynamic-rule-ui.js' },
            { name: 'ruleLoader', path: './dynamic-rule-loader.js' }
        ]);
        
        console.log('✅ Core modules loaded, optional modules preloading...');
        
        // Show loading stats
        const stats = moduleLoader.getStats();
        console.log('📊 Module loading stats:', stats);
        
    } catch (error) {
        console.error('❌ Failed to load Lisp game modules:', error);
        throw error;
    }
}

/**
 * Initialize Lisp game controller
 */
function initializeGameController() {
    console.log('🎯 Initializing Lisp game controller...');
    
    try {
        // Initialize debug system first
        if (window.GameDebugSystemModule && window.GameDebugSystemModule.GameDebugSystem) {
            window.debugSystem = new window.GameDebugSystemModule.GameDebugSystem();
            console.log('✅ Debug system initialized');
        } else {
            console.warn('⚠️ GameDebugSystemModule not found - using fallback');
            window.debugSystem = { log: console.log };
        }
        
        // Create global rule settings (lazy loaded)
        if (window.RuleSettingsModule && window.RuleSettingsModule.RuleSettings) {
            window.ruleSettings = new window.RuleSettingsModule.RuleSettings();
            console.log('✅ Rule settings initialized');
        } else {
            console.warn('⚠️ RuleSettingsModule not found - will load on demand');
            window.ruleSettings = { 
                showSettings: async () => {
                    if (window.moduleLoader) {
                        const ruleModule = await window.moduleLoader.loadModule('ruleSettings', './rule-settings.js');
                        if (ruleModule.RuleSettingsModule && ruleModule.RuleSettingsModule.RuleSettings) {
                            window.ruleSettings = new ruleModule.RuleSettingsModule.RuleSettings();
                            window.ruleSettings.showSettings();
                        }
                    } else {
                        console.log('Settings not available');
                    }
                }
            };
        }
        
        // Create Lisp game controller
        if (window.LispGameControllerModule && window.LispGameControllerModule.LispGameController) {
            window.gameController = new window.LispGameControllerModule.LispGameController();
            console.log('✅ Lisp Game controller initialized');
        } else {
            console.error('❌ LispGameControllerModule not found');
            // Try to create start button manually as fallback
            createFallbackStartButton();
            return;
        }
        
        // Initialize Dynamic Rule Loader (lazy loaded)
        if (window.DynamicRuleLoaderModule && window.DynamicRuleLoaderModule.DynamicRuleLoader) {
            const adapter = window.gameController.lispEngine ? 
                { ...window.gameController.lispEngine, 
                  getRegisteredRules: () => ['basic-play', 'card-strength', 'revolution', 'eight-cut'],
                  getRuleDetails: (name) => ({ name, description: `Rule: ${name}`, isActive: true, isCustom: false }),
                  setRuleActive: (name, active) => ({ success: true, ruleName: name, active }),
                  removeRule: (name) => ({ success: false, error: 'Cannot remove built-in rules' }),
                  uploadRuleFile: async () => ({ success: false, error: 'Not implemented' }),
                  loadDynamicRule: async () => ({ success: false, error: 'Not implemented' })
                } : null;
                
            if (adapter) {
                window.dynamicRuleLoader = new window.DynamicRuleLoaderModule.DynamicRuleLoader(adapter);
                console.log('✅ Dynamic Rule Loader initialized');
            } else {
                console.warn('⚠️ Dynamic Rule Loader not initialized - no adapter available');
            }
        } else {
            console.warn('⚠️ DynamicRuleLoaderModule not found - will load on demand');
            window.dynamicRuleLoader = {
                show: async () => {
                    if (window.moduleLoader) {
                        const ruleModule = await window.moduleLoader.loadModule('ruleLoader', './dynamic-rule-loader.js');
                        if (ruleModule.DynamicRuleLoaderModule && ruleModule.DynamicRuleLoaderModule.DynamicRuleLoader) {
                            const adapter = window.gameController.lispEngine || {};
                            window.dynamicRuleLoader = new ruleModule.DynamicRuleLoaderModule.DynamicRuleLoader(adapter);
                            window.dynamicRuleLoader.show();
                        }
                    } else {
                        console.log('Rule loader not available');
                    }
                }
            };
        }
        
        console.log('✅ Lisp game controller and rule settings ready');
        
    } catch (error) {
        console.error('❌ Error initializing game controller:', error);
        createFallbackStartButton();
    }
}

/**
 * Create fallback start button when modules fail to load
 */
function createFallbackStartButton() {
    console.log('🔧 Creating fallback start button...');
    
    const gameStatus = document.getElementById('game-status');
    if (!gameStatus) {
        console.error('❌ game-status element not found');
        return;
    }
    
    // Clear existing content
    gameStatus.innerHTML = '';
    
    // Create fallback button
    const startButton = document.createElement('button');
    startButton.textContent = '🎮 ゲーム開始 (基本版)';
    startButton.className = 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4 cursor-pointer';
    startButton.id = 'fallback-start-button';
    
    startButton.addEventListener('click', () => {
        alert('Lispエンジンの読み込みに失敗しました。ページを再読み込みしてください。');
    });
    
    gameStatus.appendChild(startButton);
    console.log('✅ Fallback start button created');
}

/**
 * Initialize Progressive Web App features
 */
async function initializePWA() {
    console.log('📱 Initializing PWA...');
    
    // Register service worker
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('✅ Service Worker registered:', registration);
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
                console.log('🔄 New version available');
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdateNotification();
                    }
                });
            });
            
        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
        }
    }
    
    // Handle install prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('📲 Install prompt available');
        e.preventDefault();
        deferredPrompt = e;
        showInstallButton(deferredPrompt);
    });
    
    // Handle successful installation
    window.addEventListener('appinstalled', () => {
        console.log('✅ PWA installed successfully');
        hideInstallButton();
    });
}

/**
 * Show install button for PWA
 */
function showInstallButton(deferredPrompt) {
    const installButton = document.createElement('button');
    installButton.textContent = '📱 アプリをインストール';
    installButton.className = 'button-primary fixed bottom-4 left-4 z-50';
    installButton.id = 'install-button';
    
    installButton.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`Install prompt outcome: ${outcome}`);
            deferredPrompt = null;
            hideInstallButton();
        }
    });
    
    document.body.appendChild(installButton);
}

/**
 * Hide install button
 */
function hideInstallButton() {
    const installButton = document.getElementById('install-button');
    if (installButton) {
        installButton.remove();
    }
}

/**
 * Show update notification
 */
function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg z-50';
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <span>🔄 新しいバージョンが利用可能です</span>
            <button onclick="location.reload()" class="bg-white text-blue-600 px-2 py-1 rounded text-sm">
                更新
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        notification.remove();
    }, 10000);
}

