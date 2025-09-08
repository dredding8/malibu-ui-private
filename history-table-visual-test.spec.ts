import { test, expect } from '@playwright/test';
import path from 'path';

test('History table visual analysis', async ({ page }) => {
  // Navigate to the history page
  await page.goto('http://localhost:3000/history');
  
  // Wait for the page to load completely
  await page.waitForLoadState('networkidle');
  
  // Wait for any dynamic content to load
  await page.waitForTimeout(2000);
  
  // Take a full page screenshot
  const screenshotPath = path.join(__dirname, 'history-table-analysis.png');
  await page.screenshot({ 
    path: screenshotPath,
    fullPage: true 
  });
  
  console.log(`Screenshot saved to: ${screenshotPath}`);
  
  // Analyze the table structure
  const tableExists = await page.locator('table').count() > 0;
  console.log(`Table exists: ${tableExists}`);
  
  if (tableExists) {
    // Check headers
    const headers = await page.locator('thead th').allTextContents();
    console.log('Headers found:', headers);
    console.log('Number of headers:', headers.length);
    
    // Check for duplicate headers
    const uniqueHeaders = [...new Set(headers)];
    const hasDuplicates = headers.length !== uniqueHeaders.length;
    console.log('Has duplicate headers:', hasDuplicates);
    if (hasDuplicates) {
      console.log('Duplicated headers detected');
    }
    
    // Check table dimensions
    const tableWidth = await page.locator('table').boundingBox();
    console.log('Table dimensions:', tableWidth);
    
    // Check for truncated text in cells
    const cellsWithText = await page.locator('td').all();
    const truncatedCells = [];
    
    for (let i = 0; i < Math.min(cellsWithText.length, 20); i++) {
      const cell = cellsWithText[i];
      const text = await cell.textContent();
      if (text && text.includes('...')) {
        truncatedCells.push(text);
      }
    }
    
    console.log('Cells with truncated text (...):', truncatedCells);
    
    // Check row count
    const rowCount = await page.locator('tbody tr').count();
    console.log('Number of rows:', rowCount);
    
    // Check for overflow issues
    const tableContainer = page.locator('.table-container, .history-table, [class*="table"]').first();
    const hasOverflow = await tableContainer.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        overflow: style.overflow,
        overflowX: style.overflowX,
        overflowY: style.overflowY,
        width: el.scrollWidth,
        clientWidth: el.clientWidth,
        hasHorizontalScroll: el.scrollWidth > el.clientWidth
      };
    }).catch(() => null);
    
    if (hasOverflow) {
      console.log('Table overflow info:', hasOverflow);
    }
  } else {
    console.log('No table found on the page');
    
    // Check what content is actually on the page
    const pageContent = await page.textContent('body');
    console.log('Page content preview:', pageContent?.slice(0, 500) + '...');
  }
  
  // Take a focused screenshot of just the table area if it exists
  const tableElement = page.locator('table').first();
  if (await tableElement.count() > 0) {
    await tableElement.screenshot({ 
      path: path.join(__dirname, 'history-table-focused.png')
    });
    console.log('Focused table screenshot saved');
  }
  
  // Check page title and URL to confirm we're on the right page
  const title = await page.title();
  const url = page.url();
  console.log(`Page title: ${title}`);
  console.log(`Current URL: ${url}`);
});