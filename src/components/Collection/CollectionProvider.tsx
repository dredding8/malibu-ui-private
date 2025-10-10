/**
 * Collection Provider Component
 * 
 * Context provider for collection management with comprehensive state management,
 * real-time updates, and cross-component communication.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import React, { createContext, useContext, useEffect, useMemo, useCallback } from 'react';
import {
  Collection,
  CollectionFilter,
  CollectionSort,
  CollectionViewConfig,
  CollectionActionType,
} from '../../types/collection.types';
import { useCollections } from '../../hooks/collections/useCollections';
import { useCollectionActions } from '../../hooks/collections/useCollectionActions';
import { useCollectionFilters } from '../../hooks/collections/useCollectionFilters';
import { useCollectionSort } from '../../hooks/collections/useCollectionSort';

// =============================================================================
// Context Type Definition
// =============================================================================

export interface CollectionContextValue {
  // Data
  /** All collections */
  collections: Collection[];
  /** Filtered collections */
  filteredCollections: Collection[];
  /** Selected collections */
  selectedCollections: Collection[];
  /** Currently editing collection */
  editingCollection: Collection | null;

  // State
  /** Loading states */
  loading: {
    collections: boolean;
    creating: boolean;
    updating: boolean;
    deleting: boolean;
    bulk: boolean;
  };
  /** Error states */
  error: {
    message: string | null;
    hasError: boolean;
  };
  /** View configuration */
  viewConfig: CollectionViewConfig;
  /** Filter state */
  filter: CollectionFilter;
  /** Sort state */
  sort: CollectionSort;
  /** Selection state */
  selection: {
    selectedIds: Set<string>;
    selectedCount: number;
    allSelected: boolean;
    someSelected: boolean;
  };

  // Actions - Data Management
  /** Create new collection */
  createCollection: (data: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  /** Update collection */
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<void>;
  /** Delete collection */
  deleteCollection: (id: string, options?: { cascade?: boolean; softDelete?: boolean }) => Promise<void>;
  /** Duplicate collection */
  duplicateCollection: (sourceId: string, updates?: Partial<Collection>) => Promise<void>;
  /** Refresh collections */
  refreshCollections: () => Promise<void>;

  // Actions - Selection Management
  /** Select collection(s) */
  selectCollection: (id: string | string[], mode?: 'replace' | 'add' | 'remove' | 'toggle') => void;
  /** Select all visible collections */
  selectAll: () => void;
  /** Clear selection */
  clearSelection: () => void;
  /** Toggle selection for collection */
  toggleSelection: (id: string) => void;

  // Actions - Bulk Operations
  /** Start bulk operation */
  startBulkOperation: (action: CollectionActionType, options?: any) => Promise<void>;
  /** Cancel active bulk operation */
  cancelBulkOperation: () => void;

  // Actions - Filtering
  /** Set filter */
  setFilter: (filter: CollectionFilter) => void;
  /** Clear filter */
  clearFilter: () => void;
  /** Update filter partially */
  updateFilter: (updates: Partial<CollectionFilter>) => void;

  // Actions - Sorting
  /** Set sort */
  setSort: (sort: CollectionSort) => void;
  /** Toggle sort for field */
  toggleSort: (field: string) => void;
  /** Clear sort */
  clearSort: () => void;

  // Actions - View Management
  /** Set view config */
  setViewConfig: (config: Partial<CollectionViewConfig>) => void;
  /** Change view mode */
  changeViewMode: (mode: CollectionViewConfig['mode']) => void;
  /** Change density */
  changeDensity: (density: CollectionViewConfig['density']) => void;

  // Actions - Editing
  /** Start editing collection */
  startEditing: (id: string) => void;
  /** Stop editing */
  stopEditing: () => void;
  /** Save edit changes */
  saveEdit: (updates: Partial<Collection>) => Promise<void>;
  /** Cancel edit changes */
  cancelEdit: () => void;

  // Utilities
  /** Get collection by ID */
  getCollection: (id: string) => Collection | undefined;
  /** Check if collection is selected */
  isSelected: (id: string) => boolean;
  /** Check if collection is being edited */
  isEditing: (id: string) => boolean;
  /** Get collection count info */
  getCountInfo: () => { total: number; filtered: number; selected: number };

  // Configuration
  /** Feature flags */
  features: {
    enableRealtime: boolean;
    enableSelection: boolean;
    enableFiltering: boolean;
    enableSorting: boolean;
    enableBulkOperations: boolean;
  };
}

// =============================================================================
// Context Creation
// =============================================================================

const CollectionContext = createContext<CollectionContextValue | null>(null);

// =============================================================================
// Provider Props
// =============================================================================

export interface CollectionProviderProps {
  /** Child components */
  children: React.ReactNode;
  /** Initial collections data */
  collections?: Collection[];
  /** Initial view configuration */
  viewConfig?: Partial<CollectionViewConfig>;
  /** Initial filter */
  initialFilter?: CollectionFilter;
  /** Initial sort */
  initialSort?: CollectionSort;
  /** Enable real-time updates */
  enableRealtime?: boolean;
  /** Enable selection */
  enableSelection?: boolean;
  /** Enable filtering */
  enableFiltering?: boolean;
  /** Enable sorting */
  enableSorting?: boolean;
  /** Enable bulk operations */
  enableBulkOperations?: boolean;
  /** Auto-load collections on mount */
  autoLoad?: boolean;
  /** Custom collection loader */
  collectionLoader?: () => Promise<Collection[]>;
  /** Event handlers */
  onCollectionSelect?: (collection: Collection) => void;
  onCollectionUpdate?: (collection: Collection) => void;
  onCollectionDelete?: (id: string) => void;
  onBulkOperation?: (action: string, ids: string[]) => void;
  onError?: (error: string) => void;
}

// =============================================================================
// Provider Component
// =============================================================================

/**
 * Collection context provider
 * 
 * Provides comprehensive collection management state and actions to all child components.
 * Coordinates between multiple hooks to provide a unified interface.
 * 
 * @example
 * ```tsx
 * <CollectionProvider
 *   collections={collections}
 *   enableSelection
 *   enableFiltering
 *   enableBulkOperations
 *   onCollectionSelect={handleSelect}
 * >
 *   <CollectionToolbar />
 *   <CollectionGrid />
 *   <CollectionFooter />
 * </CollectionProvider>
 * ```
 */
export const CollectionProvider: React.FC<CollectionProviderProps> = ({
  children,
  collections: initialCollections = [],
  viewConfig: initialViewConfig,
  initialFilter,
  initialSort,
  enableRealtime = true,
  enableSelection = true,
  enableFiltering = true,
  enableSorting = true,
  enableBulkOperations = true,
  autoLoad = false,
  collectionLoader,
  onCollectionSelect,
  onCollectionUpdate,
  onCollectionDelete,
  onBulkOperation,
  onError,
}) => {

  // =============================================================================
  // Hook Integration
  // =============================================================================

  // Collections management
  const {
    collections,
    loading: collectionsLoading,
    error: collectionsError,
    selection,
    filter,
    sort,
    viewConfig,
    setFilter,
    setSort,
    setViewConfig,
    selectCollections,
    selectAll,
    clearSelection,
    load: loadCollections,
    refresh: refreshCollections,
  } = useCollections({
    initialFilter,
    initialSort,
    initialPagination: { page: 0, pageSize: 25, total: 0, totalPages: 0 },
    autoLoad,
    enableRealtime,
  });

  // Collection actions
  const {
    loading: actionsLoading,
    error: actionsError,
    createCollection: createCollectionAction,
    updateCollection: updateCollectionAction,
    deleteCollection: deleteCollectionAction,
    duplicateCollection: duplicateCollectionAction,
    bulkUpdate,
    bulkDelete,
    customBulkOperation,
  } = useCollectionActions({
    optimisticUpdates: true,
    validateBeforeAction: true,
    enableUndoRedo: true,
  });

  // Filtering
  const {
    filter: filterState,
    setFilter: setFilterAction,
    clearFilter: clearFilterAction,
    updateFilter,
  } = useCollectionFilters({
    enableSuggestions: enableFiltering,
    enablePresets: enableFiltering,
    autoApply: true,
  });

  // Sorting
  const {
    sort: sortState,
    setSort: setSortAction,
    toggleSort,
    clearSort,
  } = useCollectionSort({
    enableMultiSort: true,
    enablePresets: enableSorting,
    autoApply: true,
  });

  // =============================================================================
  // Local State
  // =============================================================================

  const [editingCollectionId, setEditingCollectionId] = React.useState<string | null>(null);

  // =============================================================================
  // Computed Values
  // =============================================================================

  const filteredCollections = useMemo(() => {
    // Apply current filters to collections
    // This would normally be done by the collections hook, but we'll implement basic filtering here
    let filtered = collections;

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(collection => 
        collection.name.toLowerCase().includes(searchLower) ||
        collection.description?.toLowerCase().includes(searchLower) ||
        collection.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (filter.types && filter.types.length > 0) {
      filtered = filtered.filter(collection => filter.types!.includes(collection.type));
    }

    return filtered;
  }, [collections, filter]);

  const selectedCollections = useMemo(() => 
    Array.from(selection.selectedIds).map(id => 
      collections.find(c => c.id === id)
    ).filter(Boolean) as Collection[],
    [selection.selectedIds, collections]
  );

  const editingCollection = useMemo(() => 
    editingCollectionId ? collections.find(c => c.id === editingCollectionId) || null : null,
    [editingCollectionId, collections]
  );

  const loading = useMemo(() => ({
    collections: collectionsLoading.isLoading,
    creating: actionsLoading.isCreating,
    updating: actionsLoading.isUpdating,
    deleting: actionsLoading.isDeleting,
    bulk: actionsLoading.isBulkLoading,
  }), [collectionsLoading, actionsLoading]);

  const error = useMemo(() => ({
    message: collectionsError.loadError || actionsError.lastError,
    hasError: collectionsError.hasError || Object.values(actionsError).some(Boolean),
  }), [collectionsError, actionsError]);

  const features = useMemo(() => ({
    enableRealtime,
    enableSelection,
    enableFiltering,
    enableSorting,
    enableBulkOperations,
  }), [enableRealtime, enableSelection, enableFiltering, enableSorting, enableBulkOperations]);

  // =============================================================================
  // Action Handlers
  // =============================================================================

  const handleCreateCollection = useCallback(async (
    data: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      const result = await createCollectionAction(data);
      if (result.success && result.data) {
        onCollectionUpdate?.(result.data);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create collection';
      onError?.(errorMessage);
    }
  }, [createCollectionAction, onCollectionUpdate, onError]);

  const handleUpdateCollection = useCallback(async (
    id: string,
    updates: Partial<Collection>
  ) => {
    try {
      const result = await updateCollectionAction(id, updates);
      if (result.success && result.data) {
        onCollectionUpdate?.(result.data);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update collection';
      onError?.(errorMessage);
    }
  }, [updateCollectionAction, onCollectionUpdate, onError]);

  const handleDeleteCollection = useCallback(async (
    id: string,
    options?: { cascade?: boolean; softDelete?: boolean }
  ) => {
    try {
      const result = await deleteCollectionAction(id, options);
      if (result.success) {
        onCollectionDelete?.(id);
        // Remove from selection if selected
        if (selection.selectedIds.has(id)) {
          selectCollections([id], 'remove');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete collection';
      onError?.(errorMessage);
    }
  }, [deleteCollectionAction, onCollectionDelete, onError, selection.selectedIds, selectCollections]);

  const handleDuplicateCollection = useCallback(async (
    sourceId: string,
    updates?: Partial<Collection>
  ) => {
    try {
      const result = await duplicateCollectionAction(sourceId, updates);
      if (result.success && result.data) {
        onCollectionUpdate?.(result.data);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate collection';
      onError?.(errorMessage);
    }
  }, [duplicateCollectionAction, onCollectionUpdate, onError]);

  const handleSelectCollection = useCallback((
    id: string | string[],
    mode: 'replace' | 'add' | 'remove' | 'toggle' = 'replace'
  ) => {
    const ids = Array.isArray(id) ? id : [id];
    selectCollections(ids, mode);

    // Trigger callback for single selection
    if (!Array.isArray(id) && mode === 'replace') {
      const collection = collections.find(c => c.id === id);
      if (collection) {
        onCollectionSelect?.(collection);
      }
    }
  }, [selectCollections, collections, onCollectionSelect]);

  const handleToggleSelection = useCallback((id: string) => {
    handleSelectCollection(id, 'toggle');
  }, [handleSelectCollection]);

  const handleStartBulkOperation = useCallback(async (
    action: CollectionActionType,
    options: any = {}
  ) => {
    if (!enableBulkOperations || selection.selectedCount === 0) return;

    try {
      const selectedIds = Array.from(selection.selectedIds);
      
      switch (action) {
        case 'update':
          await bulkUpdate(selectedIds, options.updates || {});
          break;
        case 'delete':
          await bulkDelete(selectedIds, options);
          break;
        default:
          await customBulkOperation({
            type: action,
            targets: selectedIds,
            params: options,
            requiresConfirmation: options.requiresConfirmation ?? true,
          });
      }

      onBulkOperation?.(action, selectedIds);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to perform bulk ${action}`;
      onError?.(errorMessage);
    }
  }, [
    enableBulkOperations,
    selection.selectedIds,
    selection.selectedCount,
    bulkUpdate,
    bulkDelete,
    customBulkOperation,
    onBulkOperation,
    onError,
  ]);

  const handleCancelBulkOperation = useCallback(() => {
    // Implementation would cancel the active bulk operation
    // This would be coordinated with the actions hook
  }, []);

  // =============================================================================
  // Editing Actions
  // =============================================================================

  const handleStartEditing = useCallback((id: string) => {
    setEditingCollectionId(id);
  }, []);

  const handleStopEditing = useCallback(() => {
    setEditingCollectionId(null);
  }, []);

  const handleSaveEdit = useCallback(async (updates: Partial<Collection>) => {
    if (!editingCollectionId) return;
    
    await handleUpdateCollection(editingCollectionId, updates);
    setEditingCollectionId(null);
  }, [editingCollectionId, handleUpdateCollection]);

  const handleCancelEdit = useCallback(() => {
    setEditingCollectionId(null);
  }, []);

  // =============================================================================
  // Utility Functions
  // =============================================================================

  const getCollection = useCallback((id: string) => {
    return collections.find(c => c.id === id);
  }, [collections]);

  const isSelected = useCallback((id: string) => {
    return selection.selectedIds.has(id);
  }, [selection.selectedIds]);

  const isEditing = useCallback((id: string) => {
    return editingCollectionId === id;
  }, [editingCollectionId]);

  const getCountInfo = useCallback(() => ({
    total: collections.length,
    filtered: filteredCollections.length,
    selected: selection.selectedCount,
  }), [collections.length, filteredCollections.length, selection.selectedCount]);

  // =============================================================================
  // Effects
  // =============================================================================

  // Apply initial view config
  useEffect(() => {
    if (initialViewConfig) {
      setViewConfig(initialViewConfig);
    }
  }, [initialViewConfig, setViewConfig]);

  // Load collections if custom loader provided
  useEffect(() => {
    if (collectionLoader && autoLoad) {
      collectionLoader().then(loadedCollections => {
        // Would integrate with the collections hook to update data
        console.log('Loaded collections:', loadedCollections);
      }).catch(error => {
        onError?.(error instanceof Error ? error.message : 'Failed to load collections');
      });
    }
  }, [collectionLoader, autoLoad, onError]);

  // =============================================================================
  // Context Value
  // =============================================================================

  const contextValue: CollectionContextValue = useMemo(() => ({
    // Data
    collections,
    filteredCollections,
    selectedCollections,
    editingCollection,

    // State
    loading,
    error,
    viewConfig,
    filter: filterState,
    sort: sortState,
    selection,

    // Actions - Data Management
    createCollection: handleCreateCollection,
    updateCollection: handleUpdateCollection,
    deleteCollection: handleDeleteCollection,
    duplicateCollection: handleDuplicateCollection,
    refreshCollections,

    // Actions - Selection Management
    selectCollection: handleSelectCollection,
    selectAll,
    clearSelection,
    toggleSelection: handleToggleSelection,

    // Actions - Bulk Operations
    startBulkOperation: handleStartBulkOperation,
    cancelBulkOperation: handleCancelBulkOperation,

    // Actions - Filtering
    setFilter: setFilterAction,
    clearFilter: clearFilterAction,
    updateFilter,

    // Actions - Sorting
    setSort: setSortAction,
    toggleSort,
    clearSort,

    // Actions - View Management
    setViewConfig,
    changeViewMode: (mode) => setViewConfig({ mode }),
    changeDensity: (density) => setViewConfig({ density }),

    // Actions - Editing
    startEditing: handleStartEditing,
    stopEditing: handleStopEditing,
    saveEdit: handleSaveEdit,
    cancelEdit: handleCancelEdit,

    // Utilities
    getCollection,
    isSelected,
    isEditing,
    getCountInfo,

    // Configuration
    features,
  }), [
    collections,
    filteredCollections,
    selectedCollections,
    editingCollection,
    loading,
    error,
    viewConfig,
    filterState,
    sortState,
    selection,
    handleCreateCollection,
    handleUpdateCollection,
    handleDeleteCollection,
    handleDuplicateCollection,
    refreshCollections,
    handleSelectCollection,
    selectAll,
    clearSelection,
    handleToggleSelection,
    handleStartBulkOperation,
    handleCancelBulkOperation,
    setFilterAction,
    clearFilterAction,
    updateFilter,
    setSortAction,
    toggleSort,
    clearSort,
    setViewConfig,
    handleStartEditing,
    handleStopEditing,
    handleSaveEdit,
    handleCancelEdit,
    getCollection,
    isSelected,
    isEditing,
    getCountInfo,
    features,
  ]);

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <CollectionContext.Provider value={contextValue}>
      {children}
    </CollectionContext.Provider>
  );
};

// =============================================================================
// Context Hook
// =============================================================================

/**
 * Hook to access collection context
 * 
 * @throws Error if used outside of CollectionProvider
 * @returns Collection context value
 */
export const useCollectionContext = (): CollectionContextValue => {
  const context = useContext(CollectionContext);
  
  if (!context) {
    throw new Error('useCollectionContext must be used within a CollectionProvider');
  }
  
  return context;
};

// =============================================================================
// Export Types
// =============================================================================

export type {
  CollectionContextValue,
  CollectionProviderProps,
};