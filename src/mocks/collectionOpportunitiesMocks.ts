/**
 * Mock data generators for Collection Opportunities
 * 
 * This file contains all mock data generation for development and testing.
 * It should NOT be imported in production builds.
 */

import { 
  CollectionOpportunity, 
  Site, 
  CollectionDeck, 
  MatchStatus,
  Pass,
  Priority
} from '../types/collectionOpportunities';
import { DataIntegrityIssue } from '../components/DataIntegrityIndicator';

// Configuration for mock data generation
export const MOCK_CONFIG = {
  // Use generic terms instead of operational terminology
  satellites: ['Unit-1', 'Unit-2', 'Unit-3', 'Unit-4', 'Unit-5'],
  sensors: ['Sensor-A', 'Sensor-B', 'Sensor-C', 'Sensor-D', 'Sensor-E'],
  functions: ['Type-1', 'Type-2', 'Type-3', 'Type-4'],
  orbits: ['Orbit-A', 'Orbit-B', 'Orbit-C', 'Orbit-D'],
  priorities: ['low', 'medium', 'high', 'critical'] as Priority[],
  matchStatuses: ['baseline', 'suboptimal', 'unmatched'] as MatchStatus[]
};

/**
 * Generate mock passes for an opportunity
 */
export function generateMockPasses(oppId: string, count: number): Pass[] {
  const now = new Date();
  return Array.from({ length: count }, (_, j) => {
    const startTime = new Date(now.getTime() + (j * 6 + Math.random() * 4) * 60 * 60 * 1000);
    const duration = 5 + Math.random() * 10; // 5-15 minutes
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
    
    return {
      id: `pass-${oppId}-${j}`,
      name: `Pass ${j + 1}`,
      startTime,
      endTime,
      quality: Math.floor(Math.random() * 5) + 1, // 1-5
      siteCapabilities: [],
      priority: ['normal', 'high', 'critical'][Math.floor(Math.random() * 3)] as any,
      classificationLevel: 'UNCLASSIFIED',
      metadata: {
        satellite: `${MOCK_CONFIG.satellites[j % MOCK_CONFIG.satellites.length]}`,
        sensor: `${MOCK_CONFIG.sensors[j % MOCK_CONFIG.sensors.length]}`,
        downlinkSite: `Site-${String.fromCharCode(65 + j % 5)}`
      }
    };
  });
}

/**
 * Generate mock data integrity issues
 */
export function generateDataIssues(satelliteId: string): DataIntegrityIssue[] {
  const issues: DataIntegrityIssue[] = [];
  const rand = Math.random();
  
  if (rand < 0.1) { // 10% have NO_TLE issue
    issues.push({
      type: 'NO_TLE',
      severity: 'critical',
      message: 'No tracking data available',
      satelliteId,
      lastKnownGood: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
    });
  } else if (rand < 0.2) { // 10% have STALE_EPHEMERIS
    issues.push({
      type: 'STALE_EPHEMERIS',
      severity: 'warning',
      message: 'Tracking data is outdated',
      satelliteId,
      lastKnownGood: new Date(Date.now() - 25 * 60 * 60 * 1000)
    });
  }
  
  return issues;
}

/**
 * Generate mock collection opportunities
 */
export function generateMockOpportunities(count: number): CollectionOpportunity[] {
  return Array.from({ length: count }, (_, i) => {
    const satelliteId = `unit-${i % 10}`;
    const passCount = Math.floor(Math.random() * 5) + 1;
    // Generate realistic SCC numbers (1-99999)
    const sccNumber = 10000 + (i % 89999);

    return {
      id: `opp-${i}`,
      name: `Opportunity ${i + 1}`,
      sccNumber: sccNumber as any, // Numeric SCC
      satellite: {
        id: satelliteId,
        name: String(sccNumber).padStart(5, '0'), // Use formatted SCC as satellite name
        capacity: 100,
        currentLoad: Math.random() * 80,
        orbit: MOCK_CONFIG.orbits[Math.floor(Math.random() * MOCK_CONFIG.orbits.length)],
        function: MOCK_CONFIG.functions[Math.floor(Math.random() * MOCK_CONFIG.functions.length)]
      },
      sites: [],
      priority: MOCK_CONFIG.priorities[Math.floor(Math.random() * MOCK_CONFIG.priorities.length)],
      status: 'optimal' as const,
      capacityPercentage: Math.random() * 100,
      conflicts: Math.random() > 0.8 ? ['conflict-1', 'conflict-2'] : [],
      createdDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      lastModified: new Date().toISOString(),
      collectionDeckId: `deck-${i}`,
      allocatedSites: [],
      totalPasses: passCount,
      capacity: 100,
      matchStatus: MOCK_CONFIG.matchStatuses[Math.floor(Math.random() * MOCK_CONFIG.matchStatuses.length)],
      passes: generateMockPasses(`opp-${i}`, passCount),
      dataIntegrityIssues: generateDataIssues(satelliteId)
    };
  });
}

/**
 * Generate mock sites
 */
export function generateMockSites(count: number): Site[] {
  // Define realistic operational day patterns
  const dayPatterns = [
    ['M', 'T', 'W', 'TH', 'F', 'SA', 'SU'], // 24/7
    ['M', 'T', 'W', 'TH', 'F'], // Weekdays only
    ['M', 'W', 'F'], // MWF
    ['T', 'TH', 'SA'], // TTH+SA
    ['M', 'T', 'W', 'TH', 'F', 'SA'], // Mon-Sat
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `site-${i}`,
    name: `Site ${String.fromCharCode(65 + i)}`,
    location: {
      lat: -90 + Math.random() * 180,
      lon: -180 + Math.random() * 360
    },
    capacity: 100 + Math.floor(Math.random() * 200),
    allocated: Math.floor(Math.random() * 100),
    operationalDays: dayPatterns[i % dayPatterns.length] as any
  }));
}

/**
 * Generate mock collection decks
 */
export function generateMockCollectionDecks(count: number): CollectionDeck[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `deck-${i}`,
    name: `Collection Deck ${i + 1}`,
    satellite: MOCK_CONFIG.satellites[i % MOCK_CONFIG.satellites.length],
    sensor: MOCK_CONFIG.sensors[i % MOCK_CONFIG.sensors.length],
    capacity: 50 + Math.floor(Math.random() * 100),
    currentLoad: Math.floor(Math.random() * 50),
    passes: []
  }));
}

/**
 * Assign sites and decks to opportunities
 * This simulates the relationships between opportunities, sites, and decks
 */
export function assignMockRelationships(
  opportunities: CollectionOpportunity[],
  sites: Site[],
  decks: CollectionDeck[]
): CollectionOpportunity[] {
  return opportunities.map((opp, index) => {
    const siteCount = 1 + Math.floor(Math.random() * 5);
    const selectedSites = sites
      .sort(() => 0.5 - Math.random())
      .slice(0, siteCount);

    // Generate total collect count
    const totalPasses = Math.floor(Math.random() * 500) + 50; // 50-550 collects

    // Randomly assign some opportunities to have override justifications
    const hasOverride = Math.random() > 0.7; // 30% have overrides
    const changeJustification = hasOverride
      ? [
          'Increased priority due to operational requirements',
          'Manual adjustment for capacity balancing',
          'Site availability constraints require override',
          'Customer request for specific site allocation',
          'Weather impact mitigation strategy'
        ][Math.floor(Math.random() * 5)]
      : undefined;

    return {
      ...opp,
      sites: selectedSites,
      allocatedSites: selectedSites,
      collectionDeckId: decks[index % decks.length].id,
      totalPasses,
      sccNumber: totalPasses, // Site Collect Count matches total for now
      capacity: 50 + Math.floor(Math.random() * 50),
      changeJustification
    };
  });
}

/**
 * Complete mock data generator
 * Returns all necessary mock data for the CollectionOpportunitiesHub
 */
export function generateCompleteMockData(opportunityCount = 50, siteCount = 10, deckCount = 5) {
  // Only load mock data in development
  if (process.env.NODE_ENV === 'production') {
    console.warn('Mock data should not be used in production!');
    return {
      opportunities: [],
      sites: [],
      decks: []
    };
  }

  const sites = generateMockSites(siteCount);
  const decks = generateMockCollectionDecks(deckCount);
  const opportunities = generateMockOpportunities(opportunityCount);
  const enrichedOpportunities = assignMockRelationships(opportunities, sites, decks);

  return {
    opportunities: enrichedOpportunities,
    sites,
    decks
  };
}

// Export a flag to check if mock data is being used
export const IS_USING_MOCK_DATA = process.env.NODE_ENV !== 'production';