import { test } from '@playwright/test';

test('Detailed Blueprint class detection', async ({ page }) => {
  await page.goto('http://localhost:3000/match-review/test-collection/test-deck');
  
  // Wait for page to fully load
  await page.waitForLoadState('networkidle');
  
  // Take a screenshot
  await page.screenshot({ path: 'detailed-debug.png' });
  
  // Check all elements with any class
  const elementsWithClasses = await page.evaluate(() => {
    const elements = document.querySelectorAll('*[class]');
    const classes = [];
    for (let i = 0; i < Math.min(elements.length, 100); i++) {
      const element = elements[i];
      classes.push({
        tagName: element.tagName,
        className: element.className,
        id: element.id || null
      });
    }
    return classes;
  });
  
  console.log('Elements with classes:');
  console.log(JSON.stringify(elementsWithClasses.filter(el => el.className.includes('bp')), null, 2));
  
  // Check if Blueprint CSS is loaded
  const stylesheets = await page.evaluate(() => {
    const sheets = [];
    for (let i = 0; i < document.styleSheets.length; i++) {
      const sheet = document.styleSheets[i];
      sheets.push({
        href: sheet.href,
        disabled: sheet.disabled
      });
    }
    return sheets;
  });
  
  console.log('Stylesheets loaded:');
  stylesheets.forEach(sheet => console.log(sheet.href || 'inline'));
  
  // Check for specific Blueprint classes in CSS
  const hasBlueprintCSS = await page.evaluate(() => {
    const testElement = document.createElement('div');
    testElement.className = 'bp4-card';
    document.body.appendChild(testElement);
    const styles = window.getComputedStyle(testElement);
    const hasStyles = styles.padding !== '0px' || styles.borderRadius !== '0px';
    document.body.removeChild(testElement);
    return hasStyles;
  });
  
  console.log('Blueprint CSS applied:', hasBlueprintCSS);
  
  // Look for actual card elements in a different way
  const cardElements = await page.locator('.match-card').count();
  console.log('Match card elements found:', cardElements);
  
  // Check for any elements with bp4- in their computed classes
  const computedClasses = await page.evaluate(() => {
    const allElements = document.querySelectorAll('*');
    const found = [];
    for (let element of allElements) {
      if (element.classList && element.classList.toString().includes('bp4-')) {
        found.push(element.classList.toString());
      }
    }
    return found.slice(0, 20); // First 20 matches
  });
  
  console.log('Elements with bp4- classes:');
  console.log(computedClasses);
});