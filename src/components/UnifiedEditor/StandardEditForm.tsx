/**
 * Standard Edit Form
 *
 * Moderate complexity form for common edits - shown in centered Dialog
 * Handles: Site selection, priority, justification, capacity validation
 *
 * Use Case: 15% of editing operations (site reallocation, moderate changes)
 * Presentation: Centered modal dialog, blocking
 */

import React, { useState } from 'react';
import {
  FormGroup,
  HTMLSelect,
  RadioGroup,
  Radio,
  TextArea,
  Tag,
  Intent,
  Callout,
  H5,
  ProgressBar,
  Button,
  Collapse,
  Divider,
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { CollectionOpportunity, Site } from '../../types/collectionOpportunities';
import { OverrideIndicator } from '../OverrideIndicator';

interface StandardEditFormProps {
  editor: any; // ReturnType<typeof useUnifiedEditor>
  opportunity: CollectionOpportunity;
  availableSites: Site[];
  capacityThresholds: {
    critical: number;
    warning: number;
    optimal: number;
  };
}

export const StandardEditForm: React.FC<StandardEditFormProps> = ({
  editor,
  opportunity,
  availableSites,
  capacityThresholds,
}) => {
  const { state, setSites, setPriority, setJustification } = editor;
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get selected site
  const selectedSiteId = state.selectedSiteIds[0] || '';
  const selectedSite = availableSites.find(s => s.id === selectedSiteId);

  // Calculate capacity if site selected
  const capacityPercentage = selectedSite
    ? ((selectedSite.allocated / selectedSite.capacity) * 100)
    : 0;

  const capacityIntent =
    capacityPercentage >= capacityThresholds.critical ? Intent.DANGER :
    capacityPercentage >= capacityThresholds.warning ? Intent.WARNING :
    Intent.SUCCESS;

  return (
    <div className="standard-edit-form">
      {/* Opportunity Header */}
      <div className="editor-form-group">
        <H5>{opportunity.name}</H5>
        <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Tag icon={IconNames.SATELLITE}>{opportunity.satellite.name}</Tag>
          <Tag
            intent={
              opportunity.matchStatus === 'optimal' ? Intent.SUCCESS :
              opportunity.matchStatus === 'suboptimal' ? Intent.WARNING :
              Intent.DANGER
            }
          >
            {opportunity.matchStatus || 'Unmatched'}
          </Tag>
        </div>
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {/* WEEK 1: Override Indicator */}
      <OverrideIndicator
        isOverride={editor.isOverride}
        overrideDescription={editor.overrideDescription}
        requiresJustification={editor.requiresJustification}
      />

      {/* Site Selection */}
      <FormGroup
        label="Allocated Site"
        labelFor="site-select"
        labelInfo="(required)"
        intent={state.validationErrors.has('sites') ? Intent.DANGER : Intent.NONE}
        helperText={state.validationErrors.get('sites') || 'Select the site for this opportunity'}
      >
        <HTMLSelect
          id="site-select"
          fill
          large
          value={selectedSiteId}
          onChange={(e) => setSites(e.target.value ? [e.target.value] : [])}
          options={[
            { label: '-- Select a site --', value: '' },
            ...availableSites.map(site => ({
              label: `${site.name} (${site.location.lat}, ${site.location.lon})`,
              value: site.id,
            })),
          ]}
        />
      </FormGroup>

      {/* Capacity Indicator */}
      {selectedSite && (
        <div className="editor-capacity-meter">
          <div className="editor-capacity-label">
            <span>Site Capacity</span>
            <span className={`editor-capacity-value ${
              capacityPercentage >= capacityThresholds.critical ? 'critical' :
              capacityPercentage >= capacityThresholds.warning ? 'warning' :
              'optimal'
            }`}>
              {capacityPercentage.toFixed(1)}%
            </span>
          </div>
          <ProgressBar
            value={capacityPercentage / 100}
            intent={capacityIntent}
            stripes={false}
            animate={false}
          />
          <div style={{ fontSize: '12px', color: '#5C7080', marginTop: '4px' }}>
            {selectedSite.allocated} / {selectedSite.capacity} allocated
          </div>
        </div>
      )}

      {/* Alternative Suggestions */}
      {opportunity.matchStatus === 'suboptimal' &&
       opportunity.alternativeOptions &&
       opportunity.alternativeOptions.length > 0 && (
        <div className="editor-alternatives">
          <div className="editor-alternatives-title">
            ⚡ Recommended Alternatives
          </div>
          {opportunity.alternativeOptions.slice(0, 3).map((alt) => (
            <div
              key={alt.siteId}
              className="editor-alternative-item"
              onClick={() => setSites([alt.siteId])}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSites([alt.siteId]);
                }
              }}
            >
              <strong>{alt.siteName}</strong>
              <div style={{ fontSize: '12px', color: '#5C7080' }}>
                Reason: {alt.reason}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Priority Selection */}
      <FormGroup
        label="Priority"
        labelInfo="(required)"
        helperText="Set the priority level for this opportunity"
      >
        <RadioGroup
          selectedValue={state.opportunity.priority}
          onChange={(e) => setPriority(e.currentTarget.value as CollectionOpportunity['priority'])}
          inline
        >
          <Radio label="P4 - Low" value="low" />
          <Radio label="P3 - Medium" value="medium" />
          <Radio label="P2 - High" value="high" />
          <Radio label="P1 - Critical" value="critical" />
        </RadioGroup>
      </FormGroup>

      {/* Justification */}
      <FormGroup
        label="Justification"
        labelFor="justification"
        labelInfo={state.opportunity.matchStatus !== 'baseline' ? '(required)' : '(optional)'}
        intent={state.validationErrors.has('justification') ? Intent.DANGER : Intent.NONE}
        helperText={
          state.validationErrors.get('justification') ||
          'Explain why you are making this allocation change'
        }
      >
        <TextArea
          id="justification"
          fill
          growVertically
          rows={3}
          value={state.justification}
          onChange={(e) => setJustification(e.target.value)}
          placeholder="e.g., Better elevation angle for target area, reduced weather risk, etc."
        />
      </FormGroup>

      {/* Advanced Options (Collapsed) */}
      <div className="editor-advanced-section">
        <Button
          minimal
          icon={showAdvanced ? IconNames.CHEVRON_UP : IconNames.CHEVRON_DOWN}
          text={showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="editor-advanced-toggle"
        />

        <Collapse isOpen={showAdvanced}>
          <div style={{ marginTop: '16px' }}>
            <FormGroup
              label="Collection Deck"
              labelInfo="(read-only)"
              helperText="The collection deck this opportunity belongs to"
            >
              <HTMLSelect
                fill
                value={opportunity.collectionDeckId}
                disabled
                options={[
                  { label: opportunity.collectionDeckId, value: opportunity.collectionDeckId },
                ]}
              />
            </FormGroup>
          </div>
        </Collapse>
      </div>

      {/* Validation Warnings */}
      {editor.validation.warnings.length > 0 && (
        <Callout intent={Intent.WARNING} icon={IconNames.WARNING_SIGN} style={{ marginTop: '16px' }}>
          <strong>Warnings:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            {editor.validation.warnings.map((warning: string, idx: number) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </Callout>
      )}

      {/* Suggestions */}
      {editor.validation.suggestions.length > 0 && (
        <Callout intent={Intent.PRIMARY} icon={IconNames.LIGHTBULB} style={{ marginTop: '12px' }}>
          <strong>Suggestions:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            {editor.validation.suggestions.map((suggestion: string, idx: number) => (
              <li key={idx}>{suggestion}</li>
            ))}
          </ul>
        </Callout>
      )}

      {/* Changes Summary */}
      {state.isDirty && (
        <div className="editor-changes-summary">
          <div className="editor-changes-title">📝 Pending Changes</div>
          <ul className="editor-changes-list">
            {state.selectedSiteIds.join(',') !==
             (opportunity.allocatedSites?.map(s => s.id).join(',') || '') && (
              <li>
                <span className="editor-change-field">Site:</span>
                <span className="editor-change-arrow">→</span>
                <span className="editor-change-new">
                  {selectedSite?.name || 'None'}
                </span>
              </li>
            )}
            {state.opportunity.priority !== opportunity.priority && (
              <li>
                <span className="editor-change-field">Priority:</span>
                <span className="editor-change-arrow">→</span>
                <span className="editor-change-new">
                  {state.opportunity.priority}
                </span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
