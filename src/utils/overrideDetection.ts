/**
 * Override Detection Utilities
 *
 * Detects when user selections deviate from system recommendations,
 * triggering mandatory justification and impact acknowledgment workflows.
 *
 * PRIORITY: TIER 1 - CRITICAL
 * Part of Week 1 implementation: Override detection + forced justification
 */

import { Site, SiteId } from '../types/collectionOpportunities';

/**
 * Detects if current site selection differs from system recommendation
 *
 * @param currentSites - Sites currently selected by user
 * @param recommendedSites - Sites recommended by system as optimal
 * @returns true if user is overriding system recommendation
 *
 * @example
 * const isOverriding = detectOverride(
 *   [{ id: 'SC', ... }, { id: 'ALT', ... }],
 *   [{ id: 'DG', ... }, { id: 'SC', ... }]
 * ); // returns true (ALT replaces DG)
 */
export function detectOverride(
  currentSites: ReadonlyArray<Site> | null | undefined,
  recommendedSites: ReadonlyArray<Site> | null | undefined
): boolean {
  // If no recommendation exists, cannot determine override
  if (!recommendedSites || recommendedSites.length === 0) {
    return false;
  }

  // If no current selection, not an override (just empty)
  if (!currentSites || currentSites.length === 0) {
    return false;
  }

  // Create sets of site IDs for comparison
  const currentSiteIds = new Set(currentSites.map(s => s.id));
  const recommendedSiteIds = new Set(recommendedSites.map(s => s.id));

  // Different number of sites = override
  if (currentSiteIds.size !== recommendedSiteIds.size) {
    return true;
  }

  // Check if all current sites are in recommended sites
  for (const siteId of currentSiteIds) {
    if (!recommendedSiteIds.has(siteId)) {
      return true; // Found a site that's not in recommendations
    }
  }

  // All sites match recommendation
  return false;
}

/**
 * Describes what changed between recommendation and current selection
 *
 * @param currentSites - Sites currently selected by user
 * @param recommendedSites - Sites recommended by system as optimal
 * @returns Human-readable description of override
 *
 * @example
 * describeOverride(
 *   [{ id: 'SC', name: 'Site C' }, { id: 'ALT', name: 'Alternative' }],
 *   [{ id: 'DG', name: 'Site DG' }, { id: 'SC', name: 'Site C' }]
 * );
 * // Returns: "Removed: Site DG; Added: Alternative"
 */
export function describeOverride(
  currentSites: ReadonlyArray<Site> | null | undefined,
  recommendedSites: ReadonlyArray<Site> | null | undefined
): string | null {
  if (!detectOverride(currentSites, recommendedSites)) {
    return null; // No override
  }

  if (!recommendedSites || !currentSites) {
    return null;
  }

  const currentSiteIds = new Set(currentSites.map(s => s.id));
  const recommendedSiteIds = new Set(recommendedSites.map(s => s.id));

  // Find removed sites
  const removedSites = recommendedSites.filter(
    site => !currentSiteIds.has(site.id)
  );

  // Find added sites
  const addedSites = currentSites.filter(
    site => !recommendedSiteIds.has(site.id)
  );

  const parts: string[] = [];

  if (removedSites.length > 0) {
    const names = removedSites.map(s => s.name).join(', ');
    parts.push(`Removed: ${names}`);
  }

  if (addedSites.length > 0) {
    const names = addedSites.map(s => s.name).join(', ');
    parts.push(`Added: ${names}`);
  }

  return parts.join('; ');
}

/**
 * Checks if justification is required based on override status
 *
 * @param isOverride - Whether user is overriding system recommendation
 * @param justification - Current justification text
 * @param minLength - Minimum required justification length (default: 50)
 * @returns true if justification is required but missing/invalid
 */
export function isJustificationRequired(
  isOverride: boolean,
  justification: string | null | undefined,
  minLength: number = 50
): boolean {
  if (!isOverride) {
    return false; // No justification needed if following recommendation
  }

  // Override detected - justification is mandatory
  const trimmed = (justification || '').trim();
  return trimmed.length < minLength;
}

/**
 * Validates justification text meets requirements
 *
 * @param justification - Justification text to validate
 * @param minLength - Minimum required length
 * @returns Validation result with error message if invalid
 */
export function validateJustification(
  justification: string | null | undefined,
  minLength: number = 50
): { valid: boolean; error?: string } {
  const trimmed = (justification || '').trim();

  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Justification is required when overriding system recommendations',
    };
  }

  if (trimmed.length < minLength) {
    return {
      valid: false,
      error: `Justification must be at least ${minLength} characters (currently ${trimmed.length})`,
    };
  }

  return { valid: true };
}
