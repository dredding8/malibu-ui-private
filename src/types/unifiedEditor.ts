/**
 * Unified Opportunity Editor Types
 *
 * Shared types for the consolidated editing experience across
 * Quick Edit, Standard Edit, and Override modes.
 */

import { CollectionOpportunity, Site, Pass, DayOfWeekCode } from './collectionOpportunities';

/**
 * Editor presentation modes
 */
export type EditorMode = 'quick' | 'standard' | 'override';

/**
 * Editor presentation style
 */
export type EditorPresentation = 'drawer' | 'dialog' | 'fullscreen';

/**
 * Editor complexity level - auto-detected or user-specified
 */
export type EditorComplexity = 'simple' | 'moderate' | 'complex';

/**
 * Props for the Unified Opportunity Editor
 */
export interface UnifiedEditorProps {
  /** The opportunity being edited */
  opportunity: CollectionOpportunity;

  /** Available sites for allocation */
  availableSites: Site[];

  /** Available passes (for override mode) */
  availablePasses?: Pass[];

  /** Editor mode - auto-selected or manual override */
  mode?: EditorMode;

  /** Whether editor is open */
  isOpen: boolean;

  /** Callback when editor is closed */
  onClose: () => void;

  /** Callback when changes are saved */
  onSave: (opportunityId: string, changes: Partial<CollectionOpportunity>) => Promise<void>;

  /** Optional: Save and continue to next opportunity */
  onSaveAndNext?: (opportunityId: string, changes: Partial<CollectionOpportunity>) => Promise<void>;

  /** Capacity thresholds for validation */
  capacityThresholds?: {
    critical: number;
    warning: number;
    optimal: number;
  };

  /** Enable real-time validation */
  enableRealTimeValidation?: boolean;

  /** Show undo/redo controls (override mode only) */
  enableUndoRedo?: boolean;

  /** Enable batch operations (override mode only) */
  enableBatchOperations?: boolean;
}

/**
 * Editor state for state management
 */
export interface EditorState {
  /** Current opportunity being edited */
  opportunity: CollectionOpportunity;

  /** Original opportunity for comparison */
  originalOpportunity: CollectionOpportunity;

  /** Selected site IDs */
  selectedSiteIds: string[];

  /** Justification text */
  justification: string;

  /** Special instructions */
  specialInstructions: string;

  /** Classification level */
  classificationLevel: string;

  /** Whether changes have been made */
  isDirty: boolean;

  /** Validation errors */
  validationErrors: Map<string, string>;

  /** Saving state */
  isSaving: boolean;

  /** Undo/redo history (override mode) */
  history?: {
    past: Partial<CollectionOpportunity>[];
    present: Partial<CollectionOpportunity>;
    future: Partial<CollectionOpportunity>[];
  };
}

/**
 * Editor actions for reducer
 */
export type EditorAction =
  | { type: 'SET_SITES'; payload: string[] }
  | { type: 'SET_PRIORITY'; payload: CollectionOpportunity['priority'] }
  | { type: 'SET_JUSTIFICATION'; payload: string }
  | { type: 'SET_SPECIAL_INSTRUCTIONS'; payload: string }
  | { type: 'SET_CLASSIFICATION'; payload: string }
  | { type: 'SET_TIME_DISTRIBUTION'; payload: DayOfWeekCode[] }
  | { type: 'SET_VALIDATION_ERROR'; payload: { field: string; message: string } }
  | { type: 'CLEAR_VALIDATION_ERROR'; payload: string }
  | { type: 'CLEAR_ALL_ERRORS' }
  | { type: 'MARK_SAVING'; payload: boolean }
  | { type: 'RESET' }
  | { type: 'UNDO' }
  | { type: 'REDO' };

/**
 * Mode detection criteria
 */
export interface ModeDetectionCriteria {
  /** Number of fields being edited */
  fieldCount: number;

  /** Whether justification is required */
  requiresJustification: boolean;

  /** Whether batch operations are needed */
  needsBatchOps: boolean;

  /** Whether override workflow is needed */
  isOverride: boolean;

  /** Complexity score (0-1) */
  complexityScore: number;
}

/**
 * Progressive disclosure configuration
 */
export interface ProgressiveDisclosureConfig {
  /** Fields always visible */
  alwaysVisible: string[];

  /** Fields conditionally visible */
  conditionallyVisible: {
    field: string;
    condition: (state: EditorState) => boolean;
  }[];

  /** Fields in advanced section (collapsed by default) */
  advancedFields: string[];
}

/**
 * Editor validation result
 */
export interface EditorValidationResult {
  /** Whether validation passed */
  isValid: boolean;

  /** Validation errors by field */
  errors: Map<string, string>;

  /** Warning messages */
  warnings: string[];

  /** Suggested improvements */
  suggestions: string[];
}
