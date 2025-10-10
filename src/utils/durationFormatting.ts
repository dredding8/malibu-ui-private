/**
 * Duration Formatting Utilities
 *
 * Formats pass duration with threshold-based display (>5m, >9m)
 * to support rapid pass assessment (Week 3).
 *
 * PRIORITY: TIER 1 - CRITICAL
 * Part of Week 3 implementation: Duration display
 */

import { Pass } from '../types/collectionOpportunities';
import { Intent } from '@blueprintjs/core';

/**
 * Duration thresholds for pass suitability
 */
export const DURATION_THRESHOLDS = {
  PREFERRED: 9, // >= 9 minutes is preferred
  MINIMUM: 5,   // >= 5 minutes is minimum viable
} as const;

/**
 * Calculates pass duration in minutes
 *
 * @param pass - Pass with start/end time
 * @returns Duration in minutes
 */
export function getPassDuration(pass: Pass): number {
  const start = new Date(pass.startTime);
  const end = new Date(pass.endTime);
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

/**
 * Formats duration with threshold-based display
 *
 * @param durationMinutes - Duration in minutes
 * @returns Formatted string ("> 9m", "> 5m", or exact minutes)
 *
 * @example
 * formatDurationThreshold(10) // => "> 9m" (preferred)
 * formatDurationThreshold(7)  // => "> 5m" (minimum viable)
 * formatDurationThreshold(3)  // => "3m" (too short)
 */
export function formatDurationThreshold(durationMinutes: number): string {
  if (durationMinutes >= DURATION_THRESHOLDS.PREFERRED) {
    return `> ${DURATION_THRESHOLDS.PREFERRED}m`;
  }
  if (durationMinutes >= DURATION_THRESHOLDS.MINIMUM) {
    return `> ${DURATION_THRESHOLDS.MINIMUM}m`;
  }
  return `${Math.round(durationMinutes)}m`;
}

/**
 * Gets visual intent for duration based on thresholds
 *
 * @param durationMinutes - Duration in minutes
 * @returns Blueprint Intent for visual styling
 */
export function getDurationIntent(durationMinutes: number): Intent {
  if (durationMinutes >= DURATION_THRESHOLDS.PREFERRED) {
    return Intent.SUCCESS; // Green - preferred
  }
  if (durationMinutes >= DURATION_THRESHOLDS.MINIMUM) {
    return Intent.WARNING; // Yellow - acceptable
  }
  return Intent.DANGER; // Red - too short
}

/**
 * Checks if pass duration meets minimum threshold
 *
 * @param pass - Pass to check
 * @returns true if duration >= minimum threshold
 */
export function meetsMinimumDuration(pass: Pass): boolean {
  const duration = getPassDuration(pass);
  return duration >= DURATION_THRESHOLDS.MINIMUM;
}

/**
 * Checks if pass duration meets preferred threshold
 *
 * @param pass - Pass to check
 * @returns true if duration >= preferred threshold
 */
export function meetsPreferredDuration(pass: Pass): boolean {
  const duration = getPassDuration(pass);
  return duration >= DURATION_THRESHOLDS.PREFERRED;
}

/**
 * Gets duration category for filtering
 *
 * @param durationMinutes - Duration in minutes
 * @returns Category: 'preferred' | 'acceptable' | 'too-short'
 */
export function getDurationCategory(
  durationMinutes: number
): 'preferred' | 'acceptable' | 'too-short' {
  if (durationMinutes >= DURATION_THRESHOLDS.PREFERRED) {
    return 'preferred';
  }
  if (durationMinutes >= DURATION_THRESHOLDS.MINIMUM) {
    return 'acceptable';
  }
  return 'too-short';
}
