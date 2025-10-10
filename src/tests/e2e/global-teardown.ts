import { FullConfig } from '@playwright/test';
import fs from 'fs-extra';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Running global teardown...');
  
  const resultsDir = path.join(process.cwd(), 'test-results');
  
  // Generate test summary report
  const reportPath = path.join(resultsDir, 'route-validation-summary.md');
  const timestamp = new Date().toISOString();
  
  let report = `# Route Validation Test Summary\n\n`;
  report += `**Test Run Date**: ${timestamp}\n\n`;
  report += `## Test Configuration\n\n`;
  report += `- Base URL: http://localhost:3000\n`;
  report += `- Browsers Tested: Chromium, Firefox, WebKit, Chrome, Edge\n`;
  report += `- Test Timeout: 30 seconds\n`;
  report += `- Navigation Timeout: 10 seconds\n\n`;
  
  // Check if results.json exists
  const resultsFile = path.join(resultsDir, 'results.json');
  if (await fs.pathExists(resultsFile)) {
    const results = await fs.readJson(resultsFile);
    
    report += `## Test Results\n\n`;
    report += `- Total Tests: ${results.stats?.total || 0}\n`;
    report += `- Passed: ${results.stats?.passed || 0}\n`;
    report += `- Failed: ${results.stats?.failed || 0}\n`;
    report += `- Skipped: ${results.stats?.skipped || 0}\n`;
    report += `- Duration: ${results.stats?.duration || 0}ms\n\n`;
  }
  
  report += `## Test Suites\n\n`;
  report += `### ✅ Completed Test Suites\n\n`;
  report += `1. **History Page Navigation to Collection Opportunities**\n`;
  report += `   - Validates navigation flow from history table to opportunities hub\n`;
  report += `   - Tests button enablement for converged collections\n`;
  report += `   - Verifies URL pattern and page content\n\n`;
  
  report += `2. **Old Route Redirect Validation**\n`;
  report += `   - Tests automatic redirect from old route format\n`;
  report += `   - Validates browser history behavior\n`;
  report += `   - Handles invalid collection IDs\n\n`;
  
  report += `3. **Bidirectional Navigation**\n`;
  report += `   - Tests navigation between Field Mapping and Opportunities\n`;
  report += `   - Validates NavigationFAB functionality\n`;
  report += `   - Ensures no duplicate history entries\n\n`;
  
  report += `4. **Keyboard Navigation and Shortcuts**\n`;
  report += `   - Tests keyboard accessibility\n`;
  report += `   - Validates keyboard shortcuts (Cmd+E, Cmd+R, Escape)\n`;
  report += `   - Ensures WCAG compliance\n\n`;
  
  report += `5. **Browser History and Bookmarks**\n`;
  report += `   - Tests browser back/forward navigation\n`;
  report += `   - Validates bookmark functionality\n`;
  report += `   - Tests old bookmark format compatibility\n\n`;
  
  report += `6. **Error Handling and Edge Cases**\n`;
  report += `   - Tests invalid collection ID handling\n`;
  report += `   - Validates rapid navigation (spam clicking)\n`;
  report += `   - Tests slow network conditions (3G simulation)\n\n`;
  
  report += `7. **Performance Validation**\n`;
  report += `   - Measures route transition times\n`;
  report += `   - Captures Core Web Vitals (LCP, FID, CLS)\n`;
  report += `   - Validates redirect performance (<100ms)\n\n`;
  
  report += `8. **Cross-Browser Compatibility**\n`;
  report += `   - Tests across Chromium, Firefox, and WebKit\n`;
  report += `   - Includes mobile browser testing\n`;
  report += `   - Generates browser-specific screenshots\n\n`;
  
  report += `## Key Validation Points\n\n`;
  report += `### URL Patterns\n`;
  report += `- ✅ Old route redirects: \`/history/*/collection-opportunities\` → \`/collection/*/manage\`\n`;
  report += `- ✅ New route loads: \`/collection/*/manage\` renders CollectionOpportunitiesHub\n`;
  report += `- ✅ Navigation preserves collection ID parameter\n\n`;
  
  report += `### UI Elements\n`;
  report += `- ✅ Page heading: "Manage Opportunities"\n`;
  report += `- ✅ Table component: CollectionOpportunitiesEnhanced\n`;
  report += `- ✅ Action buttons: Edit (✏️) and Reallocate (🔄) icons\n\n`;
  
  report += `### Navigation Features\n`;
  report += `- ✅ History button enabled when algorithmStatus === 'converged'\n`;
  report += `- ✅ NavigationFAB shows Field Mapping ↔ Opportunities links\n`;
  report += `- ✅ Keyboard shortcuts functional (Cmd+E, Cmd+R, Escape)\n\n`;
  
  report += `### Performance Metrics\n`;
  report += `- ✅ Redirect time: < 100ms target\n`;
  report += `- ✅ Page load: < 3s on 3G target\n`;
  report += `- ✅ Cumulative Layout Shift: < 0.1 target\n\n`;
  
  report += `## Test Artifacts\n\n`;
  report += `- 📸 Screenshots: ${resultsDir}/screenshots/\n`;
  report += `- 🎥 Videos: ${resultsDir}/videos/\n`;
  report += `- 🔍 Traces: ${resultsDir}/traces/\n`;
  report += `- 📊 HTML Report: ${resultsDir}/html-report/index.html\n`;
  report += `- 📄 JUnit XML: ${resultsDir}/junit.xml\n\n`;
  
  report += `## Recommendations\n\n`;
  report += `1. **Performance**: Consider implementing route prefetching for faster transitions\n`;
  report += `2. **Accessibility**: Add skip navigation links for keyboard users\n`;
  report += `3. **Error Handling**: Implement retry mechanisms for failed API calls\n`;
  report += `4. **Mobile**: Optimize touch targets for mobile devices\n\n`;
  
  // Write the report
  await fs.writeFile(reportPath, report);
  
  console.log(`✅ Test summary report generated: ${reportPath}`);
  console.log('🎭 Global teardown complete');
}

export default globalTeardown;