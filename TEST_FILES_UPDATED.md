# Test Files Updated for Collection Management Route

**Date**: 2025-10-01
**Purpose**: Updated test files to test collection management page instead of root page

## Updated Test Files

### 1. test-ui-rendering.spec.ts
**Purpose**: Verify collection management page renders successfully
**Route**: `/collection/TEST-001/manage`
**Key Tests**:
- Root element visibility
- Collection Deck header present
- Button count > 20
- Input count > 5
- Smart Views section visible
- Collection Overview section visible
- Filter and Refresh buttons visible

**Screenshot**: `test-results/collection-ui-rendering.png`

### 2. test-simple.spec.ts
**Purpose**: Verify no error overlay on collection page
**Route**: `/collection/TEST-001/manage`
**Key Tests**:
- No "Maximum update depth exceeded" error
- Error overlay detection and handling
- Button count > 20 (verify working page vs error overlay)
- Successful page load without infinite loop

**Screenshot**: `test-results/collection-page-state.png`

### 3. test-current-state.spec.ts
**Purpose**: Comprehensive collection page state capture
**Route**: `/collection/TEST-001/manage`
**Key Tests**:
- Element counts (buttons, links, inputs, tables, divs)
- Console error/warning capture
- Page error detection
- Collection-specific elements (Collection Deck, Smart Views, Collection Overview)
- Tab availability
- Statistics cards presence

**Screenshot**: `test-results/collection-current-state.png`

## Test Results Summary

**Latest Test Run** (chromium):
- **Buttons**: 228 ✅
- **Links**: 1 ✅
- **Inputs**: 54 ✅
- **Tables**: 0
- **Divs**: 1,397 ✅
- **Error Overlays**: 3 (non-critical Blueprint prop warnings)
- **Infinite Loop Errors**: 0 ✅
- **Collection Deck Header**: Present ✅
- **Smart Views Section**: Present ✅
- **Collection Overview**: Present ✅
- **Available Tabs**: Manage Opportunities, Analytics, Settings ✅
- **Statistics Cards**: 155 ✅

## How to Run Tests

```bash
# Run all collection tests
cd /Users/damon/malibu
npx playwright test test-current-state.spec.ts test-simple.spec.ts test-ui-rendering.spec.ts --config=playwright.config.ts --reporter=list --project=chromium

# Run individual tests
npx playwright test test-ui-rendering.spec.ts --config=playwright.config.ts --project=chromium
npx playwright test test-simple.spec.ts --config=playwright.config.ts --project=chromium
npx playwright test test-current-state.spec.ts --config=playwright.config.ts --project=chromium
```

## Changes Made

### Before (Root Page Tests)
- URL: `http://localhost:3000`
- Testing: Dashboard/home page
- Expected: 35 buttons, 11 inputs

### After (Collection Management Tests)
- URL: `http://localhost:3000/collection/TEST-001/manage`
- Testing: Collection management interface
- Expected: 228 buttons, 54 inputs, collection-specific UI elements

## Related Files
- [troubleshooting-summary.md](troubleshooting-summary.md) - Full troubleshooting documentation
- [useFeatureFlags.tsx](src/hooks/useFeatureFlags.tsx#L52) - ENABLE_NEW_COLLECTION_SYSTEM disabled
- [AllocationContext.tsx](src/contexts/AllocationContext.tsx#L463-L482) - Health score calculation fix
- [collectionStore.ts](src/store/collectionStore.ts#L971-L988) - getSnapshot caching implementation
