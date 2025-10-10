/**
 * Collection Decks Mock Data
 *
 * WAVE 1: Extracted from CollectionDecksTable component
 * This prevents sample data from leaking into production builds
 */

import { CollectionDeckStatus } from '../constants/statusTypes';
import { MatchInformation } from '../types/matchTypes';

export interface CollectionDeck {
  id: string;
  name: string;
  status: CollectionDeckStatus;
  createdDate: string;
  lastModified: string;
  priority: number;
  sccCount: number;
  assignedTo: string;
  completionDate?: string;
  matchInfo?: MatchInformation;
}

export const mockInProgressDecks: CollectionDeck[] = [
  {
    id: '1',
    name: 'Collection Alpha-001',
    status: 'in-progress',
    createdDate: '2024-01-15',
    lastModified: '2024-01-20',
    priority: 1,
    sccCount: 25,
    assignedTo: 'John Smith',
    matchInfo: {
      status: 'optimal',
      matchPercentage: 95,
      lastEvaluated: '2024-01-20T10:30:00Z'
    }
  },
  {
    id: '2',
    name: 'Collection Beta-002',
    status: 'in-progress',
    createdDate: '2024-01-18',
    lastModified: '2024-01-22',
    priority: 2,
    sccCount: 18,
    assignedTo: 'Jane Doe',
    matchInfo: {
      status: 'suboptimal',
      matchPercentage: 75,
      notes: [{
        category: 'capacity-limited',
        message: 'Sensor capacity constraints',
        details: 'Peak demand period limiting optimal coverage',
        affectedSensors: ['SENSOR-A2', 'SENSOR-B1']
      }],
      lastEvaluated: '2024-01-22T14:15:00Z'
    }
  },
  {
    id: '3',
    name: 'Collection Gamma-003',
    status: 'in-progress',
    createdDate: '2024-01-20',
    lastModified: '2024-01-23',
    priority: 3,
    sccCount: 32,
    assignedTo: 'Mike Johnson',
    matchInfo: {
      status: 'no-match',
      matchPercentage: 0,
      notes: [{
        category: 'not-observable',
        message: 'Object not visible to sensors',
        details: 'Outside of sensor coverage area for the requested time window'
      }],
      lastEvaluated: '2024-01-23T09:45:00Z'
    }
  }
];

export const mockCompletedDecks: CollectionDeck[] = [
  {
    id: '4',
    name: 'Collection Delta-004',
    status: 'complete',
    createdDate: '2024-01-10',
    lastModified: '2024-01-15',
    priority: 1,
    sccCount: 28,
    assignedTo: 'John Smith',
    completionDate: '2024-01-15',
    matchInfo: {
      status: 'optimal',
      matchPercentage: 98,
      lastEvaluated: '2024-01-15T16:00:00Z'
    }
  },
  {
    id: '5',
    name: 'Collection Epsilon-005',
    status: 'complete',
    createdDate: '2024-01-12',
    lastModified: '2024-01-17',
    priority: 2,
    sccCount: 15,
    assignedTo: 'Jane Doe',
    completionDate: '2024-01-17',
    matchInfo: {
      status: 'baseline',
      matchPercentage: 60,
      notes: [{
        category: 'partial-coverage',
        message: 'Limited observation windows',
        details: 'Only partial sensor coverage achieved due to orbital constraints',
        affectedSensors: ['SENSOR-C3']
      }],
      lastEvaluated: '2024-01-17T11:30:00Z'
    }
  }
];

/**
 * Generate mock collection decks for testing
 * @param count Number of decks to generate
 * @param type Type of decks ('in-progress' | 'completed')
 */
export const generateMockDecks = (
  count: number,
  type: 'in-progress' | 'completed' = 'in-progress'
): CollectionDeck[] => {
  const baseDecks = type === 'in-progress' ? mockInProgressDecks : mockCompletedDecks;

  if (count <= baseDecks.length) {
    return baseDecks.slice(0, count);
  }

  // Generate additional decks if needed
  const additionalDecks: CollectionDeck[] = [];
  for (let i = baseDecks.length; i < count; i++) {
    additionalDecks.push({
      id: `${i + 1}`,
      name: `Collection ${String.fromCharCode(65 + (i % 26))}-${String(i + 1).padStart(3, '0')}`,
      status: type === 'in-progress' ? 'in-progress' : 'complete',
      createdDate: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      lastModified: new Date(Date.now() - (i * 12 * 60 * 60 * 1000)).toISOString().split('T')[0],
      priority: (i % 3) + 1,
      sccCount: Math.floor(Math.random() * 50) + 10,
      assignedTo: ['John Smith', 'Jane Doe', 'Mike Johnson'][i % 3],
      completionDate: type === 'completed' ? new Date(Date.now() - (i * 6 * 60 * 60 * 1000)).toISOString().split('T')[0] : undefined,
      matchInfo: {
        status: ['optimal', 'baseline', 'suboptimal'][i % 3] as any,
        matchPercentage: Math.floor(Math.random() * 40) + 60,
        lastEvaluated: new Date(Date.now() - (i * 60 * 60 * 1000)).toISOString()
      }
    });
  }

  return [...baseDecks, ...additionalDecks];
};
