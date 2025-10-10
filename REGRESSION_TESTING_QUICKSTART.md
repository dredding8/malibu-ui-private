# 🚀 Regression Testing Quick Start

## 3-Minute Setup for Continuous Validation During Refactoring

### Step 1: Capture Initial Baseline (1 min)

```bash
# Terminal 1: Start development server
npm start

# Terminal 2: Capture baseline
npm run baseline:capture "Initial baseline before refactoring"
npm run test:regression
```

**Expected Output:**
```
✓ Visual regression tests: 5/5 passed
✓ Performance tests: 5/5 passed
✓ Functional tests: 5/5 passed
✓ Accessibility tests: 4/4 passed
```

### Step 2: Start Continuous Validation (30 sec)

```bash
# Keep npm start running in Terminal 1

# Terminal 2: Start watch mode
npm run test:regression:watch
```

**What happens:**
- 👁️  Monitors your code changes
- 🔄 Automatically runs regression tests
- ⚡ Provides immediate feedback
- 📊 Highlights any regressions

### Step 3: Refactor with Confidence (continuous)

Now start refactoring! The watch mode will:

✅ **Detect changes** → Run tests → Show results

**Example output when regression detected:**
```
🔴 Regression detected in: Visual Regression Detection > selection state
   Expected screenshot to match baseline
   Diff: 127 pixels different (0.12% change)

   View diff: test-results/regression-report/index.html
```

**Example output when all clear:**
```
✅ All regression tests passed!
   Visual: 5/5 ✓
   Performance: 5/5 ✓
   Functional: 5/5 ✓
```

## Common Scenarios

### Scenario 1: Regression Detected (Unintentional Change)

```bash
# 1. View detailed report
npm run test:regression:report

# 2. Debug the specific test
npm run test:regression:debug

# 3. Fix the code
# (Watch mode automatically re-runs tests)

# 4. Verify fix
✅ All tests pass
```

### Scenario 2: Intentional Change (Update Baseline)

```bash
# 1. Review the changes
npm run test:regression:report

# 2. Verify changes are correct
# (Check visual diffs, performance metrics)

# 3. Update baseline
npm run baseline:update "Updated button styling per design"

# 4. Tests now pass with new baseline
✅ All tests pass
```

### Scenario 3: Quick Functional Check (Fast Feedback)

```bash
# Run only functional tests (skips visual/performance)
npm run test:regression:quick
```

## Key Commands Reference

| What You Want | Command |
|---------------|---------|
| Start continuous testing | `npm run test:regression:watch` |
| Quick functional check | `npm run test:regression:quick` |
| View results | `npm run test:regression:report` |
| Debug failing test | `npm run test:regression:debug` |
| Update baseline | `npm run baseline:update` |
| Compare current vs baseline | `npm run baseline:compare` |
| Rollback baseline | `npm run baseline:rollback` |

## Understanding Results

### ✅ Green = No Regressions
Everything matches baseline. Continue refactoring!

### ⚠️ Yellow = Minor Differences
Small variations detected (within tolerance). Review to confirm.

### 🔴 Red = Regression Detected
Significant difference from baseline. Action required:
- **Bug?** → Fix the code
- **Intentional?** → Update baseline

## Visual Regression Example

**Before (Baseline):**
![Baseline Screenshot](./test-results/regression-baselines/visual/collection-default-view.png)

**After (Current):**
![Current Screenshot](./test-results/regression-artifacts/collection-default-view-actual.png)

**Diff (Highlighted Changes):**
![Diff Screenshot](./test-results/regression-artifacts/collection-default-view-diff.png)

Red areas show pixel differences.

## Performance Regression Example

```
Test: should maintain filter performance
Baseline: 150ms
Current:  180ms (20% slower) ❌
Threshold: 165ms (10% tolerance)

Status: REGRESSION DETECTED
Action: Profile filter logic and optimize
```

## Next Steps

1. ✅ **Setup complete** - You're ready to refactor!
2. 📚 **Deep dive**: Read full guide at `src/tests/regression/README.md`
3. 🎯 **Best practices**: Small, incremental changes with continuous validation
4. 🔄 **Workflow**: Refactor → Auto-test → Review → Fix or Update

## Troubleshooting

**Watch mode not detecting changes?**
```bash
# Install fswatch for automatic detection
brew install fswatch

# Or use interactive UI mode
npm run test:regression:ui
```

**False positives in visual tests?**
```bash
# Review the diff
npm run test:regression:report

# If acceptable, update baseline
npm run baseline:update "Updated styling"
```

**Performance tests unstable?**
```bash
# Run multiple times to establish stable baseline
npm run test:regression
npm run test:regression
npm run test:regression

# Then capture average as baseline
npm run baseline:capture "Stable performance baseline"
```

## Pro Tips

💡 **Commit baselines to git** - Track baseline changes alongside code

💡 **Small changes** - Easier to identify regression sources

💡 **Review before updating** - Always verify changes are intentional

💡 **Use UI mode** - Interactive debugging with time-travel

```bash
npm run test:regression:ui
```

---

**Ready to start?** Run these two commands:

```bash
npm run baseline:capture "Pre-refactor baseline"
npm run test:regression:watch
```

**Happy refactoring! 🎉**
