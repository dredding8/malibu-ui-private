/**
 * Action Translator
 * 
 * Translates context actions to Zustand store actions with
 * parameter mapping and error handling.
 * 
 * Phase 3: Progressive Context Replacement
 * @version 1.0.0
 * @date 2025-09-30
 */

import { useCollectionStore } from '../../store/collectionStore';
import { CollectionContextValue } from '../../components/Collection/CollectionProvider';
import { Collection, CollectionFilter, CollectionSort, CollectionViewConfig } from '../../types/collection.types';

// =============================================================================
// Action Translation Interface
// =============================================================================

interface ActionTranslationResult<T = any> {
  success: boolean;
  result?: T;
  error?: string;
  translationTime: number;
  actionType: string;
  parameters: any[];
}

interface ActionTranslator {
  /** Translate context action to store action */
  translate<T = any>(
    actionName: string,
    parameters: any[],
    storeActions: any
  ): Promise<ActionTranslationResult<T>>;
  
  /** Check if action is translatable */
  canTranslate(actionName: string): boolean;
  
  /** Get translation mapping for action */
  getTranslationMapping(actionName: string): any;
}

// =============================================================================
// Collection Action Translator
// =============================================================================

class CollectionActionTranslator implements ActionTranslator {
  private translationMap: Record<string, any> = {
    // Data Management Actions
    createCollection: {
      storeAction: 'createCollection',
      parameterMapping: (data: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>) => [data],
      returnType: 'promise',
    },
    updateCollection: {
      storeAction: 'updateCollection', 
      parameterMapping: (id: string, updates: Partial<Collection>) => [id, updates],
      returnType: 'promise',
    },
    deleteCollection: {
      storeAction: 'deleteCollection',
      parameterMapping: (id: string, options?: any) => [id, options],
      returnType: 'promise',
    },
    duplicateCollection: {
      storeAction: 'duplicateCollection',
      parameterMapping: (sourceId: string, updates?: Partial<Collection>) => [sourceId, updates],
      returnType: 'promise',
    },
    refreshCollections: {
      storeAction: 'loadCollections',
      parameterMapping: () => [{ forceRefresh: true }],
      returnType: 'promise',
    },

    // Selection Management Actions
    selectCollection: {
      storeAction: 'selectCollections',
      parameterMapping: (id: string | string[], mode?: string) => {
        const ids = Array.isArray(id) ? id : [id];
        return [ids, mode || 'replace'];
      },
      returnType: 'void',
    },
    selectAll: {
      storeAction: 'selectAllCollections',
      parameterMapping: () => [true], // selectFiltered = true
      returnType: 'void',
    },
    clearSelection: {
      storeAction: 'clearSelection',
      parameterMapping: () => [],
      returnType: 'void',
    },
    toggleSelection: {
      storeAction: 'selectCollections',
      parameterMapping: (id: string) => [[id], 'toggle'],
      returnType: 'void',
    },

    // Filtering Actions
    setFilter: {
      storeAction: 'setFilter',
      parameterMapping: (filter: CollectionFilter) => [filter],
      returnType: 'void',
    },
    clearFilter: {
      storeAction: 'clearFilter',
      parameterMapping: () => [],
      returnType: 'void',
    },
    updateFilter: {
      storeAction: 'setFilter',
      parameterMapping: (updates: Partial<CollectionFilter>, currentFilter: CollectionFilter) => {
        return [{ ...currentFilter, ...updates }];
      },
      returnType: 'void',
    },

    // Sorting Actions
    setSort: {
      storeAction: 'setSort',
      parameterMapping: (sort: CollectionSort) => [sort],
      returnType: 'void',
    },
    toggleSort: {
      storeAction: 'setSort',
      parameterMapping: (field: string, currentSort: CollectionSort) => {
        const direction = currentSort.field === field && currentSort.direction === 'asc' ? 'desc' : 'asc';
        return [{ field, direction }];
      },
      returnType: 'void',
    },
    clearSort: {
      storeAction: 'setSort',
      parameterMapping: () => [{ field: 'updatedAt', direction: 'desc' }],
      returnType: 'void',
    },

    // View Management Actions
    setViewConfig: {
      storeAction: 'setViewConfig',
      parameterMapping: (config: Partial<CollectionViewConfig>) => [config, true], // saveToPreferences = true
      returnType: 'void',
    },
    changeViewMode: {
      storeAction: 'setViewConfig',
      parameterMapping: (mode: CollectionViewConfig['mode']) => [{ mode }],
      returnType: 'void',
    },
    changeDensity: {
      storeAction: 'setViewConfig',
      parameterMapping: (density: CollectionViewConfig['density']) => [{ density }],
      returnType: 'void',
    },

    // Bulk Operations
    startBulkOperation: {
      storeAction: 'startBulkOperation',
      parameterMapping: (action: string, options: any = {}, selectedIds: Set<string>) => {
        return [{
          type: action,
          targets: Array.from(selectedIds),
          params: options,
          requiresConfirmation: options.requiresConfirmation ?? true,
        }];
      },
      returnType: 'promise',
    },
    cancelBulkOperation: {
      storeAction: 'cancelBulkOperation',
      parameterMapping: (operationId?: string) => {
        // Note: Context doesn't track operation IDs, so we'll need to get the current one
        return [operationId || 'current'];
      },
      returnType: 'void',
    },

    // Utility Actions (these might need special handling)
    getCollection: {
      storeAction: 'collections.collections',
      parameterMapping: (id: string) => [id],
      returnType: 'selector',
      isUtility: true,
    },
    isSelected: {
      storeAction: 'collections.selectedIds',
      parameterMapping: (id: string) => [id],
      returnType: 'selector',
      isUtility: true,
    },
    getCountInfo: {
      storeAction: 'getCountInfo',
      parameterMapping: () => [],
      returnType: 'function',
      isUtility: true,
    },
  };

  async translate<T = any>(
    actionName: string,
    parameters: any[],
    storeActions: any
  ): Promise<ActionTranslationResult<T>> {
    const startTime = performance.now();
    
    try {
      const mapping = this.translationMap[actionName];
      
      if (!mapping) {
        return {
          success: false,
          error: `No translation mapping found for action: ${actionName}`,
          translationTime: performance.now() - startTime,
          actionType: actionName,
          parameters,
        };
      }

      // Handle utility actions differently
      if (mapping.isUtility) {
        return this.handleUtilityAction(actionName, parameters, storeActions, mapping, startTime);
      }

      // Get the store action
      const storeAction = storeActions[mapping.storeAction];
      if (!storeAction) {
        return {
          success: false,
          error: `Store action not found: ${mapping.storeAction}`,
          translationTime: performance.now() - startTime,
          actionType: actionName,
          parameters,
        };
      }

      // Map parameters
      const mappedParameters = mapping.parameterMapping(...parameters);
      
      // Execute the action
      let result: T;
      if (mapping.returnType === 'promise') {
        result = await storeAction(...mappedParameters);
      } else {
        result = storeAction(...mappedParameters);
      }

      return {
        success: true,
        result,
        translationTime: performance.now() - startTime,
        actionType: actionName,
        parameters: mappedParameters,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown translation error',
        translationTime: performance.now() - startTime,
        actionType: actionName,
        parameters,
      };
    }
  }

  private async handleUtilityAction<T>(
    actionName: string,
    parameters: any[],
    storeActions: any,
    mapping: any,
    startTime: number
  ): Promise<ActionTranslationResult<T>> {
    try {
      let result: T;

      switch (actionName) {
        case 'getCollection': {
          const [id] = parameters;
          const store = useCollectionStore.getState();
          result = store.collections.collections[id] as T;
          break;
        }
        
        case 'isSelected': {
          const [id] = parameters;
          const store = useCollectionStore.getState();
          result = store.collections.selectedIds.has(id) as T;
          break;
        }
        
        case 'getCountInfo': {
          const store = useCollectionStore.getState();
          result = {
            total: store.collections.collectionIds.length,
            filtered: store.collections.collectionIds.length, // TODO: Apply actual filtering
            selected: store.collections.selectedIds.size,
          } as T;
          break;
        }
        
        default:
          throw new Error(`Unhandled utility action: ${actionName}`);
      }

      return {
        success: true,
        result,
        translationTime: performance.now() - startTime,
        actionType: actionName,
        parameters,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Utility action failed',
        translationTime: performance.now() - startTime,
        actionType: actionName,
        parameters,
      };
    }
  }

  canTranslate(actionName: string): boolean {
    return actionName in this.translationMap;
  }

  getTranslationMapping(actionName: string) {
    return this.translationMap[actionName] || null;
  }
}

// =============================================================================
// Action Translator Factory
// =============================================================================

class ActionTranslatorFactory {
  private translators: Map<string, ActionTranslator> = new Map();

  constructor() {
    this.translators.set('collection', new CollectionActionTranslator());
    // TODO: Add allocation and wizard translators in future phases
  }

  getTranslator(contextType: 'collection' | 'allocation' | 'wizard'): ActionTranslator | null {
    return this.translators.get(contextType) || null;
  }

  async translateAction<T = any>(
    contextType: 'collection' | 'allocation' | 'wizard',
    actionName: string,
    parameters: any[],
    storeActions: any
  ): Promise<ActionTranslationResult<T>> {
    const translator = this.getTranslator(contextType);
    
    if (!translator) {
      return {
        success: false,
        error: `No translator found for context type: ${contextType}`,
        translationTime: 0,
        actionType: actionName,
        parameters,
      };
    }

    return translator.translate<T>(actionName, parameters, storeActions);
  }

  getAvailableActions(contextType: 'collection' | 'allocation' | 'wizard'): string[] {
    const translator = this.getTranslator(contextType);
    if (!translator) return [];

    // For CollectionActionTranslator, return the keys of translationMap
    if (contextType === 'collection') {
      const collectionTranslator = translator as CollectionActionTranslator;
      return Object.keys((collectionTranslator as any).translationMap);
    }

    return [];
  }
}

// =============================================================================
// Action Wrapper Generator
// =============================================================================

interface ActionWrapperOptions {
  enableErrorHandling: boolean;
  enablePerformanceTracking: boolean;
  enableLogging: boolean;
  fallbackToContext: boolean;
}

class ActionWrapperGenerator {
  /**
   * Generate wrapped actions that can use either context or store
   */
  generateWrappedActions(
    contextActions: Partial<CollectionContextValue>,
    storeActions: any,
    translator: ActionTranslator,
    options: ActionWrapperOptions = {
      enableErrorHandling: true,
      enablePerformanceTracking: true,
      enableLogging: false,
      fallbackToContext: true,
    }
  ): Partial<CollectionContextValue> {
    const wrappedActions: Partial<CollectionContextValue> = {};

    // Wrap each action
    Object.keys(contextActions).forEach(actionName => {
      const contextAction = (contextActions as any)[actionName];
      
      if (typeof contextAction === 'function') {
        (wrappedActions as any)[actionName] = async (...args: any[]) => {
          const startTime = performance.now();
          
          try {
            // Try to translate and use store action
            if (translator.canTranslate(actionName)) {
              const result = await translator.translate(actionName, args, storeActions);
              
              if (result.success) {
                if (options.enableLogging) {
                  console.log(`[ActionTranslator] ${actionName} completed via store`, result);
                }
                return result.result;
              } else if (options.fallbackToContext) {
                if (options.enableLogging) {
                  console.warn(`[ActionTranslator] ${actionName} failed, falling back to context:`, result.error);
                }
                return contextAction(...args);
              } else {
                throw new Error(result.error);
              }
            } else if (options.fallbackToContext) {
              // Use context action directly
              if (options.enableLogging) {
                console.log(`[ActionTranslator] ${actionName} using context (no translation available)`);
              }
              return contextAction(...args);
            } else {
              throw new Error(`Action ${actionName} not translatable and fallback disabled`);
            }

          } catch (error) {
            if (options.enableErrorHandling) {
              console.error(`[ActionTranslator] Error in ${actionName}:`, error);
              
              if (options.fallbackToContext && contextAction) {
                try {
                  return contextAction(...args);
                } catch (fallbackError) {
                  console.error(`[ActionTranslator] Fallback also failed for ${actionName}:`, fallbackError);
                  throw fallbackError;
                }
              }
            }
            throw error;
          } finally {
            if (options.enablePerformanceTracking) {
              const duration = performance.now() - startTime;
              console.log(`[ActionTranslator] ${actionName} took ${duration.toFixed(2)}ms`);
            }
          }
        };
      } else {
        // Non-function properties (data, state, etc.)
        (wrappedActions as any)[actionName] = contextAction;
      }
    });

    return wrappedActions;
  }
}

// =============================================================================
// Export Singleton Instance
// =============================================================================

export const actionTranslator = {
  factory: new ActionTranslatorFactory(),
  wrapperGenerator: new ActionWrapperGenerator(),

  /**
   * Translate a single action
   */
  async translateAction<T = any>(
    contextType: 'collection' | 'allocation' | 'wizard',
    actionName: string,
    parameters: any[],
    storeActions: any
  ): Promise<ActionTranslationResult<T>> {
    return this.factory.translateAction<T>(contextType, actionName, parameters, storeActions);
  },

  /**
   * Generate wrapped actions for a context
   */
  wrapActions(
    contextType: 'collection' | 'allocation' | 'wizard',
    contextActions: any,
    storeActions: any,
    options?: Partial<ActionWrapperOptions>
  ): any {
    const translator = this.factory.getTranslator(contextType);
    if (!translator) {
      throw new Error(`No translator available for ${contextType}`);
    }

    return this.wrapperGenerator.generateWrappedActions(
      contextActions,
      storeActions,
      translator,
      {
        enableErrorHandling: true,
        enablePerformanceTracking: true,
        enableLogging: false,
        fallbackToContext: true,
        ...options,
      }
    );
  },

  /**
   * Get available actions for a context type
   */
  getAvailableActions(contextType: 'collection' | 'allocation' | 'wizard'): string[] {
    return this.factory.getAvailableActions(contextType);
  },

  /**
   * Check if an action can be translated
   */
  canTranslateAction(
    contextType: 'collection' | 'allocation' | 'wizard',
    actionName: string
  ): boolean {
    const translator = this.factory.getTranslator(contextType);
    return translator ? translator.canTranslate(actionName) : false;
  },
};