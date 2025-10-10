/**
 * Impact Calculation Utilities
 *
 * Calculates the impact of allocation changes on capacity, quality, and operations.
 * Used in forced impact warning gate (Week 2).
 *
 * PRIORITY: TIER 1 - CRITICAL
 * Part of Week 2 implementation: Impact warning + forced acknowledgment
 */

import { CollectionOpportunity, Site } from '../types/collectionOpportunities';

/**
 * Impact data structure for allocation changes
 */
export interface AllocationImpact {
  /** Whether this change affects capacity */
  affectsCapacity: boolean;

  /** Capacity changes by site */
  capacityChanges: Array<{
    siteId: string;
    siteName: string;
    capacityBefore: number;
    capacityAfter: number;
    percentageBefore: number;
    percentageAfter: number;
    delta: number;
  }>;

  /** Quality impact (if changing from optimal to baseline/suboptimal) */
  qualityImpact?: {
    before: number;
    after: number;
    delta: number;
  };

  /** Overall risk level */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';

  /** Human-readable impact summary */
  summary: string;

  /** Detailed warnings */
  warnings: string[];
}

/**
 * Calculates impact of changing site allocation
 *
 * @param currentSites - Sites currently allocated
 * @param proposedSites - Sites user wants to allocate
 * @param availableSites - All available sites with capacity data
 * @returns Impact analysis
 *
 * @example
 * const impact = calculateAllocationImpact(
 *   [{ id: 'DG', capacity: 100, allocated: 9 }],
 *   [{ id: 'ALT', capacity: 8, allocated: 0 }],
 *   allSites
 * );
 * // Returns impact showing DG freed, ALT consumed
 */
export function calculateAllocationImpact(
  currentSites: ReadonlyArray<Site> | null | undefined,
  proposedSites: ReadonlyArray<Site> | null | undefined,
  availableSites: ReadonlyArray<Site>
): AllocationImpact {
  const capacityChanges: AllocationImpact['capacityChanges'] = [];
  const warnings: string[] = [];
  let affectsCapacity = false;
  let maxRiskLevel: AllocationImpact['riskLevel'] = 'low';

  // Handle null/undefined cases
  const current = currentSites || [];
  const proposed = proposedSites || [];

  // Create maps for quick lookup
  const currentSiteIds = new Set(current.map(s => s.id));
  const proposedSiteIds = new Set(proposed.map(s => s.id));

  // Find sites being removed (capacity freed)
  for (const site of current) {
    if (!proposedSiteIds.has(site.id)) {
      const fullSite = availableSites.find(s => s.id === site.id);
      if (fullSite) {
        const capacityBefore = fullSite.allocated;
        const capacityAfter = Math.max(0, fullSite.allocated - 1); // Free up capacity
        const percentageBefore = (capacityBefore / fullSite.capacity) * 100;
        const percentageAfter = (capacityAfter / fullSite.capacity) * 100;

        capacityChanges.push({
          siteId: fullSite.id,
          siteName: fullSite.name,
          capacityBefore,
          capacityAfter,
          percentageBefore,
          percentageAfter,
          delta: capacityAfter - capacityBefore,
        });

        affectsCapacity = true;
      }
    }
  }

  // Find sites being added (capacity consumed)
  for (const site of proposed) {
    if (!currentSiteIds.has(site.id)) {
      const fullSite = availableSites.find(s => s.id === site.id);
      if (fullSite) {
        const capacityBefore = fullSite.allocated;
        const capacityAfter = fullSite.allocated + 1; // Consume capacity
        const percentageBefore = (capacityBefore / fullSite.capacity) * 100;
        const percentageAfter = (capacityAfter / fullSite.capacity) * 100;

        capacityChanges.push({
          siteId: fullSite.id,
          siteName: fullSite.name,
          capacityBefore,
          capacityAfter,
          percentageBefore,
          percentageAfter,
          delta: capacityAfter - capacityBefore,
        });

        affectsCapacity = true;

        // Check if this puts site over capacity
        if (capacityAfter > fullSite.capacity) {
          warnings.push(
            `${fullSite.name} will exceed capacity (${capacityAfter}/${fullSite.capacity})`
          );
          maxRiskLevel = 'critical';
        } else if (percentageAfter >= 90) {
          warnings.push(
            `${fullSite.name} will be at ${percentageAfter.toFixed(1)}% capacity (high utilization)`
          );
          maxRiskLevel = maxRiskLevel === 'critical' ? 'critical' : 'high';
        } else if (percentageAfter >= 70) {
          warnings.push(
            `${fullSite.name} will be at ${percentageAfter.toFixed(1)}% capacity`
          );
          maxRiskLevel = maxRiskLevel === 'critical' || maxRiskLevel === 'high'
            ? maxRiskLevel
            : 'medium';
        }
      }
    }
  }

  // Generate summary
  let summary = '';
  if (capacityChanges.length === 0) {
    summary = 'No capacity impact detected.';
  } else {
    const added = capacityChanges.filter(c => c.delta > 0);
    const removed = capacityChanges.filter(c => c.delta < 0);

    const parts: string[] = [];
    if (removed.length > 0) {
      parts.push(`Freed capacity at: ${removed.map(c => c.siteName).join(', ')}`);
    }
    if (added.length > 0) {
      parts.push(`Consumed capacity at: ${added.map(c => c.siteName).join(', ')}`);
    }
    summary = parts.join('; ');
  }

  return {
    affectsCapacity,
    capacityChanges,
    riskLevel: maxRiskLevel,
    summary,
    warnings,
  };
}

/**
 * Checks if impact acknowledgment is required
 *
 * @param impact - Calculated impact
 * @returns true if user must acknowledge impact before saving
 */
export function requiresImpactAcknowledgment(impact: AllocationImpact): boolean {
  // Require acknowledgment if:
  // 1. Any capacity is affected
  // 2. Risk level is medium or higher
  // 3. Any warnings exist
  return (
    impact.affectsCapacity ||
    impact.riskLevel === 'medium' ||
    impact.riskLevel === 'high' ||
    impact.riskLevel === 'critical' ||
    impact.warnings.length > 0
  );
}

/**
 * Formats impact for audit trail storage
 *
 * @param impact - Calculated impact
 * @param acknowledged - Whether user acknowledged
 * @param acknowledgedBy - User ID who acknowledged
 * @returns Audit trail record
 */
export function formatImpactForAudit(
  impact: AllocationImpact,
  acknowledged: boolean,
  acknowledgedBy: string
): {
  acknowledged: boolean;
  acknowledgedAt: string;
  acknowledgedBy: string;
  impactSummary: string;
  riskLevel: string;
  capacityChanges: AllocationImpact['capacityChanges'];
  warnings: string[];
} {
  return {
    acknowledged,
    acknowledgedAt: new Date().toISOString(),
    acknowledgedBy,
    impactSummary: impact.summary,
    riskLevel: impact.riskLevel,
    capacityChanges: impact.capacityChanges,
    warnings: impact.warnings,
  };
}
