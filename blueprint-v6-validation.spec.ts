import { test, expect } from '@playwright/test';

test('Blueprint v6 Card Structure Validation', async ({ page }) => {
  await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
  await page.waitForSelector('.bp6-card', { timeout: 10000 });
  
  // Find match cards
  const matchCards = page.locator('.match-card.bp6-card');
  await expect(matchCards.first()).toBeVisible();
  
  console.log('Match cards found:', await matchCards.count());
  
  // Check card elevation/styling
  const firstCard = matchCards.first();
  const cardStyles = await firstCard.evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      boxShadow: styles.boxShadow,
      borderRadius: styles.borderRadius,
      padding: styles.padding,
      backgroundColor: styles.backgroundColor,
      className: el.className
    };
  });
  
  console.log('Card styles:', cardStyles);
  
  // Check for expand buttons
  const expandButtons = firstCard.locator('button[aria-expanded]');
  const expandButtonCount = await expandButtons.count();
  console.log('Expand buttons found:', expandButtonCount);
  
  if (expandButtonCount > 0) {
    const expandButton = expandButtons.first();
    const isExpanded = await expandButton.getAttribute('aria-expanded');
    console.log('Initial expand state:', isExpanded);
    
    if (isExpanded === 'false') {
      await expandButton.click();
      await page.waitForTimeout(500); // Wait for animation
      
      // Check if collapse opened
      const collapseElements = page.locator('.bp6-collapse[aria-hidden="false"]');
      const collapseCount = await collapseElements.count();
      console.log('Opened collapse elements:', collapseCount);
      
      if (collapseCount > 0) {
        const newExpandState = await expandButton.getAttribute('aria-expanded');
        console.log('New expand state:', newExpandState);
      }
    }
  }
  
  // Check for Blueprint tags
  const tags = page.locator('.bp6-tag');
  const tagCount = await tags.count();
  console.log('Blueprint tags found:', tagCount);
  
  // Take final screenshot
  await page.screenshot({ path: 'blueprint-v6-validation.png' });
});