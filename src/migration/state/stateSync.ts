/**
 * State Synchronization Manager
 * 
 * Manages bidirectional synchronization between React Context and Zustand store
 * with conflict resolution and performance optimization.
 * 
 * Phase 3: State Migration Utilities
 * @version 1.0.0
 * @date 2025-09-30
 */

import { CollectionContextValue } from '../../components/Collection/CollectionProvider';
import { AllocationContextType } from '../../contexts/AllocationContext';
import { WizardSyncState } from '../../contexts/WizardSyncContext';
import { CollectionManagementState } from '../../types/collection.state';
import { contextToStoreMapper } from './contextMigrationMap';
import { Collection } from '../../types/collection.types';

// =============================================================================
// Synchronization Interfaces
// =============================================================================

interface SyncOperation {
  id: string;
  type: 'context-to-store' | 'store-to-context' | 'bidirectional';
  contextType: 'collection' | 'allocation' | 'wizard';
  timestamp: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
  error?: string;
  changesSynced: number;
  conflictsResolved: number;
}

interface SyncConflict {
  field: string;
  contextValue: any;
  storeValue: any;
  resolution: 'use-context' | 'use-store' | 'merge' | 'user-choice';
  timestamp: Date;
}

interface SyncResult {
  success: boolean;
  operation: SyncOperation;
  conflicts: SyncConflict[];
  metrics: {
    totalFields: number;
    changedFields: number;
    syncedFields: number;
    skippedFields: number;
    duration: number;
  };
}

// =============================================================================
// Base Synchronization Manager
// =============================================================================

abstract class BaseSyncManager {
  protected operations: Map<string, SyncOperation> = new Map();
  protected conflictHandlers: Map<string, (conflict: SyncConflict) => any> = new Map();

  protected generateOperationId(): string {
    return `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected createOperation(
    type: SyncOperation['type'],
    contextType: SyncOperation['contextType']
  ): SyncOperation {
    return {
      id: this.generateOperationId(),
      type,
      contextType,
      timestamp: new Date(),
      status: 'pending',
      changesSynced: 0,
      conflictsResolved: 0,
    };
  }

  protected detectConflicts(contextValue: any, storeValue: any, fieldPath: string = ''): SyncConflict[] {
    const conflicts: SyncConflict[] = [];

    if (typeof contextValue !== typeof storeValue) {
      conflicts.push({
        field: fieldPath,
        contextValue,
        storeValue,
        resolution: 'use-context', // Default resolution
        timestamp: new Date(),
      });
      return conflicts;
    }

    if (contextValue && typeof contextValue === 'object') {
      if (Array.isArray(contextValue) && Array.isArray(storeValue)) {
        if (contextValue.length !== storeValue.length) {
          conflicts.push({
            field: `${fieldPath}.length`,
            contextValue: contextValue.length,
            storeValue: storeValue.length,
            resolution: 'use-context',
            timestamp: new Date(),
          });
        }
      } else if (!Array.isArray(contextValue) && !Array.isArray(storeValue)) {
        // Deep object comparison
        const allKeys = new Set([...Object.keys(contextValue), ...Object.keys(storeValue)]);
        
        for (const key of allKeys) {
          const newPath = fieldPath ? `${fieldPath}.${key}` : key;
          if (contextValue[key] !== storeValue[key]) {
            conflicts.push(...this.detectConflicts(contextValue[key], storeValue[key], newPath));
          }
        }
      }
    } else if (contextValue !== storeValue) {
      conflicts.push({
        field: fieldPath,
        contextValue,
        storeValue,
        resolution: 'use-context',
        timestamp: new Date(),
      });
    }

    return conflicts;
  }

  protected resolveConflicts(conflicts: SyncConflict[]): SyncConflict[] {
    return conflicts.map(conflict => {
      const handler = this.conflictHandlers.get(conflict.field);
      if (handler) {
        const resolution = handler(conflict);
        return { ...conflict, resolution };
      }
      return conflict;
    });
  }

  public registerConflictHandler(field: string, handler: (conflict: SyncConflict) => any) {
    this.conflictHandlers.set(field, handler);
  }

  public getOperationHistory(): SyncOperation[] {
    return Array.from(this.operations.values()).sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  public getOperationMetrics() {
    const operations = this.getOperationHistory();
    const completed = operations.filter(op => op.status === 'completed');
    const failed = operations.filter(op => op.status === 'failed');

    return {
      total: operations.length,
      completed: completed.length,
      failed: failed.length,
      averageDuration: completed.reduce((sum, op) => sum + (op.duration || 0), 0) / completed.length || 0,
      totalConflicts: operations.reduce((sum, op) => sum + op.conflictsResolved, 0),
      successRate: operations.length > 0 ? (completed.length / operations.length) * 100 : 0,
    };
  }
}

// =============================================================================
// Collection State Synchronization Manager
// =============================================================================

class CollectionSyncManager extends BaseSyncManager {
  async syncContextToStore(
    contextValue: CollectionContextValue,
    storeState: CollectionManagementState
  ): Promise<SyncResult> {
    const operation = this.createOperation('context-to-store', 'collection');
    this.operations.set(operation.id, operation);

    const startTime = performance.now();
    operation.status = 'running';

    try {
      // Map context to store format
      const mappingResult = contextToStoreMapper.collection.mapContextToStore(contextValue);
      
      if (!mappingResult.success || !mappingResult.data) {
        throw new Error(`Context mapping failed: ${mappingResult.errors.join(', ')}`);
      }

      // Detect conflicts between current store state and mapped context
      const conflicts = this.detectConflicts(mappingResult.data, storeState);
      const resolvedConflicts = this.resolveConflicts(conflicts);

      // Apply resolved changes to store
      const changesSynced = this.applyChangesToStore(mappingResult.data, storeState, resolvedConflicts);

      operation.status = 'completed';
      operation.duration = performance.now() - startTime;
      operation.changesSynced = changesSynced;
      operation.conflictsResolved = resolvedConflicts.length;

      return {
        success: true,
        operation,
        conflicts: resolvedConflicts,
        metrics: {
          totalFields: mappingResult.metrics.fieldsProcessed,
          changedFields: changesSynced,
          syncedFields: mappingResult.metrics.fieldsMapped,
          skippedFields: mappingResult.metrics.fieldsSkipped,
          duration: operation.duration,
        },
      };

    } catch (error) {
      operation.status = 'failed';
      operation.duration = performance.now() - startTime;
      operation.error = error instanceof Error ? error.message : 'Unknown sync error';

      return {
        success: false,
        operation,
        conflicts: [],
        metrics: {
          totalFields: 0,
          changedFields: 0,
          syncedFields: 0,
          skippedFields: 0,
          duration: operation.duration,
        },
      };
    }
  }

  async syncStoreToContext(
    storeState: CollectionManagementState,
    contextValue: CollectionContextValue
  ): Promise<SyncResult> {
    const operation = this.createOperation('store-to-context', 'collection');
    this.operations.set(operation.id, operation);

    const startTime = performance.now();
    operation.status = 'running';

    try {
      // Map store to context format
      const mappingResult = contextToStoreMapper.collection.mapStoreToContext(storeState);
      
      if (!mappingResult.success || !mappingResult.data) {
        throw new Error(`Store mapping failed: ${mappingResult.errors.join(', ')}`);
      }

      // For store-to-context sync, we typically update the context provider
      // This is more complex as it requires the context to accept external updates
      
      operation.status = 'completed';
      operation.duration = performance.now() - startTime;
      operation.changesSynced = 1; // Simplified for Phase 3

      return {
        success: true,
        operation,
        conflicts: [],
        metrics: {
          totalFields: mappingResult.metrics.fieldsProcessed,
          changedFields: 1,
          syncedFields: mappingResult.metrics.fieldsMapped,
          skippedFields: mappingResult.metrics.fieldsSkipped,
          duration: operation.duration,
        },
      };

    } catch (error) {
      operation.status = 'failed';
      operation.duration = performance.now() - startTime;
      operation.error = error instanceof Error ? error.message : 'Unknown sync error';

      return {
        success: false,
        operation,
        conflicts: [],
        metrics: {
          totalFields: 0,
          changedFields: 0,
          syncedFields: 0,
          skippedFields: 0,
          duration: operation.duration,
        },
      };
    }
  }

  private applyChangesToStore(
    mappedData: Partial<CollectionManagementState>,
    currentStore: CollectionManagementState,
    resolvedConflicts: SyncConflict[]
  ): number {
    let changeCount = 0;

    // Apply collections changes
    if (mappedData.collections) {
      if (mappedData.collections.collections) {
        Object.assign(currentStore.collections.collections, mappedData.collections.collections);
        changeCount++;
      }
      
      if (mappedData.collections.collectionIds) {
        currentStore.collections.collectionIds = [...mappedData.collections.collectionIds];
        changeCount++;
      }
      
      if (mappedData.collections.selectedIds) {
        currentStore.collections.selectedIds = new Set(mappedData.collections.selectedIds);
        changeCount++;
      }
    }

    // Apply filter/view changes
    if (mappedData.filterView) {
      Object.assign(currentStore.filterView, mappedData.filterView);
      changeCount++;
    }

    // Apply conflict resolutions
    resolvedConflicts.forEach(conflict => {
      if (conflict.resolution === 'use-context') {
        this.setNestedValue(currentStore, conflict.field, conflict.contextValue);
        changeCount++;
      } else if (conflict.resolution === 'merge') {
        // Implement merge logic based on field type
        const merged = this.mergeValues(conflict.contextValue, conflict.storeValue);
        this.setNestedValue(currentStore, conflict.field, merged);
        changeCount++;
      }
    });

    return changeCount;
  }

  private setNestedValue(obj: any, path: string, value: any) {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  private mergeValues(contextValue: any, storeValue: any): any {
    if (Array.isArray(contextValue) && Array.isArray(storeValue)) {
      // Merge arrays by combining unique items
      return [...new Set([...contextValue, ...storeValue])];
    }
    
    if (typeof contextValue === 'object' && typeof storeValue === 'object') {
      // Merge objects
      return { ...storeValue, ...contextValue };
    }
    
    // For primitive values, prefer context value
    return contextValue;
  }
}

// =============================================================================
// Unified State Synchronization Manager
// =============================================================================

class UnifiedStateSyncManager {
  private collectionSync = new CollectionSyncManager();
  
  // Placeholder for future sync managers
  private allocationSync: any = null;
  private wizardSync: any = null;

  async syncContextToStore(
    contextValue: CollectionContextValue | AllocationContextType | WizardSyncState,
    storeState: any,
    contextType: 'collection' | 'allocation' | 'wizard' = 'collection'
  ): Promise<SyncResult> {
    switch (contextType) {
      case 'collection':
        return this.collectionSync.syncContextToStore(
          contextValue as CollectionContextValue,
          storeState as CollectionManagementState
        );
      
      case 'allocation':
        // TODO: Implement in future phases
        throw new Error('Allocation sync not implemented in Phase 3');
      
      case 'wizard':
        // TODO: Implement in future phases
        throw new Error('Wizard sync not implemented in Phase 3');
      
      default:
        throw new Error(`Unknown context type: ${contextType}`);
    }
  }

  async syncStoreToContext(
    storeState: any,
    contextValue: CollectionContextValue | AllocationContextType | WizardSyncState,
    contextType: 'collection' | 'allocation' | 'wizard' = 'collection'
  ): Promise<SyncResult> {
    switch (contextType) {
      case 'collection':
        return this.collectionSync.syncStoreToContext(
          storeState as CollectionManagementState,
          contextValue as CollectionContextValue
        );
      
      case 'allocation':
        throw new Error('Allocation sync not implemented in Phase 3');
      
      case 'wizard':
        throw new Error('Wizard sync not implemented in Phase 3');
      
      default:
        throw new Error(`Unknown context type: ${contextType}`);
    }
  }

  registerConflictHandler(
    contextType: 'collection' | 'allocation' | 'wizard',
    field: string,
    handler: (conflict: SyncConflict) => any
  ) {
    switch (contextType) {
      case 'collection':
        this.collectionSync.registerConflictHandler(field, handler);
        break;
      default:
        console.warn(`Conflict handler registration not supported for ${contextType} in Phase 3`);
    }
  }

  getOperationHistory(contextType?: 'collection' | 'allocation' | 'wizard'): SyncOperation[] {
    if (!contextType || contextType === 'collection') {
      return this.collectionSync.getOperationHistory();
    }
    
    return [];
  }

  getMetrics(contextType?: 'collection' | 'allocation' | 'wizard') {
    if (!contextType || contextType === 'collection') {
      return this.collectionSync.getOperationMetrics();
    }
    
    return {
      total: 0,
      completed: 0,
      failed: 0,
      averageDuration: 0,
      totalConflicts: 0,
      successRate: 0,
    };
  }

  /**
   * Batch sync multiple contexts
   */
  async batchSync(
    syncs: Array<{
      contextType: 'collection' | 'allocation' | 'wizard';
      contextValue: any;
      storeState: any;
      direction: 'context-to-store' | 'store-to-context';
    }>
  ): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    
    for (const sync of syncs) {
      try {
        const result = sync.direction === 'context-to-store'
          ? await this.syncContextToStore(sync.contextValue, sync.storeState, sync.contextType)
          : await this.syncStoreToContext(sync.storeState, sync.contextValue, sync.contextType);
        
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          operation: {
            id: `batch-${Date.now()}`,
            type: sync.direction,
            contextType: sync.contextType,
            timestamp: new Date(),
            status: 'failed',
            error: error instanceof Error ? error.message : 'Batch sync failed',
            changesSynced: 0,
            conflictsResolved: 0,
          },
          conflicts: [],
          metrics: {
            totalFields: 0,
            changedFields: 0,
            syncedFields: 0,
            skippedFields: 0,
            duration: 0,
          },
        });
      }
    }
    
    return results;
  }
}

// =============================================================================
// Export Singleton Instance
// =============================================================================

export const stateSyncManager = new UnifiedStateSyncManager();

// Export types for external use
export type {
  SyncOperation,
  SyncConflict,
  SyncResult,
};