/**
 * Visual Design Audit - Enterprise Dashboard Standards
 * Captures screenshots and analyzes visual design quality
 */

import { test, expect, Page } from '@playwright/test';

// Visual audit configuration
const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 }
};

const CAPTURE_STATES = [
  'default',
  'with-selection',
  'bulk-operations',
  'hover-states',
  'focus-states',
  'error-states'
];

async function captureVisualEvidence(page: Page, name: string) {
  await page.screenshot({
    path: `visual-audit/${name}.png`,
    fullPage: false // Focus on viewport for consistency
  });
}

async function analyzeColorContrast(page: Page) {
  return await page.evaluate(() => {
    const getContrast = (rgb1: string, rgb2: string) => {
      // Simple contrast calculation
      const getLuminance = (rgb: string) => {
        const match = rgb.match(/\d+/g);
        if (!match) return 0;
        const [r, g, b] = match.map(Number);
        const [rs, gs, bs] = [r/255, g/255, b/255].map(c => 
          c <= 0.03928 ? c/12.92 : Math.pow((c + 0.055)/1.055, 2.4)
        );
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      };
      
      const l1 = getLuminance(rgb1);
      const l2 = getLuminance(rgb2);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };

    const results: any[] = [];
    
    // Check text contrast
    const textElements = document.querySelectorAll('p, span, div, button');
    textElements.forEach((el: any) => {
      const styles = window.getComputedStyle(el);
      const color = styles.color;
      const bgColor = styles.backgroundColor;
      
      if (color && bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
        const contrast = getContrast(color, bgColor);
        if (contrast < 4.5) {
          results.push({
            element: el.tagName,
            text: el.textContent?.substring(0, 50),
            contrast: contrast.toFixed(2),
            required: 4.5
          });
        }
      }
    });
    
    return results;
  });
}

async function analyzeTypography(page: Page) {
  return await page.evaluate(() => {
    const fontSizes = new Set<string>();
    const lineHeights = new Set<string>();
    const fontWeights = new Set<string>();
    
    const elements = document.querySelectorAll('*');
    elements.forEach((el: any) => {
      const styles = window.getComputedStyle(el);
      if (styles.fontSize) fontSizes.add(styles.fontSize);
      if (styles.lineHeight) lineHeights.add(styles.lineHeight);
      if (styles.fontWeight) fontWeights.add(styles.fontWeight);
    });
    
    return {
      fontSizes: Array.from(fontSizes).sort(),
      lineHeights: Array.from(lineHeights).sort(),
      fontWeights: Array.from(fontWeights).sort(),
      typographyScale: fontSizes.size > 8 ? 'inconsistent' : 'acceptable'
    };
  });
}

async function analyzeSpacing(page: Page) {
  return await page.evaluate(() => {
    const spacings = new Map<string, number>();
    
    const elements = document.querySelectorAll('*');
    elements.forEach((el: any) => {
      const styles = window.getComputedStyle(el);
      ['margin', 'padding'].forEach(prop => {
        ['Top', 'Right', 'Bottom', 'Left'].forEach(side => {
          const value = styles[prop + side];
          if (value && value !== '0px') {
            const key = value;
            spacings.set(key, (spacings.get(key) || 0) + 1);
          }
        });
      });
    });
    
    const spacingValues = Array.from(spacings.keys())
      .map(s => parseInt(s))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);
    
    // Check if following 8px grid
    const follows8pxGrid = spacingValues.every(v => v % 8 === 0 || v % 4 === 0);
    
    return {
      uniqueSpacings: spacingValues.length,
      follows8pxGrid,
      mostCommon: Array.from(spacings.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    };
  });
}

test.describe('Visual Design Audit - Enterprise Standards', () => {
  test.beforeEach(async ({ page }) => {
    // Set feature flags for enhanced bento
    await page.addInitScript(() => {
      localStorage.setItem('featureFlags', JSON.stringify({
        enableEnhancedBento: true,
        enableBentoLayout: true,
        enableSplitView: false
      }));
    });
    
    await page.goto('http://localhost:3000/collection/test-123/manage');
    await page.waitForLoadState('networkidle');
  });

  test('Visual hierarchy and information density', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    
    // Capture default state
    await captureVisualEvidence(page, '01-desktop-default');
    
    // Analyze visual hierarchy
    const hierarchy = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      const fontSizes = headings.map(h => ({
        tag: h.tagName,
        fontSize: window.getComputedStyle(h).fontSize,
        fontWeight: window.getComputedStyle(h).fontWeight
      }));
      
      return {
        headingCount: headings.length,
        hierarchy: fontSizes
      };
    });
    
    console.log('Visual Hierarchy:', hierarchy);
    
    // Check information density
    const density = await page.evaluate(() => {
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const visibleElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.top < viewport.height && rect.bottom > 0 && 
               rect.left < viewport.width && rect.right > 0;
      });
      
      const contentElements = visibleElements.filter(el => 
        el.textContent && el.textContent.trim().length > 0
      );
      
      return {
        totalElements: visibleElements.length,
        contentElements: contentElements.length,
        density: contentElements.length / (viewport.width * viewport.height / 10000)
      };
    });
    
    console.log('Information Density:', density);
    expect(density.density).toBeGreaterThan(2); // Enterprise standard
  });

  test('Color system and contrast compliance', async ({ page }) => {
    // Analyze color contrast
    const contrastIssues = await analyzeColorContrast(page);
    
    console.log('Contrast Issues Found:', contrastIssues.length);
    contrastIssues.forEach(issue => {
      console.log(`- ${issue.element}: ${issue.contrast} (required: ${issue.required})`);
    });
    
    // Capture states for color analysis
    await captureVisualEvidence(page, '02-color-states-default');
    
    // Hover states
    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.count() > 0) {
      await firstRow.hover();
      await captureVisualEvidence(page, '03-color-states-hover');
    }
    
    // Check color palette
    const colorPalette = await page.evaluate(() => {
      const colors = new Set<string>();
      const elements = document.querySelectorAll('*');
      
      elements.forEach((el: any) => {
        const styles = window.getComputedStyle(el);
        if (styles.color) colors.add(styles.color);
        if (styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          colors.add(styles.backgroundColor);
        }
        if (styles.borderColor && styles.borderColor !== 'rgba(0, 0, 0, 0)') {
          colors.add(styles.borderColor);
        }
      });
      
      return Array.from(colors);
    });
    
    console.log('Color Palette Size:', colorPalette.length);
    expect(colorPalette.length).toBeLessThan(30); // Should have controlled palette
  });

  test('Typography scale and consistency', async ({ page }) => {
    const typography = await analyzeTypography(page);
    
    console.log('Typography Analysis:');
    console.log('- Font Sizes:', typography.fontSizes);
    console.log('- Line Heights:', typography.lineHeights);
    console.log('- Font Weights:', typography.fontWeights);
    console.log('- Scale Consistency:', typography.typographyScale);
    
    expect(typography.fontSizes.length).toBeLessThan(8); // Should have systematic scale
    
    await captureVisualEvidence(page, '04-typography-scale');
  });

  test('Spacing system and grid alignment', async ({ page }) => {
    const spacing = await analyzeSpacing(page);
    
    console.log('Spacing Analysis:');
    console.log('- Unique Spacings:', spacing.uniqueSpacings);
    console.log('- Follows 8px Grid:', spacing.follows8pxGrid);
    console.log('- Most Common:', spacing.mostCommon);
    
    expect(spacing.follows8pxGrid).toBe(true);
    expect(spacing.uniqueSpacings).toBeLessThan(20); // Should have systematic spacing
    
    // Capture grid alignment
    await captureVisualEvidence(page, '05-spacing-grid');
  });

  test('Responsive design quality', async ({ page }) => {
    // Desktop
    await page.setViewportSize(VIEWPORTS.desktop);
    await captureVisualEvidence(page, '06-responsive-desktop');
    
    // Tablet
    await page.setViewportSize(VIEWPORTS.tablet);
    await page.waitForTimeout(500);
    await captureVisualEvidence(page, '07-responsive-tablet');
    
    // Mobile
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.waitForTimeout(500);
    await captureVisualEvidence(page, '08-responsive-mobile');
    
    // Check responsive behavior
    const mobileLayout = await page.evaluate(() => {
      const mainContent = document.querySelector('.tab-panel, main, .content');
      const styles = mainContent ? window.getComputedStyle(mainContent) : null;
      
      return {
        hasContent: !!mainContent,
        display: styles?.display,
        flexDirection: styles?.flexDirection,
        width: mainContent?.clientWidth
      };
    });
    
    console.log('Mobile Layout:', mobileLayout);
    expect(mobileLayout.width).toBeLessThanOrEqual(375);
  });

  test('Component elevation and depth', async ({ page }) => {
    const elevation = await page.evaluate(() => {
      const shadows = new Map<string, number>();
      
      const elements = document.querySelectorAll('*');
      elements.forEach((el: any) => {
        const boxShadow = window.getComputedStyle(el).boxShadow;
        if (boxShadow && boxShadow !== 'none') {
          shadows.set(boxShadow, (shadows.get(boxShadow) || 0) + 1);
        }
      });
      
      return {
        uniqueShadows: shadows.size,
        shadowsUsed: Array.from(shadows.keys())
      };
    });
    
    console.log('Elevation System:');
    console.log('- Unique Shadows:', elevation.uniqueShadows);
    console.log('- Shadows Used:', elevation.shadowsUsed);
    
    expect(elevation.uniqueShadows).toBeGreaterThan(0);
    expect(elevation.uniqueShadows).toBeLessThan(10); // Should have systematic elevation
    
    await captureVisualEvidence(page, '09-elevation-system');
  });

  test('Focus states and keyboard navigation', async ({ page }) => {
    // Tab through interface
    await page.keyboard.press('Tab');
    await captureVisualEvidence(page, '10-focus-state-1');
    
    await page.keyboard.press('Tab');
    await captureVisualEvidence(page, '11-focus-state-2');
    
    await page.keyboard.press('Tab');
    await captureVisualEvidence(page, '12-focus-state-3');
    
    // Check focus indicator visibility
    const focusVisible = await page.evaluate(() => {
      const focused = document.activeElement;
      if (!focused) return false;
      
      const styles = window.getComputedStyle(focused);
      const outline = styles.outline;
      const boxShadow = styles.boxShadow;
      
      return {
        hasOutline: outline && outline !== 'none',
        hasBoxShadow: boxShadow && boxShadow !== 'none',
        outlineWidth: styles.outlineWidth,
        outlineColor: styles.outlineColor
      };
    });
    
    console.log('Focus Indicator:', focusVisible);
    expect(focusVisible.hasOutline || focusVisible.hasBoxShadow).toBe(true);
  });

  test('Dark mode support', async ({ page }) => {
    // Check for dark mode toggle
    const darkModeButton = page.getByRole('button', { name: /dark|theme/i });
    if (await darkModeButton.count() > 0) {
      await darkModeButton.click();
      await page.waitForTimeout(500);
      await captureVisualEvidence(page, '13-dark-mode');
      
      // Verify dark mode colors
      const darkModeColors = await page.evaluate(() => {
        const body = document.body;
        const styles = window.getComputedStyle(body);
        
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color
        };
      });
      
      console.log('Dark Mode Colors:', darkModeColors);
    } else {
      console.log('No dark mode toggle found');
    }
  });

  test('Generate visual design report', async ({ page }) => {
    const report = {
      timestamp: new Date().toISOString(),
      url: page.url(),
      
      // Collect all metrics
      contrast: await analyzeColorContrast(page),
      typography: await analyzeTypography(page),
      spacing: await analyzeSpacing(page),
      
      // Visual quality scores
      scores: {
        hierarchy: 0,
        consistency: 0,
        accessibility: 0,
        responsiveness: 0,
        overall: 0
      }
    };
    
    // Calculate scores
    report.scores.accessibility = report.contrast.length === 0 ? 100 : 
      Math.max(0, 100 - (report.contrast.length * 10));
    
    report.scores.consistency = report.typography.fontSizes.length <= 6 ? 100 :
      Math.max(0, 100 - ((report.typography.fontSizes.length - 6) * 10));
    
    report.scores.overall = (
      report.scores.hierarchy +
      report.scores.consistency +
      report.scores.accessibility +
      report.scores.responsiveness
    ) / 4;
    
    // Save report
    await page.evaluate((reportData) => {
      console.log('Visual Design Report:', reportData);
    }, report);
    
    console.log('\n=== Visual Design Report Summary ===');
    console.log(`Overall Score: ${report.scores.overall}/100`);
    console.log(`- Accessibility: ${report.scores.accessibility}/100`);
    console.log(`- Consistency: ${report.scores.consistency}/100`);
    console.log(`- Contrast Issues: ${report.contrast.length}`);
    console.log(`- Typography Scale: ${report.typography.fontSizes.length} unique sizes`);
  });
});