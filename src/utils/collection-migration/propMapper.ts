/**
 * Props Mapper Utility
 * 
 * Maps legacy CollectionOpportunities props to new compound component props
 * with type safety and validation.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import { CollectionOpportunity } from '../../types/collectionOpportunities';
import { Collection, CollectionViewConfig } from '../../types/collection.types';
import { CollectionProps } from '../../components/Collection';

// =============================================================================
// Type Definitions
// =============================================================================

export interface LegacyProps {
  opportunities: CollectionOpportunity[];
  selectedIds?: string[];
  filterConfig?: any;
  sortConfig?: any;
  viewMode?: 'table' | 'grid' | 'list';
  enableSelection?: boolean;
  enableFiltering?: boolean;
  enableSorting?: boolean;
  enableBulkOperations?: boolean;
  healthScoring?: boolean;
  realTimeUpdates?: boolean;
  accessibilityMode?: boolean;
  jtbdAnalytics?: boolean;
  virtualizedTable?: boolean;
  memoizedHealthScores?: boolean;
  debouncedSearch?: boolean;
  className?: string;
  style?: React.CSSProperties;
  loading?: boolean;
  error?: string | null;
  [key: string]: any;
}

export interface MappingResult {
  props: CollectionProps;
  warnings: string[];
  errors: string[];
  unmappedProps: Record<string, any>;
}

export interface MappingOptions {
  strict?: boolean;
  validateTypes?: boolean;
  preserveUnknownProps?: boolean;
  enableFallbacks?: boolean;
}

// =============================================================================
// Data Type Converters
// =============================================================================

/**
 * Converts CollectionOpportunity array to Collection array
 */
export function convertOpportunitiesToCollections(
  opportunities: CollectionOpportunity[]
): Collection[] {
  return opportunities.map((opportunity): Collection => ({
    id: opportunity.id,
    name: opportunity.name || `Opportunity ${opportunity.id}`,
    description: opportunity.notes || '',
    type: 'satellite' as CollectionType,
    status: mapOpportunityStatus(opportunity.status),
    priority: opportunity.priority,
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
  }));
}

/**
 * Maps opportunity status to collection status
 */
function mapOpportunityStatus(status?: OpportunityStatus): Collection['status'] {
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
 * Calculates health score from opportunity data
 */
function calculateHealthFromOpportunity(opportunity: CollectionOpportunity): number {
  // Use existing health if available
  if (typeof opportunity.matchQuality === 'number') {
    return Math.max(0, Math.min(1, opportunity.matchQuality / 100));
  }

  // Calculate from available data
  let score = 0.5; // Base score
  
  if (opportunity.status === 'optimal') score += 0.2;
  if (opportunity.matchStatus === 'baseline') score += 0.2;
  if (opportunity.capacityPercentage && opportunity.capacityPercentage > 0) score += 0.1;
  
  return Math.max(0, Math.min(1, score));
}

/**
 * Extracts tags from opportunity data
 */
function extractTagsFromOpportunity(opportunity: CollectionOpportunity): string[] {
  const tags: string[] = [];
  
  if (opportunity.priority) tags.push(`priority:${opportunity.priority}`);
  if (opportunity.collectionType) tags.push(`type:${opportunity.collectionType}`);
  if (opportunity.matchStatus) tags.push(`match:${opportunity.matchStatus}`);
  
  return tags;
}

// =============================================================================
// Configuration Mappers
// =============================================================================

/**
 * Maps legacy filter config to new view config
 */
export function mapFilterConfig(filterConfig: any): Partial<CollectionViewConfig> {
  if (!filterConfig) return {};

  return {
    mode: 'table' as CollectionViewMode,
    density: 'comfortable' as const,
    features: {
      healthScoring: true,
      realTimeUpdates: true,
      accessibility: true,
      analytics: true
    }
  };
}

/**
 * Maps legacy sort config to new view config
 */
export function mapSortConfig(sortConfig: any): Partial<CollectionViewConfig> {
  if (!sortConfig) return {};

  return {
    mode: 'table' as CollectionViewMode,
    density: 'comfortable' as const,
    tableOptions: {
      resizable: true,
      sortable: true
    }
  };
}

/**
 * Maps view mode to view config
 */
export function mapViewMode(viewMode: string): Partial<CollectionViewConfig> {
  return {
    mode: viewMode as CollectionViewMode,
    density: 'comfortable' as const,
    tableOptions: {
      resizable: true,
      sortable: true
    }
  };
}

// =============================================================================
// Main Mapping Function
// =============================================================================

/**
 * Maps legacy props to compound component props
 */
export function mapLegacyProps(
  legacyProps: LegacyProps,
  options: MappingOptions = {}
): CollectionProps {
  const {
    strict = false,
    validateTypes = true,
    preserveUnknownProps = false,
    enableFallbacks = true
  } = options;

  const warnings: string[] = [];
  const errors: string[] = [];
  const unmappedProps: Record<string, any> = {};

  // Extract and validate core props
  const {
    opportunities = [],
    selectedIds = [],
    filterConfig,
    sortConfig,
    viewMode = 'grid',
    enableSelection = true,
    enableFiltering = true,
    enableSorting = true,
    enableBulkOperations = false,
    healthScoring = false,
    realTimeUpdates = false,
    accessibilityMode = false,
    jtbdAnalytics = false,
    virtualizedTable = false,
    memoizedHealthScores = false,
    debouncedSearch = false,
    className = '',
    style,
    loading = false,
    error = null,
    ...otherProps
  } = legacyProps;

  // Type validation
  if (validateTypes) {
    if (!Array.isArray(opportunities)) {
      errors.push('opportunities must be an array');
    }
    if (!Array.isArray(selectedIds)) {
      errors.push('selectedIds must be an array');
    }
  }

  // Convert opportunities to collections
  let collections: Collection[] = [];
  try {
    collections = convertOpportunitiesToCollections(opportunities);
  } catch (err) {
    errors.push(`Failed to convert opportunities: ${err}`);
    if (enableFallbacks) {
      collections = [];
      warnings.push('Using empty collections array as fallback');
    }
  }

  // Build view configuration
  const viewConfig: Partial<CollectionViewConfig> = {
    ...mapFilterConfig(filterConfig),
    ...mapSortConfig(sortConfig),
    ...mapViewMode(viewMode),
    performance: {
      virtualization: virtualizedTable,
      memoization: memoizedHealthScores,
      debouncing: debouncedSearch
    },
    features: {
      healthScoring,
      realTimeUpdates,
      accessibility: accessibilityMode,
      analytics: jtbdAnalytics
    }
  };

  // Handle unrecognized props
  if (preserveUnknownProps) {
    Object.entries(otherProps).forEach(([key, value]) => {
      if (!isKnownLegacyProp(key)) {
        unmappedProps[key] = value;
        warnings.push(`Unmapped prop: ${key}`);
      }
    });
  }

  // Build final props
  const mappedProps: CollectionProps = {
    collections,
    loading,
    error,
    viewConfig,
    enableRealtime: realTimeUpdates,
    enableSelection,
    enableFiltering,
    enableSorting,
    enableBulkOperations,
    className: `legacy-mapped ${className}`.trim(),
    style,
    ...unmappedProps
  };

  // Validate result
  if (strict && errors.length > 0) {
    throw new Error(`Prop mapping failed: ${errors.join(', ')}`);
  }

  return mappedProps;
}

/**
 * Checks if a prop name is a known legacy prop
 */
function isKnownLegacyProp(propName: string): boolean {
  const knownProps = new Set([
    'opportunities', 'selectedIds', 'onSelectionChange', 'onEdit', 'onOverride',
    'onBulkAction', 'filterConfig', 'sortConfig', 'viewMode', 'enableSelection',
    'enableFiltering', 'enableSorting', 'enableBulkOperations', 'healthScoring',
    'realTimeUpdates', 'splitViewConfig', 'accessibilityMode', 'jtbdAnalytics',
    'virtualizedTable', 'memoizedHealthScores', 'debouncedSearch', 'bentoLayout',
    'splitView', 'modalReplacement', 'className', 'style', 'loading', 'error'
  ]);

  return knownProps.has(propName);
}

// =============================================================================
// Batch Mapping Utilities
// =============================================================================

/**
 * Maps multiple legacy component props for batch migration
 */
export function batchMapLegacyProps(
  legacyPropsArray: LegacyProps[],
  options: MappingOptions = {}
): Array<{ props: CollectionProps; warnings: string[]; errors: string[] }> {
  return legacyPropsArray.map((legacyProps, index) => {
    try {
      const props = mapLegacyProps(legacyProps, options);
      return {
        props,
        warnings: [],
        errors: []
      };
    } catch (err) {
      return {
        props: {} as CollectionProps,
        warnings: [],
        errors: [`Item ${index}: ${err}`]
      };
    }
  });
}

/**
 * Validates prop mapping compatibility
 */
export function validatePropMapping(
  legacyProps: LegacyProps,
  mappedProps: CollectionProps
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Validate data conversion
  if (legacyProps.opportunities.length !== mappedProps.collections?.length) {
    issues.push('Collection count mismatch after conversion');
  }

  // Validate feature flags
  if (legacyProps.enableSelection !== mappedProps.enableSelection) {
    issues.push('Selection state mismatch');
  }

  if (legacyProps.enableFiltering !== mappedProps.enableFiltering) {
    issues.push('Filtering state mismatch');
  }

  if (legacyProps.enableSorting !== mappedProps.enableSorting) {
    issues.push('Sorting state mismatch');
  }

  // Validate loading/error states
  if (legacyProps.loading !== mappedProps.loading) {
    issues.push('Loading state mismatch');
  }

  if (legacyProps.error !== mappedProps.error) {
    issues.push('Error state mismatch');
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

// =============================================================================
// Export All
// =============================================================================

export default mapLegacyProps;