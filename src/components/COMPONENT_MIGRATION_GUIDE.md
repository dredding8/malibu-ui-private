# Component Migration Guide - Wave 2

**Target**: Consolidate 29 Collection component variants → Unified compound component system
**Status**: In Progress
**Risk Level**: Medium (Breaking changes with mitigation)

---

## 📋 Migration Strategy

### Phase 2.1: Establish New System (✅ Complete)
- [x] Compound component system exists at `components/Collection/`
- [x] All sub-components implemented
- [x] Provider pattern established
- [x] TypeScript types defined

### Phase 2.2: Create Migration Adapters (Current)
- [ ] Legacy prop adapter for backward compatibility
- [ ] Route-based component mapper
- [ ] Feature flag integration for gradual rollout

### Phase 2.3: Migrate Consumers
- [ ] Update pages to use new Collection component
- [ ] Replace legacy imports
- [ ] Test coverage validation

### Phase 2.4: Deprecate Legacy
- [ ] Mark legacy components as deprecated
- [ ] Remove after validation period
- [ ] Clean up unused files

---

## 🔄 Component Mapping

### Legacy → New System

| Legacy Component | New System | Migration Status |
|------------------|------------|------------------|
| `CollectionOpportunities.tsx` | `<Collection />` + default composition | 🟡 Adapter needed |
| `CollectionOpportunitiesEnhanced.tsx` | `<Collection enableFiltering enableSelection />` | 🟡 Adapter needed |
| `CollectionOpportunitiesBento.tsx` | `<Collection layout="bento" />` | 🟡 Adapter needed |
| `CollectionOpportunitiesRefactoredBento.tsx` | `<Collection layout="bento" />` | 🔴 Duplicate - Remove |
| `CollectionOpportunitiesEnhancedBento.tsx` | `<Collection layout="bento" />` | 🔴 Duplicate - Remove |
| `CollectionOpportunitiesSplitView.tsx` | `<Collection layout="split" />` | 🟡 Adapter needed |
| `CollectionOpportunitiesAccessible.tsx` | `<Collection />` (built-in a11y) | 🟢 Direct replace |
| `CollectionOpportunitiesHubAccessible.tsx` | `<Collection />` (built-in a11y) | 🟢 Direct replace |
| `CollectionOpportunitiesRefactored.tsx` | `<Collection />` | 🔴 Duplicate - Remove |
| `CollectionOpportunitiesUXImprovements.tsx` | `<Collection />` | 🔴 Duplicate - Remove |
| `CollectionOpportunitiesTable.tsx` | `<Collection.List />` | 🟡 Adapter needed |
| `CollectionDetailPanel.tsx` | `<Collection.Item detailed />` | 🟡 Keep separate (detailed view) |
| `CollectionDecksTable.tsx` | `<Collection.List type="deck" />` | 🟡 Keep separate (specific use) |
| `CollectionManagementMockup.tsx` | `<Collection />` | 🔴 Mockup - Remove |
| `CollectionOpportunitiesRedirect.tsx` | Keep (routing logic) | 🟢 Keep as-is |
| `CollectionOpportunitiesWithJTBD.tsx` | `<Collection />` + JTBD hooks | 🟡 Adapter needed |

### Component Count Reduction
- **Before**: 29 Collection-related files
- **After**: 15 files (Collection system + specialized components)
- **Reduction**: -48% (14 files removed/consolidated)

---

## 🛠️ Migration Adapter Implementation

### Adapter Pattern
```typescript
// components/Collection/adapters/LegacyCollectionOpportunitiesAdapter.tsx
import React from 'react';
import { Collection } from '../index';
import { CollectionOpportunityProps } from '../../types/legacy';

/**
 * Adapter for legacy CollectionOpportunities component
 * Provides backward compatibility during migration
 *
 * @deprecated Use <Collection /> directly
 */
export const LegacyCollectionOpportunitiesAdapter: React.FC<CollectionOpportunityProps> = ({
  opportunities,
  onEdit,
  onDelete,
  onReallocate,
  enableQuickEdit = false,
  enableBulkOperations = false,
  viewMode = 'table',
  ...rest
}) => {
  // Map legacy props to new system
  const collections = opportunities; // Transform if needed
  const enableSelection = enableBulkOperations;
  const viewConfig = {
    mode: viewMode === 'table' ? 'list' : viewMode,
  };

  return (
    <Collection
      collections={collections}
      enableSelection={enableSelection}
      enableFiltering={true}
      viewConfig={viewConfig}
      {...rest}
    >
      <Collection.Header />
      <Collection.Toolbar />
      <Collection.Grid />
      <Collection.Footer />
    </Collection>
  );
};
```

### Layout Adapter
```typescript
// components/Collection/adapters/LayoutAdapter.tsx
import React from 'react';
import { Collection } from '../index';

interface LayoutAdapterProps {
  variant: 'bento' | 'split' | 'standard' | 'enhanced';
  collections: any[];
  [key: string]: any;
}

/**
 * Adapter for layout-specific legacy components
 * Maps layout variants to new unified system
 */
export const LayoutAdapter: React.FC<LayoutAdapterProps> = ({
  variant,
  collections,
  ...props
}) => {
  const layoutMap = {
    bento: 'bento',
    split: 'split',
    standard: 'list',
    enhanced: 'grid',
  };

  return (
    <Collection
      collections={collections}
      viewConfig={{ mode: layoutMap[variant] }}
      {...props}
    />
  );
};
```

---

## 📝 Migration Checklist

### For Each Legacy Component Replacement

#### Step 1: Identify Usage
```bash
# Find all imports of legacy component
grep -r "import.*CollectionOpportunities" src/
```

#### Step 2: Create Adapter (if needed)
- [ ] Implement prop mapping
- [ ] Handle edge cases
- [ ] Add deprecation warning
- [ ] Write adapter tests

#### Step 3: Update Consumers
- [ ] Replace import statements
- [ ] Update props to new API
- [ ] Test functionality
- [ ] Verify no regressions

#### Step 4: Feature Flag Rollout
```typescript
// Gradual migration with feature flag
const useNewSystem = useFeatureFlag('ENABLE_NEW_COLLECTION_SYSTEM');

return useNewSystem
  ? <Collection collections={data} />
  : <LegacyCollectionOpportunities data={data} />;
```

#### Step 5: Validation
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Visual regression tests pass
- [ ] Performance benchmarks met

#### Step 6: Deprecation
- [ ] Add @deprecated JSDoc comment
- [ ] Console.warn in component
- [ ] Update documentation
- [ ] Set removal date

#### Step 7: Removal
- [ ] Delete legacy component
- [ ] Remove from exports
- [ ] Clean up tests
- [ ] Update documentation

---

## 🎯 Priority Migration Order

### Phase 1: High Traffic Pages (Week 1-2)
1. **CollectionOpportunitiesHub** - Most complex, highest traffic
2. **History Page** - Collection list view
3. **Dashboard** - Overview widgets

### Phase 2: Medium Traffic (Week 3-4)
4. **Analytics Page** - Data visualization
5. **Search Results** - Collection filtering
6. **User Preferences** - Settings

### Phase 3: Low Traffic (Week 5-6)
7. **Admin Pages** - Management interface
8. **Reports** - Export/import views
9. **Legacy Routes** - Deprecated pages

---

## 🚨 Breaking Changes & Mitigation

### Breaking Change 1: Prop API
**Change**: Different prop names and structure
**Impact**: Medium
**Mitigation**: Adapter layer maintains compatibility

### Breaking Change 2: Layout Configuration
**Change**: Unified layout prop vs separate components
**Impact**: Low
**Mitigation**: Auto-detect layout from old component type

### Breaking Change 3: Event Handlers
**Change**: Standardized callback signatures
**Impact**: Medium
**Mitigation**: Event wrapper in adapter

### Breaking Change 4: Styling
**Change**: New CSS classes and structure
**Impact**: Low
**Mitigation**: CSS compatibility layer during transition

---

## ✅ Success Criteria

### Quantitative
- [ ] Component count: 29 → 15 (-48%)
- [ ] Zero production errors during migration
- [ ] Test coverage maintained >80%
- [ ] Performance maintained or improved
- [ ] Bundle size reduced by 15%+

### Qualitative
- [ ] Single component system for all use cases
- [ ] Consistent API across pages
- [ ] Improved developer experience
- [ ] Clear documentation
- [ ] Positive team feedback

---

## 📊 Progress Tracking

### Week 1-2: Setup & High Priority
- [x] Baseline established
- [ ] Adapters created
- [ ] CollectionOpportunitiesHub migrated
- [ ] History page migrated
- [ ] Dashboard widgets migrated

### Week 3-4: Medium Priority
- [ ] Analytics page migrated
- [ ] Search results migrated
- [ ] Settings pages migrated
- [ ] Integration tests updated

### Week 5-6: Low Priority & Cleanup
- [ ] Admin pages migrated
- [ ] Reports migrated
- [ ] Legacy components deprecated
- [ ] Documentation updated
- [ ] Team training completed

**Current Progress**: 5% (Baseline + Planning)
**Target Completion**: Week 6
