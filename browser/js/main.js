// Main entry point for the Daifugo browser game
// This file will load other modules as we build them

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎴 大富豪 - Lisp Rule Engine');
    console.log('🚀 Application starting...');
    
    // Initialize game status
    const gameStatus = document.getElementById('game-status');
    gameStatus.textContent = 'Tailwind CSS環境構築完了 ✅';
    
    // Add some test styling to verify everything works
    setTimeout(() => {
        gameStatus.textContent = '次のフェーズ: カードシステム実装';
        gameStatus.classList.add('animate-pulse');
    }, 2000);
});