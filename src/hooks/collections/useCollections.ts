/**
 * Collections Multiple Items Hook
 * 
 * Hook for managing multiple collections with filtering, sorting, pagination,
 * and bulk operations support.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import { useCallback, useMemo, useEffect, useState } from 'react';
import { useCollectionStore } from '../../store/collectionStore';
import {
  Collection,
  CollectionFilter,
  CollectionSort,
  CollectionPagination,
  CollectionViewConfig,
  ValidationResult,
} from '../../types/collection.types';

// =============================================================================
// Hook Options Interface
// =============================================================================

export interface UseCollectionsOptions {
  /** Initial filter to apply */
  initialFilter?: CollectionFilter;
  /** Initial sort configuration */
  initialSort?: CollectionSort;
  /** Initial pagination settings */
  initialPagination?: Partial<CollectionPagination>;
  /** Auto-load on mount */
  autoLoad?: boolean;
  /** Enable real-time updates */
  enableRealtime?: boolean;
  /** Enable performance monitoring */
  enablePerformanceMonitoring?: boolean;
  /** Debounce time for filter changes (ms) */
  filterDebounceTime?: number;
  /** Cache results */
  enableCaching?: boolean;
  /** Preload related data */
  preloadRelated?: boolean;
}

// =============================================================================
// Hook Return Type
// =============================================================================

export interface UseCollectionsReturn {
  /** Collections data */
  collections: Collection[];
  /** Filtered and sorted collection IDs */
  collectionIds: string[];
  /** Total count (before pagination) */
  totalCount: number;
  /** Loading states */
  loading: {
    /** Collections are loading */
    isLoading: boolean;
    /** Initial load */
    isInitialLoading: boolean;
    /** Refreshing data */
    isRefreshing: boolean;
    /** Loading more (pagination) */
    isLoadingMore: boolean;
    /** Bulk operation in progress */
    isBulkLoading: boolean;
  };
  /** Error states */
  error: {
    /** Load error */
    loadError: string | null;
    /** Filter error */
    filterError: string | null;
    /** Bulk operation error */
    bulkError: string | null;
    /** Has any error */
    hasError: boolean;
  };
  /** Current filter state */
  filter: CollectionFilter;
  /** Current sort state */
  sort: CollectionSort;
  /** Current pagination state */
  pagination: CollectionPagination;
  /** Current view config */
  viewConfig: CollectionViewConfig;
  /** Selection state */
  selection: {
    /** Selected collection IDs */
    selectedIds: Set<string>;
    /** Selected collections */
    selectedCollections: Collection[];
    /** Number of selected items */
    selectedCount: number;
    /** All visible items selected */
    allSelected: boolean;
    /** Some items selected */
    someSelected: boolean;
  };
  /** Performance metrics */
  performance: {
    /** Last load time */
    lastLoadTime: number;
    /** Average render time */
    averageRenderTime: number;
    /** Cache hit rate */
    cacheHitRate: number;
  };
  /** Real-time connection status */
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting' | 'error';

  // Filter Actions
  /** Set filter */
  setFilter: (filter: CollectionFilter, options?: { preserveSort?: boolean; resetPagination?: boolean }) => void;
  /** Clear filter */
  clearFilter: (preserveSearch?: boolean) => void;
  /** Update filter partially */
  updateFilter: (updates: Partial<CollectionFilter>) => void;
  /** Apply filter preset */
  applyFilterPreset: (presetId: string) => void;

  // Sort Actions
  /** Set sort */
  setSort: (sort: CollectionSort, resetPagination?: boolean) => void;
  /** Toggle sort direction */
  toggleSort: (field: CollectionSort['field']) => void;

  // Pagination Actions
  /** Set pagination */
  setPagination: (pagination: Partial<CollectionPagination>) => void;
  /** Go to next page */
  nextPage: () => void;
  /** Go to previous page */
  previousPage: () => void;
  /** Go to specific page */
  goToPage: (page: number) => void;
  /** Change page size */
  changePageSize: (pageSize: number) => void;

  // View Actions
  /** Set view config */
  setViewConfig: (viewConfig: Partial<CollectionViewConfig>) => void;
  /** Change view mode */
  changeViewMode: (mode: CollectionViewConfig['mode']) => void;
  /** Change density */
  changeDensity: (density: CollectionViewConfig['density']) => void;

  // Data Actions
  /** Load collections */
  load: (options?: { forceRefresh?: boolean }) => Promise<void>;
  /** Refresh collections */
  refresh: () => Promise<void>;
  /** Load more (for infinite scroll) */
  loadMore: () => Promise<void>;
  /** Reload with current settings */
  reload: () => Promise<void>;

  // Selection Actions
  /** Select collections */
  selectCollections: (ids: string[], mode?: 'replace' | 'add' | 'remove' | 'toggle') => void;
  /** Select all visible collections */
  selectAll: () => void;
  /** Clear selection */
  clearSelection: () => void;
  /** Toggle selection for collection */
  toggleSelection: (id: string) => void;

  // Bulk Operations
  /** Start bulk operation */
  startBulkOperation: (operation: any) => Promise<string>;
  /** Cancel bulk operation */
  cancelBulkOperation: () => void;

  // Utilities
  /** Get collection by ID */
  getCollection: (id: string) => Collection | undefined;
  /** Check if collection exists */
  hasCollection: (id: string) => boolean;
  /** Validate collections */
  validateCollections: (ids?: string[]) => Promise<ValidationResult[]>;
}

// =============================================================================
// Default Options
// =============================================================================

const defaultOptions: UseCollectionsOptions = {
  autoLoad: true,
  enableRealtime: true,
  enablePerformanceMonitoring: true,
  filterDebounceTime: 300,
  enableCaching: true,
  preloadRelated: false,
};

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for managing multiple collections
 * 
 * @param options - Hook configuration options
 * @returns Collections management interface
 * 
 * @example
 * ```tsx
 * const {
 *   collections,
 *   loading,
 *   error,
 *   filter,
 *   sort,
 *   pagination,
 *   selection,
 *   setFilter,
 *   setSort,
 *   selectAll,
 *   clearSelection
 * } = useCollections({
 *   initialFilter: { status: { operational: ['nominal'] } },
 *   initialSort: { field: 'name', direction: 'asc' },
 *   autoLoad: true
 * });
 * 
 * return (
 *   <div>
 *     <CollectionFilters filter={filter} onFilterChange={setFilter} />
 *     <CollectionTable 
 *       collections={collections}
 *       sort={sort}
 *       onSortChange={setSort}
 *       selection={selection}
 *       onSelectAll={selectAll}
 *     />
 *     <Pagination {...pagination} />
 *   </div>
 * );
 * ```
 */
export const useCollections = (options: UseCollectionsOptions = {}): UseCollectionsReturn => {
  const opts = { ...defaultOptions, ...options };

  // =============================================================================
  // Local State
  // =============================================================================

  const [isInitialLoading, setIsInitialLoading] = useState(opts.autoLoad);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterDebounceTimeout, setFilterDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  // =============================================================================
  // Store Selectors
  // =============================================================================

  const collections = useCollectionStore(state => 
    state.collections.collectionIds.map(id => state.collections.collections[id]).filter(Boolean)
  );

  const collectionIds = useCollectionStore(state => state.collections.collectionIds);

  const loading = useCollectionStore(state => ({
    isLoading: state.collections.loading.collections,
    isBulkLoading: state.collections.loading.bulk,
  }));

  const errors = useCollectionStore(state => state.collections.errors);

  const filter = useCollectionStore(state => state.filterView.filter);
  const sort = useCollectionStore(state => state.filterView.sort);
  const pagination = useCollectionStore(state => state.filterView.pagination);
  const viewConfig = useCollectionStore(state => state.filterView.viewConfig);

  const selectedIds = useCollectionStore(state => state.collections.selectedIds);

  const connectionStatus = useCollectionStore(state => state.realtime.connectionStatus);
  const performanceMetrics = useCollectionStore(state => state.collections.performance);

  // =============================================================================
  // Store Actions
  // =============================================================================

  const storeActions = useCollectionStore(state => ({
    loadCollections: state.loadCollections,
    setFilter: state.setFilter,
    clearFilter: state.clearFilter,
    setSort: state.setSort,
    setPagination: state.setPagination,
    setViewConfig: state.setViewConfig,
    selectCollections: state.selectCollections,
    selectAllCollections: state.selectAllCollections,
    clearSelection: state.clearSelection,
    startBulkOperation: state.startBulkOperation,
    cancelBulkOperation: state.cancelBulkOperation,
    subscribeToUpdates: state.subscribeToUpdates,
    unsubscribeFromUpdates: state.unsubscribeFromUpdates,
  }));

  // =============================================================================
  // Computed Values
  // =============================================================================

  const totalCount = useMemo(() => pagination.total, [pagination.total]);

  const error = useMemo(() => ({
    loadError: errors.global.find(e => e.code === 'LOAD_FAILED')?.message || null,
    filterError: errors.global.find(e => e.code === 'FILTER_FAILED')?.message || null,
    bulkError: errors.global.find(e => e.code === 'BULK_FAILED')?.message || null,
    hasError: errors.global.length > 0,
  }), [errors.global]);

  const selectedCollections = useMemo(() => 
    Array.from(selectedIds).map(id => 
      useCollectionStore.getState().collections.collections[id]
    ).filter(Boolean),
    [selectedIds]
  );

  const selection = useMemo(() => ({
    selectedIds,
    selectedCollections,
    selectedCount: selectedIds.size,
    allSelected: selectedIds.size > 0 && selectedIds.size === collectionIds.length,
    someSelected: selectedIds.size > 0 && selectedIds.size < collectionIds.length,
  }), [selectedIds, selectedCollections, collectionIds.length]);

  const performance = useMemo(() => ({
    lastLoadTime: performanceMetrics.fetchMetrics.averageFetchTime,
    averageRenderTime: performanceMetrics.renderMetrics.averageRenderTime,
    cacheHitRate: performanceMetrics.fetchMetrics.cacheHitRate,
  }), [performanceMetrics]);

  // =============================================================================
  // Filter Actions
  // =============================================================================

  const setFilter = useCallback((newFilter: CollectionFilter, options = {}) => {
    if (filterDebounceTimeout) {
      clearTimeout(filterDebounceTimeout);
    }

    const timeout = setTimeout(() => {
      storeActions.setFilter(newFilter, options);
    }, opts.filterDebounceTime);

    setFilterDebounceTimeout(timeout);
  }, [filterDebounceTimeout, storeActions, opts.filterDebounceTime]);

  const clearFilter = useCallback((preserveSearch = false) => {
    storeActions.clearFilter(preserveSearch);
  }, [storeActions]);

  const updateFilter = useCallback((updates: Partial<CollectionFilter>) => {
    const newFilter = { ...filter, ...updates };
    setFilter(newFilter);
  }, [filter, setFilter]);

  const applyFilterPreset = useCallback((presetId: string) => {
    const presets = useCollectionStore.getState().filterView.filterPresets;
    const preset = presets.find(p => p.id === presetId);
    
    if (preset) {
      storeActions.setFilter(preset.filter);
      if (preset.sort) {
        storeActions.setSort(preset.sort);
      }
    }
  }, [storeActions]);

  // =============================================================================
  // Sort Actions
  // =============================================================================

  const setSort = useCallback((newSort: CollectionSort, resetPagination = true) => {
    storeActions.setSort(newSort, resetPagination);
  }, [storeActions]);

  const toggleSort = useCallback((field: CollectionSort['field']) => {
    const newDirection = sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc';
    setSort({ field, direction: newDirection });
  }, [sort, setSort]);

  // =============================================================================
  // Pagination Actions
  // =============================================================================

  const setPagination = useCallback((newPagination: Partial<CollectionPagination>) => {
    storeActions.setPagination(newPagination);
  }, [storeActions]);

  const nextPage = useCallback(() => {
    if (pagination.page < pagination.totalPages - 1) {
      setPagination({ page: pagination.page + 1 });
    }
  }, [pagination, setPagination]);

  const previousPage = useCallback(() => {
    if (pagination.page > 0) {
      setPagination({ page: pagination.page - 1 });
    }
  }, [pagination, setPagination]);

  const goToPage = useCallback((page: number) => {
    if (page >= 0 && page < pagination.totalPages) {
      setPagination({ page });
    }
  }, [pagination.totalPages, setPagination]);

  const changePageSize = useCallback((pageSize: number) => {
    setPagination({ pageSize, page: 0 });
  }, [setPagination]);

  // =============================================================================
  // View Actions
  // =============================================================================

  const setViewConfig = useCallback((newViewConfig: Partial<CollectionViewConfig>) => {
    storeActions.setViewConfig(newViewConfig, true);
  }, [storeActions]);

  const changeViewMode = useCallback((mode: CollectionViewConfig['mode']) => {
    setViewConfig({ mode });
  }, [setViewConfig]);

  const changeDensity = useCallback((density: CollectionViewConfig['density']) => {
    setViewConfig({ density });
  }, [setViewConfig]);

  // =============================================================================
  // Data Actions
  // =============================================================================

  const load = useCallback(async (options = {}) => {
    try {
      if (options.forceRefresh) {
        setIsRefreshing(true);
      }

      await storeActions.loadCollections({
        filter,
        sort,
        pagination,
        ...options,
      });

    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [storeActions, filter, sort, pagination]);

  const refresh = useCallback(async () => {
    await load({ forceRefresh: true });
  }, [load]);

  const loadMore = useCallback(async () => {
    if (pagination.page < pagination.totalPages - 1) {
      await setPagination({ page: pagination.page + 1 });
    }
  }, [pagination, setPagination]);

  const reload = useCallback(async () => {
    await load();
  }, [load]);

  // =============================================================================
  // Selection Actions
  // =============================================================================

  const selectCollections = useCallback((ids: string[], mode = 'replace' as const) => {
    storeActions.selectCollections(ids, mode);
  }, [storeActions]);

  const selectAll = useCallback(() => {
    storeActions.selectAllCollections(true);
  }, [storeActions]);

  const clearSelection = useCallback(() => {
    storeActions.clearSelection();
  }, [storeActions]);

  const toggleSelection = useCallback((id: string) => {
    storeActions.selectCollections([id], 'toggle');
  }, [storeActions]);

  // =============================================================================
  // Bulk Operations
  // =============================================================================

  const startBulkOperation = useCallback(async (operation: any) => {
    return await storeActions.startBulkOperation(operation);
  }, [storeActions]);

  const cancelBulkOperation = useCallback(() => {
    const bulkOp = useCollectionStore.getState().operations.bulkOperation;
    if (bulkOp) {
      storeActions.cancelBulkOperation(bulkOp.id);
    }
  }, [storeActions]);

  // =============================================================================
  // Utilities
  // =============================================================================

  const getCollection = useCallback((id: string) => {
    return useCollectionStore.getState().collections.collections[id];
  }, []);

  const hasCollection = useCallback((id: string) => {
    return !!useCollectionStore.getState().collections.collections[id];
  }, []);

  const validateCollections = useCallback(async (ids?: string[]) => {
    const targetIds = ids || collectionIds;
    const results: ValidationResult[] = [];

    for (const id of targetIds) {
      // Mock validation - replace with actual validation logic
      results.push({
        isValid: true,
        errors: [],
        warnings: [],
      });
    }

    return results;
  }, [collectionIds]);

  // =============================================================================
  // Effects
  // =============================================================================

  // Auto-load on mount
  useEffect(() => {
    if (opts.autoLoad && isInitialLoading) {
      load();
    }
  }, [opts.autoLoad, isInitialLoading, load]);

  // Apply initial configuration
  useEffect(() => {
    if (opts.initialFilter && Object.keys(filter).length === 0) {
      storeActions.setFilter(opts.initialFilter);
    }
  }, [opts.initialFilter, filter, storeActions]);

  useEffect(() => {
    if (opts.initialSort && sort.field !== opts.initialSort.field) {
      storeActions.setSort(opts.initialSort);
    }
  }, [opts.initialSort, sort, storeActions]);

  useEffect(() => {
    if (opts.initialPagination) {
      storeActions.setPagination(opts.initialPagination);
    }
  }, [opts.initialPagination, storeActions]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (opts.enableRealtime) {
      storeActions.subscribeToUpdates();
      return () => storeActions.unsubscribeFromUpdates();
    }
  }, [opts.enableRealtime, storeActions]);

  // Cleanup debounce timeout
  useEffect(() => {
    return () => {
      if (filterDebounceTimeout) {
        clearTimeout(filterDebounceTimeout);
      }
    };
  }, [filterDebounceTimeout]);

  // =============================================================================
  // Return Interface
  // =============================================================================

  return {
    collections,
    collectionIds,
    totalCount,
    loading: {
      isLoading: loading.isLoading,
      isInitialLoading,
      isRefreshing,
      isLoadingMore: false,
      isBulkLoading: loading.isBulkLoading,
    },
    error,
    filter,
    sort,
    pagination,
    viewConfig,
    selection,
    performance,
    connectionStatus,

    // Filter Actions
    setFilter,
    clearFilter,
    updateFilter,
    applyFilterPreset,

    // Sort Actions
    setSort,
    toggleSort,

    // Pagination Actions
    setPagination,
    nextPage,
    previousPage,
    goToPage,
    changePageSize,

    // View Actions
    setViewConfig,
    changeViewMode,
    changeDensity,

    // Data Actions
    load,
    refresh,
    loadMore,
    reload,

    // Selection Actions
    selectCollections,
    selectAll,
    clearSelection,
    toggleSelection,

    // Bulk Operations
    startBulkOperation,
    cancelBulkOperation,

    // Utilities
    getCollection,
    hasCollection,
    validateCollections,
  };
};