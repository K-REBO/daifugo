// Main entry point for the Daifugo browser game
// PWA + Module loading

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎴 大富豪 - Lisp Rule Engine');
    console.log('🚀 Application starting...');
    
    // Initialize PWA
    await initializePWA();
    
    // Initialize game status
    const gameStatus = document.getElementById('game-status');
    gameStatus.textContent = 'PWA + カードシステム実装完了 ✅';
    
    // Demo card functionality
    setTimeout(() => {
        demoCardSystem();
    }, 1000);
});

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

/**
 * Demo card system functionality
 */
function demoCardSystem() {
    console.log('🃏 Demonstrating card system...');
    
    // Load card module dynamically
    import('./card.js').then(({ Card, CardUtils }) => {
        const gameStatus = document.getElementById('game-status');
        const humanCards = document.getElementById('human-cards');
        
        // Create some demo cards
        const demoCards = [
            new Card('♠', 'A'),
            new Card('♥', 'K'), 
            new Card('♦', '10'),
            new Card('♣', '7'),
            new Card('JOKER', 'JOKER')
        ];
        
        // Render demo cards
        humanCards.innerHTML = '';
        demoCards.forEach(card => {
            const cardElement = card.createElement();
            cardElement.classList.add('animate-card-deal');
            humanCards.appendChild(cardElement);
        });
        
        // Update status
        gameStatus.textContent = 'デモカード表示中 - クリックして選択可能';
        
        // Update card count
        document.getElementById('human-card-count').textContent = `手札: ${demoCards.length}枚`;
        
        setTimeout(() => {
            gameStatus.textContent = '次のフェーズ: プレイヤー管理システム';
        }, 3000);
    }).catch(error => {
        console.error('Failed to load card module:', error);
    });
}