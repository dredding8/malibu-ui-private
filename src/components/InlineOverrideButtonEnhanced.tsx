import React, { useState } from 'react';
import {
  Button,
  Dialog,
  FormGroup,
  HTMLSelect,
  Intent,
  Classes,
  ButtonGroup,
  Callout
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import {
  CollectionOpportunity,
  Site
} from '../types/collectionOpportunities';
import OverrideImpactCalculator, { OverrideImpact } from './OverrideImpactCalculator';

interface InlineOverrideButtonEnhancedProps {
  opportunity: CollectionOpportunity;
  availableSites: Site[];
  allOpportunities: CollectionOpportunity[];
  onOverride: (opportunityId: string, newSite: Site, justification: string, impact: OverrideImpact) => void;
  minimal?: boolean;
  small?: boolean;
  disabled?: boolean;
}

/**
 * Enhanced Inline Override Button with Impact Analysis
 * 
 * Addresses JTBD #2: Override and Customize Allocations
 * - Provides site selection interface
 * - Shows impact analysis before confirmation
 * - Captures justification for overrides
 * - Supports approval workflow for high-risk changes
 */
export const InlineOverrideButtonEnhanced: React.FC<InlineOverrideButtonEnhancedProps> = ({
  opportunity,
  availableSites,
  allOpportunities,
  onOverride,
  minimal = false,
  small = true,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [showImpactAnalysis, setShowImpactAnalysis] = useState(false);
  const [calculatedImpact, setCalculatedImpact] = useState<OverrideImpact | null>(null);
  const [finalJustification, setFinalJustification] = useState('');

  // Filter out currently allocated sites to show only alternatives
  const alternativeSites = availableSites.filter(site => 
    !opportunity.allocatedSites.some(allocated => allocated.id === site.id)
  );

  const selectedSite = alternativeSites.find(site => site.id === selectedSiteId);

  const handleOpenDialog = () => {
    setIsOpen(true);
    setSelectedSiteId('');
    setShowImpactAnalysis(false);
    setCalculatedImpact(null);
    setFinalJustification('');
  };

  const handleSiteSelection = () => {
    if (selectedSite) {
      setShowImpactAnalysis(true);
    }
  };

  const handleImpactCalculated = (impact: OverrideImpact) => {
    setCalculatedImpact(impact);
  };

  const handleJustificationRequired = (justification: string) => {
    setFinalJustification(justification);
  };

  const handleConfirmOverride = () => {
    if (selectedSite && calculatedImpact) {
      onOverride(opportunity.id, selectedSite, finalJustification, calculatedImpact);
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setSelectedSiteId('');
    setShowImpactAnalysis(false);
    setCalculatedImpact(null);
    setFinalJustification('');
  };

  const handleBack = () => {
    setShowImpactAnalysis(false);
    setCalculatedImpact(null);
    setFinalJustification('');
  };

  return (
    <>
      <Button
        icon={IconNames.EDIT}
        text={minimal ? undefined : "Override"}
        intent={Intent.WARNING}
        small={small}
        minimal={minimal}
        disabled={disabled}
        title="Override site allocation with impact analysis"
        onClick={handleOpenDialog}
        data-testid="override-allocation-button"
      />

      <Dialog
        isOpen={isOpen}
        onClose={handleCancel}
        title="Override Site Allocation"
        className="override-dialog"
        style={{ width: showImpactAnalysis ? 900 : 500 }}
        data-testid="override-panel"
      >
        <div className={Classes.DIALOG_BODY}>
          {!showImpactAnalysis ? (
            // Step 1: Site Selection
            <div>
              <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN} style={{ marginBottom: 16 }}>
                <strong>Current Allocation:</strong> {opportunity.allocatedSites.map(s => s.name).join(', ')}
                <br />
                <strong>Opportunity:</strong> {opportunity.name} ({opportunity.satellite.name})
              </Callout>

              <FormGroup
                label="Select Alternate Site"
                labelInfo="(required)"
                helperText="Select a site to analyze override impact"
              >
                <HTMLSelect
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  options={[
                    { label: 'Select a site...', value: '' },
                    ...alternativeSites.map(site => ({
                      label: `${site.name} (${((site.allocated / site.capacity) * 100).toFixed(1)}% utilized)`,
                      value: site.id
                    }))
                  ]}
                  fill
                  data-testid="alternative-site-option"
                />
              </FormGroup>

              {alternativeSites.length === 0 && (
                <Callout intent={Intent.WARNING} style={{ marginTop: 16 }}>
                  No alternative sites available for override. All available sites are already allocated to this opportunity.
                </Callout>
              )}
            </div>
          ) : (
            // Step 2: Impact Analysis
            <div>
              <OverrideImpactCalculator
                opportunity={opportunity}
                proposedSite={selectedSite!}
                availableSites={availableSites}
                allOpportunities={allOpportunities}
                onImpactCalculated={handleImpactCalculated}
                onJustificationRequired={handleJustificationRequired}
              />
            </div>
          )}
        </div>

        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            {!showImpactAnalysis ? (
              // Step 1 Actions
              <>
                <Button onClick={handleCancel}>Cancel</Button>
                <Button
                  intent={Intent.PRIMARY}
                  icon={IconNames.CALCULATOR}
                  onClick={handleSiteSelection}
                  disabled={!selectedSiteId}
                  data-testid="calculate-impact-button"
                >
                  Calculate Impact
                </Button>
              </>
            ) : (
              // Step 2 Actions
              <>
                <Button onClick={handleBack} icon={IconNames.ARROW_LEFT}>
                  Back to Site Selection
                </Button>
                <ButtonGroup>
                  <Button onClick={handleCancel}>Cancel</Button>
                  {calculatedImpact && (
                    <Button
                      intent={calculatedImpact.requiresApproval ? Intent.WARNING : Intent.SUCCESS}
                      icon={calculatedImpact.requiresApproval ? IconNames.SHIELD : IconNames.TICK}
                      onClick={handleConfirmOverride}
                      disabled={calculatedImpact.requiresApproval && !finalJustification.trim()}
                    >
                      {calculatedImpact.requiresApproval ? 'Submit for Approval' : 'Confirm Override'}
                    </Button>
                  )}
                </ButtonGroup>
              </>
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default InlineOverrideButtonEnhanced;