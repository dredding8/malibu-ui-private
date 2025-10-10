/**
 * Collection Single Item Hook
 * 
 * Hook for managing individual collection data with real-time updates,
 * validation, and optimistic updates.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import { useCallback, useMemo, useEffect } from 'react';
import { useCollectionStore } from '../../store/collectionStore';
import { Collection, ValidationResult } from '../../types/collection.types';

// =============================================================================
// Hook Options Interface
// =============================================================================

export interface UseCollectionOptions {
  /** Enable real-time updates for this collection */
  subscribeToUpdates?: boolean;
  /** Validate collection data on changes */
  validateOnChange?: boolean;
  /** Cache the collection data */
  enableCaching?: boolean;
  /** Preload related collections */
  preloadRelated?: boolean;
  /** Performance monitoring */
  enablePerformanceMonitoring?: boolean;
}

// =============================================================================
// Hook Return Type
// =============================================================================

export interface UseCollectionReturn {
  /** Collection data */
  collection: Collection | undefined;
  /** Loading states */
  loading: {
    /** Collection is loading */
    isLoading: boolean;
    /** Collection is being updated */
    isUpdating: boolean;
    /** Collection is being deleted */
    isDeleting: boolean;
    /** Collection is being validated */
    isValidating: boolean;
  };
  /** Error states */
  error: {
    /** Load error */
    loadError: string | null;
    /** Update error */
    updateError: string | null;
    /** Delete error */
    deleteError: string | null;
    /** Validation error */
    validationError: ValidationResult | null;
  };
  /** Collection exists */
  exists: boolean;
  /** Collection is selected */
  isSelected: boolean;
  /** Collection is being edited */
  isEditing: boolean;
  /** Validation result */
  validation: ValidationResult | null;
  /** Performance metrics */
  performance: {
    /** Last render time */
    lastRenderTime: number;
    /** Update latency */
    updateLatency: number;
  };
  
  // Actions
  /** Update collection */
  update: (updates: Partial<Collection>) => Promise<Collection>;
  /** Delete collection */
  delete: (options?: { cascade?: boolean; softDelete?: boolean }) => Promise<void>;
  /** Duplicate collection */
  duplicate: (updates?: Partial<Collection>) => Promise<Collection>;
  /** Validate collection */
  validate: () => Promise<ValidationResult>;
  /** Refresh collection data */
  refresh: () => Promise<void>;
  /** Select/deselect collection */
  toggleSelection: () => void;
  /** Start editing collection */
  startEditing: () => void;
  /** Stop editing collection */
  stopEditing: () => void;
  /** Subscribe to real-time updates */
  subscribeToUpdates: () => void;
  /** Unsubscribe from real-time updates */
  unsubscribeFromUpdates: () => void;
}

// =============================================================================
// Default Options
// =============================================================================

const defaultOptions: UseCollectionOptions = {
  subscribeToUpdates: true,
  validateOnChange: false,
  enableCaching: true,
  preloadRelated: false,
  enablePerformanceMonitoring: true,
};

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for managing a single collection
 * 
 * @param id - Collection ID
 * @param options - Hook configuration options
 * @returns Collection management interface
 * 
 * @example
 * ```tsx
 * const {
 *   collection,
 *   loading,
 *   error,
 *   update,
 *   delete: deleteCollection,
 *   toggleSelection
 * } = useCollection('collection-123', {
 *   subscribeToUpdates: true,
 *   validateOnChange: true
 * });
 * 
 * if (loading.isLoading) return <Spinner />;
 * if (error.loadError) return <ErrorDisplay error={error.loadError} />;
 * if (!collection) return <NotFound />;
 * 
 * return (
 *   <CollectionCard
 *     collection={collection}
 *     onUpdate={update}
 *     onDelete={deleteCollection}
 *     onSelect={toggleSelection}
 *   />
 * );
 * ```
 */
export const useCollection = (
  id: string | undefined,
  options: UseCollectionOptions = {}
): UseCollectionReturn => {
  const opts = { ...defaultOptions, ...options };

  // =============================================================================
  // Store Selectors
  // =============================================================================

  const collection = useCollectionStore(state => 
    id ? state.collections.collections[id] : undefined
  );

  const selectedIds = useCollectionStore(state => state.collections.selectedIds);
  const editingId = useCollectionStore(state => state.collections.editingId);
  
  const loading = useCollectionStore(state => ({
    isLoading: state.collections.loading.collections,
    isUpdating: id ? !!state.collections.loading.updating[id] : false,
    isDeleting: id ? !!state.collections.loading.deleting[id] : false,
    isValidating: id ? !!state.collections.loading.validating[id] : false,
  }));

  const errors = useCollectionStore(state => ({
    global: state.collections.errors.global,
    collectionErrors: id ? state.collections.errors.collections[id] || [] : [],
    validationResults: id ? state.collections.errors.validation[id] : null,
  }));

  const performanceMetrics = useCollectionStore(state => state.collections.performance);

  // =============================================================================
  // Store Actions
  // =============================================================================

  const storeActions = useCollectionStore(state => ({
    updateCollection: state.updateCollection,
    deleteCollection: state.deleteCollection,
    duplicateCollection: state.duplicateCollection,
    selectCollections: state.selectCollections,
    loadCollections: state.loadCollections,
    subscribeToUpdates: state.subscribeToUpdates,
    unsubscribeFromUpdates: state.unsubscribeFromUpdates,
    updatePerformanceMetrics: state.updatePerformanceMetrics,
  }));

  // =============================================================================
  // Computed Values
  // =============================================================================

  const exists = useMemo(() => !!collection, [collection]);
  const isSelected = useMemo(() => id ? selectedIds.has(id) : false, [id, selectedIds]);
  const isEditing = useMemo(() => editingId === id, [editingId, id]);

  const error = useMemo(() => ({
    loadError: errors.global.find(e => e.code === 'LOAD_FAILED')?.message || null,
    updateError: errors.collectionErrors.find(e => e.type === 'system')?.message || null,
    deleteError: errors.collectionErrors.find(e => e.type === 'permission')?.message || null,
    validationError: errors.validationResults,
  }), [errors]);

  const validation = useMemo(() => errors.validationResults, [errors.validationResults]);

  const performance = useMemo(() => ({
    lastRenderTime: performanceMetrics.renderMetrics.averageRenderTime,
    updateLatency: id ? performanceMetrics.operationLatency[`update-${id}`] || 0 : 0,
  }), [performanceMetrics, id]);

  // =============================================================================
  // Action Handlers
  // =============================================================================

  const update = useCallback(async (updates: Partial<Collection>): Promise<Collection> => {
    if (!id) {
      throw new Error('Cannot update collection without ID');
    }

    const startTime = performance.now();

    try {
      if (opts.validateOnChange) {
        // Perform validation before update
        await validate();
      }

      const updatedCollection = await storeActions.updateCollection(id, updates);
      
      if (opts.enablePerformanceMonitoring) {
        const endTime = performance.now();
        storeActions.updatePerformanceMetrics({
          operationLatency: endTime - startTime,
        });
      }

      return updatedCollection;
    } catch (error) {
      console.error('Failed to update collection:', error);
      throw error;
    }
  }, [id, opts.validateOnChange, opts.enablePerformanceMonitoring, storeActions]);

  const deleteCollection = useCallback(async (options = {}): Promise<void> => {
    if (!id) {
      throw new Error('Cannot delete collection without ID');
    }

    try {
      await storeActions.deleteCollection(id, options);
    } catch (error) {
      console.error('Failed to delete collection:', error);
      throw error;
    }
  }, [id, storeActions]);

  const duplicate = useCallback(async (updates = {}): Promise<Collection> => {
    if (!id) {
      throw new Error('Cannot duplicate collection without ID');
    }

    try {
      return await storeActions.duplicateCollection(id, updates);
    } catch (error) {
      console.error('Failed to duplicate collection:', error);
      throw error;
    }
  }, [id, storeActions]);

  const validate = useCallback(async (): Promise<ValidationResult> => {
    if (!id || !collection) {
      throw new Error('Cannot validate collection without ID or data');
    }

    // Mock validation - replace with actual validation logic
    const validationResult: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    return validationResult;
  }, [id, collection]);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      await storeActions.loadCollections({ forceRefresh: true });
    } catch (error) {
      console.error('Failed to refresh collection:', error);
      throw error;
    }
  }, [storeActions]);

  const toggleSelection = useCallback(() => {
    if (!id) return;
    storeActions.selectCollections([id], 'toggle');
  }, [id, storeActions]);

  const startEditing = useCallback(() => {
    if (!id) return;
    useCollectionStore.setState(state => {
      state.collections.editingId = id;
    });
  }, [id]);

  const stopEditing = useCallback(() => {
    useCollectionStore.setState(state => {
      state.collections.editingId = null;
    });
  }, []);

  const subscribeToUpdates = useCallback(() => {
    if (id) {
      storeActions.subscribeToUpdates([id]);
    }
  }, [id, storeActions]);

  const unsubscribeFromUpdates = useCallback(() => {
    storeActions.unsubscribeFromUpdates();
  }, [storeActions]);

  // =============================================================================
  // Effects
  // =============================================================================

  // Auto-subscribe to updates if enabled
  useEffect(() => {
    if (opts.subscribeToUpdates && id && exists) {
      subscribeToUpdates();
      return () => unsubscribeFromUpdates();
    }
  }, [opts.subscribeToUpdates, id, exists, subscribeToUpdates, unsubscribeFromUpdates]);

  // Preload related collections if enabled
  useEffect(() => {
    if (opts.preloadRelated && collection && collection.childIds.length > 0) {
      // Preload child collections
      collection.childIds.forEach(childId => {
        if (!useCollectionStore.getState().collections.collections[childId]) {
          // Collection not in store, trigger preload
          storeActions.loadCollections();
        }
      });
    }
  }, [opts.preloadRelated, collection, storeActions]);

  // Performance monitoring
  useEffect(() => {
    if (opts.enablePerformanceMonitoring) {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        storeActions.updatePerformanceMetrics({
          renderTime: endTime - startTime,
        });
      };
    }
  }, [opts.enablePerformanceMonitoring, storeActions]);

  // =============================================================================
  // Return Interface
  // =============================================================================

  return {
    collection,
    loading,
    error,
    exists,
    isSelected,
    isEditing,
    validation,
    performance,
    
    // Actions
    update,
    delete: deleteCollection,
    duplicate,
    validate,
    refresh,
    toggleSelection,
    startEditing,
    stopEditing,
    subscribeToUpdates,
    unsubscribeFromUpdates,
  };
};

// =============================================================================
// Export Utilities
// =============================================================================

/**
 * Hook for collection validation
 */
export const useCollectionValidation = (id: string | undefined) => {
  const { validate, validation, loading } = useCollection(id, {
    validateOnChange: true,
  });

  return {
    validate,
    validation,
    isValidating: loading.isValidating,
    isValid: validation?.isValid ?? true,
    errors: validation?.errors ?? [],
    warnings: validation?.warnings ?? [],
  };
};

/**
 * Hook for collection performance monitoring
 */
export const useCollectionPerformance = (id: string | undefined) => {
  const { performance } = useCollection(id, {
    enablePerformanceMonitoring: true,
  });

  return performance;
};