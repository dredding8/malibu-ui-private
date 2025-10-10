import React from 'react';
import {
  Dialog,
  DialogBody,
  DialogFooter,
  Button,
  Intent,
  Tab,
  Tabs,
  TabId,
  Card,
  Tag,
  Icon,
  H3,
  H4,
  Divider,
  Classes,
  ButtonGroup,
  ProgressBar,
  Callout
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import {
  CollectionOpportunity,
  Pass,
  Site,
  OverrideExportIndicator,
  createExportIndicator
} from '../types/collectionOpportunities';
import { calculateOpportunityHealth } from '../utils/opportunityHealth';
import OpportunityStatusIndicatorEnhanced from './OpportunityStatusIndicatorEnhanced';
import DataIntegrityIndicator from './DataIntegrityIndicator';
import { OverrideExportBadge } from './OverrideExportBadge';
import './OpportunityDetailsModal.css';

interface OpportunityDetailsModalProps {
  isOpen: boolean;
  opportunity: CollectionOpportunity | null;
  passes: Pass[];
  onClose: () => void;
  onValidate?: (opportunityId: string) => void;
  onEdit?: (opportunityId: string) => void;
  onOpenWorkspace?: (opportunityId: string) => void;
  capacityThresholds?: {
    critical: number;
    warning: number;
    optimal: number;
  };
  showValidationOption?: boolean;
  showWorkspaceOption?: boolean;
}

export const OpportunityDetailsModal: React.FC<OpportunityDetailsModalProps> = ({
  isOpen,
  opportunity,
  passes,
  onClose,
  onValidate,
  onEdit,
  onOpenWorkspace,
  capacityThresholds = { critical: 10, warning: 30, optimal: 70 },
  showValidationOption = true,
  showWorkspaceOption = false
}) => {
  const [selectedTab, setSelectedTab] = React.useState<TabId>('overview');

  if (!opportunity) return null;

  const health = calculateOpportunityHealth(opportunity, capacityThresholds);
  const relevantPasses = passes.filter(p => 
    p.metadata?.satellite === opportunity.satellite.name
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="opportunity-details-header" data-testid="opportunity-details">
          <H3>{opportunity.name}</H3>
          <OpportunityStatusIndicatorEnhanced
            status={opportunity.status}
            health={health}
            showHealthScore={true}
          />
        </div>
      }
      className="opportunity-details-modal"
      style={{ width: '80%', maxWidth: '900px' }}
    >
      <DialogBody>
        <Tabs
          id="opportunity-tabs"
          selectedTabId={selectedTab}
          onChange={(newTab: TabId) => setSelectedTab(newTab)}
          className="opportunity-detail-tabs"
        >
          <Tab
            id="overview"
            title="Overview"
            panel={
              <div className="tab-panel">
                {/* Basic Information */}
                <Card className="info-card">
                  <H4>Basic Information</H4>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="label">Satellite:</span>
                      <span className="value">{opportunity.satellite.name}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Priority:</span>
                      <Tag intent={
                        opportunity.priority === 'critical' ? Intent.DANGER :
                        opportunity.priority === 'high' ? Intent.WARNING :
                        Intent.NONE
                      }>
                        {opportunity.priority}
                      </Tag>
                    </div>
                    <div className="info-item">
                      <span className="label">Status:</span>
                      <Tag intent={
                        opportunity.matchStatus === 'optimal' ? Intent.SUCCESS :
                        opportunity.matchStatus === 'suboptimal' ? Intent.WARNING :
                        Intent.DANGER
                      }>
                        {opportunity.matchStatus}
                      </Tag>
                    </div>
                    <div className="info-item">
                      <span className="label">Match Quality:</span>
                      <span className="value">{opportunity.matchQuality}%</span>
                    </div>
                  </div>
                </Card>

                {/* Override Indicator */}
                {opportunity.overrideJustification && (
                  <Card className="override-card">
                    <OverrideExportBadge
                      indicator={createExportIndicator(opportunity.overrideJustification)}
                      variant="card"
                      showDetails={true}
                    />
                  </Card>
                )}

                {/* Capacity Information */}
                <Card className="capacity-card">
                  <H4>Capacity Analysis</H4>
                  <div className="capacity-details">
                    <div className="capacity-metric">
                      <span className="metric-label">Current Usage</span>
                      <span className={`metric-value ${health.level}`}>
                        {opportunity.capacityPercentage}%
                      </span>
                    </div>
                    <ProgressBar
                      value={opportunity.capacityPercentage / 100}
                      intent={
                        health.level === 'critical' ? Intent.DANGER :
                        health.level === 'warning' ? Intent.WARNING :
                        Intent.SUCCESS
                      }
                      stripes={false}
                      animate={false}
                    />
                    <div className="threshold-indicators">
                      <div className="threshold">
                        <Icon icon={IconNames.DOT} color="#0f9960" size={12} />
                        <span>Optimal: &lt;{capacityThresholds.optimal}%</span>
                      </div>
                      <div className="threshold">
                        <Icon icon={IconNames.DOT} color="#d13913" size={12} />
                        <span>Warning: &lt;{capacityThresholds.warning}%</span>
                      </div>
                      <div className="threshold">
                        <Icon icon={IconNames.DOT} color="#db3737" size={12} />
                        <span>Critical: &lt;{capacityThresholds.critical}%</span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Data Integrity */}
                {opportunity.dataIntegrityIssues && opportunity.dataIntegrityIssues.length > 0 && (
                  <Card className="integrity-card">
                    <H4>Data Integrity Issues</H4>
                    <DataIntegrityIndicator issues={opportunity.dataIntegrityIssues} />
                  </Card>
                )}
              </div>
            }
          />
          
          <Tab
            id="passes"
            title={`Passes (${relevantPasses.length})`}
            panel={
              <div className="tab-panel passes-panel">
                <Card>
                  <H4>Available Collection Windows</H4>
                  {relevantPasses.length === 0 ? (
                    <Callout intent={Intent.WARNING} icon={IconNames.INFO_SIGN}>
                      No passes available for this satellite in the selected timeframe.
                    </Callout>
                  ) : (
                    <div className="passes-list">
                      {relevantPasses.map(pass => (
                        <div key={pass.id} className="pass-item">
                          <div className="pass-header">
                            <span className="pass-name">{pass.name}</span>
                            <Tag intent={
                              pass.priority === 'critical' ? Intent.DANGER :
                              pass.priority === 'high' ? Intent.WARNING :
                              Intent.NONE
                            }>
                              {pass.priority}
                            </Tag>
                          </div>
                          <div className="pass-details">
                            <div className="pass-time">
                              <Icon icon={IconNames.TIME} size={12} />
                              <span>
                                {new Date(pass.startTime).toLocaleString()} - 
                                {new Date(pass.endTime).toLocaleString()}
                              </span>
                            </div>
                            <div className="pass-metrics">
                              <span>Quality: {pass.quality}/5</span>
                              <span>Elevation: {pass.elevation}°</span>
                              <span>Duration: {pass.duration}m</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            }
          />
          
          <Tab
            id="sites"
            title="Site Allocation"
            panel={
              <div className="tab-panel sites-panel">
                <Card>
                  <H4>Allocated Sites</H4>
                  <div className="sites-list">
                    {opportunity.siteAllocations.map((allocation, idx) => (
                      <div key={idx} className="site-item">
                        <div className="site-header">
                          <span className="site-name">{allocation.site.name}</span>
                          <Tag minimal>{allocation.matchConfidence}% match</Tag>
                        </div>
                        <div className="site-details">
                          <span>Location: {allocation.site.location}</span>
                          <span>Capabilities: {allocation.site.capabilities.join(', ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            }
          />
        </Tabs>
      </DialogBody>
      
      <DialogFooter>
        <div className="footer-actions">
          <div className="left-actions">
            {showValidationOption && (
              <Button
                icon={IconNames.ENDORSED}
                text="Validate Plan"
                intent={Intent.PRIMARY}
                onClick={() => {
                  onValidate?.(opportunity.id);
                  onClose();
                }}
                data-testid="validate-opportunity-button"
              />
            )}
            {showWorkspaceOption && (
              <Button
                icon={IconNames.FLOWS}
                text="Open in Workspace"
                onClick={() => {
                  onOpenWorkspace?.(opportunity.id);
                  onClose();
                }}
              />
            )}
            <Button
              icon={IconNames.EDIT}
              text="Edit"
              onClick={() => {
                onEdit?.(opportunity.id);
                onClose();
              }}
            />
          </div>
          <Button
            text="Close"
            onClick={onClose}
          />
        </div>
      </DialogFooter>
    </Dialog>
  );
};

export default OpportunityDetailsModal;