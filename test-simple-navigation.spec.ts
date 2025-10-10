import { test } from '@playwright/test';

test('Simple navigation to Collection Management page', async ({ page }) => {
  console.log('\n=== Navigation Test ===');

  // Navigate to the URL
  console.log('1. Navigating to /collection/TEST-001/manage');
  await page.goto('http://localhost:3000/collection/TEST-001/manage');

  // Wait longer for page to load
  console.log('2. Waiting 10 seconds for page to fully load...');
  await page.waitForTimeout(10000);

  // Check current URL
  const currentUrl = page.url();
  console.log(`3. Current URL: ${currentUrl}`);

  // Take screenshot
  await page.screenshot({
    path: '/Users/damon/malibu/test-results/navigation-final.png',
    fullPage: true
  });
  console.log('4. Screenshot saved: navigation-final.png');

  // Check for tab elements
  const tabs = await page.locator('[role="tab"]').count();
  console.log(`5. Tabs found: ${tabs}`);

  if (tabs > 0) {
    const tabTexts = await page.locator('[role="tab"]').allTextContents();
    console.log(`6. Tab texts: ${JSON.stringify(tabTexts)}`);
  }

  // Check for table
  const tables = await page.locator('table, .bp5-html-table, .bp5-table-container').count();
  console.log(`7. Tables found: ${tables}`);

  // Check for our specific component
  const assignmentTable = await page.locator('.assignment-review-table-container').count();
  console.log(`8. AssignmentReviewTable containers: ${assignmentTable}`);

  // Get page HTML title
  const title = await page.title();
  console.log(`9. Page title: ${title}`);

  // Check for any error messages
  const errors = await page.locator('[class*="error"], .bp5-callout-intent-danger').count();
  console.log(`10. Error elements: ${errors}`);

  console.log('=== End Navigation Test ===\n');
});
