/**
 * Collection Helpers Tests
 * 
 * Comprehensive test suite for collection utility functions
 */

import {
  calculateCollectionHealth,
  getCollectionAge,
  isCollectionActive,
  calculateCollectionProgress,
  filterCollections,
  sortCollections,
  opportunityToCollection,
  groupCollections,
  createCollectionSummary,
  validateCollectionName,
  validateCollectionDates,
  validateCollectionCapacity,
  mergeCollections,
  diffCollections,
  collectionsToCSV,
  collectionsToExportJSON,
} from '../collectionHelpers';
import { Collection, CollectionFilter } from '../../types/collection.types';
import { CollectionOpportunity } from '../../types/collectionOpportunities';

describe('collectionHelpers', () => {
  // Test data
  const mockCollections: Collection[] = [
    {
      id: 'col-1',
      name: 'Test Collection 1',
      type: 'satellite',
      status: 'active',
      priority: 'high',
      description: 'First test collection',
      tags: ['test', 'important'],
      statusInfo: {
        operational: 'nominal',
        capacity: 80,
        priority: 'high',
        conflicts: 5,
        healthScore: 85,
        lastUpdated: new Date('2025-01-15'),
      },
      metadata: {
        classification: 'UNCLASSIFIED',
        criticality: 'medium',
        progress: 80,
        resourceRequirements: [],
        capacity: { used: 80, total: 100, unit: 'percentage' },
        conflicts: 5,
        customProperties: {},
      },
      childIds: [],
      createdBy: 'user-1',
      updatedBy: 'user-1',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-15'),
    },
    {
      id: 'col-2',
      name: 'Test Collection 2',
      type: 'ground_station',
      status: 'draft',
      priority: 'low',
      description: 'Second test collection',
      tags: ['test'],
      statusInfo: {
        operational: 'nominal',
        capacity: 95,
        priority: 'low',
        conflicts: 0,
        healthScore: 75,
        lastUpdated: new Date('2025-01-10'),
      },
      metadata: {
        classification: 'UNCLASSIFIED',
        criticality: 'low',
        progress: 95,
        resourceRequirements: [],
        capacity: { used: 95, total: 100, unit: 'percentage' },
        conflicts: 0,
        customProperties: {},
      },
      childIds: [],
      createdBy: 'user-2',
      updatedBy: 'user-2',
      createdAt: new Date('2024-12-01'),
      updatedAt: new Date('2025-01-10'),
    },
    {
      id: 'col-3',
      name: 'Archived Collection',
      type: 'satellite',
      status: 'archived',
      priority: 'medium',
      tags: ['archived'],
      statusInfo: {
        operational: 'offline',
        capacity: 50,
        priority: 'normal',
        conflicts: 0,
        healthScore: 60,
        lastUpdated: new Date('2024-12-31'),
      },
      metadata: {
        classification: 'UNCLASSIFIED',
        criticality: 'low',
        progress: 50,
        resourceRequirements: [],
        capacity: { used: 50, total: 100, unit: 'percentage' },
        conflicts: 0,
        customProperties: {},
      },
      childIds: [],
      createdBy: 'user-1',
      updatedBy: 'user-1',
      createdAt: new Date('2024-06-01'),
      updatedAt: new Date('2024-12-31'),
    },
  ];

  describe('calculateCollectionHealth', () => {
    it('should calculate healthy status', () => {
      const collection = {
        ...mockCollections[0],
        metadata: {
          ...mockCollections[0].metadata,
          capacity: { used: 50, total: 100, unit: 'percentage' },
          conflicts: 0,
        },
      };

      const health = calculateCollectionHealth(collection);
      
      expect(health.status).toBe('healthy');
      expect(health.score).toBeGreaterThan(0.7);
      expect(health.factors.capacity).toBe(1.0);
      expect(health.factors.conflicts).toBe(1.0);
    });

    it('should calculate warning status for high capacity', () => {
      const collection = {
        ...mockCollections[0],
        metadata: {
          ...mockCollections[0].metadata,
          capacity: { used: 85, total: 100, unit: 'percentage' },
          conflicts: 3,
        },
      };

      const health = calculateCollectionHealth(collection);
      
      expect(health.status).toBe('warning');
      expect(health.factors.capacity).toBe(0.5);
    });

    it('should calculate critical status', () => {
      const collection = {
        ...mockCollections[0],
        metadata: {
          ...mockCollections[0].metadata,
          capacity: { used: 95, total: 100, unit: 'percentage' },
          conflicts: 15,
        },
        priority: 'low',
      };

      const health = calculateCollectionHealth(collection);
      
      expect(health.status).toBe('critical');
      expect(health.score).toBeLessThan(0.4);
      expect(health.factors.capacity).toBe(0.2);
      expect(health.factors.conflicts).toBe(0.2);
    });
  });

  describe('getCollectionAge', () => {
    it('should calculate age in days correctly', () => {
      const collection = {
        ...mockCollections[0],
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      };

      const age = getCollectionAge(collection);
      expect(age).toBe(10);
    });
  });

  describe('isCollectionActive', () => {
    it('should return true for active collections', () => {
      expect(isCollectionActive(mockCollections[0])).toBe(true);
    });

    it('should return false for archived collections', () => {
      expect(isCollectionActive(mockCollections[2])).toBe(false);
    });

    it('should return false for collections past end date', () => {
      const collection = {
        ...mockCollections[0],
        endDate: new Date('2024-01-01'),
      };
      expect(isCollectionActive(collection)).toBe(false);
    });
  });

  describe('calculateCollectionProgress', () => {
    it('should calculate progress percentage', () => {
      expect(calculateCollectionProgress(mockCollections[0])).toBe(80);
      expect(calculateCollectionProgress(mockCollections[1])).toBe(95);
    });

    it('should return 0 for no capacity', () => {
      const collection = { ...mockCollections[0], metadata: {} };
      expect(calculateCollectionProgress(collection)).toBe(0);
    });
  });

  describe('filterCollections', () => {
    it('should filter by search term', () => {
      const filter: CollectionFilter = { search: 'Collection 1' };
      const results = filterCollections(mockCollections, filter);
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('col-1');
    });

    it('should filter by status', () => {
      const filter: CollectionFilter = { 
        status: {
          operational: ['nominal'],
          capacity: [80],
          priority: ['high'],
          healthRange: [80, 100],
          conflictRange: [0, 10]
        }
      };
      const results = filterCollections(mockCollections, filter);
      
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('active');
    });

    it('should filter by priority', () => {
      const filter: CollectionFilter = { priority: 'high' };
      const results = filterCollections(mockCollections, filter);
      
      expect(results).toHaveLength(1);
      expect(results[0].priority).toBe('high');
    });

    it('should filter by capacity threshold', () => {
      const filter: CollectionFilter = { capacityThreshold: 90 };
      const results = filterCollections(mockCollections, filter);
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('col-2');
    });

    it('should filter by tags', () => {
      const filter: CollectionFilter = { tags: ['important'] };
      const results = filterCollections(mockCollections, filter);
      
      expect(results).toHaveLength(1);
      expect(results[0].tags).toContain('important');
    });

    it('should filter by conflicts', () => {
      const filter: CollectionFilter = { hasConflicts: true };
      const results = filterCollections(mockCollections, filter);
      
      expect(results).toHaveLength(1);
      expect(results[0].metadata?.conflicts).toBeGreaterThan(0);
    });

    it('should apply multiple filters', () => {
      const filter: CollectionFilter = {
        type: 'satellite',
        status: {
          operational: ['nominal'],
          capacity: [80],
          priority: ['high'],
          healthRange: [80, 100],
          conflictRange: [0, 10]
        },
        tags: ['test'],
      };
      const results = filterCollections(mockCollections, filter);
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('col-1');
    });
  });

  describe('sortCollections', () => {
    it('should sort by name', () => {
      const sorted = sortCollections(mockCollections, { field: 'name', direction: 'asc' });
      
      expect(sorted[0].name).toBe('Archived Collection');
      expect(sorted[2].name).toBe('Test Collection 2');
    });

    it('should sort by priority', () => {
      const sorted = sortCollections(mockCollections, { field: 'priority', direction: 'asc' });
      
      expect(sorted[0].priority).toBe('high');
      expect(sorted[2].priority).toBe('low');
    });

    it('should sort by capacity', () => {
      const sorted = sortCollections(mockCollections, { field: 'capacity', direction: 'desc' });
      
      expect(sorted[0].id).toBe('col-2'); // 95%
      expect(sorted[1].id).toBe('col-1'); // 80%
      expect(sorted[2].id).toBe('col-3'); // 50%
    });

    it('should sort by date', () => {
      const sorted = sortCollections(mockCollections, { field: 'updatedAt', direction: 'desc' });
      
      expect(sorted[0].id).toBe('col-1'); // Most recent
    });
  });

  describe('opportunityToCollection', () => {
    it('should convert opportunity to collection format', () => {
      const opportunity: CollectionOpportunity = {
        id: 'opp-1' as any,
        name: 'Test Opportunity',
        satellite: {
          id: 'sat-1' as any,
          name: 'Test Satellite',
          capacity: 100,
          currentLoad: 25,
          orbit: 'LEO',
          function: 'Imaging'
        },
        sites: [{
          id: 'site-1' as any,
          name: 'Site 1',
          location: { lat: 40.7128 as any, lon: -74.0060 as any },
          capacity: 100,
          allocated: 75
        }],
        priority: 'high',
        status: 'optimal',
        capacityPercentage: 75 as any,
        conflicts: [],
        createdDate: '2025-01-01T00:00:00.000Z' as any,
        lastModified: '2025-01-02T00:00:00.000Z' as any,
        collectionDeckId: 'deck-1' as any,
        allocatedSites: [],
        totalPasses: 5,
        capacity: 100,
        matchStatus: 'baseline',
        collectionType: 'optical'
      };

      const collection = opportunityToCollection(opportunity);
      
      expect(collection.id).toBe('opp-1');
      expect(collection.type).toBe('satellite');
      expect(collection.status).toBe('active');
      expect(collection.metadata?.capacity?.used).toBe(75);
      expect(collection.metadata?.customProperties?.opportunityStatus).toBe('optimal');
    });
  });

  describe('groupCollections', () => {
    it('should group collections by field', () => {
      const groups = groupCollections(mockCollections, 'type');
      
      expect(groups.size).toBe(2);
      expect(groups.get('satellite')).toHaveLength(2);
      expect(groups.get('ground_station')).toHaveLength(1);
    });
  });

  describe('createCollectionSummary', () => {
    it('should create comprehensive summary', () => {
      const summary = createCollectionSummary(mockCollections);
      
      expect(summary.total).toBe(3);
      expect(summary.byStatus.active).toBe(1);
      expect(summary.byStatus.draft).toBe(1);
      expect(summary.byStatus.archived).toBe(1);
      expect(summary.byType.satellite).toBe(2);
      expect(summary.byPriority.high).toBe(1);
      expect(summary.activeCount).toBe(2); // Active and draft
      expect(summary.withConflicts).toBe(1);
      expect(summary.totalCapacity.used).toBe(225); // 80 + 95 + 50
      expect(summary.totalCapacity.total).toBe(300); // 100 * 3
    });
  });

  describe('validation functions', () => {
    describe('validateCollectionName', () => {
      it('should validate valid names', () => {
        const result = validateCollectionName('Valid Collection Name');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject empty names', () => {
        const result = validateCollectionName('');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Collection name is required');
      });

      it('should reject short names', () => {
        const result = validateCollectionName('AB');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Collection name must be at least 3 characters');
      });

      it('should warn about special characters', () => {
        const result = validateCollectionName('Name@#$');
        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Collection name contains special characters');
      });
    });

    describe('validateCollectionDates', () => {
      it('should validate valid date ranges', () => {
        const result = validateCollectionDates('2025-01-01', '2025-01-31');
        expect(result.isValid).toBe(true);
      });

      it('should reject invalid date order', () => {
        const result = validateCollectionDates('2025-01-31', '2025-01-01');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Start date must be before end date');
      });

      it('should warn about long durations', () => {
        const result = validateCollectionDates('2025-01-01', '2026-06-01');
        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Collection spans more than one year');
      });
    });

    describe('validateCollectionCapacity', () => {
      it('should validate valid capacity', () => {
        const result = validateCollectionCapacity(50, 100);
        expect(result.isValid).toBe(true);
      });

      it('should reject invalid capacity', () => {
        const result = validateCollectionCapacity(150, 100);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Used capacity cannot exceed total capacity');
      });

      it('should warn about high utilization', () => {
        const result = validateCollectionCapacity(96, 100);
        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Collection is at critical capacity (>95%)');
      });
    });
  });

  describe('mergeCollections', () => {
    it('should merge collections with merge strategy', () => {
      const primary = mockCollections[0];
      const secondary = {
        ...mockCollections[1],
        tags: ['new', 'secondary'],
        metadata: {
          ...mockCollections[1].metadata,
          customField: 'value',
        },
      };

      const merged = mergeCollections(primary, secondary);
      
      expect(merged.name).toBe(primary.name);
      expect(merged.tags).toContain('test');
      expect(merged.tags).toContain('new');
      expect(merged.metadata?.conflicts).toBe(5);
    });
  });

  describe('diffCollections', () => {
    it('should detect changes between collections', () => {
      const oldCollection = mockCollections[0];
      const newCollection = {
        ...oldCollection,
        name: 'Updated Name',
        status: 'completed' as const,
        tags: ['test', 'updated'],
      };

      const diff = diffCollections(oldCollection, newCollection);
      
      expect(diff.changed).toBe(true);
      expect(diff.changes).toHaveLength(3);
      expect(diff.changes.find(c => c.field === 'name')).toBeDefined();
      expect(diff.changes.find(c => c.field === 'status')).toBeDefined();
      expect(diff.changes.find(c => c.field === 'tags')).toBeDefined();
    });

    it('should detect no changes', () => {
      const collection = mockCollections[0];
      const diff = diffCollections(collection, collection);
      
      expect(diff.changed).toBe(false);
      expect(diff.changes).toHaveLength(0);
    });
  });

  describe('export functions', () => {
    describe('collectionsToCSV', () => {
      it('should convert collections to CSV format', () => {
        const csv = collectionsToCSV([mockCollections[0]]);
        
        expect(csv).toContain('ID,Name,Type,Status,Priority');
        expect(csv).toContain('col-1');
        expect(csv).toContain('Test Collection 1');
        expect(csv).toContain('standard');
        expect(csv).toContain('active');
      });

      it('should escape quotes in CSV', () => {
        const collection = {
          ...mockCollections[0],
          name: 'Collection "with quotes"',
        };
        const csv = collectionsToCSV([collection]);
        
        expect(csv).toContain('Collection ""with quotes""');
      });
    });

    describe('collectionsToExportJSON', () => {
      it('should create export JSON with metadata', () => {
        const exported = collectionsToExportJSON(mockCollections);
        
        expect(exported).toHaveProperty('exportDate');
        expect(exported).toHaveProperty('version', '2.0.0');
        expect(exported).toHaveProperty('summary');
        expect(exported).toHaveProperty('collections');
        
        const summary = (exported as any).summary;
        expect(summary.total).toBe(3);
        
        const collections = (exported as any).collections;
        expect(collections[0]).toHaveProperty('health');
        expect(collections[0]).toHaveProperty('age');
        expect(collections[0]).toHaveProperty('isActive');
        expect(collections[0]).toHaveProperty('progress');
      });
    });
  });
});