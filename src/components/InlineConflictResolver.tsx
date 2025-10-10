import React, { useState, useEffect } from 'react';
import {
  Card,
  Elevation,
  Intent,
  Icon,
  Button,
  Collapse,
  Tag,
  ProgressBar,
  Callout,
  Classes,
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { CollectionOpportunity, Conflict } from '../types/collectionOpportunities';
import './InlineConflictResolver.css';

interface InlineConflictResolverProps {
  opportunity: CollectionOpportunity;
  conflicts: Conflict[];
  onResolve: (resolution: ConflictResolution) => void;
  onDismiss: () => void;
  aiConfidence?: number;
}

interface ConflictResolution {
  opportunityId: string;
  resolution: 'accept-current' | 'accept-suggested' | 'manual-override';
  manualAllocation?: any;
  justification?: string;
}

interface ConflictPrediction {
  type: 'capacity' | 'schedule' | 'priority';
  severity: 'low' | 'medium' | 'high';
  likelihood: number;
  impact: string;
  preventiveAction?: string;
}

const InlineConflictResolver: React.FC<InlineConflictResolverProps> = ({
  opportunity,
  conflicts,
  onResolve,
  onDismiss,
  aiConfidence = 0,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedResolution, setSelectedResolution] = useState<string>('');
  const [showPredictions, setShowPredictions] = useState(false);
  
  // Simulate conflict predictions
  const [predictions] = useState<ConflictPrediction[]>([
    {
      type: 'capacity',
      severity: 'medium',
      likelihood: 0.75,
      impact: '3 additional opportunities may be affected',
      preventiveAction: 'Reallocate 15% capacity from Site B'
    },
    {
      type: 'schedule',
      severity: 'low',
      likelihood: 0.45,
      impact: 'Minor overlap with maintenance window',
      preventiveAction: 'Adjust timing by 30 minutes'
    }
  ]);

  // Auto-expand when new conflicts appear
  useEffect(() => {
    if (conflicts.length > 0) {
      setIsExpanded(true);
    }
  }, [conflicts.length]);

  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'capacity':
        return IconNames.TIMELINE_BAR_CHART;
      case 'schedule':
        return IconNames.TIME;
      case 'priority':
        return IconNames.SORT;
      default:
        return IconNames.WARNING_SIGN;
    }
  };

  const getSeverityIntent = (severity: string): Intent => {
    switch (severity) {
      case 'high':
        return Intent.DANGER;
      case 'medium':
        return Intent.WARNING;
      case 'low':
        return Intent.PRIMARY;
      default:
        return Intent.NONE;
    }
  };

  const handleQuickResolve = (type: string) => {
    onResolve({
      opportunityId: opportunity.id,
      resolution: type as any,
      justification: 'Quick resolution applied'
    });
  };

  return (
    <div className="inline-conflict-resolver">
      <Card elevation={Elevation.TWO} className={`conflict-card ${conflicts.length > 0 ? 'has-conflicts' : ''}`}>
        <div className="conflict-header">
          <div className="conflict-title">
            <Icon 
              icon={IconNames.ERROR} 
              intent={Intent.WARNING} 
              size={20} 
            />
            <h4>Conflict Detection</h4>
            <Tag intent={Intent.WARNING} minimal round>
              {conflicts.length} active
            </Tag>
          </div>
          <Button
            minimal
            small
            icon={isExpanded ? IconNames.CHEVRON_UP : IconNames.CHEVRON_DOWN}
            onClick={() => setIsExpanded(!isExpanded)}
          />
        </div>

        <Collapse isOpen={isExpanded}>
          {/* AI Confidence Indicator */}
          {aiConfidence > 0 && (
            <div className="ai-confidence-section">
              <div className="confidence-header">
                <Icon icon={IconNames.PREDICTIVE_ANALYSIS} />
                <span>AI Confidence</span>
                <span className="confidence-value">{Math.round(aiConfidence * 100)}%</span>
              </div>
              <ProgressBar 
                value={aiConfidence} 
                intent={aiConfidence > 0.8 ? Intent.SUCCESS : aiConfidence > 0.5 ? Intent.WARNING : Intent.DANGER}
                animate={false}
                stripes={false}
              />
            </div>
          )}

          {/* Active Conflicts */}
          <div className="conflicts-list">
            {conflicts.map((conflict, index) => (
              <div key={index} className="conflict-item">
                <div className="conflict-info">
                  <Icon icon={getConflictIcon(conflict.type)} />
                  <div className="conflict-details">
                    <strong>{conflict.type}</strong>
                    <p>{conflict.description}</p>
                  </div>
                </div>
                <div className="conflict-actions">
                  <Button
                    small
                    minimal
                    intent={Intent.SUCCESS}
                    onClick={() => handleQuickResolve('accept-suggested')}
                  >
                    Accept AI
                  </Button>
                  <Button
                    small
                    minimal
                    onClick={() => handleQuickResolve('accept-current')}
                  >
                    Keep Current
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Predictive Conflicts */}
          <div className="predictions-section">
            <Button
              minimal
              small
              rightIcon={showPredictions ? IconNames.CHEVRON_UP : IconNames.CHEVRON_DOWN}
              onClick={() => setShowPredictions(!showPredictions)}
            >
              Potential Future Conflicts ({predictions.length})
            </Button>
            
            <Collapse isOpen={showPredictions}>
              <div className="predictions-list">
                {predictions.map((prediction, index) => (
                  <Callout
                    key={index}
                    intent={getSeverityIntent(prediction.severity)}
                    icon={getConflictIcon(prediction.type)}
                    className="prediction-item"
                  >
                    <div className="prediction-header">
                      <strong>{prediction.type} conflict</strong>
                      <Tag minimal intent={getSeverityIntent(prediction.severity)}>
                        {Math.round(prediction.likelihood * 100)}% likely
                      </Tag>
                    </div>
                    <p className="prediction-impact">{prediction.impact}</p>
                    {prediction.preventiveAction && (
                      <div className="preventive-action">
                        <Icon icon={IconNames.LIGHTBULB} size={12} />
                        <span>Suggested: {prediction.preventiveAction}</span>
                        <Button small minimal intent={Intent.PRIMARY}>
                          Apply
                        </Button>
                      </div>
                    )}
                  </Callout>
                ))}
              </div>
            </Collapse>
          </div>

          {/* Quick Actions Bar */}
          {conflicts.length > 0 && (
            <div className="quick-actions-bar">
              <Button
                intent={Intent.SUCCESS}
                icon={IconNames.ENDORSED}
                onClick={() => handleQuickResolve('accept-suggested')}
              >
                Apply All AI Suggestions
              </Button>
              <Button
                minimal
                onClick={onDismiss}
              >
                Review Later
              </Button>
            </div>
          )}
        </Collapse>
      </Card>
    </div>
  );
};

export default InlineConflictResolver;