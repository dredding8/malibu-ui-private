# Technical Debt Prioritization - JIRA Epics

## Epic 1: Component Consolidation & Architecture
**Priority**: P0 (Critical)
**Effort**: 13 Story Points
**Duration**: 2 Sprints
**ROI**: High (60% code reduction, 80% maintenance improvement)

### Stories:
1. **COLL-1001: Consolidate 4 Bento Variants**
   - Points: 5
   - Acceptance Criteria:
     - Single CollectionOpportunitiesTable component
     - Feature flags for variant behavior
     - 100% backward compatibility
     - Performance benchmarks maintained

2. **COLL-1002: Create Unified Component Architecture**
   - Points: 8
   - Acceptance Criteria:
     - Component hierarchy documented
     - Shared utilities extracted
     - Error boundaries at each level
     - Lazy loading implemented

### Technical Approach:
```typescript
// Target architecture
components/
  CollectionOpportunities/
    index.tsx              // Main export with feature flags
    Table/
      VirtualizedTable.tsx // Performance variant
      StandardTable.tsx    // Legacy variant
      TableCore.tsx       // Shared logic
    Health/
      HealthIndicator.tsx
      HealthCalculator.ts
    Performance/
      useMemoization.ts
      useDebounce.ts
    types.ts
    constants.ts
```

---

## Epic 2: AllocationContext Refactoring
**Priority**: P0 (Critical)
**Effort**: 8 Story Points
**Duration**: 1 Sprint
**ROI**: High (Better testability, 50% faster context updates)

### Stories:
1. **COLL-2001: Split AllocationContext into Domain Contexts**
   - Points: 5
   - Acceptance Criteria:
     - AllocationDataContext (state management)
     - AllocationUIContext (UI state)
     - AllocationAPIContext (API operations)
     - Migration guide for consumers

2. **COLL-2002: Implement Context Optimization**
   - Points: 3
   - Acceptance Criteria:
     - Memoized selectors
     - Granular subscriptions
     - Performance monitoring
     - <50ms update propagation

### Implementation Plan:
```typescript
// Before: 665 lines monolith
// After: 3 focused contexts

// AllocationDataContext (150 lines)
export const AllocationDataContext = createContext<{
  allocations: Allocation[];
  updateAllocation: (id: string, data: Partial<Allocation>) => void;
}>({});

// AllocationUIContext (100 lines)
export const AllocationUIContext = createContext<{
  selectedIds: Set<string>;
  sortConfig: SortConfig;
  filterConfig: FilterConfig;
}>({});

// AllocationAPIContext (80 lines)
export const AllocationAPIContext = createContext<{
  saveAllocations: (changes: AllocationChange[]) => Promise<void>;
  refreshData: () => Promise<void>;
}>({});
```

---

## Epic 3: TypeScript Type Safety
**Priority**: P1 (High)
**Effort**: 21 Story Points
**Duration**: 3 Sprints
**ROI**: Medium (Prevent 40% of runtime errors)

### Stories:
1. **COLL-3001: Critical Path Type Safety (31 files)**
   - Points: 8
   - Phase 1: Business logic (10 files)
   - Phase 2: UI components (10 files)
   - Phase 3: API layer (11 files)

2. **COLL-3002: Replace 'any' with Generics**
   - Points: 5
   - Generic patterns for common cases
   - Type inference improvements
   - Strict null checks

3. **COLL-3003: Type Guards & Validators**
   - Points: 8
   - Runtime type validation
   - Type predicates
   - Schema validation with Zod

### Migration Strategy:
```typescript
// Priority order by risk/impact
1. API responses (highest risk)
2. Event handlers
3. State management
4. Props/component interfaces
5. Utility functions (lowest risk)

// Example transformation
// Before:
const handleChange = (value: any) => setState(value);

// After:
const handleChange = <T extends AllocationChange>(value: T) => {
  if (isValidAllocationChange(value)) {
    setState(value);
  }
};
```

---

## Effort/Impact Matrix

| Epic | Effort | Impact | ROI Score | Quarter |
|------|--------|--------|-----------|---------|
| Component Consolidation | 13 pts | Critical | 9/10 | Q1 |
| AllocationContext | 8 pts | High | 8/10 | Q1 |
| Type Safety | 21 pts | Medium | 6/10 | Q1-Q2 |
| Performance Optimization | 13 pts | High | 7/10 | Q2 |
| Security Hardening | 8 pts | Critical | 10/10 | Q1 |

## Resource Requirements
- 2 Senior Frontend Engineers
- 1 QA Engineer
- 0.5 DevOps Engineer (CI/CD setup)
- Design review for consolidated components

## Success Metrics
- 50% reduction in component files
- 0 any types in critical paths
- 90% code coverage
- <3s page load time maintained
- 0 security vulnerabilities