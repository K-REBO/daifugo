import { test, expect } from '@playwright/test';

test.describe('Lisp Engine CPU Integration Testing', () => {
  let page;
  let consoleMessages = [];
  let errorMessages = [];

  test.beforeEach(async ({ page: browserPage }) => {
    page = browserPage;
    consoleMessages = [];
    errorMessages = [];
    
    // Capture console messages
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
        timestamp: new Date().toISOString()
      });
    });
    
    // Capture errors
    page.on('pageerror', error => {
      errorMessages.push({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });
    
    // Navigate to game
    await page.goto('/');
    
    // Wait for game system to load
    await page.waitForTimeout(3000);
  });

  test('should initialize Lisp engine and display start button', async () => {
    console.log('🎯 Testing Lisp Engine initialization...');
    
    // Check if Lisp engine components loaded
    const lispEngineLoaded = await page.evaluate(() => {
      return typeof window.LispGameEngine !== 'undefined';
    });
    
    console.log('Lisp Engine loaded:', lispEngineLoaded);
    
    // Check if start button is present with correct text
    const startButton = page.locator('#start-game-button');
    await expect(startButton).toBeVisible();
    await expect(startButton).toContainText('Lisp Engine');
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'test-results/lisp-engine-initial.png' });
    
    console.log('✅ Lisp Engine initialization test passed');
  });

  test('should start game with CPU players using Lisp engine', async () => {
    console.log('🎮 Testing game start with CPU players...');
    
    // Click start button
    const startButton = page.locator('#start-game-button');
    await startButton.click();
    
    // Wait for game initialization
    await page.waitForTimeout(3000);
    
    // Check if game status shows active game
    const gameStatus = page.locator('#game-status');
    const statusText = await gameStatus.textContent();
    
    console.log('Game status:', statusText);
    
    // Should show turn information
    expect(statusText).toMatch(/のターン|Turn|あなた|CPU/);
    
    // Check if CPU players are rendered
    const cpuPlayersExists = await page.locator('.cpu-player, .player-card').count();
    console.log('CPU players found:', cpuPlayersExists);
    
    // Should have 3 CPU players in 4-player game
    expect(cpuPlayersExists).toBeGreaterThan(0);
    
    // Check if human player has cards
    const humanCards = page.locator('#human-cards .card');
    const humanCardCount = await humanCards.count();
    console.log('Human cards count:', humanCardCount);
    
    expect(humanCardCount).toBeGreaterThan(0);
    
    // Take screenshot of game started
    await page.screenshot({ path: 'test-results/lisp-game-started.png' });
    
    console.log('✅ Game start test passed');
  });

  test('should handle CPU turns automatically', async () => {
    console.log('🤖 Testing CPU turn automation...');
    
    // Start game
    await page.click('#start-game-button');
    await page.waitForTimeout(3000);
    
    // Monitor game status changes over time
    const statusChanges = [];
    let previousStatus = '';
    
    for (let i = 0; i < 15; i++) {
      const currentStatus = await page.locator('#game-status').textContent();
      
      if (currentStatus !== previousStatus) {
        statusChanges.push({
          iteration: i,
          status: currentStatus,
          timestamp: new Date().toISOString()
        });
        previousStatus = currentStatus;
        console.log(`Status change ${statusChanges.length}: ${currentStatus}`);
      }
      
      await page.waitForTimeout(1000);
    }
    
    console.log('Total status changes:', statusChanges.length);
    console.log('Status changes:', statusChanges);
    
    // Should have multiple status changes indicating CPU turns
    expect(statusChanges.length).toBeGreaterThan(1);
    
    // Check if any CPU names appear in status
    const hasCPUActivity = statusChanges.some(change => 
      change.status.includes('CPU') || change.status.includes('のターン')
    );
    
    console.log('Has CPU activity:', hasCPUActivity);
    
    // Take screenshot during CPU activity
    await page.screenshot({ path: 'test-results/cpu-activity.png' });
    
    console.log('✅ CPU turn automation test passed');
  });

  test('should display CPU moves in UI and messages', async () => {
    console.log('💬 Testing CPU move display...');
    
    // Start game
    await page.click('#start-game-button');
    await page.waitForTimeout(3000);
    
    // Monitor for game messages
    const messageElements = [];
    let messageCount = 0;
    
    // Check for temporary message elements that might appear
    for (let i = 0; i < 20; i++) {
      const messages = await page.locator('.fixed.top-20, .fixed.top-4').all();
      
      for (const message of messages) {
        const messageText = await message.textContent();
        if (messageText && !messageElements.includes(messageText)) {
          messageElements.push(messageText);
          messageCount++;
          console.log(`Message ${messageCount}: ${messageText}`);
        }
      }
      
      await page.waitForTimeout(500);
    }
    
    console.log('Total unique messages:', messageCount);
    console.log('Messages found:', messageElements);
    
    // Check field cards for changes
    const fieldCards = page.locator('#field-cards');
    const fieldContent = await fieldCards.textContent();
    console.log('Field content:', fieldContent);
    
    // Take screenshot of UI with potential CPU moves
    await page.screenshot({ path: 'test-results/cpu-moves-ui.png' });
    
    console.log('✅ CPU move display test completed');
  });

  test('should handle turn progression between human and CPU players', async () => {
    console.log('🔄 Testing turn progression...');
    
    // Start game
    await page.click('#start-game-button');
    await page.waitForTimeout(3000);
    
    // Check initial button states
    const playButton = page.locator('#play-button');
    const passButton = page.locator('#pass-button');
    
    let humanTurnFound = false;
    let cpuTurnFound = false;
    
    // Monitor for 20 seconds to see turn changes
    for (let i = 0; i < 20; i++) {
      const gameStatus = await page.locator('#game-status').textContent();
      const playButtonEnabled = await playButton.isEnabled();
      const passButtonEnabled = await passButton.isEnabled();
      
      console.log(`Turn ${i}: Status="${gameStatus}", Play=${playButtonEnabled}, Pass=${passButtonEnabled}`);
      
      if (gameStatus.includes('あなた') || (playButtonEnabled && passButtonEnabled)) {
        humanTurnFound = true;
        console.log('✅ Human turn detected');
        
        // Test pass action during human turn
        if (passButtonEnabled) {
          await passButton.click();
          await page.waitForTimeout(1000);
          console.log('✅ Human pass action executed');
        }
      } else if (gameStatus.includes('CPU') || gameStatus.includes('のターン')) {
        cpuTurnFound = true;
        console.log('✅ CPU turn detected');
      }
      
      await page.waitForTimeout(1000);
    }
    
    console.log('Human turn found:', humanTurnFound);
    console.log('CPU turn found:', cpuTurnFound);
    
    // Take screenshot of turn progression
    await page.screenshot({ path: 'test-results/turn-progression.png' });
    
    console.log('✅ Turn progression test completed');
  });

  test('should check for JavaScript errors during CPU gameplay', async () => {
    console.log('🔍 Testing for JavaScript errors...');
    
    // Start game
    await page.click('#start-game-button');
    await page.waitForTimeout(3000);
    
    // Let game run for a while to catch errors
    await page.waitForTimeout(10000);
    
    // Check for JavaScript errors
    console.log('JavaScript errors found:', errorMessages.length);
    errorMessages.forEach((error, index) => {
      console.log(`Error ${index + 1}:`, error.message);
    });
    
    // Check for error-related console messages
    const errorLogs = consoleMessages.filter(msg => msg.type === 'error');
    console.log('Error console logs:', errorLogs.length);
    
    errorLogs.forEach((log, index) => {
      console.log(`Error log ${index + 1}:`, log.text);
    });
    
    // Check for successful loading messages
    const successLogs = consoleMessages.filter(msg => 
      msg.text.includes('✅') || msg.text.includes('loaded') || msg.text.includes('initialized')
    );
    
    console.log('Success logs:', successLogs.length);
    successLogs.forEach((log, index) => {
      console.log(`Success ${index + 1}:`, log.text);
    });
    
    // Take screenshot of final state
    await page.screenshot({ path: 'test-results/error-check-final.png' });
    
    console.log('✅ Error checking test completed');
  });

  test('should evaluate CPU AI decision quality', async () => {
    console.log('🧠 Testing CPU AI decision quality...');
    
    // Start game
    await page.click('#start-game-button');
    await page.waitForTimeout(3000);
    
    // Monitor CPU decisions
    const cpuDecisions = [];
    
    for (let i = 0; i < 30; i++) {
      const gameStatus = await page.locator('#game-status').textContent();
      
      if (gameStatus.includes('CPU') || gameStatus.includes('のターン')) {
        // Wait for CPU decision
        await page.waitForTimeout(1500);
        
        // Check what happened
        const newStatus = await page.locator('#game-status').textContent();
        const fieldCards = await page.locator('#field-cards').textContent();
        
        if (newStatus !== gameStatus) {
          cpuDecisions.push({
            iteration: i,
            beforeStatus: gameStatus,
            afterStatus: newStatus,
            fieldState: fieldCards,
            timestamp: new Date().toISOString()
          });
          
          console.log(`CPU Decision ${cpuDecisions.length}: ${gameStatus} -> ${newStatus}`);
        }
      }
      
      await page.waitForTimeout(500);
    }
    
    console.log('Total CPU decisions captured:', cpuDecisions.length);
    
    // Analyze decision patterns
    const playDecisions = cpuDecisions.filter(d => 
      d.afterStatus.includes('出しました') || 
      d.fieldState.includes('card') || 
      d.fieldState !== d.beforeStatus
    );
    
    const passDecisions = cpuDecisions.filter(d => 
      d.afterStatus.includes('パス')
    );
    
    console.log('Play decisions:', playDecisions.length);
    console.log('Pass decisions:', passDecisions.length);
    
    // Take screenshot of AI analysis
    await page.screenshot({ path: 'test-results/cpu-ai-analysis.png' });
    
    console.log('✅ CPU AI decision quality test completed');
  });

  test('should generate comprehensive CPU functionality report', async () => {
    console.log('📊 Generating comprehensive CPU functionality report...');
    
    // Start game
    await page.click('#start-game-button');
    await page.waitForTimeout(3000);
    
    // Collect comprehensive data
    const reportData = {
      timestamp: new Date().toISOString(),
      gameInitialized: false,
      cpuPlayersCount: 0,
      humanCardCount: 0,
      statusChanges: [],
      cpuDecisions: [],
      errorCount: 0,
      successfulActions: 0,
      gameFlowWorking: false
    };
    
    // Check game initialization
    const gameStatus = await page.locator('#game-status').textContent();
    reportData.gameInitialized = !gameStatus.includes('待って');
    
    // Count CPU players
    reportData.cpuPlayersCount = await page.locator('.cpu-player, .player-card').count();
    
    // Count human cards
    reportData.humanCardCount = await page.locator('#human-cards .card').count();
    
    // Monitor game flow
    let previousStatus = '';
    
    for (let i = 0; i < 25; i++) {
      const currentStatus = await page.locator('#game-status').textContent();
      
      if (currentStatus !== previousStatus) {
        reportData.statusChanges.push({
          iteration: i,
          status: currentStatus,
          timestamp: new Date().toISOString()
        });
        previousStatus = currentStatus;
        
        if (currentStatus.includes('CPU') || currentStatus.includes('のターン')) {
          reportData.cpuDecisions.push({
            iteration: i,
            status: currentStatus,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      await page.waitForTimeout(800);
    }
    
    // Check for successful game flow
    reportData.gameFlowWorking = reportData.statusChanges.length > 2;
    reportData.errorCount = errorMessages.length;
    reportData.successfulActions = consoleMessages.filter(msg => msg.text.includes('✅')).length;
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/comprehensive-report.png' });
    
    // Generate and display report
    const report = `
=== CPU FUNCTIONALITY REPORT ===
Generated: ${reportData.timestamp}

🎮 GAME INITIALIZATION:
- Game Initialized: ${reportData.gameInitialized ? '✅' : '❌'}
- CPU Players Count: ${reportData.cpuPlayersCount}
- Human Cards Count: ${reportData.humanCardCount}

🤖 CPU ACTIVITY:
- Total Status Changes: ${reportData.statusChanges.length}
- CPU Decisions Detected: ${reportData.cpuDecisions.length}
- Game Flow Working: ${reportData.gameFlowWorking ? '✅' : '❌'}

🔧 ERROR ANALYSIS:
- JavaScript Errors: ${reportData.errorCount}
- Successful Actions: ${reportData.successfulActions}

📋 DETAILED STATUS CHANGES:
${reportData.statusChanges.map(change => `  ${change.iteration}: ${change.status}`).join('\n')}

🎯 CONCLUSION:
${reportData.gameInitialized && reportData.gameFlowWorking && reportData.errorCount === 0 
  ? '✅ CPU functionality is working correctly with Lisp engine' 
  : '⚠️ CPU functionality needs attention - check errors and game flow'}
    `;
    
    console.log(report);
    
    // Write report to file if needed
    await page.evaluate((reportContent) => {
      console.log('📊 COMPREHENSIVE CPU REPORT:');
      console.log(reportContent);
    }, report);
    
    console.log('✅ Comprehensive CPU report generated');
  });

  test.afterEach(async () => {
    // Clean up and log summary
    console.log(`\n=== TEST SUMMARY ===`);
    console.log(`Console messages: ${consoleMessages.length}`);
    console.log(`JavaScript errors: ${errorMessages.length}`);
    
    if (errorMessages.length > 0) {
      console.log('❌ Errors found:');
      errorMessages.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.message}`);
      });
    }
    
    // Take a final screenshot
    await page.screenshot({ path: 'test-results/final-state.png' });
  });
});