/**
 * Collection Actions Hook
 * 
 * Hook for managing CRUD operations, bulk actions, and complex workflows
 * with optimistic updates, validation, and error handling.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import { useCallback, useMemo, useState } from 'react';
import { useCollectionStore } from '../../store/collectionStore';
import {
  Collection,
  CollectionBulkOperation,
  OperationProgress,
  ValidationResult,
} from '../../types/collection.types';

// =============================================================================
// Hook Options Interface
// =============================================================================

export interface UseCollectionActionsOptions {
  /** Enable optimistic updates */
  optimisticUpdates?: boolean;
  /** Enable validation before operations */
  validateBeforeAction?: boolean;
  /** Auto-retry failed operations */
  autoRetry?: boolean;
  /** Max retry attempts */
  maxRetries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
  /** Enable performance monitoring */
  enablePerformanceMonitoring?: boolean;
  /** Confirmation required for destructive actions */
  requireConfirmation?: boolean;
  /** Undo/redo support */
  enableUndoRedo?: boolean;
}

// =============================================================================
// Action Result Types
// =============================================================================

export interface ActionResult<T = any> {
  /** Operation was successful */
  success: boolean;
  /** Result data */
  data?: T;
  /** Error message if failed */
  error?: string;
  /** Validation result */
  validation?: ValidationResult;
  /** Operation ID for tracking */
  operationId?: string;
  /** Performance metrics */
  performance?: {
    duration: number;
    retries: number;
  };
}

export interface BulkActionResult {
  /** Operation was successful */
  success: boolean;
  /** Successfully processed items */
  successful: string[];
  /** Failed items with errors */
  failed: Array<{ id: string; error: string }>;
  /** Skipped items */
  skipped: string[];
  /** Total items processed */
  totalProcessed: number;
  /** Operation duration */
  duration: number;
  /** Operation ID */
  operationId: string;
}

// =============================================================================
// Hook Return Type
// =============================================================================

export interface UseCollectionActionsReturn {
  /** Loading states */
  loading: {
    /** Any operation in progress */
    isLoading: boolean;
    /** Creating collection */
    isCreating: boolean;
    /** Updating collection */
    isUpdating: boolean;
    /** Deleting collection */
    isDeleting: boolean;
    /** Bulk operation in progress */
    isBulkLoading: boolean;
    /** Validation in progress */
    isValidating: boolean;
  };

  /** Error states */
  error: {
    /** Last error message */
    lastError: string | null;
    /** Create error */
    createError: string | null;
    /** Update error */
    updateError: string | null;
    /** Delete error */
    deleteError: string | null;
    /** Bulk operation error */
    bulkError: string | null;
    /** Validation error */
    validationError: string | null;
  };

  /** Active operations */
  operations: {
    /** Currently running operations */
    active: OperationProgress[];
    /** Can undo last operation */
    canUndo: boolean;
    /** Can redo last undone operation */
    canRedo: boolean;
    /** Operation history */
    history: OperationProgress[];
  };

  // Single Collection Actions
  /** Create new collection */
  createCollection: (
    data: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<ActionResult<Collection>>;

  /** Update existing collection */
  updateCollection: (
    id: string,
    updates: Partial<Collection>
  ) => Promise<ActionResult<Collection>>;

  /** Delete collection */
  deleteCollection: (
    id: string,
    options?: { cascade?: boolean; softDelete?: boolean }
  ) => Promise<ActionResult<void>>;

  /** Duplicate collection */
  duplicateCollection: (
    sourceId: string,
    updates?: Partial<Collection>
  ) => Promise<ActionResult<Collection>>;

  /** Archive collection */
  archiveCollection: (id: string) => Promise<ActionResult<void>>;

  /** Restore archived collection */
  restoreCollection: (id: string) => Promise<ActionResult<void>>;

  // Bulk Actions
  /** Bulk update collections */
  bulkUpdate: (
    ids: string[],
    updates: Partial<Collection>
  ) => Promise<BulkActionResult>;

  /** Bulk delete collections */
  bulkDelete: (
    ids: string[],
    options?: { cascade?: boolean; softDelete?: boolean }
  ) => Promise<BulkActionResult>;

  /** Bulk archive collections */
  bulkArchive: (ids: string[]) => Promise<BulkActionResult>;

  /** Bulk restore collections */
  bulkRestore: (ids: string[]) => Promise<BulkActionResult>;

  /** Custom bulk operation */
  customBulkOperation: (operation: CollectionBulkOperation) => Promise<BulkActionResult>;

  // Validation Actions
  /** Validate single collection */
  validateCollection: (
    collection: Collection | Partial<Collection>
  ) => Promise<ValidationResult>;

  /** Validate multiple collections */
  validateCollections: (
    collections: (Collection | Partial<Collection>)[]
  ) => Promise<ValidationResult[]>;

  // Workflow Actions
  /** Import collections from data */
  importCollections: (
    data: any[],
    options?: { validate?: boolean; dryRun?: boolean }
  ) => Promise<ActionResult<Collection[]>>;

  /** Export collections */
  exportCollections: (
    ids: string[],
    format: 'json' | 'csv' | 'xlsx'
  ) => Promise<ActionResult<Blob>>;

  /** Merge collections */
  mergeCollections: (
    sourceIds: string[],
    targetId: string
  ) => Promise<ActionResult<Collection>>;

  /** Split collection */
  splitCollection: (
    sourceId: string,
    criteria: any
  ) => Promise<ActionResult<Collection[]>>;

  // Operation Management
  /** Cancel operation */
  cancelOperation: (operationId: string) => void;

  /** Retry failed operation */
  retryOperation: (operationId: string) => Promise<ActionResult>;

  /** Undo last operation */
  undo: () => Promise<ActionResult>;

  /** Redo last undone operation */
  redo: () => Promise<ActionResult>;

  /** Get operation status */
  getOperationStatus: (operationId: string) => OperationProgress | null;

  // Utility Actions
  /** Clear all errors */
  clearErrors: () => void;

  /** Clear specific error */
  clearError: (errorType: string) => void;

  /** Reset all operations */
  resetOperations: () => void;
}

// =============================================================================
// Default Options
// =============================================================================

const defaultOptions: UseCollectionActionsOptions = {
  optimisticUpdates: true,
  validateBeforeAction: true,
  autoRetry: false,
  maxRetries: 3,
  retryDelay: 1000,
  enablePerformanceMonitoring: true,
  requireConfirmation: false,
  enableUndoRedo: true,
};

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for collection actions and operations
 * 
 * @param options - Hook configuration options
 * @returns Collection actions interface
 * 
 * @example
 * ```tsx
 * const {
 *   loading,
 *   error,
 *   createCollection,
 *   updateCollection,
 *   deleteCollection,
 *   bulkUpdate,
 *   validateCollection,
 *   undo,
 *   redo
 * } = useCollectionActions({
 *   optimisticUpdates: true,
 *   validateBeforeAction: true,
 *   enableUndoRedo: true
 * });
 * 
 * const handleCreate = async (data) => {
 *   const result = await createCollection(data);
 *   if (result.success) {
 *     console.log('Created:', result.data);
 *   } else {
 *     console.error('Failed:', result.error);
 *   }
 * };
 * ```
 */
export const useCollectionActions = (
  options: UseCollectionActionsOptions = {}
): UseCollectionActionsReturn => {
  const opts = { ...defaultOptions, ...options };

  // =============================================================================
  // Local State
  // =============================================================================

  const [retryAttempts, setRetryAttempts] = useState<Record<string, number>>({});

  // =============================================================================
  // Store Selectors
  // =============================================================================

  const loading = useCollectionStore(state => ({
    isLoading: state.collections.loading.collections ||
                state.collections.loading.creating ||
                state.collections.loading.bulk ||
                Object.values(state.collections.loading.updating).some(Boolean) ||
                Object.values(state.collections.loading.deleting).some(Boolean),
    isCreating: state.collections.loading.creating,
    isUpdating: Object.values(state.collections.loading.updating).some(Boolean),
    isDeleting: Object.values(state.collections.loading.deleting).some(Boolean),
    isBulkLoading: state.collections.loading.bulk,
    isValidating: Object.values(state.collections.loading.validating).some(Boolean),
  }));

  const errors = useCollectionStore(state => state.collections.errors);
  const activeOperations = useCollectionStore(state => state.operations.activeOperations);
  const operationHistory = useCollectionStore(state => state.operations.operationHistory);
  const undoRedoStack = useCollectionStore(state => state.operations.undoRedoStack);

  // =============================================================================
  // Store Actions
  // =============================================================================

  const storeActions = useCollectionStore(state => ({
    createCollection: state.createCollection,
    updateCollection: state.updateCollection,
    deleteCollection: state.deleteCollection,
    duplicateCollection: state.duplicateCollection,
    startBulkOperation: state.startBulkOperation,
    cancelBulkOperation: state.cancelBulkOperation,
    getBulkOperationProgress: state.getBulkOperationProgress,
    clearError: state.clearError,
    retryOperation: state.retryOperation,
    rollbackOperation: state.rollbackOperation,
  }));

  // =============================================================================
  // Computed Values
  // =============================================================================

  const error = useMemo(() => ({
    lastError: errors.global[0]?.message || null,
    createError: errors.global.find(e => e.code === 'CREATE_FAILED')?.message || null,
    updateError: errors.global.find(e => e.code === 'UPDATE_FAILED')?.message || null,
    deleteError: errors.global.find(e => e.code === 'DELETE_FAILED')?.message || null,
    bulkError: errors.global.find(e => e.code === 'BULK_FAILED')?.message || null,
    validationError: errors.global.find(e => e.code === 'VALIDATION_FAILED')?.message || null,
  }), [errors.global]);

  const operations = useMemo(() => ({
    active: Object.values(activeOperations),
    canUndo: undoRedoStack.canUndo,
    canRedo: undoRedoStack.canRedo,
    history: operationHistory,
  }), [activeOperations, undoRedoStack, operationHistory]);

  // =============================================================================
  // Utility Functions
  // =============================================================================

  const measurePerformance = useCallback(<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T & { performance: { duration: number; retries: number } }> => {
    return new Promise(async (resolve, reject) => {
      const startTime = performance.now();
      const attempts = retryAttempts[operationName] || 0;

      try {
        const result = await operation();
        const endTime = performance.now();
        
        if (opts.enablePerformanceMonitoring) {
          useCollectionStore.getState().updatePerformanceMetrics({
            operationLatency: endTime - startTime,
          });
        }

        resolve({
          ...result,
          performance: {
            duration: endTime - startTime,
            retries: attempts,
          },
        } as T & { performance: { duration: number; retries: number } });

        // Reset retry attempts on success
        setRetryAttempts(prev => ({ ...prev, [operationName]: 0 }));

      } catch (error) {
        const endTime = performance.now();

        if (opts.autoRetry && attempts < opts.maxRetries) {
          setRetryAttempts(prev => ({ ...prev, [operationName]: attempts + 1 }));
          
          setTimeout(() => {
            measurePerformance(operation, operationName).then(resolve).catch(reject);
          }, opts.retryDelay);
        } else {
          reject({
            error,
            performance: {
              duration: endTime - startTime,
              retries: attempts,
            },
          });
        }
      }
    });
  }, [retryAttempts, opts.autoRetry, opts.maxRetries, opts.retryDelay, opts.enablePerformanceMonitoring]);

  const validateIfRequired = useCallback(async (
    data: Collection | Partial<Collection>
  ): Promise<ValidationResult | null> => {
    if (!opts.validateBeforeAction) return null;

    return await validateCollection(data);
  }, [opts.validateBeforeAction]);

  // =============================================================================
  // Single Collection Actions
  // =============================================================================

  const createCollection = useCallback(async (
    data: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ActionResult<Collection>> => {
    try {
      const validation = await validateIfRequired(data);
      if (validation && !validation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          validation,
        };
      }

      const result = await measurePerformance(
        () => storeActions.createCollection(data),
        'createCollection'
      );

      return {
        success: true,
        data: result,
        validation,
        performance: result.performance,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Create failed',
      };
    }
  }, [storeActions, measurePerformance, validateIfRequired]);

  const updateCollection = useCallback(async (
    id: string,
    updates: Partial<Collection>
  ): Promise<ActionResult<Collection>> => {
    try {
      const validation = await validateIfRequired(updates);
      if (validation && !validation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          validation,
        };
      }

      const result = await measurePerformance(
        () => storeActions.updateCollection(id, updates),
        `updateCollection-${id}`
      );

      return {
        success: true,
        data: result,
        validation,
        performance: result.performance,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed',
      };
    }
  }, [storeActions, measurePerformance, validateIfRequired]);

  const deleteCollection = useCallback(async (
    id: string,
    options = {}
  ): Promise<ActionResult<void>> => {
    try {
      const result = await measurePerformance(
        () => storeActions.deleteCollection(id, options),
        `deleteCollection-${id}`
      );

      return {
        success: true,
        performance: result.performance,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      };
    }
  }, [storeActions, measurePerformance]);

  const duplicateCollection = useCallback(async (
    sourceId: string,
    updates = {}
  ): Promise<ActionResult<Collection>> => {
    try {
      const result = await measurePerformance(
        () => storeActions.duplicateCollection(sourceId, updates),
        `duplicateCollection-${sourceId}`
      );

      return {
        success: true,
        data: result,
        performance: result.performance,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Duplicate failed',
      };
    }
  }, [storeActions, measurePerformance]);

  const archiveCollection = useCallback(async (id: string): Promise<ActionResult<void>> => {
    return await updateCollection(id, {
      metadata: {
        ...useCollectionStore.getState().collections.collections[id]?.metadata,
        customProperties: {
          archived: true,
          archivedAt: new Date(),
        },
      },
    });
  }, [updateCollection]);

  const restoreCollection = useCallback(async (id: string): Promise<ActionResult<void>> => {
    return await updateCollection(id, {
      metadata: {
        ...useCollectionStore.getState().collections.collections[id]?.metadata,
        customProperties: {
          archived: false,
          restoredAt: new Date(),
        },
      },
    });
  }, [updateCollection]);

  // =============================================================================
  // Bulk Actions
  // =============================================================================

  const bulkUpdate = useCallback(async (
    ids: string[],
    updates: Partial<Collection>
  ): Promise<BulkActionResult> => {
    const operationId = await storeActions.startBulkOperation({
      type: 'update',
      targets: ids,
      params: updates,
      requiresConfirmation: opts.requireConfirmation,
    });

    // Wait for completion
    return new Promise((resolve) => {
      const checkStatus = () => {
        const progress = storeActions.getBulkOperationProgress(operationId);
        if (progress && (progress.status === 'completed' || progress.status === 'failed')) {
          resolve({
            success: progress.status === 'completed',
            successful: progress.status === 'completed' ? ids : [],
            failed: progress.status === 'failed' ? ids.map(id => ({ id, error: progress.error || 'Unknown error' })) : [],
            skipped: [],
            totalProcessed: ids.length,
            duration: Date.now() - progress.startedAt.getTime(),
            operationId,
          });
        } else {
          setTimeout(checkStatus, 100);
        }
      };
      checkStatus();
    });
  }, [storeActions, opts.requireConfirmation]);

  const bulkDelete = useCallback(async (
    ids: string[],
    options = {}
  ): Promise<BulkActionResult> => {
    const operationId = await storeActions.startBulkOperation({
      type: 'delete',
      targets: ids,
      params: options,
      requiresConfirmation: opts.requireConfirmation,
    });

    return new Promise((resolve) => {
      const checkStatus = () => {
        const progress = storeActions.getBulkOperationProgress(operationId);
        if (progress && (progress.status === 'completed' || progress.status === 'failed')) {
          resolve({
            success: progress.status === 'completed',
            successful: progress.status === 'completed' ? ids : [],
            failed: progress.status === 'failed' ? ids.map(id => ({ id, error: progress.error || 'Unknown error' })) : [],
            skipped: [],
            totalProcessed: ids.length,
            duration: Date.now() - progress.startedAt.getTime(),
            operationId,
          });
        } else {
          setTimeout(checkStatus, 100);
        }
      };
      checkStatus();
    });
  }, [storeActions, opts.requireConfirmation]);

  const bulkArchive = useCallback(async (ids: string[]): Promise<BulkActionResult> => {
    return await bulkUpdate(ids, {
      metadata: {
        customProperties: {
          archived: true,
          archivedAt: new Date(),
        },
      },
    } as Partial<Collection>);
  }, [bulkUpdate]);

  const bulkRestore = useCallback(async (ids: string[]): Promise<BulkActionResult> => {
    return await bulkUpdate(ids, {
      metadata: {
        customProperties: {
          archived: false,
          restoredAt: new Date(),
        },
      },
    } as Partial<Collection>);
  }, [bulkUpdate]);

  const customBulkOperation = useCallback(async (
    operation: CollectionBulkOperation
  ): Promise<BulkActionResult> => {
    const operationId = await storeActions.startBulkOperation(operation);

    return new Promise((resolve) => {
      const checkStatus = () => {
        const progress = storeActions.getBulkOperationProgress(operationId);
        if (progress && (progress.status === 'completed' || progress.status === 'failed')) {
          resolve({
            success: progress.status === 'completed',
            successful: progress.status === 'completed' ? operation.targets : [],
            failed: progress.status === 'failed' ? operation.targets.map(id => ({ id, error: progress.error || 'Unknown error' })) : [],
            skipped: [],
            totalProcessed: operation.targets.length,
            duration: Date.now() - progress.startedAt.getTime(),
            operationId,
          });
        } else {
          setTimeout(checkStatus, 100);
        }
      };
      checkStatus();
    });
  }, [storeActions]);

  // =============================================================================
  // Validation Actions
  // =============================================================================

  const validateCollection = useCallback(async (
    collection: Collection | Partial<Collection>
  ): Promise<ValidationResult> => {
    // Mock validation - replace with actual validation logic
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }, []);

  const validateCollections = useCallback(async (
    collections: (Collection | Partial<Collection>)[]
  ): Promise<ValidationResult[]> => {
    return Promise.all(collections.map(validateCollection));
  }, [validateCollection]);

  // =============================================================================
  // Workflow Actions
  // =============================================================================

  const importCollections = useCallback(async (
    data: any[],
    options = {}
  ): Promise<ActionResult<Collection[]>> => {
    try {
      const collections: Collection[] = [];
      
      for (const item of data) {
        const result = await createCollection(item);
        if (result.success && result.data) {
          collections.push(result.data);
        }
      }

      return {
        success: true,
        data: collections,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Import failed',
      };
    }
  }, [createCollection]);

  const exportCollections = useCallback(async (
    ids: string[],
    format: 'json' | 'csv' | 'xlsx'
  ): Promise<ActionResult<Blob>> => {
    try {
      const collections = ids.map(id => 
        useCollectionStore.getState().collections.collections[id]
      ).filter(Boolean);

      let blob: Blob;
      
      switch (format) {
        case 'json':
          blob = new Blob([JSON.stringify(collections, null, 2)], { type: 'application/json' });
          break;
        case 'csv':
          // Mock CSV export - implement actual CSV logic
          blob = new Blob(['CSV data'], { type: 'text/csv' });
          break;
        case 'xlsx':
          // Mock XLSX export - implement actual XLSX logic
          blob = new Blob(['XLSX data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      return {
        success: true,
        data: blob,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      };
    }
  }, []);

  const mergeCollections = useCallback(async (
    sourceIds: string[],
    targetId: string
  ): Promise<ActionResult<Collection>> => {
    try {
      const target = useCollectionStore.getState().collections.collections[targetId];
      if (!target) {
        throw new Error('Target collection not found');
      }

      // Mock merge logic - implement actual merge logic
      const result = await updateCollection(targetId, {
        // Merge logic here
      });

      // Delete source collections
      for (const sourceId of sourceIds) {
        await deleteCollection(sourceId);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Merge failed',
      };
    }
  }, [updateCollection, deleteCollection]);

  const splitCollection = useCallback(async (
    sourceId: string,
    criteria: any
  ): Promise<ActionResult<Collection[]>> => {
    try {
      const source = useCollectionStore.getState().collections.collections[sourceId];
      if (!source) {
        throw new Error('Source collection not found');
      }

      // Mock split logic - implement actual split logic
      const newCollections: Collection[] = [];
      
      return {
        success: true,
        data: newCollections,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Split failed',
      };
    }
  }, []);

  // =============================================================================
  // Operation Management
  // =============================================================================

  const cancelOperation = useCallback((operationId: string) => {
    storeActions.cancelBulkOperation(operationId);
  }, [storeActions]);

  const retryOperation = useCallback(async (operationId: string): Promise<ActionResult> => {
    try {
      await storeActions.retryOperation(operationId);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Retry failed',
      };
    }
  }, [storeActions]);

  const undo = useCallback(async (): Promise<ActionResult> => {
    try {
      // Mock undo logic - implement actual undo logic
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Undo failed',
      };
    }
  }, []);

  const redo = useCallback(async (): Promise<ActionResult> => {
    try {
      // Mock redo logic - implement actual redo logic
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Redo failed',
      };
    }
  }, []);

  const getOperationStatus = useCallback((operationId: string): OperationProgress | null => {
    return storeActions.getBulkOperationProgress(operationId);
  }, [storeActions]);

  // =============================================================================
  // Utility Actions
  // =============================================================================

  const clearErrors = useCallback(() => {
    storeActions.clearError();
  }, [storeActions]);

  const clearError = useCallback((errorType: string) => {
    storeActions.clearError(errorType);
  }, [storeActions]);

  const resetOperations = useCallback(() => {
    useCollectionStore.setState(state => {
      state.operations.activeOperations = {};
      state.operations.operationHistory = [];
    });
  }, []);

  // =============================================================================
  // Return Interface
  // =============================================================================

  return {
    loading,
    error,
    operations,

    // Single Collection Actions
    createCollection,
    updateCollection,
    deleteCollection,
    duplicateCollection,
    archiveCollection,
    restoreCollection,

    // Bulk Actions
    bulkUpdate,
    bulkDelete,
    bulkArchive,
    bulkRestore,
    customBulkOperation,

    // Validation Actions
    validateCollection,
    validateCollections,

    // Workflow Actions
    importCollections,
    exportCollections,
    mergeCollections,
    splitCollection,

    // Operation Management
    cancelOperation,
    retryOperation,
    undo,
    redo,
    getOperationStatus,

    // Utility Actions
    clearErrors,
    clearError,
    resetOperations,
  };
};