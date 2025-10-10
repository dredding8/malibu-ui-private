import { useMemo, useCallback } from 'react';
import { debounce } from 'lodash';
import { 
  CollectionOpportunity, 
  HealthAnalysis, 
  Priority 
} from '../../types/collectionOpportunities';
import { calculateOpportunityHealth, convertToHealthAnalysis } from '../../utils/opportunityHealth';

/**
 * Performance optimization hooks for Collection Management
 * Migrated from CollectionOpportunitiesPerformance.tsx
 */

/**
 * Memoized health calculation to prevent recalculation on every render
 */
export const useMemoizedHealthScores = (opportunities: CollectionOpportunity[]) => {
  return useMemo(() => {
    const healthUpdates = new Map<string, HealthAnalysis>();
    opportunities.forEach(opp => {
      const health = calculateOpportunityHealth(opp);
      const healthAnalysis = convertToHealthAnalysis(health);
      healthUpdates.set(opp.id, healthAnalysis);
    });
    return healthUpdates;
  }, [opportunities]);
};

/**
 * Debounced search to prevent excessive filtering
 */
export const useDebouncedSearch = (onSearch: (query: string) => void, delay = 300) => {
  return useMemo(
    () => debounce((query: string) => {
      onSearch(query);
    }, delay),
    [onSearch, delay]
  );
};

/**
 * Optimized filtering with memoization
 */
export const useOptimizedFiltering = (
  opportunities: CollectionOpportunity[],
  activeTab: string,
  globalSiteFilter: string,
  searchQuery: string,
  sortColumn: string | null,
  sortDirection: 'asc' | 'desc',
  healthScores: Map<string, HealthAnalysis>
) => {
  return useMemo(() => {
    let filtered = opportunities;
    
    // Quick filter by tab (indexed lookup)
    const tabFilters: Record<string, (opp: CollectionOpportunity) => boolean> = {
      'needs-review': (opp: CollectionOpportunity) => 
        opp.status === 'warning' || healthScores.get(opp.id)?.overallHealth === 'poor',
      'unmatched': (opp: CollectionOpportunity) => 
        opp.status === 'critical'
    };
    
    if (tabFilters[activeTab]) {
      filtered = filtered.filter(tabFilters[activeTab]);
    }
    
    // Apply global site filter
    if (globalSiteFilter) {
      filtered = filtered.filter(opp => 
        opp.collection?.satellite?.includes(globalSiteFilter)
      );
    }
    
    // Apply search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(opp =>
        opp.name?.toLowerCase().includes(lowerQuery) ||
        opp.collection?.name?.toLowerCase().includes(lowerQuery) ||
        opp.collection?.satellite?.toLowerCase().includes(lowerQuery)
      );
    }
    
    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = getColumnValue(a, sortColumn, healthScores);
        const bVal = getColumnValue(b, sortColumn, healthScores);
        
        if (sortDirection === 'asc') {
          return compareValues(aVal, bVal);
        } else {
          return compareValues(bVal, aVal);
        }
      });
    }
    
    return filtered;
  }, [opportunities, activeTab, globalSiteFilter, searchQuery, sortColumn, sortDirection, healthScores]);
};

// Helper functions
function getColumnValue(
  opp: CollectionOpportunity, 
  column: string, 
  healthScores: Map<string, HealthAnalysis>
): any {
  switch (column) {
    case 'priority':
      return opp.priority;
    case 'status':
      return opp.status;
    case 'health':
      return healthScores.get(opp.id)?.score || 0;
    case 'name':
      return opp.name || '';
    case 'satellite':
      return opp.collection?.satellite || '';
    default:
      return '';
  }
}

function compareValues(a: any, b: any): number {
  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b);
  }
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  return 0;
}

// Export auto-sized columns configuration
export const AUTO_SIZED_COLUMNS = {
  priority: 80,
  status: 130,
  health: 180,
  name: 250,
  constraints: 100,
  activity: 180,
  satellite: 120,
  actions: 100
};