# Split View Activation Guide

## Quick Activation Steps

### Step 1: Update Feature Flags (Required)

**File**: `/src/hooks/useFeatureFlags.tsx`

```typescript
// Line 9 - Add to FeatureFlags interface
export interface FeatureFlags {
  // ... existing flags ...
  useSplitView: boolean; // ADD THIS
}

// Line 24 - Add to defaultFlags
const defaultFlags: FeatureFlags = {
  // ... existing flags ...
  useSplitView: false, // ADD THIS - set to true when ready
};
```

### Step 2: Import Split View Component (Required)

**File**: `/src/pages/CollectionOpportunitiesHub.tsx`

```typescript
// Line 24 - Add import
import { CollectionOpportunitiesSplitView } from '../components/CollectionOpportunitiesSplitView';
```

### Step 3: Update Conditional Rendering (Required)

**File**: `/src/pages/CollectionOpportunitiesHub.tsx`

```typescript
// Line 222 - Update the conditional rendering
{useSplitView ? (
  <CollectionOpportunitiesSplitView />
) : useRefactoredComponents ? (
  <CollectionOpportunitiesRefactored />
) : progressiveComplexityUI ? (
  <CollectionOpportunitiesEnhanced
    // ... props
  />
) : (
  // ... legacy component
)}
```

### Step 4: Add Feature Flag to Hook Return (Required)

**File**: `/src/pages/CollectionOpportunitiesHub.tsx`

```typescript
// Line 103 - Add to destructured feature flags
const {
  progressiveComplexityUI,
  enableVirtualScrolling,
  enableWorkspaceMode,
  enableBatchOperations,
  enableHealthAnalysis,
  useRefactoredComponents,
  useSplitView // ADD THIS
} = useFeatureFlags();
```

### Step 5: Enable Split View

**Option A - Via Code (Permanent)**:
```typescript
// In useFeatureFlags.tsx defaultFlags
useSplitView: true
```

**Option B - Via URL (Testing)**:
```
http://localhost:3000/collection-opportunities?ff_useSplitView=true
```

**Option C - Via LocalStorage (Development)**:
```javascript
// In browser console
const flags = JSON.parse(localStorage.getItem('featureFlags') || '{}');
flags.useSplitView = true;
localStorage.setItem('featureFlags', JSON.stringify(flags));
location.reload();
```

## Verification Steps

1. **Check Active Component**:
   - Open browser DevTools
   - Look for class: `collection-opportunities-split-view`
   - Should NOT see: `collection-opportunities-refactored`

2. **Test Edit Behavior**:
   - Click any row or Edit button
   - Should see panel slide in from right
   - Should NOT see modal overlay

3. **Test Interactions**:
   - Main content should remain clickable
   - Should be able to resize panel (desktop)
   - Escape key should close panel

## Rollback Plan

If issues arise, simply set `useSplitView: false` in any of the three ways mentioned above.

## Test Execution

Once activated, run the comprehensive test suite:

```bash
# Run split view verification tests
./run-split-view-verification.sh

# Or run specific test
npx playwright test split-view-modal-replacement.spec.ts
```

## Migration Checklist

- [ ] Update feature flags interface
- [ ] Add default flag value
- [ ] Import split view component
- [ ] Update conditional rendering
- [ ] Add flag to destructured values
- [ ] Test in development
- [ ] Run E2E test suite
- [ ] Deploy with flag disabled
- [ ] Enable for subset of users
- [ ] Monitor for issues
- [ ] Full rollout
- [ ] Remove old modal code (future)

## Common Issues & Solutions

**Issue**: Split view not appearing
- **Check**: Feature flag is true
- **Check**: Component is imported
- **Check**: No JavaScript errors in console

**Issue**: Styles not loading
- **Check**: CSS file is imported in component
- **Check**: No CSS conflicts with existing styles

**Issue**: State not syncing
- **Check**: AllocationContext is properly connected
- **Check**: State updates are propagating

## Support

For issues or questions:
1. Check browser console for errors
2. Verify all activation steps completed
3. Run verification test: `node capture-current-implementation.js`
4. Check test results in `test-results/implementation-evidence/`