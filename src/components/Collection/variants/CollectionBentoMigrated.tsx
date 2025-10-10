import React, { useMemo } from 'react';
import { Card, Elevation, Tag, Intent, Icon, H5 } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { Collection } from '../index';
import { EnhancedStatusIndicator } from '../EnhancedStatusIndicator';
import { useMemoizedHealthScores } from '../../../hooks/collections/useCollectionPerformance';
import { CollectionOpportunity } from '../../../types/collectionOpportunities';
import { useFeatureFlag } from '../../../hooks/useFeatureFlag';

interface CollectionBentoMigratedProps {
  opportunities: CollectionOpportunity[];
  onOpportunityClick?: (opportunity: CollectionOpportunity) => void;
  className?: string;
}

/**
 * Migrated Bento layout using new compound component architecture
 * Replaces: CollectionOpportunitiesBento, CollectionOpportunitiesEnhancedBento
 */
export const CollectionBentoMigrated: React.FC<CollectionBentoMigratedProps> = ({
  opportunities,
  onOpportunityClick,
  className = ''
}) => {
  const healthScores = useMemoizedHealthScores(opportunities);
  const useEnhancedLayout = useFeatureFlag('USE_ENHANCED_BENTO');
  
  // Group opportunities by status
  const groupedOpportunities = useMemo(() => {
    const groups: Record<string, CollectionOpportunity[]> = {
      critical: [],
      warning: [],
      nominal: [],
      unknown: []
    };
    
    opportunities.forEach(opp => {
      const status = opp.status || 'unknown';
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(opp);
    });
    
    return groups;
  }, [opportunities]);
  
  const renderOpportunityCard = (opportunity: CollectionOpportunity) => {
    const health = healthScores.get(opportunity.id);
    
    return (
      <Card 
        key={opportunity.id}
        interactive={true}
        elevation={Elevation.ONE}
        onClick={() => onOpportunityClick?.(opportunity)}
        className="collection-bento-card"
      >
        <div className="bento-card-header">
          <EnhancedStatusIndicator 
            status={opportunity.status}
            health={health}
            conflicts={opportunity.conflicts?.length || 0}
            priority={opportunity.priority}
          />
          <H5 className="bento-card-title">{opportunity.name}</H5>
        </div>
        
        <div className="bento-card-content">
          <div className="bento-card-info">
            <Icon icon={IconNames.SATELLITE} />
            <span>{opportunity.collection?.satellite || 'Unknown'}</span>
          </div>
          
          {health && (
            <div className="bento-card-metrics">
              <Tag intent={getHealthIntent(health.overallHealth)}>
                Health: {health.score.toFixed(0)}%
              </Tag>
            </div>
          )}
        </div>
      </Card>
    );
  };
  
  if (useEnhancedLayout) {
    // Enhanced Bento layout with sections
    return (
      <Collection className={`collection-bento-enhanced ${className}`}>
        {Object.entries(groupedOpportunities).map(([status, opps]) => (
          opps.length > 0 && (
            <div key={status} className="bento-section">
              <div className="bento-section-header">
                <Icon icon={getStatusIcon(status)} />
                <H5>{getStatusLabel(status)} ({opps.length})</H5>
              </div>
              <div className="bento-grid">
                {opps.map(renderOpportunityCard)}
              </div>
            </div>
          )
        ))}
      </Collection>
    );
  }
  
  // Standard Bento layout
  return (
    <Collection className={`collection-bento ${className}`}>
      <div className="bento-grid">
        {opportunities.map(renderOpportunityCard)}
      </div>
    </Collection>
  );
};

// Helper functions
function getHealthIntent(health: string): Intent {
  switch (health) {
    case 'good': return Intent.SUCCESS;
    case 'fair': return Intent.WARNING;
    case 'poor': return Intent.DANGER;
    default: return Intent.NONE;
  }
}

function getStatusIcon(status: string): IconNames {
  switch (status) {
    case 'critical': return IconNames.ERROR;
    case 'warning': return IconNames.WARNING_SIGN;
    case 'nominal': return IconNames.TICK_CIRCLE;
    default: return IconNames.HELP;
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'critical': return 'Critical';
    case 'warning': return 'Needs Review';
    case 'nominal': return 'Healthy';
    default: return 'Unknown';
  }
}