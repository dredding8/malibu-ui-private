/**
 * Opportunity Health Calculation Engine
 * Multi-factor health scoring system for Collection Opportunities
 */

import { 
  CollectionOpportunity, 
  OpportunityStatus, 
  CapacityThresholds,
  Priority,
  HealthAnalysis
} from '../types/collectionOpportunities';

export interface HealthMetrics {
  capacityScore: number;
  matchQuality: number;
  conflictCount: number;
  priorityAlignment: number;
  utilizationEfficiency: number;
  riskScore: number;
}

export interface OpportunityHealth {
  level: 'optimal' | 'warning' | 'critical';
  score: number; // 0-100
  reasons: string[];
  metrics: HealthMetrics;
  recommendations: string[];
}

/**
 * Calculate comprehensive health score for an opportunity
 */
export const calculateOpportunityHealth = (
  opportunity: CollectionOpportunity,
  thresholds: CapacityThresholds = { critical: 10, warning: 30, optimal: 70 }
): OpportunityHealth => {
  const metrics = calculateHealthMetrics(opportunity);
  const { score, level } = calculateOverallScore(metrics, thresholds);
  const reasons = generateHealthReasons(metrics, thresholds);
  const recommendations = generateRecommendations(opportunity, metrics, level);

  return {
    level,
    score,
    reasons,
    metrics,
    recommendations
  };
};

/**
 * Calculate individual health metrics
 */
const calculateHealthMetrics = (opportunity: CollectionOpportunity): HealthMetrics => {
  // Capacity Score (0-100)
  const capacityScore = opportunity.capacityPercentage || 0;

  // Conflict Count (lower is better)
  const conflictCount = opportunity.conflicts?.length || 0;

  // Priority Alignment (0-100)
  const priorityAlignment = calculatePriorityAlignment(opportunity);

  // Utilization Efficiency (0-100)
  const utilizationEfficiency = calculateUtilizationEfficiency(opportunity);

  // Risk Score (0-100, higher is worse)
  const riskScore = calculateRiskScore(opportunity);

  return {
    capacityScore,
    matchQuality: 0, // Deprecated: Quality concept removed
    conflictCount,
    priorityAlignment,
    utilizationEfficiency,
    riskScore
  };
};

/**
 * Calculate priority alignment score
 */
const calculatePriorityAlignment = (opportunity: CollectionOpportunity): number => {
  const priorityWeights: Record<Priority, number> = {
    critical: 100,
    high: 80,
    medium: 60,
    low: 40
  };

  const baseScore = priorityWeights[opportunity.priority];
  
  // Adjust based on satellite function alignment
  let alignmentMultiplier = 1.0;
  
  if (opportunity.priority === 'critical') {
    if (opportunity.satellite.function === 'ISR') {
      alignmentMultiplier = 1.2; // ISR critical for critical ops
    } else if (opportunity.satellite.function === 'Communications') {
      alignmentMultiplier = 0.8; // Less critical alignment
    }
  }

  return Math.min(100, baseScore * alignmentMultiplier);
};

/**
 * Calculate utilization efficiency
 */
const calculateUtilizationEfficiency = (opportunity: CollectionOpportunity): number => {
  if (!opportunity.sites || opportunity.sites.length === 0) {
    return 0;
  }

  // Calculate average site utilization
  const avgUtilization = opportunity.sites.reduce((sum, site) => {
    const utilization = site.allocated / site.capacity;
    return sum + utilization;
  }, 0) / opportunity.sites.length;

  // Optimal utilization is between 60-85%
  let efficiency = 100;
  
  if (avgUtilization < 0.6) {
    efficiency = (avgUtilization / 0.6) * 100; // Under-utilized
  } else if (avgUtilization > 0.85) {
    efficiency = 100 - ((avgUtilization - 0.85) / 0.15) * 50; // Over-utilized
  }

  return Math.max(0, Math.min(100, efficiency));
};

/**
 * Calculate geographic diversity of sites
 */
const calculateGeographicDiversity = (sites: any[]): number => {
  if (!sites || sites.length <= 1) return 0.5;

  // Simple diversity calculation based on location spread
  // In real implementation, would calculate actual geographic distances
  const uniqueLocations = new Set(sites.map(s => 
    `${Math.round(s.location?.lat || 0)},${Math.round(s.location?.lon || 0)}`
  ));

  return uniqueLocations.size / sites.length;
};

/**
 * Calculate risk score based on various factors
 */
const calculateRiskScore = (opportunity: CollectionOpportunity): number => {
  let riskScore = 0;

  // Capacity risk
  if (opportunity.capacityPercentage < 10) {
    riskScore += 40;
  } else if (opportunity.capacityPercentage < 30) {
    riskScore += 20;
  }

  // Conflict risk
  riskScore += Math.min(30, (opportunity.conflicts?.length || 0) * 10);

  // Single point of failure risk
  if (opportunity.sites?.length === 1) {
    riskScore += 30;
  } else if (opportunity.sites?.length === 2) {
    riskScore += 15;
  }

  // Priority misalignment risk
  if (opportunity.priority === 'critical' && opportunity.capacityPercentage < 50) {
    riskScore += 20;
  }

  return Math.min(100, riskScore);
};

/**
 * Calculate overall score and health level
 */
const calculateOverallScore = (
  metrics: HealthMetrics, 
  thresholds: CapacityThresholds
): { score: number; level: OpportunityStatus } => {
  // Weighted scoring
  const weights = {
    capacity: 0.25,
    matchQuality: 0.20,
    conflicts: 0.20,
    priority: 0.15,
    utilization: 0.10,
    risk: 0.10
  };

  // Normalize conflict count (inverse scoring)
  const normalizedConflicts = Math.max(0, 100 - (metrics.conflictCount * 20));

  // Calculate weighted score
  const score = 
    metrics.capacityScore * weights.capacity +
    metrics.matchQuality * weights.matchQuality +
    normalizedConflicts * weights.conflicts +
    metrics.priorityAlignment * weights.priority +
    metrics.utilizationEfficiency * weights.utilization +
    (100 - metrics.riskScore) * weights.risk;

  // Determine health level
  let level: OpportunityStatus = 'optimal';
  
  if (score < thresholds.critical || 
      metrics.capacityScore < thresholds.critical || 
      metrics.conflictCount > 3) {
    level = 'critical';
  } else if (score < thresholds.warning || 
             metrics.capacityScore < thresholds.warning || 
             metrics.conflictCount > 1) {
    level = 'warning';
  }

  return { score: Math.round(score), level };
};

/**
 * Generate human-readable health reasons
 */
const generateHealthReasons = (
  metrics: HealthMetrics, 
  thresholds: CapacityThresholds
): string[] => {
  const reasons: string[] = [];

  // Capacity reasons
  if (metrics.capacityScore < thresholds.critical) {
    reasons.push('Critical capacity shortage - immediate action required');
  } else if (metrics.capacityScore < thresholds.warning) {
    reasons.push('Low capacity availability may impact operations');
  } else if (metrics.capacityScore > thresholds.optimal) {
    reasons.push('Healthy capacity levels');
  }

  // Conflict reasons
  if (metrics.conflictCount > 3) {
    reasons.push(`High conflict count (${metrics.conflictCount}) affecting reliability`);
  } else if (metrics.conflictCount > 1) {
    reasons.push(`${metrics.conflictCount} scheduling conflicts detected`);
  }

  // Match quality reasons
  if (metrics.matchQuality < 60) {
    reasons.push('Sub-optimal satellite-to-mission matching');
  } else if (metrics.matchQuality > 85) {
    reasons.push('Excellent mission alignment');
  }

  // Risk reasons
  if (metrics.riskScore > 70) {
    reasons.push('High operational risk - review allocation strategy');
  } else if (metrics.riskScore > 40) {
    reasons.push('Moderate risk factors present');
  }

  // Utilization reasons
  if (metrics.utilizationEfficiency < 60) {
    reasons.push('Under-utilizing available resources');
  } else if (metrics.utilizationEfficiency < 80) {
    reasons.push('Resource utilization could be optimized');
  }

  return reasons;
};

/**
 * Generate actionable recommendations
 */
const generateRecommendations = (
  opportunity: CollectionOpportunity,
  metrics: HealthMetrics,
  level: OpportunityStatus
): string[] => {
  const recommendations: string[] = [];

  // Critical recommendations
  if (level === 'critical') {
    if (metrics.capacityScore < 10) {
      recommendations.push('Immediately add high-capacity sites or reduce satellite load');
    }
    if (metrics.conflictCount > 3) {
      recommendations.push('Resolve scheduling conflicts to prevent collection failures');
    }
    if (opportunity.sites?.length === 1) {
      recommendations.push('Add redundant sites to eliminate single point of failure');
    }
  }

  // Warning recommendations
  if (level === 'warning' || level === 'critical') {
    if (metrics.matchQuality < 60) {
      recommendations.push('Consider alternative satellites better suited for this mission');
    }
    if (metrics.utilizationEfficiency < 60) {
      recommendations.push('Rebalance site allocations to improve resource utilization');
    }
    if (metrics.riskScore > 50) {
      recommendations.push('Implement risk mitigation strategies');
    }
  }

  // Optimization recommendations
  if (metrics.capacityScore > 70 && metrics.utilizationEfficiency < 80) {
    recommendations.push('Consider consolidating sites to improve efficiency');
  }
  
  if (opportunity.priority === 'low' && opportunity.sites?.length > 5) {
    recommendations.push('Reduce site allocation for low-priority missions');
  }

  return recommendations;
};

/**
 * Batch health calculation for multiple opportunities
 */
export const calculateBatchHealth = (
  opportunities: CollectionOpportunity[],
  thresholds: CapacityThresholds
): Map<string, OpportunityHealth> => {
  const healthMap = new Map<string, OpportunityHealth>();
  
  opportunities.forEach(opportunity => {
    healthMap.set(opportunity.id, calculateOpportunityHealth(opportunity, thresholds));
  });

  return healthMap;
};

/**
 * Get health trend based on historical data
 */
export const getHealthTrend = (
  currentHealth: OpportunityHealth,
  previousHealth?: OpportunityHealth
): 'improving' | 'declining' | 'stable' => {
  if (!previousHealth) return 'stable';
  
  const scoreDiff = currentHealth.score - previousHealth.score;
  
  if (scoreDiff > 5) return 'improving';
  if (scoreDiff < -5) return 'declining';
  return 'stable';
};

/**
 * Convert OpportunityHealth to HealthAnalysis format
 */
export const convertToHealthAnalysis = (health: OpportunityHealth): HealthAnalysis => {
  return {
    score: (health.score || 0) as QualityScore,
    overallHealth: health.level === 'optimal' ? 'excellent' : 
                  health.level === 'warning' ? 'fair' : 'poor',
    coverage: health.metrics?.capacityScore ? `${Math.round(health.metrics.capacityScore)}%` : 'N/A',
    efficiency: health.metrics?.utilizationEfficiency ? `${Math.round(health.metrics.utilizationEfficiency)}%` : 'N/A',
    balance: health.metrics?.priorityAlignment ? `${Math.round(health.metrics.priorityAlignment)}%` : 'N/A',
    issues: health.reasons || [],
    level: health.level
  };
};