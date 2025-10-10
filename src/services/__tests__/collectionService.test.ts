/**
 * Collection Service Tests
 * 
 * Comprehensive test suite for the CollectionService
 */

import { CollectionService } from '../collectionService';
import { Collection, CollectionFilter } from '../../types/collection.types';
import { performanceMonitoringService } from '../performanceMonitoringService';
import { realTimeUpdatesService } from '../realTimeUpdatesService';

// Mock dependencies
jest.mock('../performanceMonitoringService');
jest.mock('../realTimeUpdatesService');

// Mock fetch
global.fetch = jest.fn();

describe('CollectionService', () => {
  let service: CollectionService;
  const mockBaseUrl = '/api';

  beforeEach(() => {
    service = new CollectionService({ apiBaseUrl: mockBaseUrl });
    (global.fetch as jest.Mock).mockClear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('fetchCollections', () => {
    const mockResponse = {
      data: [
        {
          id: 'col-1',
          name: 'Test Collection 1',
          type: 'standard',
          status: 'active',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-02'),
        },
        {
          id: 'col-2',
          name: 'Test Collection 2',
          type: 'special',
          status: 'draft',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-02'),
        },
      ],
      meta: {
        total: 2,
        page: 1,
        pageSize: 25,
        totalPages: 1,
      },
    };

    it('should fetch collections successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.fetchCollections();

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/collections?`,
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );

      expect(result).toEqual({
        collections: mockResponse.data,
        total: 2,
        pageInfo: mockResponse.meta,
      });
    });

    it('should apply filters correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const filter: CollectionFilter = {
        search: 'test',
        status: 'active',
        type: 'standard',
      };

      await service.fetchCollections({ filter });

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('filter[search]=test');
      expect(url).toContain('filter[status]=active');
      expect(url).toContain('filter[type]=standard');
    });

    it('should handle sorting parameters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await service.fetchCollections({
        sort: { field: 'name', direction: 'desc' },
      });

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('sort=-name');
    });

    it('should handle pagination parameters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await service.fetchCollections({
        pagination: { page: 2, pageSize: 50, total: 0, totalPages: 0 },
      });

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('page=2');
      expect(url).toContain('limit=50');
    });

    it('should use cache when available', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // First call - should fetch
      await service.fetchCollections();
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await service.fetchCollections();
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should force refresh when requested', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // First call
      await service.fetchCollections();
      
      // Second call with force refresh
      await service.fetchCollections({ forceRefresh: true });
      
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should record performance metrics', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await service.fetchCollections();

      expect(performanceMonitoringService.recordMetric).toHaveBeenCalledWith(
        'fetch_collections_duration',
        expect.any(Number)
      );
      expect(performanceMonitoringService.recordMetric).toHaveBeenCalledWith(
        'collections_count',
        2
      );
    });
  });

  describe('createCollection', () => {
    const newCollection = {
      name: 'New Collection',
      type: 'standard' as const,
      status: 'draft' as const,
      description: 'Test description',
      tags: ['test', 'new'],
      metadata: {},
      childIds: [],
      createdBy: 'user-1',
    };

    const createdCollection: Collection = {
      ...newCollection,
      id: 'col-new',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a collection successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => createdCollection,
      });

      const result = await service.createCollection(newCollection);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/collections`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newCollection),
          headers: { 'Content-Type': 'application/json' },
        })
      );

      expect(result).toEqual(createdCollection);
    });

    it('should invalidate cache after creation', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => createdCollection,
      });

      // Populate cache first
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], meta: { total: 0, page: 1, pageSize: 25, totalPages: 0 } }),
      });
      await service.fetchCollections();
      
      // Create collection
      await service.createCollection(newCollection);

      // Verify cache was cleared by trying to fetch again
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [createdCollection], meta: { total: 1, page: 1, pageSize: 25, totalPages: 1 } }),
      });
      await service.fetchCollections();
      
      // Should have made 3 fetch calls total
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should notify real-time updates', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => createdCollection,
      });

      await service.createCollection(newCollection);

      expect(realTimeUpdatesService.simulateStatusUpdate).toHaveBeenCalledWith(
        createdCollection.id,
        'created',
        100
      );
    });
  });

  describe('validateCollection', () => {
    it('should validate required fields', async () => {
      const invalidCollection = {
        name: '',
        type: undefined,
      } as any;

      const result = await service.validateCollection(invalidCollection);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Collection name is required');
      expect(result.errors).toContain('Collection type is required');
    });

    it('should validate capacity constraints', async () => {
      const collection = {
        name: 'Test',
        type: 'standard',
        metadata: {
          capacity: {
            used: 150,
            total: 100,
            unit: 'items',
          },
        },
      } as any;

      const result = await service.validateCollection(collection);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Used capacity cannot exceed total capacity');
    });

    it('should add warning for high capacity', async () => {
      const collection = {
        name: 'Test',
        type: 'standard',
        metadata: {
          capacity: {
            used: 95,
            total: 100,
            unit: 'items',
          },
        },
      } as any;

      const result = await service.validateCollection(collection);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Collection is nearing capacity limit');
    });

    it('should validate date ranges', async () => {
      const collection = {
        name: 'Test',
        type: 'standard',
        startDate: new Date('2025-01-02'),
        endDate: new Date('2025-01-01'),
      } as any;

      const result = await service.validateCollection(collection);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Start date must be before end date');
    });
  });

  describe('bulkOperations', () => {
    it('should execute bulk operation in batches', async () => {
      const operation = {
        type: 'update',
        targets: Array.from({ length: 150 }, (_, i) => `col-${i}`),
        params: { status: 'active' },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const progressUpdates: any[] = [];
      await service.executeBulkOperation(operation, (progress) => {
        progressUpdates.push({ ...progress });
      });

      // Should have made 3 batch calls (50 items per batch)
      expect(global.fetch).toHaveBeenCalledTimes(3);
      
      // Should have progress updates
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1].status).toBe('completed');
      expect(progressUpdates[progressUpdates.length - 1].progress).toBe(100);
    });

    it('should handle cancellation', async () => {
      const operation = {
        type: 'delete',
        targets: Array.from({ length: 100 }, (_, i) => `col-${i}`),
        params: {},
      };

      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      const operationPromise = service.executeBulkOperation(operation);
      
      // Cancel immediately
      const operationId = await Promise.race([
        operationPromise.catch(() => null),
        new Promise<string>(resolve => setTimeout(() => resolve('timeout'), 50)),
      ]);
      
      if (operationId !== 'timeout') {
        service.cancelBulkOperation(operationId);
      }

      await expect(operationPromise).rejects.toThrow('Operation cancelled');
    });
  });

  describe('searchCollections', () => {
    it('should search collections with query', async () => {
      const searchResults = [
        { id: 'col-1', name: 'Matching Collection' },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: searchResults }),
      });

      const results = await service.searchCollections('matching');

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('q=matching');
      expect(url).toContain('fuzzy=true');
      expect(results).toEqual(searchResults);
    });

    it('should support search options', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await service.searchCollections('test', {
        searchFields: ['name', 'description'],
        fuzzy: false,
        limit: 20,
      });

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('fuzzy=false');
      expect(url).toContain('limit=20');
      expect(url).toContain('fields[]=name');
      expect(url).toContain('fields[]=description');
    });
  });

  describe('error handling', () => {
    it('should retry on failure', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [], meta: { total: 0, page: 1, pageSize: 25, totalPages: 0 } }),
        });

      const result = await service.fetchCollections();

      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(result.collections).toEqual([]);
    });

    it('should throw after max retries', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Persistent error'));

      await expect(service.fetchCollections()).rejects.toThrow('Persistent error');
      expect(global.fetch).toHaveBeenCalledTimes(3); // Max retries
    });

    it('should handle HTTP errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(service.fetchCollections()).rejects.toThrow('HTTP 404: Not Found');
    });
  });

  describe('caching', () => {
    it('should manage cache size', async () => {
      service = new CollectionService({ 
        apiBaseUrl: mockBaseUrl,
        cacheTimeout: 100, // 100ms timeout for testing
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [], meta: { total: 0, page: 1, pageSize: 25, totalPages: 0 } }),
      });

      // First call
      await service.fetchCollections();
      let stats = service.getCacheStats();
      expect(stats.size).toBe(1);

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Second call should fetch again
      await service.fetchCollections();
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should invalidate cache patterns', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [], meta: { total: 0, page: 1, pageSize: 25, totalPages: 0 } }),
      });

      // Populate cache with different queries
      await service.fetchCollections({ filter: { type: 'standard' } });
      await service.fetchCollections({ filter: { type: 'special' } });
      await service.fetchCollections({ filter: { status: 'active' } });

      let stats = service.getCacheStats();
      expect(stats.size).toBe(3);

      // Clear all caches
      service.clearCache();
      stats = service.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });
});