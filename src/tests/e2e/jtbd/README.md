# JTBD (Jobs To Be Done) Test Suite

Comprehensive end-to-end test suite for validating Jobs To Be Done workflows in the Collection Opportunities application using Playwright.

## Overview

This test suite validates that users can complete their critical jobs efficiently and effectively. It tests real user workflows, measures performance, validates accessibility, and ensures data integrity across the application.

## JTBD Coverage

### 1. Verify and Validate Collection Plans
- **Job**: Ensure collection plans match satellite capabilities and ground station availability
- **Tests**: Pass validation, capacity verification, approval workflows
- **Success Metrics**: < 2 minutes completion, zero missed issues

### 2. Override and Customize Allocations
- **Job**: Handle suboptimal matches and apply manual overrides when needed
- **Tests**: Override workflows, justification tracking, impact analysis
- **Success Metrics**: < 3 minutes completion, full audit trail

### 3. Fix Data Integrity Issues
- **Job**: Identify and resolve missing or corrupted satellite data
- **Tests**: Issue detection, resolution workflows, validation
- **Success Metrics**: < 5 minutes resolution, no data loss

### 4. Analyze Performance Trends
- **Job**: Monitor collection efficiency and identify optimization opportunities
- **Tests**: Analytics dashboard, trend analysis, report generation
- **Success Metrics**: < 4 seconds load time, interactive visualizations

### 5. Bulk Operations Management
- **Job**: Efficiently manage multiple opportunities simultaneously
- **Tests**: Bulk selection, updates, validation, undo capabilities
- **Success Metrics**: < 5 minutes for 50+ items, data integrity maintained

## Test Architecture

```
src/tests/e2e/jtbd/
├── fixtures/
│   ├── jtbd-test.fixture.ts      # Test framework and personas
│   └── jtbd-workflows.ts         # Workflow definitions
├── helpers/
│   ├── metrics-collector.ts      # Performance and UX metrics
│   └── visual-validator.ts       # Visual regression testing
├── scenarios/
│   └── (individual test files)
├── .auth/
│   └── user.json                 # Authentication state
├── global-setup.ts               # Test environment setup
├── global-teardown.ts            # Cleanup and reporting
└── jtbd-complete.jtbd.spec.ts   # Main test suite
```

## Running Tests

### Quick Start
```bash
# Run all JTBD tests on Chrome
npm run test:jtbd

# Run with UI mode for debugging
npm run test:jtbd:ui

# Run complete suite on all browsers
npm run test:jtbd:complete
```

### Command Line Options
```bash
# Run specific workflow
./run-jtbd-tests.sh -t "verify collection plans"

# Debug mode with visible browser
./run-jtbd-tests.sh -d -H

# Update visual baselines
./run-jtbd-tests.sh -u

# Run on specific browser
./run-jtbd-tests.sh -b firefox

# Run sequentially (no parallel)
./run-jtbd-tests.sh -s
```

### NPM Scripts
```bash
# Core commands
npm run test:jtbd              # Run all tests
npm run test:jtbd:ui           # UI mode
npm run test:jtbd:debug        # Debug mode
npm run test:jtbd:headed       # Visible browser

# Browser-specific
npm run test:jtbd:chrome       # Chrome only
npm run test:jtbd:all-browsers # All browsers
npm run test:jtbd:mobile       # Mobile browsers

# Specialized testing
npm run test:jtbd:a11y         # Accessibility focus
npm run test:jtbd:performance  # Performance focus
npm run test:jtbd:update-baseline # Update screenshots

# Reporting
npm run test:jtbd:report       # View HTML report
```

## Test Personas

### Collection Analyst
- Primary user managing satellite collections
- Goals: Verify plans, optimize schedules, resolve conflicts
- Success: Complete tasks in < 2 minutes

### Operations Manager
- Oversees collection operations and approvals
- Goals: Monitor efficiency, approve overrides, track metrics
- Success: Real-time visibility, quick approvals

### Mobile Analyst
- Field analyst using mobile devices
- Goals: Remote access, quick verification, urgent responses
- Success: Full mobile functionality, < 5s load on 3G

## Metrics Collection

### Performance Metrics
- Page load times
- Core Web Vitals (LCP, FID, CLS)
- Time to Interactive
- Memory usage
- Network performance

### User Experience Metrics
- Task completion time
- Number of clicks/actions
- Error occurrence
- Backtracking frequency
- Help usage

### Accessibility Metrics
- WCAG compliance level
- Keyboard navigation success
- Screen reader compatibility
- Color contrast ratios
- Touch target sizes

## Visual Regression Testing

The suite includes visual regression testing to catch unintended UI changes:

```bash
# Update baseline screenshots
npm run test:jtbd:update-baseline

# Run with visual validation
JTBD_SCREENSHOTS=true npm run test:jtbd

# View visual diff report
open test-results/jtbd-artifacts/visual/visual-regression-report.html
```

## Test Reports

### HTML Report
After test execution, view the interactive HTML report:
```bash
npm run test:jtbd:report
```

### Metrics Summary
Located at: `test-results/jtbd-artifacts/jtbd-summary.html`
- Pass/fail rates by workflow
- Performance scores
- Error tracking
- Trend analysis

### Coverage Report
Located at: `test-results/jtbd-artifacts/coverage/`
- Code coverage metrics
- Untested paths
- Feature coverage

## Configuration

### Environment Variables
```bash
JTBD_PARALLEL=false         # Disable parallel execution
JTBD_SCREENSHOTS=false      # Disable screenshots
JTBD_A11Y=false            # Skip accessibility tests
JTBD_UPDATE_BASELINE=true  # Update visual baselines
```

### Performance Thresholds
Edit `fixtures/jtbd-workflows.ts` to adjust performance targets:
```typescript
performanceTarget: {
  lcp: 2500,    // Largest Contentful Paint (ms)
  fid: 100,     // First Input Delay (ms)
  cls: 0.1,     // Cumulative Layout Shift
  ttfb: 600,    // Time to First Byte (ms)
}
```

## Debugging Failed Tests

### Using UI Mode
```bash
npm run test:jtbd:ui
```
- Step through tests interactively
- Inspect DOM at each step
- View network requests
- Check console logs

### Debug Mode
```bash
npm run test:jtbd:debug
```
- Pauses at first test
- Opens Playwright Inspector
- Step through code execution

### Artifacts
Failed tests generate:
- Screenshots at failure point
- Video recordings
- Network HAR files
- Console logs
- Performance traces

## Best Practices

### Writing New Tests
1. Define clear JTBD with success criteria
2. Create realistic workflows
3. Set appropriate performance budgets
4. Include accessibility validation
5. Add visual regression checkpoints

### Test Maintenance
1. Review and update workflows quarterly
2. Adjust performance thresholds based on baselines
3. Keep visual baselines current
4. Monitor flaky tests and fix root causes

### CI/CD Integration
```yaml
# Example GitHub Actions workflow
- name: Run JTBD Tests
  run: |
    npm ci
    npx playwright install
    npm run test:jtbd:complete
  env:
    CI: true
```

## Troubleshooting

### Common Issues

**Tests timing out**
- Increase timeout in workflow definition
- Check if app is running (`npm start`)
- Verify network connectivity

**Visual regression failures**
- Review diff images for legitimate changes
- Update baselines if changes are intentional
- Check for dynamic content masking

**Accessibility violations**
- Review axe-core report details
- Fix violations in source code
- Update tests if false positives

### Getting Help
1. Check test artifacts in `test-results/jtbd-artifacts/`
2. Review debug logs with `--debug` flag
3. Use Playwright UI mode for step-by-step debugging
4. Consult Playwright documentation

## Contributing

### Adding New JTBD Tests
1. Identify user job and success criteria
2. Create workflow in `fixtures/jtbd-workflows.ts`
3. Add test scenarios in main test file
4. Set performance and accessibility targets
5. Run tests and establish baselines

### Improving Test Infrastructure
- Enhance metrics collection
- Add new personas
- Improve reporting
- Optimize test execution speed