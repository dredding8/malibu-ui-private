/**
 * Unified Editor Hook
 *
 * Shared logic for managing editor state across all modes (quick, standard, override).
 * Consolidates duplicate state management from QuickEditModal, EditOpportunityModal,
 * AllocationEditorPanel, OverrideModal, and ManualOverrideModalRefactored.
 */

import { useReducer, useCallback, useEffect, useMemo } from 'react';
import {
  EditorState,
  EditorAction,
  EditorMode,
  ModeDetectionCriteria,
  EditorValidationResult,
} from '../types/unifiedEditor';
import { CollectionOpportunity, Site, DayOfWeekCode } from '../types/collectionOpportunities';
import { validateOpportunity } from '../utils/opportunityValidation';
import {
  detectOverride,
  describeOverride,
  isJustificationRequired,
} from '../utils/overrideDetection';

/**
 * Initial editor state factory
 */
const createInitialState = (
  opportunity: CollectionOpportunity,
  enableUndoRedo: boolean = false
): EditorState => ({
  opportunity: { ...opportunity },
  originalOpportunity: { ...opportunity },
  selectedSiteIds: opportunity.allocatedSites?.map(s => s.id) || [],
  justification: opportunity.changeJustification || '',
  specialInstructions: '',
  classificationLevel: opportunity.classificationLevel || 'UNCLASSIFIED',
  isDirty: false,
  validationErrors: new Map(),
  isSaving: false,
  ...(enableUndoRedo && {
    history: {
      past: [],
      present: {},
      future: [],
    },
  }),
});

/**
 * Editor state reducer
 */
const editorReducer = (state: EditorState, action: EditorAction): EditorState => {
  switch (action.type) {
    case 'SET_SITES': {
      const newOpportunity = {
        ...state.opportunity,
        allocatedSites: action.payload.map(id =>
          state.originalOpportunity.allocatedSites?.find(s => s.id === id)
        ).filter(Boolean) as Site[],
      };

      return {
        ...state,
        opportunity: newOpportunity,
        selectedSiteIds: action.payload,
        isDirty: true,
      };
    }

    case 'SET_PRIORITY':
      return {
        ...state,
        opportunity: {
          ...state.opportunity,
          priority: action.payload,
        },
        isDirty: true,
      };

    case 'SET_JUSTIFICATION':
      return {
        ...state,
        justification: action.payload,
        isDirty: true,
      };

    case 'SET_SPECIAL_INSTRUCTIONS':
      return {
        ...state,
        specialInstructions: action.payload,
        isDirty: true,
      };

    case 'SET_CLASSIFICATION':
      return {
        ...state,
        classificationLevel: action.payload,
        isDirty: true,
      };

    case 'SET_TIME_DISTRIBUTION':
      return {
        ...state,
        opportunity: {
          ...state.opportunity,
          timeDistribution: action.payload,
        },
        isDirty: true,
      };

    case 'SET_VALIDATION_ERROR': {
      const newErrors = new Map(state.validationErrors);
      newErrors.set(action.payload.field, action.payload.message);
      return {
        ...state,
        validationErrors: newErrors,
      };
    }

    case 'CLEAR_VALIDATION_ERROR': {
      const newErrors = new Map(state.validationErrors);
      newErrors.delete(action.payload);
      return {
        ...state,
        validationErrors: newErrors,
      };
    }

    case 'CLEAR_ALL_ERRORS':
      return {
        ...state,
        validationErrors: new Map(),
      };

    case 'MARK_SAVING':
      return {
        ...state,
        isSaving: action.payload,
      };

    case 'RESET':
      return createInitialState(state.originalOpportunity, !!state.history);

    case 'UNDO':
      if (!state.history || state.history.past.length === 0) {
        return state;
      }
      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, -1);
      return {
        ...state,
        opportunity: { ...state.opportunity, ...previous },
        history: {
          past: newPast,
          present: state.history.present,
          future: [state.history.present, ...state.history.future],
        },
      };

    case 'REDO':
      if (!state.history || state.history.future.length === 0) {
        return state;
      }
      const next = state.history.future[0];
      const newFuture = state.history.future.slice(1);
      return {
        ...state,
        opportunity: { ...state.opportunity, ...next },
        history: {
          past: [...state.history.past, state.history.present],
          present: next,
          future: newFuture,
        },
      };

    default:
      return state;
  }
};

/**
 * Auto-detect optimal editor mode based on editing context
 */
export const detectEditorMode = (
  opportunity: CollectionOpportunity,
  criteria?: Partial<ModeDetectionCriteria>
): EditorMode => {
  // Calculate complexity score
  let complexityScore = 0;

  // Factor 1: Number of sites (more sites = more complex)
  const siteCount = opportunity.allocatedSites?.length || 0;
  complexityScore += Math.min(siteCount / 5, 0.3); // Max 0.3 for site count

  // Factor 2: Has conflicts or issues
  const hasIssues = (opportunity.conflicts?.length || 0) > 0 ||
                    (opportunity.dataIntegrityIssues?.length || 0) > 0;
  if (hasIssues) complexityScore += 0.3;

  // Factor 3: Override or manual changes
  const isOverride = !!opportunity.overrideJustification || criteria?.isOverride;
  if (isOverride) complexityScore += 0.4;

  // Factor 4: Batch operations needed
  if (criteria?.needsBatchOps) complexityScore += 0.2;

  // Determine mode based on complexity
  if (complexityScore >= 0.7 || criteria?.isOverride) {
    return 'override'; // Complex workflow with tabs
  } else if (complexityScore >= 0.3 || criteria?.requiresJustification) {
    return 'standard'; // Moderate complexity
  } else {
    return 'quick'; // Simple, fast edits
  }
};

/**
 * Main hook for unified editor
 */
export const useUnifiedEditor = (
  opportunity: CollectionOpportunity,
  availableSites: Site[],
  options: {
    mode?: EditorMode;
    enableUndoRedo?: boolean;
    enableRealTimeValidation?: boolean;
    capacityThresholds?: {
      critical: number;
      warning: number;
      optimal: number;
    };
  } = {}
) => {
  const {
    mode: forcedMode,
    enableUndoRedo = false,
    enableRealTimeValidation = true,
    capacityThresholds = { critical: 10, warning: 30, optimal: 70 },
  } = options;

  // Initialize state
  const [state, dispatch] = useReducer(
    editorReducer,
    createInitialState(opportunity, enableUndoRedo)
  );

  // Auto-detect mode if not forced
  const detectedMode = useMemo(
    () => forcedMode || detectEditorMode(opportunity),
    [opportunity, forcedMode]
  );

  // Validate current state
  const validationResult = useMemo((): EditorValidationResult => {
    const errors = new Map<string, string>();
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validate site selection
    if (state.selectedSiteIds.length === 0) {
      errors.set('sites', 'At least one site must be selected');
    }

    // Validate justification for non-baseline changes
    const hasChanges = state.isDirty &&
      JSON.stringify(state.opportunity) !== JSON.stringify(state.originalOpportunity);
    if (hasChanges && state.opportunity.matchStatus !== 'baseline' && !state.justification.trim()) {
      errors.set('justification', 'Justification required for non-baseline allocations');
    }

    // Use existing validation utility
    const opportunityValidation = validateOpportunity(state.opportunity, capacityThresholds);
    opportunityValidation.forEach(error => {
      if (error.severity === 'error') {
        errors.set(error.field, error.message);
      } else {
        warnings.push(error.message);
      }
    });

    // Add suggestions based on state
    if (state.opportunity.matchStatus === 'suboptimal' &&
        state.opportunity.alternativeOptions?.length) {
      suggestions.push(`Consider ${state.opportunity.alternativeOptions.length} alternative site(s) for better quality`);
    }

    return {
      isValid: errors.size === 0,
      errors,
      warnings,
      suggestions,
    };
  }, [state, capacityThresholds]);

  // Update validation errors in state when real-time validation enabled
  useEffect(() => {
    if (enableRealTimeValidation) {
      // Clear old errors
      dispatch({ type: 'CLEAR_ALL_ERRORS' });

      // Set new errors
      validationResult.errors.forEach((message, field) => {
        dispatch({ type: 'SET_VALIDATION_ERROR', payload: { field, message } });
      });
    }
  }, [validationResult, enableRealTimeValidation]);

  // Action creators
  const setSites = useCallback((siteIds: string[]) => {
    dispatch({ type: 'SET_SITES', payload: siteIds });
  }, []);

  const setPriority = useCallback((priority: CollectionOpportunity['priority']) => {
    dispatch({ type: 'SET_PRIORITY', payload: priority });
  }, []);

  const setJustification = useCallback((justification: string) => {
    dispatch({ type: 'SET_JUSTIFICATION', payload: justification });
  }, []);

  const setSpecialInstructions = useCallback((instructions: string) => {
    dispatch({ type: 'SET_SPECIAL_INSTRUCTIONS', payload: instructions });
  }, []);

  const setClassification = useCallback((level: string) => {
    dispatch({ type: 'SET_CLASSIFICATION', payload: level });
  }, []);

  const setTimeDistribution = useCallback((days: DayOfWeekCode[]) => {
    dispatch({ type: 'SET_TIME_DISTRIBUTION', payload: days });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const canUndo = useMemo(
    () => enableUndoRedo && state.history && state.history.past.length > 0,
    [enableUndoRedo, state.history]
  );

  const canRedo = useMemo(
    () => enableUndoRedo && state.history && state.history.future.length > 0,
    [enableUndoRedo, state.history]
  );

  // WEEK 1: Override detection
  const isOverride = useMemo(() => {
    return detectOverride(
      state.opportunity.allocatedSites,
      state.originalOpportunity.systemRecommendedSites
    );
  }, [state.opportunity.allocatedSites, state.originalOpportunity.systemRecommendedSites]);

  const overrideDescription = useMemo(() => {
    return describeOverride(
      state.opportunity.allocatedSites,
      state.originalOpportunity.systemRecommendedSites
    );
  }, [state.opportunity.allocatedSites, state.originalOpportunity.systemRecommendedSites]);

  const requiresJustification = useMemo(() => {
    return isJustificationRequired(isOverride, state.justification);
  }, [isOverride, state.justification]);

  return {
    // State
    state,
    mode: detectedMode,
    validation: validationResult,

    // Actions
    setSites,
    setPriority,
    setJustification,
    setSpecialInstructions,
    setClassification,
    setTimeDistribution,
    reset,
    undo,
    redo,

    // Computed
    canUndo,
    canRedo,
    hasChanges: state.isDirty,
    isValid: validationResult.isValid,

    // WEEK 1: Override detection state
    isOverride,
    overrideDescription,
    requiresJustification,

    // Raw dispatch for advanced usage
    dispatch,
  };
};
