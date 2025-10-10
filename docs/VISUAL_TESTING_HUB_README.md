# Visual Testing for CollectionOpportunitiesHub

This guide provides comprehensive instructions for visual regression testing of the CollectionOpportunitiesHub component.

## Overview

Visual testing captures screenshots of the CollectionOpportunitiesHub component in various states and compares them against baseline images to detect unintended visual changes.

## Quick Start

```bash
# Capture screenshots on Chrome
npm run test:visual:hub:capture

# Compare with baselines
npm run test:visual:hub:compare

# Update baselines
npm run test:visual:hub:update

# Run full visual test suite (all browsers)
npm run test:visual:hub:all
```

## Available Commands

### npm Scripts

- `npm run test:visual:hub` - Run the Hub visual tests
- `npm run test:visual:hub:capture` - Capture new screenshots
- `npm run test:visual:hub:compare` - Compare screenshots with baselines
- `npm run test:visual:hub:update` - Update baselines with current screenshots
- `npm run test:visual:hub:report` - Generate visual test report
- `npm run test:visual:hub:status` - Check current status of visual tests
- `npm run test:visual:hub:all` - Capture and compare on all browsers

### Command Line Tool

The `manage-hub-visual-baselines.sh` script provides more control:

```bash
# Capture on specific browser
./scripts/manage-hub-visual-baselines.sh capture -b firefox

# Compare all browsers
./scripts/manage-hub-visual-baselines.sh compare -a

# Filter specific tests
./scripts/manage-hub-visual-baselines.sh capture -f "Initial Load"

# Show detailed report
./scripts/manage-hub-visual-baselines.sh report -r
```

## What Gets Tested

The visual test suite captures the following states and components:

### 1. Initial States
- Hub initial load
- Statistics dashboard
- Smart view selector
- Tab navigation

### 2. Component Views
- Opportunities table
- Bento layout
- Split view
- Enhanced components

### 3. Responsive Design
- Mobile (375×812)
- Tablet (768×1024)
- Desktop (1920×1080)

### 4. Interactive States
- Button hover/focus
- Row selection
- Tab switching
- Dropdown menus

### 5. Edge Cases
- Loading states
- Error states
- Empty states
- Dark mode

### 6. Accessibility
- High contrast mode
- Reduced motion
- Print view

## Directory Structure

```
test-results/
├── visual-baselines/
│   └── collection-hub/        # Hub-specific baselines
│       ├── hub-initial-chromium.png
│       ├── hub-stats-chromium.png
│       └── ...
├── visual-screenshots/
│   └── collection-hub/        # Current screenshots
└── visual-diffs/
    └── collection-hub/        # Difference images
```

## Workflow

### 1. Initial Setup

When starting visual testing for the first time:

```bash
# Create initial baselines
npm run test:visual:hub:update

# Verify baselines were created
npm run test:visual:hub:status
```

### 2. Regular Testing

During development:

```bash
# Before making changes
npm run test:visual:hub:capture

# After making changes
npm run test:visual:hub:compare
```

### 3. Updating Baselines

When intentional visual changes are made:

```bash
# Review current differences
npm run test:visual:hub:compare

# If changes are correct, update baselines
npm run test:visual:hub:update
```

## Best Practices

### 1. Consistent Environment
- Always run tests with the same viewport sizes
- Ensure consistent font rendering across machines
- Use the same browser versions

### 2. Handling Dynamic Content
The tests automatically hide:
- Timestamps and dates
- Loading spinners
- Animation elements
- Random/dynamic data

### 3. Browser Coverage
Test on all major browsers:
- Chromium (Chrome, Edge)
- Firefox
- WebKit (Safari)

### 4. Review Process
1. Always review visual diffs before updating baselines
2. Confirm changes are intentional
3. Document significant visual changes in commits

## Troubleshooting

### Common Issues

#### Screenshots Don't Match
```bash
# Check for browser differences
npm run test:visual:hub:compare -b chromium
npm run test:visual:hub:compare -b firefox

# Update specific browser baseline
./scripts/manage-hub-visual-baselines.sh update -b chromium
```

#### Tests Timeout
```bash
# Run with extended timeout
npx playwright test visual-collection-opportunities-hub.spec.ts --timeout=60000
```

#### Missing Baselines
```bash
# Check status
npm run test:visual:hub:status

# Create missing baselines
npm run test:visual:hub:update
```

### Debugging

1. **Visual UI Mode**
   ```bash
   npx playwright test visual-collection-opportunities-hub.spec.ts --ui
   ```

2. **Debug Mode**
   ```bash
   npx playwright test visual-collection-opportunities-hub.spec.ts --debug
   ```

3. **View Report**
   ```bash
   npm run test:visual:hub:report
   npx playwright show-report test-results/visual-report
   ```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Visual Tests
  run: |
    npm run test:visual:hub:capture
    npm run test:visual:hub:compare
    
- name: Upload Visual Artifacts
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: visual-test-results
    path: |
      test-results/visual-screenshots/
      test-results/visual-diffs/
```

### Baseline Management in CI

1. Store baselines in the repository
2. Update via pull requests
3. Review visual changes in PR

## Advanced Usage

### Custom Filters

Test specific components:
```bash
./scripts/manage-hub-visual-baselines.sh capture -f "Stats|Smart View"
```

### Parallel Testing

Run browsers in parallel:
```bash
npx playwright test visual-collection-opportunities-hub.spec.ts --workers=4
```

### Custom Thresholds

Adjust sensitivity in `playwright.visual.config.ts`:
```typescript
toHaveScreenshot: {
  maxDiffPixels: 100,      // Adjust for tolerance
  threshold: 0.2,          // 0-1 scale
  animations: 'disabled',
}
```

## Maintenance

### Regular Tasks

1. **Weekly**: Review and clean old screenshots
   ```bash
   ./scripts/manage-hub-visual-baselines.sh clean
   ```

2. **Monthly**: Audit baselines for relevance
   ```bash
   ./scripts/manage-hub-visual-baselines.sh list
   ```

3. **Quarterly**: Update browser versions and regenerate baselines

### Storage Management

Visual tests can accumulate large files. Manage storage:

```bash
# Check current usage
du -sh test-results/visual-*

# Clean old artifacts
./scripts/manage-hub-visual-baselines.sh clean
```

## Contributing

When adding new visual tests:

1. Add test cases to `visual-collection-opportunities-hub.spec.ts`
2. Capture initial baselines
3. Document what the test covers
4. Update this README if needed

## Support

For issues or questions:
1. Check test output for specific errors
2. Review the visual diffs in `test-results/visual-diffs/`
3. Run in debug mode for more information
4. Check browser console for JavaScript errors