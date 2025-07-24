// Browser test using Deno Playwright
import { firefox } from "npm:playwright"; // ここをchromiumからfirefoxに変更しますにゃん

async function testBrowserVersion() {
    console.log("🚀 Starting browser test...");
    
    try {
        // Launch browser
        const browser = await firefox.launch({ // ここをchromium.launchからfirefox.launchに変更しますにゃん
            headless: false
        });
        
        const context = await browser.newContext();
        const page = await context.newPage();
        
        console.log("📖 Navigating to LispDaifugoEngine browser version...");
        await page.goto("http://localhost:8080/browser/");
        
        // Wait for page to load
        await page.waitForLoadState('networkidle');
        
        // Take screenshot
        await page.screenshot({ path: 'browser-test-screenshot.png' });
        console.log("📸 Screenshot saved: browser-test-screenshot.png");
        
        // Check page title
        const title = await page.title();
        console.log(`📄 Page title: ${title}`);
        
        // Test REPL functionality
        console.log("🧪 Testing REPL functionality...");
        
        // Check if REPL input exists
        const replInput = await page.locator('#repl-input');
        const replExists = await replInput.count();
        console.log(`🔍 REPL input found: ${replExists > 0}`);
        
        if (replExists > 0) {
            // Test basic arithmetic
            await replInput.fill('(+ 2 3)');
            await page.click('#eval-button');
            
            // Wait a moment for evaluation
            await page.waitForTimeout(1000);
            
            // Check REPL output
            const replOutput = await page.locator('#repl-output').textContent();
            console.log(`📊 REPL output contains: ${replOutput?.includes('5') ? 'SUCCESS' : 'FAILURE'}`);
        }
        
        // Test game functionality
        console.log("🎮 Testing game functionality...");
        
        // Switch to game tab
        await page.click('[data-tab="game"]');
        await page.waitForTimeout(500);
        
        // Check if new game button exists
        const newGameButton = await page.locator('#new-game');
        const gameButtonExists = await newGameButton.count();
        console.log(`🎯 New game button found: ${gameButtonExists > 0}`);
        
        if (gameButtonExists > 0) {
            // Start new game
            await newGameButton.click();
            await page.waitForTimeout(1000);
            
            // Check if game started
            const gameStatus = await page.locator('.game-status').textContent();
            console.log(`🎲 Game status: ${gameStatus?.includes('Player') ? 'GAME ACTIVE' : 'NO GAME'}`);
        }
        
        // Test system test functionality
        console.log("🧪 Testing system test functionality...");
        
        // Switch to test tab
        await page.click('[data-tab="test"]');
        await page.waitForTimeout(500);
        
        // Check if test button exists
        const testButton = await page.locator('#run-tests');
        const testButtonExists = await testButton.count();
        console.log(`⚡ Test button found: ${testButtonExists > 0}`);
        
        if (testButtonExists > 0) {
            // Run tests
            await testButton.click();
            await page.waitForTimeout(2000);
            
            // Check test results
            const testResults = await page.locator('#test-results').textContent();
            console.log(`📊 Test results: ${testResults?.includes('テスト') ? 'TESTS RAN' : 'NO TESTS'}`);
        }
        
        // Final screenshot
        await page.screenshot({ path: 'browser-test-final.png' });
        console.log("📸 Final screenshot saved: browser-test-final.png");
        
        console.log("✅ Browser test completed successfully!");
        
        await browser.close();
        
    } catch (error) {
        console.error("❌ Browser test failed:", error);
        throw error;
    }
}

// Run the test
if (import.meta.main) {
    await testBrowserVersion();
}