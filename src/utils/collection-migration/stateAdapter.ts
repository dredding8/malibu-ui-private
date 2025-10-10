/**
 * State Adapter Utility
 * 
 * Adapts legacy CollectionOpportunities state to compound component state
 * with synchronization and conflict resolution.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import { CollectionOpportunity } from '../../types/collectionOpportunities';
import { Collection } from '../../types/collection.types';

// =============================================================================
// Type Definitions
// =============================================================================

export interface LegacyState {
  selectedIds: string[];
  filterConfig?: {
    searchTerm?: string;
    activeFilters?: Record<string, any>;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
  };
  sortConfig?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  splitViewConfig?: {
    isOpen: boolean;
    selectedItemId?: string | null;
    panelWidth?: number;
    persistState?: boolean;
  };
  viewMode?: 'table' | 'grid' | 'list';
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
  bulkSelection?: {
    selectAll: boolean;
    indeterminate: boolean;
    excludedIds: string[];
  };
}

export interface CompoundState {
  collections: Collection[];
  selectedCollections: Collection[];
  filters: {
    searchTerm: string;
    activeFilters: Record<string, any>;
  };
  sorting: {
    field: string;
    direction: 'asc' | 'desc';
  };
  view: {
    mode: 'grid' | 'list' | 'table';
    layout: 'standard' | 'split' | 'modal';
  };
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
  };
  selection: {
    mode: 'none' | 'single' | 'multiple';
    selectAll: boolean;
    indeterminate: boolean;
  };
  ui: {
    splitPanel: {
      isOpen: boolean;
      width: number;
      selectedItemId: string | null;
    };
    loading: Record<string, boolean>;
    errors: Record<string, string | null>;
  };
}

export interface StateAdapterOptions {
  preserveSelection?: boolean;
  syncBidirectional?: boolean;
  validateState?: boolean;
  enableConflictResolution?: boolean;
  mergeBehavior?: 'legacy' | 'compound' | 'merge';
}

// =============================================================================
// State Conversion Functions
// =============================================================================

/**
 * Converts legacy selected IDs to selected collections
 */
export function convertSelectedIds(
  selectedIds: string[],
  collections: Collection[]
): Collection[] {
  const idSet = new Set(selectedIds);
  return collections.filter(collection => idSet.has(collection.id));
}

/**
 * Converts legacy filter config to compound filters
 */
export function convertFilterConfig(filterConfig?: LegacyState['filterConfig']): CompoundState['filters'] {
  return {
    searchTerm: filterConfig?.searchTerm || '',
    activeFilters: filterConfig?.activeFilters || {}
  };
}

/**
 * Converts legacy sort config to compound sorting
 */
export function convertSortConfig(sortConfig?: LegacyState['sortConfig']): CompoundState['sorting'] {
  return {
    field: sortConfig?.field || 'name',
    direction: sortConfig?.direction || 'asc'
  };
}

/**
 * Converts legacy view mode to compound view config
 */
export function convertViewMode(
  viewMode?: string,
  splitViewConfig?: LegacyState['splitViewConfig']
): CompoundState['view'] {
  const mode = (viewMode as CompoundState['view']['mode']) || 'grid';
  const layout = splitViewConfig?.isOpen ? 'split' : 'standard';
  
  return { mode, layout };
}

/**
 * Converts legacy pagination to compound pagination
 */
export function convertPagination(pagination?: LegacyState['pagination']): CompoundState['pagination'] {
  return {
    currentPage: pagination?.page || 1,
    itemsPerPage: pagination?.pageSize || 25,
    totalItems: pagination?.total || 0
  };
}

/**
 * Converts legacy bulk selection to compound selection
 */
export function convertBulkSelection(
  bulkSelection?: LegacyState['bulkSelection'],
  selectedIds?: string[]
): CompoundState['selection'] {
  return {
    mode: selectedIds && selectedIds.length > 0 ? 'multiple' : 'none',
    selectAll: bulkSelection?.selectAll || false,
    indeterminate: bulkSelection?.indeterminate || false
  };
}

/**
 * Converts split view config to UI state
 */
export function convertSplitViewConfig(splitViewConfig?: LegacyState['splitViewConfig']): CompoundState['ui']['splitPanel'] {
  return {
    isOpen: splitViewConfig?.isOpen || false,
    width: splitViewConfig?.panelWidth || 400,
    selectedItemId: splitViewConfig?.selectedItemId || null
  };
}

// =============================================================================
// Main State Adapter
// =============================================================================

/**
 * Adapts legacy state to compound component state
 */
export function adaptLegacyState(
  legacyState: Partial<LegacyState>,
  collections: Collection[] = [],
  options: StateAdapterOptions = {}
): CompoundState {
  const {
    preserveSelection = true,
    validateState = true,
    mergeBehavior = 'merge'
  } = options;

  // Extract legacy state properties
  const {
    selectedIds = [],
    filterConfig,
    sortConfig,
    splitViewConfig,
    viewMode,
    pagination,
    bulkSelection
  } = legacyState;

  // Convert each part of the state
  const selectedCollections = preserveSelection ? 
    convertSelectedIds(selectedIds, collections) : [];

  const filters = convertFilterConfig(filterConfig);
  const sorting = convertSortConfig(sortConfig);
  const view = convertViewMode(viewMode, splitViewConfig);
  const paginationState = convertPagination(pagination);
  const selection = convertBulkSelection(bulkSelection, selectedIds);
  const splitPanel = convertSplitViewConfig(splitViewConfig);

  // Build compound state
  const compoundState: CompoundState = {
    collections,
    selectedCollections,
    filters,
    sorting,
    view,
    pagination: paginationState,
    selection,
    ui: {
      splitPanel,
      loading: {},
      errors: {}
    }
  };

  // Validate state if requested
  if (validateState) {
    const validation = validateCompoundState(compoundState);
    if (!validation.valid) {
      console.warn('State adapter validation issues:', validation.issues);
    }
  }

  return compoundState;
}

/**
 * Converts compound state back to legacy state format
 */
export function adaptCompoundState(
  compoundState: CompoundState,
  options: StateAdapterOptions = {}
): LegacyState {
  const {
    preserveSelection = true,
    validateState = true
  } = options;

  const selectedIds = preserveSelection ? 
    compoundState.selectedCollections.map(c => c.id) : [];

  const filterConfig = {
    searchTerm: compoundState.filters.searchTerm,
    activeFilters: compoundState.filters.activeFilters,
    sortField: compoundState.sorting.field,
    sortDirection: compoundState.sorting.direction
  };

  const sortConfig = {
    field: compoundState.sorting.field,
    direction: compoundState.sorting.direction
  };

  const splitViewConfig = {
    isOpen: compoundState.ui.splitPanel.isOpen,
    selectedItemId: compoundState.ui.splitPanel.selectedItemId,
    panelWidth: compoundState.ui.splitPanel.width,
    persistState: true
  };

  const viewMode = compoundState.view.mode;

  const pagination = {
    page: compoundState.pagination.currentPage,
    pageSize: compoundState.pagination.itemsPerPage,
    total: compoundState.pagination.totalItems
  };

  const bulkSelection = {
    selectAll: compoundState.selection.selectAll,
    indeterminate: compoundState.selection.indeterminate,
    excludedIds: []
  };

  const legacyState: LegacyState = {
    selectedIds: selectedIds || [],
    filterConfig,
    sortConfig,
    splitViewConfig,
    viewMode,
    pagination,
    bulkSelection
  };

  // Validate state if requested
  if (validateState) {
    const validation = validateLegacyState(legacyState);
    if (!validation.valid) {
      console.warn('Legacy state validation issues:', validation.issues);
    }
  }

  return legacyState;
}

// =============================================================================
// State Synchronization
// =============================================================================

/**
 * Synchronizes state between legacy and compound components
 */
export class StateSynchronizer {
  private legacyState: LegacyState = {};
  private compoundState: CompoundState | null = null;
  private listeners: Array<(state: any) => void> = [];
  private options: StateAdapterOptions;

  constructor(options: StateAdapterOptions = {}) {
    this.options = {
      syncBidirectional: true,
      enableConflictResolution: true,
      mergeBehavior: 'merge',
      ...options
    };
  }

  /**
   * Updates legacy state and syncs to compound
   */
  updateLegacyState(newState: Partial<LegacyState>, collections: Collection[] = []): void {
    const prevState = { ...this.legacyState };
    this.legacyState = { ...this.legacyState, ...newState };

    // Convert to compound state
    this.compoundState = adaptLegacyState(this.legacyState, collections, this.options);

    // Notify listeners
    this.notifyListeners('legacy', { prev: prevState, current: this.legacyState });
  }

  /**
   * Updates compound state and syncs to legacy
   */
  updateCompoundState(newState: Partial<CompoundState>): void {
    if (!this.compoundState) {
      throw new Error('Compound state not initialized');
    }

    const prevState = { ...this.compoundState };
    this.compoundState = { ...this.compoundState, ...newState };

    // Convert to legacy state
    this.legacyState = adaptCompoundState(this.compoundState, this.options);

    // Notify listeners
    this.notifyListeners('compound', { prev: prevState, current: this.compoundState });
  }

  /**
   * Gets current legacy state
   */
  getLegacyState(): LegacyState {
    return this.legacyState;
  }

  /**
   * Gets current compound state
   */
  getCompoundState(): CompoundState | null {
    return this.compoundState;
  }

  /**
   * Adds state change listener
   */
  addListener(listener: (state: any) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notifies all listeners of state change
   */
  private notifyListeners(source: 'legacy' | 'compound', change: any): void {
    this.listeners.forEach(listener => {
      try {
        listener({ source, change });
      } catch (err) {
        console.error('State listener error:', err);
      }
    });
  }

  /**
   * Resolves state conflicts
   */
  resolveConflict(legacyState: LegacyState, compoundState: CompoundState): {
    resolvedLegacy: LegacyState;
    resolvedCompound: CompoundState;
  } {
    if (!this.options.enableConflictResolution) {
      return { resolvedLegacy: legacyState, resolvedCompound: compoundState };
    }

    // Simple merge strategy - in practice would be more sophisticated
    const mergedLegacy = { ...legacyState };
    const mergedCompound = { ...compoundState };

    // Resolve selection conflicts
    if (legacyState.selectedIds?.length !== compoundState.selectedCollections.length) {
      const legacySelection = legacyState.selectedIds || [];
      const compoundSelection = compoundState.selectedCollections.map(c => c.id);
      
      // Use the larger selection as the source of truth
      if (legacySelection.length > compoundSelection.length) {
        mergedCompound.selectedCollections = convertSelectedIds(
          legacySelection, 
          compoundState.collections
        );
      } else {
        mergedLegacy.selectedIds = compoundSelection;
      }
    }

    return { 
      resolvedLegacy: mergedLegacy, 
      resolvedCompound: mergedCompound 
    };
  }
}

// =============================================================================
// Validation Functions
// =============================================================================

/**
 * Validates compound state structure and data
 */
export function validateCompoundState(state: CompoundState): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Validate collections
  if (!Array.isArray(state.collections)) {
    issues.push('collections must be an array');
  }

  if (!Array.isArray(state.selectedCollections)) {
    issues.push('selectedCollections must be an array');
  }

  // Validate selection consistency
  const collectionIds = new Set(state.collections.map(c => c.id));
  const invalidSelections = state.selectedCollections.filter(c => !collectionIds.has(c.id));
  if (invalidSelections.length > 0) {
    issues.push(`${invalidSelections.length} selected collections not found in collections array`);
  }

  // Validate pagination
  if (state.pagination.currentPage < 1) {
    issues.push('currentPage must be >= 1');
  }
  if (state.pagination.itemsPerPage < 1) {
    issues.push('itemsPerPage must be >= 1');
  }

  // Validate UI state
  if (state.ui.splitPanel.width < 0) {
    issues.push('splitPanel width must be >= 0');
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Validates legacy state structure and data
 */
export function validateLegacyState(state: LegacyState): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Validate selectedIds
  if (state.selectedIds && !Array.isArray(state.selectedIds)) {
    issues.push('selectedIds must be an array');
  }

  // Validate pagination
  if (state.pagination) {
    if (state.pagination.page < 1) {
      issues.push('pagination page must be >= 1');
    }
    if (state.pagination.pageSize < 1) {
      issues.push('pagination pageSize must be >= 1');
    }
  }

  // Validate sort config
  if (state.sortConfig) {
    if (!['asc', 'desc'].includes(state.sortConfig.direction)) {
      issues.push('sort direction must be "asc" or "desc"');
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

// =============================================================================
// Export All
// =============================================================================

export default adaptLegacyState;