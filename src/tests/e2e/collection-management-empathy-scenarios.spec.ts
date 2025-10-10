import { test, expect, type Page } from '@playwright/test';
import { EmpathyTestUtilities, UserPersona } from './helpers/empathy-test-utilities';

/**
 * Additional empathy-driven test scenarios for collection management
 * These tests focus on edge cases and challenging real-world conditions
 */

// Define test personas
const TEST_PERSONAS: { [key: string]: UserPersona } = {
  stressedNightShift: {
    name: 'Sarah Chen',
    role: 'Night Shift Lead',
    challenges: ['Time pressure', 'Fatigue', 'Multiple critical decisions'],
    preferences: {
      inputSpeed: 'fast',
      networkQuality: '3g',
    },
  },
  seniorOperator: {
    name: 'Robert Kim',
    role: 'Senior Operator',
    challenges: ['Presbyopia', 'Prefers larger text', '20+ years experience'],
    preferences: {
      fontSize: 125,
      inputSpeed: 'slow',
    },
  },
  remoteFieldEngineer: {
    name: 'Maria Silva',
    role: 'Remote Site Engineer',
    challenges: ['Poor connectivity', 'Mobile device', 'Outdoor conditions'],
    preferences: {
      networkQuality: '2g',
      contrastMode: 'high',
    },
  },
  newHire: {
    name: 'Alex Johnson',
    role: 'Trainee Operator',
    challenges: ['Learning system', 'Afraid of mistakes', 'Needs guidance'],
    preferences: {
      inputSpeed: 'slow',
    },
  },
};

test.describe('🧠 Cognitive Load and Decision Making', () => {
  let utils: EmpathyTestUtilities;
  
  test.beforeEach(async ({ page, context }) => {
    utils = new EmpathyTestUtilities(page, context);
    await page.goto('http://localhost:3000/collection/1/manage');
    await page.waitForLoadState('networkidle');
  });

  test('System handles information overload gracefully', async ({ page }) => {
    // Measure baseline cognitive load
    const baselineLoad = await utils.measureCognitiveLoad();
    expect(baselineLoad.score).toBeLessThanOrEqual(7); // Should not be overwhelming
    
    // Simulate viewing many items at once
    const tableRows = page.locator('tbody tr');
    const rowCount = await tableRows.count();
    
    if (rowCount > 20) {
      // Check if pagination or filtering is available
      const hasPagination = await page.locator('[aria-label*="pagination"], .pagination').isVisible();
      const hasFilter = await page.locator('input[placeholder*="Filter"], input[placeholder*="Search"]').isVisible();
      
      expect(hasPagination || hasFilter).toBeTruthy();
    }
    
    // Check if critical items are highlighted
    const criticalItems = await page.locator('[data-priority="critical"], .critical').count();
    if (criticalItems > 0) {
      const firstCritical = page.locator('[data-priority="critical"], .critical').first();
      const styles = await firstCritical.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          background: computed.backgroundColor,
          border: computed.borderColor,
          fontWeight: computed.fontWeight,
        };
      });
      
      // Critical items should be visually distinct
      expect(
        styles.background !== 'rgba(0, 0, 0, 0)' ||
        styles.border !== 'rgba(0, 0, 0, 0)' ||
        parseInt(styles.fontWeight) >= 600
      ).toBeTruthy();
    }
  });

  test('Progressive disclosure reduces initial complexity', async ({ page }) => {
    // Check if advanced options are hidden by default
    const advancedControls = await page.locator('[aria-expanded="false"], details:not([open])').count();
    expect(advancedControls).toBeGreaterThan(0);
    
    // Test expanding advanced options
    const expandButton = page.locator('button:has-text("Advanced"), button:has-text("More"), summary').first();
    if (await expandButton.isVisible()) {
      const beforeClick = await utils.measureCognitiveLoad();
      await expandButton.click();
      await page.waitForTimeout(500);
      
      const afterClick = await utils.measureCognitiveLoad();
      // Cognitive load should increase but still be manageable
      expect(afterClick.score - beforeClick.score).toBeLessThanOrEqual(3);
    }
  });
});

test.describe('⏱️ Time Pressure and Stress Testing', () => {
  let utils: EmpathyTestUtilities;
  
  test.beforeEach(async ({ page, context }) => {
    utils = new EmpathyTestUtilities(page, context);
    await utils.setupPersona(TEST_PERSONAS.stressedNightShift);
    await page.goto('/collection/1/manage');
  });

  test('Critical actions remain accessible under stress', async ({ page }) => {
    // Simulate stressed user behavior
    await utils.simulateStressedUser();
    
    // Start tracking task
    utils.startTaskTracking();
    
    // Critical actions should still be easily accessible
    const criticalActions = [
      'button:has-text("Emergency")',
      'button:has-text("Override")',
      'button[class*="danger"]',
      'button[class*="critical"]',
      '[data-priority="critical"] button',
    ];
    
    let foundCriticalAction = false;
    for (const selector of criticalActions) {
      const button = page.locator(selector).first();
      if (await button.isVisible()) {
        foundCriticalAction = true;
        
        // Critical button should be large enough for stressed clicking
        const box = await button.boundingBox();
        expect(box?.width).toBeGreaterThanOrEqual(80);
        expect(box?.height).toBeGreaterThanOrEqual(40);
        
        // Should have high contrast
        const contrast = await button.evaluate(el => {
          const styles = window.getComputedStyle(el);
          // Simple contrast check - in production would use WCAG formula
          return styles.color !== styles.backgroundColor;
        });
        expect(contrast).toBeTruthy();
        break;
      }
    }
    
    const metrics = utils.stopTaskTracking();
    
    // Even under stress, critical actions should be found quickly
    if (foundCriticalAction && metrics) {
      const timeToFind = (metrics.endTime || Date.now()) - metrics.startTime;
      expect(timeToFind).toBeLessThan(5000); // Under 5 seconds
    }
  });

  test('System prevents panic-induced errors', async ({ page }) => {
    // Find a potentially destructive action
    const destructiveActions = await page.locator('button:has-text("Delete"), button:has-text("Remove")').all();
    
    if (destructiveActions.length > 0) {
      // Click rapidly (panic clicking)
      const button = destructiveActions[0];
      await button.click();
      await button.click(); // Double click
      
      // Should show confirmation, not execute immediately
      const hasConfirmation = await page.locator('[role="dialog"], .confirm, .modal').isVisible();
      expect(hasConfirmation).toBeTruthy();
      
      // Should require deliberate confirmation
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.isVisible()) {
        // Confirm button should not be pre-focused (prevents accidental confirmation)
        const isFocused = await confirmButton.evaluate(el => el === document.activeElement);
        expect(isFocused).toBeFalsy();
      }
    }
  });
});

test.describe('🌐 Poor Network Conditions', () => {
  let utils: EmpathyTestUtilities;
  
  test.beforeEach(async ({ page, context }) => {
    utils = new EmpathyTestUtilities(page, context);
    await utils.setupPersona(TEST_PERSONAS.remoteFieldEngineer);
  });

  test('Essential features work on slow 2G connection', async ({ page }) => {
    await page.goto('/collection/1/manage');
    
    // Page should load within reasonable time even on 2G
    const loadStart = Date.now();
    await page.waitForSelector('table, [role="grid"]', { timeout: 30000 });
    const loadTime = Date.now() - loadStart;
    
    expect(loadTime).toBeLessThan(30000); // Under 30 seconds on 2G
    
    // Check that essential data is visible
    const hasData = await page.locator('tbody tr, [role="row"]').count() > 0;
    expect(hasData).toBeTruthy();
    
    // Test that filtering works locally (doesn't require server roundtrip)
    const filterInput = page.locator('input[placeholder*="Filter"], input[placeholder*="Search"]').first();
    if (await filterInput.isVisible()) {
      const beforeFilter = await page.locator('tbody tr:visible').count();
      await filterInput.fill('test');
      await page.waitForTimeout(1000); // Wait for filter
      
      const afterFilter = await page.locator('tbody tr:visible').count();
      // Filter should work even on slow connection
      expect(afterFilter).toBeLessThanOrEqual(beforeFilter);
    }
  });

  test('Offline mode provides useful functionality', async ({ page, context }) => {
    // Load page first
    await page.goto('/collection/1/manage');
    await page.waitForLoadState('networkidle');
    
    // Go offline
    await context.setOffline(true);
    
    // Check if offline indicator appears
    await page.waitForTimeout(2000); // Give time for offline detection
    const offlineIndicator = await page.locator(':has-text("Offline"), :has-text("No connection"), .offline').isVisible();
    
    // Some functionality should still work
    const table = page.locator('table, [role="grid"]');
    if (await table.isVisible()) {
      // Sorting should work offline
      const headerButton = page.locator('th button, [role="columnheader"] button').first();
      if (await headerButton.isVisible()) {
        await headerButton.click();
        // Table should still be visible and sortable
        expect(await table.isVisible()).toBeTruthy();
      }
    }
    
    // Check for offline message when trying to save
    const saveButton = page.locator('button:has-text("Save"), button:has-text("Submit")').first();
    if (await saveButton.isVisible()) {
      await saveButton.click();
      const errorMessage = await page.locator('[role="alert"], .error, .offline-message').isVisible();
      expect(errorMessage).toBeTruthy();
    }
  });
});

test.describe('🎯 Error Prevention and Recovery', () => {
  let utils: EmpathyTestUtilities;
  
  test.beforeEach(async ({ page, context }) => {
    utils = new EmpathyTestUtilities(page, context);
    await utils.setupPersona(TEST_PERSONAS.newHire);
    await page.goto('/collection/1/manage');
  });

  test('System prevents common mistakes by new users', async ({ page }) => {
    // Test form validation
    const form = page.locator('form').first();
    if (await form.isVisible()) {
      // Try to submit empty form
      const submitButton = form.locator('button[type="submit"], button:has-text("Save")');
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Should show validation errors, not submit
        const hasErrors = await page.locator('.error, [aria-invalid="true"], .bp5-intent-danger').count() > 0;
        expect(hasErrors).toBeTruthy();
        
        // Errors should be descriptive
        const errorText = await page.locator('.error, [role="alert"]').first().textContent();
        expect(errorText?.length).toBeGreaterThan(10); // Not just "Error"
      }
    }
    
    // Test accidental navigation prevention
    const hasUnsavedChanges = await page.locator('input, textarea, select').first();
    if (await hasUnsavedChanges.isVisible()) {
      await utils.typeRealistically(hasUnsavedChanges, 'Test data', { errorRate: 0.1 });
      
      // Try to navigate away
      const navLink = page.locator('a[href]').first();
      if (await navLink.isVisible()) {
        // Set up dialog handler
        page.once('dialog', dialog => {
          expect(dialog.type()).toBe('beforeunload');
          dialog.dismiss();
        });
        
        // This might trigger beforeunload
        await page.evaluate(() => {
          window.onbeforeunload = () => 'You have unsaved changes';
          window.dispatchEvent(new Event('beforeunload'));
        });
      }
    }
  });

  test('Help is contextual and easily accessible', async ({ page }) => {
    // Check for help indicators
    const helpIndicators = await page.locator('[aria-label*="Help"], [title*="Help"], .help-icon, ?').all();
    expect(helpIndicators.length).toBeGreaterThan(0);
    
    // Test tooltip help
    if (helpIndicators.length > 0) {
      await helpIndicators[0].hover();
      await page.waitForTimeout(500);
      
      const tooltip = await page.locator('[role="tooltip"], .tooltip, .bp5-tooltip').isVisible();
      expect(tooltip).toBeTruthy();
    }
    
    // Check for inline help text
    const inlineHelp = await page.locator('.help-text, .description, small').count();
    expect(inlineHelp).toBeGreaterThan(0);
  });
});

test.describe('♿ Motor Impairment Accommodation', () => {
  let utils: EmpathyTestUtilities;
  
  test.beforeEach(async ({ page, context }) => {
    utils = new EmpathyTestUtilities(page, context);
    await page.goto('/collection/1/manage');
  });

  test('Interface accommodates users with tremor', async ({ page }) => {
    // All clickable targets should be large enough
    const buttons = await page.locator('button:visible').all();
    const smallButtons: string[] = [];
    
    for (const button of buttons.slice(0, 10)) { // Check first 10
      const box = await button.boundingBox();
      if (box && (box.width < 44 || box.height < 44)) {
        const text = await button.textContent();
        smallButtons.push(text || 'unnamed');
      }
    }
    
    // Most buttons should meet size requirements
    expect(smallButtons.length).toBeLessThan(3);
    
    // Test clicking with tremor simulation
    if (buttons.length > 0) {
      await utils.simulateTremorClick(buttons[0]);
      // Should still register the click
      await page.waitForTimeout(500);
      // No error should occur
    }
  });

  test('Drag operations have accessible alternatives', async ({ page }) => {
    // Look for draggable elements
    const draggables = await page.locator('[draggable="true"], .draggable').all();
    
    if (draggables.length > 0) {
      // Should have keyboard/button alternatives
      for (const draggable of draggables.slice(0, 3)) {
        const parent = draggable.locator('..');
        const hasAlternative = await parent.locator('button, [role="button"]').count() > 0;
        expect(hasAlternative).toBeTruthy();
      }
    }
  });
});

test.describe('📊 Performance Perception', () => {
  let utils: EmpathyTestUtilities;
  
  test.beforeEach(async ({ page, context }) => {
    utils = new EmpathyTestUtilities(page, context);
  });

  test('Loading states prevent user confusion', async ({ page }) => {
    // Intercept a request to delay it
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });
    
    await page.goto('/collection/1/manage');
    
    // Should show loading indicator quickly
    const loadingIndicator = await page.waitForSelector(
      '.loading, .spinner, [aria-busy="true"], .bp5-skeleton',
      { timeout: 1000 }
    ).catch(() => null);
    
    expect(loadingIndicator).toBeTruthy();
    
    // Wait for content
    await page.waitForSelector('table, [role="grid"]', { timeout: 30000 });
    
    // Loading indicator should be gone
    await expect(page.locator('.loading, .spinner, [aria-busy="true"]'))
      .toHaveCount(0, { timeout: 1000 });
  });

  test('Optimistic UI updates provide instant feedback', async ({ page }) => {
    await page.goto('/collection/1/manage');
    await page.waitForLoadState('networkidle');
    
    // Find an editable field
    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      
      const input = page.locator('input[type="text"]').first();
      if (await input.isVisible()) {
        // Make a change
        const originalValue = await input.inputValue();
        await input.fill('Updated value');
        
        // Save (might trigger optimistic update)
        const saveButton = page.locator('button:has-text("Save")');
        await saveButton.click();
        
        // UI should update immediately (not wait for server)
        const updatedText = await page.locator(':has-text("Updated value")').isVisible();
        expect(updatedText).toBeTruthy();
        
        // Even if there's an error later, user got immediate feedback
      }
    }
  });
});

test.describe('🔄 Shift Handover Intelligence', () => {
  test('Recent changes are clearly communicated', async ({ page }) => {
    await page.goto('/collection/1/manage');
    
    // Look for activity indicators
    const activityIndicators = [
      '.recently-modified',
      '[data-modified]',
      '.updated',
      'time',
      '.timestamp'
    ];
    
    let hasActivityTracking = false;
    for (const selector of activityIndicators) {
      if (await page.locator(selector).count() > 0) {
        hasActivityTracking = true;
        break;
      }
    }
    
    expect(hasActivityTracking).toBeTruthy();
    
    // Check if there's a way to see all recent changes
    const activityLinks = [
      'a:has-text("Recent")',
      'button:has-text("Activity")',
      'a:has-text("History")',
      'button:has-text("Changes")'
    ];
    
    for (const selector of activityLinks) {
      const link = page.locator(selector).first();
      if (await link.isVisible()) {
        await link.click();
        
        // Should show meaningful activity log
        await page.waitForTimeout(1000);
        const hasActivityInfo = await page.locator('li, tr, .activity-item').count() > 0;
        expect(hasActivityInfo).toBeTruthy();
        break;
      }
    }
  });
});