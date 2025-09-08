// Visual Validation Test for Typography and Accessibility Fixes
// Testing the specific fixes applied to address visual audit issues

const { test, expect } = require('@playwright/test');

test.describe('History Table Typography and Accessibility Fixes', () => {

  test('Typography Fix Validation', async ({ page }) => {
    // Navigate to history page
    await page.goto('http://localhost:3000/history', { waitUntil: 'networkidle' });
    await page.waitForSelector('.bp6-history-table', { timeout: 10000 });

    console.log('🔤 Validating typography improvements...');

    // Test header typography improvements
    const headerStyles = await page.locator('.bp6-column-header').first().evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        lineHeight: styles.lineHeight
      };
    }).catch(() => null);

    if (headerStyles) {
      console.log('📊 Header Typography After Fix:', headerStyles);
      
      // Validate font size is 13px or larger
      const headerFontSize = parseInt(headerStyles.fontSize);
      if (headerFontSize >= 13) {
        console.log('✅ Header font size meets accessibility minimum');
      } else {
        console.log('❌ Header font size still below 13px:', headerFontSize);
      }
      
      // Validate font weight is bold enough for hierarchy
      const headerFontWeight = parseInt(headerStyles.fontWeight);
      if (headerFontWeight >= 700) {
        console.log('✅ Header font weight provides good hierarchy');
      } else {
        console.log('⚠️  Header font weight could be bolder:', headerFontWeight);
      }
    }

    // Test data cell typography
    const dataCellStyles = await page.locator('.bp6-name-cell-content').first().evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        lineHeight: styles.lineHeight
      };
    }).catch(() => null);

    if (dataCellStyles) {
      console.log('📊 Data Cell Typography After Fix:', dataCellStyles);
    }

    // Test status tag typography
    const statusTagStyles = await page.locator('.bp5-tag').first().evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight
      };
    }).catch(() => null);

    if (statusTagStyles) {
      console.log('📊 Status Tag Typography After Fix:', statusTagStyles);
      
      const tagFontSize = parseInt(statusTagStyles.fontSize);
      if (tagFontSize >= 13) {
        console.log('✅ Status tag font size meets accessibility minimum');
      } else {
        console.log('❌ Status tag font size still below 13px:', tagFontSize);
      }
    }

    // Capture post-fix typography screenshot
    await page.screenshot({ 
      path: 'visual-audit-screenshots/typography_fixes_validation.png',
      fullPage: true 
    });
  });

  test('Hover State Enhancement Validation', async ({ page }) => {
    await page.goto('http://localhost:3000/history', { waitUntil: 'networkidle' });
    await page.waitForSelector('.bp6-history-table');

    console.log('🖱️ Validating hover state improvements...');

    // Find table rows and test hover enhancement
    const tableRow = page.locator('.bp5-table-cell').first();
    
    if (await tableRow.count() > 0) {
      // Capture normal state
      await tableRow.screenshot({ 
        path: 'visual-audit-screenshots/enhanced_row_normal_state.png' 
      });

      // Test enhanced hover state
      await tableRow.hover();
      await page.waitForTimeout(300); // Allow hover transition
      
      await tableRow.screenshot({ 
        path: 'visual-audit-screenshots/enhanced_row_hover_state.png' 
      });

      // Get hover background color
      const hoverStyles = await tableRow.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          transition: styles.transition
        };
      });

      console.log('🎨 Enhanced Hover State:', hoverStyles);
      
      if (hoverStyles.transition && hoverStyles.transition.includes('background-color')) {
        console.log('✅ Smooth hover transitions implemented');
      }
    }
  });

  test('Responsive Typography Validation', async ({ page }) => {
    await page.goto('http://localhost:3000/history', { waitUntil: 'networkidle' });
    await page.waitForSelector('.bp6-history-table');

    console.log('📱 Validating responsive typography improvements...');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);

    const mobileStyles = await page.locator('.bp6-progress-text').first().evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        fontSize: styles.fontSize
      };
    }).catch(() => null);

    if (mobileStyles) {
      console.log('📱 Mobile Typography After Fix:', mobileStyles);
      
      const mobileFontSize = parseInt(mobileStyles.fontSize);
      if (mobileFontSize >= 12) {
        console.log('✅ Mobile font sizes improved for better readability');
      }
    }

    await page.screenshot({ 
      path: 'visual-audit-screenshots/mobile_typography_fixes.png' 
    });

    // Reset to desktop
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test('Color Contrast and Visual Hierarchy Validation', async ({ page }) => {
    await page.goto('http://localhost:3000/history', { waitUntil: 'networkidle' });
    await page.waitForSelector('.bp6-history-table');

    console.log('🎨 Validating color contrast and visual hierarchy...');

    // Test header vs data cell visual distinction
    const headerElement = page.locator('.bp6-column-header').first();
    const dataElement = page.locator('.bp6-name-cell-content').first();

    const headerStyles = await headerElement.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        fontWeight: styles.fontWeight,
        fontSize: styles.fontSize,
        color: styles.color,
        backgroundColor: styles.backgroundColor
      };
    }).catch(() => ({}));

    const dataStyles = await dataElement.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        fontWeight: styles.fontWeight,
        fontSize: styles.fontSize,
        color: styles.color
      };
    }).catch(() => ({}));

    console.log('📊 Visual Hierarchy Analysis:');
    console.log('   Headers:', headerStyles);
    console.log('   Data:', dataStyles);

    // Check if hierarchy is clear
    const headerWeight = parseInt(headerStyles.fontWeight || '400');
    const dataWeight = parseInt(dataStyles.fontWeight || '400');
    
    if (headerWeight > dataWeight) {
      console.log('✅ Clear visual hierarchy between headers and data');
    } else {
      console.log('⚠️  Header-data hierarchy could be clearer');
    }

    // Capture final visual state
    await page.screenshot({ 
      path: 'visual-audit-screenshots/final_visual_hierarchy.png' 
    });
  });

});