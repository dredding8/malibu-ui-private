import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  Classes,
  Button,
  Intent,
  FormGroup,
  Checkbox,
  TextArea,
  RadioGroup,
  Radio,
  Callout,
  ProgressBar,
  Tag,
  Icon,
  Tooltip,
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import {
  CollectionOpportunity,
  Site,
  Priority,
  CapacityResult,
  ValidationError,
} from '../types/collectionOpportunities';
import { validateCapacity } from '../utils/opportunityValidation';
import './EditOpportunityModal.css';

interface EditOpportunityModalProps {
  isOpen: boolean;
  opportunity: CollectionOpportunity;
  onClose: () => void;
  onSave: (opportunityId: string, changes: Partial<CollectionOpportunity>) => void;
  onSaveAndNext?: (opportunityId: string, changes: Partial<CollectionOpportunity>) => void;
  capacityThresholds: {
    critical: number;
    warning: number;
    optimal: number;
  };
  enableRealTimeValidation: boolean;
}

const EditOpportunityModal: React.FC<EditOpportunityModalProps> = ({
  isOpen,
  opportunity,
  onClose,
  onSave,
  onSaveAndNext,
  capacityThresholds,
  enableRealTimeValidation,
}) => {
  const [selectedSites, setSelectedSites] = useState<Set<string>>(
    new Set(opportunity.sites.map(s => s.id))
  );
  const [priority, setPriority] = useState<Priority>(opportunity.priority);
  const [notes, setNotes] = useState(opportunity.notes || '');
  const [capacityResult, setCapacityResult] = useState<CapacityResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // Available sites (mock data - in real implementation would come from props)
  const availableSites: Site[] = [
    { id: 'site1', name: 'Site Alpha', location: { lat: 0, lon: 0 }, capacity: 100, allocated: 50 },
    { id: 'site2', name: 'Site Beta', location: { lat: 10, lon: 10 }, capacity: 150, allocated: 75 },
    { id: 'site3', name: 'Site Gamma', location: { lat: 20, lon: 20 }, capacity: 200, allocated: 100 },
    { id: 'site4', name: 'Site Delta', location: { lat: 30, lon: 30 }, capacity: 120, allocated: 60 },
    { id: 'site5', name: 'Site Epsilon', location: { lat: 40, lon: 40 }, capacity: 180, allocated: 90 },
    ...opportunity.sites, // Include currently assigned sites
  ];

  // Validate capacity whenever selection changes
  useEffect(() => {
    if (enableRealTimeValidation) {
      const selectedSiteData = availableSites.filter(s => selectedSites.has(s.id));
      const result = validateCapacity(selectedSiteData, opportunity.satellite, capacityThresholds);
      setCapacityResult(result);

      // Check for validation errors
      const errors: ValidationError[] = [];
      if (result.status === 'critical') {
        errors.push({
          opportunityId: opportunity.id,
          field: 'sites',
          message: 'Critical capacity warning: Consider adding more sites or removing conflicts',
          severity: 'error',
        });
      } else if (result.status === 'warning') {
        errors.push({
          opportunityId: opportunity.id,
          field: 'sites',
          message: 'Low capacity warning: Consider optimizing site allocation',
          severity: 'warning',
        });
      }
      setValidationErrors(errors);
    }
  }, [selectedSites, opportunity, enableRealTimeValidation, capacityThresholds]);

  const handleSiteToggle = (siteId: string) => {
    const newSelection = new Set(selectedSites);
    if (newSelection.has(siteId)) {
      newSelection.delete(siteId);
    } else {
      newSelection.add(siteId);
    }
    setSelectedSites(newSelection);
    setIsDirty(true);
  };

  const handleSave = () => {
    const selectedSiteData = availableSites.filter(s => selectedSites.has(s.id));
    
    const changes: Partial<CollectionOpportunity> = {
      sites: selectedSiteData,
      priority,
      notes,
      lastModified: new Date().toISOString(),
    };

    onSave(opportunity.id, changes);
  };

  const handleSaveAndNext = () => {
    if (onSaveAndNext) {
      const selectedSiteData = availableSites.filter(s => selectedSites.has(s.id));
      
      const changes: Partial<CollectionOpportunity> = {
        sites: selectedSiteData,
        priority,
        notes,
        lastModified: new Date().toISOString(),
      };

      onSaveAndNext(opportunity.id, changes);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      if (confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const hasErrors = validationErrors.some(e => e.severity === 'error');

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleCancel}
      title={`Edit Opportunity: ${opportunity.name}`}
      className="edit-opportunity-modal"
      canEscapeKeyClose={!isDirty}
      canOutsideClickClose={!isDirty}
    >
      <div className={Classes.DIALOG_BODY}>
        {/* Satellite Information */}
        <div className="satellite-info-section">
          <h4>Satellite Information</h4>
          <div className="satellite-details">
            <Tag large>{opportunity.satellite.name}</Tag>
            <span className={Classes.TEXT_MUTED}>
              {opportunity.satellite.function} | {opportunity.satellite.orbit}
            </span>
            <div className="capacity-info">
              <span className="bp5-icon bp5-icon-database" />
              <span>
                Capacity: {opportunity.satellite.currentLoad} / {opportunity.satellite.capacity}
              </span>
            </div>
          </div>
        </div>

        {/* Site Allocation */}
        <FormGroup
          label="Site Allocation"
          helperText="Select sites for this collection opportunity. Real-time validation shows capacity impact."
          intent={hasErrors ? Intent.DANGER : Intent.NONE}
        >
          <div className="sites-selection">
            {availableSites.map(site => {
              const isSelected = selectedSites.has(site.id);
              const siteCapacity = ((site.capacity - site.allocated) / site.capacity) * 100;
              
              return (
                <div key={site.id} className="site-checkbox-wrapper">
                  <Checkbox
                    checked={isSelected}
                    onChange={() => handleSiteToggle(site.id)}
                    labelElement={
                      <div className="site-label">
                        <div className="site-name">{site.name}</div>
                        <div className="site-metrics">
                          <small className={Classes.TEXT_MUTED}>
                            Available: {site.capacity - site.allocated} / {site.capacity}
                          </small>
                          <ProgressBar
                            value={siteCapacity / 100}
                            intent={siteCapacity < 20 ? Intent.DANGER : Intent.NONE}
                            animate={false}
                            stripes={false}
                          />
                        </div>
                      </div>
                    }
                  />
                </div>
              );
            })}
          </div>

          {/* Real-time capacity feedback */}
          {capacityResult && enableRealTimeValidation && (
            <Callout
              intent={
                capacityResult.status === 'critical' ? Intent.DANGER :
                capacityResult.status === 'warning' ? Intent.WARNING :
                Intent.SUCCESS
              }
              icon={IconNames.INFO_SIGN}
              className="capacity-feedback"
            >
              <div className="capacity-result">
                <div>
                  <strong>Capacity Analysis:</strong> {capacityResult.percentage.toFixed(1)}% available
                </div>
                {capacityResult.warnings && capacityResult.warnings.length > 0 && (
                  <ul className="capacity-warnings">
                    {capacityResult.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                )}
              </div>
            </Callout>
          )}
        </FormGroup>

        {/* Priority */}
        <FormGroup label="Priority" helperText="Set the priority level for this opportunity">
          <RadioGroup
            onChange={(e) => {
              setPriority(e.currentTarget.value as Priority);
              setIsDirty(true);
            }}
            selectedValue={priority}
            inline
          >
            <Radio label="Low" value="low" />
            <Radio label="Medium" value="medium" />
            <Radio label="High" value="high" />
            <Radio label="Critical" value="critical" />
          </RadioGroup>
        </FormGroup>

        {/* Notes */}
        <FormGroup
          label="Notes"
          helperText="Add any relevant notes or comments about this opportunity"
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

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="validation-errors">
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
          <Button onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            intent={Intent.PRIMARY}
            onClick={handleSave}
            disabled={hasErrors || !isDirty}
          >
            Save
          </Button>
          {onSaveAndNext && (
            <Tooltip
              content="Save changes and open the next flagged opportunity"
              position="top"
            >
              <Button
                intent={Intent.PRIMARY}
                onClick={handleSaveAndNext}
                disabled={hasErrors || !isDirty}
                icon={IconNames.ARROW_RIGHT}
              >
                Save & Next
              </Button>
            </Tooltip>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default EditOpportunityModal;