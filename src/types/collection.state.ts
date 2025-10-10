/**
 * Collection Management System - State Types
 * 
 * Type definitions for the Zustand store state and related state management
 * structures for the collection management system.
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
  OperationProgress,
  ValidationResult,
  CollectionNotification,
  CollectionEvent,
} from './collection.types';

// =============================================================================
// Core State Interfaces
// =============================================================================

/**
 * Main collections state slice
 */
export interface CollectionsState {
  /** Collections data indexed by ID */
  collections: Record<string, Collection>;
  /** Array of collection IDs in current view order */
  collectionIds: string[];
  /** Currently selected collection IDs */
  selectedIds: Set<string>;
  /** Collection being actively edited */
  editingId: string | null;
  /** Loading states for different operations */
  loading: LoadingState;
  /** Error states */
  errors: ErrorState;
  /** Cache metadata */
  cache: CacheState;
  /** Performance metrics */
  performance: PerformanceState;
}

/**
 * Filter and view state slice
 */
export interface FilterViewState {
  /** Current filter configuration */
  filter: CollectionFilter;
  /** Current sort configuration */
  sort: CollectionSort;
  /** Current pagination state */
  pagination: CollectionPagination;
  /** Current view configuration */
  viewConfig: CollectionViewConfig;
  /** Search history */
  searchHistory: string[];
  /** Filter presets */
  filterPresets: FilterPreset[];
  /** Quick filter state */
  quickFilters: QuickFilterState;
}

/**
 * Operations state slice
 */
export interface OperationsState {
  /** Currently running operations */
  activeOperations: Record<string, OperationProgress>;
  /** Operation history */
  operationHistory: OperationHistoryEntry[];
  /** Bulk operation state */
  bulkOperation: BulkOperationState | null;
  /** Undo/redo stack */
  undoRedoStack: UndoRedoState;
  /** Validation results cache */
  validationCache: Record<string, ValidationResult>;
}

/**
 * Real-time state slice
 */
export interface RealtimeState {
  /** WebSocket connection status */
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting' | 'error';
  /** Last successful connection timestamp */
  lastConnected: Date | null;
  /** Pending real-time updates */
  pendingUpdates: RealtimeUpdate[];
  /** Subscription configuration */
  subscriptions: SubscriptionConfig[];
  /** Connection retry count */
  retryCount: number;
  /** Connection error details */
  connectionError: string | null;
}

/**
 * UI state slice
 */
export interface UIState {
  /** Active notifications */
  notifications: CollectionNotification[];
  /** Modal states */
  modals: ModalState;
  /** Sidebar state */
  sidebar: SidebarState;
  /** Theme preferences */
  theme: ThemeState;
  /** Layout preferences */
  layout: LayoutState;
  /** Keyboard navigation state */
  keyboardNavigation: KeyboardNavigationState;
}

// =============================================================================
// Supporting State Interfaces
// =============================================================================

/**
 * Loading state for different operations
 */
export interface LoadingState {
  /** Loading collections */
  collections: boolean;
  /** Creating collection */
  creating: boolean;
  /** Updating collection */
  updating: Record<string, boolean>;
  /** Deleting collection */
  deleting: Record<string, boolean>;
  /** Bulk operations */
  bulk: boolean;
  /** Validation */
  validating: Record<string, boolean>;
  /** Export operations */
  exporting: boolean;
  /** Import operations */
  importing: boolean;
}

/**
 * Error state management
 */
export interface ErrorState {
  /** Global errors */
  global: ApplicationError[];
  /** Collection-specific errors */
  collections: Record<string, CollectionError[]>;
  /** Operation errors */
  operations: Record<string, OperationError>;
  /** Validation errors */
  validation: Record<string, ValidationResult>;
  /** Network errors */
  network: NetworkError | null;
  /** Last error timestamp */
  lastError: Date | null;
}

/**
 * Cache state management
 */
export interface CacheState {
  /** Cache metadata */
  metadata: Record<string, CacheEntry>;
  /** Cache hit/miss statistics */
  statistics: CacheStatistics;
  /** Cache invalidation rules */
  invalidationRules: CacheInvalidationRule[];
  /** Cache size in bytes */
  size: number;
  /** Max cache size */
  maxSize: number;
  /** Cache TTL in milliseconds */
  ttl: number;
}

/**
 * Performance state tracking
 */
export interface PerformanceState {
  /** Render performance metrics */
  renderMetrics: RenderMetrics;
  /** Data fetch performance */
  fetchMetrics: FetchMetrics;
  /** Memory usage metrics */
  memoryMetrics: MemoryMetrics;
  /** Operation latency */
  operationLatency: Record<string, number>;
  /** Performance history */
  history: PerformanceHistoryEntry[];
}

/**
 * Filter preset configuration
 */
export interface FilterPreset {
  /** Preset ID */
  id: string;
  /** Preset name */
  name: string;
  /** Preset description */
  description?: string;
  /** Filter configuration */
  filter: CollectionFilter;
  /** Sort configuration */
  sort?: CollectionSort;
  /** Is preset global or user-specific */
  isGlobal: boolean;
  /** Created by user ID */
  createdBy: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Usage count */
  usageCount: number;
}

/**
 * Quick filter state
 */
export interface QuickFilterState {
  /** Recently used filters */
  recent: CollectionFilter[];
  /** Favorite filters */
  favorites: string[];
  /** Quick search suggestions */
  suggestions: string[];
  /** Smart filter recommendations */
  recommendations: FilterRecommendation[];
}

/**
 * Bulk operation state
 */
export interface BulkOperationState {
  /** Operation ID */
  id: string;
  /** Operation type */
  type: string;
  /** Target collection IDs */
  targets: string[];
  /** Operation parameters */
  params: Record<string, unknown>;
  /** Progress information */
  progress: OperationProgress;
  /** Preview results */
  preview?: BulkOperationPreview[];
  /** Can be cancelled */
  cancellable: boolean;
  /** Requires confirmation */
  requiresConfirmation: boolean;
}

/**
 * Undo/redo state management
 */
export interface UndoRedoState {
  /** Undo stack */
  undoStack: UndoRedoEntry[];
  /** Redo stack */
  redoStack: UndoRedoEntry[];
  /** Max stack size */
  maxStackSize: number;
  /** Current position in history */
  position: number;
  /** Can undo */
  canUndo: boolean;
  /** Can redo */
  canRedo: boolean;
}

/**
 * Real-time update
 */
export interface RealtimeUpdate {
  /** Update ID */
  id: string;
  /** Update type */
  type: 'collection_updated' | 'collection_created' | 'collection_deleted' | 'status_changed';
  /** Collection ID */
  collectionId: string;
  /** Update data */
  data: unknown;
  /** Update timestamp */
  timestamp: Date;
  /** Update source */
  source: string;
  /** Has been processed */
  processed: boolean;
}

/**
 * Subscription configuration
 */
export interface SubscriptionConfig {
  /** Subscription ID */
  id: string;
  /** Event types to subscribe to */
  eventTypes: string[];
  /** Collection filters */
  filters?: CollectionFilter;
  /** Subscription options */
  options: {
    /** Include historical events */
    includeHistory?: boolean;
    /** Batch updates */
    batchUpdates?: boolean;
    /** Update frequency */
    frequency?: number;
  };
}

/**
 * Modal state management
 */
export interface ModalState {
  /** Create collection modal */
  createCollection: boolean;
  /** Edit collection modal */
  editCollection: string | null;
  /** Delete confirmation modal */
  deleteConfirmation: string | null;
  /** Bulk operation modal */
  bulkOperation: boolean;
  /** Settings modal */
  settings: boolean;
  /** Help modal */
  help: boolean;
  /** Custom modals */
  custom: Record<string, boolean>;
}

/**
 * Sidebar state
 */
export interface SidebarState {
  /** Is sidebar expanded */
  isExpanded: boolean;
  /** Active sidebar section */
  activeSection: 'filters' | 'collections' | 'operations' | 'help' | null;
  /** Sidebar width */
  width: number;
  /** Is sidebar pinned */
  isPinned: boolean;
  /** Sidebar history */
  history: string[];
}

/**
 * Theme state
 */
export interface ThemeState {
  /** Current theme */
  theme: 'light' | 'dark' | 'auto';
  /** High contrast mode */
  highContrast: boolean;
  /** Reduced motion */
  reducedMotion: boolean;
  /** Font size */
  fontSize: 'small' | 'medium' | 'large';
  /** Color scheme preference */
  colorScheme: 'default' | 'colorblind' | 'monochrome';
}

/**
 * Layout state
 */
export interface LayoutState {
  /** Sidebar width */
  sidebarWidth: number;
  /** Main content padding */
  contentPadding: number;
  /** Grid item size */
  gridItemSize: 'small' | 'medium' | 'large';
  /** Table row height */
  tableRowHeight: 'compact' | 'comfortable' | 'spacious';
  /** Panel positions */
  panelPositions: Record<string, { x: number; y: number; width: number; height: number }>;
}

/**
 * Keyboard navigation state
 */
export interface KeyboardNavigationState {
  /** Currently focused element */
  focusedElement: string | null;
  /** Focus trap active */
  focusTrapActive: boolean;
  /** Keyboard shortcuts enabled */
  shortcutsEnabled: boolean;
  /** Navigation mode */
  navigationMode: 'mouse' | 'keyboard' | 'mixed';
  /** Focus history */
  focusHistory: string[];
}

// =============================================================================
// Root State Interface
// =============================================================================

/**
 * Root collection management state
 */
export interface CollectionManagementState {
  /** Collections data and selection */
  collections: CollectionsState;
  /** Filtering and view state */
  filterView: FilterViewState;
  /** Operations and history */
  operations: OperationsState;
  /** Real-time updates */
  realtime: RealtimeState;
  /** UI state */
  ui: UIState;
}

// =============================================================================
// Helper Types
// =============================================================================

/**
 * Application error
 */
export interface ApplicationError {
  /** Error ID */
  id: string;
  /** Error message */
  message: string;
  /** Error code */
  code: string;
  /** Error severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Error timestamp */
  timestamp: Date;
  /** Error context */
  context?: Record<string, unknown>;
  /** Error stack trace */
  stack?: string;
  /** Is error recoverable */
  recoverable: boolean;
}

/**
 * Collection-specific error
 */
export interface CollectionError {
  /** Collection ID */
  collectionId: string;
  /** Error type */
  type: 'validation' | 'network' | 'permission' | 'conflict' | 'system';
  /** Error message */
  message: string;
  /** Error details */
  details?: Record<string, unknown>;
  /** Error timestamp */
  timestamp: Date;
  /** Suggested action */
  suggestedAction?: string;
}

/**
 * Operation error
 */
export interface OperationError {
  /** Operation ID */
  operationId: string;
  /** Operation type */
  operationType: string;
  /** Error message */
  message: string;
  /** Error code */
  code: string;
  /** Failed at step */
  step?: number;
  /** Error timestamp */
  timestamp: Date;
  /** Can retry */
  canRetry: boolean;
  /** Retry count */
  retryCount: number;
}

/**
 * Network error
 */
export interface NetworkError {
  /** Error type */
  type: 'timeout' | 'connection' | 'server' | 'authentication' | 'authorization';
  /** Error message */
  message: string;
  /** HTTP status code */
  statusCode?: number;
  /** Error timestamp */
  timestamp: Date;
  /** Retry after (seconds) */
  retryAfter?: number;
}

/**
 * Cache entry metadata
 */
export interface CacheEntry {
  /** Cache key */
  key: string;
  /** Data size in bytes */
  size: number;
  /** Creation timestamp */
  createdAt: Date;
  /** Last accessed timestamp */
  lastAccessed: Date;
  /** Access count */
  accessCount: number;
  /** TTL in milliseconds */
  ttl: number;
  /** Cache tags */
  tags: string[];
}

/**
 * Cache statistics
 */
export interface CacheStatistics {
  /** Total cache hits */
  hits: number;
  /** Total cache misses */
  misses: number;
  /** Hit rate percentage */
  hitRate: number;
  /** Total cache size */
  totalSize: number;
  /** Number of cache entries */
  entryCount: number;
  /** Average entry size */
  averageEntrySize: number;
}

/**
 * Cache invalidation rule
 */
export interface CacheInvalidationRule {
  /** Rule ID */
  id: string;
  /** Rule name */
  name: string;
  /** Pattern to match */
  pattern: string;
  /** Trigger events */
  triggers: string[];
  /** Rule priority */
  priority: number;
  /** Is rule active */
  active: boolean;
}

/**
 * Performance metrics
 */
export interface RenderMetrics {
  /** Average render time */
  averageRenderTime: number;
  /** Max render time */
  maxRenderTime: number;
  /** Total renders */
  totalRenders: number;
  /** Slow renders count */
  slowRenders: number;
  /** Frame drops */
  frameDrops: number;
}

/**
 * Fetch metrics
 */
export interface FetchMetrics {
  /** Average fetch time */
  averageFetchTime: number;
  /** Max fetch time */
  maxFetchTime: number;
  /** Total fetches */
  totalFetches: number;
  /** Failed fetches */
  failedFetches: number;
  /** Cache hit rate */
  cacheHitRate: number;
}

/**
 * Memory metrics
 */
export interface MemoryMetrics {
  /** Heap used */
  heapUsed: number;
  /** Heap total */
  heapTotal: number;
  /** External memory */
  external: number;
  /** Array buffers */
  arrayBuffers: number;
}

/**
 * Performance history entry
 */
export interface PerformanceHistoryEntry {
  /** Timestamp */
  timestamp: Date;
  /** Metrics snapshot */
  metrics: {
    render: RenderMetrics;
    fetch: FetchMetrics;
    memory: MemoryMetrics;
  };
  /** Context */
  context?: string;
}

/**
 * Operation history entry
 */
export interface OperationHistoryEntry {
  /** Operation ID */
  id: string;
  /** Operation type */
  type: string;
  /** Operation parameters */
  params: Record<string, unknown>;
  /** Start timestamp */
  startTime: Date;
  /** End timestamp */
  endTime: Date;
  /** Operation status */
  status: 'completed' | 'failed' | 'cancelled';
  /** Duration in milliseconds */
  duration: number;
  /** Affected collections */
  affectedCollections: string[];
  /** User who initiated */
  initiatedBy: string;
}

/**
 * Filter recommendation
 */
export interface FilterRecommendation {
  /** Recommendation ID */
  id: string;
  /** Recommendation text */
  text: string;
  /** Suggested filter */
  filter: CollectionFilter;
  /** Recommendation confidence */
  confidence: number;
  /** Recommendation reason */
  reason: string;
  /** Usage count */
  usageCount: number;
}

/**
 * Bulk operation preview
 */
export interface BulkOperationPreview {
  /** Collection ID */
  collectionId: string;
  /** Collection name */
  collectionName: string;
  /** Current values */
  currentValues: Record<string, unknown>;
  /** Proposed changes */
  proposedChanges: Record<string, unknown>;
  /** Validation warnings */
  warnings: string[];
  /** Validation errors */
  errors: string[];
  /** Risk score (0-100) */
  riskScore: number;
}

/**
 * Undo/redo entry
 */
export interface UndoRedoEntry {
  /** Entry ID */
  id: string;
  /** Operation description */
  description: string;
  /** Operation type */
  type: string;
  /** Previous state */
  previousState: unknown;
  /** New state */
  newState: unknown;
  /** Affected collections */
  affectedCollections: string[];
  /** Timestamp */
  timestamp: Date;
  /** Can be undone */
  canUndo: boolean;
}

// =============================================================================
// State Selector Types
// =============================================================================

/**
 * State selector function type
 */
export type StateSelector<T> = (state: CollectionManagementState) => T;

/**
 * Derived state selector
 */
export type DerivedSelector<T, U> = (input: T) => U;

/**
 * Memoized selector options
 */
export interface SelectorOptions {
  /** Memoization key */
  memoKey?: string;
  /** Equality function */
  equalityFn?: (a: unknown, b: unknown) => boolean;
  /** Cache size */
  cacheSize?: number;
}