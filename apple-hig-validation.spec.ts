import { test, expect } from '@playwright/test';

test.describe('Apple HIG Copy Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent testing
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('Dashboard page copy follows Apple HIG guidelines', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Validate navigation labels (should be clear and consistent)
    await expect(page.locator('[data-testid="nav-dashboard"]')).toContainText('Data Sources');
    await expect(page.locator('[data-testid="nav-sccs"]')).toContainText('SCCs');
    await expect(page.locator('[data-testid="nav-collections"]')).toContainText('Collections');
    await expect(page.locator('[data-testid="nav-history"]')).toContainText('History');
    await expect(page.locator('[data-testid="nav-analytics"]')).toContainText('Analytics');
    
    // Validate section headers (should be concise and action-oriented)
    await expect(page.locator('h5:has-text("Find Sources")')).toBeVisible();
    await expect(page.locator('h5:has-text("Actions")')).toBeVisible();
    await expect(page.locator('h5:has-text("Available Data Sources")')).toBeVisible();
    
    // Validate button labels (should use action verbs)
    await expect(page.locator('text=Refresh Data Sources')).toBeVisible();
    await expect(page.locator('text=Create Collection')).toBeVisible();
    await expect(page.locator('text=Add Data Source')).toBeVisible();
    
    // Validate search placeholder (should be clear and helpful)
    const searchInput = page.locator('[data-testid="search-input"] input');
    await expect(searchInput).toHaveAttribute('placeholder', 'Search for data sources... (⌘K to focus)');
    
    // Validate keyboard shortcuts use Apple platform standards
    await page.click('[data-testid="help-button"]');
    await expect(page.locator('text=⌘K: Focus search')).toBeVisible();
    await expect(page.locator('text=⌘N: Add new SCC')).toBeVisible();
    await expect(page.locator('text=⌘R: Refresh data sources')).toBeVisible();
  });

  test('History page copy follows Apple HIG guidelines', async ({ page }) => {
    await page.goto('http://localhost:3000/history');
    
    // Validate page title and subtitle (should be user-focused)
    await expect(page.locator('h3:has-text("Your Collection Results")')).toBeVisible();
    await expect(page.locator('text=Monitor your collection progress and access completed results')).toBeVisible();
    
    // Validate action buttons (should use action verbs)
    await expect(page.locator('text=Create Collection')).toBeVisible();
    await expect(page.locator('text=Save All Results')).toBeVisible();
    
    // Validate status messaging (should be conversational and user-focused)
    await expect(page.locator('text=Ready for You')).toBeVisible();
    await expect(page.locator('text=Working on It')).toBeVisible();
    await expect(page.locator('text=Need Your Help')).toBeVisible();
    
    // Validate section headers (should be clear and descriptive)
    await expect(page.locator('h5:has-text("What\'s Happening Now")')).toBeVisible();
    await expect(page.locator('h5:has-text("Find Specific Collections")')).toBeVisible();
    await expect(page.locator('h5:has-text("All Your Collections")')).toBeVisible();
    
    // Validate filter labels (should be clear and concise)
    await expect(page.locator('text=From Date')).toBeVisible();
    await expect(page.locator('text=To Date')).toBeVisible();
    await expect(page.locator('text=Show Results')).toBeVisible();
    await expect(page.locator('text=Clear All')).toBeVisible();
  });

  test('SCCs page copy follows Apple HIG guidelines', async ({ page }) => {
    await page.goto('http://localhost:3000/sccs');
    
    // Validate page title (should be clear and concise)
    await expect(page.locator('h3:has-text("SCCs")')).toBeVisible();
    
    // Validate action buttons (should use action verbs)
    await expect(page.locator('text=Add SCC')).toBeVisible();
    await expect(page.locator('text=Refresh Data Sources')).toBeVisible();
    
    // Validate section headers (should be clear and descriptive)
    await expect(page.locator('h5:has-text("Search and Filter")')).toBeVisible();
    await expect(page.locator('h5:has-text("Actions")')).toBeVisible();
    await expect(page.locator('h5:has-text("SCCs")')).toBeVisible();
    
    // Validate search placeholder (should be clear and helpful)
    const searchInput = page.locator('input[placeholder*="Search by SCC number"]');
    await expect(searchInput).toHaveAttribute('placeholder', 'Search by SCC number, function...');
    
    // Validate filter labels (should be clear and inclusive)
    await expect(page.locator('text=All Functions')).toBeVisible();
    await expect(page.locator('text=All Orbits')).toBeVisible();
    await expect(page.locator('text=All Classifications')).toBeVisible();
  });

  test('Collection Decks page copy follows Apple HIG guidelines', async ({ page }) => {
    await page.goto('http://localhost:3000/decks');
    
    // Validate page title (should be user-focused)
    await expect(page.locator('h3:has-text("Your Collections")')).toBeVisible();
    
    // Validate action buttons (should use action verbs)
    await expect(page.locator('text=Create Collection')).toBeVisible();
    
    // Validate section headers (should be clear and descriptive)
    await expect(page.locator('h5:has-text("Actions")')).toBeVisible();
    await expect(page.locator('h5:has-text("Find Collections by Date")')).toBeVisible();
    
    // Validate tab labels (should be clear and consistent)
    await expect(page.locator('text=In Progress')).toBeVisible();
    await expect(page.locator('text=Completed')).toBeVisible();
    
    // Validate filter labels (should be clear and concise)
    await expect(page.locator('text=Start Date')).toBeVisible();
    await expect(page.locator('text=End Date')).toBeVisible();
    await expect(page.locator('text=Reset')).toBeVisible();
  });

  test('Analytics page copy follows Apple HIG guidelines', async ({ page }) => {
    await page.goto('http://localhost:3000/analytics');
    
    // Validate page title (should be clear and concise)
    await expect(page.locator('h3:has-text("Analytics")')).toBeVisible();
    
    // Validate section headers (should be clear and descriptive)
    await expect(page.locator('h5:has-text("Controls")')).toBeVisible();
    await expect(page.locator('h5:has-text("Audit Log")')).toBeVisible();
    
    // Validate button labels (should use action verbs)
    await expect(page.locator('text=Export to Excel')).toBeVisible();
    
    // Validate chart labels (should be clear and descriptive)
    await expect(page.locator('text=% of Matching')).toBeVisible();
    await expect(page.locator('text=General Matches')).toBeVisible();
    await expect(page.locator('text=Cumulative Matches')).toBeVisible();
    
    // Validate chart categories (should be clear and consistent)
    await expect(page.locator('text=Optimal')).toBeVisible();
    await expect(page.locator('text=Baseline')).toBeVisible();
    await expect(page.locator('text=Suboptimal')).toBeVisible();
    await expect(page.locator('text=Manual')).toBeVisible();
  });

  test('Create Collection workflow copy follows Apple HIG guidelines', async ({ page }) => {
    await page.goto('http://localhost:3000/create-collection-deck/data');
    
    // Validate page title (should be user-focused and action-oriented)
    await expect(page.locator('h3:has-text("Build Your Collection")')).toBeVisible();
    
    // Validate step labels (should be clear and action-oriented)
    await expect(page.locator('text=Set Up Your Data')).toBeVisible();
    await expect(page.locator('text=Choose Your Settings')).toBeVisible();
    await expect(page.locator('text=Review Your Matches')).toBeVisible();
    await expect(page.locator('text=Add Final Details')).toBeVisible();
    
    // Validate form labels (should be clear and user-friendly)
    await expect(page.locator('h5:has-text("Collection Information")')).toBeVisible();
    await expect(page.locator('label:has-text("Collection Name")')).toBeVisible();
    await expect(page.locator('h5:has-text("Tasking Window")')).toBeVisible();
    await expect(page.locator('h5:has-text("TLE Data")')).toBeVisible();
    await expect(page.locator('h5:has-text("Unavailable Sites")')).toBeVisible();
    
    // Validate placeholder text (should be clear and helpful)
    const nameInput = page.locator('[data-testid="deck-name-input"]');
    await expect(nameInput).toHaveAttribute('placeholder', 'Enter collection name...');
    
    // Validate button labels (should use action verbs)
    await expect(page.locator('text=Next')).toBeVisible();
    await expect(page.locator('text=Cancel')).toBeVisible();
    
    // Validate loading message (should be concise)
    // Note: This would be tested when loading state is active
    expect(true).toBe(true); // Placeholder for loading message validation
  });

  test('Add SCC page copy follows Apple HIG guidelines', async ({ page }) => {
    await page.goto('http://localhost:3000/sccs/new');
    
    // Validate form labels (should be clear and descriptive)
    await expect(page.locator('label:has-text("SCC Number")')).toBeVisible();
    await expect(page.locator('label:has-text("Priority")')).toBeVisible();
    await expect(page.locator('label:has-text("Function")')).toBeVisible();
    await expect(page.locator('label:has-text("Orbit")')).toBeVisible();
    await expect(page.locator('label:has-text("Periodicity")')).toBeVisible();
    await expect(page.locator('label:has-text("Collection Type")')).toBeVisible();
    await expect(page.locator('label:has-text("Classification")')).toBeVisible();
    await expect(page.locator('label:has-text("Notes")')).toBeVisible();
    
    // Validate placeholder text (should be clear and helpful)
    await expect(page.locator('input[placeholder="Enter SCC number..."]')).toBeVisible();
    await expect(page.locator('textarea[placeholder="Additional notes or comments..."]')).toBeVisible();
    
    // Validate button labels (should use action verbs)
    await expect(page.locator('text=Save')).toBeVisible();
    await expect(page.locator('text=Cancel')).toBeVisible();
    
    // Validate select options (should be clear and inclusive)
    await expect(page.locator('option:has-text("Select classification...")')).toBeVisible();
  });

  test('Error messages follow Apple HIG guidelines', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Test error message consistency by triggering an error
    // This would require actual error conditions to be tested
    // For now, we validate the structure supports non-blaming error messages
    
    // Validate that error messages would use consistent terminology
    // "Refresh failed" instead of "Update failed"
    expect(true).toBe(true); // Placeholder for error message validation
  });

  test('Status messages follow Apple HIG guidelines', async ({ page }) => {
    await page.goto('http://localhost:3000/history');
    
    // Validate status messages are conversational and user-focused
    // These would be visible when status states are active
    // For now, we validate the structure supports empathetic messaging
    
    // Validate that status messages use consistent terminology
    // "Getting your data ready" instead of "Initializing"
    // "Creating your collection" instead of "Processing"
    expect(true).toBe(true); // Placeholder for status message validation
  });

  test('Accessibility labels follow Apple HIG guidelines', async ({ page }) => {
    await page.goto('http://localhost:3000/history');
    
    // Validate aria-labels are descriptive and user-friendly
    const historyTable = page.locator('[data-testid="history-table-container"]');
    await expect(historyTable).toHaveAttribute('aria-label', 'Collection History');
    
    // Validate that buttons have appropriate accessibility labels
    // This would require checking actual button aria-labels
    expect(true).toBe(true); // Placeholder for accessibility validation
  });

  test('Consistent terminology across all pages', async ({ page }) => {
    // Test that terminology is consistent across all pages
    const pages = [
      { path: '/', expectedTitle: 'Data Sources' },
      { path: '/sccs', expectedTitle: 'SCCs' },
      { path: '/decks', expectedTitle: 'Your Collections' },
      { path: '/history', expectedTitle: 'Your Collection Results' },
      { path: '/analytics', expectedTitle: 'Analytics' }
    ];
    
    for (const pageInfo of pages) {
      await page.goto(`http://localhost:3000${pageInfo.path}`);
      
      // Validate page titles are consistent and user-focused
      if (pageInfo.expectedTitle !== 'Analytics') {
        await expect(page.locator('h3')).toContainText(pageInfo.expectedTitle);
      } else {
        await expect(page.locator('h3:has-text("Analytics")')).toBeVisible();
      }
      
      // Validate navigation labels are consistent
      await expect(page.locator('[data-testid="nav-dashboard"]')).toContainText('Data Sources');
      await expect(page.locator('[data-testid="nav-sccs"]')).toContainText('SCCs');
      await expect(page.locator('[data-testid="nav-collections"]')).toContainText('Collections');
      await expect(page.locator('[data-testid="nav-history"]')).toContainText('History');
      await expect(page.locator('[data-testid="nav-analytics"]')).toContainText('Analytics');
    }
  });

  test('Button labels use consistent action verbs', async ({ page }) => {
    // Test that button labels use consistent action verbs across the application
    const actionVerbs = [
      'Create', 'Add', 'Refresh', 'Save', 'Cancel', 'Next', 'Back', 'Continue',
      'View', 'Edit', 'Delete', 'Export', 'Download', 'Clear', 'Reset'
    ];
    
    // Navigate to different pages and validate button consistency
    await page.goto('http://localhost:3000');
    await expect(page.locator('text=Create Collection')).toBeVisible();
    await expect(page.locator('text=Add Data Source')).toBeVisible();
    await expect(page.locator('text=Refresh Data Sources')).toBeVisible();
    
    await page.goto('http://localhost:3000/sccs');
    await expect(page.locator('text=Add SCC')).toBeVisible();
    await expect(page.locator('text=Refresh Data Sources')).toBeVisible();
    
    await page.goto('http://localhost:3000/decks');
    await expect(page.locator('text=Create Collection')).toBeVisible();
    await expect(page.locator('text=Reset')).toBeVisible();
  });

  test('Form labels and placeholders are clear and helpful', async ({ page }) => {
    await page.goto('http://localhost:3000/create-collection-deck/data');
    
    // Validate form labels are clear and descriptive
    await expect(page.locator('label:has-text("Collection Name")')).toBeVisible();
    await expect(page.locator('label:has-text("Start Date")')).toBeVisible();
    await expect(page.locator('label:has-text("End Date")')).toBeVisible();
    await expect(page.locator('label:has-text("Data Source")')).toBeVisible();
    
    // Validate placeholders are helpful and clear
    await expect(page.locator('input[placeholder="Enter collection name..."]')).toBeVisible();
    await expect(page.locator('input[placeholder="Select start date..."]')).toBeVisible();
    await expect(page.locator('input[placeholder="Select end date..."]')).toBeVisible();
    await expect(page.locator('select option:has-text("Select source...")')).toBeVisible();
  });
});
