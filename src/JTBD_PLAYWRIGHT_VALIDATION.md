# JTBD Validation with Playwright MCP: Live Application Testing

## Overview

This document outlines how to use Playwright MCP to test the **live running application** (not just the code) against the Jobs To Be Done requirements. This provides real-world validation of whether users can actually complete their critical tasks.

## Pre-requisites

```bash
# Ensure the application is running locally
npm start # or yarn start

# Application should be accessible at http://localhost:3000
```

## Playwright MCP Test Scenarios

### Job 1: Verify and Validate System-Generated Plans

```bash
/test e2e --play --focus verify-allocation-plans
```

**Test Scenario**:
```javascript
// Playwright test to validate Job 1
test('User can verify system-generated satellite allocations', async ({ page }) => {
  // Navigate to Collection Opportunities Hub
  await page.goto('http://localhost:3000/collection/deck-1');
  
  // Find a proposed allocation (e.g., SCC 58253 to SBSS)
  await page.waitForSelector('.opportunities-table');
  
  // Test 1: Can user see satellite details?
  const satelliteCell = await page.locator('text=SCC 58253').first();
  expect(await satelliteCell.isVisible()).toBeTruthy();
  
  // Test 2: Can user drill down to see pass information?
  await satelliteCell.click();
  
  // Look for time window information
  const passDetails = await page.locator('.pass-details');
  const hasTimeWindows = await passDetails.locator('text=/\\d{2}:\\d{2}.*-.*\\d{2}:\\d{2}/').count() > 0;
  
  // Test 3: Can user see validation information?
  const validationStatus = await page.locator('.validation-status');
  expect(await validationStatus.isVisible()).toBeTruthy();
  
  // Test 4: Can user approve/reject the allocation?
  const approveButton = await page.locator('button:has-text("Approve")');
  const rejectButton = await page.locator('button:has-text("Reject")');
  
  expect(await approveButton.isVisible() || await rejectButton.isVisible()).toBeTruthy();
  
  // Performance metric: Time to load pass details
  const loadTime = await page.evaluate(() => performance.now());
  expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
});
```

**SuperClaude Command**:
```bash
/test verify-allocation --play --persona-qa --validate
```

### Job 2: Correct Suboptimal Plans with Expert Knowledge

```bash
/test e2e --play --focus override-recommendations
```

**Test Scenario**:
```javascript
test('User can override system recommendations with justification', async ({ page }) => {
  await page.goto('http://localhost:3000/collection/deck-1');
  
  // Find a "Best Pass" recommendation
  const bestPassRow = await page.locator('tr:has-text("Best Pass")').first();
  
  // Test 1: Can user see alternative options?
  await bestPassRow.locator('button[aria-label="More actions"]').click();
  const overrideOption = await page.locator('text=Override Assignment');
  expect(await overrideOption.isVisible()).toBeTruthy();
  
  await overrideOption.click();
  
  // Test 2: Are alternative sensors presented?
  const alternativesList = await page.locator('.alternative-sensors');
  const alternativeCount = await alternativesList.locator('.sensor-option').count();
  expect(alternativeCount).toBeGreaterThan(0);
  
  // Test 3: Can user select a "suboptimal" alternative?
  await page.locator('.sensor-option:has-text("CAV")').click();
  
  // Test 4: Can user document justification?
  const justificationField = await page.locator('textarea[placeholder*="justification"]');
  expect(await justificationField.isVisible()).toBeTruthy();
  
  await justificationField.fill('CAV sensor has better coverage for this specific target based on recent intel');
  
  // Test 5: Can user add amplified instructions?
  const instructionsField = await page.locator('textarea[placeholder*="instructions"]');
  if (await instructionsField.isVisible()) {
    await instructionsField.fill('Use narrow-band mode, adjust elevation to 45 degrees');
  }
  
  // Test 6: Can user save the override?
  const saveButton = await page.locator('button:has-text("Save Override")');
  await saveButton.click();
  
  // Verify override was applied
  await page.waitForSelector('.toast-notification:has-text("Override saved")');
});
```

### Job 3: Diagnose and Escalate Data Integrity Failures

```bash
/test e2e --play --focus data-integrity-handling
```

**Test Scenario**:
```javascript
test('User can identify and handle data integrity issues', async ({ page }) => {
  await page.goto('http://localhost:3000/collection/deck-1');
  
  // Test 1: Are data issues clearly visible?
  const dataIssueIndicators = await page.locator('.data-integrity-warning');
  const issueCount = await dataIssueIndicators.count();
  
  if (issueCount > 0) {
    // Click on a satellite with data issues
    const problemSatellite = await dataIssueIndicators.first();
    await problemSatellite.click();
    
    // Test 2: Is the error clearly explained?
    const errorMessage = await page.locator('.error-details:has-text("No TLE Data")');
    expect(await errorMessage.isVisible()).toBeTruthy();
    
    // Test 3: Are next steps provided?
    const actionableSteps = await page.locator('.error-actions');
    expect(await actionableSteps.isVisible()).toBeTruthy();
    
    // Test 4: Can user escalate the issue?
    const escalateButton = await page.locator('button:has-text("Escalate Issue")');
    const workaroundButton = await page.locator('button:has-text("Find Workaround")');
    
    expect(
      await escalateButton.isVisible() || 
      await workaroundButton.isVisible()
    ).toBeTruthy();
    
    // Test 5: Response time for error detection
    const errorDetectionTime = await page.evaluate(() => performance.now());
    expect(errorDetectionTime).toBeLessThan(1000); // Should be immediate
  }
});
```

### Job 4: Reduce Information Overload

```bash
/test e2e --play --focus filtering-and-focus
```

**Test Scenario**:
```javascript
test('User can filter to focus on relevant information', async ({ page }) => {
  await page.goto('http://localhost:3000/collection/deck-1');
  
  // Get initial count
  const initialRows = await page.locator('.opportunities-table tbody tr').count();
  
  // Test 1: Can user filter by specific sites?
  const filterButton = await page.locator('button:has-text("Filter")');
  await filterButton.click();
  
  // Filter by sites FYL and PPW
  await page.locator('input[placeholder*="site"]').fill('FYL PPW');
  await page.locator('button:has-text("Apply Filter")').click();
  
  const filteredRows = await page.locator('.opportunities-table tbody tr').count();
  expect(filteredRows).toBeLessThan(initialRows);
  
  // Test 2: Are pre-built views available?
  const needsReviewTab = await page.locator('button:has-text("Needs Review")');
  const unmatchedTab = await page.locator('button:has-text("Unmatched")');
  
  expect(await needsReviewTab.isVisible()).toBeTruthy();
  expect(await unmatchedTab.isVisible()).toBeTruthy();
  
  // Test 3: Can user focus on problems?
  await unmatchedTab.click();
  await page.waitForSelector('.unmatched-view');
  
  // Test 4: Can user bulk select items?
  const selectAllCheckbox = await page.locator('input[type="checkbox"][aria-label="Select all"]');
  await selectAllCheckbox.click();
  
  const selectedCount = await page.locator('input[type="checkbox"]:checked').count();
  expect(selectedCount).toBeGreaterThan(1);
  
  // Test 5: Performance - filtering should be fast
  const filterTime = await page.evaluate(() => performance.now());
  expect(filterTime).toBeLessThan(500); // Sub-second filtering
});
```

## Comprehensive JTBD Validation Suite

```bash
# Run all JTBD validation tests with performance metrics
/test jtbd-complete --play --persona-qa --metrics
```

**Full Test Orchestration**:
```javascript
// Complete JTBD validation suite
describe('Collection Manager JTBD Validation', () => {
  let context;
  let page;
  
  beforeAll(async () => {
    // Set up browser context with user preferences
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      permissions: ['notifications'],
      locale: 'en-US'
    });
    page = await context.newPage();
    
    // Mock authentication if needed
    await page.goto('http://localhost:3000/login');
    await page.fill('#username', 'collection_manager');
    await page.fill('#password', 'test_password');
    await page.click('button[type="submit"]');
  });
  
  // Run all JTBD tests
  test.describe('Job 1: Verify Plans', () => { /* ... */ });
  test.describe('Job 2: Override Recommendations', () => { /* ... */ });
  test.describe('Job 3: Handle Data Issues', () => { /* ... */ });
  test.describe('Job 4: Reduce Overload', () => { /* ... */ });
  
  // Performance benchmarks
  test('Overall performance meets requirements', async () => {
    const metrics = await page.evaluate(() => ({
      loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
      memory: performance.memory?.usedJSHeapSize
    }));
    
    expect(metrics.loadTime).toBeLessThan(3000); // 3s max load
    expect(metrics.firstPaint).toBeLessThan(1000); // 1s first paint
  });
  
  // Accessibility validation
  test('Application is accessible', async () => {
    const violations = await page.evaluate(() => {
      // Run axe-core if available
      return window.axe ? window.axe.run() : null;
    });
    
    if (violations) {
      expect(violations.violations.length).toBe(0);
    }
  });
});
```

## Visual Regression Testing

```bash
# Capture baseline screenshots for each JTBD workflow
/test visual-baseline --play --screenshots
```

```javascript
// Visual regression tests
test('Visual consistency across JTBD workflows', async ({ page }) => {
  // Job 1: Allocation verification view
  await page.goto('http://localhost:3000/collection/deck-1');
  await page.screenshot({ 
    path: 'screenshots/job1-allocation-view.png',
    fullPage: true 
  });
  
  // Job 2: Override interface
  await page.click('button:has-text("Override")');
  await page.screenshot({ 
    path: 'screenshots/job2-override-modal.png' 
  });
  
  // Job 3: Error states
  await page.goto('http://localhost:3000/collection/deck-1?show-errors=true');
  await page.screenshot({ 
    path: 'screenshots/job3-error-states.png' 
  });
  
  // Job 4: Filtered views
  await page.click('button:has-text("Needs Review")');
  await page.screenshot({ 
    path: 'screenshots/job4-filtered-view.png' 
  });
});
```

## Performance Monitoring

```bash
# Monitor performance metrics during JTBD workflows
/test performance --play --metrics --report
```

```javascript
// Performance monitoring across all jobs
test('Performance metrics for JTBD workflows', async ({ page }) => {
  const metrics = {
    job1: { start: 0, end: 0, memory: 0 },
    job2: { start: 0, end: 0, memory: 0 },
    job3: { start: 0, end: 0, memory: 0 },
    job4: { start: 0, end: 0, memory: 0 }
  };
  
  // Job 1 Performance
  metrics.job1.start = Date.now();
  await page.goto('http://localhost:3000/collection/deck-1');
  await page.click('.satellite-details');
  await page.waitForSelector('.pass-information');
  metrics.job1.end = Date.now();
  metrics.job1.memory = await page.evaluate(() => performance.memory?.usedJSHeapSize);
  
  // Generate performance report
  console.table(metrics);
  
  // Assert performance requirements
  Object.values(metrics).forEach(metric => {
    expect(metric.end - metric.start).toBeLessThan(5000); // 5s max per job
    expect(metric.memory).toBeLessThan(100 * 1024 * 1024); // 100MB max
  });
});
```

## Continuous JTBD Validation

```bash
# Set up continuous validation pipeline
/spawn jtbd-monitor --loop --play --interval 3600
```

This creates an automated validation pipeline that:
1. Runs JTBD tests every hour
2. Captures performance metrics
3. Takes screenshots for visual comparison
4. Alerts on any degradation
5. Generates compliance reports

## Success Criteria

All JTBD tests must pass with:
- ✅ Task completion rate: 100%
- ✅ Performance: <3s per workflow
- ✅ Error clarity: Actionable messages within 1s
- ✅ Filtering efficiency: <500ms response
- ✅ Accessibility: WCAG 2.1 AA compliant
- ✅ Visual consistency: No unexpected changes

## Integration with Round Table Analysis

After running these Playwright tests, feed results back to the round table:

```bash
# Generate JTBD compliance report from test results
/analyze @playwright-results.json --persona-analyzer --focus jtbd-gaps

# Use results to prioritize implementation
/implement --type critical-gaps --based-on @playwright-results.json --wave-mode auto
```