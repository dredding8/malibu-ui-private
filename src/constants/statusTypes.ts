/**
 * Unified status types and mappings for collection decks across the application
 * 
 * UBIQUITOUS LANGUAGE MAPPING:
 * These status labels maintain consistency across all UI components:
 * - "Ready to View" - Collections that are complete and ready for user access
 * - "In Progress" - Collections actively being processed or optimized
 * - "Action Required" - Collections that need user intervention (errors/timeouts/failures)
 * - "Starting Soon" - Collections queued for processing
 * 
 * These labels are used consistently in:
 * - History page metric cards
 * - HistoryTable status columns
 * - Status filter dropdowns
 * - All user-facing status displays
 */

// Collection Deck Status - Simplified binary status model
export type CollectionDeckStatus = 
  | "complete" 
  | "in-progress";

// Algorithm Status - Used only in History page for processing details
export type AlgorithmStatus = 
  | "queued" 
  | "running" 
  | "optimizing" 
  | "converged" 
  | "error" 
  | "timeout";

// Status display mappings with user-friendly, empathetic language
export const COLLECTION_STATUS_LABELS: Record<CollectionDeckStatus, string> = {
  complete: "Complete",
  "in-progress": "In Progress"
};

// Algorithm Status labels - Keep original detailed labels for Matching status column
export const ALGORITHM_STATUS_LABELS: Record<AlgorithmStatus, string> = {
  queued: "Starting Soon",
  running: "Processing", 
  optimizing: "Optimizing",
  converged: "Completed",
  error: "Error",
  timeout: "Timed Out"
};

// Intent mappings for consistent UI styling
export const COLLECTION_STATUS_INTENTS: Record<CollectionDeckStatus, string> = {
  complete: "SUCCESS",
  "in-progress": "PRIMARY"
};

export const ALGORITHM_STATUS_INTENTS: Record<AlgorithmStatus, string> = {
  queued: "NONE",
  running: "PRIMARY",
  optimizing: "PRIMARY", 
  converged: "SUCCESS",
  error: "DANGER",
  timeout: "WARNING"
};

// Status resolution function - Maps algorithm status to simplified collection deck status
export const resolveCollectionStatus = (algorithmStatus: AlgorithmStatus): CollectionDeckStatus => {
  // Complete states: converged, completed
  if (algorithmStatus === 'converged') {
    return 'complete';
  }
  
  // All other states are considered "in-progress"
  // This includes: queued, running, optimizing, error, timeout
  return 'in-progress';
};

// Legacy status migration mappings - Updated for binary model
export const LEGACY_STATUS_MIGRATION: Record<string, CollectionDeckStatus> = {
  "In Progress": "in-progress",
  "Review": "in-progress",
  "Pending Approval": "in-progress",
  "Completed": "complete",
  "Initializing": "in-progress",
  "Processing": "in-progress",
  "Ready": "complete",
  "Failed": "in-progress",
  "Cancelled": "in-progress",
  // Legacy binary mappings
  "draft": "in-progress",
  "processing": "in-progress",
  "review": "in-progress",
  "ready": "complete",
  "failed": "in-progress",
  "cancelled": "in-progress"
};