// Playwright Visual Design Testing for History Table
// Comprehensive visual audit focusing on design principles

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('History Table Visual Design Audit', () => {
  
  test.beforeEach(async ({ page }) => {
    // Create screenshots directory
    const screenshotsDir = path.join(__dirname, 'visual-audit-screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir);
    }
  });

  test('1. Visual Baseline Capture and Navigation', async ({ page }) => {
    console.log('🔍 Starting Visual Design Audit for History Table');
    console.log('=' * 60);

    // Navigate to history page
    console.log('📍 Navigating to http://localhost:3000/history');
    await page.goto('http://localhost:3000/history', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Wait for table to render
    console.log('⏳ Waiting for history table to render...');
    await page.waitForSelector('.bp6-history-table', { timeout: 10000 });

    // Capture full page baseline
    console.log('📸 Capturing full page baseline screenshot');
    await page.screenshot({ 
      path: 'visual-audit-screenshots/01_full_page_baseline.png', 
      fullPage: true 
    });

    // Capture table element isolation
    console.log('📸 Capturing isolated table component');
    const tableElement = page.locator('.bp6-history-table');
    await expect(tableElement).toBeVisible();
    await tableElement.screenshot({ 
      path: 'visual-audit-screenshots/02_table_component_isolated.png' 
    });

    console.log('✅ Baseline capture completed');
  });

  test('2. Responsive Design Testing', async ({ page }) => {
    await page.goto('http://localhost:3000/history', { waitUntil: 'networkidle' });
    await page.waitForSelector('.bp6-history-table');

    // Test different viewport sizes
    const viewports = [
      { name: 'mobile', width: 375, height: 812 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1440, height: 900 },
      { name: 'large_desktop', width: 1920, height: 1080 }
    ];

    console.log('📱 Testing responsive design across viewports');
    
    for (const viewport of viewports) {
      console.log(`  → Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      await page.setViewportSize({ 
        width: viewport.width, 
        height: viewport.height 
      });
      
      // Allow time for reflow
      await page.waitForTimeout(500);
      
      await page.screenshot({ 
        path: `visual-audit-screenshots/03_responsive_${viewport.name}.png`,
        fullPage: true 
      });
    }

    // Reset to desktop for further testing
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test('3. Table Structure and Components Analysis', async ({ page }) => {
    await page.goto('http://localhost:3000/history', { waitUntil: 'networkidle' });
    await page.waitForSelector('.bp6-history-table');

    console.log('🔍 Analyzing table structure and components');

    // Check Blueprint Table component
    const blueprintTable = page.locator('.bp5-table, .bp6-table');
    if (await blueprintTable.count() > 0) {
      console.log('✅ Blueprint Table component detected');
      await blueprintTable.screenshot({ 
        path: 'visual-audit-screenshots/04_blueprint_table_structure.png' 
      });
    }

    // Capture table headers
    const headers = page.locator('.bp5-table-column-headers, .bp6-column-header');
    if (await headers.count() > 0) {
      console.log('✅ Table headers found');
      await headers.screenshot({ 
        path: 'visual-audit-screenshots/05_table_headers.png' 
      });
    }

    // Capture individual cells for detailed analysis
    const nameCells = page.locator('.bp6-name-cell-content').first();
    if (await nameCells.count() > 0) {
      await nameCells.screenshot({ 
        path: 'visual-audit-screenshots/06_name_cell_detail.png' 
      });
    }

    // Capture status indicators
    const statusTags = page.locator('.bp5-tag').first();
    if (await statusTags.count() > 0) {
      await statusTags.screenshot({ 
        path: 'visual-audit-screenshots/07_status_indicators.png' 
      });
    }
  });

  test('4. Interactive State Testing', async ({ page }) => {
    await page.goto('http://localhost:3000/history', { waitUntil: 'networkidle' });
    await page.waitForSelector('.bp6-history-table');

    console.log('🖱️ Testing interactive states');

    // Find table rows for hover testing
    const tableRows = page.locator('.bp5-table-cell').first();
    
    if (await tableRows.count() > 0) {
      // Capture normal state
      await tableRows.screenshot({ 
        path: 'visual-audit-screenshots/08_row_normal_state.png' 
      });

      // Test hover state
      await tableRows.hover();
      await page.waitForTimeout(200); // Allow hover animation
      await tableRows.screenshot({ 
        path: 'visual-audit-screenshots/09_row_hover_state.png' 
      });
    }

    // Test button states if available
    const actionButtons = page.locator('.bp5-button').first();
    if (await actionButtons.count() > 0) {
      await actionButtons.screenshot({ 
        path: 'visual-audit-screenshots/10_button_normal_state.png' 
      });

      await actionButtons.hover();
      await page.waitForTimeout(200);
      await actionButtons.screenshot({ 
        path: 'visual-audit-screenshots/11_button_hover_state.png' 
      });
    }
  });

  test('5. Typography and Spacing Analysis', async ({ page }) => {
    await page.goto('http://localhost:3000/history', { waitUntil: 'networkidle' });
    await page.waitForSelector('.bp6-history-table');

    console.log('🔤 Analyzing typography and spacing');

    // Get computed styles for key elements
    const headerStyles = await page.locator('.bp6-header-content').first().evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        lineHeight: styles.lineHeight,
        padding: styles.padding,
        color: styles.color,
        backgroundColor: styles.backgroundColor
      };
    }).catch(() => null);

    if (headerStyles) {
      console.log('📊 Header Typography Analysis:', headerStyles);
    }

    // Analyze data cell typography
    const dataCellStyles = await page.locator('.bp6-name-cell-content').first().evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        lineHeight: styles.lineHeight,
        padding: styles.padding,
        color: styles.color
      };
    }).catch(() => null);

    if (dataCellStyles) {
      console.log('📊 Data Cell Typography Analysis:', dataCellStyles);
    }

    // Capture close-up of typography for manual analysis
    const firstRow = page.locator('.bp5-table-cell').first();
    if (await firstRow.count() > 0) {
      await firstRow.screenshot({ 
        path: 'visual-audit-screenshots/12_typography_closeup.png' 
      });
    }
  });

  test('6. Color and Contrast Analysis', async ({ page }) => {
    await page.goto('http://localhost:3000/history', { waitUntil: 'networkidle' });
    await page.waitForSelector('.bp6-history-table');

    console.log('🎨 Analyzing colors and contrast');

    // Test high contrast mode if available
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: 'visual-audit-screenshots/13_dark_mode_test.png',
      fullPage: true 
    });

    // Reset to light mode
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForTimeout(500);

    // Capture different status colors for analysis
    const statusElements = page.locator('.bp5-tag');
    const statusCount = await statusElements.count();
    
    for (let i = 0; i < Math.min(statusCount, 5); i++) {
      const statusElement = statusElements.nth(i);
      if (await statusElement.isVisible()) {
        await statusElement.screenshot({ 
          path: `visual-audit-screenshots/14_status_color_${i}.png` 
        });
      }
    }
  });

  test('7. Accessibility Visual Testing', async ({ page }) => {
    await page.goto('http://localhost:3000/history', { waitUntil: 'networkidle' });
    await page.waitForSelector('.bp6-history-table');

    console.log('♿ Testing accessibility visual cues');

    // Test keyboard navigation focus indicators
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await page.screenshot({ 
      path: 'visual-audit-screenshots/15_keyboard_focus_1.png' 
    });

    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await page.screenshot({ 
      path: 'visual-audit-screenshots/16_keyboard_focus_2.png' 
    });

    // Test reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: 'visual-audit-screenshots/17_reduced_motion.png' 
    });
  });

});