/**
 * Validation utilities for Collection Opportunities
 * Provides real-time validation for capacity, conflicts, and optimization
 */

import {
  CollectionOpportunity,
  Site,
  Satellite,
  CapacityResult,
  OpportunityStatus,
  Conflict,
  Optimization,
  ValidationError,
  CapacityThresholds,
} from '../types/collectionOpportunities';

/**
 * Validates capacity allocation for given sites and satellite
 */
export const validateCapacity = (
  sites: Site[],
  satellite: Satellite,
  thresholds: CapacityThresholds
): CapacityResult => {
  // Calculate total available capacity from selected sites
  const totalAvailable = sites.reduce((sum, site) => {
    const available = site.capacity - site.allocated;
    return sum + Math.max(0, available); // Ensure non-negative
  }, 0);

  // Calculate what's needed vs what's available
  const satelliteNeed = satellite.capacity - satellite.currentLoad;
  const percentage = satelliteNeed > 0 ? (totalAvailable / satelliteNeed) * 100 : 100;

  // Determine status based on thresholds
  let status: OpportunityStatus = 'optimal';
  const warnings: string[] = [];

  if (percentage < thresholds.critical) {
    status = 'critical';
    warnings.push(`Capacity critically low: Only ${percentage.toFixed(1)}% of required capacity available`);
    warnings.push('Consider adding high-capacity sites or removing conflicting assignments');
  } else if (percentage < thresholds.warning) {
    status = 'warning';
    warnings.push(`Capacity below optimal: ${percentage.toFixed(1)}% available`);
    warnings.push('Consider optimizing site allocation for better performance');
  } else if (percentage < thresholds.optimal) {
    warnings.push('Capacity is adequate but could be improved');
  }

  // Check for over-allocated sites
  const overAllocatedSites = sites.filter(site => site.allocated > site.capacity);
  if (overAllocatedSites.length > 0) {
    warnings.push(`Warning: ${overAllocatedSites.length} sites are over-allocated`);
  }

  return {
    available: totalAvailable,
    allocated: sites.reduce((sum, site) => sum + site.allocated, 0),
    percentage: percentage as Percentage,
    status,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
};

/**
 * Detects conflicts between collection opportunities
 */
export const detectConflicts = (
  opportunities: CollectionOpportunity[]
): Conflict[] => {
  const conflicts: Conflict[] = [];
  
  // Group opportunities by satellite
  const bySatellite = new Map<string, CollectionOpportunity[]>();
  opportunities.forEach(opp => {
    const satelliteId = opp.satellite.id;
    if (!bySatellite.has(satelliteId)) {
      bySatellite.set(satelliteId, []);
    }
    bySatellite.get(satelliteId)!.push(opp);
  });

  // Check for conflicts within same satellite
  bySatellite.forEach((opps, satelliteId) => {
    if (opps.length <= 1) return;

    // Check for site overlap
    for (let i = 0; i < opps.length; i++) {
      for (let j = i + 1; j < opps.length; j++) {
        const opp1 = opps[i];
        const opp2 = opps[j];
        
        const siteIds1 = new Set(opp1.sites.map(s => s.id));
        const siteIds2 = new Set(opp2.sites.map(s => s.id));
        
        const overlappingSites = Array.from(siteIds1).filter(id => siteIds2.has(id));
        
        if (overlappingSites.length > 0) {
          conflicts.push({
            opportunityId: opp1.id,
            conflictsWith: opp2.id,
            reason: `Site overlap detected: ${overlappingSites.length} shared sites`,
            severity: overlappingSites.length > 2 ? 'high' : 'medium',
          });
        }
      }
    }

    // Check for capacity conflicts
    const totalCapacityNeeded = opps.reduce((sum, opp) => {
      return sum + (opp.satellite.capacity - opp.satellite.currentLoad);
    }, 0);
    
    const firstOpp = opps[0];
    if (totalCapacityNeeded > firstOpp.satellite.capacity) {
      opps.forEach(opp => {
        conflicts.push({
          opportunityId: opp.id as OpportunityId,
          conflictsWith: 'satellite-capacity' as OpportunityId,
          reason: 'Total demand exceeds satellite capacity',
          severity: 'high',
        });
      });
    }
  });

  // Check for temporal conflicts (if opportunities have time windows)
  // This would be implemented based on actual time window data

  return conflicts;
};

/**
 * Suggests optimizations for collection opportunity allocation
 */
export const suggestOptimizations = (
  opportunity: CollectionOpportunity,
  allSites: Site[],
  existingOpportunities: CollectionOpportunity[]
): Optimization[] => {
  const optimizations: Optimization[] = [];

  // Find underutilized sites
  const underutilizedSites = allSites.filter(site => {
    const utilization = (site.allocated / site.capacity) * 100;
    return utilization < 50 && !opportunity.sites.some(s => s.id === site.id);
  });

  if (underutilizedSites.length > 0) {
    optimizations.push({
      opportunityId: opportunity.id,
      suggestion: 'Add underutilized sites to improve capacity',
      expectedImprovement: 15 as Percentage, // percentage
      sites: underutilizedSites.slice(0, 3), // Top 3 suggestions
    });
  }

  // Find high-latency sites that could be replaced
  const currentAvgLatency = calculateAverageLatency([...opportunity.sites], opportunity.satellite);
  const betterSites = allSites.filter(site => {
    if (opportunity.sites.some(s => s.id === site.id)) return false;
    const latency = calculateLatency(site, opportunity.satellite);
    return latency < currentAvgLatency * 0.8; // 20% improvement threshold
  });

  if (betterSites.length > 0) {
    optimizations.push({
      opportunityId: opportunity.id,
      suggestion: 'Replace high-latency sites with closer alternatives',
      expectedImprovement: 20 as Percentage,
      sites: betterSites.slice(0, 3),
    });
  }

  // Check for load balancing opportunities
  const siteLoads = opportunity.sites.map(site => ({
    site,
    load: (site.allocated / site.capacity) * 100,
  }));
  
  const avgLoad = siteLoads.reduce((sum, sl) => sum + sl.load, 0) / siteLoads.length;
  const loadVariance = Math.sqrt(
    siteLoads.reduce((sum, sl) => sum + Math.pow(sl.load - avgLoad, 2), 0) / siteLoads.length
  );

  if (loadVariance > 20) {
    optimizations.push({
      opportunityId: opportunity.id,
      suggestion: 'Rebalance site allocations for more even distribution',
      expectedImprovement: 10 as Percentage,
      sites: opportunity.sites,
    });
  }

  return optimizations;
};

/**
 * Validates a single opportunity for all criteria
 */
export const validateOpportunity = (
  opportunity: CollectionOpportunity,
  thresholds: CapacityThresholds
): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Validate sites
  if (opportunity.sites.length === 0) {
    errors.push({
      opportunityId: opportunity.id,
      field: 'sites',
      message: 'At least one site must be allocated',
      severity: 'error',
    });
  }

  // Validate capacity
  const capacityResult = validateCapacity(
    [...opportunity.sites],
    opportunity.satellite,
    thresholds
  );

  if (capacityResult.status === 'critical') {
    errors.push({
      opportunityId: opportunity.id,
      field: 'capacity',
      message: 'Critical capacity issue detected',
      severity: 'error',
    });
  }

  // Validate priority
  if (!opportunity.priority) {
    errors.push({
      opportunityId: opportunity.id,
      field: 'priority',
      message: 'Priority must be set',
      severity: 'error',
    });
  }

  // Check for conflicts
  if (opportunity.conflicts && opportunity.conflicts.length > 0) {
    errors.push({
      opportunityId: opportunity.id,
      field: 'conflicts',
      message: `${opportunity.conflicts.length} conflicts detected`,
      severity: 'warning',
    });
  }

  return errors;
};

/**
 * Batch validates multiple opportunities
 */
export const batchValidate = (
  opportunities: CollectionOpportunity[],
  thresholds: CapacityThresholds
): Map<string, ValidationError[]> => {
  const results = new Map<string, ValidationError[]>();

  // Validate each opportunity individually
  opportunities.forEach(opp => {
    const errors = validateOpportunity(opp, thresholds);
    if (errors.length > 0) {
      results.set(opp.id, errors);
    }
  });

  // Check for cross-opportunity conflicts
  const conflicts = detectConflicts(opportunities);
  conflicts.forEach(conflict => {
    if (!results.has(conflict.opportunityId)) {
      results.set(conflict.opportunityId, []);
    }
    results.get(conflict.opportunityId)!.push({
      opportunityId: conflict.opportunityId,
      field: 'conflicts',
      message: conflict.reason,
      severity: conflict.severity === 'high' ? 'error' : 'warning',
    });
  });

  return results;
};

// Helper functions

/**
 * Calculates average latency between sites and satellite
 */
const calculateAverageLatency = (sites: Site[], satellite: Satellite): number => {
  if (sites.length === 0) return 0;
  
  const totalLatency = sites.reduce((sum, site) => {
    return sum + calculateLatency(site, satellite);
  }, 0);
  
  return totalLatency / sites.length;
};

/**
 * Calculates latency between a site and satellite (simplified)
 */
const calculateLatency = (site: Site, satellite: Satellite): number => {
  // Simplified calculation based on distance
  // In real implementation, this would consider orbital mechanics
  const distance = Math.sqrt(
    Math.pow(site.location.lat, 2) + Math.pow(site.location.lon, 2)
  );
  
  return distance * 0.1; // Simplified latency calculation
};

/**
 * Determines opportunity status based on multiple factors
 */
export const determineOpportunityStatus = (
  opportunity: CollectionOpportunity,
  capacityResult: CapacityResult,
  conflicts: Conflict[]
): OpportunityStatus => {
  // Critical if any critical conflicts or capacity
  if (conflicts.some(c => c.severity === 'high') || capacityResult.status === 'critical') {
    return 'critical';
  }
  
  // Warning if any medium conflicts or warning capacity
  if (conflicts.some(c => c.severity === 'medium') || capacityResult.status === 'warning') {
    return 'warning';
  }
  
  return 'optimal';
};