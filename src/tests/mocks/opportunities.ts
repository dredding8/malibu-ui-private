import { CollectionOpportunity } from '../../types/collectionOpportunities';

export const mockOpportunities: CollectionOpportunity[] = [
  {
    id: 'opp-1',
    name: 'Test Opportunity 1',
    status: 'optimal',
    capacity: 75,
    satellite: {
      id: 'sat-1',
      name: 'Test Satellite',
      capacity: 100,
      currentLoad: 75,
      orbit: 'LEO',
      function: 'Imaging'
    },
    sites: [],
    priority: 'medium',
    capacityPercentage: 75,
    conflicts: [],
    createdDate: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    collectionDeckId: 'deck-1',
    allocatedSites: [],
    totalPasses: 5,
    matchStatus: 'baseline',
    sccNumber: 12345 as any // Numeric SCC: 5-digit format
  },
  {
    id: 'opp-2',
    name: 'Test Opportunity 2',
    status: 'warning',
    capacity: 50,
    satellite: {
      id: 'sat-2',
      name: 'Test Satellite 2',
      capacity: 100,
      currentLoad: 50,
      orbit: 'GEO',
      function: 'Communication'
    },
    sites: [],
    priority: 'high',
    capacityPercentage: 50,
    conflicts: ['Capacity conflict'],
    createdDate: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    collectionDeckId: 'deck-1',
    allocatedSites: [],
    totalPasses: 3,
    matchStatus: 'suboptimal',
    sccNumber: 678 as any // Numeric SCC: will display as 00678
  }
];
