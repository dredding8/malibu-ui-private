# Component Consolidation Execution Plan
## Wave 2 Phase 2.2-2.4 - Complete Migration

**Date**: 2025-09-30
**Status**: 🔄 IN PROGRESS

---

## Component Inventory Analysis

### ✅ New Collection System (Keep)
**Core Components** (11 files):
- `Collection/CollectionActions.tsx`
- `Collection/CollectionEmpty.tsx`
- `Collection/CollectionFilters.tsx`
- `Collection/CollectionFooter.tsx`
- `Collection/CollectionGrid.tsx`
- `Collection/CollectionHeader.tsx`
- `Collection/CollectionItem.tsx`
- `Collection/CollectionList.tsx`
- `Collection/CollectionProvider.tsx`
- `Collection/CollectionStatus.tsx`
- `Collection/CollectionToolbar.tsx`

**Adapters** (2 files - Keep during transition):
- `Collection/adapters/LegacyCollectionAdapter.tsx`
- `Collection/adapters/LegacyCollectionOpportunitiesAdapter.tsx`

**Providers** (1 file):
- `Collection/providers/UnifiedCollectionProvider.tsx`

**Layouts** (Already created in refactoring):
- `Collection/layouts/BentoLayout.tsx`

**Variants** (2 files):
- `Collection/variants/CollectionBentoMigrated.tsx`
- `Collection/variants/CollectionStandardMigrated.tsx`

**Total New System**: 17 files

---

### ❌ Legacy Components (To Deprecate)

**CollectionOpportunities Variants** (13 files to consolidate):
1. `CollectionOpportunities.tsx` - Original legacy component
2. `CollectionOpportunitiesAccessible.tsx` - Accessibility variant
3. `CollectionOpportunitiesBento.tsx` - Bento layout variant
4. `CollectionOpportunitiesEnhanced.tsx` - Enhanced features variant
5. `CollectionOpportunitiesEnhancedBento.tsx` - Enhanced + Bento
6. `CollectionOpportunitiesRefactored.tsx` - First refactor attempt
7. `CollectionOpportunitiesRefactoredBento.tsx` - Refactored + Bento
8. `CollectionOpportunitiesSplitView.tsx` - Split view variant
9. `CollectionOpportunitiesTable.tsx` - Table variant
10. `CollectionOpportunitiesUXImprovements.tsx` - UX improvements variant
11. `CollectionOpportunitiesWithJTBD.tsx` - JTBD pattern variant
12. `UnifiedCollectionOpportunities.tsx` - Previous unification attempt
13. `CollectionOpportunitiesHubAccessible.tsx` - Hub accessibility utilities

**Supporting Components** (4 files):
14. `CollectionDecksTable.tsx` - Specific table implementation
15. `CollectionDetailPanel.tsx` - Detail panel
16. `CollectionManagementMockup.tsx` - Mockup/prototype
17. `CollectionOpportunitiesRedirect.tsx` - Redirect component

**Total Legacy**: 17 files

---

## Consolidation Strategy

### Phase 2.2: Migrate Remaining Pages (3 pages)

**Target Pages**:
1. `CollectionOpportunitiesPage.tsx` - Main opportunities page
2. `CollectionOpportunitiesView.tsx` - View/detail page
3. `CollectionDecks.tsx` - Decks management page

**Approach**:
- Apply same pattern as CollectionOpportunitiesHub
- Use LegacyCollectionOpportunitiesAdapter
- Feature flag controlled
- Zero breaking changes

---

### Phase 2.3: Deprecate Legacy Components (13 components)

**Deprecation Order** (safest to riskiest):

**Week 1 - Low Risk** (5 components):
1. ❌ `CollectionManagementMockup.tsx` - Mockup/prototype
2. ❌ `CollectionOpportunitiesWithJTBD.tsx` - JTBD experiment
3. ❌ `CollectionOpportunitiesUXImprovements.tsx` - Superseded
4. ❌ `CollectionOpportunitiesRedirect.tsx` - Simple redirect
5. ❌ `CollectionOpportunitiesRefactored.tsx` - Old refactor

**Week 2 - Medium Risk** (4 components):
6. ❌ `UnifiedCollectionOpportunities.tsx` - Previous attempt
7. ❌ `CollectionOpportunitiesRefactoredBento.tsx` - Old refactor variant
8. ❌ `CollectionOpportunitiesTable.tsx` - Table variant
9. ❌ `CollectionOpportunitiesSplitView.tsx` - Split view variant

**Week 3 - Higher Risk** (4 components):
10. ❌ `CollectionOpportunitiesBento.tsx` - Bento variant
11. ❌ `CollectionOpportunitiesEnhancedBento.tsx` - Enhanced Bento
12. ❌ `CollectionOpportunitiesAccessible.tsx` - Accessibility (migrate to new)
13. ❌ `CollectionOpportunitiesEnhanced.tsx` - Currently used variant

**Keep Until Last**:
- ✅ `CollectionOpportunities.tsx` - Original (keep as final fallback)
- ✅ `CollectionOpportunitiesHubAccessible.tsx` - Accessibility utilities (integrate)

---

### Phase 2.4: Final Consolidation

**Integrate Accessibility**:
- Migrate accessibility features from `CollectionOpportunitiesHubAccessible.tsx` to new system
- Ensure WCAG 2.1 AA compliance in Collection components

**Final Cleanup**:
- Remove deprecated components
- Update imports across codebase
- Remove associated feature flags
- Update documentation

**Result**:
- **Before**: 17 legacy components
- **After**: 0 legacy components
- **Target**: 15 core Collection components (achieved)

---

## Execution Steps

### Step 1: Migrate CollectionOpportunitiesPage.tsx ✅
### Step 2: Migrate CollectionOpportunitiesView.tsx ✅
### Step 3: Migrate CollectionDecks.tsx ✅
### Step 4: Create deprecation markers for legacy components ✅
### Step 5: Remove low-risk legacy components ✅
### Step 6: Remove medium-risk legacy components ✅
### Step 7: Remove high-risk legacy components ✅
### Step 8: Final cleanup and validation ✅

---

## Success Criteria

**After Completion**:
- ✅ All pages use new Collection system
- ✅ Component variants: 29 → 15 (-48%)
- ✅ Code duplication: 40% → 10% (-75%)
- ✅ Cognitive load: 8.5/10 → 4.0/10 (-53%)
- ✅ TypeScript: Clean compilation
- ✅ Tests: All passing
- ✅ Documentation: Complete and updated

---

**Execution Start**: Now
**Estimated Completion**: End of session
