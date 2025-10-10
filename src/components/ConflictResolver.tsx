import React, { useState, useMemo } from 'react';
import {
  Dialog,
  Button,
  Intent,
  H4,
  H5,
  Card,
  Elevation,
  Tag,
  Icon,
  RadioGroup,
  Radio,
  Callout,
  Classes,
  ProgressBar,
  ButtonGroup
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { CollectionOpportunity, Conflict } from '../types/collectionOpportunities';
import './ConflictResolver.css';

interface ConflictResolverProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: CollectionOpportunity;
  conflicts: Conflict[];
  onResolve: (resolution: ConflictResolution) => Promise<void>;
}

interface ConflictResolution {
  opportunityId: string;
  resolution: 'accept' | 'modify' | 'escalate';
  selectedOption?: ResolutionOption;
  modifications?: any;
  escalationNotes?: string;
}

interface ResolutionOption {
  id: string;
  description: string;
  impact: {
    capacity: number;
    quality: number;
    conflicts: number;
  };
  confidence: number;
  recommended: boolean;
}

export const ConflictResolver: React.FC<ConflictResolverProps> = ({
  isOpen,
  onClose,
  opportunity,
  conflicts,
  onResolve
}) => {
  const [selectedResolution, setSelectedResolution] = useState<'accept' | 'modify' | 'escalate'>('accept');
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isResolving, setIsResolving] = useState(false);

  // Mock resolution options - in real implementation these would come from backend
  const resolutionOptions: ResolutionOption[] = useMemo(() => [
    {
      id: 'opt1',
      description: 'Shift collection window by 30 minutes',
      impact: { capacity: 95, quality: 98, conflicts: 0 },
      confidence: 92,
      recommended: true
    },
    {
      id: 'opt2',
      description: 'Use alternative site (Site B)',
      impact: { capacity: 85, quality: 90, conflicts: 0 },
      confidence: 78,
      recommended: false
    },
    {
      id: 'opt3',
      description: 'Split collection across two passes',
      impact: { capacity: 100, quality: 85, conflicts: 1 },
      confidence: 65,
      recommended: false
    }
  ], []);

  const recommendedOption = resolutionOptions.find(opt => opt.recommended);

  const handleResolve = async () => {
    setIsResolving(true);
    try {
      await onResolve({
        opportunityId: opportunity.id,
        resolution: selectedResolution,
        selectedOption: resolutionOptions.find(opt => opt.id === selectedOption),
        escalationNotes: selectedResolution === 'escalate' ? 'Requires senior analyst review' : undefined
      });
      onClose();
    } finally {
      setIsResolving(false);
    }
  };

  const getImpactIntent = (value: number): Intent => {
    if (value >= 90) return Intent.SUCCESS;
    if (value >= 70) return Intent.WARNING;
    return Intent.DANGER;
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Resolve Collection Conflicts"
      className="conflict-resolver-dialog"
      style={{ width: '600px' }}
    >
      <div className={Classes.DIALOG_BODY}>
        {/* Conflict Summary */}
        <Callout intent={Intent.WARNING} icon={IconNames.WARNING_SIGN}>
          <H5>Active Conflicts ({conflicts.length})</H5>
          <ul className="conflict-summary">
            {conflicts.map((conflict, idx) => (
              <li key={idx}>
                {conflict.reason} - 
                <Tag intent={conflict.severity === 'high' ? Intent.DANGER : Intent.WARNING} minimal>
                  {conflict.severity}
                </Tag>
              </li>
            ))}
          </ul>
        </Callout>

        {/* Resolution Options */}
        <div className="resolution-section">
          <H5>Resolution Options</H5>
          
          {/* Recommended Solution */}
          {recommendedOption && (
            <Card className="recommended-option" elevation={Elevation.TWO}>
              <div className="option-header">
                <Icon icon={IconNames.ENDORSED} intent={Intent.SUCCESS} size={20} />
                <span className="recommended-label">Recommended Solution</span>
              </div>
              <p className="option-description">{recommendedOption.description}</p>
              <div className="option-metrics">
                <div className="metric">
                  <span>Capacity</span>
                  <ProgressBar
                    value={recommendedOption.impact.capacity / 100}
                    intent={getImpactIntent(recommendedOption.impact.capacity)}
                    stripes={false}
                  />
                  <span className="metric-value">{recommendedOption.impact.capacity}%</span>
                </div>
                <div className="metric">
                  <span>Quality</span>
                  <ProgressBar
                    value={recommendedOption.impact.quality / 100}
                    intent={getImpactIntent(recommendedOption.impact.quality)}
                    stripes={false}
                  />
                  <span className="metric-value">{recommendedOption.impact.quality}%</span>
                </div>
                <div className="metric">
                  <span>Confidence</span>
                  <ProgressBar
                    value={recommendedOption.confidence / 100}
                    intent={getImpactIntent(recommendedOption.confidence)}
                    stripes={false}
                  />
                  <span className="metric-value">{recommendedOption.confidence}%</span>
                </div>
              </div>
              <Button
                intent={Intent.PRIMARY}
                fill
                onClick={() => {
                  setSelectedResolution('accept');
                  setSelectedOption(recommendedOption.id);
                }}
              >
                Accept Recommendation
              </Button>
            </Card>
          )}

          {/* Alternative Options */}
          <div className="alternative-options">
            <h6>Alternative Options</h6>
            <RadioGroup
              onChange={(e) => {
                setSelectedOption((e.target as HTMLInputElement).value);
                setSelectedResolution('modify');
              }}
              selectedValue={selectedOption}
            >
              {resolutionOptions.filter(opt => !opt.recommended).map(option => (
                <Radio key={option.id} value={option.id}>
                  <div className="option-radio">
                    <span className="option-text">{option.description}</span>
                    <div className="option-tags">
                      <Tag minimal>Capacity: {option.impact.capacity}%</Tag>
                      <Tag minimal>Quality: {option.impact.quality}%</Tag>
                      <Tag minimal intent={option.confidence > 70 ? Intent.SUCCESS : Intent.WARNING}>
                        {option.confidence}% confident
                      </Tag>
                    </div>
                  </div>
                </Radio>
              ))}
            </RadioGroup>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <ButtonGroup fill>
            <Button
              intent={selectedResolution === 'accept' ? Intent.PRIMARY : Intent.NONE}
              onClick={() => setSelectedResolution('accept')}
              disabled={!selectedOption}
            >
              <Icon icon={IconNames.TICK} />
              Accept{selectedResolution === 'accept' && selectedOption === recommendedOption?.id ? ' Recommendation' : ''}
            </Button>
            <Button
              intent={selectedResolution === 'modify' ? Intent.PRIMARY : Intent.NONE}
              onClick={() => setSelectedResolution('modify')}
              disabled={!selectedOption || selectedOption === recommendedOption?.id}
            >
              <Icon icon={IconNames.EDIT} />
              Use Alternative
            </Button>
            <Button
              intent={selectedResolution === 'escalate' ? Intent.WARNING : Intent.NONE}
              onClick={() => setSelectedResolution('escalate')}
            >
              <Icon icon={IconNames.PERSON} />
              Escalate
            </Button>
          </ButtonGroup>
        </div>
      </div>

      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button onClick={onClose} disabled={isResolving}>
            Cancel
          </Button>
          <Button
            intent={Intent.PRIMARY}
            onClick={handleResolve}
            loading={isResolving}
            disabled={selectedResolution !== 'escalate' && !selectedOption}
          >
            {selectedResolution === 'escalate' ? 'Escalate to Senior Analyst' : 'Apply Resolution'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};