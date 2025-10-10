/**
 * Collection Management System - Action Types
 * 
 * Type definitions for all collection management actions, including CRUD operations,
 * bulk operations, real-time updates, and state management.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import {
  Collection,
  CollectionFilter,
  CollectionSort,
  CollectionPagination,
  CollectionViewConfig,
  CollectionBulkOperation,
  OperationProgress,
  ValidationResult,
} from './collection.types';

// =============================================================================
// Base Action Types
// =============================================================================

/**
 * Base action interface for all collection actions
 */
export interface BaseAction<T = unknown> {
  /** Action type identifier */
  type: string;
  /** Action payload */
  payload: T;
  /** Action metadata */
  meta?: {
    /** Unique request ID */
    requestId: string;
    /** Timestamp when action was created */
    timestamp: Date;
    /** User who initiated the action */
    userId?: string;
    /** Whether this is an optimistic update */
    optimistic?: boolean;
    /** Previous state for rollback */
    previousState?: unknown;
  };
  /** Error information if action failed */
  error?: {
    /** Error message */
    message: string;
    /** Error code */
    code: string;
    /** Error details */
    details?: Record<string, unknown>;
  };
}

// =============================================================================
// Collection CRUD Actions
// =============================================================================

/**
 * Load collections action
 */
export interface LoadCollectionsAction extends BaseAction<{
  filter?: CollectionFilter;
  sort?: CollectionSort;
  pagination?: CollectionPagination;
  forceRefresh?: boolean;
}> {
  type: 'collections/load';
}

/**
 * Load collections success action
 */
export interface LoadCollectionsSuccessAction extends BaseAction<{
  collections: Collection[];
  pagination: CollectionPagination;
  filter: CollectionFilter;
  sort: CollectionSort;
  totalCount: number;
  loadTime: number;
}> {
  type: 'collections/load/success';
}

/**
 * Load collections failure action
 */
export interface LoadCollectionsFailureAction extends BaseAction<{
  error: string;
  retryCount: number;
  lastAttempt: Date;
}> {
  type: 'collections/load/failure';
}

/**
 * Create collection action
 */
export interface CreateCollectionAction extends BaseAction<{
  collection: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>;
  validateBeforeCreate?: boolean;
}> {
  type: 'collections/create';
}

/**
 * Create collection success action
 */
export interface CreateCollectionSuccessAction extends BaseAction<{
  collection: Collection;
  validationResult?: ValidationResult;
}> {
  type: 'collections/create/success';
}

/**
 * Update collection action
 */
export interface UpdateCollectionAction extends BaseAction<{
  id: string;
  updates: Partial<Collection>;
  mergeStrategy?: 'shallow' | 'deep' | 'replace';
  validateBeforeUpdate?: boolean;
}> {
  type: 'collections/update';
}

/**
 * Update collection success action
 */
export interface UpdateCollectionSuccessAction extends BaseAction<{
  collection: Collection;
  previousVersion: Collection;
  validationResult?: ValidationResult;
}> {
  type: 'collections/update/success';
}

/**
 * Delete collection action
 */
export interface DeleteCollectionAction extends BaseAction<{
  id: string;
  cascade?: boolean;
  softDelete?: boolean;
}> {
  type: 'collections/delete';
}

/**
 * Delete collection success action
 */
export interface DeleteCollectionSuccessAction extends BaseAction<{
  id: string;
  deletedCollection: Collection;
  cascadeResults?: string[];
}> {
  type: 'collections/delete/success';
}

/**
 * Duplicate collection action
 */
export interface DuplicateCollectionAction extends BaseAction<{
  sourceId: string;
  updates?: Partial<Collection>;
  includeChildren?: boolean;
}> {
  type: 'collections/duplicate';
}

// =============================================================================
// Bulk Operations Actions
// =============================================================================

/**
 * Start bulk operation action
 */
export interface StartBulkOperationAction extends BaseAction<{
  operation: CollectionBulkOperation;
  preview?: boolean;
}> {
  type: 'collections/bulk/start';
}

/**
 * Bulk operation progress action
 */
export interface BulkOperationProgressAction extends BaseAction<{
  operationId: string;
  progress: OperationProgress;
}> {
  type: 'collections/bulk/progress';
}

/**
 * Bulk operation success action
 */
export interface BulkOperationSuccessAction extends BaseAction<{
  operationId: string;
  results: {
    successful: string[];
    failed: Array<{ id: string; error: string }>;
    skipped: string[];
  };
  totalProcessed: number;
  duration: number;
}> {
  type: 'collections/bulk/success';
}

/**
 * Cancel bulk operation action
 */
export interface CancelBulkOperationAction extends BaseAction<{
  operationId: string;
  reason?: string;
}> {
  type: 'collections/bulk/cancel';
}

// =============================================================================
// Filter and View Actions
// =============================================================================

/**
 * Set filter action
 */
export interface SetFilterAction extends BaseAction<{
  filter: CollectionFilter;
  preserveSort?: boolean;
  resetPagination?: boolean;
}> {
  type: 'collections/filter/set';
}

/**
 * Clear filter action
 */
export interface ClearFilterAction extends BaseAction<{
  preserveSearch?: boolean;
}> {
  type: 'collections/filter/clear';
}

/**
 * Set sort action
 */
export interface SetSortAction extends BaseAction<{
  sort: CollectionSort;
  resetPagination?: boolean;
}> {
  type: 'collections/sort/set';
}

/**
 * Set pagination action
 */
export interface SetPaginationAction extends BaseAction<{
  pagination: Partial<CollectionPagination>;
}> {
  type: 'collections/pagination/set';
}

/**
 * Set view config action
 */
export interface SetViewConfigAction extends BaseAction<{
  viewConfig: Partial<CollectionViewConfig>;
  saveToPreferences?: boolean;
}> {
  type: 'collections/view/set';
}

// =============================================================================
// Selection Actions
// =============================================================================

/**
 * Select collections action
 */
export interface SelectCollectionsAction extends BaseAction<{
  ids: string[];
  mode?: 'replace' | 'add' | 'remove' | 'toggle';
}> {
  type: 'collections/select';
}

/**
 * Select all collections action
 */
export interface SelectAllCollectionsAction extends BaseAction<{
  selectFiltered?: boolean;
}> {
  type: 'collections/select/all';
}

/**
 * Clear selection action
 */
export interface ClearSelectionAction extends BaseAction<undefined> {
  type: 'collections/select/clear';
}

// =============================================================================
// Real-time Actions
// =============================================================================

/**
 * Real-time collection update action
 */
export interface RealtimeCollectionUpdateAction extends BaseAction<{
  collection: Collection;
  changeType: 'created' | 'updated' | 'deleted' | 'status_changed';
  source: 'websocket' | 'polling' | 'push';
}> {
  type: 'collections/realtime/update';
}

/**
 * Connection status change action
 */
export interface ConnectionStatusChangeAction extends BaseAction<{
  status: 'connected' | 'disconnected' | 'reconnecting' | 'error';
  lastConnected?: Date;
  errorDetails?: string;
}> {
  type: 'collections/realtime/connection';
}

// =============================================================================
// Cache and Performance Actions
// =============================================================================

/**
 * Invalidate cache action
 */
export interface InvalidateCacheAction extends BaseAction<{
  keys?: string[];
  pattern?: string;
  clearAll?: boolean;
}> {
  type: 'collections/cache/invalidate';
}

/**
 * Preload collections action
 */
export interface PreloadCollectionsAction extends BaseAction<{
  ids: string[];
  priority?: 'high' | 'normal' | 'low';
}> {
  type: 'collections/preload';
}

/**
 * Update performance metrics action
 */
export interface UpdatePerformanceMetricsAction extends BaseAction<{
  metrics: {
    renderTime: number;
    dataFetchTime: number;
    cacheHitRate: number;
    memoryUsage: number;
    operationLatency: number;
  };
}> {
  type: 'collections/performance/update';
}

// =============================================================================
// Error Handling Actions
// =============================================================================

/**
 * Clear error action
 */
export interface ClearErrorAction extends BaseAction<{
  errorId?: string;
  clearAll?: boolean;
}> {
  type: 'collections/error/clear';
}

/**
 * Retry failed operation action
 */
export interface RetryOperationAction extends BaseAction<{
  operationId: string;
  maxRetries?: number;
}> {
  type: 'collections/operation/retry';
}

/**
 * Rollback operation action
 */
export interface RollbackOperationAction extends BaseAction<{
  operationId: string;
  toState?: unknown;
}> {
  type: 'collections/operation/rollback';
}

// =============================================================================
// Union of All Actions
// =============================================================================

/**
 * Union type of all collection actions
 */
export type CollectionAction =
  // CRUD operations
  | LoadCollectionsAction
  | LoadCollectionsSuccessAction
  | LoadCollectionsFailureAction
  | CreateCollectionAction
  | CreateCollectionSuccessAction
  | UpdateCollectionAction
  | UpdateCollectionSuccessAction
  | DeleteCollectionAction
  | DeleteCollectionSuccessAction
  | DuplicateCollectionAction
  // Bulk operations
  | StartBulkOperationAction
  | BulkOperationProgressAction
  | BulkOperationSuccessAction
  | CancelBulkOperationAction
  // Filter and view
  | SetFilterAction
  | ClearFilterAction
  | SetSortAction
  | SetPaginationAction
  | SetViewConfigAction
  // Selection
  | SelectCollectionsAction
  | SelectAllCollectionsAction
  | ClearSelectionAction
  // Real-time
  | RealtimeCollectionUpdateAction
  | ConnectionStatusChangeAction
  // Cache and performance
  | InvalidateCacheAction
  | PreloadCollectionsAction
  | UpdatePerformanceMetricsAction
  // Error handling
  | ClearErrorAction
  | RetryOperationAction
  | RollbackOperationAction;

// =============================================================================
// Action Creators Type Helpers
// =============================================================================

/**
 * Extract action type from action interface
 */
export type ActionType<T> = T extends { type: infer U } ? U : never;

/**
 * Extract payload type from action interface
 */
export type ActionPayload<T> = T extends BaseAction<infer P> ? P : never;

/**
 * Action creator function type
 */
export type ActionCreator<T extends BaseAction> = (
  payload: ActionPayload<T>,
  meta?: T['meta']
) => T;

/**
 * Async action creator function type
 */
export type AsyncActionCreator<T extends BaseAction> = (
  payload: ActionPayload<T>,
  meta?: T['meta']
) => Promise<T>;

// =============================================================================
// Action Type Constants
// =============================================================================

/**
 * Action type constants for type-safe action dispatching
 */
export const ActionTypes = {
  // CRUD operations
  LOAD_COLLECTIONS: 'collections/load' as const,
  LOAD_COLLECTIONS_SUCCESS: 'collections/load/success' as const,
  LOAD_COLLECTIONS_FAILURE: 'collections/load/failure' as const,
  CREATE_COLLECTION: 'collections/create' as const,
  CREATE_COLLECTION_SUCCESS: 'collections/create/success' as const,
  UPDATE_COLLECTION: 'collections/update' as const,
  UPDATE_COLLECTION_SUCCESS: 'collections/update/success' as const,
  DELETE_COLLECTION: 'collections/delete' as const,
  DELETE_COLLECTION_SUCCESS: 'collections/delete/success' as const,
  DUPLICATE_COLLECTION: 'collections/duplicate' as const,
  
  // Bulk operations
  START_BULK_OPERATION: 'collections/bulk/start' as const,
  BULK_OPERATION_PROGRESS: 'collections/bulk/progress' as const,
  BULK_OPERATION_SUCCESS: 'collections/bulk/success' as const,
  CANCEL_BULK_OPERATION: 'collections/bulk/cancel' as const,
  
  // Filter and view
  SET_FILTER: 'collections/filter/set' as const,
  CLEAR_FILTER: 'collections/filter/clear' as const,
  SET_SORT: 'collections/sort/set' as const,
  SET_PAGINATION: 'collections/pagination/set' as const,
  SET_VIEW_CONFIG: 'collections/view/set' as const,
  
  // Selection
  SELECT_COLLECTIONS: 'collections/select' as const,
  SELECT_ALL_COLLECTIONS: 'collections/select/all' as const,
  CLEAR_SELECTION: 'collections/select/clear' as const,
  
  // Real-time
  REALTIME_COLLECTION_UPDATE: 'collections/realtime/update' as const,
  CONNECTION_STATUS_CHANGE: 'collections/realtime/connection' as const,
  
  // Cache and performance
  INVALIDATE_CACHE: 'collections/cache/invalidate' as const,
  PRELOAD_COLLECTIONS: 'collections/preload' as const,
  UPDATE_PERFORMANCE_METRICS: 'collections/performance/update' as const,
  
  // Error handling
  CLEAR_ERROR: 'collections/error/clear' as const,
  RETRY_OPERATION: 'collections/operation/retry' as const,
  ROLLBACK_OPERATION: 'collections/operation/rollback' as const,
} as const;