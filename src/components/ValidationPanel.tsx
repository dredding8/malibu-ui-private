import React, { useState, useMemo } from 'react';
import {
  Card,
  Button,
  ButtonGroup,
  Intent,
  Icon,
  Tag,
  Callout,
  ProgressBar,
  H3,
  H4,
  Divider,
  NonIdealState,
  Spinner,
  Alert,
  Tooltip,
  Position,
  Classes
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { CollectionOpportunity, Pass, Site } from '../types/collectionOpportunities';
import { calculateOpportunityHealth } from '../utils/opportunityHealth';
import './ValidationPanel.css';

interface ValidationPanelProps {
  opportunity: CollectionOpportunity;
  passes: Pass[];
  onValidationComplete: (results: ValidationResults) => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  capacityThresholds?: {
    critical: number;
    warning: number;
    optimal: number;
  };
}

interface ValidationResults {
  passesValid: boolean;
  capacityValid: boolean;
  conflictsResolved: boolean;
  overallValid: boolean;
  issues: ValidationIssue[];
}

interface ValidationIssue {
  type: 'pass' | 'capacity' | 'conflict' | 'data';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  resolution?: string;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  opportunity,
  passes,
  onValidationComplete,
  onApprove,
  onReject,
  capacityThresholds = { critical: 10, warning: 30, optimal: 70 }
}) => {
  const [validationState, setValidationState] = useState<'idle' | 'validating' | 'completed'>('idle');
  const [validationResults, setValidationResults] = useState<ValidationResults | null>(null);
  const [selectedPasses, setSelectedPasses] = useState<Set<string>>(new Set());
  const [isValidatingPasses, setIsValidatingPasses] = useState(false);
  const [isValidatingCapacity, setIsValidatingCapacity] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Calculate health metrics
  const health = useMemo(() => 
    calculateOpportunityHealth(opportunity, capacityThresholds),
    [opportunity, capacityThresholds]
  );

  // Validate passes
  const handleVerifyPasses = async () => {
    setIsValidatingPasses(true);
    
    // Simulate validation process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const validPasses = passes.filter(pass => {
      // Check pass window validity
      const now = new Date();
      const passStart = new Date(pass.startTime);
      const passEnd = new Date(pass.endTime);
      return passStart > now && passEnd > passStart;
    });

    const passesValid = validPasses.length === passes.length;
    
    setIsValidatingPasses(false);
    
    // Update validation results
    const issues: ValidationIssue[] = [];
    if (!passesValid) {
      issues.push({
        type: 'pass',
        severity: 'warning',
        message: `${passes.length - validPasses.length} passes have timing issues`,
        resolution: 'Review and update pass windows'
      });
    }

    return { passesValid, issues };
  };

  // Validate capacity
  const handleValidateCapacity = async () => {
    setIsValidatingCapacity(true);
    
    // Simulate capacity check
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const capacityValid = opportunity.capacityPercentage <= capacityThresholds.optimal;
    const issues: ValidationIssue[] = [];
    
    if (!capacityValid) {
      issues.push({
        type: 'capacity',
        severity: health.level === 'critical' ? 'critical' : 'warning',
        message: `Capacity at ${opportunity.capacityPercentage}% exceeds optimal threshold`,
        resolution: 'Consider reallocating to alternative sites'
      });
    }
    
    setIsValidatingCapacity(false);
    return { capacityValid, issues };
  };

  // Complete validation
  const handleCompleteValidation = async () => {
    setValidationState('validating');
    
    const passValidation = await handleVerifyPasses();
    const capacityValidation = await handleValidateCapacity();
    
    const results: ValidationResults = {
      passesValid: passValidation.passesValid,
      capacityValid: capacityValidation.capacityValid,
      conflictsResolved: opportunity.conflicts.length === 0,
      overallValid: passValidation.passesValid && 
                   capacityValidation.capacityValid && 
                   opportunity.conflicts.length === 0,
      issues: [...passValidation.issues, ...capacityValidation.issues]
    };
    
    if (opportunity.conflicts.length > 0) {
      results.issues.push({
        type: 'conflict',
        severity: 'critical',
        message: `${opportunity.conflicts.length} unresolved conflicts`,
        resolution: 'Resolve conflicts before approval'
      });
    }
    
    setValidationResults(results);
    setValidationState('completed');
    onValidationComplete(results);
  };

  // Handle approval
  const handleApprove = () => {
    if (validationResults?.overallValid) {
      onApprove();
    }
  };

  // Handle rejection
  const handleReject = () => {
    if (rejectReason.trim()) {
      onReject(rejectReason);
      setShowRejectDialog(false);
      setRejectReason('');
    }
  };

  return (
    <div className="validation-panel" data-testid="validation-panel">
      <Card className="validation-header">
        <H3>
          <Icon icon={IconNames.ENDORSED} /> Validation Panel
        </H3>
        <p className={Classes.TEXT_MUTED}>
          Verify and validate collection plan for {opportunity.name}
        </p>
      </Card>

      {/* Pass Validation Section */}
      <Card className="validation-section">
        <div className="section-header">
          <H4>Pass Verification</H4>
          <Button
            data-testid="verify-passes-button"
            icon={IconNames.SATELLITE}
            text="Verify Passes"
            onClick={handleVerifyPasses}
            loading={isValidatingPasses}
            intent={validationResults?.passesValid ? Intent.SUCCESS : Intent.PRIMARY}
          />
        </div>
        
        {passes.length === 0 ? (
          <NonIdealState
            icon={IconNames.TIMELINE_EVENTS}
            title="No passes available"
            description="Add passes to validate collection windows"
          />
        ) : (
          <div data-testid="pass-validation-results" className="validation-results">
            <div className="passes-summary">
              <Tag large minimal>
                {passes.length} Total Passes
              </Tag>
              <Tag large minimal intent={Intent.PRIMARY}>
                {passes.filter(p => new Date(p.startTime) > new Date()).length} Upcoming
              </Tag>
            </div>
            
            {validationResults && (
              <div className="validation-status" data-testid="pass-validation-status">
                {validationResults.passesValid ? (
                  <Callout intent={Intent.SUCCESS} icon={IconNames.TICK}>
                    All passes validated successfully
                  </Callout>
                ) : (
                  <Callout intent={Intent.WARNING} icon={IconNames.WARNING_SIGN}>
                    Pass validation issues found
                  </Callout>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Capacity Validation Section */}
      <Card className="validation-section">
        <div className="section-header">
          <H4>Capacity Validation</H4>
          <Button
            data-testid="validate-capacity-button"
            icon={IconNames.DASHBOARD}
            text="Validate Capacity"
            onClick={handleValidateCapacity}
            loading={isValidatingCapacity}
            intent={validationResults?.capacityValid ? Intent.SUCCESS : Intent.PRIMARY}
          />
        </div>
        
        <div data-testid="capacity-validation-status" className="capacity-status">
          <div className="capacity-metric">
            <span className="metric-label">Current Capacity</span>
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
          />
          
          {validationResults && (
            <div className="validation-status">
              {validationResults.capacityValid ? (
                <Callout intent={Intent.SUCCESS} icon={IconNames.TICK}>
                  Capacity within acceptable limits
                </Callout>
              ) : (
                <Callout intent={Intent.WARNING} icon={IconNames.WARNING_SIGN}>
                  Capacity exceeds optimal threshold
                </Callout>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Validation Summary */}
      {validationResults && (
        <Card className="validation-summary">
          <H4>Validation Summary</H4>
          
          {validationResults.issues.length === 0 ? (
            <Callout intent={Intent.SUCCESS} icon={IconNames.TICK_CIRCLE}>
              All validations passed. Plan is ready for approval.
            </Callout>
          ) : (
            <div className="issues-list">
              {validationResults.issues.map((issue, idx) => (
                <Alert
                  key={idx}
                  intent={
                    issue.severity === 'critical' ? Intent.DANGER :
                    issue.severity === 'warning' ? Intent.WARNING :
                    Intent.NONE
                  }
                  icon={
                    issue.severity === 'critical' ? IconNames.ERROR :
                    issue.severity === 'warning' ? IconNames.WARNING_SIGN :
                    IconNames.INFO_SIGN
                  }
                >
                  <p><strong>{issue.message}</strong></p>
                  {issue.resolution && (
                    <p className={Classes.TEXT_MUTED}>{issue.resolution}</p>
                  )}
                </Alert>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Action Buttons */}
      <Card className="validation-actions">
        <ButtonGroup fill>
          <Button
            data-testid="approve-plan-button"
            icon={IconNames.ENDORSED}
            text="Approve Plan"
            intent={Intent.SUCCESS}
            onClick={handleApprove}
            disabled={!validationResults?.overallValid}
            large
          />
          <Button
            icon={IconNames.CROSS}
            text="Reject Plan"
            intent={Intent.DANGER}
            onClick={() => setShowRejectDialog(true)}
            disabled={!validationResults}
            large
          />
        </ButtonGroup>
      </Card>

      {/* Plan Approved Confirmation */}
      {validationState === 'completed' && validationResults?.overallValid && (
        <div data-testid="plan-approved-confirmation" className="approval-confirmation">
          <Callout intent={Intent.SUCCESS} icon={IconNames.ENDORSED}>
            <H4>Plan Approved</H4>
            <p>Collection plan has been validated and approved successfully.</p>
          </Callout>
        </div>
      )}

      {/* Reject Dialog */}
      <Alert
        isOpen={showRejectDialog}
        onCancel={() => setShowRejectDialog(false)}
        onConfirm={handleReject}
        cancelButtonText="Cancel"
        confirmButtonText="Reject Plan"
        intent={Intent.DANGER}
        icon={IconNames.WARNING_SIGN}
      >
        <p>Please provide a reason for rejecting this plan:</p>
        <textarea
          className="bp5-input bp5-fill"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Enter rejection reason..."
          rows={3}
        />
      </Alert>
    </div>
  );
};

export default ValidationPanel;