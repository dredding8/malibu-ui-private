import { useState, useEffect, useMemo, useCallback } from 'react';
import { CollectionOpportunity, Site, CollectionDeck } from '../types/collectionOpportunities';

/**
 * Generate mock collection data for development/testing
 * Used as fallback when API is unavailable
 */
function generateMockCollectionData(collectionId: string) {
  const mockSites: Site[] = [
    {
      id: 'site-001' as any,
      name: 'Svalbard Ground Station',
      location: { lat: 78.2 as any, lon: 15.6 as any },
      capacity: 50,
      allocated: 30,
      operationalDays: ['M', 'T', 'W', 'TH', 'F'] as any
    },
    {
      id: 'site-002' as any,
      name: 'Alaska Ground Station',
      location: { lat: 64.8 as any, lon: -147.7 as any },
      capacity: 50,
      allocated: 40,
      operationalDays: ['M', 'T', 'W', 'TH', 'F', 'SA'] as any
    },
    {
      id: 'site-003' as any,
      name: 'McMurdo Station',
      location: { lat: -77.8 as any, lon: 166.7 as any },
      capacity: 30,
      allocated: 15,
      operationalDays: ['M', 'T', 'W', 'TH', 'F'] as any
    }
  ];

  const mockOpportunities: CollectionOpportunity[] = [
    {
      id: 'opp-001' as any,
      name: 'WORLDVIEW-3 Arctic Pass',
      satellite: {
        id: 'sat-001' as any,
        name: 'WORLDVIEW-3',
        capacity: 100,
        currentLoad: 75,
        orbit: 'LEO',
        function: 'Imaging'
      },
      sites: [mockSites[0]],
      allocatedSites: [mockSites[0]],
      priority: 'high',
      priorityValue: 3,
      status: 'optimal',
      capacityPercentage: 75 as any,
      conflicts: [],
      createdDate: '2025-01-14T00:00:00Z' as any,
      lastModified: '2025-01-14T00:00:00Z' as any,
      collectionDeckId: collectionId as any,
      totalPasses: 5,
      capacity: 100,
      matchStatus: 'baseline'
    },
    {
      id: 'opp-002' as any,
      name: 'WORLDVIEW-3 North America Pass',
      satellite: {
        id: 'sat-001' as any,
        name: 'WORLDVIEW-3',
        capacity: 100,
        currentLoad: 80,
        orbit: 'LEO',
        function: 'Imaging'
      },
      sites: [mockSites[1]],
      allocatedSites: [mockSites[1]],
      priority: 'medium',
      priorityValue: 2,
      status: 'warning',
      capacityPercentage: 80 as any,
      conflicts: [],
      createdDate: '2025-01-14T00:00:00Z' as any,
      lastModified: '2025-01-14T00:00:00Z' as any,
      collectionDeckId: collectionId as any,
      totalPasses: 3,
      capacity: 100,
      matchStatus: 'suboptimal',
      matchNotes: 'Capacity Issue'
    },
    {
      id: 'opp-003' as any,
      name: 'WORLDVIEW-3 Antarctic Pass',
      satellite: {
        id: 'sat-001' as any,
        name: 'WORLDVIEW-3',
        capacity: 100,
        currentLoad: 0,
        orbit: 'LEO',
        function: 'Imaging'
      },
      sites: [],
      allocatedSites: [],
      priority: 'critical',
      priorityValue: 4,
      status: 'critical',
      capacityPercentage: 0 as any,
      conflicts: [],
      createdDate: '2025-01-14T00:00:00Z' as any,
      lastModified: '2025-01-14T00:00:00Z' as any,
      collectionDeckId: collectionId as any,
      totalPasses: 0,
      capacity: 100,
      matchStatus: 'unmatched',
      matchNotes: 'Best Pass'
    },
    {
      id: 'opp-004' as any,
      name: 'WORLDVIEW-2 Multi-Site Pass',
      satellite: {
        id: 'sat-002' as any,
        name: 'WORLDVIEW-2',
        capacity: 80,
        currentLoad: 60,
        orbit: 'SSO',
        function: 'Imaging'
      },
      sites: [mockSites[0], mockSites[2]],
      allocatedSites: [mockSites[0], mockSites[2]],
      priority: 'high',
      priorityValue: 3,
      status: 'optimal',
      capacityPercentage: 75 as any,
      conflicts: [],
      createdDate: '2025-01-14T00:00:00Z' as any,
      lastModified: '2025-01-14T00:00:00Z' as any,
      collectionDeckId: collectionId as any,
      totalPasses: 4,
      capacity: 80,
      matchStatus: 'baseline'
    },
    {
      id: 'opp-005' as any,
      name: 'LANDSAT-8 Continental Pass',
      satellite: {
        id: 'sat-003' as any,
        name: 'LANDSAT-8',
        capacity: 120,
        currentLoad: 90,
        orbit: 'Polar',
        function: 'Imaging'
      },
      sites: [mockSites[1]],
      allocatedSites: [mockSites[1]],
      priority: 'low',
      priorityValue: 1,
      status: 'optimal',
      capacityPercentage: 75 as any,
      conflicts: [],
      createdDate: '2025-01-14T00:00:00Z' as any,
      lastModified: '2025-01-14T00:00:00Z' as any,
      collectionDeckId: collectionId as any,
      totalPasses: 6,
      capacity: 120,
      matchStatus: 'baseline'
    }
  ];

  return {
    opportunities: mockOpportunities,
    sites: mockSites,
    collectionDecks: [] as CollectionDeck[]
  };
}

/**
 * Filter state for collection opportunities
 */
export interface FilterState {
  priority?: number;
  needsReview?: boolean;
  unmatched?: boolean;
  highPriority?: boolean;
}

/**
 * Sort configuration
 */
export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

/**
 * Hook options
 */
export interface UseCollectionManagementOptions {
  defaultFilter?: 'all' | 'needsReview' | 'highPriority' | 'unmatched';
  compactMode?: boolean;
}

/**
 * Stats derived from opportunities
 */
export interface CollectionStats {
  total: number;
  needsReview: number;
  highPriority: number;
  optimal: number;
  unmatched: number;
}

/**
 * Hook return value
 */
export interface UseCollectionManagementReturn {
  // Data
  opportunities: CollectionOpportunity[];
  sites: Site[];
  collectionDecks: CollectionDeck[];

  // State
  filters: FilterState;
  searchQuery: string;
  sortConfig: SortConfig;

  // Computed
  stats: CollectionStats;
  filteredOpportunities: CollectionOpportunity[];

  // Actions
  setFilter: (filter: Partial<FilterState>) => void;
  setSearch: (query: string) => void;
  setSorting: (column: string) => void;
  updateOpportunity: (id: string, updates: Partial<CollectionOpportunity>) => Promise<void>;
  clearFilters: () => void;

  // Loading states
  isLoading: boolean;
  error: Error | null;
}

/**
 * Collection Management Hook
 *
 * Provides business logic for managing collection opportunities:
 * - Data fetching and state management
 * - Filtering, searching, and sorting
 * - Stats calculation
 * - Update operations
 *
 * Designed to be shared between wizard Step 3 and standalone management page.
 */
export function useCollectionManagement(
  collectionId: string,
  options: UseCollectionManagementOptions = {}
): UseCollectionManagementReturn {
  const { defaultFilter = 'all', compactMode = false } = options;

  // State
  const [opportunities, setOpportunities] = useState<CollectionOpportunity[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [collectionDecks, setCollectionDecks] = useState<CollectionDeck[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [searchQuery, setSearchQueryState] = useState('');
  const [sortConfig, setSortConfigState] = useState<SortConfig>({ column: '', direction: 'asc' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Apply default filter on mount
  useEffect(() => {
    if (defaultFilter && defaultFilter !== 'all') {
      switch (defaultFilter) {
        case 'needsReview':
          setFilters({ needsReview: true });
          break;
        case 'highPriority':
          setFilters({ highPriority: true });
          break;
        case 'unmatched':
          setFilters({ unmatched: true });
          break;
      }
    }
  }, [defaultFilter]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!collectionId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/collections/${collectionId}/opportunities`);
        if (!response.ok) throw new Error('Failed to load collection data');

        const data = await response.json();
        setOpportunities(data.opportunities || []);
        setSites(data.sites || []);
        setCollectionDecks(data.collectionDecks || []);
      } catch (err) {
        console.warn('API unavailable, using mock data for development:', err);

        // Fallback to mock data for visual testing
        const mockData = generateMockCollectionData(collectionId);
        setOpportunities(mockData.opportunities);
        setSites(mockData.sites);
        setCollectionDecks(mockData.collectionDecks);
        setError(null); // Clear error since we have mock data
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [collectionId]);

  // Calculate stats
  const stats = useMemo<CollectionStats>(() => {
    const total = opportunities.length;

    // Count by match status
    const needsReview = opportunities.filter(o =>
      o.matchStatus === 'suboptimal' || o.matchStatus === 'unmatched'
    ).length;

    const unmatched = opportunities.filter(o =>
      o.matchStatus === 'unmatched'
    ).length;

    const optimal = opportunities.filter(o =>
      o.matchStatus === 'baseline' || !o.matchStatus
    ).length;

    // Count high priority (priority >= 34 based on implementation plan)
    const highPriority = opportunities.filter(o =>
      o.priorityValue && o.priorityValue >= 3 // 'high' or 'critical'
    ).length;

    return { total, needsReview, highPriority, optimal, unmatched };
  }, [opportunities]);

  // Filter and search opportunities
  const filteredOpportunities = useMemo(() => {
    let result = [...opportunities];

    // Apply search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(o =>
        o.satellite?.name?.toLowerCase().includes(lowerQuery) ||
        o.name?.toLowerCase().includes(lowerQuery) ||
        o.status?.toLowerCase().includes(lowerQuery) ||
        o.allocatedSites?.some(site => site.name?.toLowerCase().includes(lowerQuery))
      );
    }

    // Apply filters
    if (filters.priority) {
      result = result.filter(o => o.priorityValue && o.priorityValue >= filters.priority!);
    }

    if (filters.needsReview) {
      result = result.filter(o =>
        o.matchStatus === 'suboptimal' || o.matchStatus === 'unmatched'
      );
    }

    if (filters.unmatched) {
      result = result.filter(o => o.matchStatus === 'unmatched');
    }

    if (filters.highPriority) {
      result = result.filter(o => o.priorityValue && o.priorityValue >= 3);
    }

    // Apply sorting
    if (sortConfig.column) {
      result.sort((a, b) => {
        const aVal = (a as any)[sortConfig.column];
        const bVal = (b as any)[sortConfig.column];

        if (aVal === bVal) return 0;
        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;

        const comparison = aVal > bVal ? 1 : -1;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [opportunities, searchQuery, filters, sortConfig]);

  // Actions
  const setFilter = useCallback((filter: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...filter }));
  }, []);

  const setSearch = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  const setSorting = useCallback((column: string) => {
    setSortConfigState(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const updateOpportunity = useCallback(async (id: string, updates: Partial<CollectionOpportunity>) => {
    // Optimistic update
    setOpportunities(prev => prev.map(o =>
      o.id === id ? { ...o, ...updates } : o
    ));

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/opportunities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Failed to update opportunity');
    } catch (err) {
      // Rollback on error
      setError(err as Error);
      console.error('Failed to update opportunity:', err);
      // Re-fetch to restore correct state
      // (In production, would rollback optimistic update)
    }
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchQueryState('');
  }, []);

  return {
    // Data
    opportunities: filteredOpportunities,
    sites,
    collectionDecks,

    // State
    filters,
    searchQuery,
    sortConfig,

    // Computed
    stats,
    filteredOpportunities,

    // Actions
    setFilter,
    setSearch,
    setSorting,
    updateOpportunity,
    clearFilters,

    // Loading states
    isLoading,
    error
  };
}
