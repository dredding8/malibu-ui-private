/**
 * Collection Service
 * 
 * Centralized service layer for collection management operations.
 * Handles API communication, data transformation, caching, and business logic.
 * 
 * @version 2.0.0
 * @date 2025-09-30
 */

import { 
  Collection, 
  CollectionFilter, 
  CollectionSort, 
  CollectionPagination,
  ValidationResult 
} from '../types/collection.types';
import { 
  CollectionBulkOperation, 
  OperationProgress 
} from '../types/collection.state';
import { realTimeUpdatesService } from './realTimeUpdatesService';
import { performanceMonitoringService } from './performanceMonitoringService';

// =============================================================================
// Service Configuration
// =============================================================================

interface ServiceConfig {
  apiBaseUrl: string;
  enableCaching: boolean;
  cacheTimeout: number;
  maxRetries: number;
  retryDelay: number;
  enableMetrics: boolean;
  batchSize: number;
}

const defaultConfig: ServiceConfig = {
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || '/api',
  enableCaching: true,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  maxRetries: 3,
  retryDelay: 1000,
  enableMetrics: true,
  batchSize: 50,
};

// =============================================================================
// Cache Management
// =============================================================================

class CollectionCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout: number;

  constructor(timeout: number) {
    this.cacheTimeout = timeout;
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.cacheTimeout;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    Array.from(this.cache.keys())
      .filter(key => key.includes(pattern))
      .forEach(key => this.cache.delete(key));
  }

  getStats() {
    const entries = Array.from(this.cache.entries());
    return {
      size: entries.length,
      totalBytes: JSON.stringify(entries).length,
      oldestEntry: Math.min(...entries.map(([, v]) => v.timestamp)),
      newestEntry: Math.max(...entries.map(([, v]) => v.timestamp)),
    };
  }
}

// =============================================================================
// API Client
// =============================================================================

class APIClient {
  private baseUrl: string;
  private maxRetries: number;
  private retryDelay: number;

  constructor(baseUrl: string, maxRetries: number, retryDelay: number) {
    this.baseUrl = baseUrl;
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.maxRetries - 1) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// =============================================================================
// Collection Service Implementation
// =============================================================================

export class CollectionService {
  private config: ServiceConfig;
  private cache: CollectionCache;
  private apiClient: APIClient;
  private activeOperations = new Map<string, AbortController>();

  constructor(config: Partial<ServiceConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.cache = new CollectionCache(this.config.cacheTimeout);
    this.apiClient = new APIClient(
      this.config.apiBaseUrl,
      this.config.maxRetries,
      this.config.retryDelay
    );
  }

  // =============================================================================
  // CRUD Operations
  // =============================================================================

  /**
   * Fetch collections with filtering, sorting, and pagination
   */
  async fetchCollections(options: {
    filter?: CollectionFilter;
    sort?: CollectionSort;
    pagination?: CollectionPagination;
    forceRefresh?: boolean;
  } = {}): Promise<{
    collections: Collection[];
    total: number;
    pageInfo: CollectionPagination;
  }> {
    const { filter = {}, sort, pagination, forceRefresh = false } = options;
    
    // Generate cache key
    const cacheKey = this.generateCacheKey('collections', { filter, sort, pagination });
    
    // Check cache
    if (!forceRefresh && this.config.enableCaching) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        if (this.config.enableMetrics) {
          performanceMonitoringService.recordMetric('cache_hit', 1);
        }
        return cached;
      }
    }

    // Start performance tracking
    const startTime = performance.now();

    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      // Add filter parameters
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(`filter[${key}]`, String(value));
        }
      });
      
      // Add sort parameters
      if (sort) {
        params.append('sort', `${sort.direction === 'desc' ? '-' : ''}${sort.field}`);
      }
      
      // Add pagination parameters
      if (pagination) {
        params.append('page', String(pagination.page));
        params.append('limit', String(pagination.pageSize));
      }

      // Make API request
      const response = await this.apiClient.request<{
        data: Collection[];
        meta: {
          total: number;
          page: number;
          pageSize: number;
          totalPages: number;
        };
      }>(`/collections?${params}`);

      const result = {
        collections: response.data,
        total: response.meta.total,
        pageInfo: {
          page: response.meta.page,
          pageSize: response.meta.pageSize,
          total: response.meta.total,
          totalPages: response.meta.totalPages,
        },
      };

      // Cache result
      if (this.config.enableCaching) {
        this.cache.set(cacheKey, result);
      }

      // Record metrics
      if (this.config.enableMetrics) {
        const duration = performance.now() - startTime;
        performanceMonitoringService.recordMetric('fetch_collections_duration', duration);
        performanceMonitoringService.recordMetric('collections_count', result.collections.length);
      }

      return result;
    } catch (error) {
      if (this.config.enableMetrics) {
        performanceMonitoringService.recordMetric('fetch_collections_error', 1);
      }
      throw error;
    }
  }

  /**
   * Fetch a single collection by ID
   */
  async fetchCollection(id: string, options: {
    includeRelated?: boolean;
    forceRefresh?: boolean;
  } = {}): Promise<Collection> {
    const { includeRelated = false, forceRefresh = false } = options;
    
    const cacheKey = `collection:${id}:${includeRelated}`;
    
    if (!forceRefresh && this.config.enableCaching) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    const params = includeRelated ? '?include=related' : '';
    const collection = await this.apiClient.request<Collection>(
      `/collections/${id}${params}`
    );

    if (this.config.enableCaching) {
      this.cache.set(cacheKey, collection);
    }

    return collection;
  }

  /**
   * Create a new collection
   */
  async createCollection(
    data: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Collection> {
    const startTime = performance.now();

    try {
      const collection = await this.apiClient.request<Collection>('/collections', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      // Invalidate list cache
      this.cache.invalidate('collections');

      // Notify real-time updates
      realTimeUpdatesService.simulateStatusUpdate(collection.id, 'created', 100);

      // Record metrics
      if (this.config.enableMetrics) {
        const duration = performance.now() - startTime;
        performanceMonitoringService.recordMetric('create_collection_duration', duration);
      }

      return collection;
    } catch (error) {
      if (this.config.enableMetrics) {
        performanceMonitoringService.recordMetric('create_collection_error', 1);
      }
      throw error;
    }
  }

  /**
   * Update an existing collection
   */
  async updateCollection(
    id: string,
    updates: Partial<Collection>
  ): Promise<Collection> {
    const startTime = performance.now();

    try {
      const collection = await this.apiClient.request<Collection>(
        `/collections/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updates),
        }
      );

      // Invalidate caches
      this.cache.invalidate(`collection:${id}`);
      this.cache.invalidate('collections');

      // Notify real-time updates
      realTimeUpdatesService.simulateStatusUpdate(collection.id, 'updated', 100);

      // Record metrics
      if (this.config.enableMetrics) {
        const duration = performance.now() - startTime;
        performanceMonitoringService.recordMetric('update_collection_duration', duration);
      }

      return collection;
    } catch (error) {
      if (this.config.enableMetrics) {
        performanceMonitoringService.recordMetric('update_collection_error', 1);
      }
      throw error;
    }
  }

  /**
   * Delete a collection
   */
  async deleteCollection(
    id: string,
    options: {
      cascade?: boolean;
      softDelete?: boolean;
    } = {}
  ): Promise<void> {
    const params = new URLSearchParams();
    if (options.cascade) params.append('cascade', 'true');
    if (options.softDelete) params.append('soft', 'true');

    await this.apiClient.request(`/collections/${id}?${params}`, {
      method: 'DELETE',
    });

    // Invalidate caches
    this.cache.invalidate(`collection:${id}`);
    this.cache.invalidate('collections');

    // Notify real-time updates
    realTimeUpdatesService.simulateStatusUpdate(id, 'deleted', 100);
  }

  // =============================================================================
  // Bulk Operations
  // =============================================================================

  /**
   * Execute bulk operation on multiple collections
   */
  async executeBulkOperation(
    operation: CollectionBulkOperation,
    onProgress?: (progress: OperationProgress) => void
  ): Promise<string> {
    const operationId = `bulk-${Date.now()}`;
    const controller = new AbortController();
    
    this.activeOperations.set(operationId, controller);

    const progress: OperationProgress = {
      id: operationId,
      type: operation.type,
      progress: 0,
      status: 'pending',
      startedAt: new Date(),
      details: {
        current: 0,
        total: operation.targets.length,
        phase: 'initializing',
      },
    };

    try {
      // Process in batches
      const batches = this.createBatches(operation.targets, this.config.batchSize);
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        if (controller.signal.aborted) {
          throw new Error('Operation cancelled');
        }

        const batch = batches[batchIndex];
        progress.details!.phase = `Processing batch ${batchIndex + 1} of ${batches.length}`;
        
        await this.processBatch(operation.type, batch, operation.params);
        
        progress.details!.current = Math.min(
          (batchIndex + 1) * this.config.batchSize,
          operation.targets.length
        );
        progress.progress = Math.round(
          (progress.details!.current / operation.targets.length) * 100
        );
        progress.status = 'running';
        
        onProgress?.(progress);
      }

      progress.status = 'completed';
      progress.completedAt = new Date();
      progress.progress = 100;
      onProgress?.(progress);

      // Invalidate cache after bulk operation
      this.cache.invalidate('collections');

      return operationId;
    } catch (error) {
      progress.status = 'failed';
      progress.error = error instanceof Error ? error.message : 'Operation failed';
      progress.completedAt = new Date();
      onProgress?.(progress);
      
      throw error;
    } finally {
      this.activeOperations.delete(operationId);
    }
  }

  /**
   * Cancel an active bulk operation
   */
  cancelBulkOperation(operationId: string): void {
    const controller = this.activeOperations.get(operationId);
    if (controller) {
      controller.abort();
      this.activeOperations.delete(operationId);
    }
  }

  // =============================================================================
  // Validation
  // =============================================================================

  /**
   * Validate a collection
   */
  async validateCollection(
    collection: Collection | Partial<Collection>
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!collection.name?.trim()) {
      errors.push('Collection name is required');
    }

    if (!collection.type) {
      errors.push('Collection type is required');
    }

    // Business logic validation
    if (collection.metadata?.capacity) {
      const capacity = collection.metadata.capacity;
      if (capacity.used > capacity.total) {
        errors.push('Used capacity cannot exceed total capacity');
      }
      
      const utilization = (capacity.used / capacity.total) * 100;
      if (utilization > 90) {
        warnings.push('Collection is nearing capacity limit');
      }
    }

    // Date validation
    if (collection.startDate && collection.endDate) {
      const start = new Date(collection.startDate);
      const end = new Date(collection.endDate);
      
      if (start > end) {
        errors.push('Start date must be before end date');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate multiple collections
   */
  async validateBatch(
    collections: Collection[]
  ): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();
    
    for (const collection of collections) {
      const result = await this.validateCollection(collection);
      results.set(collection.id, result);
    }
    
    return results;
  }

  // =============================================================================
  // Search and Filtering
  // =============================================================================

  /**
   * Search collections by query
   */
  async searchCollections(
    query: string,
    options: {
      searchFields?: string[];
      fuzzy?: boolean;
      limit?: number;
    } = {}
  ): Promise<Collection[]> {
    const params = new URLSearchParams({
      q: query,
      fuzzy: String(options.fuzzy ?? true),
      limit: String(options.limit ?? 50),
    });

    if (options.searchFields) {
      options.searchFields.forEach(field => {
        params.append('fields[]', field);
      });
    }

    const response = await this.apiClient.request<{ data: Collection[] }>(
      `/collections/search?${params}`
    );

    return response.data;
  }

  /**
   * Get collection suggestions based on partial input
   */
  async getSuggestions(
    input: string,
    field: string = 'name',
    limit: number = 10
  ): Promise<string[]> {
    const cacheKey = `suggestions:${field}:${input}:${limit}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const response = await this.apiClient.request<{ suggestions: string[] }>(
      `/collections/suggestions?field=${field}&input=${input}&limit=${limit}`
    );

    this.cache.set(cacheKey, response.suggestions);
    
    return response.suggestions;
  }

  // =============================================================================
  // Analytics and Metrics
  // =============================================================================

  /**
   * Get collection statistics
   */
  async getStatistics(
    timeRange?: { start: Date; end: Date }
  ): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    trends: Array<{ date: string; count: number }>;
  }> {
    const params = new URLSearchParams();
    
    if (timeRange) {
      params.append('start', timeRange.start.toISOString());
      params.append('end', timeRange.end.toISOString());
    }

    return await this.apiClient.request(`/collections/statistics?${params}`);
  }

  /**
   * Get collection health metrics
   */
  async getHealthMetrics(
    collectionIds?: string[]
  ): Promise<Map<string, {
    health: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  }>> {
    const params = collectionIds 
      ? `?ids=${collectionIds.join(',')}` 
      : '';

    const response = await this.apiClient.request<{
      metrics: Array<{
        id: string;
        health: 'healthy' | 'warning' | 'critical';
        issues: string[];
        recommendations: string[];
      }>;
    }>(`/collections/health${params}`);

    return new Map(
      response.metrics.map(m => [m.id, m])
    );
  }

  // =============================================================================
  // Helper Methods
  // =============================================================================

  private generateCacheKey(prefix: string, params: any): string {
    return `${prefix}:${JSON.stringify(params)}`;
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    
    return batches;
  }

  private async processBatch(
    operationType: string,
    ids: string[],
    params: any
  ): Promise<void> {
    await this.apiClient.request('/collections/bulk', {
      method: 'POST',
      body: JSON.stringify({
        operation: operationType,
        ids,
        params,
      }),
    });
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.invalidate();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }
}

// =============================================================================
// Singleton Export
// =============================================================================

export const collectionService = new CollectionService();

// =============================================================================
// Type Guards
// =============================================================================

export function isCollection(obj: any): obj is Collection {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.type === 'string'
  );
}

export function isValidationResult(obj: any): obj is ValidationResult {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.isValid === 'boolean' &&
    Array.isArray(obj.errors) &&
    Array.isArray(obj.warnings)
  );
}