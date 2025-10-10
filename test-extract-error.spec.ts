import { test } from '@playwright/test';

test('Extract Application Error Details', async ({ page }) => {
  await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage', {
    waitUntil: 'networkidle'
  });

  await page.waitForTimeout(3000);

  // Extract full error details
  const errorDetails = await page.evaluate(() => {
    const body = document.body;
    return {
      fullHTML: body.innerHTML.substring(0, 5000),
      fullText: body.textContent?.substring(0, 2000) || '',
      errorElements: Array.from(document.querySelectorAll('[class*="error"], h2, pre, code')).map(el => ({
        tag: el.tagName,
        class: el.className,
        text: el.textContent?.substring(0, 500)
      }))
    };
  });

  console.log('\n=== FULL PAGE TEXT ===');
  console.log(errorDetails.fullText);

  console.log('\n=== ERROR ELEMENTS ===');
  errorDetails.errorElements.forEach(el => {
    console.log(`\n${el.tag}.${el.class}:`);
    console.log(el.text);
  });

  // Check browser console
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  await page.waitForTimeout(2000);

  console.log('\n=== BROWSER CONSOLE ===');
  consoleLogs.forEach(log => console.log(log));

  // Take screenshot
  await page.screenshot({
    path: 'test-results/error-details.png',
    fullPage: true
  });
});
