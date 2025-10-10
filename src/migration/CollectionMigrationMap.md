# Collection Opportunities Migration Map

## Wave 3, Phase 2: Component Migration Analysis

**Date**: 2025-09-30
**Status**: Discovery Phase Complete
**Target**: Migrate 24 CollectionOpportunities variants to compound component architecture

---

## Executive Summary

### Discovery Results
- **24 Total Variants** identified across the codebase
- **Core Patterns**: Table-based, Split-view, Bento layouts, Enhanced features
- **Migration Priority**: High-usage variants first, specializations second
- **Compound Architecture**: Fully available from Wave 3 Phase 1

### Migration Strategy
1. **Adapter Layer**: Create compatibility adapters for each variant type
2. **Feature Flags**: Progressive rollout with A/B testing capability
3. **Performance Parity**: Ensure new components match or exceed legacy performance
4. **Zero Downtime**: Maintain backward compatibility during transition

---

## Variant Inventory & Analysis

### 1. Core Legacy Components (High Priority)

#### `CollectionOpportunities.tsx` - Base Component
- **Props**: `opportunities[], selectedIds[], onSelectionChange, onEdit, onOverride`
- **Features**: Blueprint Table, basic filtering, manual overrides
- **Usage**: Foundation for most other variants
- **Migration Target**: `Collection.Standard` with `Collection.Grid`
- **Priority**: 1 (Foundation component)

#### `CollectionOpportunitiesTable.tsx` - Table Variant
- **Props**: `opportunities[], columns[], sortConfig, filterConfig`
- **Features**: Advanced table features, column management
- **Usage**: Data-heavy interfaces
- **Migration Target**: `Collection.Grid` with enhanced table features
- **Priority**: 2 (High usage)

#### `CollectionOpportunitiesEnhanced.tsx` - Enhanced Features
- **Props**: `+ healthScoring, bulkOperations, realTimeUpdates`
- **Features**: Health indicators, bulk ops, real-time sync
- **Usage**: Advanced management interfaces
- **Migration Target**: `Collection.Management` with additional providers
- **Priority**: 3 (High value features)

#### `CollectionOpportunitiesRefactored.tsx` - Performance Optimized
- **Props**: `+ virtualizedTable, memoizedHealthScores, debouncedSearch`
- **Features**: Performance optimizations, virtualization
- **Usage**: Large dataset handling
- **Migration Target**: `Collection.Grid` with performance enhancements
- **Priority**: 4 (Performance critical)

### 2. Layout Variants (Medium Priority)

#### `CollectionOpportunitiesBento.tsx` - Split View
- **Props**: `+ splitViewConfig, panelRatio, persistentPanels`
- **Features**: 62/38 split layout, contextual right panel
- **Usage**: Allocation management workflows
- **Migration Target**: Custom `Collection` composition with split layout
- **Priority**: 5 (Layout specialization)

#### `CollectionOpportunitiesRefactoredBento.tsx` - Enhanced Split View
- **Props**: `+ Bento features + Refactored performance`
- **Features**: Combines split view with performance optimizations
- **Usage**: High-performance allocation management
- **Migration Target**: Enhanced `Collection` with split layout + perf
- **Priority**: 6 (Advanced layout)

#### `CollectionOpportunitiesEnhancedBento.tsx` - Full Featured Split
- **Props**: `+ All enhanced features + Bento layout`
- **Features**: All features combined with split view
- **Usage**: Enterprise-level management interface
- **Migration Target**: `Collection.Management` with split layout
- **Priority**: 7 (Premium experience)

#### `CollectionOpportunitiesSplitView.tsx` - Modal Alternative
- **Props**: `+ modalReplacement, sidePanel, contextualActions`
- **Features**: Split view as modal replacement
- **Usage**: Detail management workflows
- **Migration Target**: `Collection` with modal integration
- **Priority**: 8 (UX improvement)

### 3. Specialized Variants (Medium Priority)

#### `CollectionOpportunitiesAccessible.tsx` - A11y Enhanced
- **Props**: `+ a11yEnhancements, screenReaderSupport, keyboardNav`
- **Features**: WCAG compliance, accessibility features
- **Usage**: Accessibility-required environments
- **Migration Target**: `Collection.Standard` with a11y providers
- **Priority**: 9 (Compliance requirement)

#### `CollectionOpportunitiesWithJTBD.tsx` - JTBD Integration
- **Props**: `+ jtbdMetrics, jobStoryTracking, analyticsIntegration`
- **Features**: Jobs-to-be-Done analytics integration
- **Usage**: Analytics and measurement workflows
- **Migration Target**: `Collection` with JTBD analytics provider
- **Priority**: 10 (Analytics specialization)

#### `CollectionOpportunitiesHubAccessible.tsx` - Hub + A11y
- **Props**: `+ Hub features + Accessibility enhancements`
- **Features**: Hub layout with accessibility
- **Usage**: Accessible hub interfaces
- **Migration Target**: `Collection.Management` with a11y + hub layout
- **Priority**: 11 (Specialized combination)

#### `CollectionOpportunitiesPerformance.tsx` - Performance Utilities
- **Props**: Performance monitoring and optimization utilities
- **Features**: Performance measurement, optimization hooks
- **Usage**: Performance-critical implementations
- **Migration Target**: Performance utilities for compound components
- **Priority**: 12 (Utility component)

### 4. Infrastructure Variants (Low Priority)

#### `UnifiedCollectionOpportunities.tsx` - Router
- **Props**: `+ routingLogic, conditionalLoading, variantSelection`
- **Features**: Routes between different variants
- **Usage**: Legacy routing system
- **Migration Target**: New routing with compound components
- **Priority**: 13 (Infrastructure)

#### `CollectionOpportunitiesLoader.tsx` - Loading States
- **Props**: `+ loadingStates, errorHandling, retryLogic`
- **Features**: Loading and error state management
- **Usage**: Data loading workflows
- **Migration Target**: `Collection` built-in loading states
- **Priority**: 14 (Infrastructure)

#### `CollectionOpportunitiesRedirect.tsx` - Navigation
- **Props**: `+ redirectLogic, urlHandling`
- **Features**: URL-based redirection
- **Usage**: Navigation management
- **Migration Target**: Router-level handling
- **Priority**: 15 (Infrastructure)

### 5. Test & Development Variants (Low Priority)

#### `CollectionOpportunitiesUXImprovements.tsx` - UX Utilities
- **Props**: UX enhancement utilities and components
- **Features**: Toast notifications, progress indicators
- **Usage**: UX enhancement library
- **Migration Target**: Utility providers for compound components
- **Priority**: 16 (Utility component)

### 6. Page-Level Variants (Low Priority)

#### Page Components (7 variants)
- `CollectionOpportunitiesPage.tsx`
- `CollectionOpportunitiesView.tsx` 
- `CollectionOpportunitiesHub.tsx`
- Plus 4 other page-level components

**Migration Strategy**: Replace with new compound component compositions at page level

---

## Migration Mapping Schema

### Props Translation Matrix

| Legacy Prop | Compound Equivalent | Transformation |
|-------------|-------------------|----------------|
| `opportunities[]` | `collections[]` | Direct mapping with type adaptation |
| `selectedIds[]` | `selectedCollections[]` | ID array → Collection object array |
| `onSelectionChange` | `selectCollection()` | Event handler → context action |
| `onEdit` | `editCollection()` | Event handler → context action |
| `onOverride` | `updateCollection()` | Event handler → context action |
| `filterConfig` | `Collection.Filters` | Prop → Component composition |
| `sortConfig` | `Collection.Grid` props | Prop → Component props |
| `healthScoring` | Health provider | Prop → Context provider |
| `bulkOperations` | `enableBulkOperations` | Feature flag |
| `splitViewConfig` | Layout composition | Prop → Component structure |

### Feature Mapping Matrix

| Legacy Feature | Compound Implementation | Provider/Component |
|----------------|------------------------|-------------------|
| Table Display | `Collection.Grid` | Built-in |
| List Display | `Collection.List` | Built-in |
| Item Rendering | `Collection.Item` | Built-in |
| Filtering | `Collection.Filters` | Built-in |
| Sorting | `Collection.Grid` props | Built-in |
| Selection | `enableSelection` | Context state |
| Bulk Operations | `Collection.Actions` | Component + Context |
| Health Scoring | Health Provider | Custom provider |
| Real-time Updates | `enableRealtime` | Context feature |
| Split View | Layout composition | Custom composition |
| Accessibility | A11y Provider | Custom provider |
| Performance | Performance hooks | Custom hooks |
| JTBD Analytics | Analytics Provider | Custom provider |

---

## Migration Implementation Plan

### Phase 1: Foundation (Week 3)
1. **Adapter Layer Creation**
   - `LegacyCollectionAdapter.tsx` - Main adapter component
   - `PropMapper.ts` - Props translation utilities
   - `StateAdapter.ts` - State synchronization
   - `EventTranslator.ts` - Event handling compatibility

2. **Feature Flag Setup**
   - Individual flags for each variant
   - A/B testing infrastructure
   - Migration progress tracking

3. **Core Component Migrations** (Priority 1-4)
   - `CollectionOpportunities` → `Collection.Standard`
   - `CollectionOpportunitiesTable` → `Collection.Grid`
   - `CollectionOpportunitiesEnhanced` → `Collection.Management`
   - `CollectionOpportunitiesRefactored` → `Collection.Grid` + Performance

### Phase 2: Layout Variants (Week 4)
1. **Split View Migrations** (Priority 5-8)
   - Create split layout compositions
   - Migrate Bento variants
   - Implement modal replacement logic

2. **A/B Testing Implementation**
   - Side-by-side rendering tests
   - Performance comparison metrics
   - User experience validation

### Phase 3: Specialized Variants (Week 5)
1. **Specialized Features** (Priority 9-12)
   - Accessibility enhancements
   - JTBD analytics integration
   - Performance utilities migration

2. **Infrastructure & Cleanup** (Priority 13-16)
   - Routing updates
   - Infrastructure component migration
   - Legacy code removal

---

## Quality Gates & Success Metrics

### Performance Benchmarks
- **Rendering Time**: ≤ Legacy performance + 10%
- **Memory Usage**: ≤ Legacy memory + 5%
- **Bundle Size**: ≤ Current size (with tree shaking)
- **Time to Interactive**: ≤ Legacy TTI

### Functional Validation
- **Feature Parity**: 100% feature equivalence
- **A11y Compliance**: WCAG 2.1 AA maintained
- **Browser Support**: Same browser matrix
- **API Compatibility**: Zero breaking changes

### Migration Success KPIs
- **Zero Downtime**: No user-facing disruptions
- **Rollback Rate**: < 5% of migrations
- **Performance Improvement**: > 15% average improvement
- **Code Reduction**: > 30% less duplication

---

## Risk Mitigation

### High-Risk Areas
1. **Complex State Management**: Refactored components have complex state
2. **Performance Requirements**: Large dataset handling in some variants
3. **Integration Dependencies**: JTBD and analytics integrations
4. **Accessibility Compliance**: Must maintain existing a11y features

### Mitigation Strategies
1. **Gradual Rollout**: Feature flags for each variant
2. **Automated Testing**: Comprehensive integration test suite
3. **Performance Monitoring**: Real-time performance tracking
4. **Rollback Capability**: Instant rollback for any issues

---

## Next Steps

1. ✅ **Discovery Complete**: All 24 variants identified and analyzed
2. 🚧 **Adapter Layer**: Create compatibility layer (Current)
3. ⏳ **Core Migrations**: Migrate high-priority variants
4. ⏳ **Layout Migrations**: Implement specialized layouts
5. ⏳ **Specialized Features**: Migrate specialized variants
6. ⏳ **Testing & Validation**: Comprehensive testing suite
7. ⏳ **Production Rollout**: Progressive deployment

**Ready to proceed with adapter layer implementation.**