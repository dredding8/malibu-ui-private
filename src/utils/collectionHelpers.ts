/**
 * Collection Helpers
 * 
 * Utility functions for collection data transformation, validation,
 * and common operations.
 * 
 * @version 2.0.0
 * @date 2025-09-30
 */

import { 
  Collection, 
  CollectionStatus,
  CollectionType,
  CollectionPriority,
  CollectionFilter,
  CollectionSort,
  ValidationResult,
  ValidationError,
  ValidationWarning
} from '../types/collection.types';
import { 
  CollectionOpportunity,
  OpportunityStatus,
  MatchStatus 
} from '../types/collectionOpportunities';

// =============================================================================
// Status and State Helpers
// =============================================================================

/**
 * Determine collection health based on multiple factors
 */
export function calculateCollectionHealth(collection: Collection): {
  status: 'healthy' | 'warning' | 'critical';
  score: number;
  factors: Record<string, number>;
} {
  const factors = {
    capacity: 1.0,
    conflicts: 1.0,
    age: 1.0,
    priority: 1.0,
    completeness: 1.0,
  };

  // Capacity factor
  if (collection.metadata?.capacity) {
    const utilization = collection.metadata.capacity.used / collection.metadata.capacity.total;
    if (utilization > 0.9) factors.capacity = 0.2;
    else if (utilization > 0.8) factors.capacity = 0.5;
    else if (utilization > 0.7) factors.capacity = 0.8;
  }

  // Conflicts factor
  const conflictCount = collection.metadata?.conflicts || 0;
  if (conflictCount > 10) factors.conflicts = 0.2;
  else if (conflictCount > 5) factors.conflicts = 0.5;
  else if (conflictCount > 0) factors.conflicts = 0.8;

  // Age factor (staleness)
  const ageInDays = getCollectionAge(collection);
  if (ageInDays > 30) factors.age = 0.5;
  else if (ageInDays > 14) factors.age = 0.8;

  // Priority factor
  if (collection.priority === 'critical') factors.priority = 1.2;
  else if (collection.priority === 'low') factors.priority = 0.8;

  // Calculate overall score
  const weights = {
    capacity: 0.3,
    conflicts: 0.25,
    age: 0.15,
    priority: 0.2,
    completeness: 0.1,
  };

  const score = Object.entries(factors).reduce((total, [key, value]) => {
    return total + (value * weights[key as keyof typeof weights]);
  }, 0);

  // Determine status
  let status: 'healthy' | 'warning' | 'critical';
  if (score < 0.4) status = 'critical';
  else if (score < 0.7) status = 'warning';
  else status = 'healthy';

  return { status, score, factors };
}

/**
 * Get collection age in days
 */
export function getCollectionAge(collection: Collection): number {
  const created = new Date(collection.createdAt);
  const now = new Date();
  const diffInMs = now.getTime() - created.getTime();
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
}

/**
 * Determine if collection is active
 */
export function isCollectionActive(collection: Collection): boolean {
  if (collection.status === 'archived' || collection.status === 'deleted') {
    return false;
  }

  if (collection.endDate && new Date(collection.endDate) < new Date()) {
    return false;
  }

  return true;
}

/**
 * Calculate collection progress percentage
 */
export function calculateCollectionProgress(collection: Collection): number {
  const capacity = collection.metadata?.capacity;
  if (!capacity || capacity.total === 0) return 0;
  
  return Math.round((capacity.used / capacity.total) * 100);
}

// =============================================================================
// Filtering and Sorting Helpers
// =============================================================================

/**
 * Apply filters to collection array
 */
export function filterCollections(
  collections: Collection[],
  filter: CollectionFilter
): Collection[] {
  return collections.filter(collection => {
    // Search filter
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const searchableText = [
        collection.name,
        collection.description,
        collection.type,
        collection.tags?.join(' '),
      ].join(' ').toLowerCase();
      
      if (!searchableText.includes(searchLower)) {
        return false;
      }
    }

    // Status filter
    if (filter.status && collection.status !== filter.status) {
      return false;
    }

    // Type filter
    if (filter.type && collection.type !== filter.type) {
      return false;
    }

    // Priority filter
    if (filter.priority && collection.priority !== filter.priority) {
      return false;
    }

    // Date range filter
    if (filter.dateRange) {
      const collectionDate = new Date(collection.updatedAt);
      
      if (filter.dateRange.start && collectionDate < new Date(filter.dateRange.start)) {
        return false;
      }
      
      if (filter.dateRange.end && collectionDate > new Date(filter.dateRange.end)) {
        return false;
      }
    }

    // Capacity filter
    if (filter.capacityThreshold !== undefined && collection.metadata?.capacity) {
      const utilization = (collection.metadata.capacity.used / collection.metadata.capacity.total) * 100;
      if (utilization < filter.capacityThreshold) {
        return false;
      }
    }

    // Tags filter
    if (filter.tags && filter.tags.length > 0) {
      const hasAllTags = filter.tags.every(tag => 
        collection.tags?.includes(tag)
      );
      if (!hasAllTags) {
        return false;
      }
    }

    // Has conflicts filter
    if (filter.hasConflicts !== undefined) {
      const hasConflicts = (collection.metadata?.conflicts || 0) > 0;
      if (filter.hasConflicts !== hasConflicts) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort collections array
 */
export function sortCollections(
  collections: Collection[],
  sort: CollectionSort
): Collection[] {
  const sorted = [...collections];
  
  sorted.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sort.field) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
        
      case 'updatedAt':
        aValue = new Date(a.updatedAt).getTime();
        bValue = new Date(b.updatedAt).getTime();
        break;
        
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
        
      case 'priority':
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        aValue = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 99;
        bValue = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 99;
        break;
        
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
        
      case 'capacity':
        aValue = a.metadata?.capacity 
          ? (a.metadata.capacity.used / a.metadata.capacity.total) 
          : 0;
        bValue = b.metadata?.capacity 
          ? (b.metadata.capacity.used / b.metadata.capacity.total) 
          : 0;
        break;
        
      default:
        aValue = (a as any)[sort.field];
        bValue = (b as any)[sort.field];
    }

    if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
}

// =============================================================================
// Transformation Helpers
// =============================================================================

/**
 * Convert CollectionOpportunity to Collection format
 */
export function opportunityToCollection(
  opportunity: CollectionOpportunity
): Collection {
  return {
    id: opportunity.id,
    name: opportunity.name,
    type: 'satellite' as CollectionType,
    status: mapOpportunityStatus(opportunity.status),
    priority: opportunity.priority || 'medium',
    description: opportunity.notes || '',
    tags: [],
    statusInfo: {
      operational: 'nominal',
      capacity: opportunity.capacityPercentage || 0,
      priority: opportunity.priority || 'normal',
      conflicts: opportunity.conflicts?.length || 0,
      healthScore: opportunity.matchQuality || 50,
      lastUpdated: new Date(opportunity.lastModified),
    },
    metadata: {
      classification: opportunity.classificationLevel || 'UNCLASSIFIED',
      criticality: 'medium',
      progress: opportunity.capacityPercentage || 0,
      resourceRequirements: [],
      capacity: {
        total: opportunity.capacity || 100,
        used: opportunity.capacityPercentage || 0,
        unit: 'percentage',
      },
      conflicts: opportunity.conflicts?.length || 0,
      customProperties: {
        opportunityStatus: opportunity.status,
        matchStatus: opportunity.matchStatus,
        collectionType: opportunity.collectionType,
      },
    },
    childIds: [],
    parentId: opportunity.collectionDeckId,
    createdBy: opportunity.modifiedBy || 'system',
    updatedBy: opportunity.modifiedBy || 'system',
    createdAt: new Date(opportunity.createdDate),
    updatedAt: new Date(opportunity.lastModified),
  };
}

/**
 * Map opportunity status to collection status
 */
function mapOpportunityStatus(
  status: OpportunityStatus | undefined
): CollectionStatus {
  switch (status) {
    case 'optimal':
      return 'active';
    case 'warning':
      return 'active';
    case 'critical':
      return 'failed';
    default:
      return 'draft';
  }
}

/**
 * Group collections by a specific field
 */
export function groupCollections<K extends keyof Collection>(
  collections: Collection[],
  field: K
): Map<Collection[K], Collection[]> {
  const groups = new Map<Collection[K], Collection[]>();
  
  collections.forEach(collection => {
    const key = collection[field];
    const group = groups.get(key) || [];
    group.push(collection);
    groups.set(key, group);
  });
  
  return groups;
}

/**
 * Create collection summary statistics
 */
export function createCollectionSummary(collections: Collection[]) {
  const summary = {
    total: collections.length,
    byStatus: {} as Record<CollectionStatus, number>,
    byType: {} as Record<CollectionType, number>,
    byPriority: {} as Record<CollectionPriority, number>,
    byHealth: { healthy: 0, warning: 0, critical: 0 },
    totalCapacity: { used: 0, total: 0 },
    activeCount: 0,
    withConflicts: 0,
    avgAge: 0,
  };

  collections.forEach(collection => {
    // Status
    summary.byStatus[collection.status] = (summary.byStatus[collection.status] || 0) + 1;
    
    // Type
    summary.byType[collection.type] = (summary.byType[collection.type] || 0) + 1;
    
    // Priority
    if (collection.priority) {
      summary.byPriority[collection.priority] = (summary.byPriority[collection.priority] || 0) + 1;
    }
    
    // Health
    const health = calculateCollectionHealth(collection);
    summary.byHealth[health.status]++;
    
    // Capacity
    if (collection.metadata?.capacity) {
      summary.totalCapacity.used += collection.metadata.capacity.used;
      summary.totalCapacity.total += collection.metadata.capacity.total;
    }
    
    // Active count
    if (isCollectionActive(collection)) {
      summary.activeCount++;
    }
    
    // Conflicts
    if (collection.metadata?.conflicts && collection.metadata.conflicts > 0) {
      summary.withConflicts++;
    }
    
    // Age
    summary.avgAge += getCollectionAge(collection);
  });

  if (collections.length > 0) {
    summary.avgAge = Math.round(summary.avgAge / collections.length);
  }

  return summary;
}

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validate collection name
 */
export function validateCollectionName(name: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!name || name.trim().length === 0) {
    errors.push({
      code: 'REQUIRED',
      message: 'Collection name is required',
      field: 'name',
      severity: 'error'
    });
  } else {
    if (name.length < 3) {
      errors.push({
        code: 'MIN_LENGTH',
        message: 'Collection name must be at least 3 characters',
        field: 'name',
        severity: 'error'
      });
    }
    if (name.length > 100) {
      errors.push({
        code: 'MAX_LENGTH',
        message: 'Collection name must not exceed 100 characters',
        field: 'name',
        severity: 'error'
      });
    }
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
      warnings.push({
        code: 'SPECIAL_CHARS',
        message: 'Collection name contains special characters',
        field: 'name',
        impact: 'low'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate collection dates
 */
export function validateCollectionDates(
  startDate?: Date | string,
  endDate?: Date | string
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      errors.push({
        code: 'INVALID_DATE_RANGE',
        message: 'Start date must be before end date',
        field: 'dates',
        severity: 'error'
      });
    }
    
    const duration = end.getTime() - start.getTime();
    const daysInDuration = duration / (1000 * 60 * 60 * 24);
    
    if (daysInDuration > 365) {
      warnings.push({
        code: 'LONG_DURATION',
        message: 'Collection spans more than one year',
        field: 'dates',
        impact: 'medium'
      });
    }
    
    if (daysInDuration < 1) {
      warnings.push({
        code: 'SHORT_DURATION',
        message: 'Collection duration is less than one day',
        field: 'dates',
        impact: 'low'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate collection capacity
 */
export function validateCollectionCapacity(
  used: number,
  total: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (total <= 0) {
    errors.push('Total capacity must be greater than 0');
  }

  if (used < 0) {
    errors.push('Used capacity cannot be negative');
  }

  if (used > total) {
    errors.push('Used capacity cannot exceed total capacity');
  }

  const utilization = total > 0 ? (used / total) * 100 : 0;
  
  if (utilization > 95) {
    warnings.push('Collection is at critical capacity (>95%)');
  } else if (utilization > 80) {
    warnings.push('Collection is nearing capacity limit (>80%)');
  }

  return {
    isValid: errors.length === 0,
    errors: errors.map(error => ({
      code: 'VALIDATION_ERROR',
      message: error,
      severity: 'error' as const
    })),
    warnings: warnings.map(warning => ({
      code: 'VALIDATION_WARNING',
      message: warning,
      impact: 'medium' as const
    })),
  };
}

// =============================================================================
// Batch Operations Helpers
// =============================================================================

/**
 * Create batch update payload
 */
export function createBatchUpdate(
  ids: string[],
  updates: Partial<Collection>
): Array<{ id: string; updates: Partial<Collection> }> {
  return ids.map(id => ({ id, updates }));
}

/**
 * Merge collections (for duplicate handling)
 */
export function mergeCollections(
  primary: Collection,
  secondary: Collection,
  strategy: 'keepPrimary' | 'keepSecondary' | 'merge' = 'merge'
): Collection {
  if (strategy === 'keepPrimary') return primary;
  if (strategy === 'keepSecondary') return secondary;

  // Merge strategy
  return {
    ...primary,
    name: primary.name || secondary.name,
    description: primary.description || secondary.description,
    tags: Array.from(new Set([...(primary.tags || []), ...(secondary.tags || [])])),
    metadata: {
      ...secondary.metadata,
      ...primary.metadata,
      capacity: primary.metadata?.capacity || secondary.metadata?.capacity,
      conflicts: Math.max(
        primary.metadata?.conflicts || 0,
        secondary.metadata?.conflicts || 0
      ),
    },
    updatedAt: new Date(),
  };
}

/**
 * Calculate collection differences (for sync operations)
 */
export function diffCollections(
  oldCollection: Collection,
  newCollection: Collection
): {
  changed: boolean;
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
} {
  const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
  const fields: Array<keyof Collection> = [
    'name',
    'type',
    'status',
    'priority',
    'description',
  ];

  fields.forEach(field => {
    if (oldCollection[field] !== newCollection[field]) {
      changes.push({
        field,
        oldValue: oldCollection[field],
        newValue: newCollection[field],
      });
    }
  });

  // Check metadata changes
  if (JSON.stringify(oldCollection.metadata) !== JSON.stringify(newCollection.metadata)) {
    changes.push({
      field: 'metadata',
      oldValue: oldCollection.metadata,
      newValue: newCollection.metadata,
    });
  }

  // Check tags changes
  const oldTags = oldCollection.tags?.sort().join(',') || '';
  const newTags = newCollection.tags?.sort().join(',') || '';
  if (oldTags !== newTags) {
    changes.push({
      field: 'tags',
      oldValue: oldCollection.tags,
      newValue: newCollection.tags,
    });
  }

  return {
    changed: changes.length > 0,
    changes,
  };
}

// =============================================================================
// Export Helpers
// =============================================================================

/**
 * Convert collections to CSV format
 */
export function collectionsToCSV(collections: Collection[]): string {
  const headers = [
    'ID',
    'Name',
    'Type',
    'Status',
    'Priority',
    'Description',
    'Tags',
    'Capacity Used',
    'Capacity Total',
    'Conflicts',
    'Created Date',
    'Updated Date',
  ];

  const rows = collections.map(collection => [
    collection.id,
    collection.name,
    collection.type,
    collection.status,
    collection.priority || '',
    collection.description || '',
    collection.tags?.join(';') || '',
    collection.metadata?.capacity?.used || 0,
    collection.metadata?.capacity?.total || 0,
    collection.metadata?.conflicts || 0,
    new Date(collection.createdAt).toISOString(),
    new Date(collection.updatedAt).toISOString(),
  ]);

  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\\n');

  return csvContent;
}

/**
 * Convert collections to JSON export format
 */
export function collectionsToExportJSON(collections: Collection[]): object {
  return {
    exportDate: new Date().toISOString(),
    version: '2.0.0',
    summary: createCollectionSummary(collections),
    collections: collections.map(collection => ({
      ...collection,
      health: calculateCollectionHealth(collection),
      age: getCollectionAge(collection),
      isActive: isCollectionActive(collection),
      progress: calculateCollectionProgress(collection),
    })),
  };
}