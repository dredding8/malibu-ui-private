import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  H4,
  H5,
  Button,
  ButtonGroup,
  Intent,
  Icon,
  Tag,
  Toast,
  Toaster,
  Dialog,
  Classes,
  Callout,
  ProgressBar,
  Divider,
  RadioGroup,
  Radio,
  TextArea,
  Alert
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { CollectionOpportunity, Conflict } from '../types/collectionOpportunities';
import './ConflictResolutionSystem.css';

// Enhanced conflict types for multi-operator scenarios
export interface EnhancedConflict {
  id: string;
  type: 'resource' | 'schedule' | 'priority' | 'authorization';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedOpportunities: string[];
  detectedAt: string;
  detectedBy: 'system' | 'operator';
  currentOperator?: string;
  lockedBy?: string;
  lockExpiry?: string;
  resolutionOptions: ConflictResolutionOption[];
  escalationLevel: number;
  escalationPath: string[];
  auditTrail: ConflictAuditEntry[];
}

export interface ConflictResolutionOption {
  id: string;
  description: string;
  type: 'automatic' | 'manual' | 'escalation';
  confidence: number;
  impact: {
    performance: number;
    safety: number;
    efficiency: number;
  };
  requiredApprovals: string[];
  estimatedTime: number; // minutes
  rollbackable: boolean;
}

export interface ConflictAuditEntry {
  timestamp: string;
  action: string;
  operator: string;
  previousState: any;
  newState: any;
  reasoning: string;
  outcome: 'success' | 'failure' | 'partial';
}

interface ConflictResolutionSystemProps {
  conflicts: EnhancedConflict[];
  currentOperator: string;
  onResolveConflict: (conflictId: string, resolution: ConflictResolutionOption, notes?: string) => Promise<void>;
  onEscalateConflict: (conflictId: string, reason: string) => Promise<void>;
  onLockResource: (resourceId: string) => Promise<boolean>;
  onUnlockResource: (resourceId: string) => Promise<void>;
  enableOptimisticUI?: boolean;
}

export const ConflictResolutionSystem: React.FC<ConflictResolutionSystemProps> = ({
  conflicts,
  currentOperator,
  onResolveConflict,
  onEscalateConflict,
  onLockResource,
  onUnlockResource,
  enableOptimisticUI = false
}) => {
  const [selectedConflict, setSelectedConflict] = useState<EnhancedConflict | null>(null);
  const [isResolutionDialogOpen, setIsResolutionDialogOpen] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState<string>('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lockedResources, setLockedResources] = useState<Set<string>>(new Set());
  const [escalationAlert, setEscalationAlert] = useState<{
    isOpen: boolean;
    conflict?: EnhancedConflict;
  }>({ isOpen: false });

  const toaster = Toaster.create({ position: 'top-right' });

  // Sort conflicts by priority and detection time
  const prioritizedConflicts = useMemo(() => {
    const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
    return [...conflicts].sort((a, b) => {
      const severityDiff = severityWeight[b.severity] - severityWeight[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime();
    });
  }, [conflicts]);

  // Auto-escalation timer for critical conflicts
  useEffect(() => {
    const criticalConflicts = conflicts.filter(c => 
      c.severity === 'critical' && 
      !c.lockedBy &&
      c.escalationLevel === 0
    );

    if (criticalConflicts.length > 0) {
      const timer = setTimeout(() => {
        criticalConflicts.forEach(conflict => {
          toaster.show({
            message: `Critical conflict ${conflict.id} auto-escalating`,
            intent: Intent.DANGER,
            icon: IconNames.WARNING_SIGN,
            timeout: 5000
          });
        });
      }, 30000); // 30 seconds for demo, would be longer in production

      return () => clearTimeout(timer);
    }
  }, [conflicts, toaster]);

  // Resource locking with pessimistic approach for critical operations
  const handleResourceLock = useCallback(async (resourceId: string) => {
    try {
      const success = await onLockResource(resourceId);
      if (success) {
        setLockedResources(prev => new Set(prev).add(resourceId));
        toaster.show({
          message: `Resource ${resourceId} locked`,
          intent: Intent.PRIMARY,
          icon: IconNames.LOCK,
          timeout: 3000
        });
      } else {
        toaster.show({
          message: `Failed to lock resource ${resourceId} - already locked`,
          intent: Intent.WARNING,
          icon: IconNames.WARNING_SIGN,
          timeout: 5000
        });
      }
      return success;
    } catch (error) {
      toaster.show({
        message: `Error locking resource: ${error}`,
        intent: Intent.DANGER,
        timeout: 5000
      });
      return false;
    }
  }, [onLockResource, toaster]);

  // Start conflict resolution process
  const startResolution = useCallback(async (conflict: EnhancedConflict) => {
    // For critical conflicts, require resource locking
    if (conflict.severity === 'critical' && !enableOptimisticUI) {
      const lockSuccess = await handleResourceLock(conflict.id);
      if (!lockSuccess) {
        toaster.show({
          message: 'Cannot resolve conflict - resource locked by another operator',
          intent: Intent.WARNING,
          timeout: 5000
        });
        return;
      }
    }

    setSelectedConflict(conflict);
    setIsResolutionDialogOpen(true);
    setSelectedResolution(conflict.resolutionOptions[0]?.id || '');
  }, [enableOptimisticUI, handleResourceLock, toaster]);

  // Apply conflict resolution
  const applyResolution = useCallback(async () => {
    if (!selectedConflict || !selectedResolution) return;

    const resolution = selectedConflict.resolutionOptions.find(r => r.id === selectedResolution);
    if (!resolution) return;

    setIsProcessing(true);
    try {
      await onResolveConflict(selectedConflict.id, resolution, resolutionNotes);
      
      toaster.show({
        message: `Conflict ${selectedConflict.id} resolved successfully`,
        intent: Intent.SUCCESS,
        icon: IconNames.TICK,
        timeout: 3000
      });

      setIsResolutionDialogOpen(false);
      setSelectedConflict(null);
      setResolutionNotes('');
    } catch (error) {
      toaster.show({
        message: `Failed to resolve conflict: ${error}`,
        intent: Intent.DANGER,
        timeout: 5000
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedConflict, selectedResolution, resolutionNotes, onResolveConflict, toaster]);

  // Escalate conflict
  const handleEscalation = useCallback(async (conflict: EnhancedConflict, reason: string) => {
    try {
      await onEscalateConflict(conflict.id, reason);
      toaster.show({
        message: `Conflict ${conflict.id} escalated`,
        intent: Intent.WARNING,
        icon: IconNames.PERSON,
        timeout: 3000
      });
      setEscalationAlert({ isOpen: false });
    } catch (error) {
      toaster.show({
        message: `Failed to escalate: ${error}`,
        intent: Intent.DANGER,
        timeout: 5000
      });
    }
  }, [onEscalateConflict, toaster]);

  // Get conflict severity intent
  const getSeverityIntent = (severity: EnhancedConflict['severity']): Intent => {
    switch (severity) {
      case 'critical': return Intent.DANGER;
      case 'high': return Intent.WARNING;
      case 'medium': return Intent.PRIMARY;
      case 'low': return Intent.NONE;
    }
  };

  // Get conflict icon
  const getConflictIcon = (type: EnhancedConflict['type']) => {
    switch (type) {
      case 'resource': return IconNames.DATABASE;
      case 'schedule': return IconNames.TIME;
      case 'priority': return IconNames.FLAG;
      case 'authorization': return IconNames.SHIELD;
      default: return IconNames.WARNING_SIGN;
    }
  };

  // Time since detection
  const getTimeSinceDetection = (detectedAt: string) => {
    const minutes = Math.floor((Date.now() - new Date(detectedAt).getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  };

  return (
    <div className="conflict-resolution-system">
      {/* System Status Header */}
      <Card className="system-status">
        <div className="status-header">
          <H4>
            <Icon icon={IconNames.DIAGRAM_TREE} />
            Conflict Resolution System
          </H4>
          <div className="status-metrics">
            <Tag intent={conflicts.length > 0 ? Intent.WARNING : Intent.SUCCESS}>
              {conflicts.length} Active Conflicts
            </Tag>
            <Tag minimal>
              Operator: {currentOperator}
            </Tag>
            <Tag minimal>
              Mode: {enableOptimisticUI ? 'Optimistic' : 'Pessimistic'}
            </Tag>
          </div>
        </div>
      </Card>

      {/* Critical Conflicts Alert */}
      {prioritizedConflicts.filter(c => c.severity === 'critical').length > 0 && (
        <Callout intent={Intent.DANGER} icon={IconNames.ERROR} className="critical-alert">
          <H5>Critical Conflicts Detected</H5>
          <p>
            {prioritizedConflicts.filter(c => c.severity === 'critical').length} critical conflicts 
            require immediate attention. System safety may be compromised.
          </p>
        </Callout>
      )}

      {/* Conflicts List */}
      <div className="conflicts-container">
        {prioritizedConflicts.length === 0 ? (
          <Card className="no-conflicts">
            <Icon icon={IconNames.TICK_CIRCLE} size={40} intent={Intent.SUCCESS} />
            <H5>No Active Conflicts</H5>
            <p className={Classes.TEXT_MUTED}>
              All resources are operating within normal parameters.
            </p>
          </Card>
        ) : (
          prioritizedConflicts.map(conflict => (
            <Card key={conflict.id} className={`conflict-card severity-${conflict.severity}`}>
              <div className="conflict-header">
                <div className="conflict-info">
                  <div className="conflict-title">
                    <Icon icon={getConflictIcon(conflict.type)} />
                    <span>Conflict {conflict.id}</span>
                    <Tag intent={getSeverityIntent(conflict.severity)} minimal>
                      {conflict.severity.toUpperCase()}
                    </Tag>
                  </div>
                  <p className="conflict-description">{conflict.description}</p>
                </div>
                <div className="conflict-timing">
                  <span className="detection-time">
                    {getTimeSinceDetection(conflict.detectedAt)}
                  </span>
                  {conflict.lockedBy && (
                    <Tag intent={Intent.WARNING}>
                      Locked by {conflict.lockedBy}
                    </Tag>
                  )}
                </div>
              </div>

              <div className="conflict-details">
                <div className="affected-resources">
                  <strong>Affected:</strong>
                  <div className="resource-tags">
                    {conflict.affectedOpportunities.slice(0, 3).map(id => (
                      <Tag key={id} minimal>{id}</Tag>
                    ))}
                    {conflict.affectedOpportunities.length > 3 && (
                      <Tag minimal>+{conflict.affectedOpportunities.length - 3} more</Tag>
                    )}
                  </div>
                </div>

                <div className="resolution-options-preview">
                  <strong>Options:</strong>
                  <span>{conflict.resolutionOptions.length} available</span>
                  {conflict.resolutionOptions[0] && (
                    <Tag minimal>
                      Best: {Math.round(conflict.resolutionOptions[0].confidence)}% confidence
                    </Tag>
                  )}
                </div>
              </div>

              <div className="conflict-actions">
                <ButtonGroup>
                  <Button
                    intent={Intent.PRIMARY}
                    icon={IconNames.RESOLVE}
                    onClick={() => startResolution(conflict)}
                    disabled={conflict.lockedBy && conflict.lockedBy !== currentOperator}
                  >
                    Resolve
                  </Button>
                  <Button
                    icon={IconNames.PERSON}
                    onClick={() => setEscalationAlert({ isOpen: true, conflict })}
                    disabled={conflict.escalationLevel >= 2}
                  >
                    Escalate
                  </Button>
                  <Button
                    minimal
                    icon={IconNames.HISTORY}
                    title="View audit trail"
                  >
                    History
                  </Button>
                </ButtonGroup>
              </div>

              {/* Escalation Progress */}
              {conflict.escalationLevel > 0 && (
                <div className="escalation-progress">
                  <Divider />
                  <div className="escalation-info">
                    <strong>Escalation Level {conflict.escalationLevel}</strong>
                    <ProgressBar
                      value={conflict.escalationLevel / 3}
                      intent={Intent.WARNING}
                      stripes={false}
                    />
                    <span>Next: {conflict.escalationPath[conflict.escalationLevel] || 'Management'}</span>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Resolution Dialog */}
      <Dialog
        isOpen={isResolutionDialogOpen}
        onClose={() => !isProcessing && setIsResolutionDialogOpen(false)}
        title={`Resolve Conflict ${selectedConflict?.id}`}
        style={{ width: '600px' }}
        className="resolution-dialog"
      >
        <div className={Classes.DIALOG_BODY}>
          {selectedConflict && (
            <>
              <Callout intent={getSeverityIntent(selectedConflict.severity)}>
                <strong>{selectedConflict.description}</strong>
              </Callout>

              <H5>Resolution Options</H5>
              <RadioGroup
                onChange={(e) => setSelectedResolution(e.currentTarget.value)}
                selectedValue={selectedResolution}
              >
                {selectedConflict.resolutionOptions.map(option => (
                  <Radio key={option.id} value={option.id}>
                    <div className="resolution-option">
                      <div className="option-header">
                        <span className="option-description">{option.description}</span>
                        <Tag minimal intent={option.confidence > 80 ? Intent.SUCCESS : Intent.WARNING}>
                          {Math.round(option.confidence)}% confidence
                        </Tag>
                      </div>
                      <div className="option-impact">
                        <div className="impact-metric">
                          Safety: {option.impact.safety}%
                        </div>
                        <div className="impact-metric">
                          Performance: {option.impact.performance}%
                        </div>
                        <div className="impact-metric">
                          Efficiency: {option.impact.efficiency}%
                        </div>
                      </div>
                      {option.estimatedTime > 0 && (
                        <small className={Classes.TEXT_MUTED}>
                          Estimated time: {option.estimatedTime} minutes
                        </small>
                      )}
                    </div>
                  </Radio>
                ))}
              </RadioGroup>

              <H5>Resolution Notes</H5>
              <TextArea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Document the reasoning for this resolution choice..."
                fill
                rows={3}
              />
            </>
          )}
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button onClick={() => setIsResolutionDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              intent={Intent.PRIMARY}
              onClick={applyResolution}
              loading={isProcessing}
              disabled={!selectedResolution}
            >
              Apply Resolution
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Escalation Alert */}
      <Alert
        isOpen={escalationAlert.isOpen}
        onClose={() => setEscalationAlert({ isOpen: false })}
        onConfirm={() => {
          if (escalationAlert.conflict) {
            handleEscalation(escalationAlert.conflict, 'Operator requested escalation');
          }
        }}
        intent={Intent.WARNING}
        icon={IconNames.PERSON}
        confirmButtonText="Escalate"
        cancelButtonText="Cancel"
      >
        <p>
          Are you sure you want to escalate conflict {escalationAlert.conflict?.id}?
          This will notify the next level supervisor and may impact system operations.
        </p>
      </Alert>
    </div>
  );
};