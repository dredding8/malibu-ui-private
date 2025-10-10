# Continuous Regression Testing for Refactoring

Comprehensive regression testing suite that provides **continuous validation** during refactoring to ensure no regressions are introduced.

## 🎯 Purpose

Detect regressions across multiple dimensions:
- **Visual**: Layout, styling, component appearance
- **Performance**: Render time, interaction speed, memory usage
- **Functional**: User interactions, data handling, workflows
- **Accessibility**: WCAG compliance, keyboard navigation, screen readers
- **Cross-Browser**: Consistent behavior across browsers and devices

## 🚀 Quick Start

### 1. Initial Baseline Capture

Before starting refactoring, capture the current state as baseline:

```bash
# Run app and capture baseline
npm start  # In separate terminal
npm run baseline:capture "Pre-refactor baseline"
npm run test:regression
```

This creates baseline screenshots, performance metrics, and functional validation data.

### 2. Continuous Validation During Refactoring

Start watch mode for automatic regression detection:

```bash
npm run test:regression:watch
```

This monitors your code changes and automatically runs regression tests, providing immediate feedback.

### 3. Review Results

```bash
# View detailed HTML report
npm run test:regression:report

# View baseline comparison
npm run baseline:compare
```

## 📋 Available Commands

### Regression Testing

| Command | Description |
|---------|-------------|
| `npm run test:regression` | Run full regression suite |
| `npm run test:regression:watch` | Watch mode - auto-run on changes |
| `npm run test:regression:quick` | Quick functional checks only |
| `npm run test:regression:ui` | Interactive UI mode |
| `npm run test:regression:debug` | Debug mode with DevTools |
| `npm run test:regression:headed` | Run with visible browser |
| `npm run test:regression:report` | View HTML report |
| `npm run test:regression:update` | Update baselines after verified changes |

### Baseline Management

| Command | Description |
|---------|-------------|
| `npm run baseline:capture` | Capture new baseline |
| `npm run baseline:compare` | Compare current vs baseline |
| `npm run baseline:update` | Update baseline after changes |
| `npm run baseline:report` | View baseline history |
| `npm run baseline:rollback` | Rollback to previous baseline |

## 🔄 Typical Refactoring Workflow

### Step 1: Pre-Refactor Validation

```bash
# Ensure clean baseline
npm run test:regression

# Capture baseline if needed
npm run baseline:capture "Before refactoring X component"
```

### Step 2: Start Watch Mode

```bash
# Terminal 1: Run development server
npm start

# Terminal 2: Start regression watch
npm run test:regression:watch
```

### Step 3: Refactor with Confidence

Make changes to your code. The watch mode automatically:
- Detects file changes
- Runs relevant regression tests
- Compares against baseline
- Reports any regressions immediately

### Step 4: Handle Regressions

**If regression detected:**

```bash
# View detailed report
npm run test:regression:report

# Check specific test
npm run test:regression:debug

# Fix the issue and tests re-run automatically
```

**If changes are intentional:**

```bash
# Update baseline after verification
npm run test:regression:update

# Or update baseline with description
npm run baseline:update "Updated button styling"
```

### Step 5: Final Validation

```bash
# Run full suite across all browsers
npm run test:regression

# Verify performance hasn't regressed
npm run baseline:compare

# Generate final report
npm run test:regression:report
```

## 📊 Understanding Test Results

### Visual Regression Detection

Visual tests capture pixel-perfect screenshots and compare against baseline:

```
✓ should match baseline screenshot - default view
✓ should match baseline screenshot - table interactions
✗ should match baseline screenshot - selection state  [REGRESSION]
```

**Regression detected**: Selection state styling changed
**Action**: Review visual diff in HTML report

### Performance Regression Detection

Performance tests measure timing and compare against baseline with 10% tolerance:

```
✓ should maintain initial page load performance (245ms < 250ms)
✗ should maintain filter performance (180ms > 150ms) [REGRESSION]
```

**Regression detected**: Filter operation 20% slower
**Action**: Profile and optimize filter logic

### Functional Regression Detection

Functional tests validate behavior and interactions:

```
✓ should maintain table display functionality
✓ should maintain selection functionality
✗ should maintain sort functionality [REGRESSION]
```

**Regression detected**: Sorting no longer works
**Action**: Check sort event handlers and logic

## 🎛️ Configuration

### Adjust Visual Comparison Threshold

Edit `playwright.regression.config.ts`:

```typescript
expect: {
  toHaveScreenshot: {
    maxDiffPixels: 100,      // Allow 100 different pixels
    maxDiffPixelRatio: 0.01, // Allow 1% difference
    threshold: 0.2,          // Pixel color threshold
  },
}
```

### Adjust Performance Tolerance

Edit `src/tests/regression/collection-regression.spec.ts`:

```typescript
const PERFORMANCE_TOLERANCE = 1.1; // 10% tolerance
```

### Customize Watch Mode

```bash
# Watch with options
./src/tests/regression/watch-regression.sh --quick      # Fast checks only
./src/tests/regression/watch-regression.sh --no-visual  # Skip visual tests
./src/tests/regression/watch-regression.sh --no-perf    # Skip performance tests
```

## 🔍 Troubleshooting

### False Positives in Visual Tests

**Issue**: Screenshots differ due to dynamic content (timestamps, random IDs)

**Solution**:
1. Review diff in HTML report
2. If acceptable, update baseline: `npm run test:regression:update`
3. Or mask dynamic regions in test:

```typescript
await expect(page).toHaveScreenshot('test.png', {
  mask: [page.locator('.timestamp')],
});
```

### Performance Tests Flaky

**Issue**: Performance varies between runs

**Solution**:
1. Increase tolerance in configuration
2. Run multiple iterations to establish stable baseline
3. Ensure no background processes affecting measurements

### Watch Mode Not Detecting Changes

**Issue**: File changes don't trigger tests

**Solution**:
1. Check watch directories in `watch-regression.sh`
2. Install fswatch: `brew install fswatch`
3. Use UI mode as fallback: `npm run test:regression:ui`

## 📁 Directory Structure

```
test-results/
├── regression-baselines/         # Baseline data
│   ├── performance-baseline.json # Performance metrics
│   ├── functional-baseline.json  # Functional validation
│   ├── visual/                   # Screenshot baselines
│   └── archive/                  # Previous baseline versions
├── regression-report/            # HTML test reports
├── regression-results.json       # Latest test results
└── regression-artifacts/         # Screenshots, videos, traces
```

## 🎯 Best Practices

### 1. Establish Clean Baseline

Ensure baseline represents stable, working state:
- All existing tests pass
- No known bugs in baseline
- Consistent test environment

### 2. Small, Incremental Changes

Refactor in small steps:
- Easier to identify regression source
- Faster feedback loop
- Lower risk of multiple simultaneous regressions

### 3. Review Before Updating Baseline

Always verify changes are intentional:
1. Run `npm run test:regression:report`
2. Review visual diffs, performance changes
3. Verify functional behavior
4. Only then: `npm run baseline:update`

### 4. Document Baseline Updates

Use descriptive messages:
```bash
npm run baseline:update "Updated button hover states per design review"
```

### 5. Regular Baseline Maintenance

Periodically review and clean baselines:
```bash
npm run baseline:report  # Review history
npm run baseline:rollback  # If needed
```

## 🔗 Integration with CI/CD

Add to your CI pipeline:

```yaml
# .github/workflows/regression.yml
name: Regression Tests

on: [pull_request]

jobs:
  regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm ci
      - name: Run regression tests
        run: npm run test:regression
      - name: Upload report
        uses: actions/upload-artifact@v3
        with:
          name: regression-report
          path: test-results/regression-report/
```

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Visual Regression Testing Guide](https://playwright.dev/docs/test-snapshots)
- [Performance Testing Best Practices](https://web.dev/vitals/)
- Project-specific test documentation: `/Users/damon/malibu/src/tests/performance/`

## 🆘 Support

For issues or questions:
1. Check troubleshooting section above
2. Review HTML report: `npm run test:regression:report`
3. Run debug mode: `npm run test:regression:debug`
4. Review baseline history: `npm run baseline:report`
