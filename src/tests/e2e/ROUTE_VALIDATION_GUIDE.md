# Route Validation Test Execution Guide

## Overview

This guide provides comprehensive instructions for executing Playwright tests to validate the route consolidation changes for collection opportunities.

## Prerequisites

1. Ensure the development server is running:
   ```bash
   npm start
   ```

2. Ensure Playwright is installed with browsers:
   ```bash
   npx playwright install
   ```

## Test Execution Commands

### Quick Start

Run all route validation tests across all browsers:
```bash
npm run test:routes:all
```

### Individual Test Suites

1. **Run all tests in headless mode:**
   ```bash
   npm run test:routes
   ```

2. **Run tests with UI (interactive mode):**
   ```bash
   npm run test:routes:ui
   ```

3. **Debug tests with browser open:**
   ```bash
   npm run test:routes:debug
   ```

### Browser-Specific Testing

1. **Chrome/Chromium only:**
   ```bash
   npm run test:routes:chrome
   ```

2. **Firefox only:**
   ```bash
   npm run test:routes:firefox
   ```

3. **Safari/WebKit only:**
   ```bash
   npm run test:routes:webkit
   ```

4. **Mobile browsers only:**
   ```bash
   npm run test:routes:mobile
   ```

## Test Scenarios Covered

### 1. History Page Navigation to Collection Opportunities
- Validates navigation from history table to opportunities hub
- Tests button enablement for converged collections
- Verifies URL patterns and page content
- Captures screenshots for validation

### 2. Old Route Redirect Validation
- Tests automatic redirect from `/history/{id}/collection-opportunities` to `/collection/{id}/manage`
- Validates browser history behavior (no redirect loops)
- Handles invalid collection IDs gracefully
- Measures redirect performance (<100ms target)

### 3. Bidirectional Navigation (Field Mapping ↔ Opportunities)
- Tests NavigationFAB functionality
- Validates round-trip navigation preserves state
- Ensures no duplicate history entries
- Screenshots both pages for comparison

### 4. Keyboard Navigation and Shortcuts
- Tests Tab navigation through UI elements
- Validates keyboard shortcuts:
  - `Cmd+E` / `Ctrl+E`: Edit selected opportunity
  - `Cmd+R` / `Ctrl+R`: Reallocate selected opportunity
  - `Escape`: Clear selection
- Ensures WCAG accessibility compliance

### 5. Browser History and Bookmarks
- Tests browser back/forward navigation
- Validates bookmark functionality
- Tests old bookmark format compatibility
- Ensures proper history stack management

### 6. Error Handling and Edge Cases
- Tests invalid collection ID handling
- Validates rapid navigation (spam clicking prevention)
- Tests slow network conditions (3G simulation)
- Captures error states with screenshots

### 7. Performance Validation
- Measures route transition times
- Captures Core Web Vitals:
  - LCP (Largest Contentful Paint)
  - FID (First Input Delay)
  - CLS (Cumulative Layout Shift)
- Validates redirect performance
- Network waterfall analysis

### 8. Cross-Browser Compatibility
- Tests across Chromium, Firefox, and WebKit
- Includes mobile browser testing
- Generates browser-specific screenshots
- Creates compatibility matrix report

## Test Results and Artifacts

After running tests, find results in:

```
test-results/
├── screenshots/          # Visual validation screenshots
├── videos/              # Test execution videos (on failure)
├── traces/              # Playwright trace files
├── artifacts/           # Additional test artifacts
├── html-report/         # Interactive HTML report
├── junit.xml           # JUnit format results
├── results.json        # JSON format results
└── route-validation-summary.md  # Comprehensive summary report
```

## Viewing Test Reports

### HTML Report
```bash
npx playwright show-report test-results/html-report
```

### Summary Report
```bash
cat test-results/route-validation-summary.md
```

## CI/CD Integration

For continuous integration, use:

```bash
# Run tests in CI mode (no UI, with retries)
CI=true npm run test:routes
```

## Troubleshooting

### Common Issues

1. **Port 3000 in use:**
   ```bash
   # Kill process using port 3000
   lsof -ti:3000 | xargs kill -9
   ```

2. **Browser installation issues:**
   ```bash
   # Reinstall browsers
   npx playwright install --force
   ```

3. **Test timeouts:**
   - Increase timeout in `playwright.route-validation.config.ts`
   - Check network conditions
   - Ensure dev server is running

### Debug Mode

For detailed debugging:
```bash
# Set debug environment variable
DEBUG=pw:api npm run test:routes:debug
```

## Performance Benchmarks

Expected performance metrics:

- **Redirect Time**: < 100ms
- **Page Load Time**: < 3s on 3G network
- **Route Transition**: < 1s on fast connection
- **CLS Score**: < 0.1
- **FID**: < 100ms
- **LCP**: < 2.5s

## Accessibility Standards

All tests validate against:

- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Color contrast ratios

## Best Practices

1. **Run tests before deployment:**
   ```bash
   npm run test:routes:all && npm run build
   ```

2. **Update tests when routes change:**
   - Modify test expectations in `route-consolidation.spec.ts`
   - Update URL patterns and selectors

3. **Monitor performance trends:**
   - Compare performance metrics over time
   - Set up alerts for regression

4. **Review screenshots regularly:**
   - Check for visual regressions
   - Validate responsive behavior

## MCP Integration Notes

The tests are designed to work with Playwright MCP, which provides:

- Browser automation control
- Performance metric collection
- Visual testing capabilities
- Cross-browser execution
- Network condition simulation

When using Playwright MCP, the tests automatically:
- Connect to available browser instances
- Execute test scenarios in parallel
- Collect comprehensive metrics
- Generate detailed reports

## Questions or Issues?

For issues with tests:
1. Check the error logs in test-results/
2. Review screenshots for visual clues
3. Run in debug mode for step-by-step execution
4. Check browser console for JavaScript errors