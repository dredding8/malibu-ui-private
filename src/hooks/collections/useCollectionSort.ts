/**
 * Collection Sort Hook
 * 
 * Hook for managing sorting logic with multi-column sorting,
 * custom sort functions, and performance optimization.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import { useCallback, useMemo, useEffect } from 'react';
import { useCollectionStore } from '../../store/collectionStore';
import {
  Collection,
  CollectionSort,
  StatusDimensions,
} from '../../types/collection.types';

// =============================================================================
// Sort Configuration Types
// =============================================================================

export interface SortOption {
  field: string;
  label: string;
  description?: string;
  sortFunction?: (a: Collection, b: Collection, direction: 'asc' | 'desc') => number;
  defaultDirection: 'asc' | 'desc';
  group?: string;
  icon?: string;
}

export interface MultiSort {
  sorts: CollectionSort[];
  enabled: boolean;
}

export interface SortPreset {
  id: string;
  name: string;
  description?: string;
  sorts: CollectionSort[];
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
  usageCount: number;
}

// =============================================================================
// Hook Options Interface
// =============================================================================

export interface UseCollectionSortOptions {
  /** Enable multi-column sorting */
  enableMultiSort?: boolean;
  /** Maximum number of sort columns */
  maxSortColumns?: number;
  /** Enable sort presets */
  enablePresets?: boolean;
  /** Auto-apply sort changes */
  autoApply?: boolean;
  /** Enable custom sort functions */
  enableCustomSorts?: boolean;
  /** Enable sort analytics */
  enableAnalytics?: boolean;
  /** Default sort configuration */
  defaultSort?: CollectionSort;
  /** Performance optimization mode */
  optimizeForLargeDatasets?: boolean;
}

// =============================================================================
// Hook Return Type
// =============================================================================

export interface UseCollectionSortReturn {
  /** Current sort configuration */
  sort: CollectionSort;
  /** Multi-sort configuration */
  multiSort: MultiSort;
  /** Available sort options */
  sortOptions: SortOption[];
  /** Sort presets */
  presets: {
    available: SortPreset[];
    active: SortPreset | null;
    default: SortPreset | null;
  };
  /** Sort performance metrics */
  performance: {
    lastSortTime: number;
    averageSortTime: number;
    sortCount: number;
  };

  // Basic Sort Actions
  /** Set sort configuration */
  setSort: (sort: CollectionSort) => void;
  /** Toggle sort direction for field */
  toggleSort: (field: string) => void;
  /** Clear all sorting */
  clearSort: () => void;
  /** Reset to default sort */
  resetToDefault: () => void;

  // Multi-Sort Actions
  /** Add sort column */
  addSort: (field: string, direction?: 'asc' | 'desc') => void;
  /** Remove sort column */
  removeSort: (field: string) => void;
  /** Update sort at specific index */
  updateSort: (index: number, sort: CollectionSort) => void;
  /** Reorder sort columns */
  reorderSorts: (fromIndex: number, toIndex: number) => void;
  /** Enable/disable multi-sort */
  setMultiSortEnabled: (enabled: boolean) => void;

  // Preset Management
  /** Save current sort as preset */
  saveAsPreset: (name: string, description?: string, isDefault?: boolean) => Promise<SortPreset>;
  /** Apply sort preset */
  applyPreset: (presetId: string) => void;
  /** Delete sort preset */
  deletePreset: (presetId: string) => Promise<void>;
  /** Set default preset */
  setDefaultPreset: (presetId: string) => void;

  // Sorting Utilities
  /** Sort collections manually */
  sortCollections: (collections: Collection[], sortConfig?: CollectionSort) => Collection[];
  /** Get sort function for field */
  getSortFunction: (field: string) => ((a: Collection, b: Collection, direction: 'asc' | 'desc') => number) | null;
  /** Register custom sort function */
  registerSortFunction: (field: string, sortFn: (a: Collection, b: Collection, direction: 'asc' | 'desc') => number) => void;
  /** Get sort indicator (none, asc, desc) */
  getSortIndicator: (field: string) => 'none' | 'asc' | 'desc';
  /** Check if field is sortable */
  isSortable: (field: string) => boolean;

  // Analytics
  /** Get sort usage statistics */
  getSortStats: () => Record<string, { count: number; avgTime: number }>;
  /** Get most used sorts */
  getMostUsedSorts: () => Array<{ sort: CollectionSort; count: number }>;
}

// =============================================================================
// Default Options
// =============================================================================

const defaultOptions: UseCollectionSortOptions = {
  enableMultiSort: true,
  maxSortColumns: 3,
  enablePresets: true,
  autoApply: true,
  enableCustomSorts: true,
  enableAnalytics: true,
  optimizeForLargeDatasets: false,
  defaultSort: {
    field: 'updatedAt',
    direction: 'desc',
  },
};

// =============================================================================
// Built-in Sort Options
// =============================================================================

const getDefaultSortOptions = (): SortOption[] => [
  {
    field: 'name',
    label: 'Name',
    description: 'Sort by collection name',
    defaultDirection: 'asc',
    group: 'Basic',
    icon: 'sort-alphabetical',
  },
  {
    field: 'type',
    label: 'Type',
    description: 'Sort by collection type',
    defaultDirection: 'asc',
    group: 'Basic',
    icon: 'tag',
  },
  {
    field: 'createdAt',
    label: 'Created Date',
    description: 'Sort by creation date',
    defaultDirection: 'desc',
    group: 'Dates',
    icon: 'calendar',
  },
  {
    field: 'updatedAt',
    label: 'Last Updated',
    description: 'Sort by last modification date',
    defaultDirection: 'desc',
    group: 'Dates',
    icon: 'time',
  },
  {
    field: 'status.health',
    label: 'Health Score',
    description: 'Sort by collection health score',
    defaultDirection: 'desc',
    group: 'Status',
    icon: 'heart',
  },
  {
    field: 'status.operational',
    label: 'Operational Status',
    description: 'Sort by operational status',
    defaultDirection: 'asc',
    group: 'Status',
    icon: 'dashboard',
    sortFunction: (a, b, direction) => {
      const statusOrder = { critical: 0, degraded: 1, nominal: 2 };
      const aValue = statusOrder[a.status.operational];
      const bValue = statusOrder[b.status.operational];
      return direction === 'asc' ? aValue - bValue : bValue - aValue;
    },
  },
  {
    field: 'status.priority',
    label: 'Priority',
    description: 'Sort by priority level',
    defaultDirection: 'desc',
    group: 'Status',
    icon: 'flag',
    sortFunction: (a, b, direction) => {
      const priorityOrder = { routine: 0, elevated: 1, urgent: 2 };
      const aValue = priorityOrder[a.status.priority];
      const bValue = priorityOrder[b.status.priority];
      return direction === 'asc' ? aValue - bValue : bValue - aValue;
    },
  },
  {
    field: 'status.conflicts',
    label: 'Conflicts',
    description: 'Sort by number of conflicts',
    defaultDirection: 'desc',
    group: 'Status',
    icon: 'warning-sign',
  },
  {
    field: 'metadata.progress',
    label: 'Progress',
    description: 'Sort by completion progress',
    defaultDirection: 'desc',
    group: 'Metadata',
    icon: 'progress',
  },
  {
    field: 'metadata.criticality',
    label: 'Criticality',
    description: 'Sort by mission criticality',
    defaultDirection: 'desc',
    group: 'Metadata',
    icon: 'star',
    sortFunction: (a, b, direction) => {
      const criticalityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
      const aValue = criticalityOrder[a.metadata.criticality];
      const bValue = criticalityOrder[b.metadata.criticality];
      return direction === 'asc' ? aValue - bValue : bValue - aValue;
    },
  },
  {
    field: 'createdBy',
    label: 'Created By',
    description: 'Sort by creator name',
    defaultDirection: 'asc',
    group: 'Users',
    icon: 'person',
  },
  {
    field: 'updatedBy',
    label: 'Updated By',
    description: 'Sort by last modifier name',
    defaultDirection: 'asc',
    group: 'Users',
    icon: 'person',
  },
];

// =============================================================================
// Sort Helper Functions
// =============================================================================

const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

const compareValues = (a: any, b: any, direction: 'asc' | 'desc'): number => {
  // Handle null/undefined values
  if (a == null && b == null) return 0;
  if (a == null) return direction === 'asc' ? -1 : 1;
  if (b == null) return direction === 'asc' ? 1 : -1;

  // Handle different types
  if (typeof a === 'string' && typeof b === 'string') {
    const result = a.localeCompare(b, undefined, { sensitivity: 'base' });
    return direction === 'asc' ? result : -result;
  }

  if (typeof a === 'number' && typeof b === 'number') {
    const result = a - b;
    return direction === 'asc' ? result : -result;
  }

  if (a instanceof Date && b instanceof Date) {
    const result = a.getTime() - b.getTime();
    return direction === 'asc' ? result : -result;
  }

  // Default string comparison
  const aStr = String(a);
  const bStr = String(b);
  const result = aStr.localeCompare(bStr);
  return direction === 'asc' ? result : -result;
};

const defaultSortFunction = (
  a: Collection,
  b: Collection,
  field: string,
  direction: 'asc' | 'desc'
): number => {
  const aValue = getNestedValue(a, field);
  const bValue = getNestedValue(b, field);
  return compareValues(aValue, bValue, direction);
};

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for collection sorting
 * 
 * @param options - Hook configuration options
 * @returns Collection sorting interface
 * 
 * @example
 * ```tsx
 * const {
 *   sort,
 *   multiSort,
 *   sortOptions,
 *   setSort,
 *   toggleSort,
 *   addSort,
 *   removeSort,
 *   presets,
 *   saveAsPreset,
 *   sortCollections
 * } = useCollectionSort({
 *   enableMultiSort: true,
 *   maxSortColumns: 3,
 *   enablePresets: true
 * });
 * 
 * const handleColumnClick = (field: string) => {
 *   if (multiSort.enabled) {
 *     addSort(field);
 *   } else {
 *     toggleSort(field);
 *   }
 * };
 * ```
 */
export const useCollectionSort = (
  options: UseCollectionSortOptions = {}
): UseCollectionSortReturn => {
  const opts = { ...defaultOptions, ...options };

  // =============================================================================
  // Store Selectors
  // =============================================================================

  const sort = useCollectionStore(state => state.filterView.sort);
  const collections = useCollectionStore(state => 
    Object.values(state.collections.collections)
  );

  // =============================================================================
  // Store Actions
  // =============================================================================

  const storeActions = useCollectionStore(state => ({
    setSort: state.setSort,
  }));

  // =============================================================================
  // Local State
  // =============================================================================

  const sortOptions = useMemo(() => getDefaultSortOptions(), []);
  const customSortFunctions = useMemo(() => new Map<string, (a: Collection, b: Collection, direction: 'asc' | 'desc') => number>(), []);

  // =============================================================================
  // Multi-Sort State (stored in component state for now)
  // =============================================================================

  const [multiSort, setMultiSort] = useCollectionStore(state => [
    { 
      sorts: state.filterView.sort.secondary ? [state.filterView.sort, { field: state.filterView.sort.secondary.field, direction: state.filterView.sort.secondary.direction }] : [state.filterView.sort],
      enabled: !!state.filterView.sort.secondary 
    },
    (newMultiSort: MultiSort) => {
      if (newMultiSort.enabled && newMultiSort.sorts.length > 0) {
        const [primary, ...rest] = newMultiSort.sorts;
        state.setSort({
          ...primary,
          secondary: rest.length > 0 ? rest[0] : undefined,
        });
      } else {
        state.setSort(newMultiSort.sorts[0] || opts.defaultSort!);
      }
    }
  ]);

  // =============================================================================
  // Computed Values
  // =============================================================================

  const presets = useMemo(() => ({
    available: [], // Would be loaded from store or API
    active: null,
    default: null,
  }), []);

  const performance = useMemo(() => ({
    lastSortTime: 0,
    averageSortTime: 0,
    sortCount: 0,
  }), []);

  // =============================================================================
  // Basic Sort Actions
  // =============================================================================

  const setSort = useCallback((newSort: CollectionSort) => {
    storeActions.setSort(newSort);
  }, [storeActions]);

  const toggleSort = useCallback((field: string) => {
    if (sort.field === field) {
      // Same field, toggle direction
      const newDirection = sort.direction === 'asc' ? 'desc' : 'asc';
      setSort({ field, direction: newDirection });
    } else {
      // Different field, use default direction
      const option = sortOptions.find(opt => opt.field === field);
      const defaultDirection = option?.defaultDirection || 'asc';
      setSort({ field, direction: defaultDirection });
    }
  }, [sort, sortOptions, setSort]);

  const clearSort = useCallback(() => {
    setSort(opts.defaultSort!);
  }, [setSort, opts.defaultSort]);

  const resetToDefault = useCallback(() => {
    setSort(opts.defaultSort!);
  }, [setSort, opts.defaultSort]);

  // =============================================================================
  // Multi-Sort Actions
  // =============================================================================

  const addSort = useCallback((field: string, direction?: 'asc' | 'desc') => {
    if (!opts.enableMultiSort) return;

    const option = sortOptions.find(opt => opt.field === field);
    const sortDirection = direction || option?.defaultDirection || 'asc';
    const newSort: CollectionSort = { field, direction: sortDirection };

    const currentSorts = multiSort.sorts.filter(s => s.field !== field);
    const newSorts = [newSort, ...currentSorts].slice(0, opts.maxSortColumns);

    setMultiSort({
      sorts: newSorts,
      enabled: true,
    });
  }, [opts.enableMultiSort, opts.maxSortColumns, sortOptions, multiSort.sorts, setMultiSort]);

  const removeSort = useCallback((field: string) => {
    const newSorts = multiSort.sorts.filter(s => s.field !== field);
    
    if (newSorts.length === 0) {
      setMultiSort({
        sorts: [opts.defaultSort!],
        enabled: false,
      });
    } else {
      setMultiSort({
        sorts: newSorts,
        enabled: newSorts.length > 1,
      });
    }
  }, [multiSort.sorts, setMultiSort, opts.defaultSort]);

  const updateSort = useCallback((index: number, newSort: CollectionSort) => {
    if (index < 0 || index >= multiSort.sorts.length) return;

    const newSorts = [...multiSort.sorts];
    newSorts[index] = newSort;

    setMultiSort({
      sorts: newSorts,
      enabled: multiSort.enabled,
    });
  }, [multiSort, setMultiSort]);

  const reorderSorts = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const newSorts = [...multiSort.sorts];
    const [movedItem] = newSorts.splice(fromIndex, 1);
    newSorts.splice(toIndex, 0, movedItem);

    setMultiSort({
      sorts: newSorts,
      enabled: multiSort.enabled,
    });
  }, [multiSort, setMultiSort]);

  const setMultiSortEnabled = useCallback((enabled: boolean) => {
    if (!opts.enableMultiSort && enabled) return;

    setMultiSort({
      sorts: enabled ? multiSort.sorts : [multiSort.sorts[0] || opts.defaultSort!],
      enabled,
    });
  }, [opts.enableMultiSort, multiSort.sorts, setMultiSort, opts.defaultSort]);

  // =============================================================================
  // Preset Management
  // =============================================================================

  const saveAsPreset = useCallback(async (
    name: string,
    description = '',
    isDefault = false
  ): Promise<SortPreset> => {
    const preset: SortPreset = {
      id: `sort-preset-${Date.now()}`,
      name,
      description,
      sorts: multiSort.enabled ? multiSort.sorts : [sort],
      isDefault,
      createdBy: 'current-user', // Replace with actual user ID
      createdAt: new Date(),
      usageCount: 0,
    };

    // Would save to store or API
    return preset;
  }, [multiSort, sort]);

  const applyPreset = useCallback((presetId: string) => {
    const preset = presets.available.find(p => p.id === presetId);
    if (preset) {
      if (preset.sorts.length === 1) {
        setSort(preset.sorts[0]);
      } else {
        setMultiSort({
          sorts: preset.sorts,
          enabled: true,
        });
      }
    }
  }, [presets.available, setSort, setMultiSort]);

  const deletePreset = useCallback(async (presetId: string) => {
    // Would delete from store or API
  }, []);

  const setDefaultPreset = useCallback((presetId: string) => {
    // Would update in store or API
  }, []);

  // =============================================================================
  // Sorting Utilities
  // =============================================================================

  const getSortFunction = useCallback((field: string) => {
    // Check for custom sort function
    if (customSortFunctions.has(field)) {
      return customSortFunctions.get(field)!;
    }

    // Check for built-in sort function
    const option = sortOptions.find(opt => opt.field === field);
    if (option?.sortFunction) {
      return option.sortFunction;
    }

    // Return default sort function
    return (a: Collection, b: Collection, direction: 'asc' | 'desc') => 
      defaultSortFunction(a, b, field, direction);
  }, [customSortFunctions, sortOptions]);

  const sortCollections = useCallback((
    collectionsToSort: Collection[],
    sortConfig = sort
  ): Collection[] => {
    const startTime = performance.now();

    let sortedCollections = [...collectionsToSort];

    if (multiSort.enabled && multiSort.sorts.length > 1) {
      // Multi-column sort
      sortedCollections.sort((a, b) => {
        for (const sortItem of multiSort.sorts) {
          const sortFn = getSortFunction(sortItem.field);
          const result = sortFn(a, b, sortItem.direction);
          if (result !== 0) return result;
        }
        return 0;
      });
    } else {
      // Single column sort
      const sortFn = getSortFunction(sortConfig.field);
      sortedCollections.sort((a, b) => sortFn(a, b, sortConfig.direction));
    }

    const endTime = performance.now();
    const sortTime = endTime - startTime;

    // Update performance metrics
    useCollectionStore.getState().updatePerformanceMetrics({
      operationLatency: sortTime,
    });

    return sortedCollections;
  }, [sort, multiSort, getSortFunction]);

  const registerSortFunction = useCallback((
    field: string,
    sortFn: (a: Collection, b: Collection, direction: 'asc' | 'desc') => number
  ) => {
    if (!opts.enableCustomSorts) return;
    customSortFunctions.set(field, sortFn);
  }, [opts.enableCustomSorts, customSortFunctions]);

  const getSortIndicator = useCallback((field: string): 'none' | 'asc' | 'desc' => {
    if (multiSort.enabled) {
      const sortItem = multiSort.sorts.find(s => s.field === field);
      return sortItem ? sortItem.direction : 'none';
    } else {
      return sort.field === field ? sort.direction : 'none';
    }
  }, [sort, multiSort]);

  const isSortable = useCallback((field: string): boolean => {
    return sortOptions.some(opt => opt.field === field) || customSortFunctions.has(field);
  }, [sortOptions, customSortFunctions]);

  // =============================================================================
  // Analytics
  // =============================================================================

  const getSortStats = useCallback(() => {
    // Would return analytics data from store
    return {};
  }, []);

  const getMostUsedSorts = useCallback(() => {
    // Would return most used sorts from analytics
    return [];
  }, []);

  // =============================================================================
  // Effects
  // =============================================================================

  // Initialize multi-sort state from store
  useEffect(() => {
    const hasSecondary = !!sort.secondary;
    if (hasSecondary !== multiSort.enabled) {
      setMultiSort({
        sorts: hasSecondary ? [sort, sort.secondary!] : [sort],
        enabled: hasSecondary,
      });
    }
  }, [sort, multiSort.enabled, setMultiSort]);

  // =============================================================================
  // Return Interface
  // =============================================================================

  return {
    sort,
    multiSort,
    sortOptions,
    presets,
    performance,

    // Basic Sort Actions
    setSort,
    toggleSort,
    clearSort,
    resetToDefault,

    // Multi-Sort Actions
    addSort,
    removeSort,
    updateSort,
    reorderSorts,
    setMultiSortEnabled,

    // Preset Management
    saveAsPreset,
    applyPreset,
    deletePreset,
    setDefaultPreset,

    // Sorting Utilities
    sortCollections,
    getSortFunction,
    registerSortFunction,
    getSortIndicator,
    isSortable,

    // Analytics
    getSortStats,
    getMostUsedSorts,
  };
};