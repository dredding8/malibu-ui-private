import React from 'react';
import {
  Card,
  Tag,
  Intent,
  Button,
  Collapse,
  Icon,
  ProgressBar,
  Colors,
  Classes
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { Pass, Site } from '../types/collectionOpportunities';
import {
  formatDurationThreshold,
  getDurationIntent,
  getPassDuration
} from '../utils/durationFormatting';
import './PassInformationPanel.css';

interface PassInformationPanelProps {
  passes: Pass[];
  sites: Site[];
  isOpen: boolean;
  onToggle: () => void;
  onApprove?: (passId: string) => void;
  onReject?: (passId: string) => void;
  onOverride?: (passId: string) => void;
}

/**
 * PassInformationPanel - Displays detailed pass information with time windows
 * Addresses JTBD 1: Verify and Validate System-Generated Plans
 */
export const PassInformationPanel: React.FC<PassInformationPanelProps> = ({
  passes,
  sites,
  isOpen,
  onToggle,
  onApprove,
  onReject,
  onOverride
}) => {
  const formatTimeWindow = (start: Date, end: Date): string => {
    const duration = (new Date(end).getTime() - new Date(start).getTime()) / 1000;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  };

  const getQualityIntent = (quality: number): Intent => {
    if (quality >= 4) return Intent.SUCCESS;
    if (quality >= 3) return Intent.WARNING;
    return Intent.DANGER;
  };

  const getQualityLabel = (quality: number): string => {
    if (quality >= 4.5) return 'Excellent';
    if (quality >= 4) return 'Good';
    if (quality >= 3) return 'Fair';
    if (quality >= 2) return 'Poor';
    return 'Critical';
  };

  return (
    <div className="pass-information-panel">
      <div className="panel-header" onClick={onToggle}>
        <Icon icon={isOpen ? IconNames.CHEVRON_DOWN : IconNames.CHEVRON_RIGHT} />
        <span className="panel-title">
          <Icon icon={IconNames.SATELLITE} />
          Collection Windows ({passes.length} passes)
        </span>
        {!isOpen && (
          <Tag minimal intent={Intent.PRIMARY}>
            Next: {new Date(passes[0]?.startTime).toLocaleTimeString()}
          </Tag>
        )}
      </div>

      <Collapse isOpen={isOpen}>
        <div className="passes-container">
          {passes.map((pass, index) => (
            <Card key={pass.id} className="pass-card" elevation={1}>
              <div className="pass-header">
                <div className="pass-timing">
                  <Icon icon={IconNames.TIME} />
                  <strong>{new Date(pass.startTime).toLocaleTimeString()}</strong>
                  <span className={Classes.TEXT_MUTED}>to</span>
                  <strong>{new Date(pass.endTime).toLocaleTimeString()}</strong>
                  <Tag minimal>{formatTimeWindow(pass.startTime, pass.endTime)}</Tag>
                </div>
                <Tag intent={getQualityIntent(pass.quality)} large>
                  {getQualityLabel(pass.quality)} ({pass.quality}/5)
                </Tag>
              </div>

              <div className="pass-details">
                <div className="detail-row">
                  <span className="detail-label">
                    <Icon icon={IconNames.CELL_TOWER} />
                    Downlink Site:
                  </span>
                  <span className="detail-value">
                    {pass.metadata?.downlinkSite || 'Auto-assigned'}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">
                    <Icon icon={IconNames.DASHBOARD} />
                    Sensor:
                  </span>
                  <span className="detail-value">
                    {pass.metadata?.sensor || 'Multi-sensor'}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">
                    <Icon icon={IconNames.LOCK} />
                    Classification:
                  </span>
                  <Tag minimal intent={Intent.WARNING}>
                    {pass.classificationLevel}
                  </Tag>
                </div>

                <div className="detail-row">
                  <span className="detail-label">
                    <Icon icon={IconNames.FLAG} />
                    Priority:
                  </span>
                  <Tag
                    minimal
                    intent={
                      pass.priority === 'critical' ? Intent.DANGER :
                      pass.priority === 'high' ? Intent.WARNING :
                      Intent.NONE
                    }
                  >
                    {pass.priority.toUpperCase()}
                  </Tag>
                </div>

                {/* WEEK 3: Duration Display with Threshold Formatting */}
                <div className="detail-row">
                  <span className="detail-label">
                    <Icon icon={IconNames.TIME} />
                    Duration:
                  </span>
                  <Tag
                    intent={getDurationIntent(getPassDuration(pass.startTime, pass.endTime))}
                    large
                  >
                    {formatDurationThreshold(getPassDuration(pass.startTime, pass.endTime))}
                  </Tag>
                </div>
              </div>

              <div className="pass-quality-metrics">
                <div className="metric">
                  <span className="metric-label">Elevation Angle</span>
                  <ProgressBar 
                    value={0.75} 
                    intent={Intent.SUCCESS}
                    stripes={false}
                  />
                  <span className="metric-value">45°</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Weather Risk</span>
                  <ProgressBar 
                    value={0.2} 
                    intent={Intent.SUCCESS}
                    stripes={false}
                  />
                  <span className="metric-value">Low</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Site Capacity</span>
                  <ProgressBar 
                    value={0.65} 
                    intent={Intent.WARNING}
                    stripes={false}
                  />
                  <span className="metric-value">65%</span>
                </div>
              </div>

              <div className="pass-actions">
                {onApprove && (
                  <Button
                    intent={Intent.SUCCESS}
                    icon={IconNames.TICK}
                    onClick={() => onApprove(pass.id)}
                  >
                    Approve Pass
                  </Button>
                )}
                {onReject && (
                  <Button
                    intent={Intent.DANGER}
                    icon={IconNames.CROSS}
                    onClick={() => onReject(pass.id)}
                  >
                    Reject
                  </Button>
                )}
                {onOverride && (
                  <Button
                    intent={Intent.WARNING}
                    icon={IconNames.EDIT}
                    onClick={() => onOverride(pass.id)}
                  >
                    Override
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </Collapse>
    </div>
  );
};

export default PassInformationPanel;