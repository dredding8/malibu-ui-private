// Quick browser test to capture screenshots and validate visual UX
const { chromium } = require('playwright');

async function quickVisualTest() {
    console.log('📸 Taking screenshots of the improved UX...');
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1400, height: 900 }
    });
    
    const page = await context.newPage();
    
    try {
        // Navigate to test page
        await page.goto('http://localhost:3000/test-opportunities', { 
            waitUntil: 'networkidle',
            timeout: 10000
        });
        
        // Wait for component to load
        await page.waitForTimeout(2000);
        
        // Take screenshot of initial state
        await page.screenshot({ 
            path: './ux-validation-screenshot.png',
            fullPage: true
        });
        
        console.log('✅ Screenshot saved: ux-validation-screenshot.png');
        
        // Test if key elements are present
        const welcomeCard = await page.$('.welcome-card');
        const statsCards = await page.$$('.stat-card');
        const filterButton = await page.$('button[icon="filter"]');
        const table = await page.$('.opportunities-table');
        
        console.log('\n📋 Visual Elements Detected:');
        console.log(`${welcomeCard ? '✅' : '❌'} Welcome card`);
        console.log(`${statsCards.length > 0 ? '✅' : '❌'} Stats overview (${statsCards.length} cards)`);
        console.log(`${filterButton ? '✅' : '❌'} Filter interface`);
        console.log(`${table ? '✅' : '❌'} Main data table`);
        
        // Test responsive design
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(500);
        await page.screenshot({ 
            path: './ux-validation-mobile.png',
            fullPage: true
        });
        
        console.log('✅ Mobile screenshot saved: ux-validation-mobile.png');
        
    } catch (error) {
        console.log(`❌ Visual test failed: ${error.message}`);
        
        // Try to get basic page info
        try {
            const title = await page.title();
            console.log(`Page title: ${title}`);
        } catch (e) {
            console.log('Could not retrieve page info');
        }
    } finally {
        await context.close();
        await browser.close();
    }
}

// Run test
quickVisualTest()
    .then(() => {
        console.log('\n✨ Visual validation completed!');
        console.log('🎯 Screenshots captured for manual review');
    })
    .catch(error => {
        console.error('❌ Test failed:', error.message);
    });