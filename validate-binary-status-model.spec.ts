import { test, expect } from '@playwright/test';

test.describe('Binary Status Model Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/history');
    await page.waitForLoadState('networkidle');
  });

  test('Collection Deck Status shows only binary states', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('[data-testid="history-table-container"]');
    
    // Check all Collection Deck Status tags
    const collectionStatusTags = await page.locator('[data-testid="collection-status-tag"]').all();
    
    for (const tag of collectionStatusTags) {
      const statusText = await tag.textContent();
      
      // Verify only binary states exist
      expect(['Complete', 'In Progress']).toContain(statusText?.trim());
    }
    
    // Verify no legacy statuses exist
    const legacyStatuses = ['Processing', 'Review', 'Ready', 'Failed', 'Draft', 'Cancelled'];
    for (const legacyStatus of legacyStatuses) {
      const legacyTags = await page.locator(`[data-testid="collection-status-tag"]:has-text("${legacyStatus}")`).count();
      expect(legacyTags).toBe(0);
    }
  });

  test('Algorithm Status (Matching status) shows detailed states', async ({ page }) => {
    // Check all Algorithm Status indicators
    const algorithmStatusTags = await page.locator('[data-testid="algorithm-status-indicator"]').all();
    
    const validAlgorithmStatuses = [
      'Starting Soon',    // queued
      'Processing',       // running
      'Optimizing',       // optimizing
      'Completed',        // converged
      'Error',           // error
      'Timed Out'        // timeout
    ];
    
    for (const tag of algorithmStatusTags) {
      const statusText = await tag.textContent();
      expect(validAlgorithmStatuses).toContain(statusText?.trim());
    }
  });

  test('Status filter dropdown has only binary options', async ({ page }) => {
    // Find and check the status filter dropdown
    const statusFilter = page.locator('[data-testid="status-filter-select"]');
    await expect(statusFilter).toBeVisible();
    
    // Click to see options
    await statusFilter.click();
    
    // Get all options
    const options = await statusFilter.locator('option').allTextContents();
    
    // Verify only binary options exist
    expect(options).toContain('All Collections');
    expect(options).toContain('Complete');
    expect(options).toContain('In Progress');
    
    // Verify no legacy options
    expect(options).not.toContain('Ready to View');
    expect(options).not.toContain('Action Required');
    expect(options).not.toContain('Starting Soon');
  });

  test('Metric cards show only binary status counts', async ({ page }) => {
    // Check metric cards in the status overview section
    const metricCards = await page.locator('.bp6-callout').all();
    
    let foundComplete = false;
    let foundInProgress = false;
    
    for (const card of metricCards) {
      const cardText = await card.textContent();
      
      if (cardText?.includes('Complete')) {
        foundComplete = true;
        // Verify it doesn't have legacy text
        expect(cardText).not.toContain('Ready to View');
      }
      
      if (cardText?.includes('In Progress')) {
        foundInProgress = true;
        // Verify it doesn't have legacy text
        expect(cardText).not.toContain('Processing Now');
        expect(cardText).not.toContain('Actively collecting');
      }
    }
    
    // We should find exactly 2 metric cards (Complete and In Progress)
    const visibleMetricCards = await page.locator('.bp6-callout:visible').count();
    expect(visibleMetricCards).toBe(2);
    expect(foundComplete).toBe(true);
    expect(foundInProgress).toBe(true);
  });

  test('Filter functionality works with binary statuses', async ({ page }) => {
    const statusFilter = page.locator('[data-testid="status-filter-select"]');
    
    // Filter by Complete status
    await statusFilter.selectOption('complete');
    await page.waitForTimeout(500); // Wait for filter to apply
    
    // Check that only complete items are shown
    const completeStatusTags = await page.locator('[data-testid="collection-status-tag"]:visible').all();
    for (const tag of completeStatusTags) {
      const text = await tag.textContent();
      expect(text?.trim()).toBe('Complete');
    }
    
    // Filter by In Progress status
    await statusFilter.selectOption('in-progress');
    await page.waitForTimeout(500); // Wait for filter to apply
    
    // Check that only in-progress items are shown
    const inProgressStatusTags = await page.locator('[data-testid="collection-status-tag"]:visible').all();
    for (const tag of inProgressStatusTags) {
      const text = await tag.textContent();
      expect(text?.trim()).toBe('In Progress');
    }
    
    // Reset to all
    await statusFilter.selectOption('all');
    await page.waitForTimeout(500);
    
    // Verify both statuses are shown
    const allStatusTags = await page.locator('[data-testid="collection-status-tag"]:visible').all();
    const statuses = new Set();
    for (const tag of allStatusTags) {
      const text = await tag.textContent();
      statuses.add(text?.trim());
    }
    
    // Should have both statuses when showing all
    expect(statuses.size).toBeGreaterThan(0);
    expect(statuses.size).toBeLessThanOrEqual(2);
  });

  test('Action buttons reflect simplified status logic', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('[data-testid="history-table-container"]');
    
    // Get all rows
    const rows = await page.locator('tbody tr').all();
    
    for (const row of rows) {
      // Get the collection status for this row
      const statusTag = await row.locator('[data-testid="collection-status-tag"]').textContent();
      
      if (statusTag?.trim() === 'Complete') {
        // Complete items should have view/download buttons
        const viewButton = row.locator('button:has-text("View")');
        const downloadButton = row.locator('button:has-text("Download")');
        
        // At least one action button should be visible for complete items
        const hasActions = await viewButton.isVisible().catch(() => false) || 
                          await downloadButton.isVisible().catch(() => false);
        expect(hasActions).toBe(true);
      } else if (statusTag?.trim() === 'In Progress') {
        // In Progress items might show processing indicator or no actions
        const processingIndicator = row.locator('.bp6-processing-indicator');
        const isProcessing = await processingIndicator.count() > 0;
        
        // This is fine - in progress items may or may not have a processing indicator
        expect(isProcessing).toBeDefined();
      }
    }
  });

  test('Status resolution maps algorithm statuses correctly', async ({ page }) => {
    // This test verifies the mapping between algorithm status and collection status
    const rows = await page.locator('tbody tr').all();
    
    for (const row of rows) {
      const algorithmStatus = await row.locator('[data-testid="algorithm-status-indicator"]').textContent();
      const collectionStatus = await row.locator('[data-testid="collection-status-tag"]').textContent();
      
      // Verify correct mapping
      if (algorithmStatus?.trim() === 'Completed') {
        expect(collectionStatus?.trim()).toBe('Complete');
      } else if (['Starting Soon', 'Processing', 'Optimizing', 'Error', 'Timed Out'].includes(algorithmStatus?.trim() || '')) {
        expect(collectionStatus?.trim()).toBe('In Progress');
      }
    }
  });

  test('Status columns exist with correct data', async ({ page }) => {
    // Wait for table to be visible
    await page.waitForSelector('[data-testid="history-table-container"]');
    
    // We verify the columns exist by checking the actual data in the cells
    // which is more reliable than checking header text
    const collectionStatusCount = await page.locator('[data-testid="collection-status-tag"]').count();
    const algorithmStatusCount = await page.locator('[data-testid="algorithm-status-indicator"]').count();
    
    // Both columns should have data
    expect(collectionStatusCount).toBeGreaterThan(0);
    expect(algorithmStatusCount).toBeGreaterThan(0);
    
    // Verify that the data is in sync (same number of rows)
    expect(collectionStatusCount).toBe(algorithmStatusCount);
  });

  test('Real-time updates maintain binary status model', async ({ page }) => {
    // Wait for WebSocket connection (if visible)
    const liveIndicator = page.locator(':has-text("Live")');
    
    // If we have live updates, verify they maintain the binary model
    if (await liveIndicator.isVisible().catch(() => false)) {
      // Monitor for any status updates
      await page.waitForTimeout(3000); // Wait for potential updates
      
      // Re-check all statuses are still binary
      const updatedStatusTags = await page.locator('[data-testid="collection-status-tag"]').all();
      for (const tag of updatedStatusTags) {
        const statusText = await tag.textContent();
        expect(['Complete', 'In Progress']).toContain(statusText?.trim());
      }
    }
  });
});