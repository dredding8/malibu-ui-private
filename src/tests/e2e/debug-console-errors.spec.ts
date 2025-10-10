import { test, expect } from '@playwright/test';

test('Debug console errors', async ({ page }) => {
  const consoleMessages: string[] = [];
  const errorMessages: string[] = [];
  
  // Capture all console messages
  page.on('console', msg => {
    const message = `[${msg.type()}] ${msg.text()}`;
    consoleMessages.push(message);
    if (msg.type() === 'error') {
      errorMessages.push(msg.text());
    }
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    errorMessages.push(`PAGE ERROR: ${error.message}`);
  });
  
  console.log('Navigating to collection management page...');
  
  // Navigate to the page
  try {
    await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
  } catch (e) {
    console.log('Navigation error:', e);
  }
  
  // Wait a bit more for any delayed errors
  await page.waitForTimeout(3000);
  
  console.log('\n=== ALL CONSOLE MESSAGES ===');
  consoleMessages.forEach((msg, index) => {
    console.log(`${index + 1}: ${msg}`);
  });
  
  console.log('\n=== ERROR MESSAGES ===');
  if (errorMessages.length === 0) {
    console.log('No JavaScript errors found!');
  } else {
    errorMessages.forEach((error, index) => {
      console.log(`ERROR ${index + 1}: ${error}`);
    });
  }
  
  // Check network requests
  const failedRequests: string[] = [];
  page.on('response', response => {
    if (response.status() >= 400) {
      failedRequests.push(`${response.status()} ${response.url()}`);
    }
  });
  
  await page.waitForTimeout(1000);
  
  if (failedRequests.length > 0) {
    console.log('\n=== FAILED NETWORK REQUESTS ===');
    failedRequests.forEach(req => console.log(req));
  }
  
  // Check if bundle.js loaded successfully
  const bundleLoaded = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    return scripts.map(script => ({
      src: (script as HTMLScriptElement).src,
      loaded: (script as HTMLScriptElement).readyState === 'complete' || !(script as HTMLScriptElement).readyState
    }));
  });
  
  console.log('\n=== SCRIPT LOADING STATUS ===');
  bundleLoaded.forEach(script => {
    console.log(`${script.loaded ? '✅' : '❌'} ${script.src}`);
  });
  
  // Check if React is available globally
  const reactAvailable = await page.evaluate(() => {
    return {
      React: typeof window.React !== 'undefined',
      ReactDOM: typeof window.ReactDOM !== 'undefined',
      hasReactDevtools: !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__
    };
  });
  
  console.log('\n=== REACT STATUS ===');
  console.log(`React available: ${reactAvailable.React}`);
  console.log(`ReactDOM available: ${reactAvailable.ReactDOM}`);
  console.log(`React DevTools detected: ${reactAvailable.hasReactDevtools}`);
  
  // The test always passes - we're just debugging
  expect(true).toBe(true);
});