import React, { useState, useEffect, useMemo } from 'react';
import {
  Button,
  Card,
  Callout,
  HTMLTable,
  Icon,
  Intent,
  ProgressBar,
  Tag,
  Tooltip,
  FormGroup,
  TextArea,
  Collapse,
  Divider,
  Classes
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import {
  CollectionOpportunity,
  Site,
  Pass,
  Conflict,
  OpportunityStatus,
  Priority
} from '../types/collectionOpportunities';
import './OverrideImpactCalculator.css';

export interface OverrideImpact {
  opportunityId: string;
  proposedSite: Site;
  originalSite: Site;
  
  // Capacity impacts
  capacityImpact: {
    originalSiteCapacity: number;
    proposedSiteCapacity: number;
    capacityDelta: number;
    utilizationChange: number;
  };
  
  // Affected entities
  affectedSatellites: string[];
  affectedSites: string[];
  conflictingOpportunities: Conflict[];
  
  // Quality metrics
  qualityImpact: {
    originalQuality: number;
    proposedQuality: number;
    qualityDelta: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  
  // Operational impacts
  operationalImpacts: {
    type: 'capacity' | 'resource' | 'schedule' | 'mission';
    severity: 'low' | 'medium' | 'high';
    description: string;
    mitigation?: string;
  }[];
  
  // Recommendations
  recommendations: string[];
  requiresApproval: boolean;
  riskScore: number; // 0-100
}

interface OverrideImpactCalculatorProps {
  opportunity: CollectionOpportunity;
  proposedSite: Site;
  availableSites: Site[];
  allOpportunities: CollectionOpportunity[];
  onImpactCalculated?: (impact: OverrideImpact) => void;
  onJustificationRequired?: (justification: string) => void;
  className?: string;
}

/**
 * Override Impact Calculator - Analyzes the impact of allocation overrides
 * 
 * Addresses JTBD #2: Override and Customize Allocations
 * - Shows impact analysis when overriding allocations
 * - Identifies affected satellites and sites
 * - Highlights capacity implications
 * - Detects conflicts with other opportunities
 * - Provides justification workflow
 */
export const OverrideImpactCalculator: React.FC<OverrideImpactCalculatorProps> = ({
  opportunity,
  proposedSite,
  availableSites,
  allOpportunities,
  onImpactCalculated,
  onJustificationRequired,
  className
}) => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [justification, setJustification] = useState('');
  const [impact, setImpact] = useState<OverrideImpact | null>(null);

  // Calculate impact analysis
  const calculateImpact = useMemo(() => {
    if (!opportunity.allocatedSites.length || !proposedSite) return null;

    const originalSite = opportunity.allocatedSites[0]; // Assuming single site for simplicity
    
    // Capacity calculations
    const originalCapacityUsage = (originalSite.allocated / originalSite.capacity) * 100;
    const proposedCapacityUsage = ((proposedSite.allocated + 1) / proposedSite.capacity) * 100;
    const capacityDelta = proposedCapacityUsage - originalCapacityUsage;

    // Find conflicts with other opportunities
    const conflicts: Conflict[] = allOpportunities
      .filter(opp => 
        opp.id !== opportunity.id && 
        opp.allocatedSites.some(site => site.id === proposedSite.id)
      )
      .map(opp => ({
        opportunityId: opp.id,
        conflictsWith: opportunity.id,
        reason: `Both opportunities allocated to site ${proposedSite.name}`,
        severity: opp.priority === 'critical' ? 'high' : 
                 opp.priority === 'high' ? 'medium' : 'low'
      }));

    // Quality impact assessment
    const originalQuality = opportunity.matchQuality || 75;
    const proposedQuality = Math.max(0, originalQuality + (Math.random() * 20 - 10)); // Simulated
    const qualityDelta = proposedQuality - originalQuality;

    // Operational impacts
    const operationalImpacts = [];
    
    if (capacityDelta > 20) {
      operationalImpacts.push({
        type: 'capacity' as const,
        severity: 'high' as const,
        description: `Proposed site will exceed recommended capacity utilization`,
        mitigation: 'Consider load balancing or capacity expansion'
      });
    }

    if (conflicts.length > 0) {
      operationalImpacts.push({
        type: 'schedule' as const,
        severity: 'medium' as const,
        description: `${conflicts.length} scheduling conflicts detected`,
        mitigation: 'Review conflict resolution strategies'
      });
    }

    if (qualityDelta < -10) {
      operationalImpacts.push({
        type: 'mission' as const,
        severity: 'medium' as const,
        description: 'Quality score may decrease with proposed allocation',
        mitigation: 'Validate mission requirements can still be met'
      });
    }

    // Risk scoring
    let riskScore = 0;
    riskScore += Math.min(30, Math.max(0, capacityDelta)); // Capacity risk
    riskScore += conflicts.length * 15; // Conflict risk
    riskScore += Math.max(0, -qualityDelta); // Quality degradation risk
    riskScore = Math.min(100, riskScore);

    // Recommendations
    const recommendations = [];
    if (riskScore > 70) {
      recommendations.push('High risk override - requires senior approval');
    }
    if (capacityDelta > 15) {
      recommendations.push('Monitor site capacity closely after allocation');
    }
    if (conflicts.length > 0) {
      recommendations.push('Coordinate with affected mission planners');
    }
    if (qualityDelta > 10) {
      recommendations.push('Quality improvement detected - good override');
    }

    const calculatedImpact: OverrideImpact = {
      opportunityId: opportunity.id,
      proposedSite,
      originalSite,
      capacityImpact: {
        originalSiteCapacity: originalCapacityUsage,
        proposedSiteCapacity: proposedCapacityUsage,
        capacityDelta,
        utilizationChange: capacityDelta
      },
      affectedSatellites: [opportunity.satellite.id],
      affectedSites: [originalSite.id, proposedSite.id],
      conflictingOpportunities: conflicts,
      qualityImpact: {
        originalQuality,
        proposedQuality,
        qualityDelta,
        riskLevel: Math.abs(qualityDelta) > 15 ? 'high' : 
                   Math.abs(qualityDelta) > 5 ? 'medium' : 'low'
      },
      operationalImpacts,
      recommendations,
      requiresApproval: riskScore > 60,
      riskScore
    };

    return calculatedImpact;
  }, [opportunity, proposedSite, allOpportunities]);

  // Auto-calculate when dependencies change
  useEffect(() => {
    if (calculateImpact) {
      setIsCalculating(true);
      // Simulate calculation time
      const timer = setTimeout(() => {
        setImpact(calculateImpact);
        setIsCalculating(false);
        if (onImpactCalculated) {
          onImpactCalculated(calculateImpact);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [calculateImpact, onImpactCalculated]);

  const getRiskIntent = (riskScore: number): Intent => {
    if (riskScore >= 70) return Intent.DANGER;
    if (riskScore >= 40) return Intent.WARNING;
    return Intent.SUCCESS;
  };

  const getRiskLabel = (riskScore: number): string => {
    if (riskScore >= 70) return 'High Risk';
    if (riskScore >= 40) return 'Medium Risk';
    return 'Low Risk';
  };

  const handleJustificationSubmit = () => {
    if (justification.trim() && onJustificationRequired) {
      onJustificationRequired(justification);
    }
  };

  if (isCalculating) {
    return (
      <Card className={className}>
        <div style={{ textAlign: 'center', padding: 20 }}>
          <ProgressBar intent={Intent.PRIMARY} />
          <p style={{ marginTop: 10, color: '#5C7080' }}>
            Calculating override impact...
          </p>
        </div>
      </Card>
    );
  }

  if (!impact) {
    return (
      <Card className={className}>
        <Callout intent={Intent.WARNING} icon={IconNames.WARNING_SIGN}>
          Unable to calculate impact. Please verify site selection.
        </Callout>
      </Card>
    );
  }

  return (
    <div className={className} data-testid="impact-analysis-results">
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <Icon icon={IconNames.CALCULATOR} size={20} style={{ marginRight: 8 }} />
          <h4 className={Classes.HEADING} style={{ margin: 0 }}>
            Override Impact Analysis
          </h4>
          <div style={{ marginLeft: 'auto' }}>
            <Tag
              intent={getRiskIntent(impact.riskScore)}
              large
              icon={impact.riskScore >= 70 ? IconNames.ERROR : 
                    impact.riskScore >= 40 ? IconNames.WARNING_SIGN : IconNames.TICK}
            >
              {getRiskLabel(impact.riskScore)} ({impact.riskScore})
            </Tag>
          </div>
        </div>

        {/* Quick Summary */}
        <Callout intent={getRiskIntent(impact.riskScore)} style={{ marginBottom: 16 }}>
          <strong>Impact Summary:</strong> Moving from {impact.originalSite.name} to {impact.proposedSite.name}
          {impact.capacityImpact.capacityDelta > 0 && 
            ` will increase utilization by ${impact.capacityImpact.capacityDelta.toFixed(1)}%`
          }
          {impact.conflictingOpportunities.length > 0 && 
            ` and creates ${impact.conflictingOpportunities.length} scheduling conflicts`
          }
        </Callout>

        {/* Capacity Impact */}
        <div style={{ marginBottom: 16 }}>
          <h5>Capacity Impact</h5>
          <HTMLTable condensed striped style={{ width: '100%' }}>
            <tbody>
              <tr>
                <td><strong>Original Site</strong></td>
                <td>{impact.originalSite.name}</td>
                <td>
                  <ProgressBar 
                    value={impact.capacityImpact.originalSiteCapacity / 100}
                    intent={impact.capacityImpact.originalSiteCapacity > 80 ? Intent.DANGER : Intent.PRIMARY}
                  />
                </td>
                <td>{impact.capacityImpact.originalSiteCapacity.toFixed(1)}%</td>
              </tr>
              <tr>
                <td><strong>Proposed Site</strong></td>
                <td>{impact.proposedSite.name}</td>
                <td>
                  <ProgressBar 
                    value={impact.capacityImpact.proposedSiteCapacity / 100}
                    intent={impact.capacityImpact.proposedSiteCapacity > 80 ? Intent.DANGER : Intent.PRIMARY}
                  />
                </td>
                <td>{impact.capacityImpact.proposedSiteCapacity.toFixed(1)}%</td>
              </tr>
            </tbody>
          </HTMLTable>
        </div>

        {/* Conflicts Section */}
        {impact.conflictingOpportunities.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h5>
              <Icon icon={IconNames.ERROR} style={{ marginRight: 4 }} />
              Scheduling Conflicts ({impact.conflictingOpportunities.length})
            </h5>
            {impact.conflictingOpportunities.map((conflict, index) => (
              <Callout key={index} intent={Intent.WARNING} style={{ marginBottom: 8 }}>
                <strong>Opportunity {conflict.opportunityId}</strong>: {conflict.reason}
                <Tag minimal intent={conflict.severity === 'high' ? Intent.DANGER : Intent.WARNING}>
                  {conflict.severity} priority
                </Tag>
              </Callout>
            ))}
          </div>
        )}

        {/* Quality Impact */}
        <div style={{ marginBottom: 16 }}>
          <h5>Quality Impact</h5>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div>
              <span>Original: {impact.qualityImpact.originalQuality.toFixed(1)}</span>
            </div>
            <Icon 
              icon={impact.qualityImpact.qualityDelta > 0 ? IconNames.ARROW_UP : IconNames.ARROW_DOWN}
              intent={impact.qualityImpact.qualityDelta > 0 ? Intent.SUCCESS : Intent.WARNING}
            />
            <div>
              <span>Proposed: {impact.qualityImpact.proposedQuality.toFixed(1)}</span>
            </div>
            <Tag 
              intent={impact.qualityImpact.qualityDelta > 0 ? Intent.SUCCESS : Intent.WARNING}
              minimal
            >
              {impact.qualityImpact.qualityDelta > 0 ? '+' : ''}{impact.qualityImpact.qualityDelta.toFixed(1)}
            </Tag>
          </div>
        </div>

        {/* Operational Impacts */}
        {impact.operationalImpacts.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Button
              minimal
              icon={showDetails ? IconNames.CHEVRON_UP : IconNames.CHEVRON_DOWN}
              onClick={() => setShowDetails(!showDetails)}
              style={{ marginBottom: 8 }}
            >
              Operational Impacts ({impact.operationalImpacts.length})
            </Button>
            <Collapse isOpen={showDetails}>
              {impact.operationalImpacts.map((opImpact, index) => (
                <Callout
                  key={index}
                  intent={opImpact.severity === 'high' ? Intent.DANGER : 
                          opImpact.severity === 'medium' ? Intent.WARNING : Intent.PRIMARY}
                  style={{ marginBottom: 8 }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <Tag minimal>
                      {opImpact.type}
                    </Tag>
                    <div style={{ flex: 1 }}>
                      <div>{opImpact.description}</div>
                      {opImpact.mitigation && (
                        <div style={{ fontSize: '0.9em', color: '#5C7080', marginTop: 4 }}>
                          <strong>Mitigation:</strong> {opImpact.mitigation}
                        </div>
                      )}
                    </div>
                  </div>
                </Callout>
              ))}
            </Collapse>
          </div>
        )}

        {/* Recommendations */}
        {impact.recommendations.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h5>Recommendations</h5>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {impact.recommendations.map((rec, index) => (
                <li key={index} style={{ marginBottom: 4 }}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

        <Divider />

        {/* Justification Workflow */}
        {impact.requiresApproval && (
          <div style={{ marginTop: 16 }}>
            <Callout intent={Intent.WARNING} icon={IconNames.SHIELD}>
              <strong>Approval Required:</strong> This override requires justification due to high risk score.
            </Callout>
            <FormGroup
              label="Override Justification"
              labelInfo="(required for high-risk overrides)"
              style={{ marginTop: 12 }}
            >
              <TextArea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Provide detailed justification for this override, including mission requirements, risk mitigation strategies, and approval from relevant stakeholders..."
                rows={4}
                style={{ width: '100%' }}
                data-testid="override-justification"
              />
            </FormGroup>
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <Button
                intent={Intent.PRIMARY}
                icon={IconNames.DOCUMENT}
                onClick={handleJustificationSubmit}
                disabled={!justification.trim()}
                data-testid="confirm-override-button"
              >
                Submit with Justification
              </Button>
              <Tooltip content="Override without full justification (not recommended for high-risk changes)">
                <Button intent={Intent.NONE} icon={IconNames.WARNING_SIGN}>
                  Override Anyway
                </Button>
              </Tooltip>
            </div>
          </div>
        )}

        {!impact.requiresApproval && (
          <div style={{ marginTop: 16 }}>
            <Button
              intent={Intent.SUCCESS}
              icon={IconNames.TICK}
              large
              style={{ width: '100%' }}
              data-testid="confirm-override-button"
            >
              Confirm Override (Low Risk)
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default OverrideImpactCalculator;