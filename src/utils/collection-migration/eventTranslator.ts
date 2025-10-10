/**
 * Event Translator Utility
 * 
 * Translates legacy CollectionOpportunities events to compound component events
 * with parameter mapping and behavior adaptation.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import { CollectionOpportunity } from '../../types/collectionOpportunities';
import { Collection } from '../../types/collection.types';

// =============================================================================
// Type Definitions
// =============================================================================

export interface LegacyEventHandlers {
  onSelectionChange?: (selectedIds: string[]) => void;
  onEdit?: (opportunity: CollectionOpportunity) => void;
  onOverride?: (opportunityId: string, data: any) => void;
  onBulkAction?: (action: string, selectedIds: string[]) => void;
  onFilter?: (filterConfig: any) => void;
  onSort?: (sortConfig: any) => void;
  onView?: (viewMode: string) => void;
  onPagination?: (page: number, pageSize: number) => void;
  onSplitView?: (isOpen: boolean, selectedId?: string) => void;
  onCreate?: (opportunity: Partial<CollectionOpportunity>) => void;
  onDelete?: (opportunityId: string) => void;
  onExport?: (selectedIds: string[], format: string) => void;
  onRefresh?: () => void;
  onError?: (error: string) => void;
}

export interface CompoundEventHandlers {
  onCollectionSelect?: (collection: Collection) => void;
  onCollectionDeselect?: (collection: Collection) => void;
  onSelectionChange?: (selectedCollections: Collection[]) => void;
  onCollectionEdit?: (collection: Collection) => void;
  onCollectionUpdate?: (collection: Collection, changes: Partial<Collection>) => void;
  onCollectionCreate?: (collection: Partial<Collection>) => void;
  onCollectionDelete?: (collection: Collection) => void;
  onBulkAction?: (action: string, collections: Collection[]) => void;
  onFilterChange?: (filters: Record<string, any>) => void;
  onSortChange?: (field: string, direction: 'asc' | 'desc') => void;
  onViewChange?: (mode: 'grid' | 'list' | 'table') => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSplitPanelToggle?: (isOpen: boolean) => void;
  onItemFocus?: (collection: Collection) => void;
  onExport?: (collections: Collection[], format: string) => void;
  onRefresh?: () => void;
  onError?: (error: string, context?: any) => void;
}

export interface EventTranslationOptions {
  preserveOriginalEvents?: boolean;
  enableLogging?: boolean;
  validateParameters?: boolean;
  enableFallbacks?: boolean;
  opportunityToCollectionMap?: Map<string, Collection>;
}

// =============================================================================
// Event Parameter Converters
// =============================================================================

/**
 * Converts opportunity to collection
 */
function convertOpportunityToCollection(
  opportunity: CollectionOpportunity,
  opportunityMap?: Map<string, Collection>
): Collection {
  // Try to find existing collection mapping first
  if (opportunityMap?.has(opportunity.id)) {
    return opportunityMap.get(opportunity.id)!;
  }

  // Convert on the fly
  return {
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
  };
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
 * Extracts tags from opportunity
 */
function extractTags(opportunity: CollectionOpportunity): string[] {
  const tags: string[] = [];
  
  if (opportunity.priority) tags.push(`priority:${opportunity.priority}`);
  if (opportunity.collectionType) tags.push(`type:${opportunity.collectionType}`);
  if (opportunity.matchStatus) tags.push(`match:${opportunity.matchStatus}`);
  
  return tags;
}

/**
 * Converts selected IDs to collections
 */
function convertSelectedIdsToCollections(
  selectedIds: string[],
  allCollections: Collection[]
): Collection[] {
  const idSet = new Set(selectedIds);
  return allCollections.filter(collection => idSet.has(collection.id));
}

// =============================================================================
// Event Translators
// =============================================================================

/**
 * Translates selection change event
 */
function translateSelectionChange(
  legacyHandler: (selectedIds: string[]) => void,
  collections: Collection[],
  options: EventTranslationOptions
) {
  return (selectedCollections: Collection[]) => {
    try {
      const selectedIds = selectedCollections.map(c => c.id);
      
      if (options.enableLogging) {
        console.log('Event translation: selectionChange', {
          selectedCollections: selectedCollections.length,
          selectedIds: selectedIds.length
        });
      }
      
      legacyHandler(selectedIds);
    } catch (err) {
      if (options.enableFallbacks) {
        console.warn('Selection change translation failed:', err);
        legacyHandler([]);
      } else {
        throw err;
      }
    }
  };
}

/**
 * Translates edit event
 */
function translateEdit(
  legacyHandler: (opportunity: CollectionOpportunity) => void,
  options: EventTranslationOptions
) {
  return (collection: Collection) => {
    try {
      // Convert collection back to opportunity format
      const opportunity: CollectionOpportunity = {
        id: collection.id as any,
        name: collection.name,
        satellite: {
          id: 'default-sat' as any,
          name: 'Default Satellite',
          capacity: 100,
          currentLoad: 0,
          orbit: 'LEO',
          function: 'Imaging'
        },
        sites: [],
        priority: collection.priority,
        status: collection.status === 'active' ? 'optimal' : 
                collection.status === 'failed' ? 'critical' : 'warning',
        capacityPercentage: collection.metadata?.capacity?.used || 0 as any,
        conflicts: [],
        createdDate: collection.createdAt.toISOString() as any,
        lastModified: collection.updatedAt.toISOString() as any,
        collectionDeckId: collection.parentId || 'default-deck' as any,
        allocatedSites: [],
        totalPasses: 0,
        capacity: collection.metadata?.capacity?.total || 100,
        matchStatus: collection.metadata?.customProperties?.matchStatus || 'unmatched',
        collectionType: collection.metadata?.customProperties?.collectionType || 'optical'
      };

      if (options.enableLogging) {
        console.log('Event translation: edit', { collection: collection.id });
      }

      legacyHandler(opportunity);
    } catch (err) {
      if (options.enableFallbacks) {
        console.warn('Edit translation failed:', err);
      } else {
        throw err;
      }
    }
  };
}

/**
 * Translates bulk action event
 */
function translateBulkAction(
  legacyHandler: (action: string, selectedIds: string[]) => void,
  options: EventTranslationOptions
) {
  return (action: string, collections: Collection[]) => {
    try {
      const selectedIds = collections.map(c => c.id);
      
      if (options.enableLogging) {
        console.log('Event translation: bulkAction', {
          action,
          collections: collections.length,
          selectedIds: selectedIds.length
        });
      }
      
      legacyHandler(action, selectedIds);
    } catch (err) {
      if (options.enableFallbacks) {
        console.warn('Bulk action translation failed:', err);
        legacyHandler(action, []);
      } else {
        throw err;
      }
    }
  };
}

/**
 * Translates filter change event
 */
function translateFilter(
  legacyHandler: (filterConfig: any) => void,
  options: EventTranslationOptions
) {
  return (filters: Record<string, any>) => {
    try {
      // Convert compound filters to legacy filter config
      const filterConfig = {
        activeFilters: filters,
        searchTerm: filters.search || '',
        lastUpdated: new Date().toISOString()
      };

      if (options.enableLogging) {
        console.log('Event translation: filter', { filters });
      }

      legacyHandler(filterConfig);
    } catch (err) {
      if (options.enableFallbacks) {
        console.warn('Filter translation failed:', err);
        legacyHandler({});
      } else {
        throw err;
      }
    }
  };
}

/**
 * Translates sort change event
 */
function translateSort(
  legacyHandler: (sortConfig: any) => void,
  options: EventTranslationOptions
) {
  return (field: string, direction: 'asc' | 'desc') => {
    try {
      const sortConfig = {
        field,
        direction,
        lastUpdated: new Date().toISOString()
      };

      if (options.enableLogging) {
        console.log('Event translation: sort', { field, direction });
      }

      legacyHandler(sortConfig);
    } catch (err) {
      if (options.enableFallbacks) {
        console.warn('Sort translation failed:', err);
        legacyHandler({ field: 'name', direction: 'asc' });
      } else {
        throw err;
      }
    }
  };
}

// =============================================================================
// Main Translation Function
// =============================================================================

/**
 * Translates legacy event handlers to compound component event handlers
 */
export function translateLegacyEvents(
  legacyHandlers: LegacyEventHandlers,
  collections: Collection[] = [],
  options: EventTranslationOptions = {}
): CompoundEventHandlers {
  const {
    preserveOriginalEvents = false,
    enableLogging = false,
    validateParameters = true,
    enableFallbacks = true,
    opportunityToCollectionMap
  } = options;

  const compoundHandlers: CompoundEventHandlers = {};

  // Selection events
  if (legacyHandlers.onSelectionChange) {
    compoundHandlers.onSelectionChange = translateSelectionChange(
      legacyHandlers.onSelectionChange,
      collections,
      options
    );
  }

  // Edit events
  if (legacyHandlers.onEdit) {
    compoundHandlers.onCollectionEdit = translateEdit(
      legacyHandlers.onEdit,
      options
    );
  }

  // Bulk action events
  if (legacyHandlers.onBulkAction) {
    compoundHandlers.onBulkAction = translateBulkAction(
      legacyHandlers.onBulkAction,
      options
    );
  }

  // Filter events
  if (legacyHandlers.onFilter) {
    compoundHandlers.onFilterChange = translateFilter(
      legacyHandlers.onFilter,
      options
    );
  }

  // Sort events
  if (legacyHandlers.onSort) {
    compoundHandlers.onSortChange = translateSort(
      legacyHandlers.onSort,
      options
    );
  }

  // View events
  if (legacyHandlers.onView) {
    compoundHandlers.onViewChange = (mode: 'grid' | 'list' | 'table') => {
      try {
        if (enableLogging) {
          console.log('Event translation: view', { mode });
        }
        legacyHandlers.onView!(mode);
      } catch (err) {
        if (enableFallbacks) {
          console.warn('View translation failed:', err);
        } else {
          throw err;
        }
      }
    };
  }

  // Pagination events
  if (legacyHandlers.onPagination) {
    compoundHandlers.onPageChange = (page: number) => {
      try {
        if (enableLogging) {
          console.log('Event translation: page', { page });
        }
        // Use default page size of 25 if not specified
        legacyHandlers.onPagination!(page, 25);
      } catch (err) {
        if (enableFallbacks) {
          console.warn('Pagination translation failed:', err);
        } else {
          throw err;
        }
      }
    };
  }

  // Split view events
  if (legacyHandlers.onSplitView) {
    compoundHandlers.onSplitPanelToggle = (isOpen: boolean) => {
      try {
        if (enableLogging) {
          console.log('Event translation: splitPanel', { isOpen });
        }
        legacyHandlers.onSplitView!(isOpen);
      } catch (err) {
        if (enableFallbacks) {
          console.warn('Split view translation failed:', err);
        } else {
          throw err;
        }
      }
    };
  }

  // Create events
  if (legacyHandlers.onCreate) {
    compoundHandlers.onCollectionCreate = (collection: Partial<Collection>) => {
      try {
        // Convert partial collection to partial opportunity
        const opportunity: Partial<CollectionOpportunity> = {
          name: collection.name,
          notes: collection.description,
          collectionType: collection.type === 'satellite' ? 'optical' : 'optical'
        };

        if (enableLogging) {
          console.log('Event translation: create', { collection });
        }

        legacyHandlers.onCreate!(opportunity);
      } catch (err) {
        if (enableFallbacks) {
          console.warn('Create translation failed:', err);
        } else {
          throw err;
        }
      }
    };
  }

  // Delete events
  if (legacyHandlers.onDelete) {
    compoundHandlers.onCollectionDelete = (collection: Collection) => {
      try {
        if (enableLogging) {
          console.log('Event translation: delete', { collection: collection.id });
        }
        legacyHandlers.onDelete!(collection.id);
      } catch (err) {
        if (enableFallbacks) {
          console.warn('Delete translation failed:', err);
        } else {
          throw err;
        }
      }
    };
  }

  // Export events
  if (legacyHandlers.onExport) {
    compoundHandlers.onExport = (collections: Collection[], format: string) => {
      try {
        const selectedIds = collections.map(c => c.id);
        
        if (enableLogging) {
          console.log('Event translation: export', { collections: collections.length, format });
        }
        
        legacyHandlers.onExport!(selectedIds, format);
      } catch (err) {
        if (enableFallbacks) {
          console.warn('Export translation failed:', err);
        } else {
          throw err;
        }
      }
    };
  }

  // Refresh events (pass through)
  if (legacyHandlers.onRefresh) {
    compoundHandlers.onRefresh = legacyHandlers.onRefresh;
  }

  // Error events (pass through)
  if (legacyHandlers.onError) {
    compoundHandlers.onError = (error: string, context?: any) => {
      try {
        if (enableLogging) {
          console.log('Event translation: error', { error, context });
        }
        legacyHandlers.onError!(error);
      } catch (err) {
        console.error('Error event translation failed:', err);
      }
    };
  }

  // Preserve original events if requested
  if (preserveOriginalEvents) {
    Object.keys(legacyHandlers).forEach(key => {
      const originalKey = `original_${key}`;
      (compoundHandlers as any)[originalKey] = (legacyHandlers as any)[key];
    });
  }

  return compoundHandlers;
}

// =============================================================================
// Bidirectional Translation
// =============================================================================

/**
 * Translates compound event handlers back to legacy format
 */
export function translateCompoundEvents(
  compoundHandlers: CompoundEventHandlers,
  opportunities: CollectionOpportunity[] = [],
  options: EventTranslationOptions = {}
): LegacyEventHandlers {
  const legacyHandlers: LegacyEventHandlers = {};

  // Selection change
  if (compoundHandlers.onSelectionChange) {
    legacyHandlers.onSelectionChange = (selectedIds: string[]) => {
      const collections = convertSelectedIdsToCollections(
        selectedIds,
        opportunities.map(o => convertOpportunityToCollection(o, options.opportunityToCollectionMap))
      );
      compoundHandlers.onSelectionChange!(collections);
    };
  }

  // Edit
  if (compoundHandlers.onCollectionEdit) {
    legacyHandlers.onEdit = (opportunity: CollectionOpportunity) => {
      const collection = convertOpportunityToCollection(opportunity, options.opportunityToCollectionMap);
      compoundHandlers.onCollectionEdit!(collection);
    };
  }

  // Bulk actions
  if (compoundHandlers.onBulkAction) {
    legacyHandlers.onBulkAction = (action: string, selectedIds: string[]) => {
      const collections = convertSelectedIdsToCollections(
        selectedIds,
        opportunities.map(o => convertOpportunityToCollection(o, options.opportunityToCollectionMap))
      );
      compoundHandlers.onBulkAction!(action, collections);
    };
  }

  // Filter change
  if (compoundHandlers.onFilterChange) {
    legacyHandlers.onFilter = (filterConfig: any) => {
      compoundHandlers.onFilterChange!(filterConfig.activeFilters || {});
    };
  }

  // Sort change
  if (compoundHandlers.onSortChange) {
    legacyHandlers.onSort = (sortConfig: any) => {
      compoundHandlers.onSortChange!(sortConfig.field, sortConfig.direction);
    };
  }

  return legacyHandlers;
}

// =============================================================================
// Export All
// =============================================================================

export default translateLegacyEvents;