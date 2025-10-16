# Unified Modal UX Validation Test Suite

Comprehensive automated validation system for the Unified Opportunities Modal redesign, testing compliance with UX laws, Blueprint design patterns, and accessibility standards.

## Overview

This test suite validates the redesign from card-based to table-based layout using Playwright automation:

**Target Component**: `UnifiedOpportunityEditor.tsx`

**Key Changes Validated**:
1. AllocatedSites: Cards → Blueprint Table2
2. Collection Editing: Inline editing in Available Passes table
3. Site Operations: Operations column in Available Passes table

## Test Suites

### 1. Visual Regression (`unified-modal-visual-regression.spec.ts`)
Validates the visual implementation of the redesign:
- ✅ AllocatedSites renders as table (not cards)
- ✅ Inline editing components present
- ✅ Site operations column visible
- ✅ Dark mode support

**Outputs**: Screenshots in `.playwright-mcp/validation/`

---

### 2. UX Laws Compliance (`unified-modal-ux-laws.spec.ts`)
Automated validation against established UX laws:

#### Hick's Law (Decision Time)
- **Test**: Count of primary actions ≤7
- **Impact**: Reduces cognitive load and decision paralysis
- **Metric**: Number of interactive elements

#### Fitts's Law (Target Size & Distance)
- **Test**: All tap targets ≥44x44px (iOS) / ≥48x48px (Android)
- **Impact**: Improves accuracy and reduces errors
- **Metric**: Button dimensions, distance from starting points

#### Jakob's Law (User Expectations)
- **Test**: Table patterns match Blueprint conventions
- **Impact**: Familiar patterns reduce learning curve
- **Validation**: Blueprint component usage, standard interactions

#### Gestalt Principles (Visual Perception)
- **Test**: Related items visually grouped
- **Impact**: Improves scannability and comprehension
- **Metrics**: Spacing between sections, visual consistency

---

### 3. Blueprint Pattern Compliance (`unified-modal-blueprint-compliance.spec.ts`)
Validates proper use of Blueprint components:

#### Component Requirements
- ✅ Blueprint Table2 (no custom tables)
- ✅ EditableText for inline editing
- ✅ ButtonGroup or Popover for operations
- ✅ Standard Dialog structure
- ✅ Blueprint form controls
- ✅ Blueprint icons

#### Custom Implementation Detection
- ❌ Custom table components (forbidden)
- ❌ Raw input elements without Blueprint wrappers
- ❌ Custom dropdown implementations

---

### 4. Accessibility (`unified-modal-accessibility.spec.ts`)
WCAG AA compliance validation:

#### Automated Testing
- **Axe-core integration**: Comprehensive accessibility scan
- **Violations detection**: Critical, serious, moderate issues
- **Standards**: WCAG 2.1 Level AA

#### Keyboard Navigation
- Tab order validation (logical flow)
- Focus trap within modal
- Escape key closes modal
- Enter/Space activate buttons
- Focus indicators visible

#### Screen Reader Support
- Dialog role and semantic HTML
- Accessible labels (aria-label, aria-labelledby)
- Live regions for state changes
- Interactive elements labeled

#### Color Contrast
- Text: 4.5:1 minimum (normal), 3:1 minimum (large)
- Icons: 3:1 minimum
- Automated contrast ratio checking

---

### 5. Interaction Workflows (`unified-modal-workflows.spec.ts`)
User journey and workflow testing:

#### Workflows Tested
1. **Modal Opening**: From opportunities table
2. **Site Allocation**: Available → AllocatedSites
3. **Inline Editing**: Collection name editing
4. **Operations Menu**: Site operations interaction
5. **Modal Closing**: Close button, Escape, overlay click
6. **Table Sorting**: Column header interactions
7. **Multi-row Selection**: Checkbox selection
8. **Form Submission**: Save/submit workflow

**Validation**: Workflow completion, state updates, visual feedback

---

### 6. Performance Metrics (`unified-modal-performance.spec.ts`)
Performance and optimization validation:

#### Metrics Measured
- **Modal render time**: <500ms target
- **Interaction latency**: <100ms for button clicks
- **Animation duration**: 200-300ms (optimal range)
- **DOM complexity**: Node count and nesting depth
- **Virtualization**: Active for tables >50 rows
- **Debouncing**: 300ms for inline editing
- **Network efficiency**: Request count and payload size

**Impact**: Smooth user experience, reduced wait times

---

## Running Tests

### Full Validation Suite
```bash
npm run test:validate-ux
```
Runs all tests and generates comprehensive validation report.

### Interactive Mode
```bash
npm run test:validate-ux:ui
```
Opens Playwright UI for test debugging and inspection.

### Debug Mode
```bash
npm run test:validate-ux:debug
```
Step-by-step test execution with browser dev tools.

### Generate Report Only
```bash
npm run test:validate-ux:report
```
Regenerates validation report from existing test results.

### Individual Suites
```bash
# Visual regression only
playwright test tests/unified-modal-visual-regression.spec.ts

# UX laws only
playwright test tests/unified-modal-ux-laws.spec.ts

# Accessibility only
playwright test tests/unified-modal-accessibility.spec.ts

# Workflows only
playwright test tests/unified-modal-workflows.spec.ts

# Performance only
playwright test tests/unified-modal-performance.spec.ts

# Blueprint compliance only
playwright test tests/unified-modal-blueprint-compliance.spec.ts
```

---

## Validation Report

### Report Location
`UNIFIED_MODAL_VALIDATION_REPORT.md` (project root)

### Report Sections
1. **Executive Summary**: Overall pass/fail status
2. **Visual Regression Analysis**: Screenshot comparisons
3. **UX Laws Compliance**: Detailed law-by-law analysis
4. **Blueprint Pattern Compliance**: Component usage validation
5. **Accessibility Compliance**: WCAG AA results
6. **Interaction Workflows**: User journey validation
7. **Performance Metrics**: Performance benchmarks
8. **Issues Summary**: P0/P1/P2 prioritized issues
9. **Recommendations**: Immediate actions and future enhancements
10. **Screenshots Gallery**: Visual documentation

### Issue Priority Levels
- **P0 (Blocking)**: Critical issues preventing deployment
- **P1 (High)**: Should fix before deployment
- **P2 (Medium)**: Nice to have improvements

---

## Screenshot Outputs

Screenshots are saved to `.playwright-mcp/validation/`:

- `allocated-sites-table.png` - Cards → Table conversion
- `available-passes-inline-edit.png` - Inline editing UI
- `site-operations-column.png` - Operations column
- `modal-dark-mode.png` - Dark theme support
- `modal-opened.png` - Initial modal state
- `allocation-workflow-complete.png` - Allocation flow
- `inline-edit-complete.png` - Edit workflow
- `site-operations-menu.png` - Operations menu
- `table-sorted.png` - Sorting interaction
- `multi-row-selection.png` - Selection state
- `form-submission.png` - Submit workflow

---

## Test Results

Test results are stored in `.playwright-mcp/`:

- `results.json` - Machine-readable test results
- `report/` - HTML test report (open `report/index.html`)
- `test-results/` - Individual test artifacts
- `validation/` - Screenshots and visual evidence

---

## Configuration

### Playwright Config
Main configuration in `playwright.config.ts`:
- **Test Directory**: `./tests`
- **Timeout**: 30 seconds per test
- **Parallel Execution**: Enabled
- **Retries**: 2 on CI, 0 locally
- **Reporters**: HTML, JSON, List
- **Browser Contexts**: Desktop (Chrome, Firefox, Safari), Mobile

### Environment
- **Base URL**: `http://localhost:3000`
- **Dev Server**: Auto-starts with `npm start`
- **Viewport**: 1280x720 (desktop), device-specific (mobile)

---

## Dependencies

### Required Packages
- `@playwright/test` - Test framework
- `@axe-core/playwright` - Accessibility testing

### Installation
```bash
npm install --save-dev @playwright/test @axe-core/playwright
```

### Browser Installation
```bash
npx playwright install
```

---

## Integration with Design Panel

This test suite implements automated validation for the Design Roundtable's requirements:

### PM - Scope Validation
- Tests verify MVP scope boundaries
- Performance metrics track user-facing metrics

### UX Designer - UX Laws
- Automated Hick's, Fitts's, Jakob's, Gestalt validation
- Evidence-based recommendations

### IxD - Interactions
- Workflow testing validates all interaction patterns
- Animation timing and haptic feedback verification

### Visual Designer - Aesthetics
- Screenshot comparison for visual consistency
- Blueprint component usage enforcement

### Product Designer - Integration
- Pattern consistency across features
- Design system compliance validation

---

## Troubleshooting

### Tests Failing to Start
```bash
# Ensure dev server is running
npm start

# Or let Playwright start it automatically
# (configured in playwright.config.ts)
```

### Modal Not Opening
- Check opportunities table has data
- Verify row click handler is attached
- Check console for JavaScript errors

### Screenshot Differences
- Visual differences may occur due to:
  - Font rendering variations
  - Animation timing
  - Dynamic data
- Review screenshots manually in `.playwright-mcp/validation/`

### Accessibility Violations
- Review Axe-core report for specific issues
- Common fixes:
  - Add aria-labels to icon buttons
  - Ensure proper heading hierarchy
  - Fix color contrast ratios

---

## Best Practices

### Writing New Tests
1. Follow existing test structure
2. Use descriptive test names
3. Add console logging for debugging
4. Screenshot critical states
5. Use data-testid attributes for selectors

### Test Maintenance
1. Update baselines after intentional design changes
2. Review failing tests before updating
3. Keep tests independent (no shared state)
4. Clean up test data after runs

### Performance
1. Use parallel execution for speed
2. Avoid unnecessary waits (use waitForSelector)
3. Reuse browser contexts when possible
4. Limit screenshot capturing to key states

---

## Contributing

### Adding New Validation
1. Create new spec file in `tests/`
2. Follow naming convention: `unified-modal-{category}.spec.ts`
3. Add test suite to validation report generator
4. Update this README with new suite documentation

### Updating Report Generator
Edit `tests/generate-validation-report.ts` to:
- Add new metrics
- Update issue categorization
- Enhance report formatting

---

## References

### UX Laws Documentation
- [Laws of UX](https://lawsofux.com/) - Research and examples
- Context7 library: `/websites/lawsofux`

### Blueprint Documentation
- [Blueprint Components](https://blueprintjs.com/docs/) - Official docs
- Context7 library: Blueprint component references

### Accessibility Standards
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/) - Official guidelines
- [Axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)

### Playwright Resources
- [Playwright Docs](https://playwright.dev/) - Test framework
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

---

## Changelog

### 2025-10-15
- ✅ Initial test suite implementation
- ✅ Visual regression tests
- ✅ UX laws compliance tests
- ✅ Blueprint pattern tests
- ✅ Accessibility tests (WCAG AA)
- ✅ Interaction workflow tests
- ✅ Performance metrics tests
- ✅ Validation report generator

---

**Status**: ✅ Ready for validation
**Next Steps**: Run `npm run test:validate-ux` to execute full validation suite
