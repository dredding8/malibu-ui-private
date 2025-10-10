# Collection Management System - Architecture Design Document

## Executive Summary

This document outlines the comprehensive redesign of the collection management system, consolidating 24 component variants, 3 overlapping contexts, and 161 hooks into a unified, maintainable architecture.

**Key Metrics from Wave 1 Discovery**:
- 24 CollectionOpportunities variants → Target: 1 unified component system
- 3 overlapping contexts → Target: 1 unified state provider
- 161 hooks → Target: 10-15 composable utilities
- Performance improvement target: 40-60% reduction in bundle size

## 1. Component Architecture Design

### 1.1 Current State Analysis
**Problems Identified**:
- 24 CollectionOpportunities variants with 70-80% code duplication
- Inconsistent props interfaces across variants
- No clear component hierarchy or composition patterns
- Tight coupling between presentation and business logic

### 1.2 Target Component Architecture

```
src/collections/
├── core/
│   ├── CollectionProvider.tsx          # Unified context provider
│   ├── CollectionContainer.tsx         # Smart container component
│   └── types/
│       ├── collection.types.ts
│       ├── props.types.ts
│       └── state.types.ts
├── presentation/
│   ├── CollectionGrid/
│   │   ├── CollectionGrid.tsx
│   │   ├── CollectionGridItem.tsx
│   │   └── CollectionGrid.test.tsx
│   ├── CollectionList/
│   │   ├── CollectionList.tsx
│   │   ├── CollectionListItem.tsx
│   │   └── CollectionList.test.tsx
│   ├── CollectionCard/
│   │   ├── CollectionCard.tsx
│   │   ├── CollectionCardHeader.tsx
│   │   ├── CollectionCardBody.tsx
│   │   └── CollectionCard.test.tsx
│   └── CollectionEmpty/
│       ├── CollectionEmpty.tsx
│       └── CollectionEmpty.test.tsx
├── actions/
│   ├── CreateCollection/
│   │   ├── CreateCollectionModal.tsx
│   │   ├── CreateCollectionForm.tsx
│   │   └── CreateCollection.test.tsx
│   ├── EditCollection/
│   │   ├── EditCollectionModal.tsx
│   │   ├── EditCollectionForm.tsx
│   │   └── EditCollection.test.tsx
│   └── DeleteCollection/
│       ├── DeleteCollectionConfirm.tsx
│       └── DeleteCollection.test.tsx
├── hooks/
│   ├── useCollection.ts                # Primary collection hook
│   ├── useCollectionActions.ts         # CRUD operations
│   ├── useCollectionFilters.ts         # Filtering logic
│   ├── useCollectionSort.ts            # Sorting logic
│   ├── useCollectionSearch.ts          # Search functionality
│   └── index.ts                        # Hook exports
└── utils/
    ├── collection.utils.ts
    ├── validation.utils.ts
    └── transform.utils.ts
```

### 1.3 Component Design Principles

**1. Composition over Configuration**
```typescript
// ❌ Old approach: Multiple variants
<CollectionOpportunitiesGrid />
<CollectionOpportunitiesList />
<CollectionOpportunitiesCard />

// ✅ New approach: Composable system
<Collection>
  <Collection.Grid>
    <Collection.Item />
  </Collection.Grid>
</Collection>
```

**2. Separation of Concerns**
- **Container Components**: Data fetching, state management
- **Presentation Components**: Pure UI, no business logic
- **Hook Utilities**: Reusable business logic
- **Action Components**: User interactions and forms

**3. Prop Interface Standardization**
```typescript
interface BaseCollectionProps {
  collections: Collection[];
  loading?: boolean;
  error?: Error | null;
  onSelect?: (collection: Collection) => void;
  onAction?: (action: CollectionAction, collection: Collection) => void;
}

interface CollectionViewProps extends BaseCollectionProps {
  viewMode: 'grid' | 'list' | 'card';
  itemsPerPage?: number;
  showActions?: boolean;
}
```

## 2. State Management Redesign

### 2.1 Current State Problems
- `CollectionContext`: Basic collection data
- `CollectionFilterContext`: Filtering state
- `CollectionUIContext`: UI preferences
- Overlapping responsibilities and circular dependencies
- No clear data flow patterns

### 2.2 Unified State Architecture

```typescript
// src/collections/core/types/state.types.ts
interface CollectionState {
  // Entity data (normalized)
  entities: {
    collections: Record<string, Collection>;
    filters: Record<string, CollectionFilter>;
    tags: Record<string, Tag>;
  };
  
  // UI state
  ui: {
    selectedCollectionId: string | null;
    viewMode: ViewMode;
    sortConfig: SortConfig;
    searchQuery: string;
    pagination: PaginationState;
  };
  
  // Operation state
  operations: {
    loading: Set<string>;           // Track loading states by operation ID
    errors: Record<string, Error>;  // Track errors by operation ID
    optimisticUpdates: Record<string, any>;
  };
  
  // Cache management
  cache: {
    lastFetch: Record<string, number>;
    invalidationQueue: Set<string>;
  };
}

interface CollectionActions {
  // Entity actions
  setCollections: (collections: Collection[]) => void;
  addCollection: (collection: Collection) => void;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  removeCollection: (id: string) => void;
  
  // UI actions
  setViewMode: (mode: ViewMode) => void;
  setSort: (config: SortConfig) => void;
  setSearch: (query: string) => void;
  selectCollection: (id: string | null) => void;
  
  // Operation actions
  setLoading: (operationId: string, loading: boolean) => void;
  setError: (operationId: string, error: Error | null) => void;
  addOptimisticUpdate: (id: string, update: any) => void;
  removeOptimisticUpdate: (id: string) => void;
}
```

### 2.3 State Management Implementation

**Option 1: Enhanced Context + useReducer**
```typescript
// src/collections/core/CollectionProvider.tsx
const CollectionProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(collectionReducer, initialState);
  
  const actions = useMemo(() => 
    createCollectionActions(dispatch), [dispatch]
  );
  
  const value = useMemo(() => ({
    ...state,
    actions,
    // Computed selectors
    filteredCollections: selectFilteredCollections(state),
    sortedCollections: selectSortedCollections(state),
    selectedCollection: selectSelectedCollection(state),
  }), [state, actions]);
  
  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  );
};
```

**Option 2: Zustand Store (Recommended)**
```typescript
// src/collections/core/store.ts
interface CollectionStore extends CollectionState, CollectionActions {}

export const useCollectionStore = create<CollectionStore>((set, get) => ({
  // Initial state
  ...initialState,
  
  // Actions
  setCollections: (collections) => set((state) => ({
    entities: {
      ...state.entities,
      collections: normalizeCollections(collections)
    }
  })),
  
  updateCollection: (id, updates) => set((state) => ({
    entities: {
      ...state.entities,
      collections: {
        ...state.entities.collections,
        [id]: { ...state.entities.collections[id], ...updates }
      }
    }
  })),
  
  // Selectors as computed properties
  get filteredCollections() {
    const { entities, ui } = get();
    return selectFilteredCollections(entities.collections, ui.searchQuery);
  },
}));
```

## 3. Hook Composition Strategy

### 3.1 Hook Consolidation Plan

**Current: 161 hooks → Target: 10-15 core hooks**

```typescript
// src/collections/hooks/index.ts

// 1. Primary Data Hook
export const useCollection = (id?: string) => {
  const store = useCollectionStore();
  
  return useMemo(() => ({
    collection: id ? store.entities.collections[id] : null,
    collections: Object.values(store.entities.collections),
    loading: store.operations.loading.has('fetch-collections'),
    error: store.operations.errors['fetch-collections'],
  }), [store, id]);
};

// 2. CRUD Operations Hook
export const useCollectionActions = () => {
  const store = useCollectionStore();
  
  return useMemo(() => ({
    create: async (data: CreateCollectionData) => {
      const tempId = generateTempId();
      store.addOptimisticUpdate(tempId, data);
      
      try {
        const collection = await collectionAPI.create(data);
        store.addCollection(collection);
        store.removeOptimisticUpdate(tempId);
        return collection;
      } catch (error) {
        store.removeOptimisticUpdate(tempId);
        store.setError('create-collection', error);
        throw error;
      }
    },
    
    update: async (id: string, updates: Partial<Collection>) => {
      store.addOptimisticUpdate(id, updates);
      
      try {
        const collection = await collectionAPI.update(id, updates);
        store.updateCollection(id, collection);
        store.removeOptimisticUpdate(id);
        return collection;
      } catch (error) {
        store.removeOptimisticUpdate(id);
        store.setError('update-collection', error);
        throw error;
      }
    },
    
    delete: async (id: string) => {
      const original = store.entities.collections[id];
      store.removeCollection(id);
      
      try {
        await collectionAPI.delete(id);
      } catch (error) {
        store.addCollection(original);
        store.setError('delete-collection', error);
        throw error;
      }
    },
  }), [store]);
};

// 3. Filtering Hook
export const useCollectionFilters = () => {
  const store = useCollectionStore();
  
  return useMemo(() => ({
    searchQuery: store.ui.searchQuery,
    setSearch: store.setSearch,
    
    filteredCollections: store.filteredCollections,
    
    applyFilter: (filter: CollectionFilter) => {
      // Implementation
    },
    
    clearFilters: () => {
      store.setSearch('');
      // Clear other filters
    },
  }), [store]);
};

// 4. Sorting Hook
export const useCollectionSort = () => {
  const store = useCollectionStore();
  
  return useMemo(() => ({
    sortConfig: store.ui.sortConfig,
    setSort: store.setSort,
    
    sortedCollections: store.sortedCollections,
    
    toggleSort: (field: keyof Collection) => {
      const current = store.ui.sortConfig;
      const direction = current.field === field && current.direction === 'asc' 
        ? 'desc' : 'asc';
      
      store.setSort({ field, direction });
    },
  }), [store]);
};

// 5. UI State Hook
export const useCollectionUI = () => {
  const store = useCollectionStore();
  
  return useMemo(() => ({
    viewMode: store.ui.viewMode,
    setViewMode: store.setViewMode,
    
    selectedCollection: store.selectedCollection,
    selectCollection: store.selectCollection,
    
    pagination: store.ui.pagination,
    setPagination: (pagination: Partial<PaginationState>) => {
      // Implementation
    },
  }), [store]);
};
```

### 3.2 Hook Composition Patterns

```typescript
// Composed hook for complete collection management
export const useCollectionManager = () => {
  const collection = useCollection();
  const actions = useCollectionActions();
  const filters = useCollectionFilters();
  const sort = useCollectionSort();
  const ui = useCollectionUI();
  
  return {
    ...collection,
    ...actions,
    ...filters,
    ...sort,
    ...ui,
  };
};

// Specialized hooks for specific use cases
export const useCollectionSearch = (initialQuery = '') => {
  const { searchQuery, setSearch, filteredCollections } = useCollectionFilters();
  
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  useEffect(() => {
    if (initialQuery) {
      setSearch(initialQuery);
    }
  }, [initialQuery, setSearch]);
  
  return {
    query: searchQuery,
    setQuery: setSearch,
    results: filteredCollections,
    isSearching: searchQuery !== debouncedSearch,
  };
};
```

## 4. Data Flow Architecture

### 4.1 API Integration Design

```typescript
// src/collections/core/api.ts
interface CollectionAPI {
  // CRUD operations
  getAll: (params?: GetCollectionsParams) => Promise<Collection[]>;
  getById: (id: string) => Promise<Collection>;
  create: (data: CreateCollectionData) => Promise<Collection>;
  update: (id: string, data: Partial<Collection>) => Promise<Collection>;
  delete: (id: string) => Promise<void>;
  
  // Batch operations
  bulkUpdate: (updates: Array<{ id: string; data: Partial<Collection> }>) => Promise<Collection[]>;
  bulkDelete: (ids: string[]) => Promise<void>;
}

// React Query integration
export const useCollectionQueries = () => {
  const queryClient = useQueryClient();
  
  return {
    // Fetch all collections
    useCollections: (params?: GetCollectionsParams) =>
      useQuery({
        queryKey: ['collections', params],
        queryFn: () => collectionAPI.getAll(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
      }),
    
    // Fetch single collection
    useCollectionById: (id: string) =>
      useQuery({
        queryKey: ['collection', id],
        queryFn: () => collectionAPI.getById(id),
        enabled: !!id,
      }),
    
    // Create collection mutation
    useCreateCollection: () =>
      useMutation({
        mutationFn: collectionAPI.create,
        onSuccess: (newCollection) => {
          queryClient.invalidateQueries({ queryKey: ['collections'] });
          queryClient.setQueryData(['collection', newCollection.id], newCollection);
        },
      }),
    
    // Update collection mutation
    useUpdateCollection: () =>
      useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Collection> }) =>
          collectionAPI.update(id, data),
        onSuccess: (updatedCollection) => {
          queryClient.invalidateQueries({ queryKey: ['collections'] });
          queryClient.setQueryData(['collection', updatedCollection.id], updatedCollection);
        },
      }),
    
    // Delete collection mutation
    useDeleteCollection: () =>
      useMutation({
        mutationFn: collectionAPI.delete,
        onSuccess: (_, deletedId) => {
          queryClient.invalidateQueries({ queryKey: ['collections'] });
          queryClient.removeQueries({ queryKey: ['collection', deletedId] });
        },
      }),
  };
};
```

### 4.2 Error Handling Strategy

```typescript
// src/collections/core/error-handling.ts
export class CollectionError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'CollectionError';
  }
}

export const errorHandler = {
  handleAPIError: (error: any): CollectionError => {
    if (error.response?.status === 404) {
      return new CollectionError('Collection not found', 'NOT_FOUND');
    }
    if (error.response?.status === 403) {
      return new CollectionError('Access denied', 'FORBIDDEN');
    }
    return new CollectionError('An unexpected error occurred', 'UNKNOWN', error);
  },
  
  handleValidationError: (errors: Record<string, string>): CollectionError => {
    return new CollectionError('Validation failed', 'VALIDATION', errors);
  },
};

// Error boundary for collection components
export const CollectionErrorBoundary: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={<CollectionErrorFallback />}
      onError={(error, errorInfo) => {
        console.error('Collection error:', error, errorInfo);
        // Send to error reporting service
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
```

## 5. Migration Architecture

### 5.1 Feature Flag Strategy

```typescript
// src/collections/core/feature-flags.ts
export interface CollectionFeatureFlags {
  newCollectionSystem: boolean;
  unifiedHooks: boolean;
  newStateManagement: boolean;
  optimisticUpdates: boolean;
}

export const useCollectionFeatureFlags = (): CollectionFeatureFlags => {
  return {
    newCollectionSystem: useFeatureFlag('collection_system_v2'),
    unifiedHooks: useFeatureFlag('collection_unified_hooks'),
    newStateManagement: useFeatureFlag('collection_state_v2'),
    optimisticUpdates: useFeatureFlag('collection_optimistic_updates'),
  };
};

// Migration wrapper component
export const CollectionSystemWrapper: FC<{ children: ReactNode }> = ({ children }) => {
  const flags = useCollectionFeatureFlags();
  
  if (flags.newCollectionSystem) {
    return (
      <CollectionProvider>
        <CollectionErrorBoundary>
          {children}
        </CollectionErrorBoundary>
      </CollectionProvider>
    );
  }
  
  // Legacy system
  return (
    <LegacyCollectionProvider>
      {children}
    </LegacyCollectionProvider>
  );
};
```

### 5.2 Compatibility Layer

```typescript
// src/collections/legacy/compatibility.tsx
// Adapter for legacy components to use new system

export const LegacyCollectionAdapter: FC<LegacyCollectionProps> = (props) => {
  const newSystemProps = adaptLegacyProps(props);
  const flags = useCollectionFeatureFlags();
  
  if (flags.newCollectionSystem) {
    return <NewCollectionComponent {...newSystemProps} />;
  }
  
  return <LegacyCollectionComponent {...props} />;
};

// Hook adapter
export const useLegacyCollection = (id?: string) => {
  const flags = useCollectionFeatureFlags();
  const newHook = useCollection(id);
  const legacyHook = useLegacyCollectionHook(id);
  
  if (flags.unifiedHooks) {
    return adaptNewHookToLegacy(newHook);
  }
  
  return legacyHook;
};
```

### 5.3 Migration Phases

**Phase 1: Infrastructure (2 weeks)**
- Set up new directory structure
- Implement feature flag system
- Create compatibility layer
- Set up testing infrastructure

**Phase 2: Core Components (3 weeks)**
- Implement unified state management
- Create core presentation components
- Implement primary hooks
- Add comprehensive tests

**Phase 3: Migration (4 weeks)**
- Migrate components batch by batch
- Update import statements
- Remove legacy code
- Performance optimization

**Phase 4: Cleanup (1 week)**
- Remove feature flags
- Clean up compatibility layer
- Final testing and documentation
- Performance validation

## 6. Testing Architecture

### 6.1 Testing Strategy

```typescript
// src/collections/__tests__/setup.ts
export const createTestCollectionProvider = (initialState?: Partial<CollectionState>) => {
  return ({ children }: { children: ReactNode }) => (
    <CollectionProvider initialState={initialState}>
      {children}
    </CollectionProvider>
  );
};

export const mockCollectionAPI = {
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

// Component test utilities
export const renderWithCollectionProvider = (
  component: ReactElement,
  options?: {
    initialState?: Partial<CollectionState>;
    preloadedData?: Collection[];
  }
) => {
  const { initialState, preloadedData } = options || {};
  
  return render(
    component,
    {
      wrapper: createTestCollectionProvider(initialState),
    }
  );
};
```

### 6.2 Test Coverage Strategy

**Unit Tests (90% coverage target)**
- All hooks must have comprehensive tests
- All utility functions tested
- State management actions and selectors tested

**Integration Tests (80% coverage target)**
- Component interaction with hooks
- API integration tests
- Error handling scenarios

**E2E Tests (Critical user journeys)**
- Create collection flow
- Edit collection flow
- Delete collection flow
- Search and filter functionality

## 7. Performance Architecture

### 7.1 Optimization Strategies

**Bundle Splitting**
```typescript
// Lazy load collection components
const CollectionGrid = lazy(() => import('./presentation/CollectionGrid'));
const CollectionList = lazy(() => import('./presentation/CollectionList'));

// Code splitting by feature
const CreateCollectionModal = lazy(() => 
  import('./actions/CreateCollection/CreateCollectionModal')
);
```

**Memoization Strategy**
```typescript
// Memoize expensive selectors
export const selectFilteredCollections = createSelector(
  [(state: CollectionState) => state.entities.collections,
   (state: CollectionState) => state.ui.searchQuery],
  (collections, searchQuery) => {
    if (!searchQuery) return Object.values(collections);
    
    return Object.values(collections).filter(collection =>
      collection.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
);

// Memoize components
export const CollectionCard = memo<CollectionCardProps>(
  ({ collection, onSelect }) => {
    // Component implementation
  },
  (prevProps, nextProps) => 
    prevProps.collection.id === nextProps.collection.id &&
    prevProps.collection.updatedAt === nextProps.collection.updatedAt
);
```

### 7.2 Performance Budgets

**Bundle Size Targets**
- Core collection system: <150KB gzipped
- Individual components: <25KB gzipped
- Hooks package: <15KB gzipped

**Runtime Performance**
- Initial render: <100ms
- State updates: <16ms (60 FPS)
- Search response: <200ms
- Component mount: <50ms

## Success Metrics and KPIs

### 8.1 Development Metrics
- **Code Reduction**: 60-70% reduction in collection-related code
- **Maintenance Overhead**: 50% reduction in time spent on collection features
- **Developer Experience**: 80% reduction in time to implement new collection features

### 8.2 Performance Metrics
- **Bundle Size**: 40-50% reduction in collection-related bundle size
- **Runtime Performance**: 30% improvement in collection operations
- **Memory Usage**: 25% reduction in memory footprint

### 8.3 Quality Metrics
- **Test Coverage**: >90% unit test coverage, >80% integration coverage
- **Bug Reduction**: 70% reduction in collection-related bugs
- **TypeScript Coverage**: 100% type coverage for new system

## Risk Mitigation

### 9.1 Technical Risks
- **Breaking Changes**: Mitigated by compatibility layer and gradual migration
- **Performance Regression**: Mitigated by performance budgets and monitoring
- **State Management Complexity**: Mitigated by clear documentation and training

### 9.2 Business Risks
- **User Experience Disruption**: Mitigated by feature flags and A/B testing
- **Development Velocity**: Mitigated by parallel development and training
- **Resource Allocation**: Mitigated by phased approach and clear milestones

## Next Steps

1. **Architecture Review**: Validate design with stakeholders
2. **Proof of Concept**: Implement core components and hooks
3. **Migration Planning**: Create detailed migration timeline
4. **Team Training**: Educate team on new patterns and architecture
5. **Implementation**: Begin Phase 1 development

---

**Document Version**: 1.0  
**Last Updated**: 2025-09-30  
**Review Date**: 2025-10-07  
**Stakeholders**: Engineering Team, Product Team, QA Team