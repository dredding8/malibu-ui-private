/**
 * Match Types and Interfaces for Collection Deck Management
 * Defines match statuses, match notes, and related types for space object matching
 */

import { Intent } from '@blueprintjs/core';

/**
 * Match Status Types
 * Indicates the quality of the match between a space object and sensors
 */
export type MatchStatus = 
  | 'optimal'      // Best possible match with full sensor coverage
  | 'suboptimal'   // Match with limitations due to capacity constraints
  | 'baseline'     // Minimum acceptable match with significant constraints
  | 'no-match';    // Object could not be matched to any sensor

/**
 * Match Note Category
 * Categorizes the reason for suboptimal or no matches
 */
export type MatchNoteCategory = 
  | 'capacity-limited'    // Sensor capacity constraints prevented optimal match
  | 'not-observable'      // Object not visible to any available sensor
  | 'partial-coverage'    // Limited observation windows available
  | 'resource-conflict';  // Competing priority prevented match

/**
 * Match Note Interface
 * Provides detailed information about match quality and issues
 */
export interface MatchNote {
  category: MatchNoteCategory;
  message: string;
  details?: string;
  affectedSensors?: string[];
}

/**
 * Match Information Interface
 * Complete match information for a collection deck item
 */
export interface MatchInformation {
  status: MatchStatus;
  notes?: MatchNote[];
  matchPercentage?: number;
  lastEvaluated?: string;
}

/**
 * Get intent mapping for match status
 * Maps match status to Blueprint.js Intent for consistent styling
 */
export const getMatchStatusIntent = (status: MatchStatus): Intent => {
  switch (status) {
    case 'optimal':
      return Intent.SUCCESS;
    case 'suboptimal':
    case 'baseline':
      return Intent.WARNING;
    case 'no-match':
      return Intent.DANGER;
    default:
      return Intent.NONE;
  }
};

/**
 * Get display label for match status
 */
export const getMatchStatusLabel = (status: MatchStatus): string => {
  switch (status) {
    case 'optimal':
      return 'Optimal';
    case 'suboptimal':
      return 'Suboptimal';
    case 'baseline':
      return 'Baseline';
    case 'no-match':
      return 'No Match';
    default:
      return 'Unknown';
  }
};

/**
 * Get display message for match note category
 */
export const getMatchNoteCategoryMessage = (category: MatchNoteCategory): string => {
  switch (category) {
    case 'capacity-limited':
      return 'Sensor capacity limited';
    case 'not-observable':
      return 'Not observable';
    case 'partial-coverage':
      return 'Partial coverage only';
    case 'resource-conflict':
      return 'Resource conflict';
    default:
      return 'Unknown issue';
  }
};

/**
 * Format match notes for display
 * Combines multiple notes into a concise, actionable message
 */
export const formatMatchNotes = (notes: MatchNote[]): string => {
  if (notes.length === 0) return '';
  
  // Priority order for display
  const priorityOrder: MatchNoteCategory[] = [
    'not-observable',
    'capacity-limited', 
    'resource-conflict',
    'partial-coverage'
  ];
  
  // Sort notes by priority
  const sortedNotes = notes.sort((a, b) => {
    const aPriority = priorityOrder.indexOf(a.category);
    const bPriority = priorityOrder.indexOf(b.category);
    return aPriority - bPriority;
  });
  
  // Return the highest priority note message
  return sortedNotes[0].message;
};

/**
 * Check if match needs user attention
 */
export const matchNeedsAttention = (status: MatchStatus): boolean => {
  return status === 'suboptimal' || status === 'baseline' || status === 'no-match';
};