# State Management Unification - Wave 3

**Goal**: Consolidate Zustand + 5 Context Providers → Single Zustand store + 2 essential contexts
**Impact**: Eliminate state synchronization bugs, reduce re-renders, improve maintainability

---

## 📊 Current State Architecture (Fragmented)

### Layer 1: Zustand Store
```
collectionStore.ts (986 LOC)
├── collections: { byId, allIds, selectedIds }
├── ui: { viewMode, filters, sort, pagination }
├── cache: { metadata, ttl }
├── performance: { metrics }
└── Actions: CRUD + bulk operations
```

### Layer 2: Context Providers (5)
```
1. AllocationContext (Primary overlap with Zustand)
   ├── opportunities: CollectionOpportunity[]  ⚠️ Duplicate
   ├── healthScores: Map<string, OpportunityHealth>
   ├── pendingChanges: Map<string, OpportunityChange>
   ├── selectedOpportunities: Set<string>  ⚠️ Duplicate
   └── Undo/Redo stacks

2. NavigationContext
   ├── currentContext: PageContext
   ├── breadcrumbs: Breadcrumb[]
   ├── hasUnsavedChanges: boolean
   └── canNavigateAway: boolean

3. EnhancedNavigationContext  ⚠️ Duplicate of NavigationContext
   ├── navigationHistory: string[]
   ├── quickActions: Action[]
   └── (Same state as NavigationContext)

4. BackgroundProcessingContext
   ├── pendingOperations: Operation[]
   ├── completedOperations: Operation[]
   └── Should be service layer, not context

5. WizardSyncContext
   ├── wizardState: WizardStep
   ├── formData: any
   └── Limited use case (create collection wizard)
```

---

## 🎯 Target State Architecture (Unified)

### Single Source of Truth: Enhanced Zustand Store

```typescript
// store/unifiedStore.ts

interface UnifiedState {
  // ========== COLLECTIONS ==========
  collections: {
    byId: Record<string, Collection>;
    allIds: string[];
    selectedIds: Set<string>;
    editingId: string | null;
  };

  // ========== OPPORTUNITIES (Merged from AllocationContext) ==========
  opportunities: {
    byId: Record<string, CollectionOpportunity>;
    allIds: string[];
    healthScores: Map<string, OpportunityHealth>;
    pendingChanges: Map<string, OpportunityChange>;
    allocationChanges: Map<string, AllocationChange[]>;
  };

  // ========== UI STATE ==========
  ui: {
    // View configuration
    viewMode: 'grid' | 'list' | 'bento' | 'split';
    filters: CollectionFilter;
    sort: CollectionSort;
    pagination: Pagination;

    // Active states
    activeWorkspaceId?: string;
    quickEditId?: string;

    // Modals
    modals: {
      createCollection: boolean;
      editCollection: string | null;
      deleteConfirmation: string | null;
    };
  };

  // ========== NAVIGATION (Essential context only) ==========
  // Keep as separate context (page-level state)

  // ========== WIZARD STATE (If needed) ==========
  wizard: {
    currentStep: number;
    formData: any;
    isValid: boolean;
  };

  // ========== HISTORY (Undo/Redo) ==========
  history: {
    undoStack: HistoryEntry[];
    redoStack: HistoryEntry[];
    maxStackSize: number;
  };

  // ========== LOADING & ERRORS ==========
  loading: LoadingState;
  errors: ErrorState;

  // ========== CACHE ==========
  cache: CacheState;

  // ========== PERFORMANCE ==========
  performance: PerformanceMetrics;
}

interface UnifiedActions {
  // Collection actions
  loadCollections: () => Promise<void>;
  createCollection: (data) => Promise<Collection>;
  updateCollection: (id, updates) => Promise<Collection>;
  deleteCollection: (id) => Promise<void>;

  // Opportunity actions (merged from AllocationContext)
  loadOpportunities: () => Promise<void>;
  updateOpportunity: (id, changes) => Promise<void>;
  batchUpdateOpportunities: (changes) => Promise<void>;
  commitChanges: () => Promise<void>;
  rollbackChanges: () => void;

  // Selection actions
  selectCollections: (ids: string[], mode?: 'replace' | 'add' | 'remove') => void;
  clearSelection: () => void;

  // UI actions
  setViewMode: (mode) => void;
  setFilter: (filter) => void;
  openModal: (modal, id?) => void;
  closeModal: (modal) => void;

  // History actions
  undo: () => void;
  redo: () => void;

  // Wizard actions
  setWizardStep: (step) => void;
  updateWizardData: (data) => void;
}
```

### Essential Contexts (Keep Only 2)

```typescript
// 1. NavigationContext (Merged NavigationContext + EnhancedNavigationContext)
interface NavigationContextValue {
  currentContext: PageContext;
  previousContext?: PageContext;
  breadcrumbs: Breadcrumb[];
  navigationHistory: string[];
  hasUnsavedChanges: boolean;
  canNavigateAway: boolean;
  quickActions: Action[];

  // Methods
  updateContext: (context: Partial<PageContext>) => void;
  navigateWithContext: (path: string, context?) => void;
  setUnsavedChanges: (has: boolean) => void;
}

// 2. ThemeContext (If needed for Blueprint theming)
interface ThemeContextValue {
  theme: 'light' | 'dark';
  highContrast: boolean;
  reducedMotion: boolean;
  toggleTheme: () => void;
}

// ELIMINATE:
// ❌ AllocationContext → Migrate to Zustand
// ❌ EnhancedNavigationContext → Merge with NavigationContext
// ❌ BackgroundProcessingContext → Move to service layer
// ❌ WizardSyncContext → Migrate to Zustand wizard state
```

---

## 🔄 Migration Strategy

### Phase 1: Extend Zustand Store
```typescript
// store/collectionStore.ts

// Add opportunity state (from AllocationContext)
export const useCollectionStore = create<UnifiedState & UnifiedActions>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Existing state
        collections: { ... },

        // NEW: Opportunity state (from AllocationContext)
        opportunities: {
          byId: {},
          allIds: [],
          healthScores: new Map(),
          pendingChanges: new Map(),
          allocationChanges: new Map(),
        },

        // NEW: Wizard state (from WizardSyncContext)
        wizard: {
          currentStep: 0,
          formData: {},
          isValid: false,
        },

        // NEW: History state (from AllocationContext)
        history: {
          undoStack: [],
          redoStack: [],
          maxStackSize: 50,
        },

        // Actions...
        loadOpportunities: async () => {
          const data = await opportunityService.fetchOpportunities();
          set((state) => {
            state.opportunities.byId = normalize(data);
            state.opportunities.allIds = data.map(o => o.id);
          });
        },

        updateOpportunity: async (id, changes) => {
          // Optimistic update
          const original = get().opportunities.byId[id];
          set((state) => {
            state.opportunities.byId[id] = { ...original, ...changes };
            state.opportunities.pendingChanges.set(id, { ...changes, timestamp: new Date() });
          });

          try {
            await opportunityService.updateOpportunity(id, changes);
          } catch (error) {
            // Rollback
            set((state) => {
              state.opportunities.byId[id] = original;
              state.opportunities.pendingChanges.delete(id);
            });
          }
        },

        commitChanges: async () => {
          const changes = get().opportunities.pendingChanges;
          await opportunityService.batchCommit(Array.from(changes.entries()));
          set((state) => {
            state.opportunities.pendingChanges.clear();
          });
        },

        // ... other actions
      }))
    )
  )
);
```

### Phase 2: Create Transition Hooks
```typescript
// hooks/useAllocation.ts (Adapter hook during transition)

/**
 * Adapter hook that provides AllocationContext-like API
 * but uses Zustand store underneath
 *
 * @deprecated This is a transition hook. Use store selectors directly.
 */
export const useAllocation = () => {
  // Map to store selectors
  const opportunities = useCollectionStore(state =>
    state.opportunities.allIds.map(id => state.opportunities.byId[id])
  );
  const healthScores = useCollectionStore(state => state.opportunities.healthScores);
  const pendingChanges = useCollectionStore(state => state.opportunities.pendingChanges);
  const selectedOpportunities = useCollectionStore(state => state.collections.selectedIds);

  // Map to store actions
  const updateOpportunity = useCollectionStore(state => state.updateOpportunity);
  const commitChanges = useCollectionStore(state => state.commitChanges);
  const rollbackChanges = useCollectionStore(state => state.rollbackChanges);

  return {
    opportunities,
    healthScores,
    pendingChanges,
    selectedOpportunities,
    updateOpportunity,
    commitChanges,
    rollbackChanges,
  };
};
```

### Phase 3: Update Components Gradually
```typescript
// BEFORE: Using AllocationContext
import { useAllocationContext } from '../contexts/AllocationContext';

const MyComponent = () => {
  const { opportunities, updateOpportunity } = useAllocationContext();
  // ...
};

// TRANSITION: Using adapter hook
import { useAllocation } from '../hooks/useAllocation';

const MyComponent = () => {
  const { opportunities, updateOpportunity } = useAllocation();
  // ...
};

// AFTER: Using store directly
import { useCollectionStore } from '../store/collectionStore';

const MyComponent = () => {
  const opportunities = useCollectionStore(state =>
    state.opportunities.allIds.map(id => state.opportunities.byId[id])
  );
  const updateOpportunity = useCollectionStore(state => state.updateOpportunity);
  // ...
};
```

### Phase 4: Consolidate Navigation Contexts
```typescript
// contexts/NavigationContext.tsx (Consolidated)

export const NavigationProvider: React.FC = ({ children }) => {
  const [state, setState] = useState({
    // Standard navigation
    currentContext: determinePageContext(location.pathname),
    previousContext: undefined,
    breadcrumbs: [],
    hasUnsavedChanges: false,
    canNavigateAway: true,

    // Enhanced features (from EnhancedNavigationContext)
    navigationHistory: [],
    quickActions: [],
    focusedElement: null,
  });

  // Merge methods from both contexts
  const value = {
    ...state,
    updateContext,
    navigateWithContext,
    setUnsavedChanges,
    addToHistory,
    registerQuickAction,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};
```

### Phase 5: Move Background Processing to Service
```typescript
// services/backgroundProcessingService.ts

class BackgroundProcessingService {
  private operations: Map<string, Operation> = new Map();

  async startOperation(operation: Operation) {
    this.operations.set(operation.id, operation);

    // Update store instead of context
    useCollectionStore.getState().addOperation(operation);

    try {
      const result = await operation.execute();
      useCollectionStore.getState().completeOperation(operation.id, result);
    } catch (error) {
      useCollectionStore.getState().failOperation(operation.id, error);
    }
  }
}

export const backgroundProcessingService = new BackgroundProcessingService();

// ELIMINATE BackgroundProcessingContext entirely
```

---

## ✅ Migration Checklist

### Week 1: Zustand Store Extension
- [ ] Add opportunity state to collectionStore
- [ ] Add wizard state to collectionStore
- [ ] Add history (undo/redo) to collectionStore
- [ ] Implement new actions
- [ ] Write tests for new state slices

### Week 2: Adapter Hooks
- [ ] Create useAllocation adapter hook
- [ ] Create useWizard adapter hook
- [ ] Create useHistory adapter hook
- [ ] Test adapter compatibility

### Week 3: Component Migration (High Priority)
- [ ] Migrate CollectionOpportunitiesHub to use store
- [ ] Migrate CreateCollectionDeck wizard to use store
- [ ] Migrate History page to use store
- [ ] Test state synchronization

### Week 4: Component Migration (Medium Priority)
- [ ] Migrate remaining opportunity components
- [ ] Migrate navigation-heavy components
- [ ] Update all useAllocationContext calls

### Week 5: Context Consolidation
- [ ] Merge NavigationContext + EnhancedNavigationContext
- [ ] Move BackgroundProcessing to service layer
- [ ] Remove WizardSyncContext
- [ ] Update App.tsx provider stack

### Week 6: Cleanup & Validation
- [ ] Remove AllocationContext entirely
- [ ] Remove adapter hooks
- [ ] Update documentation
- [ ] Performance validation
- [ ] Zero state sync bugs

---

## 📊 Success Metrics

### Quantitative
- Context Providers: 5 → 2 (-60%)
- State sources: 6 → 1 (+2 essential contexts)
- Re-renders: Reduce by 40%+
- State bugs: Zero synchronization issues

### Qualitative
- Single source of truth for collection data
- Predictable state updates
- Easier debugging (Redux DevTools)
- Improved performance
- Simplified provider stack in App.tsx

---

## 🚨 Risk Mitigation

### Risk 1: State Synchronization During Transition
**Mitigation**: Adapter hooks maintain API compatibility
**Rollback**: Feature flag to revert to old contexts

### Risk 2: Performance Regression
**Mitigation**: Selective re-rendering with Zustand subscribeWithSelector
**Monitoring**: Performance profiling before/after

### Risk 3: Breaking Changes
**Mitigation**: Gradual migration, parallel systems during transition
**Testing**: Comprehensive integration tests

---

**Status**: Design Complete, Ready for Implementation
**Next**: Begin Week 1 - Zustand Store Extension
