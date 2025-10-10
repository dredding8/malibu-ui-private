/**
 * Collection Management Store
 * 
 * Zustand store implementation for collection management with optimistic updates,
 * real-time synchronization, and comprehensive state management.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { useState, useCallback, useMemo } from 'react';
import {
  CollectionManagementState,
  Collection,
  CollectionFilter,
  CollectionSort,
  CollectionPagination,
  CollectionViewConfig,
  CollectionBulkOperation,
  OperationProgress,
  CollectionNotification,
  LoadingState,
  ErrorState,
} from '../types/collection.state';
import { CollectionAction } from '../types/collection.actions';
import { collectionService } from '../services/collectionService';
import { 
  filterCollections, 
  sortCollections, 
  calculateCollectionHealth,
  isCollectionActive,
  createCollectionSummary
} from '../utils/collectionHelpers';

// =============================================================================
// Store Actions Interface
// =============================================================================

interface CollectionStoreActions {
  // CRUD Operations
  loadCollections: (options?: {
    filter?: CollectionFilter;
    sort?: CollectionSort;
    pagination?: CollectionPagination;
    forceRefresh?: boolean;
  }) => Promise<void>;
  createCollection: (collection: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Collection>;
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<Collection>;
  deleteCollection: (id: string, options?: { cascade?: boolean; softDelete?: boolean }) => Promise<void>;
  duplicateCollection: (sourceId: string, updates?: Partial<Collection>) => Promise<Collection>;

  // Bulk Operations
  startBulkOperation: (operation: CollectionBulkOperation) => Promise<string>;
  cancelBulkOperation: (operationId: string) => void;
  getBulkOperationProgress: (operationId: string) => OperationProgress | null;

  // Selection Management
  selectCollections: (ids: string[], mode?: 'replace' | 'add' | 'remove' | 'toggle') => void;
  selectAllCollections: (selectFiltered?: boolean) => void;
  clearSelection: () => void;
  getSelectedCollections: () => Collection[];

  // Filter and View Management
  setFilter: (filter: CollectionFilter, options?: { preserveSort?: boolean; resetPagination?: boolean }) => void;
  clearFilter: (preserveSearch?: boolean) => void;
  setSort: (sort: CollectionSort, resetPagination?: boolean) => void;
  setPagination: (pagination: Partial<CollectionPagination>) => void;
  setViewConfig: (viewConfig: Partial<CollectionViewConfig>, saveToPreferences?: boolean) => void;

  // Real-time Operations
  subscribeToUpdates: (collectionIds?: string[]) => void;
  unsubscribeFromUpdates: () => void;
  handleRealtimeUpdate: (update: any) => void;

  // Cache Management
  invalidateCache: (keys?: string[], pattern?: string) => void;
  preloadCollections: (ids: string[], priority?: 'high' | 'normal' | 'low') => Promise<void>;

  // Error Handling
  clearError: (errorId?: string) => void;
  retryOperation: (operationId: string) => Promise<void>;
  rollbackOperation: (operationId: string) => Promise<void>;

  // Notifications
  addNotification: (notification: Omit<CollectionNotification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  markNotificationAsRead: (id: string) => void;

  // Performance Monitoring
  updatePerformanceMetrics: (metrics: {
    renderTime?: number;
    dataFetchTime?: number;
    cacheHitRate?: number;
    memoryUsage?: number;
    operationLatency?: number;
  }) => void;

  // State Utilities
  reset: () => void;
  getSnapshot: () => CollectionManagementState;
  restoreSnapshot: (snapshot: CollectionManagementState) => void;
}

// =============================================================================
// Initial State
// =============================================================================

const createInitialState = (): CollectionManagementState => ({
  collections: {
    collections: {},
    collectionIds: [],
    selectedIds: new Set(),
    editingId: null,
    loading: {
      collections: false,
      creating: false,
      updating: {},
      deleting: {},
      bulk: false,
      validating: {},
      exporting: false,
      importing: false,
    },
    errors: {
      global: [],
      collections: {},
      operations: {},
      validation: {},
      network: null,
      lastError: null,
    },
    cache: {
      metadata: {},
      statistics: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalSize: 0,
        entryCount: 0,
        averageEntrySize: 0,
      },
      invalidationRules: [],
      size: 0,
      maxSize: 50 * 1024 * 1024, // 50MB
      ttl: 5 * 60 * 1000, // 5 minutes
    },
    performance: {
      renderMetrics: {
        averageRenderTime: 0,
        maxRenderTime: 0,
        totalRenders: 0,
        slowRenders: 0,
        frameDrops: 0,
      },
      fetchMetrics: {
        averageFetchTime: 0,
        maxFetchTime: 0,
        totalFetches: 0,
        failedFetches: 0,
        cacheHitRate: 0,
      },
      memoryMetrics: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        arrayBuffers: 0,
      },
      operationLatency: {},
      history: [],
    },
  },
  filterView: {
    filter: {},
    sort: {
      field: 'updatedAt',
      direction: 'desc',
    },
    pagination: {
      page: 0,
      pageSize: 25,
      total: 0,
      totalPages: 0,
    },
    viewConfig: {
      mode: 'table',
      density: 'comfortable',
      columns: [
        { key: 'status', label: 'Status', width: 120, sortable: true, resizable: true, visible: true, dataType: 'status' },
        { key: 'name', label: 'Name', width: 250, sortable: true, resizable: true, visible: true, dataType: 'string' },
        { key: 'type', label: 'Type', width: 150, sortable: true, resizable: true, visible: true, dataType: 'string' },
        { key: 'updatedAt', label: 'Last Updated', width: 180, sortable: true, resizable: true, visible: true, dataType: 'date' },
        { key: 'createdBy', label: 'Created By', width: 150, sortable: true, resizable: true, visible: true, dataType: 'string' },
      ],
    },
    searchHistory: [],
    filterPresets: [],
    quickFilters: {
      recent: [],
      favorites: [],
      suggestions: [],
      recommendations: [],
    },
  },
  operations: {
    activeOperations: {},
    operationHistory: [],
    bulkOperation: null,
    undoRedoStack: {
      undoStack: [],
      redoStack: [],
      maxStackSize: 50,
      position: 0,
      canUndo: false,
      canRedo: false,
    },
    validationCache: {},
  },
  realtime: {
    connectionStatus: 'disconnected',
    lastConnected: null,
    pendingUpdates: [],
    subscriptions: [],
    retryCount: 0,
    connectionError: null,
  },
  ui: {
    notifications: [],
    modals: {
      createCollection: false,
      editCollection: null,
      deleteConfirmation: null,
      bulkOperation: false,
      settings: false,
      help: false,
      custom: {},
    },
    sidebar: {
      isExpanded: true,
      activeSection: 'filters',
      width: 300,
      isPinned: true,
      history: [],
    },
    theme: {
      theme: 'light',
      highContrast: false,
      reducedMotion: false,
      fontSize: 'medium',
      colorScheme: 'default',
    },
    layout: {
      sidebarWidth: 300,
      contentPadding: 20,
      gridItemSize: 'medium',
      tableRowHeight: 'comfortable',
      panelPositions: {},
    },
    keyboardNavigation: {
      focusedElement: null,
      focusTrapActive: false,
      shortcutsEnabled: true,
      navigationMode: 'mixed',
      focusHistory: [],
    },
  },
});

// =============================================================================
// Store Implementation
// =============================================================================

export const useCollectionStore = create<CollectionManagementState & CollectionStoreActions>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...createInitialState(),

        // =============================================================================
        // CRUD Operations
        // =============================================================================

        loadCollections: async (options = {}) => {
          const { filter, sort, pagination, forceRefresh = false } = options;

          set((state) => {
            state.collections.loading.collections = true;
            if (filter) state.filterView.filter = filter;
            if (sort) state.filterView.sort = sort;
            if (pagination) state.filterView.pagination = { ...state.filterView.pagination, ...pagination };
          });

          try {
            const startTime = performance.now();

            // Use the collection service
            const response = await collectionService.fetchCollections({
              filter: filter || get().filterView.filter,
              sort: sort || get().filterView.sort,
              pagination: pagination || get().filterView.pagination,
              forceRefresh,
            });

            const endTime = performance.now();
            const fetchTime = endTime - startTime;

            set((state) => {
              // Update collections
              state.collections.collections = {};
              state.collections.collectionIds = [];
              
              response.collections.forEach(collection => {
                state.collections.collections[collection.id] = collection;
                state.collections.collectionIds.push(collection.id);
              });

              // Update pagination
              state.filterView.pagination = response.pageInfo;

              // Update performance metrics
              state.collections.performance.fetchMetrics.totalFetches++;
              state.collections.performance.fetchMetrics.averageFetchTime = 
                (state.collections.performance.fetchMetrics.averageFetchTime + fetchTime) / 2;

              if (fetchTime > state.collections.performance.fetchMetrics.maxFetchTime) {
                state.collections.performance.fetchMetrics.maxFetchTime = fetchTime;
              }

              // Update cache hit rate
              const cacheStats = collectionService.getCacheStats();
              state.collections.performance.fetchMetrics.cacheHitRate = 
                cacheStats.size > 0 ? 0.8 : 0; // Simplified cache hit calculation

              state.collections.loading.collections = false;
            });

          } catch (error) {
            set((state) => {
              state.collections.loading.collections = false;
              state.collections.errors.global.push({
                id: `load-error-${Date.now()}`,
                message: error instanceof Error ? error.message : 'Failed to load collections',
                code: 'LOAD_FAILED',
                severity: 'high',
                timestamp: new Date(),
                recoverable: true,
              });
            });
            throw error;
          }
        },

        createCollection: async (collectionData) => {
          const tempId = `temp-${Date.now()}`;
          const tempCollection: Collection = {
            ...collectionData,
            id: tempId,
            createdAt: new Date(),
            updatedAt: new Date(),
            childIds: [],
          };

          // Optimistic update
          set((state) => {
            state.collections.loading.creating = true;
            state.collections.collections[tempId] = tempCollection;
            state.collections.collectionIds.unshift(tempId);
          });

          try {
            // Validate before creating
            const validation = await collectionService.validateCollection(collectionData);
            if (!validation.isValid) {
              throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            // Create via service
            const createdCollection = await collectionService.createCollection(collectionData);

            set((state) => {
              // Replace temporary collection with real one
              delete state.collections.collections[tempId];
              state.collections.collections[createdCollection.id] = createdCollection;
              
              const tempIndex = state.collections.collectionIds.indexOf(tempId);
              if (tempIndex !== -1) {
                state.collections.collectionIds[tempIndex] = createdCollection.id;
              }

              state.collections.loading.creating = false;

              // Add success notification
              get().addNotification({
                type: 'success',
                title: 'Collection Created',
                message: `Successfully created ${createdCollection.name}`,
                timeout: 5000,
              });
            });

            return createdCollection;

          } catch (error) {
            // Rollback optimistic update
            set((state) => {
              delete state.collections.collections[tempId];
              const tempIndex = state.collections.collectionIds.indexOf(tempId);
              if (tempIndex !== -1) {
                state.collections.collectionIds.splice(tempIndex, 1);
              }
              state.collections.loading.creating = false;
            });
            throw error;
          }
        },

        updateCollection: async (id, updates) => {
          const currentCollection = get().collections.collections[id];
          if (!currentCollection) {
            throw new Error(`Collection with id ${id} not found`);
          }

          const optimisticCollection: Collection = {
            ...currentCollection,
            ...updates,
            updatedAt: new Date(),
          };

          // Optimistic update
          set((state) => {
            state.collections.loading.updating[id] = true;
            state.collections.collections[id] = optimisticCollection;
          });

          try {
            // Validate before updating
            const validation = await collectionService.validateCollection(optimisticCollection);
            if (!validation.isValid) {
              throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            // Update via service
            const updatedCollection = await collectionService.updateCollection(id, updates);

            set((state) => {
              state.collections.collections[id] = updatedCollection;
              state.collections.loading.updating[id] = false;

              // Check health status after update
              const health = calculateCollectionHealth(updatedCollection);
              if (health.status === 'critical') {
                get().addNotification({
                  type: 'warning',
                  title: 'Collection Health Critical',
                  message: `${updatedCollection.name} requires immediate attention`,
                  timeout: 0, // Don't auto-dismiss
                });
              }
            });

            return updatedCollection;

          } catch (error) {
            // Rollback optimistic update
            set((state) => {
              state.collections.collections[id] = currentCollection;
              state.collections.loading.updating[id] = false;
            });
            throw error;
          }
        },

        deleteCollection: async (id, options = {}) => {
          const { cascade = false, softDelete = false } = options;
          const collection = get().collections.collections[id];

          if (!collection) {
            throw new Error(`Collection with id ${id} not found`);
          }

          set((state) => {
            state.collections.loading.deleting[id] = true;
          });

          try {
            // Delete via service
            await collectionService.deleteCollection(id, options);

            set((state) => {
              if (!softDelete) {
                delete state.collections.collections[id];
                const index = state.collections.collectionIds.indexOf(id);
                if (index !== -1) {
                  state.collections.collectionIds.splice(index, 1);
                }
              } else {
                // Mark as deleted but keep in store
                if (state.collections.collections[id]) {
                  state.collections.collections[id].status = 'archived';
                  state.collections.collections[id].metadata = {
                    ...state.collections.collections[id].metadata,
                    customProperties: {
                      ...state.collections.collections[id].metadata.customProperties,
                      deleted: true,
                      deletedAt: new Date(),
                    },
                  };
                }
              }

              // Remove from selection if selected
              state.collections.selectedIds.delete(id);
              state.collections.loading.deleting[id] = false;

              // Add notification
              get().addNotification({
                type: 'info',
                title: 'Collection Deleted',
                message: `Successfully ${softDelete ? 'archived' : 'deleted'} ${collection.name}`,
                timeout: 5000,
              });
            });

          } catch (error) {
            set((state) => {
              state.collections.loading.deleting[id] = false;
            });
            throw error;
          }
        },

        duplicateCollection: async (sourceId, updates = {}) => {
          const sourceCollection = get().collections.collections[sourceId];
          if (!sourceCollection) {
            throw new Error(`Source collection with id ${sourceId} not found`);
          }

          const duplicatedCollection: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'> = {
            ...sourceCollection,
            name: updates.name || `${sourceCollection.name} (Copy)`,
            ...updates,
            metadata: {
              ...sourceCollection.metadata,
              ...updates.metadata,
              customProperties: {
                ...sourceCollection.metadata?.customProperties,
                ...updates.metadata?.customProperties,
                duplicatedFrom: sourceId,
                duplicatedAt: new Date(),
              },
            },
          };

          return get().createCollection(duplicatedCollection);
        },

        // =============================================================================
        // Bulk Operations
        // =============================================================================

        startBulkOperation: async (operation) => {
          set((state) => {
            state.collections.loading.bulk = true;
          });

          try {
            // Execute bulk operation via service
            const operationId = await collectionService.executeBulkOperation(
              operation,
              (progress) => {
                set((state) => {
                  state.operations.activeOperations[progress.id] = progress;
                  
                  if (progress.status === 'running') {
                    state.operations.bulkOperation = {
                      id: progress.id,
                      type: operation.type,
                      targets: operation.targets,
                      params: operation.params,
                      progress,
                      cancellable: true,
                      requiresConfirmation: operation.requiresConfirmation,
                    };
                  } else if (progress.status === 'completed' || progress.status === 'failed') {
                    state.operations.bulkOperation = null;
                    state.collections.loading.bulk = false;
                    
                    // Add to operation history
                    state.operations.operationHistory.unshift({
                      ...progress,
                      operation,
                    });
                    
                    // Keep only last 50 operations
                    if (state.operations.operationHistory.length > 50) {
                      state.operations.operationHistory = state.operations.operationHistory.slice(0, 50);
                    }
                  }
                });
              }
            );

            // Add success notification
            get().addNotification({
              type: 'success',
              title: 'Bulk Operation Complete',
              message: `Successfully completed ${operation.type} operation on ${operation.targets.length} collections`,
              timeout: 10000,
            });

            return operationId;
          } catch (error) {
            set((state) => {
              state.collections.loading.bulk = false;
            });
            throw error;
          }
        },

        cancelBulkOperation: (operationId) => {
          // Cancel via service
          collectionService.cancelBulkOperation(operationId);
          
          set((state) => {
            const operation = state.operations.activeOperations[operationId];
            if (operation && operation.status === 'running') {
              operation.status = 'cancelled';
              operation.completedAt = new Date();
            }
            state.operations.bulkOperation = null;
            state.collections.loading.bulk = false;
          });
        },

        getBulkOperationProgress: (operationId) => {
          return get().operations.activeOperations[operationId] || null;
        },

        // =============================================================================
        // Selection Management
        // =============================================================================

        selectCollections: (ids, mode = 'replace') => {
          set((state) => {
            switch (mode) {
              case 'replace':
                state.collections.selectedIds = new Set(ids);
                break;
              case 'add':
                ids.forEach(id => state.collections.selectedIds.add(id));
                break;
              case 'remove':
                ids.forEach(id => state.collections.selectedIds.delete(id));
                break;
              case 'toggle':
                ids.forEach(id => {
                  if (state.collections.selectedIds.has(id)) {
                    state.collections.selectedIds.delete(id);
                  } else {
                    state.collections.selectedIds.add(id);
                  }
                });
                break;
            }
          });
        },

        selectAllCollections: (selectFiltered = true) => {
          set((state) => {
            if (selectFiltered) {
              // Select only filtered collections (implement filtering logic)
              state.collections.selectedIds = new Set(state.collections.collectionIds);
            } else {
              // Select all collections
              state.collections.selectedIds = new Set(Object.keys(state.collections.collections));
            }
          });
        },

        clearSelection: () => {
          set((state) => {
            state.collections.selectedIds.clear();
          });
        },

        getSelectedCollections: () => {
          const state = get();
          return Array.from(state.collections.selectedIds)
            .map(id => state.collections.collections[id])
            .filter(Boolean);
        },

        // =============================================================================
        // Filter and View Management
        // =============================================================================

        setFilter: (filter, options = {}) => {
          const { preserveSort = true, resetPagination = true } = options;
          
          set((state) => {
            state.filterView.filter = filter;
            
            if (resetPagination) {
              state.filterView.pagination.page = 0;
            }
            
            if (!preserveSort) {
              state.filterView.sort = {
                field: 'updatedAt',
                direction: 'desc',
              };
            }

            // Add to search history if there's a search term
            if (filter.search && !state.filterView.searchHistory.includes(filter.search)) {
              state.filterView.searchHistory.unshift(filter.search);
              if (state.filterView.searchHistory.length > 10) {
                state.filterView.searchHistory.pop();
              }
            }
            
            // Add to quick filters if it's a common filter
            const filterKey = JSON.stringify(filter);
            if (!state.filterView.quickFilters.recent.includes(filterKey)) {
              state.filterView.quickFilters.recent.unshift(filterKey);
              if (state.filterView.quickFilters.recent.length > 5) {
                state.filterView.quickFilters.recent.pop();
              }
            }
          });

          // Trigger reload with new filter
          get().loadCollections();
        },

        clearFilter: (preserveSearch = false) => {
          set((state) => {
            const currentSearch = state.filterView.filter.search;
            state.filterView.filter = preserveSearch && currentSearch ? { search: currentSearch } : {};
            state.filterView.pagination.page = 0;
          });

          get().loadCollections();
        },

        setSort: (sort, resetPagination = true) => {
          set((state) => {
            state.filterView.sort = sort;
            if (resetPagination) {
              state.filterView.pagination.page = 0;
            }
          });

          get().loadCollections();
        },

        setPagination: (pagination) => {
          set((state) => {
            state.filterView.pagination = { ...state.filterView.pagination, ...pagination };
          });

          get().loadCollections();
        },

        setViewConfig: (viewConfig, saveToPreferences = false) => {
          set((state) => {
            state.filterView.viewConfig = { ...state.filterView.viewConfig, ...viewConfig };
          });

          if (saveToPreferences) {
            // Save to localStorage or user preferences
            try {
              localStorage.setItem('collectionViewConfig', JSON.stringify(get().filterView.viewConfig));
            } catch (error) {
              console.warn('Failed to save view config to preferences:', error);
            }
          }
        },

        // =============================================================================
        // Real-time Operations
        // =============================================================================

        subscribeToUpdates: (collectionIds) => {
          // Implementation would depend on your real-time system (WebSocket, SSE, etc.)
          set((state) => {
            state.realtime.connectionStatus = 'connected';
            state.realtime.lastConnected = new Date();
          });
        },

        unsubscribeFromUpdates: () => {
          set((state) => {
            state.realtime.connectionStatus = 'disconnected';
          });
        },

        handleRealtimeUpdate: (update) => {
          set((state) => {
            state.realtime.pendingUpdates.push({
              id: `update-${Date.now()}`,
              type: update.type,
              collectionId: update.collectionId,
              data: update.data,
              timestamp: new Date(),
              source: update.source || 'websocket',
              processed: false,
            });
          });

          // Process the update
          // This would contain logic to update the collections based on the real-time data
        },

        // =============================================================================
        // Cache Management
        // =============================================================================

        invalidateCache: (keys, pattern) => {
          set((state) => {
            if (keys) {
              keys.forEach(key => {
                delete state.collections.cache.metadata[key];
              });
            } else if (pattern) {
              Object.keys(state.collections.cache.metadata).forEach(key => {
                if (key.includes(pattern)) {
                  delete state.collections.cache.metadata[key];
                }
              });
            } else {
              state.collections.cache.metadata = {};
            }
          });
        },

        preloadCollections: async (ids, priority = 'normal') => {
          // Implementation for preloading collections
          const missingIds = ids.filter(id => !get().collections.collections[id]);
          
          if (missingIds.length > 0) {
            // Load missing collections
            await get().loadCollections();
          }
        },

        // =============================================================================
        // Error Handling
        // =============================================================================

        clearError: (errorId) => {
          set((state) => {
            if (errorId) {
              state.collections.errors.global = state.collections.errors.global.filter(error => error.id !== errorId);
            } else {
              state.collections.errors.global = [];
            }
          });
        },

        retryOperation: async (operationId) => {
          const operation = get().operations.activeOperations[operationId];
          if (!operation) {
            throw new Error(`Operation ${operationId} not found`);
          }

          // Reset operation status and retry
          set((state) => {
            if (state.operations.activeOperations[operationId]) {
              state.operations.activeOperations[operationId].status = 'pending';
              state.operations.activeOperations[operationId].error = undefined;
            }
          });

          // Implement retry logic based on operation type
        },

        rollbackOperation: async (operationId) => {
          // Implementation for rolling back operations
          set((state) => {
            delete state.operations.activeOperations[operationId];
          });
        },

        // =============================================================================
        // Notifications
        // =============================================================================

        addNotification: (notification) => {
          const fullNotification: CollectionNotification = {
            ...notification,
            id: `notification-${Date.now()}`,
            timestamp: new Date(),
            isRead: false,
          };

          set((state) => {
            state.ui.notifications.unshift(fullNotification);
            
            // Auto-remove after timeout if specified
            if (fullNotification.timeout) {
              setTimeout(() => {
                get().removeNotification(fullNotification.id);
              }, fullNotification.timeout);
            }
          });
        },

        removeNotification: (id) => {
          set((state) => {
            state.ui.notifications = state.ui.notifications.filter(notification => notification.id !== id);
          });
        },

        markNotificationAsRead: (id) => {
          set((state) => {
            const notification = state.ui.notifications.find(n => n.id === id);
            if (notification) {
              notification.isRead = true;
            }
          });
        },

        // =============================================================================
        // Performance Monitoring
        // =============================================================================

        updatePerformanceMetrics: (metrics) => {
          set((state) => {
            if (metrics.renderTime !== undefined) {
              const renderMetrics = state.collections.performance.renderMetrics;
              renderMetrics.totalRenders++;
              renderMetrics.averageRenderTime = (renderMetrics.averageRenderTime + metrics.renderTime) / 2;
              if (metrics.renderTime > renderMetrics.maxRenderTime) {
                renderMetrics.maxRenderTime = metrics.renderTime;
              }
              if (metrics.renderTime > 16) { // Slower than 60fps
                renderMetrics.slowRenders++;
              }
            }

            if (metrics.dataFetchTime !== undefined) {
              const fetchMetrics = state.collections.performance.fetchMetrics;
              fetchMetrics.averageFetchTime = (fetchMetrics.averageFetchTime + metrics.dataFetchTime) / 2;
              if (metrics.dataFetchTime > fetchMetrics.maxFetchTime) {
                fetchMetrics.maxFetchTime = metrics.dataFetchTime;
              }
            }

            if (metrics.cacheHitRate !== undefined) {
              state.collections.performance.fetchMetrics.cacheHitRate = metrics.cacheHitRate;
            }

            if (metrics.operationLatency !== undefined) {
              // Store operation latency for specific operations
            }
          });
        },

        // =============================================================================
        // State Utilities
        // =============================================================================

        reset: () => {
          set(createInitialState());
        },

        getSnapshot: (() => {
          let cachedSnapshot: CollectionManagementState | null = null;
          let lastUpdate = 0;

          return () => {
            const currentState = get();
            const now = Date.now();

            // Cache snapshot for 16ms (one frame) to prevent infinite loops
            if (cachedSnapshot && (now - lastUpdate) < 16) {
              return cachedSnapshot;
            }

            cachedSnapshot = currentState;
            lastUpdate = now;
            return cachedSnapshot;
          };
        })(),

        restoreSnapshot: (snapshot) => {
          set(snapshot);
        },
      })),
      {
        name: 'collection-management-store',
        version: 1,
      }
    )
  )
);

// =============================================================================
// Export Additional Utilities
// =============================================================================

/**
 * Hook to get a specific collection by ID
 */
export const useCollection = (id: string): Collection | undefined => {
  return useCollectionStore(state => state.collections.collections[id]);
};

/**
 * Hook to get filtered collections
 */
export const useFilteredCollections = (): Collection[] => {
  const collections = useCollectionStore(state => 
    state.collections.collectionIds.map(id => state.collections.collections[id]).filter(Boolean)
  );
  const filter = useCollectionStore(state => state.filterView.filter);
  const sort = useCollectionStore(state => state.filterView.sort);
  
  // Apply client-side filtering and sorting
  let filtered = collections;
  if (Object.keys(filter).length > 0) {
    filtered = filterCollections(collections, filter);
  }
  
  if (sort) {
    filtered = sortCollections(filtered, sort);
  }
  
  return filtered;
};

/**
 * Hook to get loading state
 */
export const useCollectionsLoading = (): LoadingState => {
  return useCollectionStore(state => state.collections.loading);
};

/**
 * Hook to get error state
 */
export const useCollectionsErrors = (): ErrorState => {
  return useCollectionStore(state => state.collections.errors);
};

/**
 * Hook to get selection state
 */
export const useCollectionSelection = () => {
  return useCollectionStore(state => ({
    selectedIds: state.collections.selectedIds,
    selectedCollections: Array.from(state.collections.selectedIds)
      .map(id => state.collections.collections[id])
      .filter(Boolean),
  }));
};

/**
 * Performance monitoring hook
 */
export const usePerformanceMonitor = () => {
  const updateMetrics = useCollectionStore(state => state.updatePerformanceMetrics);
  
  return {
    measureRender: (fn: () => void) => {
      const start = performance.now();
      fn();
      const end = performance.now();
      updateMetrics({ renderTime: end - start });
    },
    measureFetch: async (fn: () => Promise<any>) => {
      const start = performance.now();
      const result = await fn();
      const end = performance.now();
      updateMetrics({ dataFetchTime: end - start });
      return result;
    },
  };
};

/**
 * Hook to get collection health status
 */
export const useCollectionHealth = (id: string) => {
  const collection = useCollection(id);
  
  if (!collection) {
    return { status: 'unknown' as const, score: 0, factors: {} };
  }
  
  return calculateCollectionHealth(collection);
};

/**
 * Hook to get active collections
 */
export const useActiveCollections = (): Collection[] => {
  const collections = useFilteredCollections();
  return collections.filter(isCollectionActive);
};

/**
 * Hook to search collections
 */
export const useCollectionSearch = () => {
  const [searchResults, setSearchResults] = useState<Collection[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const search = useCallback(async (query: string, options = {}) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const results = await collectionService.searchCollections(query, options);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);
  
  return { searchResults, isSearching, search };
};

/**
 * Hook to get collection statistics
 */
export const useCollectionStatistics = () => {
  const collections = useFilteredCollections();
  return useMemo(() => createCollectionSummary(collections), [collections]);
};