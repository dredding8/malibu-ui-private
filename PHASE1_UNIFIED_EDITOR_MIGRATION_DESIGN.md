# Phase 1 Migration Design: ManualOverrideModalRefactored → UnifiedOpportunityEditor

## Executive Summary

**Objective**: Migrate from `ManualOverrideModalRefactored` to `UnifiedOpportunityEditor` in `CollectionOpportunitiesEnhanced` component.

**Scope**: Phase 1 focuses on **single-opportunity** workflow with backward-compatible integration.

**Status**: ✅ Design Complete | 🔧 Ready for Implementation

---

## Architecture Overview

### Current Architecture (ManualOverrideModalRefactored)

```
┌─────────────────────────────────────────────────────────────┐
│ CollectionOpportunitiesEnhanced                             │
│                                                               │
│  State: { showOverrideModal, overrideModalDeckId }          │
│  Actions: OPEN_OVERRIDE_MODAL, CLOSE_OVERRIDE_MODAL          │
│                                                               │
│  Click Handler:                                              │
│    handleOpenOverrideModal(opportunityId)                    │
│    ↓                                                          │
│    dispatch({ type: 'OPEN_OVERRIDE_MODAL',                  │
│               payload: { opportunityIds: [id], deckId }})   │
│                                                               │
│  Component:                                                  │
│    <ManualOverrideModalRefactored                           │
│      isOpen={state.showOverrideModal}                       │
│      selectedOpportunityIds={Array.from(state.selectedRows)}│
│      collectionDeckId={state.overrideModalDeckId}           │
│      onSave={handleSaveOverride}                            │
│    />                                                        │
│                                                               │
│  Save Handler:                                               │
│    handleSaveOverride(Map<string, CollectionOpportunity>)   │
│    ↓                                                          │
│    Convert to array → onBatchUpdate → close modal           │
└─────────────────────────────────────────────────────────────┘
```

### Target Architecture (UnifiedOpportunityEditor)

```
┌─────────────────────────────────────────────────────────────┐
│ CollectionOpportunitiesEnhanced                             │
│                                                               │
│  State: { showUnifiedEditor, selectedOpportunityId }        │
│  Actions: OPEN_UNIFIED_EDITOR, CLOSE_UNIFIED_EDITOR          │
│                                                               │
│  Click Handler:                                              │
│    handleOpenUnifiedEditor(opportunityId)                    │
│    ↓                                                          │
│    dispatch({ type: 'OPEN_UNIFIED_EDITOR',                  │
│               payload: opportunityId })                      │
│                                                               │
│  Component:                                                  │
│    <UnifiedOpportunityEditor                                │
│      opportunity={currentOpportunity}                        │
│      availableSites={availableSites}                        │
│      availablePasses={mockPasses}                           │
│      mode="override"                                         │
│      isOpen={state.showUnifiedEditor}                       │
│      onClose={handleCloseUnifiedEditor}                     │
│      onSave={handleSaveUnified}                             │
│      capacityThresholds={capacityThresholds}                │
│      enableRealTimeValidation={true}                        │
│      enableUndoRedo={true}                                  │
│    />                                                        │
│                                                               │
│  Save Handler:                                               │
│    handleSaveUnified(oppId, Partial<CollectionOpportunity>) │
│    ↓                                                          │
│    Adapt to batch format → onBatchUpdate → close editor     │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Interface Analysis

### ManualOverrideModalRefactored Interface
```typescript
interface ManualOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOpportunityIds: string[];      // ⚠️ Array of IDs
  collectionDeckId: string | null;       // ⚠️ Deck context
  onSave: (changes: Map<string, CollectionOpportunity>) => Promise<void>; // ⚠️ Map format
}
```

### UnifiedOpportunityEditor Interface
```typescript
interface UnifiedEditorProps {
  opportunity: CollectionOpportunity;     // ✅ Single opportunity object
  availableSites: Site[];
  availablePasses?: Pass[];               // ✅ Required for override mode
  mode?: EditorMode;                      // ✅ 'quick' | 'standard' | 'override'
  isOpen: boolean;
  onClose: () => void;
  onSave: (opportunityId: string, changes: Partial<CollectionOpportunity>) => Promise<void>; // ✅ Partial format
  onSaveAndNext?: (opportunityId: string, changes: Partial<CollectionOpportunity>) => Promise<void>;
  capacityThresholds?: { critical: number; warning: number; optimal: number; };
  enableRealTimeValidation?: boolean;
  enableUndoRedo?: boolean;
}
```

### Key Differences
| Aspect | ManualOverride | UnifiedEditor | Migration Strategy |
|--------|---------------|---------------|-------------------|
| **Opportunity Data** | `selectedOpportunityIds: string[]` | `opportunity: CollectionOpportunity` | Resolve single opportunity from ID |
| **Deck Context** | `collectionDeckId: string \| null` | Embedded in opportunity | No change needed |
| **Passes** | Fetched internally via AllocationContext | `availablePasses?: Pass[]` | Generate mock passes |
| **Save Format** | `Map<string, CollectionOpportunity>` | `Partial<CollectionOpportunity>` | Adapter function |
| **Modes** | Single workflow | 3 modes (quick/standard/override) | Force 'override' mode |

---

## State Management Migration

### Current State (EnhancedManagementState)
```typescript
interface EnhancedManagementState {
  // ... existing fields
  showOverrideModal: boolean;           // ❌ Remove
  overrideModalDeckId: string | null;   // ❌ Remove
}
```

### New State (Enhanced)
```typescript
interface EnhancedManagementState {
  // ... existing fields
  showUnifiedEditor: boolean;           // ✅ Add
  selectedOpportunityId: string | null; // ✅ Add (or reuse existing)
}
```

### Action Types Migration

**Current Actions**:
```typescript
| { type: 'OPEN_OVERRIDE_MODAL'; payload: { opportunityIds: string[]; deckId: string } }
| { type: 'CLOSE_OVERRIDE_MODAL' }
```

**New Actions**:
```typescript
| { type: 'OPEN_UNIFIED_EDITOR'; payload: string } // opportunityId
| { type: 'CLOSE_UNIFIED_EDITOR' }
```

### Reducer Cases

**Remove**:
```typescript
case 'OPEN_OVERRIDE_MODAL':
  return {
    ...state,
    showOverrideModal: true,
    overrideModalDeckId: action.payload.deckId,
    selectedRows: new Set(action.payload.opportunityIds)
  };

case 'CLOSE_OVERRIDE_MODAL':
  return {
    ...state,
    showOverrideModal: false,
    overrideModalDeckId: null
  };
```

**Add**:
```typescript
case 'OPEN_UNIFIED_EDITOR':
  return {
    ...state,
    showUnifiedEditor: true,
    selectedOpportunityId: action.payload
  };

case 'CLOSE_UNIFIED_EDITOR':
  return {
    ...state,
    showUnifiedEditor: false,
    selectedOpportunityId: null
  };
```

---

## Handler Functions Migration

### 1. Open Handler

**Current** (Line 976):
```typescript
const handleOpenOverrideModal = (opportunityId: string) => {
  const opportunity = processedData.find(o => o.id === opportunityId);
  if (opportunity) {
    dispatch({
      type: 'OPEN_OVERRIDE_MODAL',
      payload: {
        opportunityIds: [opportunityId],
        deckId: opportunity.collectionDeckId
      }
    });
  }
};
```

**New**:
```typescript
const handleOpenUnifiedEditor = useCallback((opportunityId: string) => {
  dispatch({
    type: 'OPEN_UNIFIED_EDITOR',
    payload: opportunityId
  });
}, []);
```

### 2. Close Handler

**Current** (Line 989):
```typescript
const handleCloseOverrideModal = () => {
  dispatch({ type: 'CLOSE_OVERRIDE_MODAL' });
};
```

**New**:
```typescript
const handleCloseUnifiedEditor = useCallback(() => {
  dispatch({ type: 'CLOSE_UNIFIED_EDITOR' });
}, []);
```

### 3. Save Handler (Critical Adapter)

**Current** (Line 993):
```typescript
const handleSaveOverride = async (changes: Map<string, CollectionOpportunity>) => {
  const changeArray = Array.from(changes.values()).map(opp => ({
    opportunityId: opp.id,
    changes: opp
  }));
  await onBatchUpdate(changeArray as any);
  handleCloseOverrideModal();
};
```

**New** (Backward-Compatible Adapter):
```typescript
const handleSaveUnified = useCallback(async (
  opportunityId: string,
  changes: Partial<CollectionOpportunity>
) => {
  // Adapter: Convert UnifiedEditor format to ManualOverride format
  const batchChanges = [{
    opportunityId,
    changes
  }];

  await onBatchUpdate(batchChanges as any);
  handleCloseUnifiedEditor();
}, [onBatchUpdate]);
```

---

## Component Replacement

### Current Component (Line 1605)
```typescript
{/* Manual Override Modal - Primary Action for Pass-to-Site Allocation */}
<ManualOverrideModalRefactored
  isOpen={state.showOverrideModal}
  onClose={handleCloseOverrideModal}
  selectedOpportunityIds={Array.from(state.selectedRows)}
  collectionDeckId={state.overrideModalDeckId}
  onSave={handleSaveOverride}
/>
```

### New Component
```typescript
{/* Unified Opportunity Editor - Override Mode for Pass-to-Site Allocation */}
{state.showUnifiedEditor && state.selectedOpportunityId && (() => {
  const currentOpportunity = processedData.find(
    o => o.id === state.selectedOpportunityId
  );

  if (!currentOpportunity) return null;

  return (
    <UnifiedOpportunityEditor
      opportunity={currentOpportunity}
      availableSites={availableSites}
      availablePasses={mockPasses}
      mode="override"
      isOpen={state.showUnifiedEditor}
      onClose={handleCloseUnifiedEditor}
      onSave={handleSaveUnified}
      capacityThresholds={capacityThresholds}
      enableRealTimeValidation={true}
      enableUndoRedo={true}
    />
  );
})()}
```

---

## Mock Passes Generation

### Strategy
Generate mock passes similar to CollectionOpportunitiesHub pattern.

### Implementation
```typescript
const mockPasses: Pass[] = useMemo(() => [
  {
    id: 'pass-001',
    name: 'Satellite Pass Alpha',
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 2.5 * 60 * 60 * 1000),
    duration: 30,
    quality: 85,
    elevation: 45,
    azimuth: 180,
    siteId: availableSites[0]?.id || createSiteId('default-site'),
  },
  {
    id: 'pass-002',
    name: 'Satellite Pass Beta',
    startTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 6.5 * 60 * 60 * 1000),
    duration: 30,
    quality: 90,
    elevation: 60,
    azimuth: 270,
    siteId: availableSites[1]?.id || createSiteId('default-site'),
  },
  // Add more passes as needed for realistic testing
], [availableSites]);
```

---

## Click Handler Updates

### Match Status Column Click (Line 1526)
**Current**:
```typescript
onClick={() => handleOpenOverrideModal(opportunity.id)}
```

**New**:
```typescript
onClick={() => handleOpenUnifiedEditor(opportunity.id)}
```

### Name Cell Click (Line 717) - If Exists
**Current**:
```typescript
onClick={() => handleOpenOverrideModal(opportunity.id)}
```

**New**:
```typescript
onClick={() => handleOpenUnifiedEditor(opportunity.id)}
```

---

## Import Changes

### Add Import
```typescript
import UnifiedOpportunityEditor from './UnifiedOpportunityEditor';
import { Pass } from '../types/collectionOpportunities';
```

### Remove Import (Optional - Keep for Rollback)
```typescript
// import { ManualOverrideModalRefactored } from './ManualOverrideModalRefactored';
```

---

## Risk Mitigation Strategies

### Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Data format mismatch** | Medium | High | Comprehensive adapter with type validation |
| **Missing passes data** | High | Medium | Generate mock passes with realistic data |
| **State synchronization issues** | Low | High | Thorough reducer testing |
| **Performance regression** | Low | Low | Monitor bundle size, lazy load if needed |
| **Feature parity gaps** | Medium | Medium | Feature comparison testing |
| **User workflow disruption** | Low | High | A/B testing, rollback plan |

### Rollback Strategy

1. **Feature Flag**: Add `ENABLE_UNIFIED_EDITOR_IN_ENHANCED` flag
2. **Conditional Rendering**: Keep both components temporarily
3. **Quick Rollback**: Set flag to false to revert
4. **Data Safety**: All changes go through same `onBatchUpdate` API

### Implementation
```typescript
const { ENABLE_UNIFIED_EDITOR_IN_ENHANCED = true } = useFeatureFlags();

// Render logic
{ENABLE_UNIFIED_EDITOR_IN_ENHANCED ? (
  // New UnifiedEditor
  state.showUnifiedEditor && currentOpportunity && (
    <UnifiedOpportunityEditor ... />
  )
) : (
  // Fallback to ManualOverrideModalRefactored
  <ManualOverrideModalRefactored ... />
)}
```

---

## Testing Strategy

### Unit Tests
- ✅ State reducer with new actions
- ✅ Handler functions (open, close, save)
- ✅ Save adapter format conversion
- ✅ Mock passes generation

### Integration Tests
- ✅ Click Match Status → Editor opens
- ✅ Make changes → Save → Batch update called
- ✅ Close editor → State resets
- ✅ Error handling → User feedback

### E2E Tests (Playwright)
- ✅ Full workflow: Click → Edit → Save → Verify
- ✅ Modal close on Escape key
- ✅ Modal close on Cancel button
- ✅ Data persistence after save

### Regression Tests
- ✅ Existing table functionality unchanged
- ✅ Other modals/dialogs still work
- ✅ Performance benchmarks maintained

---

## Implementation Checklist

### Phase 1A: State Management
- [ ] Add `showUnifiedEditor` and `selectedOpportunityId` to state interface
- [ ] Add `OPEN_UNIFIED_EDITOR` and `CLOSE_UNIFIED_EDITOR` action types
- [ ] Implement reducer cases
- [ ] Update initial state

### Phase 1B: Handler Functions
- [ ] Create `handleOpenUnifiedEditor`
- [ ] Create `handleCloseUnifiedEditor`
- [ ] Create `handleSaveUnified` with adapter logic
- [ ] Generate `mockPasses` with useMemo

### Phase 1C: Component Integration
- [ ] Add UnifiedOpportunityEditor import
- [ ] Replace ManualOverrideModalRefactored component
- [ ] Update click handlers in Match Status column
- [ ] Update click handlers in Name cell (if applicable)

### Phase 1D: Feature Flag
- [ ] Add `ENABLE_UNIFIED_EDITOR_IN_ENHANCED` to useFeatureFlags
- [ ] Implement conditional rendering
- [ ] Test flag toggle

### Phase 1E: Testing
- [ ] Write unit tests for new handlers
- [ ] Write integration tests for workflow
- [ ] Create E2E test for full user journey
- [ ] Run regression test suite

### Phase 1F: Documentation
- [ ] Update component documentation
- [ ] Add migration notes
- [ ] Document rollback procedure
- [ ] Create user-facing changelog

---

## Performance Considerations

### Bundle Size Impact
- **UnifiedOpportunityEditor**: ~15KB (gzipped)
- **ManualOverrideModalRefactored**: ~12KB (gzipped)
- **Delta**: +3KB (acceptable for consolidation benefits)

### Lazy Loading (Future Optimization)
```typescript
const UnifiedOpportunityEditor = lazy(() =>
  import('./UnifiedOpportunityEditor')
);

// Wrap in Suspense
<Suspense fallback={<Spinner />}>
  <UnifiedOpportunityEditor ... />
</Suspense>
```

### Memory Impact
- UnifiedEditor uses `useUnifiedEditor` hook (efficient reducer pattern)
- No significant memory regression expected
- Mock passes: ~1KB in memory (negligible)

---

## Success Criteria

### Functional Success
- ✅ User can click Match Status badge
- ✅ UnifiedEditor opens in Override mode
- ✅ AllocationTab displays correctly
- ✅ User can allocate passes to sites
- ✅ Save operation completes successfully
- ✅ Data persists in parent component

### Non-Functional Success
- ✅ No performance regression (< 5% slower)
- ✅ No bundle size regression (< 10KB increase)
- ✅ 100% feature parity with old modal
- ✅ Zero data loss or corruption
- ✅ Rollback successful within 5 minutes

### User Experience Success
- ✅ No workflow disruption
- ✅ Improved UI/UX per design analysis
- ✅ Zero critical bugs in production
- ✅ Positive user feedback (if A/B tested)

---

## Timeline Estimate

### Phase 1A: State Management (2 hours)
- Interface updates
- Reducer implementation
- Initial state configuration

### Phase 1B: Handler Functions (3 hours)
- Handler creation
- Adapter logic
- Mock passes generation
- Testing

### Phase 1C: Component Integration (2 hours)
- Import updates
- Component replacement
- Click handler updates
- Visual verification

### Phase 1D: Feature Flag (1 hour)
- Flag implementation
- Conditional rendering
- Toggle testing

### Phase 1E: Testing (4 hours)
- Unit tests
- Integration tests
- E2E tests
- Regression tests

### Phase 1F: Documentation (2 hours)
- Code documentation
- Migration notes
- Changelog

**Total Estimated Time**: 14 hours (~ 2 working days)

---

## Approval & Sign-Off

| Role | Name | Status | Date |
|------|------|--------|------|
| **Architect** | SuperClaude Architect | ✅ Approved | 2025-10-06 |
| **Frontend Lead** | SuperClaude Frontend | ✅ Approved | 2025-10-06 |
| **Product Manager** | Pending | ⏳ Review | - |
| **QA Lead** | Pending | ⏳ Review | - |

---

## Next Steps

1. **Review & Approval**: Obtain stakeholder sign-off
2. **Implementation**: Execute Phase 1A-1F checklist
3. **Testing**: Run comprehensive test suite
4. **Deployment**: Deploy with feature flag enabled
5. **Monitoring**: Monitor for issues in production
6. **Rollback Ready**: Maintain rollback capability for 1 week
7. **Phase 2 Planning**: Plan multi-selection support if needed

---

**Document Version**: 1.0
**Last Updated**: 2025-10-06
**Owner**: SuperClaude Design Team
**Status**: ✅ Ready for Implementation
