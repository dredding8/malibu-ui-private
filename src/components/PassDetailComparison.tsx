import React, { useMemo, useState } from 'react';
import {
  Card,
  Tag,
  Intent,
  Button,
  HTMLSelect,
  FormGroup,
  Switch,
  Callout,
  Collapse,
  Divider,
  NumericInput,
  TextArea,
  Alert,
  Tooltip,
} from '@blueprintjs/core';
import {
  Table2,
  Column,
  Cell,
  ColumnHeaderCell,
  RenderMode,
} from '@blueprintjs/table';
import { IconNames } from '@blueprintjs/icons';
import { Icon } from '../utils/blueprintIconWrapper';
import {
  CollectionOpportunity,
  Site,
  Satellite,
  Priority,
  PassId,
  SiteId,
} from '../types/collectionOpportunities';
import './PassDetailComparison.css';

// Enhanced Pass Detail Interface
export interface PassDetail {
  readonly id: PassId;
  readonly opportunityId: string;
  readonly siteId: SiteId;
  readonly siteName: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly duration: number; // minutes
  readonly elevation: number; // degrees
  readonly azimuth: number; // degrees
  readonly weatherRisk: 'low' | 'medium' | 'high';
  readonly capacity: number;
  readonly allocated: number;
  readonly isBaseline: boolean;
  readonly isAlternative: boolean;
  readonly conflictLevel: 'none' | 'minor' | 'major' | 'critical';
  readonly impactScore: number; // 0-100, higher = more impact if overridden
}

// Override Justification Types
export interface OverrideJustification {
  reason: OverrideReason;
  priority: Priority;
  classification: 'unclassified' | 'confidential' | 'secret' | 'top_secret';
  justificationText: string;
  riskAcceptance: boolean;
  approverRequired: boolean;
  timeConstraints?: {
    validFrom: string;
    validUntil: string;
  };
  specialInstructions?: string;
}

export type OverrideReason = 
  | 'operational_priority'
  | 'weather_conditions'
  | 'equipment_maintenance'
  | 'mission_critical'
  | 'capacity_optimization'
  | 'quality_improvement'
  | 'schedule_conflict'
  | 'resource_availability'
  | 'emergency_requirement'
  | 'other';

export interface PassDetailComparisonProps {
  baselinePasses: PassDetail[];
  alternativePasses: PassDetail[];
  selectedOverrides: Set<PassId>;
  onOverrideSelect: (passId: PassId, isSelected: boolean) => void;
  onJustificationChange: (justification: OverrideJustification) => void;
  currentJustification?: OverrideJustification;
  readOnly?: boolean;
  showAdvancedMetrics?: boolean;
}

export const PassDetailComparison: React.FC<PassDetailComparisonProps> = ({
  baselinePasses,
  alternativePasses,
  selectedOverrides,
  onOverrideSelect,
  onJustificationChange,
  currentJustification,
  readOnly = false,
  showAdvancedMetrics = false,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showJustificationForm, setShowJustificationForm] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('impactScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterConflicts, setFilterConflicts] = useState<boolean>(false);
  const [showClassificationAlert, setShowClassificationAlert] = useState(false);

  // Combine and sort pass data
  const combinedPasses = useMemo(() => {
    const allPasses = [
      ...baselinePasses.map(pass => ({ ...pass, type: 'baseline' as const })),
      ...alternativePasses.map(pass => ({ ...pass, type: 'alternative' as const })),
    ];

    return allPasses
      .filter(pass => !filterConflicts || pass.conflictLevel !== 'none')
      .sort((a, b) => {
        const aValue = a[sortColumn as keyof PassDetail] as number;
        const bValue = b[sortColumn as keyof PassDetail] as number;
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      });
  }, [baselinePasses, alternativePasses, sortColumn, sortDirection, filterConflicts]);

  // Calculate impact metrics
  const impactMetrics = useMemo(() => {
    const selectedPasses = combinedPasses.filter(pass => selectedOverrides.has(pass.id));
    const totalImpact = selectedPasses.reduce((sum, pass) => sum + pass.impactScore, 0);
    const conflictCount = selectedPasses.filter(pass => pass.conflictLevel !== 'none').length;

    return {
      totalImpact,
      conflictCount,
      selectedCount: selectedPasses.length,
    };
  }, [combinedPasses, selectedOverrides]);

  const handleJustificationUpdate = (updates: Partial<OverrideJustification>) => {
    const newJustification: OverrideJustification = {
      reason: 'operational_priority',
      priority: 'medium',
      classification: 'unclassified',
      justificationText: '',
      riskAcceptance: false,
      approverRequired: false,
      ...currentJustification,
      ...updates,
    };

    onJustificationChange(newJustification);

    // Show classification alert for classified content
    if (updates.classification && updates.classification !== 'unclassified') {
      setShowClassificationAlert(true);
    }
  };

  // Table Columns
  const renderSelectionCell = (rowIndex: number) => {
    const pass = combinedPasses[rowIndex];
    return (
      <Cell>
        <Switch
          checked={selectedOverrides.has(pass.id)}
          onChange={(e) => onOverrideSelect(pass.id, e.currentTarget.checked)}
          disabled={readOnly}
        />
      </Cell>
    );
  };

  const renderTypeCell = (rowIndex: number) => {
    const pass = combinedPasses[rowIndex];
    return (
      <Cell>
        <Tag
          intent={pass.type === 'baseline' ? Intent.SUCCESS : Intent.WARNING}
          minimal
        >
          {pass.type === 'baseline' ? 'Baseline' : 'Alternative'}
        </Tag>
      </Cell>
    );
  };

  const renderSiteCell = (rowIndex: number) => {
    const pass = combinedPasses[rowIndex];
    return (
      <Cell>
        <div className="site-cell">
          <strong>{pass.siteName}</strong>
          {pass.conflictLevel !== 'none' && (
            <Tag
              intent={
                pass.conflictLevel === 'critical' ? Intent.DANGER :
                pass.conflictLevel === 'major' ? Intent.WARNING :
                Intent.NONE
              }
              minimal
              small
            >
              {pass.conflictLevel} conflict
            </Tag>
          )}
        </div>
      </Cell>
    );
  };

  const renderTimeCell = (rowIndex: number) => {
    const pass = combinedPasses[rowIndex];
    return (
      <Cell>
        <div className="time-cell">
          <div>{new Date(pass.startTime).toLocaleTimeString()}</div>
          <div className="text-muted">{pass.duration}m duration</div>
        </div>
      </Cell>
    );
  };


  const renderCapacityCell = (rowIndex: number) => {
    const pass = combinedPasses[rowIndex];
    const utilization = (pass.allocated / pass.capacity) * 100;
    return (
      <Cell>
        <div className="capacity-cell">
          <div>{pass.allocated}/{pass.capacity}</div>
          <Tag
            intent={
              utilization >= 90 ? Intent.DANGER :
              utilization >= 70 ? Intent.WARNING :
              Intent.SUCCESS
            }
            minimal
          >
            {utilization.toFixed(0)}%
          </Tag>
        </div>
      </Cell>
    );
  };

  const renderImpactCell = (rowIndex: number) => {
    const pass = combinedPasses[rowIndex];
    return (
      <Cell>
        <Tag
          intent={
            pass.impactScore >= 80 ? Intent.DANGER :
            pass.impactScore >= 60 ? Intent.WARNING :
            Intent.SUCCESS
          }
        >
          {pass.impactScore}
        </Tag>
      </Cell>
    );
  };

  if (viewMode === 'cards') {
    return (
      <div className="pass-detail-comparison">
        <div className="comparison-header">
          <div className="view-controls">
            <Button
              icon={IconNames.TH}
              active={viewMode === 'table'}
              onClick={() => setViewMode('table')}
            >
              Table
            </Button>
            <Button
              icon={IconNames.GRID_VIEW}
              active={viewMode === 'cards'}
              onClick={() => setViewMode('cards')}
            >
              Cards
            </Button>
          </div>
          
          <div className="filter-controls">
            <Switch
              label="Show conflicts only"
              checked={filterConflicts}
              onChange={(e) => setFilterConflicts(e.currentTarget.checked)}
            />
          </div>
        </div>

        <div className="pass-cards-grid">
          {combinedPasses.map((pass) => (
            <Card key={pass.id} className={`pass-card ${selectedOverrides.has(pass.id) ? 'selected' : ''}`}>
              <div className="card-header">
                <Switch
                  checked={selectedOverrides.has(pass.id)}
                  onChange={(e) => onOverrideSelect(pass.id, e.currentTarget.checked)}
                  disabled={readOnly}
                />
                <Tag intent={pass.type === 'baseline' ? Intent.SUCCESS : Intent.WARNING}>
                  {pass.type}
                </Tag>
              </div>
              
              <div className="card-content">
                <h4>{pass.siteName}</h4>
                <div className="pass-metrics">
                  <div className="metric">
                    <Icon icon={IconNames.TIME} />
                    <span>{new Date(pass.startTime).toLocaleTimeString()}</span>
                  </div>
                  <div className="metric">
                    <Icon icon={IconNames.STOPWATCH} />
                    <span>{pass.duration}m</span>
                  </div>
                  <div className="metric">
                    <Icon icon={IconNames.DATABASE} />
                    <span>Capacity: {pass.allocated}/{pass.capacity}</span>
                  </div>
                </div>

                {pass.conflictLevel !== 'none' && (
                  <Callout
                    intent={
                      pass.conflictLevel === 'critical' ? Intent.DANGER :
                      pass.conflictLevel === 'major' ? Intent.WARNING :
                      Intent.NONE
                    }
                    size="small"
                  >
                    {pass.conflictLevel} conflict detected
                  </Callout>
                )}
              </div>
            </Card>
          ))}
        </div>

        {!readOnly && (
          <div className="justification-section">
            <Button
              icon={IconNames.EDIT}
              intent={Intent.PRIMARY}
              onClick={() => setShowJustificationForm(!showJustificationForm)}
            >
              {showJustificationForm ? 'Hide' : 'Add'} Override Justification
            </Button>
          </div>
        )}

        {renderJustificationForm()}
      </div>
    );
  }

  function renderJustificationForm() {
    if (!showJustificationForm) return null;

    return (
      <Collapse isOpen={showJustificationForm}>
        <Card className="justification-form">
          <h3>Override Justification</h3>
          
          <div className="form-grid">
            <FormGroup label="Override Reason" className="reason-group">
              <HTMLSelect
                value={currentJustification?.reason || 'operational_priority'}
                onChange={(e) => handleJustificationUpdate({ 
                  reason: e.target.value as OverrideReason 
                })}
                disabled={readOnly}
              >
                <option value="operational_priority">Operational Priority</option>
                <option value="weather_conditions">Weather Conditions</option>
                <option value="equipment_maintenance">Equipment Maintenance</option>
                <option value="mission_critical">Mission Critical</option>
                <option value="capacity_optimization">Capacity Optimization</option>
                <option value="quality_improvement">Quality Improvement</option>
                <option value="schedule_conflict">Schedule Conflict</option>
                <option value="resource_availability">Resource Availability</option>
                <option value="emergency_requirement">Emergency Requirement</option>
                <option value="other">Other</option>
              </HTMLSelect>
            </FormGroup>

            <FormGroup label="Priority Level" className="priority-group">
              <HTMLSelect
                value={currentJustification?.priority || 'medium'}
                onChange={(e) => handleJustificationUpdate({ 
                  priority: e.target.value as Priority 
                })}
                disabled={readOnly}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </HTMLSelect>
            </FormGroup>

            <FormGroup label="Classification" className="classification-group">
              <HTMLSelect
                value={currentJustification?.classification || 'unclassified'}
                onChange={(e) => handleJustificationUpdate({ 
                  classification: e.target.value as OverrideJustification['classification']
                })}
                disabled={readOnly}
              >
                <option value="unclassified">Unclassified</option>
                <option value="confidential">Confidential</option>
                <option value="secret">Secret</option>
                <option value="top_secret">Top Secret</option>
              </HTMLSelect>
            </FormGroup>
          </div>

          <FormGroup 
            label="Justification Details" 
            helperText="Provide detailed reasoning for the override"
            className="justification-text-group"
          >
            <TextArea
              fill
              rows={4}
              value={currentJustification?.justificationText || ''}
              onChange={(e) => handleJustificationUpdate({ 
                justificationText: e.target.value 
              })}
              placeholder="Enter detailed justification for the override..."
              disabled={readOnly}
            />
          </FormGroup>

          <div className="checkbox-group">
            <Switch
              label="Risk Acceptance"
              checked={currentJustification?.riskAcceptance || false}
              onChange={(e) => handleJustificationUpdate({ 
                riskAcceptance: e.currentTarget.checked 
              })}
              disabled={readOnly}
            />
            <Switch
              label="Approver Required"
              checked={currentJustification?.approverRequired || false}
              onChange={(e) => handleJustificationUpdate({ 
                approverRequired: e.currentTarget.checked 
              })}
              disabled={readOnly}
            />
          </div>

          <FormGroup label="Special Instructions" className="instructions-group">
            <TextArea
              fill
              rows={2}
              value={currentJustification?.specialInstructions || ''}
              onChange={(e) => handleJustificationUpdate({ 
                specialInstructions: e.target.value 
              })}
              placeholder="Additional instructions or constraints..."
              disabled={readOnly}
            />
          </FormGroup>

          <Alert
            isOpen={showClassificationAlert}
            onClose={() => setShowClassificationAlert(false)}
            intent={Intent.WARNING}
            icon={IconNames.WARNING_SIGN}
            confirmButtonText="I Understand"
          >
            <p>
              <strong>Classification Notice:</strong> You have selected a classified level. 
              Ensure all information adheres to security protocols.
            </p>
          </Alert>
        </Card>
      </Collapse>
    );
  }

  // Table View
  return (
    <div className="pass-detail-comparison">
      <div className="comparison-header">
        <div className="view-controls">
          <Button
            icon={IconNames.TH}
            active={viewMode === 'table'}
            onClick={() => setViewMode('table')}
          >
            Table
          </Button>
          <Button
            icon={IconNames.GRID_VIEW}
            active={viewMode === 'cards'}
            onClick={() => setViewMode('cards')}
          >
            Cards
          </Button>
        </div>
        
        <div className="filter-controls">
          <Switch
            label="Show conflicts only"
            checked={filterConflicts}
            onChange={(e) => setFilterConflicts(e.currentTarget.checked)}
          />
        </div>

        <div className="metrics-summary">
          <Tag intent={Intent.PRIMARY}>
            {impactMetrics.selectedCount} selected
          </Tag>
          {impactMetrics.conflictCount > 0 && (
            <Tag intent={Intent.WARNING}>
              {impactMetrics.conflictCount} conflicts
            </Tag>
          )}
        </div>
      </div>

      <div className="comparison-table">
        <Table2
          numRows={combinedPasses.length}
          renderMode={RenderMode.NONE}
          enableRowResizing={false}
          enableColumnResizing={true}
          enableRowSelection={false}
          enableGhostCells={false}
          className="pass-detail-table"
        >
          <Column
            name="Select"
            cellRenderer={renderSelectionCell}
            columnHeaderCellRenderer={() => <ColumnHeaderCell name="Select" />}
          />
          <Column
            name="Type"
            cellRenderer={renderTypeCell}
            columnHeaderCellRenderer={() => <ColumnHeaderCell name="Type" />}
          />
          <Column
            name="Site"
            cellRenderer={renderSiteCell}
            columnHeaderCellRenderer={() => <ColumnHeaderCell name="Site" />}
          />
          <Column
            name="Time"
            cellRenderer={renderTimeCell}
            columnHeaderCellRenderer={() => <ColumnHeaderCell name="Time" />}
          />
          <Column
            name="Capacity"
            cellRenderer={renderCapacityCell}
            columnHeaderCellRenderer={() => <ColumnHeaderCell name="Capacity" />}
          />
          {showAdvancedMetrics && (
            <Column
              name="Impact"
              cellRenderer={renderImpactCell}
              columnHeaderCellRenderer={() => <ColumnHeaderCell name="Impact Score" />}
            />
          )}
        </Table2>
      </div>

      {!readOnly && (
        <div className="justification-section">
          <Button
            icon={IconNames.EDIT}
            intent={Intent.PRIMARY}
            onClick={() => setShowJustificationForm(!showJustificationForm)}
          >
            {showJustificationForm ? 'Hide' : 'Add'} Override Justification
          </Button>
        </div>
      )}

      {renderJustificationForm()}
    </div>
  );
};

export default PassDetailComparison;