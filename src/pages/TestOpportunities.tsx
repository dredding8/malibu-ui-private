/**
 * Test page for Collection Opportunities components
 * This page can be temporarily added to the app router for testing
 */

import React from 'react';
import CollectionOpportunitiesEnhanced from '../components/CollectionOpportunitiesEnhanced';
import { CollectionOpportunity, OpportunityChange, Site, CollectionDeck } from '../types/collectionOpportunities';
import { AllocationProvider } from '../contexts/AllocationContext';

// Mock data for testing
const mockOpportunities: CollectionOpportunity[] = [
  {
    id: '1',
    name: 'Opportunity Alpha',
    satellite: {
      id: 'sat1',
      name: 'SAT-001',
      capacity: 100,
      currentLoad: 85,
      orbit: 'LEO',
      function: 'Imaging',
    },
    sites: [
      {
        id: 'site1',
        name: 'Site Alpha',
        location: { lat: 40.7128, lon: -74.0060 },
        capacity: 50,
        allocated: 45,
        operationalDays: ['M', 'T', 'W', 'TH', 'F'],
        operationalHours: { start: '08:00', end: '17:00', timezone: 'EST' },
      },
    ],
    priority: 'critical',
    priorityValue: 4,
    status: 'critical',
    capacityPercentage: 15,
    conflicts: ['Overlap with Opportunity Beta'],
    createdDate: '2024-01-15',
    lastModified: '2024-01-20',
    collectionDeckId: 'deck-1',
    allocatedSites: [
      {
        id: 'site1',
        name: 'Ground Station Alpha',
        location: { lat: 40.7128, lon: -74.0060 },
        capacity: 100,
        allocated: 45,
        operationalDays: ['M', 'T', 'W', 'TH', 'F'],
      },
    ],
    totalPasses: 124,
    sccNumber: 124,
    capacity: 100,
    matchStatus: 'baseline',
    siteAllocations: [],
    matchQuality: 85,
  },
  {
    id: '2',
    name: 'Opportunity Beta',
    satellite: {
      id: 'sat2',
      name: 'SAT-002',
      capacity: 150,
      currentLoad: 80,
      orbit: 'GEO',
      function: 'Communication',
    },
    sites: [
      {
        id: 'site2',
        name: 'Site Beta',
        location: { lat: 51.5074, lon: -0.1278 },
        capacity: 100,
        allocated: 55,
        operationalDays: ['M', 'T', 'W', 'TH', 'F', 'SA', 'SU'],
      },
      {
        id: 'site3',
        name: 'Site Gamma',
        location: { lat: 35.6762, lon: 139.6503 },
        capacity: 80,
        allocated: 40,
        operationalDays: ['M', 'W', 'F'],
        operationalHours: { start: '00:00', end: '12:00', timezone: 'JST' },
      },
    ],
    priority: 'high',
    priorityValue: 3,
    status: 'warning',
    capacityPercentage: 45,
    conflicts: [],
    createdDate: '2024-01-18',
    lastModified: '2024-01-22',
    collectionDeckId: 'deck-2',
    allocatedSites: [
      {
        id: 'site2',
        name: 'Ground Station Beta',
        location: { lat: 51.5074, lon: -0.1278 },
        capacity: 100,
        allocated: 55,
        operationalDays: ['M', 'T', 'W', 'TH', 'F', 'SA', 'SU'],
      },
      {
        id: 'site3',
        name: 'Ground Station Gamma',
        location: { lat: 35.6762, lon: 139.6503 },
        capacity: 80,
        allocated: 40,
        operationalDays: ['M', 'W', 'F'],
      },
      {
        id: 'site4',
        name: 'Ground Station Delta',
        location: { lat: 34.0522, lon: -118.2437 },
        capacity: 120,
        allocated: 60,
        operationalDays: ['M', 'T', 'W', 'TH', 'F'],
      },
      {
        id: 'site5',
        name: 'Ground Station Epsilon',
        location: { lat: 48.8566, lon: 2.3522 },
        capacity: 90,
        allocated: 45,
        operationalDays: ['T', 'TH', 'SA'],
      },
    ],
    totalPasses: 412,
    sccNumber: 412,
    changeJustification: 'Manual adjustment for capacity balancing across sites',
    capacity: 150,
    matchStatus: 'suboptimal',
    siteAllocations: [],
    matchQuality: 65,
  },
  {
    id: '3',
    name: 'Opportunity Gamma',
    satellite: {
      id: 'sat3',
      name: 'SAT-003',
      capacity: 200,
      currentLoad: 50,
      orbit: 'MEO',
      function: 'Weather',
    },
    sites: [
      {
        id: 'site4',
        name: 'Site Delta',
        location: { lat: -33.8688, lon: 151.2093 },
        capacity: 120,
        allocated: 20,
        operationalDays: ['T', 'TH', 'SA'],
        operationalHours: { start: '09:00', end: '18:00', timezone: 'AEST' },
      },
      {
        id: 'site5',
        name: 'Site Epsilon',
        location: { lat: 37.7749, lon: -122.4194 },
        capacity: 150,
        allocated: 40,
        operationalDays: ['M', 'T', 'W', 'TH', 'F'],
        operationalHours: { start: '06:00', end: '22:00', timezone: 'PST' },
      },
    ],
    priority: 'medium',
    priorityValue: 2,
    status: 'optimal',
    capacityPercentage: 85,
    conflicts: [],
    createdDate: '2024-01-20',
    lastModified: '2024-01-23',
    collectionDeckId: 'deck-3',
    allocatedSites: [],
    totalPasses: 12,
    capacity: 200,
    matchStatus: 'unmatched',
    siteAllocations: [],
    matchQuality: 45,
  },
];

const TestOpportunities: React.FC = () => {
  const handleBatchUpdate = async (changes: OpportunityChange[]) => {
    console.log('Batch update requested:', changes);
    // Simulate API call
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log('Batch update completed');
        resolve();
      }, 1000);
    });
  };

  const mockSites: Site[] = [
    {
      id: 'site1',
      name: 'Site Alpha',
      location: { lat: 40.7128, lon: -74.0060 },
      capacity: 50,
      allocated: 45,
      operationalDays: ['M', 'T', 'W', 'TH', 'F'],
      operationalHours: { start: '08:00', end: '17:00', timezone: 'EST' },
    },
    {
      id: 'site2',
      name: 'Site Beta',
      location: { lat: 51.5074, lon: -0.1278 },
      capacity: 100,
      allocated: 55,
      operationalDays: ['M', 'T', 'W', 'TH', 'F', 'SA', 'SU'],
    },
    {
      id: 'site3',
      name: 'Site Gamma',
      location: { lat: 35.6762, lon: 139.6503 },
      capacity: 80,
      allocated: 40,
      operationalDays: ['M', 'W', 'F'],
      operationalHours: { start: '00:00', end: '12:00', timezone: 'JST' },
    },
  ];

  const handleOpenWorkspace = (opportunityId: string) => {
    console.log('Open workspace for opportunity:', opportunityId);
  };

  const handleValidate = (opportunityId: string) => {
    console.log('Validate opportunity:', opportunityId);
  };

  const mockCollectionDecks: CollectionDeck[] = [
    {
      id: 'deck-1',
      name: 'Test Collection Deck',
      opportunities: mockOpportunities.map(o => o.id),
      sites: mockSites.map(s => s.id),
      totalCapacity: 1000,
      allocatedCapacity: 300,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active'
    }
  ];

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f8fa', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>
        Collection Opportunities Test Page
      </h1>
      
      <AllocationProvider
        initialOpportunities={mockOpportunities}
        initialSites={mockSites}
        initialCollectionDecks={mockCollectionDecks}
        capacityThresholds={{ critical: 10, warning: 30, optimal: 70 }}
        enableRealTimeUpdates={false}
        onBatchUpdate={handleBatchUpdate}
      >
        <CollectionOpportunitiesEnhanced
          opportunities={mockOpportunities}
          availableSites={mockSites}
          onBatchUpdate={handleBatchUpdate}
          onOpenWorkspace={handleOpenWorkspace}
          onValidate={handleValidate}
          capacityThresholds={{
            critical: 10,
            warning: 30,
            optimal: 70,
          }}
          enableRealTimeValidation={true}
          enableHealthAnalysis={true}
          showWorkspaceOption={true}
          showValidationOption={true}
        />
      </AllocationProvider>
    </div>
  );
};

export default TestOpportunities;