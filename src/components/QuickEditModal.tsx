import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  Classes,
  Button,
  Intent,
  FormGroup,
  Slider,
  TextArea,
  Callout,
  Tag,
  Icon,
  Tooltip,
  Card,
  Collapse,
  Switch,
  NonIdealState,
  Spinner,
  HTMLSelect
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import {
  CollectionOpportunity,
  Site,
  Priority,
  CapacityResult,
  ValidationError,
  CapacityThresholds
} from '../types/collectionOpportunities';
import { validateCapacity } from '../utils/opportunityValidation';
import { calculateOpportunityHealth, OpportunityHealth } from '../utils/opportunityHealth';
import OpportunityStatusIndicatorEnhanced from './OpportunityStatusIndicatorEnhanced';
import './QuickEditModal.css';

/**
 * @deprecated This component is deprecated and will be removed in v3.0.0
 * Use UnifiedOpportunityEditor instead with mode="quick"
 *
 * Migration Guide:
 * - Replace QuickEditModal with UnifiedOpportunityEditor
 * - Set mode="quick" or let it auto-detect
 * - All functionality is preserved in the new component
 *
 * @see UnifiedOpportunityEditor
 */
interface QuickEditModalProps {
  isOpen: boolean;
  opportunity: CollectionOpportunity;
  availableSites: Site[];
  onClose: () => void;
  onSave: (opportunityId: string, changes: Partial<CollectionOpportunity>) => Promise<void>;
  capacityThresholds: CapacityThresholds;
  enableRealTimeValidation?: boolean;
  showHealthAnalysis?: boolean;
  allowBatchOperations?: boolean;
  relatedOpportunities?: CollectionOpportunity[];
}

interface SiteSelectionState {
  selectedSites: Set<string>;
  siteCapacities: Map<string, CapacityResult>;
  conflicts: Map<string, string[]>;
}

const QuickEditModal: React.FC<QuickEditModalProps> = ({
  isOpen,
  opportunity,
  availableSites,
  onClose,
  onSave,
  capacityThresholds,
  enableRealTimeValidation = true,
  showHealthAnalysis = true,
  allowBatchOperations = false,
  relatedOpportunities = []
}) => {
  // State management
  const [selectedSites, setSelectedSites] = useState<Set<string>>(
    new Set(opportunity.sites.map(s => s.id))
  );
  const [priority, setPriority] = useState<Priority>(opportunity.priority);
  const [notes, setNotes] = useState(opportunity.notes || '');
  const [capacityResult, setCapacityResult] = useState<CapacityResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [applyToRelated, setApplyToRelated] = useState(false);
  const [optimizationSuggestion, setOptimizationSuggestion] = useState<any>(null);

  // Calculate health score
  const currentHealth = useMemo(() => {
    const updatedOpportunity: CollectionOpportunity = {
      ...opportunity,
      sites: availableSites.filter(s => selectedSites.has(s.id)),
      priority,
      notes
    };
    return calculateOpportunityHealth(updatedOpportunity, capacityThresholds);
  }, [selectedSites, priority, opportunity, availableSites, capacityThresholds]);

  // Real-time validation
  useEffect(() => {
    if (enableRealTimeValidation) {
      validateSelection();
    }
  }, [selectedSites, priority, enableRealTimeValidation]);

  const validateSelection = async () => {
    const selectedSiteData = availableSites.filter(s => selectedSites.has(s.id));
    const result = validateCapacity(selectedSiteData, opportunity.satellite, capacityThresholds);
    setCapacityResult(result);

    // Build validation errors
    const errors: ValidationError[] = [];
    
    if (selectedSiteData.length === 0) {
      errors.push({
        opportunityId: opportunity.id,
        field: 'sites',
        message: 'At least one site must be selected',
        severity: 'error'
      });
    }

    if (result.status === 'critical') {
      errors.push({
        opportunityId: opportunity.id,
        field: 'sites',
        message: 'Critical capacity shortage detected',
        severity: 'error'
      });
    }

    // Check for conflicts with other opportunities
    if (enableRealTimeValidation && selectedSiteData.length > 0) {
      const conflicts = await checkConflicts(selectedSiteData);
      if (conflicts.length > 0) {
        errors.push({
          opportunityId: opportunity.id,
          field: 'sites',
          message: `Conflicts detected with ${conflicts.length} other opportunities`,
          severity: 'warning'
        });
      }
    }

    setValidationErrors(errors);
  };

  const checkConflicts = async (sites: Site[]): Promise<string[]> => {
    // Simulate conflict checking
    // In real implementation, this would check against other opportunities
    return [];
  };

  const handleSiteSelection = (siteId: string, method: 'toggle' | 'exclusive' | 'addAll') => {
    const newSelection = new Set(selectedSites);
    
    switch (method) {
      case 'toggle':
        if (newSelection.has(siteId)) {
          newSelection.delete(siteId);
        } else {
          newSelection.add(siteId);
        }
        break;
      case 'exclusive':
        newSelection.clear();
        newSelection.add(siteId);
        break;
      case 'addAll':
        availableSites.forEach(site => {
          if (site.capacity - site.allocated > 0) {
            newSelection.add(site.id);
          }
        });
        break;
    }
    
    setSelectedSites(newSelection);
    setIsDirty(true);
  };

  const handleOptimize = async () => {
    // Simulate optimization algorithm
    const optimizedSites = availableSites
      .filter(site => {
        const availableCapacity = site.capacity - site.allocated;
        return availableCapacity > 20; // Only sites with >20% available
      })
      .sort((a, b) => {
        // Sort by available capacity and geographic diversity
        const aCapacity = (a.capacity - a.allocated) / a.capacity;
        const bCapacity = (b.capacity - b.allocated) / b.capacity;
        return bCapacity - aCapacity;
      })
      .slice(0, 5); // Select top 5 sites

    setSelectedSites(new Set(optimizedSites.map(s => s.id)));
    setOptimizationSuggestion({
      sites: optimizedSites,
      improvement: '+25% capacity efficiency',
      conflicts: 0
    });
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const selectedSiteData = availableSites.filter(s => selectedSites.has(s.id));
      
      const changes: Partial<CollectionOpportunity> = {
        sites: selectedSiteData,
        priority,
        notes,
        capacityPercentage: capacityResult?.percentage || 0,
        lastModified: new Date().toISOString()
      };

      await onSave(opportunity.id, changes);

      // Apply to related opportunities if selected
      if (applyToRelated && relatedOpportunities.length > 0) {
        for (const related of relatedOpportunities) {
          await onSave(related.id, changes);
        }
      }

      onClose();
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const hasErrors = validationErrors.some(e => e.severity === 'error');
  const priorityLabels: Record<Priority, string> = {
    low: 'Low Priority',
    medium: 'Medium Priority',
    high: 'High Priority',
    critical: 'Critical Priority'
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="quick-edit-header">
          <Icon icon={IconNames.EDIT} />
          <span>Quick Edit: {opportunity.name}</span>
          <Tag minimal intent={currentHealth.level === 'critical' ? Intent.DANGER : 
                           currentHealth.level === 'warning' ? Intent.WARNING : 
                           Intent.SUCCESS}>
            Health: {currentHealth.score}/100
          </Tag>
        </div>
      }
      className="quick-edit-modal"
      canEscapeKeyClose={!isDirty}
      canOutsideClickClose={!isDirty}
    >
      <div className={Classes.DIALOG_BODY}>
        {/* Health Analysis Section */}
        {showHealthAnalysis && (
          <Card className="health-analysis-card" elevation={0}>
            <OpportunityStatusIndicatorEnhanced
              health={currentHealth}
              showDetails={true}
              onQuickAction={(action) => {
                if (action === 'optimize') {
                  handleOptimize();
                }
              }}
            />
          </Card>
        )}

        {/* Priority Adjustment */}
        <FormGroup
          label="Priority Level"
          helperText="Adjust priority based on mission criticality"
          intent={priority === 'critical' ? Intent.DANGER : Intent.NONE}
        >
          <div className="priority-selector">
            {(['low', 'medium', 'high', 'critical'] as Priority[]).map(level => (
              <Button
                key={level}
                className={`priority-button ${priority === level ? 'active' : ''}`}
                intent={priority === level ? 
                  (level === 'critical' ? Intent.DANGER :
                   level === 'high' ? Intent.WARNING :
                   level === 'medium' ? Intent.PRIMARY : Intent.NONE) : 
                  Intent.NONE}
                onClick={() => {
                  setPriority(level);
                  setIsDirty(true);
                }}
              >
                <Icon icon={
                  level === 'critical' ? IconNames.ERROR :
                  level === 'high' ? IconNames.WARNING_SIGN :
                  level === 'medium' ? IconNames.INFO_SIGN :
                  IconNames.CIRCLE
                } />
                <span>{priorityLabels[level]}</span>
              </Button>
            ))}
          </div>
        </FormGroup>

        {/* Site Selection */}
        <FormGroup
          label="Site Allocation"
          helperText={`${selectedSites.size} sites selected • ${capacityResult?.percentage.toFixed(0) || 0}% capacity available`}
          intent={hasErrors ? Intent.DANGER : Intent.NONE}
        >
          <div className="site-quick-actions">
            <Button
              small
              minimal
              icon={IconNames.SELECT}
              onClick={() => handleSiteSelection('', 'addAll')}
            >
              Select All Available
            </Button>
            <Button
              small
              minimal
              icon={IconNames.LIGHTBULB}
              onClick={handleOptimize}
              intent={Intent.PRIMARY}
            >
              Auto-Optimize
            </Button>
            <Button
              small
              minimal
              icon={IconNames.CROSS}
              onClick={() => {
                setSelectedSites(new Set());
                setIsDirty(true);
              }}
            >
              Clear All
            </Button>
          </div>

          <div className="sites-grid">
            {availableSites.map(site => {
              const isSelected = selectedSites.has(site.id);
              const availableCapacity = ((site.capacity - site.allocated) / site.capacity) * 100;
              const isOptimal = availableCapacity > 30;
              
              return (
                <div
                  key={site.id}
                  className={`site-card ${isSelected ? 'selected' : ''} ${!isOptimal ? 'low-capacity' : ''}`}
                  onClick={() => handleSiteSelection(site.id, 'toggle')}
                >
                  <div className="site-header">
                    <Icon 
                      icon={isSelected ? IconNames.TICK_CIRCLE : IconNames.CIRCLE} 
                      intent={isSelected ? Intent.PRIMARY : Intent.NONE}
                    />
                    <span className="site-name">{site.name}</span>
                  </div>
                  <div className="site-capacity">
                    <div className="capacity-bar">
                      <div 
                        className="capacity-fill"
                        style={{ 
                          width: `${100 - availableCapacity}%`,
                          backgroundColor: availableCapacity < 20 ? '#DB3737' : 
                                         availableCapacity < 50 ? '#D9822B' : '#0F9960'
                        }}
                      />
                    </div>
                    <span className="capacity-text">{availableCapacity.toFixed(0)}% available</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Optimization suggestion */}
          {optimizationSuggestion && (
            <Callout
              intent={Intent.PRIMARY}
              icon={IconNames.LIGHTBULB}
              className="optimization-callout"
            >
              <strong>Optimization Applied:</strong> Selected {optimizationSuggestion.sites.length} optimal sites
              with {optimizationSuggestion.improvement} improvement and {optimizationSuggestion.conflicts} conflicts.
            </Callout>
          )}
        </FormGroup>

        {/* Advanced Options */}
        <div className="advanced-section">
          <Button
            minimal
            rightIcon={showAdvanced ? IconNames.CHEVRON_UP : IconNames.CHEVRON_DOWN}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            Advanced Options
          </Button>
          
          <Collapse isOpen={showAdvanced}>
            <div className="advanced-content">
              {/* Notes */}
              <FormGroup
                label="Notes"
                helperText="Add context or special instructions"
              >
                <TextArea
                  fill
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Enter notes..."
                  rows={3}
                />
              </FormGroup>

              {/* Batch operations */}
              {allowBatchOperations && relatedOpportunities.length > 0 && (
                <FormGroup
                  label="Batch Operations"
                  helperText={`Apply changes to ${relatedOpportunities.length} related opportunities`}
                >
                  <Switch
                    checked={applyToRelated}
                    onChange={(e) => setApplyToRelated(e.currentTarget.checked)}
                    label="Apply to all related opportunities"
                  />
                </FormGroup>
              )}
            </div>
          </Collapse>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="validation-section">
            {validationErrors.map((error, index) => (
              <Callout
                key={index}
                intent={error.severity === 'error' ? Intent.DANGER : Intent.WARNING}
                icon={error.severity === 'error' ? IconNames.ERROR : IconNames.WARNING_SIGN}
              >
                {error.message}
              </Callout>
            ))}
          </div>
        )}
      </div>

      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            intent={Intent.PRIMARY}
            onClick={handleSave}
            disabled={hasErrors || !isDirty || isSaving}
            loading={isSaving}
          >
            Save Changes
            {applyToRelated && ` (${relatedOpportunities.length + 1} opportunities)`}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default QuickEditModal;