// Main entry point for the Daifugo browser game
// Complete game system with PWA

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎴 大富豪 - Lisp Rule Engine');
    console.log('🚀 Complete game system starting...');
    
    // Initialize PWA
    await initializePWA();
    
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
 * Load all game modules
 */
async function loadGameModules() {
    console.log('📦 Loading game modules...');
    
    try {
        // Load modules in dependency order
        await import('./card.js');
        await import('./player.js');
        await import('./game.js');
        await import('./cpu-ai.js');
        await import('./debug-system.js');
        await import('./game-controller.js');
        await import('./rule-settings.js');
        
        console.log('✅ All game modules loaded');
    } catch (error) {
        console.error('❌ Failed to load game modules:', error);
    }
}

/**
 * Initialize game controller
 */
function initializeGameController() {
    console.log('🎮 Initializing game controller...');
    
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
    
    // Then create game controller (which depends on rule settings)
    if (window.GameControllerModule && window.GameControllerModule.GameController) {
        window.gameController = new window.GameControllerModule.GameController();
        console.log('✅ Game controller initialized');
    } else {
        console.error('❌ GameControllerModule not found');
        return;
    }
    
    console.log('✅ Game controller and rule settings ready');
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

