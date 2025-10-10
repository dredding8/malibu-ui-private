# Collection Opportunities Test Suite Documentation

## Overview

Comprehensive test suite for the Collection Opportunities Enhanced page focusing on user experience, accessibility, and visual consistency.

## Test Structure

### 1. E2E User Experience Tests (`CollectionOpportunities.e2e.test.ts`)

#### Test Scenarios

**Scenario 1: First-Time User Orientation**
- Validates intuitive understanding of match status hierarchy
- Measures time-to-decision for critical tasks
- Tests error recovery capabilities
- Success Criteria: <10s identification, 100% correct interpretation, >90% task completion

**Scenario 2: Bulk Operations Workflow**
- Tests multi-selection discovery and usage
- Validates bulk action completion efficiency
- Measures keyboard shortcut adoption
- Success Criteria: <5s discovery, <2min completion, >60% shortcut usage

**Scenario 3: Information Architecture Validation**
- Tests visual hierarchy effectiveness
- Validates progressive disclosure patterns
- Ensures contextual actions match expectations
- Measures eye tracking patterns and click rates

### 2. Visual Regression Tests (`visual/collectionOpportunities.visual.test.ts`)

- **Component States**: Default, selected, filtered, searched
- **Interactive Elements**: Tooltips, buttons, tags
- **Responsive Design**: 7 breakpoints from mobile to desktop XL
- **Accessibility States**: Focus indicators, high contrast, reduced motion
- **Dark Mode**: Full dark mode support validation

### 3. Accessibility Tests

- **WCAG 2.1 AA Compliance**: Full automated scanning
- **Color Contrast**: All text meets 4.5:1 minimum
- **Keyboard Navigation**: Complete keyboard accessibility
- **Screen Reader**: ARIA labels and live regions
- **Focus Management**: Visible focus indicators

## Running Tests

### Quick Start
```bash
# Run all tests
npm run test:collection-opportunities

# Run specific test suite
npx playwright test CollectionOpportunities.e2e.test.ts

# Run with UI mode
npx playwright test --ui

# Update visual snapshots
npx playwright test --update-snapshots
```

### Comprehensive Test Run
```bash
# Use the provided test runner script
./src/components/__tests__/scripts/runCollectionOpportunitiesTests.sh
```

## Test Helpers

### `CollectionOpportunitiesPage` Class
Page object model providing methods for:
- Navigation and tab selection
- Search and filtering
- Row selection (single/multiple)
- Action execution
- Performance measurement

### `UserSimulator` Class
Simulates different user types:
- First-time users (scanning, learning)
- Power users (shortcuts, efficiency)
- Error recovery scenarios

### `PerformanceTracker` Class
Measures:
- Time to first action
- Task completion times
- Average operation durations

### `CopyConsistencyChecker` Class
Validates:
- Terminology consistency
- Action label accuracy
- Status indicator naming

## Success Criteria

### Quantitative Metrics
- **Task Completion Rate**: >95%
- **Time to First Action**: <5 seconds
- **Error Rate**: <5%
- **Accessibility Score**: 100% WCAG AA
- **User Satisfaction**: >4.5/5

### Qualitative Requirements
- Match status understood without explanation
- Actions feel intuitive and contextual
- Information hierarchy supports decision-making
- Copy is clear and consistent
- Visual design enhances comprehension

## Test Configuration

### Devices Tested
- **Desktop**: Chrome, Firefox, Safari (1920x1080)
- **Tablet**: iPad Pro (1024x768)
- **Mobile**: iPhone 14 (375x667), Pixel 7 (412x915)

### Special Modes
- Dark mode
- High contrast
- Reduced motion
- Touch interfaces

## Test Reports

Reports are generated in multiple formats:
- **HTML Report**: `test-reports/collection-opportunities-ux-report.html`
- **JSON Data**: `test-results/collection-opportunities.json`
- **JUnit XML**: `test-results/collection-opportunities.xml`
- **Playwright HTML**: `playwright-report/collection-opportunities/index.html`

## Continuous Integration

Tests are configured to run in CI with:
- Automatic retries on failure (2x)
- Parallel execution disabled for consistency
- Screenshots on failure
- Video recording for failures
- Full trace collection

## Debugging

### Debug Single Test
```bash
npx playwright test --debug -g "should identify critical unmatched opportunity"
```

### View Test Report
```bash
npx playwright show-report
```

### Inspect Failed Screenshots
```bash
open test-results/
```

## Best Practices

1. **Test Isolation**: Each test starts fresh, no shared state
2. **Stable Selectors**: Use data attributes and ARIA labels
3. **Explicit Waits**: Wait for specific conditions, not arbitrary timeouts
4. **Visual Masking**: Mask dynamic content in visual tests
5. **Parallel Safety**: Tests can run in parallel without conflicts

## Maintenance

### Updating Baselines
```bash
# Update all visual baselines
npx playwright test --update-snapshots

# Update specific test
npx playwright test --update-snapshots -g "default state"
```

### Adding New Tests
1. Add test case to appropriate describe block
2. Use page object methods for interactions
3. Assert on user-visible outcomes
4. Include accessibility checks
5. Add visual snapshot if UI changes

## Troubleshooting

### Common Issues

**Flaky Tests**
- Add explicit waits for animations
- Mask dynamic content in visual tests
- Use stable selectors

**Accessibility Failures**
- Check color contrast ratios
- Ensure all interactive elements have labels
- Verify keyboard navigation order

**Performance Issues**
- Run tests in parallel when possible
- Use batch operations
- Minimize screenshot comparisons