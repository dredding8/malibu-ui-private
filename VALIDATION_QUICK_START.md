# UX Validation Quick Start Guide

## 🚀 Run Complete Validation

```bash
npm run test:validate-ux
```

This will:
1. ✅ Run all 6 test suites (42 tests)
2. ✅ Capture screenshots for visual validation
3. ✅ Generate comprehensive validation report
4. ✅ Save results to `UNIFIED_MODAL_VALIDATION_REPORT.md`

**Time**: ~2-3 minutes

---

## 📊 View Results

### HTML Report
```bash
npx playwright show-report .playwright-mcp/report
```

### Validation Report
```bash
cat UNIFIED_MODAL_VALIDATION_REPORT.md
```

### Screenshots
```bash
open .playwright-mcp/validation/
```

---

## 🐛 Debug Failing Tests

### Interactive Mode
```bash
npm run test:validate-ux:ui
```
Opens Playwright UI for test inspection and debugging.

### Debug Mode
```bash
npm run test:validate-ux:debug
```
Step-by-step execution with browser dev tools.

### Single Suite
```bash
# Visual regression only
playwright test tests/unified-modal-visual-regression.spec.ts

# UX laws only
playwright test tests/unified-modal-ux-laws.spec.ts

# Accessibility only
playwright test tests/unified-modal-accessibility.spec.ts
```

---

## 📋 Test Suites Overview

| Suite | Tests | Focus | Duration |
|-------|-------|-------|----------|
| **Visual Regression** | 5 | Cards→Tables conversion | ~30s |
| **UX Laws** | 6 | Hick's, Fitts's, Jakob's, Gestalt | ~45s |
| **Blueprint Compliance** | 7 | Component library usage | ~40s |
| **Accessibility** | 9 | WCAG AA, keyboard, screen reader | ~60s |
| **Workflows** | 8 | User journeys | ~50s |
| **Performance** | 7 | Render time, virtualization | ~45s |
| **Total** | **42** | **Full validation** | **~5min** |

---

## ✅ What Gets Validated

### Visual Design
- ✅ AllocatedSites: Cards → Table2
- ✅ Inline editing: EditableText components
- ✅ Operations column: ButtonGroup/Popover
- ✅ Dark mode support

### UX Laws
- ✅ **Hick's Law**: ≤7 primary actions
- ✅ **Fitts's Law**: 44x44px tap targets
- ✅ **Jakob's Law**: Blueprint patterns
- ✅ **Gestalt**: Visual grouping

### Accessibility (WCAG AA)
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Color contrast (4.5:1)
- ✅ Focus indicators

### Performance
- ✅ Modal render: <500ms
- ✅ Interaction latency: <100ms
- ✅ Virtualization: >50 rows

---

## 🔧 Prerequisites

### 1. Install Browsers
```bash
npx playwright install
```

### 2. Start Dev Server
```bash
npm start
```

Or let Playwright auto-start it (configured in `playwright.config.ts`)

### 3. Check Dependencies
```bash
npm install
```

---

## 📸 Screenshot Outputs

All screenshots saved to `.playwright-mcp/validation/`:

- `allocated-sites-table.png` - Table implementation
- `available-passes-inline-edit.png` - Inline editing
- `site-operations-column.png` - Operations UI
- `modal-dark-mode.png` - Dark theme
- `allocation-workflow-complete.png` - Allocation flow
- `inline-edit-complete.png` - Edit workflow
- Plus more workflow screenshots

---

## 🚨 Common Issues

### Modal Doesn't Open
**Fix**: Ensure opportunities table has data
```bash
# Check app is running
curl http://localhost:3000
```

### Tests Timeout
**Fix**: Increase timeout in failing test
```typescript
await expect(modal).toBeVisible({ timeout: 10000 });
```

### Screenshot Differences
**Fix**: Review visual changes manually
```bash
open .playwright-mcp/validation/allocated-sites-table.png
```

### Accessibility Violations
**Fix**: Check Axe-core report for specific issues
```bash
npx playwright show-report .playwright-mcp/report
```

---

## 📈 Interpreting Results

### ✅ All Tests Pass
**Verdict**: Ready for deployment
**Report**: Contains performance metrics and screenshots

### ⚠️  Some Tests Fail
**Action**: Review failing tests
**Priority**: Focus on P0 (blocking) issues first

### ❌ Multiple Failures
**Action**: Check prerequisites and app state
**Debug**: Use `npm run test:validate-ux:debug`

---

## 🎯 Priority Levels

### P0 - Blocking
Critical issues preventing deployment:
- Missing accessibility labels
- Tap targets below minimum
- Custom components (should be Blueprint)

### P1 - High Priority
Should fix before deployment:
- UX law violations
- Pattern inconsistencies
- Contrast issues

### P2 - Medium Priority
Nice-to-have improvements:
- Performance optimizations
- Enhanced feedback
- Future enhancements

---

## 📚 Full Documentation

See `tests/README.md` for complete documentation:
- Detailed test suite descriptions
- Configuration options
- Troubleshooting guide
- Best practices

---

## 🔄 Continuous Validation

### After Code Changes
```bash
npm run test:validate-ux
```

### Before Deployment
```bash
npm run test:validate-ux && echo "✅ Validation passed"
```

### CI/CD Integration
```yaml
# .github/workflows/validation.yml
- run: npm run test:validate-ux
```

---

## 💡 Tips

1. **Run tests locally** before committing
2. **Review screenshots** for visual regressions
3. **Fix P0 issues immediately** (blocking)
4. **Update baselines** after intentional changes
5. **Use UI mode** for debugging (`--ui`)

---

## 📞 Need Help?

1. Check `tests/README.md` for detailed docs
2. Review test output console logs
3. Open Playwright UI: `npm run test:validate-ux:ui`
4. Check screenshot evidence: `.playwright-mcp/validation/`

---

**Ready?** Run validation now:

```bash
npm run test:validate-ux
```

🎉 Good luck!
