/**
 * Collection Filters Hook
 * 
 * Hook for managing complex filtering logic with smart suggestions,
 * filter presets, and performance optimization.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import { useCallback, useMemo, useEffect, useState } from 'react';
import { useCollectionStore } from '../../store/collectionStore';
import {
  Collection,
  CollectionFilter,
  CollectionType,
  StatusDimensions,
} from '../../types/collection.types';

// =============================================================================
// Filter Builder Types
// =============================================================================

export interface FilterCondition {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'between' | 'exists' | 'not';
  value: any;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array';
}

export interface FilterGroup {
  conditions: FilterCondition[];
  operator: 'and' | 'or';
  groups?: FilterGroup[];
}

export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filter: CollectionFilter;
  isGlobal: boolean;
  createdBy: string;
  createdAt: Date;
  usageCount: number;
  tags: string[];
}

export interface FilterSuggestion {
  id: string;
  label: string;
  description?: string;
  filter: Partial<CollectionFilter>;
  confidence: number;
  source: 'history' | 'ai' | 'template' | 'user';
}

// =============================================================================
// Hook Options Interface
// =============================================================================

export interface UseCollectionFiltersOptions {
  /** Enable smart filter suggestions */
  enableSuggestions?: boolean;
  /** Enable filter presets */
  enablePresets?: boolean;
  /** Auto-apply filters on change */
  autoApply?: boolean;
  /** Debounce time for auto-apply (ms) */
  debounceTime?: number;
  /** Maximum number of recent filters to store */
  maxRecentFilters?: number;
  /** Enable advanced filtering */
  enableAdvancedFilters?: boolean;
  /** Enable filter validation */
  validateFilters?: boolean;
  /** Enable filter analytics */
  enableAnalytics?: boolean;
}

// =============================================================================
// Hook Return Type
// =============================================================================

export interface UseCollectionFiltersReturn {
  /** Current active filter */
  filter: CollectionFilter;
  /** Applied filter (may differ during debounce) */
  appliedFilter: CollectionFilter;
  /** Filter is being applied */
  isApplying: boolean;
  /** Filter has changes not yet applied */
  hasUnappliedChanges: boolean;
  /** Number of collections matching current filter */
  matchingCount: number;
  /** Total collections count */
  totalCount: number;

  /** Filter presets */
  presets: {
    /** Available presets */
    available: FilterPreset[];
    /** Currently active preset */
    active: FilterPreset | null;
    /** User's saved presets */
    userPresets: FilterPreset[];
    /** Global/system presets */
    globalPresets: FilterPreset[];
  };

  /** Filter suggestions */
  suggestions: {
    /** Current suggestions */
    current: FilterSuggestion[];
    /** Recent filters */
    recent: CollectionFilter[];
    /** Popular filters */
    popular: CollectionFilter[];
    /** Smart suggestions based on context */
    smart: FilterSuggestion[];
  };

  /** Filter statistics */
  stats: {
    /** Most used filters */
    mostUsed: Array<{ filter: CollectionFilter; count: number }>;
    /** Filter performance metrics */
    performance: Array<{ filter: CollectionFilter; time: number }>;
    /** Filter effectiveness */
    effectiveness: Array<{ filter: CollectionFilter; selectivity: number }>;
  };

  // Basic Filter Actions
  /** Set complete filter */
  setFilter: (filter: CollectionFilter) => void;
  /** Clear all filters */
  clearFilter: (preserveSearch?: boolean) => void;
  /** Update filter partially */
  updateFilter: (updates: Partial<CollectionFilter>) => void;
  /** Apply current filter */
  applyFilter: () => void;
  /** Reset to last applied filter */
  resetFilter: () => void;

  // Search Actions
  /** Set search query */
  setSearch: (query: string) => void;
  /** Clear search */
  clearSearch: () => void;
  /** Add to search history */
  addToSearchHistory: (query: string) => void;

  // Field-Specific Filters
  /** Filter by collection types */
  filterByTypes: (types: CollectionType[]) => void;
  /** Filter by status */
  filterByStatus: (status: Partial<StatusDimensions>) => void;
  /** Filter by tags */
  filterByTags: (tags: string[]) => void;
  /** Filter by date range */
  filterByDateRange: (field: 'createdAt' | 'updatedAt', start?: Date, end?: Date) => void;
  /** Filter by users */
  filterByUsers: (field: 'createdBy' | 'updatedBy', users: string[]) => void;
  /** Filter by metadata */
  filterByMetadata: (key: string, value: any) => void;

  // Advanced Filters
  /** Build complex filter */
  buildFilter: (groups: FilterGroup[]) => CollectionFilter;
  /** Parse filter to conditions */
  parseFilter: (filter: CollectionFilter) => FilterGroup[];
  /** Validate filter */
  validateFilter: (filter: CollectionFilter) => { isValid: boolean; errors: string[] };

  // Preset Management
  /** Save current filter as preset */
  saveAsPreset: (name: string, description?: string, isGlobal?: boolean) => Promise<FilterPreset>;
  /** Apply filter preset */
  applyPreset: (presetId: string) => void;
  /** Delete filter preset */
  deletePreset: (presetId: string) => Promise<void>;
  /** Update filter preset */
  updatePreset: (presetId: string, updates: Partial<FilterPreset>) => Promise<void>;

  // Suggestion Management
  /** Get suggestions for partial filter */
  getSuggestions: (partial: Partial<CollectionFilter>) => FilterSuggestion[];
  /** Apply suggestion */
  applySuggestion: (suggestionId: string) => void;
  /** Dismiss suggestion */
  dismissSuggestion: (suggestionId: string) => void;

  // Quick Filters
  /** Get quick filter options */
  getQuickFilters: () => Array<{ label: string; filter: CollectionFilter; count: number }>;
  /** Apply quick filter */
  applyQuickFilter: (filter: CollectionFilter) => void;

  // Utilities
  /** Check if collections match filter */
  matches: (collections: Collection[], filter?: CollectionFilter) => Collection[];
  /** Get filter summary text */
  getFilterSummary: (filter?: CollectionFilter) => string;
  /** Export filter configuration */
  exportFilter: (filter?: CollectionFilter) => string;
  /** Import filter configuration */
  importFilter: (filterString: string) => CollectionFilter | null;
}

// =============================================================================
// Default Options
// =============================================================================

const defaultOptions: UseCollectionFiltersOptions = {
  enableSuggestions: true,
  enablePresets: true,
  autoApply: true,
  debounceTime: 300,
  maxRecentFilters: 10,
  enableAdvancedFilters: true,
  validateFilters: true,
  enableAnalytics: true,
};

// =============================================================================
// Helper Functions
// =============================================================================

const matchesFilter = (collection: Collection, filter: CollectionFilter): boolean => {
  // Search filter
  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    const searchableText = `${collection.name} ${collection.description} ${collection.tags.join(' ')}`.toLowerCase();
    if (!searchableText.includes(searchLower)) {
      return false;
    }
  }

  // Type filter
  if (filter.types && !filter.types.includes(collection.type)) {
    return false;
  }

  // Status filters
  if (filter.status) {
    if (filter.status.operational && !filter.status.operational.includes(collection.status.operational)) {
      return false;
    }
    if (filter.status.capacity && !filter.status.capacity.includes(collection.status.capacity)) {
      return false;
    }
    if (filter.status.priority && !filter.status.priority.includes(collection.status.priority)) {
      return false;
    }
    if (filter.status.healthRange) {
      const [min, max] = filter.status.healthRange;
      if (collection.status.health < min || collection.status.health > max) {
        return false;
      }
    }
  }

  // Metadata filters
  if (filter.metadata) {
    if (filter.metadata.classification && !filter.metadata.classification.includes(collection.metadata.classification)) {
      return false;
    }
    if (filter.metadata.criticality && !filter.metadata.criticality.includes(collection.metadata.criticality)) {
      return false;
    }
    if (filter.metadata.progressRange) {
      const [min, max] = filter.metadata.progressRange;
      if (collection.metadata.progress < min || collection.metadata.progress > max) {
        return false;
      }
    }
  }

  // Date range filters
  if (filter.dateRange) {
    if (filter.dateRange.createdAfter && collection.createdAt < filter.dateRange.createdAfter) {
      return false;
    }
    if (filter.dateRange.createdBefore && collection.createdAt > filter.dateRange.createdBefore) {
      return false;
    }
    if (filter.dateRange.updatedAfter && collection.updatedAt < filter.dateRange.updatedAfter) {
      return false;
    }
    if (filter.dateRange.updatedBefore && collection.updatedAt > filter.dateRange.updatedBefore) {
      return false;
    }
  }

  // Tags filter
  if (filter.tags && filter.tags.length > 0) {
    const hasMatchingTag = filter.tags.some(tag => collection.tags.includes(tag));
    if (!hasMatchingTag) {
      return false;
    }
  }

  // User filters
  if (filter.users) {
    if (filter.users.createdBy && !filter.users.createdBy.includes(collection.createdBy)) {
      return false;
    }
    if (filter.users.updatedBy && !filter.users.updatedBy.includes(collection.updatedBy)) {
      return false;
    }
  }

  return true;
};

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for collection filtering and search
 * 
 * @param options - Hook configuration options
 * @returns Collection filters interface
 * 
 * @example
 * ```tsx
 * const {
 *   filter,
 *   matchingCount,
 *   setFilter,
 *   clearFilter,
 *   filterByTypes,
 *   filterByStatus,
 *   presets,
 *   suggestions,
 *   saveAsPreset,
 *   applyPreset
 * } = useCollectionFilters({
 *   enableSuggestions: true,
 *   enablePresets: true,
 *   autoApply: true
 * });
 * 
 * return (
 *   <div>
 *     <FilterToolbar
 *       filter={filter}
 *       onFilterChange={setFilter}
 *       onClear={clearFilter}
 *       suggestions={suggestions.current}
 *       presets={presets.available}
 *     />
 *     <div>Showing {matchingCount} collections</div>
 *   </div>
 * );
 * ```
 */
export const useCollectionFilters = (
  options: UseCollectionFiltersOptions = {}
): UseCollectionFiltersReturn => {
  const opts = { ...defaultOptions, ...options };

  // =============================================================================
  // Local State
  // =============================================================================

  const [appliedFilter, setAppliedFilter] = useState<CollectionFilter>({});
  const [isApplying, setIsApplying] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  // =============================================================================
  // Store Selectors
  // =============================================================================

  const filter = useCollectionStore(state => state.filterView.filter);
  const allCollections = useCollectionStore(state => 
    Object.values(state.collections.collections)
  );
  const filterPresets = useCollectionStore(state => state.filterView.filterPresets);
  const searchHistory = useCollectionStore(state => state.filterView.searchHistory);
  const quickFilters = useCollectionStore(state => state.filterView.quickFilters);

  // =============================================================================
  // Store Actions
  // =============================================================================

  const storeActions = useCollectionStore(state => ({
    setFilter: state.setFilter,
    clearFilter: state.clearFilter,
    updateFilter: (updates: Partial<CollectionFilter>) => {
      state.setFilter({ ...state.filterView.filter, ...updates });
    },
  }));

  // =============================================================================
  // Computed Values
  // =============================================================================

  const matchingCollections = useMemo(() => 
    allCollections.filter(collection => matchesFilter(collection, appliedFilter)),
    [allCollections, appliedFilter]
  );

  const matchingCount = useMemo(() => matchingCollections.length, [matchingCollections]);
  const totalCount = useMemo(() => allCollections.length, [allCollections]);

  const hasUnappliedChanges = useMemo(() => 
    JSON.stringify(filter) !== JSON.stringify(appliedFilter),
    [filter, appliedFilter]
  );

  const presets = useMemo(() => ({
    available: filterPresets,
    active: filterPresets.find(p => JSON.stringify(p.filter) === JSON.stringify(filter)) || null,
    userPresets: filterPresets.filter(p => !p.isGlobal),
    globalPresets: filterPresets.filter(p => p.isGlobal),
  }), [filterPresets, filter]);

  const suggestions = useMemo(() => ({
    current: quickFilters.recommendations,
    recent: quickFilters.recent,
    popular: [], // Would be computed from analytics
    smart: quickFilters.recommendations.filter(r => r.source === 'ai'),
  }), [quickFilters]);

  const stats = useMemo(() => ({
    mostUsed: [], // Would be computed from analytics
    performance: [], // Would be computed from performance data
    effectiveness: [], // Would be computed from selectivity metrics
  }), []);

  // =============================================================================
  // Basic Filter Actions
  // =============================================================================

  const setFilter = useCallback((newFilter: CollectionFilter) => {
    storeActions.setFilter(newFilter);
    
    if (opts.autoApply) {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      const timeout = setTimeout(() => {
        setIsApplying(true);
        setAppliedFilter(newFilter);
        setIsApplying(false);
      }, opts.debounceTime);

      setDebounceTimeout(timeout);
    }
  }, [storeActions, opts.autoApply, opts.debounceTime, debounceTimeout]);

  const clearFilter = useCallback((preserveSearch = false) => {
    const clearedFilter = preserveSearch && filter.search ? { search: filter.search } : {};
    setFilter(clearedFilter);
  }, [filter.search, setFilter]);

  const updateFilter = useCallback((updates: Partial<CollectionFilter>) => {
    const newFilter = { ...filter, ...updates };
    setFilter(newFilter);
  }, [filter, setFilter]);

  const applyFilter = useCallback(() => {
    setIsApplying(true);
    setAppliedFilter(filter);
    setIsApplying(false);
  }, [filter]);

  const resetFilter = useCallback(() => {
    storeActions.setFilter(appliedFilter);
  }, [appliedFilter, storeActions]);

  // =============================================================================
  // Search Actions
  // =============================================================================

  const setSearch = useCallback((query: string) => {
    updateFilter({ search: query });
  }, [updateFilter]);

  const clearSearch = useCallback(() => {
    updateFilter({ search: undefined });
  }, [updateFilter]);

  const addToSearchHistory = useCallback((query: string) => {
    useCollectionStore.setState(state => {
      const history = state.filterView.searchHistory;
      if (!history.includes(query)) {
        history.unshift(query);
        if (history.length > opts.maxRecentFilters) {
          history.pop();
        }
      }
    });
  }, [opts.maxRecentFilters]);

  // =============================================================================
  // Field-Specific Filters
  // =============================================================================

  const filterByTypes = useCallback((types: CollectionType[]) => {
    updateFilter({ types });
  }, [updateFilter]);

  const filterByStatus = useCallback((status: Partial<StatusDimensions>) => {
    updateFilter({ 
      status: { ...filter.status, ...status }
    });
  }, [updateFilter, filter.status]);

  const filterByTags = useCallback((tags: string[]) => {
    updateFilter({ tags });
  }, [updateFilter]);

  const filterByDateRange = useCallback((
    field: 'createdAt' | 'updatedAt',
    start?: Date,
    end?: Date
  ) => {
    const dateRangeKey = field === 'createdAt' ? 'createdAfter' : 'updatedAfter';
    const dateRangeEndKey = field === 'createdAt' ? 'createdBefore' : 'updatedBefore';
    
    updateFilter({
      dateRange: {
        ...filter.dateRange,
        [dateRangeKey]: start,
        [dateRangeEndKey]: end,
      }
    });
  }, [updateFilter, filter.dateRange]);

  const filterByUsers = useCallback((
    field: 'createdBy' | 'updatedBy',
    users: string[]
  ) => {
    updateFilter({
      users: {
        ...filter.users,
        [field]: users,
      }
    });
  }, [updateFilter, filter.users]);

  const filterByMetadata = useCallback((key: string, value: any) => {
    updateFilter({
      metadata: {
        ...filter.metadata,
        [key]: value,
      }
    });
  }, [updateFilter, filter.metadata]);

  // =============================================================================
  // Advanced Filters
  // =============================================================================

  const buildFilter = useCallback((groups: FilterGroup[]): CollectionFilter => {
    // Convert filter groups to CollectionFilter format
    // This is a simplified implementation - would need more complex logic
    const builtFilter: CollectionFilter = {};
    
    groups.forEach(group => {
      group.conditions.forEach(condition => {
        switch (condition.field) {
          case 'type':
            builtFilter.types = Array.isArray(condition.value) ? condition.value : [condition.value];
            break;
          case 'search':
            builtFilter.search = condition.value;
            break;
          // Add more field mappings as needed
        }
      });
    });

    return builtFilter;
  }, []);

  const parseFilter = useCallback((filterToParse: CollectionFilter): FilterGroup[] => {
    // Convert CollectionFilter to filter groups format
    const groups: FilterGroup[] = [];
    const conditions: FilterCondition[] = [];

    if (filterToParse.search) {
      conditions.push({
        field: 'search',
        operator: 'contains',
        value: filterToParse.search,
        type: 'string',
      });
    }

    if (filterToParse.types) {
      conditions.push({
        field: 'type',
        operator: 'in',
        value: filterToParse.types,
        type: 'array',
      });
    }

    if (conditions.length > 0) {
      groups.push({
        conditions,
        operator: 'and',
      });
    }

    return groups;
  }, []);

  const validateFilter = useCallback((filterToValidate: CollectionFilter) => {
    const errors: string[] = [];

    // Basic validation rules
    if (filterToValidate.status?.healthRange) {
      const [min, max] = filterToValidate.status.healthRange;
      if (min < 0 || max > 100 || min > max) {
        errors.push('Health range must be between 0-100 with min <= max');
      }
    }

    if (filterToValidate.dateRange) {
      const { createdAfter, createdBefore, updatedAfter, updatedBefore } = filterToValidate.dateRange;
      
      if (createdAfter && createdBefore && createdAfter > createdBefore) {
        errors.push('Created date range: start date must be before end date');
      }
      
      if (updatedAfter && updatedBefore && updatedAfter > updatedBefore) {
        errors.push('Updated date range: start date must be before end date');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, []);

  // =============================================================================
  // Preset Management
  // =============================================================================

  const saveAsPreset = useCallback(async (
    name: string,
    description = '',
    isGlobal = false
  ): Promise<FilterPreset> => {
    const preset: FilterPreset = {
      id: `preset-${Date.now()}`,
      name,
      description,
      filter: { ...filter },
      isGlobal,
      createdBy: 'current-user', // Replace with actual user ID
      createdAt: new Date(),
      usageCount: 0,
      tags: [],
    };

    useCollectionStore.setState(state => {
      state.filterView.filterPresets.push(preset);
    });

    return preset;
  }, [filter]);

  const applyPreset = useCallback((presetId: string) => {
    const preset = filterPresets.find(p => p.id === presetId);
    if (preset) {
      setFilter(preset.filter);
      
      // Update usage count
      useCollectionStore.setState(state => {
        const p = state.filterView.filterPresets.find(p => p.id === presetId);
        if (p) {
          p.usageCount++;
        }
      });
    }
  }, [filterPresets, setFilter]);

  const deletePreset = useCallback(async (presetId: string) => {
    useCollectionStore.setState(state => {
      state.filterView.filterPresets = state.filterView.filterPresets.filter(p => p.id !== presetId);
    });
  }, []);

  const updatePreset = useCallback(async (
    presetId: string,
    updates: Partial<FilterPreset>
  ) => {
    useCollectionStore.setState(state => {
      const preset = state.filterView.filterPresets.find(p => p.id === presetId);
      if (preset) {
        Object.assign(preset, updates);
      }
    });
  }, []);

  // =============================================================================
  // Suggestion Management
  // =============================================================================

  const getSuggestions = useCallback((partial: Partial<CollectionFilter>): FilterSuggestion[] => {
    // Generate smart suggestions based on partial filter
    const suggestions: FilterSuggestion[] = [];

    // Add recent filters as suggestions
    quickFilters.recent.forEach((recentFilter, index) => {
      suggestions.push({
        id: `recent-${index}`,
        label: getFilterSummary(recentFilter),
        filter: recentFilter,
        confidence: 0.8 - (index * 0.1),
        source: 'history',
      });
    });

    return suggestions.slice(0, 5); // Limit to top 5 suggestions
  }, [quickFilters.recent]);

  const applySuggestion = useCallback((suggestionId: string) => {
    const suggestion = suggestions.current.find(s => s.id === suggestionId);
    if (suggestion) {
      updateFilter(suggestion.filter);
    }
  }, [suggestions.current, updateFilter]);

  const dismissSuggestion = useCallback((suggestionId: string) => {
    useCollectionStore.setState(state => {
      state.filterView.quickFilters.recommendations = 
        state.filterView.quickFilters.recommendations.filter(r => r.id !== suggestionId);
    });
  }, []);

  // =============================================================================
  // Quick Filters
  // =============================================================================

  const getQuickFilters = useCallback(() => {
    const quickFilterOptions = [
      { 
        label: 'Recently Updated', 
        filter: { dateRange: { updatedAfter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        count: allCollections.filter(c => 
          c.updatedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length
      },
      { 
        label: 'High Priority', 
        filter: { status: { priority: ['urgent'] } },
        count: allCollections.filter(c => c.status.priority === 'urgent').length
      },
      { 
        label: 'Critical Status', 
        filter: { status: { operational: ['critical'] } },
        count: allCollections.filter(c => c.status.operational === 'critical').length
      },
    ];

    return quickFilterOptions.filter(option => option.count > 0);
  }, [allCollections]);

  const applyQuickFilter = useCallback((quickFilter: CollectionFilter) => {
    setFilter(quickFilter);
  }, [setFilter]);

  // =============================================================================
  // Utilities
  // =============================================================================

  const matches = useCallback((collections: Collection[], filterToMatch = appliedFilter) => {
    return collections.filter(collection => matchesFilter(collection, filterToMatch));
  }, [appliedFilter]);

  const getFilterSummary = useCallback((filterToSummarize = filter): string => {
    const parts: string[] = [];

    if (filterToSummarize.search) {
      parts.push(`Search: "${filterToSummarize.search}"`);
    }

    if (filterToSummarize.types && filterToSummarize.types.length > 0) {
      parts.push(`Types: ${filterToSummarize.types.join(', ')}`);
    }

    if (filterToSummarize.status?.operational && filterToSummarize.status.operational.length > 0) {
      parts.push(`Status: ${filterToSummarize.status.operational.join(', ')}`);
    }

    if (filterToSummarize.tags && filterToSummarize.tags.length > 0) {
      parts.push(`Tags: ${filterToSummarize.tags.join(', ')}`);
    }

    return parts.length > 0 ? parts.join(' • ') : 'No filters applied';
  }, [filter]);

  const exportFilter = useCallback((filterToExport = filter): string => {
    return JSON.stringify(filterToExport, null, 2);
  }, [filter]);

  const importFilter = useCallback((filterString: string): CollectionFilter | null => {
    try {
      const parsed = JSON.parse(filterString);
      const validation = validateFilter(parsed);
      
      if (validation.isValid) {
        return parsed;
      } else {
        console.error('Invalid filter:', validation.errors);
        return null;
      }
    } catch (error) {
      console.error('Failed to parse filter:', error);
      return null;
    }
  }, [validateFilter]);

  // =============================================================================
  // Effects
  // =============================================================================

  // Apply search to history when it changes
  useEffect(() => {
    if (filter.search && opts.autoApply) {
      addToSearchHistory(filter.search);
    }
  }, [filter.search, opts.autoApply, addToSearchHistory]);

  // Cleanup debounce timeout
  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  // Initialize applied filter
  useEffect(() => {
    if (Object.keys(appliedFilter).length === 0) {
      setAppliedFilter(filter);
    }
  }, [filter, appliedFilter]);

  // =============================================================================
  // Return Interface
  // =============================================================================

  return {
    filter,
    appliedFilter,
    isApplying,
    hasUnappliedChanges,
    matchingCount,
    totalCount,
    presets,
    suggestions,
    stats,

    // Basic Filter Actions
    setFilter,
    clearFilter,
    updateFilter,
    applyFilter,
    resetFilter,

    // Search Actions
    setSearch,
    clearSearch,
    addToSearchHistory,

    // Field-Specific Filters
    filterByTypes,
    filterByStatus,
    filterByTags,
    filterByDateRange,
    filterByUsers,
    filterByMetadata,

    // Advanced Filters
    buildFilter,
    parseFilter,
    validateFilter,

    // Preset Management
    saveAsPreset,
    applyPreset,
    deletePreset,
    updatePreset,

    // Suggestion Management
    getSuggestions,
    applySuggestion,
    dismissSuggestion,

    // Quick Filters
    getQuickFilters,
    applyQuickFilter,

    // Utilities
    matches,
    getFilterSummary,
    exportFilter,
    importFilter,
  };
};