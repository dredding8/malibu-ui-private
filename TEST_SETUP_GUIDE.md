# Playwright Test Setup Guide

## 🎯 Current Test Status

**File**: `src/tests/e2e/wizard-6-step-flow.spec.ts`
**Results**: 24 passed / 21 failed (53%)

---

## ⚠️ Known Issues & Fixes

### Issue 1: Strict Mode Violations

**Problem**: Selectors matching multiple elements
```typescript
// ❌ FAILS: Multiple "Your Collections" text exists
await expect(page.getByText('Your Collections')).toBeVisible();
```

**Fix**: Use more specific selectors
```typescript
// ✅ FIXED: Target specific heading role
await expect(page.getByRole('heading', { name: 'Your Collections' })).toBeVisible();
```

**Apply to**:
- Line 104: `should allow exit to standalone history from Step 5`

---

### Issue 2: Missing Test Data

**Problem**: Tests expect wizard state that doesn't exist
```typescript
// ❌ FAILS: No actual wizard data exists
await page.goto('http://localhost:3000/create-collection-deck/status');
```

**Fix**: Add test fixtures or mock data
```typescript
// ✅ FIXED: Set up wizard state before navigating
await page.goto('http://localhost:3000/create-collection-deck/data');
// Fill Steps 1-4 with test data
await completeSteps1Through4(page);
// Now Step 5 will have proper state
```

**Apply to**:
- Lines 82-93: `should allow back navigation from Step 6 to Step 5`
- Lines 95-105: `should allow exit to standalone history from Step 5`
- Lines 118-135: `should auto-select newly created collection in Step 5`

---

### Issue 3: App Not Running

**Problem**: Tests run against `http://localhost:3000` but dev server isn't started

**Fix**: Start dev server before running tests
```bash
# Terminal 1: Start dev server
npm start

# Terminal 2: Run tests (after server is ready)
npx playwright test wizard-6-step-flow.spec.ts
```

**OR**: Use Playwright's webServer config (preferred)
```typescript
// playwright.config.ts
export default {
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
  // ... rest of config
};
```

---

## 🔧 Recommended Test Updates

### 1. Fix Strict Mode Violations

```typescript
// src/tests/e2e/wizard-6-step-flow.spec.ts

// BEFORE (Line 104)
await expect(page.getByText('Your Collections')).toBeVisible();

// AFTER
await expect(page.getByRole('heading', { name: 'Your Collections', level: 3 })).toBeVisible();
```

### 2. Add Test Data Fixtures

```typescript
// src/tests/e2e/helpers/wizard-fixtures.ts

export async function completeWizardToStep5(page) {
  // Navigate to start
  await page.goto('http://localhost:3000/create-collection-deck/data');

  // Fill Step 1 - Input Data
  await page.getByLabel('Start Date').fill('2025-01-01');
  await page.getByLabel('End Date').fill('2025-12-31');
  await page.getByLabel('TLE Source').selectOption('Space-Track');
  await page.getByRole('button', { name: 'Next' }).click();

  // Fill Step 2 - Parameters
  await page.getByLabel('Hard Capacity').fill('100');
  await page.getByLabel('Min Duration').fill('30');
  await page.getByLabel('Elevation').fill('10');
  await page.getByRole('button', { name: 'Next' }).click();

  // Fill Step 3 - Select Opportunities
  await page.getByRole('checkbox').first().check(); // Select first opportunity
  await page.getByRole('button', { name: 'Next' }).click();

  // Fill Step 4 - Special Instructions
  await page.getByLabel('Instructions').fill('Test collection');
  await page.getByTestId('step4-finish-button').click();

  // Now at Step 5
  await page.waitForURL('**/status');

  return {
    collectionId: 'TEST-COLLECTION-ID',
    collectionName: 'Test Collection'
  };
}
```

### 3. Use Helper in Tests

```typescript
import { completeWizardToStep5 } from './helpers/wizard-fixtures';

test('should allow back navigation from Step 6 to Step 5', async ({ page }) => {
  // Setup: Complete wizard to Step 5
  await completeWizardToStep5(page);

  // Navigate to Step 6
  await page.getByTestId('step5-next-button').click();
  await page.waitForURL('**/management');

  // Test: Click Back button
  await page.getByTestId('step6-back-button').click();

  // Verify: Returned to Step 5
  await page.waitForURL('**/status');
  await expect(page.getByTestId('step5-heading')).toBeVisible();
});
```

---

## 🚀 Quick Fix Implementation

### Option A: Manual Testing (Fastest)

```bash
# 1. Start dev server
npm start

# 2. Manually test wizard flow in browser:
# - Go to http://localhost:3000/create-collection-deck/data
# - Complete Steps 1-4
# - Verify Step 5 shows history with auto-selection
# - Verify Step 6 shows management preview
# - Test back navigation and exit options
```

### Option B: Fix Critical Tests Only

Focus on tests that don't require full wizard state:

```typescript
// These tests work without wizard state:
✅ should display progress indicators for all 6 steps
✅ should maintain wizard chrome throughout all 6 steps
✅ HistoryTable should render in embedded mode
✅ CollectionPreview should render in embedded mode
```

### Option C: Full Test Suite Fix (Comprehensive)

1. Create test fixtures file
2. Update all tests to use fixtures
3. Fix selector issues
4. Configure webServer in playwright.config.ts

**Estimated Time**: 2-3 hours

---

## 📊 Test Prioritization

### High Priority (Fix First)
- [ ] Fix strict mode violations (5 min)
- [ ] Add webServer config to playwright.config.ts (10 min)
- [ ] Create basic wizard fixture helper (30 min)

### Medium Priority
- [ ] Update navigation tests to use fixtures (1 hour)
- [ ] Add mock data for HistoryTable (30 min)
- [ ] Test cross-browser compatibility fixes (1 hour)

### Low Priority
- [ ] Mobile-specific test adjustments (30 min)
- [ ] Screenshot comparison tests (1 hour)
- [ ] Performance benchmarking (1 hour)

---

## ✅ Validation Strategy

### 1. Unit Tests (Fast, Isolated)
```bash
npm test -- HistoryTable
npm test -- Step5HistoryView
npm test -- CollectionPreview
```

### 2. Manual E2E (Realistic, Complete)
```
1. Start app: npm start
2. Navigate to wizard
3. Complete all 6 steps
4. Verify each feature manually
```

### 3. Automated E2E (Comprehensive, CI-Ready)
```bash
# After fixes applied
npx playwright test wizard-6-step-flow.spec.ts --headed
```

---

## 🎯 Success Criteria

- [ ] All 45 tests pass (100%)
- [ ] No strict mode violations
- [ ] Tests run without app already running (webServer config)
- [ ] Cross-browser compatible (Chrome, Firefox, Safari)
- [ ] Mobile tests pass (Mobile Chrome, Mobile Safari)
- [ ] Tests complete in <2 minutes

---

## 📞 Next Actions

**Immediate** (To get tests passing):
1. Fix strict mode selector issues (5 min)
2. Start dev server before running tests
3. Manually validate wizard flow works

**Short-term** (To make tests robust):
1. Create wizard test fixtures
2. Configure Playwright webServer
3. Update tests to use fixtures

**Long-term** (To maintain quality):
1. Add tests to CI/CD pipeline
2. Set up visual regression testing
3. Monitor test flakiness and fix

---

*Generated: 2025-11-12*
*Status: Tests created, fixes needed for full pass rate*
