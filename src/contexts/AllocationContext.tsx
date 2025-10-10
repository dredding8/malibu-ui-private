import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import {
  CollectionOpportunity,
  OpportunityChange,
  BatchUpdateResponse,
  ValidationError,
  CapacityThresholds,
  Site,
  CollectionDeck
} from '../types/collectionOpportunities';
import { OpportunityHealth, calculateBatchHealth } from '../utils/opportunityHealth';
import { AllocationChange } from '../components/ReallocationWorkspace';
import { Pass } from '../types/collectionOpportunities';

// Context state interface
interface AllocationState {
  // Core data
  opportunities: CollectionOpportunity[];
  availableSites: Site[];
  collectionDecks: CollectionDeck[];
  availablePasses: Map<string, Pass[]>; // satelliteId -> passes
  
  // Health tracking
  healthScores: Map<string, OpportunityHealth>;
  capacityThresholds: CapacityThresholds;
  
  // Change tracking
  pendingChanges: Map<string, OpportunityChange>;
  allocationChanges: Map<string, AllocationChange[]>; // opportunityId -> changes
  
  // UI state
  activeWorkspaceId?: string;
  quickEditId?: string;
  isSyncing?: boolean;
  
  // Operation state
  isLoading: boolean;
  isSaving: boolean;
  errors: ValidationError[];
  lastSync: Date | null;
  
  // History tracking
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
  
  // Real-time state
  webSocketConnected: boolean;
  realtimeUpdates: Map<string, Date>; // opportunityId -> lastUpdate
}

interface HistoryEntry {
  timestamp: Date;
  action: string;
  changes: Map<string, any>;
  description: string;
}

// Action types
type AllocationAction =
  | { type: 'SET_OPPORTUNITIES'; payload: CollectionOpportunity[] }
  | { type: 'SET_SITES'; payload: Site[] }
  | { type: 'SET_COLLECTION_DECKS'; payload: CollectionDeck[] }
  | { type: 'SET_PASSES'; payload: { satelliteId: string; passes: Pass[] } }
  | { type: 'UPDATE_HEALTH_SCORES'; payload: Map<string, OpportunityHealth> }
  | { type: 'UPDATE_OPPORTUNITY'; payload: { id: string; changes: Partial<CollectionOpportunity> } }
  | { type: 'BATCH_UPDATE_OPPORTUNITIES'; payload: OpportunityChange[] }
  | { type: 'ADD_ALLOCATION_CHANGE'; payload: { opportunityId: string; change: AllocationChange } }
  | { type: 'CLEAR_ALLOCATION_CHANGES'; payload: string }
  | { type: 'SET_ACTIVE_WORKSPACE'; payload: string | undefined }
  | { type: 'SET_QUICK_EDIT'; payload: string | undefined }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_ERRORS'; payload: ValidationError[] }
  | { type: 'ADD_ERROR'; payload: ValidationError }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_WEBSOCKET_STATUS'; payload: boolean }
  | { type: 'UPDATE_REALTIME'; payload: { opportunityId: string; timestamp: Date } }
  | { type: 'PUSH_HISTORY'; payload: HistoryEntry }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'COMMIT_CHANGES'; payload: string[] }
  | { type: 'ROLLBACK_CHANGES'; payload: string[] }
  | { type: 'SET_CAPACITY_THRESHOLDS'; payload: CapacityThresholds }
  | { type: 'SYNC_COMPLETE'; payload: Date };

// Reducer
const allocationReducer = (state: AllocationState, action: AllocationAction): AllocationState => {
  switch (action.type) {
    case 'SET_OPPORTUNITIES':
      return {
        ...state,
        opportunities: action.payload,
        lastSync: new Date()
      };

    case 'SET_SITES':
      return {
        ...state,
        availableSites: action.payload
      };

    case 'SET_PASSES': {
      const newPasses = new Map(state.availablePasses);
      newPasses.set(action.payload.satelliteId, action.payload.passes);
      return {
        ...state,
        availablePasses: newPasses
      };
    }

    case 'UPDATE_HEALTH_SCORES':
      return {
        ...state,
        healthScores: action.payload
      };

    case 'UPDATE_OPPORTUNITY': {
      const { id, changes } = action.payload;
      const opportunities = state.opportunities.map(opp =>
        opp.id === id ? { ...opp, ...changes } : opp
      );

      const change: OpportunityChange = {
        opportunityId: id,
        changes,
        timestamp: new Date().toISOString(),
        previousValues: state.opportunities.find(o => o.id === id)
      };

      const pendingChanges = new Map(state.pendingChanges);
      pendingChanges.set(id, change);

      // Push to history
      const historyEntry: HistoryEntry = {
        timestamp: new Date(),
        action: 'UPDATE_OPPORTUNITY',
        changes: new Map([[id, changes]]),
        description: `Updated opportunity ${id}`
      };

      return {
        ...state,
        opportunities,
        pendingChanges,
        undoStack: [...state.undoStack, historyEntry],
        redoStack: [] // Clear redo stack on new action
      };
    }

    case 'BATCH_UPDATE_OPPORTUNITIES': {
      let opportunities = [...state.opportunities];
      const pendingChanges = new Map(state.pendingChanges);

      action.payload.forEach(change => {
        opportunities = opportunities.map(opp =>
          opp.id === change.opportunityId
            ? { ...opp, ...change.changes }
            : opp
        );
        pendingChanges.set(change.opportunityId, change);
      });

      return {
        ...state,
        opportunities,
        pendingChanges
      };
    }

    case 'ADD_ALLOCATION_CHANGE': {
      const { opportunityId, change } = action.payload;
      const currentChanges = state.allocationChanges.get(opportunityId) || [];
      const allocationChanges = new Map(state.allocationChanges);
      allocationChanges.set(opportunityId, [...currentChanges, change]);

      return {
        ...state,
        allocationChanges
      };
    }

    case 'CLEAR_ALLOCATION_CHANGES': {
      const allocationChanges = new Map(state.allocationChanges);
      allocationChanges.delete(action.payload);
      return {
        ...state,
        allocationChanges
      };
    }

    case 'SET_ACTIVE_WORKSPACE':
      return {
        ...state,
        activeWorkspaceId: action.payload
      };

    case 'SET_QUICK_EDIT':
      return {
        ...state,
        quickEditId: action.payload
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };

    case 'SET_SAVING':
      return {
        ...state,
        isSaving: action.payload
      };

    case 'SET_ERRORS':
      return {
        ...state,
        errors: action.payload
      };

    case 'ADD_ERROR':
      return {
        ...state,
        errors: [...state.errors, action.payload]
      };

    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: []
      };

    case 'SET_WEBSOCKET_STATUS':
      return {
        ...state,
        webSocketConnected: action.payload
      };

    case 'UPDATE_REALTIME': {
      const realtimeUpdates = new Map(state.realtimeUpdates);
      realtimeUpdates.set(action.payload.opportunityId, action.payload.timestamp);
      return {
        ...state,
        realtimeUpdates
      };
    }

    case 'PUSH_HISTORY':
      return {
        ...state,
        undoStack: [...state.undoStack, action.payload],
        redoStack: []
      };

    case 'UNDO': {
      if (state.undoStack.length === 0) return state;
      
      const lastAction = state.undoStack[state.undoStack.length - 1];
      const undoStack = state.undoStack.slice(0, -1);
      const redoStack = [...state.redoStack, lastAction];
      
      // Apply undo logic based on action type
      // This is simplified - real implementation would reverse the specific changes
      
      return {
        ...state,
        undoStack,
        redoStack
      };
    }

    case 'REDO': {
      if (state.redoStack.length === 0) return state;
      
      const nextAction = state.redoStack[state.redoStack.length - 1];
      const redoStack = state.redoStack.slice(0, -1);
      const undoStack = [...state.undoStack, nextAction];
      
      // Apply redo logic based on action type
      
      return {
        ...state,
        undoStack,
        redoStack
      };
    }

    case 'COMMIT_CHANGES': {
      const committedIds = new Set(action.payload);
      const pendingChanges = new Map(state.pendingChanges);
      const allocationChanges = new Map(state.allocationChanges);
      
      committedIds.forEach(id => {
        pendingChanges.delete(id);
        allocationChanges.delete(id);
      });

      return {
        ...state,
        pendingChanges,
        allocationChanges,
        lastSync: new Date()
      };
    }

    case 'ROLLBACK_CHANGES': {
      const rollbackIds = new Set(action.payload);
      const pendingChanges = new Map(state.pendingChanges);
      const allocationChanges = new Map(state.allocationChanges);
      
      // Restore original values
      const opportunities = state.opportunities.map(opp => {
        if (rollbackIds.has(opp.id)) {
          const pendingChange = pendingChanges.get(opp.id);
          if (pendingChange?.previousValues) {
            return pendingChange.previousValues as CollectionOpportunity;
          }
        }
        return opp;
      });
      
      // Clear pending changes
      rollbackIds.forEach(id => {
        pendingChanges.delete(id);
        allocationChanges.delete(id);
      });

      return {
        ...state,
        opportunities,
        pendingChanges,
        allocationChanges
      };
    }

    case 'SET_CAPACITY_THRESHOLDS':
      return {
        ...state,
        capacityThresholds: action.payload
      };

    case 'SYNC_COMPLETE':
      return {
        ...state,
        lastSync: action.payload
      };

    default:
      return state;
  }
};

// Context creation
interface AllocationContextType {
  state: AllocationState;
  dispatch: React.Dispatch<AllocationAction>;
  
  // Helper methods
  updateOpportunity: (id: string, changes: Partial<CollectionOpportunity>) => void;
  batchUpdateOpportunities: (changes: CollectionOpportunity[]) => Promise<void>;
  addAllocationChange: (opportunityId: string, change: AllocationChange) => void;
  openWorkspace: (opportunityId: string) => void;
  closeWorkspace: () => void;
  openQuickEdit: (opportunityId: string) => void;
  closeQuickEdit: () => void;
  commitChanges: () => Promise<void>;
  rollbackChanges: (opportunityIds?: string[]) => void;
  refreshHealthScores: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Data access helpers
  opportunities: CollectionOpportunity[];
  sites: Site[];
  collectionDecks: CollectionDeck[];
  getOpportunityById: (id: string) => CollectionOpportunity | undefined;
  getCollectionDeckById: (id: string) => CollectionDeck | undefined;
  getSiteById: (id: string) => Site | undefined;
  isLoading: boolean;
}

const AllocationContext = createContext<AllocationContextType | undefined>(undefined);

// Provider component
interface AllocationProviderProps {
  children: ReactNode;
  initialOpportunities?: CollectionOpportunity[];
  initialSites?: Site[];
  initialCollectionDecks?: CollectionDeck[];
  capacityThresholds?: CapacityThresholds;
  enableRealTimeUpdates?: boolean;
  onBatchUpdate?: (changes: OpportunityChange[]) => Promise<BatchUpdateResponse>;
}

export const AllocationProvider: React.FC<AllocationProviderProps> = ({
  children,
  initialOpportunities = [],
  initialSites = [],
  initialCollectionDecks = [],
  capacityThresholds = { critical: 10, warning: 30, optimal: 70 },
  enableRealTimeUpdates = true,
  onBatchUpdate
}) => {
  const initialState: AllocationState = {
    opportunities: initialOpportunities,
    availableSites: initialSites,
    collectionDecks: initialCollectionDecks,
    availablePasses: new Map(),
    healthScores: new Map(),
    capacityThresholds,
    pendingChanges: new Map(),
    allocationChanges: new Map(),
    isLoading: false,
    isSaving: false,
    errors: [],
    lastSync: null,
    undoStack: [],
    redoStack: [],
    webSocketConnected: false,
    realtimeUpdates: new Map()
  };

  const [state, dispatch] = useReducer(allocationReducer, initialState);

  // Calculate health scores when opportunities change
  // Use ref to track if we've already calculated health scores to prevent infinite loops
  const healthScoresCalculated = React.useRef(false);
  const lastOpportunitiesLength = React.useRef(0);

  useEffect(() => {
    // Skip if we've already calculated health scores and opportunities haven't changed
    if (healthScoresCalculated.current && state.opportunities.length === lastOpportunitiesLength.current) {
      return;
    }

    // Only calculate health scores once on mount or when opportunities actually change
    if (!healthScoresCalculated.current || state.opportunities.length !== lastOpportunitiesLength.current) {
      lastOpportunitiesLength.current = state.opportunities.length;
      healthScoresCalculated.current = true;

      const healthScores = calculateBatchHealth(state.opportunities, state.capacityThresholds);
      dispatch({ type: 'UPDATE_HEALTH_SCORES', payload: healthScores });
    }
  }, [state.opportunities.length, state.capacityThresholds]);

  // Helper methods
  const updateOpportunity = useCallback((id: string, changes: Partial<CollectionOpportunity>) => {
    dispatch({ type: 'UPDATE_OPPORTUNITY', payload: { id, changes } });
  }, []);

  const batchUpdateOpportunities = useCallback(async (changes: CollectionOpportunity[]): Promise<void> => {
    dispatch({ type: 'SET_SAVING', payload: true });
    dispatch({ type: 'CLEAR_ERRORS' });

    try {
      // Update opportunities in state
      dispatch({ type: 'SET_OPPORTUNITIES', payload: changes });
      
      // If there's an external handler, call it
      if (onBatchUpdate) {
        // Convert to OpportunityChange format for the handler
        const opportunityChanges = changes.map(opp => ({
          opportunityId: opp.id,
          changes: opp,
          timestamp: new Date().toISOString()
        }));
        await onBatchUpdate(opportunityChanges);
      }
      
      // Clear pending changes for updated opportunities
      dispatch({ type: 'COMMIT_CHANGES', payload: changes.map(c => c.id) });
    } catch (error) {
      dispatch({ type: 'ADD_ERROR', payload: {
        opportunityId: '',
        field: 'general',
        message: error instanceof Error ? error.message : 'Unknown error',
        severity: 'error'
      }});
      throw error;
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [onBatchUpdate]);

  const addAllocationChange = useCallback((opportunityId: string, change: AllocationChange) => {
    dispatch({ type: 'ADD_ALLOCATION_CHANGE', payload: { opportunityId, change } });
  }, []);

  const openWorkspace = useCallback((opportunityId: string) => {
    dispatch({ type: 'SET_ACTIVE_WORKSPACE', payload: opportunityId });
  }, []);

  const closeWorkspace = useCallback(() => {
    dispatch({ type: 'SET_ACTIVE_WORKSPACE', payload: undefined });
  }, []);

  const openQuickEdit = useCallback((opportunityId: string) => {
    dispatch({ type: 'SET_QUICK_EDIT', payload: opportunityId });
  }, []);

  const closeQuickEdit = useCallback(() => {
    dispatch({ type: 'SET_QUICK_EDIT', payload: undefined });
  }, []);

  const commitChanges = useCallback(async () => {
    const changes = Array.from(state.pendingChanges.values());
    if (changes.length === 0) return;

    dispatch({ type: 'SET_SAVING', payload: true });
    try {
      // Convert changes to opportunities
      const updatedOpportunities = state.opportunities.map(opp => {
        const change = state.pendingChanges.get(opp.id);
        if (change) {
          return { ...opp, ...change.changes };
        }
        return opp;
      });
      
      if (onBatchUpdate) {
        await onBatchUpdate(changes);
      }
      
      dispatch({ type: 'COMMIT_CHANGES', payload: changes.map(c => c.opportunityId) });
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [state.pendingChanges, state.opportunities, onBatchUpdate]);

  const rollbackChanges = useCallback((opportunityIds?: string[]) => {
    const idsToRollback = opportunityIds || Array.from(state.pendingChanges.keys());
    dispatch({ type: 'ROLLBACK_CHANGES', payload: idsToRollback });
  }, [state.pendingChanges]);

  const refreshHealthScores = useCallback(() => {
    const healthScores = calculateBatchHealth(state.opportunities, state.capacityThresholds);
    dispatch({ type: 'UPDATE_HEALTH_SCORES', payload: healthScores });
  }, [state.opportunities, state.capacityThresholds]);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const canUndo = state.undoStack.length > 0;
  const canRedo = state.redoStack.length > 0;
  
  // Data access helpers
  const getOpportunityById = useCallback((id: string) => {
    return state.opportunities.find(opp => opp.id === id);
  }, [state.opportunities]);
  
  const getCollectionDeckById = useCallback((id: string) => {
    return state.collectionDecks.find(deck => deck.id === id);
  }, [state.collectionDecks]);
  
  const getSiteById = useCallback((id: string) => {
    return state.availableSites.find(site => site.id === id);
  }, [state.availableSites]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!enableRealTimeUpdates) return;

    // Simulated WebSocket connection
    const connectWebSocket = () => {
      // In real implementation, connect to WebSocket server
      dispatch({ type: 'SET_WEBSOCKET_STATUS', payload: true });
    };

    connectWebSocket();

    return () => {
      dispatch({ type: 'SET_WEBSOCKET_STATUS', payload: false });
    };
  }, [enableRealTimeUpdates]);

  const contextValue: AllocationContextType = {
    state,
    dispatch,
    updateOpportunity,
    batchUpdateOpportunities,
    addAllocationChange,
    openWorkspace,
    closeWorkspace,
    openQuickEdit,
    closeQuickEdit,
    commitChanges,
    rollbackChanges,
    refreshHealthScores,
    undo,
    redo,
    canUndo,
    canRedo,
    opportunities: state.opportunities,
    sites: state.availableSites,
    collectionDecks: state.collectionDecks,
    getOpportunityById,
    getCollectionDeckById,
    getSiteById,
    isLoading: state.isLoading
  };

  return (
    <AllocationContext.Provider value={contextValue}>
      {children}
    </AllocationContext.Provider>
  );
};

// Custom hook for using the context
export const useAllocationContext = () => {
  const context = useContext(AllocationContext);
  if (!context) {
    throw new Error('useAllocationContext must be used within an AllocationProvider');
  }
  return context;
};

// Selector hooks for optimized access
export const useOpportunities = () => {
  const { state } = useAllocationContext();
  return state.opportunities;
};

export const useHealthScore = (opportunityId: string) => {
  const { state } = useAllocationContext();
  return state.healthScores.get(opportunityId);
};

export const usePendingChanges = () => {
  const { state } = useAllocationContext();
  return state.pendingChanges;
};

export const useSelectedOpportunities = () => {
  const { state } = useAllocationContext();
  return state.selectedOpportunities;
};

export const useWorkspaceState = () => {
  const { state } = useAllocationContext();
  return {
    activeWorkspaceId: state.activeWorkspaceId,
    quickEditId: state.quickEditId
  };
};