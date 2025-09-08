/**
 * Unified status types and mappings for collection decks across the application
 */

// Collection Deck Status - Primary status used across both Collection Deck and History pages
export type CollectionDeckStatus = 
  | "draft" 
  | "processing" 
  | "review" 
  | "ready" 
  | "failed" 
  | "cancelled";

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
  draft: "Getting Started",
  processing: "Working on It", 
  review: "Almost There",
  ready: "Ready for You",
  failed: "Need Your Help",
  cancelled: "Stopped"
};

export const ALGORITHM_STATUS_LABELS: Record<AlgorithmStatus, string> = {
  queued: "Starting Soon",
  running: "Finding Matches", 
  optimizing: "Fine-tuning Results",
  converged: "All Set",
  error: "Something Went Wrong",
  timeout: "Taking Longer Than Expected"
};

// Intent mappings for consistent UI styling
export const COLLECTION_STATUS_INTENTS: Record<CollectionDeckStatus, string> = {
  draft: "NONE",
  processing: "PRIMARY",
  review: "WARNING", 
  ready: "SUCCESS",
  failed: "DANGER",
  cancelled: "WARNING"
};

export const ALGORITHM_STATUS_INTENTS: Record<AlgorithmStatus, string> = {
  queued: "NONE",
  running: "PRIMARY",
  optimizing: "PRIMARY", 
  converged: "SUCCESS",
  error: "DANGER",
  timeout: "WARNING"
};

// Legacy status migration mappings
export const LEGACY_STATUS_MIGRATION: Record<string, CollectionDeckStatus> = {
  "In Progress": "processing",
  "Review": "review",
  "Pending Approval": "review",
  "Completed": "ready",
  "Initializing": "processing",
  "Processing": "processing",
  "Ready": "ready",
  "Failed": "failed",
  "Cancelled": "cancelled"
};