import { test, expect } from '@playwright/test';

test.describe('Current Copy State Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('Dashboard page current copy state', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for visual validation
    await page.screenshot({ path: 'dashboard-current-state.png', fullPage: true });
    
    // Check what navigation labels actually exist
    const navItems = await page.locator('[data-testid^="nav-"]').all();
    console.log('Navigation items found:', navItems.length);
    
    for (const item of navItems) {
      const text = await item.textContent();
      console.log('Nav item text:', text);
    }
    
    // Check what section headers actually exist
    const headers = await page.locator('h5').all();
    console.log('H5 headers found:', headers.length);
    
    for (const header of headers) {
      const text = await header.textContent();
      console.log('Header text:', text);
    }
    
    // Check what buttons actually exist
    const buttons = await page.locator('button').all();
    console.log('Buttons found:', buttons.length);
    
    for (const button of buttons) {
      const text = await button.textContent();
      if (text && text.trim()) {
        console.log('Button text:', text);
      }
    }
    
    // Check search input if it exists
    const searchInput = page.locator('input[type="text"]').first();
    if (await searchInput.isVisible()) {
      const placeholder = await searchInput.getAttribute('placeholder');
      console.log('Search placeholder:', placeholder);
    }
  });

  test('History page current copy state', async ({ page }) => {
    await page.goto('http://localhost:3000/history');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for visual validation
    await page.screenshot({ path: 'history-current-state.png', fullPage: true });
    
    // Check what page title actually exists
    const pageTitle = await page.locator('h3').first();
    if (await pageTitle.isVisible()) {
      const titleText = await pageTitle.textContent();
      console.log('History page title:', titleText);
    }
    
    // Check what section headers actually exist
    const headers = await page.locator('h5').all();
    console.log('History H5 headers found:', headers.length);
    
    for (const header of headers) {
      const text = await header.textContent();
      console.log('History header text:', text);
    }
    
    // Check what buttons actually exist
    const buttons = await page.locator('button').all();
    console.log('History buttons found:', buttons.length);
    
    for (const button of buttons) {
      const text = await button.textContent();
      if (text && text.trim()) {
        console.log('History button text:', text);
      }
    }
  });

  test('SCCs page current copy state', async ({ page }) => {
    await page.goto('http://localhost:3000/sccs');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for visual validation
    await page.screenshot({ path: 'sccs-current-state.png', fullPage: true });
    
    // Check what page title actually exists
    const pageTitle = await page.locator('h3').first();
    if (await pageTitle.isVisible()) {
      const titleText = await pageTitle.textContent();
      console.log('SCCs page title:', titleText);
    }
    
    // Check what section headers actually exist
    const headers = await page.locator('h5').all();
    console.log('SCCs H5 headers found:', headers.length);
    
    for (const header of headers) {
      const text = await header.textContent();
      console.log('SCCs header text:', text);
    }
    
    // Check what buttons actually exist
    const buttons = await page.locator('button').all();
    console.log('SCCs buttons found:', buttons.length);
    
    for (const button of buttons) {
      const text = await button.textContent();
      if (text && text.trim()) {
        console.log('SCCs button text:', text);
      }
    }
  });

  test('Collection Decks page current copy state', async ({ page }) => {
    await page.goto('http://localhost:3000/decks');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for visual validation
    await page.screenshot({ path: 'decks-current-state.png', fullPage: true });
    
    // Check what page title actually exists
    const pageTitle = await page.locator('h3').first();
    if (await pageTitle.isVisible()) {
      const titleText = await pageTitle.textContent();
      console.log('Decks page title:', titleText);
    }
    
    // Check what section headers actually exist
    const headers = await page.locator('h5').all();
    console.log('Decks H5 headers found:', headers.length);
    
    for (const header of headers) {
      const text = await header.textContent();
      console.log('Decks header text:', text);
    }
    
    // Check what buttons actually exist
    const buttons = await page.locator('button').all();
    console.log('Decks buttons found:', buttons.length);
    
    for (const button of buttons) {
      const text = await button.textContent();
      if (text && text.trim()) {
        console.log('Decks button text:', text);
      }
    }
  });

  test('Analytics page current copy state', async ({ page }) => {
    await page.goto('http://localhost:3000/analytics');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for visual validation
    await page.screenshot({ path: 'analytics-current-state.png', fullPage: true });
    
    // Check what page title actually exists
    const pageTitle = await page.locator('h3').first();
    if (await pageTitle.isVisible()) {
      const titleText = await pageTitle.textContent();
      console.log('Analytics page title:', titleText);
    }
    
    // Check what section headers actually exist
    const headers = await page.locator('h5').all();
    console.log('Analytics H5 headers found:', headers.length);
    
    for (const header of headers) {
      const text = await header.textContent();
      console.log('Analytics header text:', text);
    }
    
    // Check what buttons actually exist
    const buttons = await page.locator('button').all();
    console.log('Analytics buttons found:', buttons.length);
    
    for (const button of buttons) {
      const text = await button.textContent();
      if (text && text.trim()) {
        console.log('Analytics button text:', text);
      }
    }
  });
});
