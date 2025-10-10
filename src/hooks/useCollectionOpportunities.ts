/**
 * Custom hook for Collection Opportunities management
 * Handles API integration, real-time updates, and state management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CollectionOpportunity,
  OpportunityChange,
  BatchUpdateRequest,
  BatchUpdateResponse,
  ValidationError,
  CapacityThresholds,
} from '../types/collectionOpportunities';

interface UseCollectionOpportunitiesOptions {
  collectionId: string;
  enableRealTimeUpdates?: boolean;
  pollingInterval?: number;
  capacityThresholds?: CapacityThresholds;
}

interface UseCollectionOpportunitiesReturn {
  opportunities: CollectionOpportunity[];
  loading: boolean;
  error: Error | null;
  pendingChanges: Map<string, OpportunityChange>;
  validationErrors: ValidationError[];
  isCommitting: boolean;
  updateOpportunity: (id: string, changes: Partial<CollectionOpportunity>) => void;
  batchUpdate: (changes: OpportunityChange[]) => Promise<BatchUpdateResponse>;
  refresh: () => Promise<void>;
  clearChanges: () => void;
  undoChange: (opportunityId: string) => void;
}

export const useCollectionOpportunities = ({
  collectionId,
  enableRealTimeUpdates = true,
  pollingInterval = 30000, // 30 seconds
  capacityThresholds = { critical: 10, warning: 30, optimal: 70 },
}: UseCollectionOpportunitiesOptions): UseCollectionOpportunitiesReturn => {
  const [opportunities, setOpportunities] = useState<CollectionOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Map<string, OpportunityChange>>(new Map());
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isCommitting, setIsCommitting] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch opportunities from API
  const fetchOpportunities = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/collections/${collectionId}/opportunities?includeStatus=true&includeMetrics=true`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch opportunities: ${response.statusText}`);
      }

      const data: CollectionOpportunity[] = await response.json();
      setOpportunities(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching opportunities:', err);
    } finally {
      setLoading(false);
    }
  }, [collectionId]);

  // Update a single opportunity locally
  const updateOpportunity = useCallback((
    opportunityId: string,
    changes: Partial<CollectionOpportunity>
  ) => {
    // Update local state
    setOpportunities(current =>
      current.map(opp =>
        opp.id === opportunityId
          ? { ...opp, ...changes, lastModified: new Date().toISOString() }
          : opp
      )
    );

    // Track the change
    const change: OpportunityChange = {
      opportunityId,
      changes,
      timestamp: new Date().toISOString(),
      previousValues: opportunities.find(o => o.id === opportunityId),
    };

    setPendingChanges(current => {
      const updated = new Map(current);
      updated.set(opportunityId, change);
      return updated;
    });
  }, [opportunities]);

  // Batch update opportunities
  const batchUpdate = useCallback(async (
    changes: OpportunityChange[]
  ): Promise<BatchUpdateResponse> => {
    setIsCommitting(true);
    setValidationErrors([]);

    try {
      const request: BatchUpdateRequest = {
        changes,
        validateOnly: false,
      };

      const response = await fetch(
        `/api/collections/${collectionId}/opportunities/batch`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        }
      );

      const result: BatchUpdateResponse = await response.json();

      if (!response.ok || !result.success) {
        setValidationErrors(result.failures || []);
        throw new Error('Batch update failed');
      }

      // Clear pending changes for successful updates
      setPendingChanges(current => {
        const updated = new Map(current);
        result.updated.forEach(id => updated.delete(id));
        return updated;
      });

      // Refresh data to get latest state
      await fetchOpportunities();

      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsCommitting(false);
    }
  }, [collectionId, fetchOpportunities]);

  // Clear all pending changes
  const clearChanges = useCallback(() => {
    setPendingChanges(new Map());
    setValidationErrors([]);
    // Restore original data
    fetchOpportunities();
  }, [fetchOpportunities]);

  // Undo a single change
  const undoChange = useCallback((opportunityId: string) => {
    setPendingChanges(current => {
      const updated = new Map(current);
      updated.delete(opportunityId);
      return updated;
    });
    
    // Restore original value for this opportunity
    fetchOpportunities();
  }, [fetchOpportunities]);

  // Setup WebSocket connection for real-time updates
  useEffect(() => {
    if (!enableRealTimeUpdates) return;

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(`ws://api/collections/${collectionId}/subscribe`);
        
        ws.onopen = () => {
          console.log('WebSocket connected for collection opportunities');
        };

        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'opportunity.updated':
              setOpportunities(current =>
                current.map(opp =>
                  opp.id === message.data.id ? message.data : opp
                )
              );
              break;
              
            case 'capacity.changed':
              // Update capacity for affected opportunities
              setOpportunities(current =>
                current.map(opp => {
                  if (opp.satellite.id === message.data.satelliteId) {
                    return {
                      ...opp,
                      satellite: {
                        ...opp.satellite,
                        currentLoad: message.data.currentLoad,
                      },
                    };
                  }
                  return opp;
                })
              );
              break;
              
            case 'conflict.detected':
              // Update conflicts for affected opportunities
              setOpportunities(current =>
                current.map(opp => {
                  if (message.data.opportunityIds.includes(opp.id)) {
                    return {
                      ...opp,
                      conflicts: [...(opp.conflicts || []), message.data.conflict],
                    };
                  }
                  return opp;
                })
              );
              break;
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          // Attempt to reconnect after 5 seconds
          setTimeout(connectWebSocket, 5000);
        };

        wsRef.current = ws;
      } catch (err) {
        console.error('Failed to connect WebSocket:', err);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [collectionId, enableRealTimeUpdates]);

  // Setup polling as fallback
  useEffect(() => {
    if (enableRealTimeUpdates && wsRef.current) return; // Use WebSocket if available

    // Initial fetch
    fetchOpportunities();

    // Setup polling
    pollingRef.current = setInterval(fetchOpportunities, pollingInterval);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [fetchOpportunities, pollingInterval, enableRealTimeUpdates]);

  // Initial load
  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  return {
    opportunities,
    loading,
    error,
    pendingChanges,
    validationErrors,
    isCommitting,
    updateOpportunity,
    batchUpdate,
    refresh: fetchOpportunities,
    clearChanges,
    undoChange,
  };
};

// Additional hook for opportunity validation
export const useOpportunityValidation = (
  opportunity: CollectionOpportunity,
  thresholds: CapacityThresholds
) => {
  const [isValid, setIsValid] = useState(true);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  useEffect(() => {
    const validateOpportunity = async () => {
      try {
        const response = await fetch('/api/opportunities/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ opportunity, thresholds }),
        });

        const result = await response.json();
        setIsValid(result.isValid);
        setErrors(result.errors || []);
      } catch (err) {
        console.error('Validation error:', err);
        setIsValid(false);
      }
    };

    validateOpportunity();
  }, [opportunity, thresholds]);

  return { isValid, errors };
};