/**
 * Find and Validate Pass Data Display
 *
 * Look for wherever pass information is actually displayed in the modal
 * and validate it matches legacy requirements
 */

import { test, expect } from '@playwright/test';

test.describe('Find and Validate Pass Data', () => {
  test('find where pass data is displayed and validate legacy compliance', async ({ page }) => {
    test.setTimeout(120000);

    console.log('\n========================================');
    console.log('FINDING PASS DATA IN MODAL');
    console.log('========================================\n');

    // Navigate and open modal
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('Opening modal...');
    await page.waitForSelector('text=Opportunity 1', { timeout: 10000 });

    // Click any button to open modal
    const contentButtons = page.locator('button').filter({ hasText: '' });
    await contentButtons.first().click();
    await page.waitForTimeout(2000);

    const modal = page.locator('[role="dialog"]');
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    console.log('✓ Modal opened\n');

    // Click Allocation tab
    const allocationTab = modal.locator('[role="tab"]:has-text("Allocation")');
    if (await allocationTab.isVisible().catch(() => false)) {
      await allocationTab.click();
      await page.waitForTimeout(1500);
    }

    await page.screenshot({ path: 'pass-data-1-modal.png', fullPage: true });

    console.log('========================================');
    console.log('SEARCHING FOR PASS INFORMATION');
    console.log('========================================\n');

    // Look for any text that indicates pass times, satellites, priorities
    console.log('1. Checking for TIME information...');

    // Look for times in various formats
    const timePatterns = [
      /\d{1,2}:\d{2}\s*(AM|PM|Z)?/,  // 3:42 PM or 1542Z
      /\d{4}Z/,                        // 1542Z
      /\d{2}:\d{2}/                    // 15:42
    ];

    const modalText = await modal.textContent();
    let foundTimes = false;

    for (const pattern of timePatterns) {
      const matches = modalText?.match(new RegExp(pattern, 'g'));
      if (matches && matches.length > 0) {
        console.log(`   ✓ Found time data: ${matches.slice(0, 3).join(', ')}${matches.length > 3 ? '...' : ''}`);
        foundTimes = true;
        break;
      }
    }

    if (!foundTimes) {
      console.log('   ⚠️  No time data found');
    }

    // Look for satellite names
    console.log('\n2. Checking for SATELLITE information...');
    const satellitePattern = /(WV-\d+|GOES-\d+|Satellite|SAT-\d+)/i;
    const satellites = modalText?.match(new RegExp(satellitePattern, 'g'));
    if (satellites) {
      console.log(`   ✓ Found satellites: ${satellites.slice(0, 3).join(', ')}`);
    } else {
      console.log('   ⚠️  No satellite names found');
    }

    // Look for priority keywords
    console.log('\n3. Checking for PRIORITY information...');
    const priorityPattern = /(CRITICAL|HIGH|NORMAL|critical|high|normal)/g;
    const priorities = modalText?.match(priorityPattern);
    if (priorities) {
      console.log(`   ✓ Found priorities: ${priorities.slice(0, 3).join(', ')}`);

      // Check if uppercase
      const hasUppercase = priorities.some(p => p === p.toUpperCase());
      const hasLowercase = priorities.some(p => p === p.toLowerCase());

      if (hasUppercase && !hasLowercase) {
        console.log(`   ✅ Priorities are UPPERCASE (legacy compliant)`);
      } else if (hasLowercase) {
        console.log(`   ❌ Priorities include lowercase (not legacy compliant)`);
      }
    } else {
      console.log('   ⚠️  No priority information found');
    }

    // Look for classification levels
    console.log('\n4. Checking for CLASSIFICATION information...');
    const classificationPattern = /(UNCLASSIFIED|CONFIDENTIAL|SECRET|TOP SECRET|S\/\/REL|S\/\/NF)/g;
    const classifications = modalText?.match(classificationPattern);
    if (classifications) {
      console.log(`   ✓ Found classifications: ${classifications.slice(0, 3).join(', ')}`);
    } else {
      console.log('   ⚠️  No classification banners found');
    }

    // Look for conflict indicators
    console.log('\n5. Checking for CONFLICT indicators...');
    const conflictPattern = /(conflict|CONFLICT)/gi;
    const conflicts = modalText?.match(conflictPattern);
    if (conflicts) {
      console.log(`   ✓ Found conflict references: ${conflicts.length} occurrences`);
    } else {
      console.log('   ⚠️  No conflict indicators found');
    }

    console.log('\n========================================');
    console.log('ANALYZING MODAL STRUCTURE');
    console.log('========================================\n');

    // Get all the sections/panels in the modal
    console.log('Modal sections:');
    const headings = modal.locator('h1, h2, h3, h4, h5, h6, [class*="heading"], [class*="title"]');
    const headingCount = await headings.count();

    for (let i = 0; i < headingCount; i++) {
      const heading = headings.nth(i);
      const text = await heading.textContent();
      const tagName = await heading.evaluate(el => el.tagName);
      if (text && text.trim().length > 0 && text.trim().length < 100) {
        console.log(`   ${tagName}: "${text.trim()}"`);
      }
    }

    // Look for any cards, items, rows that might contain pass data
    console.log('\n========================================');
    console.log('LOOKING FOR PASS DATA CONTAINERS');
    console.log('========================================\n');

    const possibleContainers = [
      '.pass',
      '[class*="pass"]',
      '.item',
      '[class*="item"]',
      '.card',
      '[class*="card"]',
      '.row',
      '[data-pass]',
      '[data-item]'
    ];

    for (const selector of possibleContainers) {
      const elements = modal.locator(selector);
      const count = await elements.count();

      if (count > 0 && count < 100) { // Avoid matching too many generic elements
        console.log(`Found ${count} elements matching: ${selector}`);

        // Get a sample of text from first element
        const firstEl = elements.first();
        const sampleText = await firstEl.textContent();
        if (sampleText && sampleText.trim().length > 0) {
          console.log(`   Sample: "${sampleText.trim().substring(0, 150)}..."`);
        }
      }
    }

    // Take detailed screenshots
    console.log('\n========================================');
    console.log('CAPTURING DETAILED SCREENSHOTS');
    console.log('========================================\n');

    await page.screenshot({ path: 'pass-data-2-full-modal.png', fullPage: true });

    // Try to screenshot the left panel (Available Passes)
    const leftPanel = modal.locator('[class*="left"], [class*="available"]').first();
    if (await leftPanel.isVisible().catch(() => false)) {
      await leftPanel.screenshot({ path: 'pass-data-3-left-panel.png' });
      console.log('✓ Captured left panel screenshot');
    }

    // Try to screenshot the right panel
    const rightPanel = modal.locator('[class*="right"], [class*="allocated"]').first();
    if (await rightPanel.isVisible().catch(() => false)) {
      await rightPanel.screenshot({ path: 'pass-data-4-right-panel.png' });
      console.log('✓ Captured right panel screenshot');
    }

    // Get the full modal HTML for analysis
    const modalHTML = await modal.innerHTML();
    console.log(`\nModal HTML length: ${modalHTML.length} characters`);
    console.log('(Check pass-data-modal.html for full HTML)\n');

    // Save HTML to file for inspection
    const fs = require('fs');
    fs.writeFileSync('pass-data-modal.html', `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Modal HTML Capture</title>
    <style>
        body { font-family: monospace; padding: 20px; }
        pre { background: #f5f5f5; padding: 15px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Captured Modal HTML</h1>
    <p>Captured at: ${new Date().toISOString()}</p>
    <hr>
    ${modalHTML}
</body>
</html>
    `);

    console.log('========================================');
    console.log('ANALYSIS COMPLETE');
    console.log('========================================\n');
    console.log('Review generated files:');
    console.log('  - pass-data-*.png (screenshots)');
    console.log('  - pass-data-modal.html (full HTML)');
    console.log('\n');
  });
});
