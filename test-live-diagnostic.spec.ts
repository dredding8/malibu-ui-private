import { test, expect } from '@playwright/test';

/**
 * Diagnostic Test - What's Actually on the Live Page?
 */

test('Diagnose Live Collection Management Page', async ({ page }) => {
  const BASE_URL = 'http://localhost:3000';
  const TEST_COLLECTION_ID = 'DECK-1757517559289';
  const COLLECTION_MANAGE_URL = `${BASE_URL}/collection/${TEST_COLLECTION_ID}/manage`;

  console.log(`\n🔍 Navigating to: ${COLLECTION_MANAGE_URL}\n`);

  await page.goto(COLLECTION_MANAGE_URL, { waitUntil: 'networkidle' });

  // Wait for any React content to render
  await page.waitForTimeout(3000);

  // Capture what's actually on the page
  const pageContent = await page.evaluate(() => {
    // Get main container classes
    const body = document.body;
    const bodyClasses = body.className;

    // Find all major sections
    const sections = {
      body: bodyClasses,
      mainContainers: [] as string[],
      headers: [] as string[],
      tables: [] as string[],
      blueprintComponents: [] as string[],
      allClassNames: new Set<string>()
    };

    // Find main containers
    const containers = document.querySelectorAll('[class*="hub"], [class*="collection"], [class*="opportunit"]');
    containers.forEach(el => {
      sections.mainContainers.push(`${el.tagName}.${el.className}`);
      el.className.split(' ').forEach(c => sections.allClassNames.add(c));
    });

    // Find headers
    const headers = document.querySelectorAll('h1, h2, h3, [class*="header"]');
    headers.forEach(el => {
      const text = el.textContent?.trim().substring(0, 50) || '';
      sections.headers.push(`${el.tagName}.${el.className} = "${text}"`);
    });

    // Find tables
    const tables = document.querySelectorAll('table, [class*="table"]');
    tables.forEach(el => {
      sections.tables.push(`${el.tagName}.${el.className}`);
      el.className.split(' ').forEach(c => sections.allClassNames.add(c));
    });

    // Find Blueprint components
    const bpComponents = document.querySelectorAll('[class*="bp5-"], [class*="bp6-"]');
    const bpClasses = new Set<string>();
    bpComponents.forEach(el => {
      el.className.split(' ').filter(c => c.startsWith('bp5-') || c.startsWith('bp6-')).forEach(c => bpClasses.add(c));
    });
    sections.blueprintComponents = Array.from(bpClasses).sort();

    return {
      ...sections,
      allClassNames: Array.from(sections.allClassNames).sort()
    };
  });

  console.log('\n📦 BODY CLASSES:');
  console.log(pageContent.body);

  console.log('\n🏗️  MAIN CONTAINERS FOUND:');
  pageContent.mainContainers.forEach(c => console.log(`  ${c}`));

  console.log('\n📰 HEADERS FOUND:');
  pageContent.headers.forEach(h => console.log(`  ${h}`));

  console.log('\n📊 TABLES FOUND:');
  pageContent.tables.forEach(t => console.log(`  ${t}`));

  console.log('\n🎨 BLUEPRINT COMPONENTS:');
  const bpComponentTypes = pageContent.blueprintComponents
    .map(c => c.replace(/^bp[56]-/, ''))
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 20);
  bpComponentTypes.forEach(c => console.log(`  bp*-${c}`));

  console.log('\n🔍 KEY CLASSES TO LOOK FOR:');
  const keyClasses = [
    'hub-navigation',
    'hub-header',
    'context-stats',
    'bp5-breadcrumbs',
    'bp6-breadcrumbs',
    'opportunities-table-enhanced',
    'CollectionOpportunitiesHub',
    'CollectionOpportunitiesEnhanced'
  ];

  keyClasses.forEach(className => {
    const found = pageContent.allClassNames.includes(className);
    console.log(`  ${found ? '✅' : '❌'} ${className}`);
  });

  // Check what route/page is actually rendering
  const pageInfo = await page.evaluate(() => {
    // Try to find React root or app info
    const reactRoot = document.querySelector('#root, [data-reactroot]');
    const firstChild = reactRoot?.firstElementChild;

    return {
      rootExists: !!reactRoot,
      rootClass: reactRoot?.className,
      firstChildTag: firstChild?.tagName,
      firstChildClass: firstChild?.className,
      url: window.location.href,
      pathname: window.location.pathname
    };
  });

  console.log('\n🌐 PAGE INFO:');
  console.log(`  URL: ${pageInfo.url}`);
  console.log(`  Pathname: ${pageInfo.pathname}`);
  console.log(`  React Root Exists: ${pageInfo.rootExists}`);
  console.log(`  Root Class: ${pageInfo.rootClass}`);
  console.log(`  First Child: ${pageInfo.firstChildTag}.${pageInfo.firstChildClass}`);

  // Take diagnostic screenshot
  await page.screenshot({
    path: 'test-results/diagnostic-full-page.png',
    fullPage: true
  });
  console.log('\n📸 Screenshot saved: test-results/diagnostic-full-page.png');

  // Check for console errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.waitForTimeout(1000);

  if (errors.length > 0) {
    console.log('\n⚠️  CONSOLE ERRORS:');
    errors.forEach(e => console.log(`  ${e}`));
  } else {
    console.log('\n✅ No console errors');
  }

  // Check which specific route component is rendering
  const routeComponent = await page.evaluate(() => {
    // Look for common collection management component indicators
    const indicators = {
      hasEnhancedClass: !!document.querySelector('[class*="enhanced"]'),
      hasHubClass: !!document.querySelector('[class*="hub"]'),
      hasBentoClass: !!document.querySelector('[class*="bento"]'),
      hasAccessibleClass: !!document.querySelector('[class*="accessible"]'),
      hasMigratedClass: !!document.querySelector('[class*="migrated"]')
    };

    return indicators;
  });

  console.log('\n🎯 ROUTE COMPONENT INDICATORS:');
  Object.entries(routeComponent).forEach(([key, value]) => {
    console.log(`  ${value ? '✅' : '❌'} ${key}`);
  });

  console.log('\n');
});
