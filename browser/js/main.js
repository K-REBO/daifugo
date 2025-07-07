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
    console.log('📦 Loading Lisp game modules...');
    
    try {
        // Load core modules required by Lisp engine
        await import('./lisp-engine.js');
        await import('./lisp-game-controller.js');
        await import('./debug-system.js');
        await import('./rule-settings.js');
        await import('./dynamic-rule-ui.js');
        
        console.log('✅ All Lisp game modules loaded');
    } catch (error) {
        console.error('❌ Failed to load Lisp game modules:', error);
    }
}

/**
 * Initialize Lisp game controller
 */
function initializeGameController() {
    console.log('🎯 Initializing Lisp game controller...');
    
    // Initialize debug system first
    if (window.GameDebugSystemModule && window.GameDebugSystemModule.GameDebugSystem) {
        window.debugSystem = new window.GameDebugSystemModule.GameDebugSystem();
        console.log('✅ Debug system initialized');
    } else {
        console.error('❌ GameDebugSystemModule not found');
    }
    
    // Create global rule settings first
    if (window.RuleSettingsModule && window.RuleSettingsModule.RuleSettings) {
        window.ruleSettings = new window.RuleSettingsModule.RuleSettings();
        console.log('✅ Rule settings initialized');
    } else {
        console.error('❌ RuleSettingsModule not found');
        return;
    }
    
    // Create Lisp game controller
    if (window.LispGameControllerModule && window.LispGameControllerModule.LispGameController) {
        window.gameController = new window.LispGameControllerModule.LispGameController();
        console.log('✅ Lisp Game controller initialized');
    } else {
        console.error('❌ LispGameControllerModule not found');
        return;
    }
    
    console.log('✅ Lisp game controller and rule settings ready');
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

