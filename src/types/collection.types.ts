/**
 * Collection Management System - Core Types
 * 
 * Comprehensive type definitions for the new collection management architecture.
 * Supports multi-dimensional status tracking, enhanced filtering, and real-time updates.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

// =============================================================================
// Core Collection Types
// =============================================================================

/**
 * Multi-dimensional status tracking interface
 */
export interface StatusDimensions {
  /** Operational status */
  operational: 'nominal' | 'degraded' | 'critical' | 'offline';
  /** Capacity utilization (0-100) */
  capacity: number;
  /** Priority level */
  priority: 'low' | 'normal' | 'high' | 'urgent';
  /** Conflict count */
  conflicts: number;
}

/**
 * Collection priority levels
 */
export type CollectionPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Collection status enumeration
 */
export type CollectionStatus = 'draft' | 'active' | 'completed' | 'failed' | 'archived' | 'deleted';

/**
 * Enhanced collection status with multi-dimensional health tracking
 */
export interface CollectionStatusInfo extends StatusDimensions {
  /** Overall collection health score (0-100) */
  healthScore: number;
  /** Last status update timestamp */
  lastUpdated: Date;
  /** Status change history */
  statusHistory?: StatusHistoryEntry[];
}

/**
 * Status history tracking for audit trail
 */
export interface StatusHistoryEntry {
  timestamp: Date;
  previousStatus: Partial<StatusDimensions>;
  newStatus: Partial<StatusDimensions>;
  changedBy: string;
  reason?: string;
}

/**
 * Collection item with enhanced metadata and status tracking
 */
export interface Collection {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Optional description */
  description?: string;
  /** Collection type */
  type: CollectionType;
  /** Collection priority */
  priority: CollectionPriority;
  /** Collection status */
  status: CollectionStatus;
  /** Enhanced status information */
  statusInfo: CollectionStatusInfo;
  /** Associated metadata */
  metadata: CollectionMetadata;
  /** Creation timestamp */
  createdAt: Date;
  /** Last modification timestamp */
  updatedAt: Date;
  /** End date (for time-limited collections) */
  endDate?: Date;
  /** User who created the collection */
  createdBy: string;
  /** User who last modified the collection */
  updatedBy: string;
  /** Tags for categorization */
  tags: string[];
  /** Parent collection ID (for hierarchical collections) */
  parentId?: string;
  /** Child collection IDs */
  childIds: string[];
}

/**
 * Collection type enumeration
 */
export type CollectionType = 
  | 'satellite'
  | 'ground_station'
  | 'mission'
  | 'campaign'
  | 'analysis'
  | 'custom';

/**
 * Collection metadata for extended information
 */
export interface CollectionMetadata {
  /** Classification level */
  classification: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  /** Geographic region */
  region?: string;
  /** Mission criticality */
  criticality: 'low' | 'medium' | 'high' | 'critical';
  /** Estimated completion date */
  estimatedCompletion?: Date;
  /** Progress percentage (0-100) */
  progress: number;
  /** Resource requirements */
  resourceRequirements: ResourceRequirement[];
  /** Capacity information */
  capacity?: {
    total: number;
    used: number;
    unit: string;
  };
  /** Conflict count */
  conflicts?: number;
  /** Custom properties */
  customProperties: Record<string, unknown>;
}

/**
 * Resource requirement specification
 */
export interface ResourceRequirement {
  /** Resource type */
  type: 'bandwidth' | 'storage' | 'processing' | 'personnel' | 'equipment';
  /** Required amount */
  amount: number;
  /** Unit of measurement */
  unit: string;
  /** Priority of requirement */
  priority: 'required' | 'preferred' | 'optional';
}

// =============================================================================
// Filter and Sort Types
// =============================================================================

/**
 * Comprehensive filter configuration
 */
export interface CollectionFilter {
  /** Text search query */
  search?: string;
  /** Collection types to include */
  types?: CollectionType[];
  /** Collection type filter (legacy support) */
  type?: CollectionType;
  /** Collection priority filter */
  priority?: CollectionPriority;
  /** Status filters */
  status?: {
    operational?: StatusDimensions['operational'][];
    capacity?: StatusDimensions['capacity'][];
    priority?: StatusDimensions['priority'][];
    healthRange?: [number, number];
    conflictRange?: [number, number];
  };
  /** Metadata filters */
  metadata?: {
    classification?: CollectionMetadata['classification'][];
    criticality?: CollectionMetadata['criticality'][];
    region?: string[];
    progressRange?: [number, number];
  };
  /** Date range filters */
  dateRange?: {
    createdAfter?: Date;
    createdBefore?: Date;
    updatedAfter?: Date;
    updatedBefore?: Date;
    start?: Date;
    end?: Date;
  };
  /** Tag filters */
  tags?: string[];
  /** User filters */
  users?: {
    createdBy?: string[];
    updatedBy?: string[];
  };
  /** Hierarchy filters */
  hierarchy?: {
    parentId?: string;
    hasChildren?: boolean;
    depth?: number;
  };
  /** Capacity threshold filter */
  capacityThreshold?: number;
  /** Has conflicts filter */
  hasConflicts?: boolean;
}

/**
 * Sort configuration for collections
 */
export interface CollectionSort {
  /** Field to sort by */
  field: keyof Collection | 'status.healthScore' | 'metadata.progress' | 'metadata.criticality' | 'priority' | 'capacity';
  /** Sort direction */
  direction: 'asc' | 'desc';
  /** Secondary sort field */
  secondary?: {
    field: CollectionSort['field'];
    direction: CollectionSort['direction'];
  };
}

/**
 * Pagination configuration
 */
export interface CollectionPagination {
  /** Current page (0-based) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items */
  total: number;
  /** Total number of pages */
  totalPages: number;
}

// =============================================================================
// View and Layout Types
// =============================================================================

/**
 * View mode for collection display
 */
export type CollectionViewMode = 'grid' | 'list' | 'table' | 'timeline' | 'hierarchy';

/**
 * View configuration
 */
export interface CollectionViewConfig {
  /** Current view mode */
  mode: CollectionViewMode;
  /** Columns to display (for table view) */
  columns?: CollectionTableColumn[];
  /** Grid configuration (for grid view) */
  grid?: {
    itemsPerRow: number;
    showThumbnails: boolean;
    showStatus: boolean;
  };
  /** List configuration (for list view) */
  list?: {
    showDescription: boolean;
    showMetadata: boolean;
    showTags: boolean;
  };
  /** Density setting */
  density: 'compact' | 'comfortable' | 'spacious';
  /** Performance settings */
  performance?: {
    virtualization: boolean;
    memoization: boolean;
    debouncing: boolean;
  };
  /** Feature flags */
  features?: {
    healthScoring: boolean;
    realTimeUpdates: boolean;
    accessibility: boolean;
    analytics: boolean;
  };
  /** Table options */
  tableOptions?: {
    resizable: boolean;
    sortable: boolean;
  };
}

/**
 * Table column configuration
 */
export interface CollectionTableColumn {
  /** Column key */
  key: string;
  /** Display label */
  label: string;
  /** Column width */
  width?: number;
  /** Is column sortable */
  sortable: boolean;
  /** Is column resizable */
  resizable: boolean;
  /** Is column visible */
  visible: boolean;
  /** Column data type */
  dataType: 'string' | 'number' | 'date' | 'status' | 'progress' | 'custom';
  /** Custom render function key */
  renderKey?: string;
}

// =============================================================================
// Action and Operation Types
// =============================================================================

/**
 * Collection action types
 */
export type CollectionActionType =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'duplicate'
  | 'archive'
  | 'restore'
  | 'merge'
  | 'split'
  | 'move'
  | 'export'
  | 'import';

/**
 * Collection action definition
 */
export interface CollectionAction {
  /** Action type */
  type: CollectionActionType;
  /** Action payload */
  payload: unknown;
  /** Target collection IDs */
  targets: string[];
  /** Optimistic update data */
  optimisticUpdate?: Partial<Collection>[];
  /** Rollback data */
  rollback?: Partial<Collection>[];
}

/**
 * Bulk operation configuration
 */
export interface CollectionBulkOperation {
  /** Operation type */
  type: 'update' | 'delete' | 'archive' | 'tag' | 'move';
  /** Target collection IDs */
  targets: string[];
  /** Operation parameters */
  params: Record<string, unknown>;
  /** Confirmation required */
  requiresConfirmation: boolean;
  /** Estimated duration */
  estimatedDuration?: number;
}

/**
 * Operation progress tracking
 */
export interface OperationProgress {
  /** Operation ID */
  id: string;
  /** Operation type */
  type: string;
  /** Current progress (0-100) */
  progress: number;
  /** Operation status */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  /** Start timestamp */
  startedAt: Date;
  /** Completion timestamp */
  completedAt?: Date;
  /** Error message if failed */
  error?: string;
  /** Progress details */
  details?: {
    current: number;
    total: number;
    currentItem?: string;
    phase?: string;
  };
}

// =============================================================================
// Event and Notification Types
// =============================================================================

/**
 * Collection event types
 */
export type CollectionEventType =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'status_changed'
  | 'conflict_detected'
  | 'conflict_resolved'
  | 'health_degraded'
  | 'health_improved'
  | 'capacity_warning'
  | 'capacity_critical';

/**
 * Collection event
 */
export interface CollectionEvent {
  /** Event ID */
  id: string;
  /** Event type */
  type: CollectionEventType;
  /** Collection ID */
  collectionId: string;
  /** Event timestamp */
  timestamp: Date;
  /** User who triggered the event */
  userId: string;
  /** Event data */
  data: Record<string, unknown>;
  /** Event severity */
  severity: 'info' | 'warning' | 'error' | 'critical';
}

/**
 * Real-time notification
 */
export interface CollectionNotification {
  /** Notification ID */
  id: string;
  /** Notification type */
  type: 'info' | 'success' | 'warning' | 'error';
  /** Notification title */
  title: string;
  /** Notification message */
  message: string;
  /** Related collection ID */
  collectionId?: string;
  /** Timestamp */
  timestamp: Date;
  /** Auto-dismiss timeout (ms) */
  timeout?: number;
  /** Notification actions */
  actions?: NotificationAction[];
  /** Is notification read */
  isRead: boolean;
}

/**
 * Notification action
 */
export interface NotificationAction {
  /** Action label */
  label: string;
  /** Action handler key */
  handler: string;
  /** Action parameters */
  params?: Record<string, unknown>;
  /** Action intent */
  intent?: 'primary' | 'success' | 'warning' | 'danger';
}

// =============================================================================
// Validation Types
// =============================================================================

/**
 * Validation rule
 */
export interface ValidationRule {
  /** Rule name */
  name: string;
  /** Rule description */
  description: string;
  /** Validation function key */
  validator: string;
  /** Rule parameters */
  params?: Record<string, unknown>;
  /** Rule severity */
  severity: 'error' | 'warning' | 'info';
  /** Is rule required */
  required: boolean;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Is validation valid */
  isValid: boolean;
  /** Validation errors */
  errors: ValidationError[];
  /** Validation warnings */
  warnings: ValidationWarning[];
  /** Validation metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Field that caused the error */
  field?: string;
  /** Error severity */
  severity: 'error' | 'critical';
  /** Suggested fix */
  suggestion?: string;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  /** Warning code */
  code: string;
  /** Warning message */
  message: string;
  /** Field that caused the warning */
  field?: string;
  /** Warning impact */
  impact: 'low' | 'medium' | 'high';
  /** Recommendation */
  recommendation?: string;
}

// =============================================================================
// Export all types
// =============================================================================

export * from './collection.actions';
export * from './collection.state';