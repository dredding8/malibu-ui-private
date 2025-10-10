# SCC Numeric Changes - Integration Plan

**Date**: 2025-10-07
**Components**: Type System, Formatting Utilities, UI Components
**Risk Level**: Medium (Type changes across multiple components)

---

## Changes Summary

### 1. Type System Changes
- **File**: `src/types/collectionOpportunities.ts:20`
- **Change**: `SccNumber` from `Branded<string>` → `Branded<number>`
- **Impact**: All components using `sccNumber` field

### 2. New Utility Module
- **File**: `src/utils/sccFormatting.ts` (NEW)
- **Exports**: `formatSccNumber`, `parseSccNumber`, `isValidSccNumber`, `formatSccWithPrefix`
- **Purpose**: Centralized SCC formatting logic

### 3. Component Updates (6 files)
1. `src/components/UnifiedEditor/OpportunityInfoHeader.tsx`
2. `src/components/UnifiedEditor/OpportunityInfoHeaderEnhanced.tsx`
3. `src/components/CollectionOpportunitiesRefactoredBento.tsx`
4. `src/components/CollectionOpportunitiesEnhanced.tsx`
5. `src/components/CollectionOpportunitiesAccessible.tsx`
6. `src/components/review/UnifiedMatchReview.tsx`

### 4. Mock Data Updates
- **File**: `src/tests/mocks/opportunities.ts`
- **Change**: String SCC values → Numeric values

### 5. Capacity Display Refactor (AllocationTab)
- **Files**:
  - `src/components/UnifiedEditor/OverrideTabs/AllocationTab.tsx`
  - `src/components/UnifiedEditor/OverrideTabs/AllocationTab.css`
- **Change**: Removed ProgressBar → Text-based capacity display

---

## Integration Phases

### ✅ Phase 1: Type System Validation (COMPLETE)
- [x] Verify type definition change compiles
- [x] Check for breaking changes in dependent code
- [x] Build passes without type errors

### ⏳ Phase 2: Formatting Utilities Testing
- [ ] Create unit tests for `sccFormatting.ts`
- [ ] Test edge cases (null, undefined, out-of-range)
- [ ] Verify zero-padding logic

### ⏳ Phase 3: Component Integration - Critical Path
**Order**: Low-risk → High-risk

1. **OpportunityInfoHeader** (Low risk)
   - Limited usage scope
   - Clear input/output
   - Easy rollback

2. **OpportunityInfoHeaderEnhanced** (Low risk)
   - Similar to above
   - Isolated component

3. **UnifiedMatchReview** (Medium risk)
   - Type definition only
   - Interface change

4. **CollectionOpportunitiesAccessible** (Medium risk)
   - Search filter change
   - Numeric string conversion

5. **CollectionOpportunitiesEnhanced** (High risk)
   - Core table component
   - High usage frequency
   - Performance sensitive

6. **CollectionOpportunitiesRefactoredBento** (High risk)
   - Main collection view
   - Critical user path

### ⏳ Phase 4: Build & Type Check
- [ ] Run `npx tsc --noEmit` for type validation
- [ ] Run `npm run build` for production build
- [ ] Check bundle size impact
- [ ] Verify no console errors

### ⏳ Phase 5: Runtime Testing
- [ ] Manual smoke test: View collection opportunities
- [ ] Manual smoke test: Open UnifiedEditor
- [ ] Manual smoke test: Search by SCC number
- [ ] Automated test: Run Playwright validation

### ⏳ Phase 6: Rollback Preparation
- [ ] Document rollback steps
- [ ] Create git branch for safe integration
- [ ] Tag pre-integration state

---

## Risk Assessment

### High Risk Areas
1. **Type Breaking Changes**: Components expecting `string` will break
2. **Search Functionality**: Numeric filtering must work correctly
3. **Mock Data**: Test data mismatch could break tests

### Mitigation Strategies
1. **Gradual Integration**: One component at a time
2. **Type Casting**: Use `as any` temporarily for mock data
3. **Comprehensive Testing**: Validate each phase before proceeding
4. **Quick Rollback**: Git branch allows instant revert

---

## Validation Criteria

### Build Validation
- ✅ TypeScript compilation: No errors
- ✅ Production build: Successful
- ✅ Bundle size: No significant increase

### Functional Validation
- [ ] SCC displays with zero-padding (00123)
- [ ] Search works with numeric values
- [ ] UnifiedEditor header shows SCC correctly
- [ ] Collection tables display SCC properly
- [ ] No console errors in browser

### Performance Validation
- [ ] Table rendering: No regression
- [ ] Formatting utility: < 1ms per call
- [ ] Memory usage: No leaks

---

## Rollback Plan

### Immediate Rollback (< 5 minutes)
```bash
git stash
# Or if committed:
git reset --hard <previous-commit-hash>
```

### Selective Rollback
1. Revert type definition: `collectionOpportunities.ts`
2. Remove formatting utility: `sccFormatting.ts`
3. Revert component changes one by one
4. Restore mock data

---

## Success Metrics

- ✅ All builds pass
- ✅ No TypeScript errors
- ✅ All Playwright tests pass
- ✅ Manual validation successful
- ✅ No performance regression
- ✅ SCC displays correctly in all views

---

## Next Steps

1. **Immediate**: Run Phase 2 (Unit tests for formatting utilities)
2. **After Phase 2**: Begin Phase 3 (Component integration)
3. **After Phase 3**: Phase 4 (Build validation)
4. **After Phase 4**: Phase 5 (Runtime testing)
5. **After Phase 5**: Phase 6 (Documentation)

---

## Notes

- **Type casting with `as any`**: Temporary workaround for mock data until full integration
- **Zero-padding**: Industry standard for SCC display
- **Capacity display refactor**: Separate from SCC changes, but integrated in same cycle
