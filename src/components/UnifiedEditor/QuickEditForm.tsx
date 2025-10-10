/**
 * Quick Edit Form
 *
 * Simplified form for fast edits - shown in Drawer
 * Handles: Priority changes and notes only
 *
 * Use Case: 80% of editing operations (quick, non-critical changes)
 * Presentation: Right-side drawer, non-blocking
 */

import React from 'react';
import {
  FormGroup,
  RadioGroup,
  Radio,
  TextArea,
  Tag,
  Intent,
  Callout,
  H5,
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { CollectionOpportunity, Site } from '../../types/collectionOpportunities';

interface QuickEditFormProps {
  editor: any; // ReturnType<typeof useUnifiedEditor> - using any to avoid circular dep
  opportunity: CollectionOpportunity;
  availableSites: Site[];
}

export const QuickEditForm: React.FC<QuickEditFormProps> = ({
  editor,
  opportunity,
  availableSites,
}) => {
  const { state, setPriority } = editor;

  return (
    <div className="quick-edit-form">
      {/* Opportunity Summary */}
      <div className="editor-form-group">
        <H5>Editing: {opportunity.name}</H5>
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

      {/* Priority Selection */}
      <FormGroup
        label="Priority"
        labelInfo="(required)"
        helperText="Adjust priority level for this opportunity"
      >
        <RadioGroup
          selectedValue={state.opportunity.priority}
          onChange={(e) => setPriority(e.currentTarget.value as CollectionOpportunity['priority'])}
        >
          <Radio label="P4 - Low" value="low" />
          <Radio label="P3 - Medium" value="medium" />
          <Radio label="P2 - High" value="high" />
          <Radio label="P1 - Critical" value="critical" />
        </RadioGroup>
      </FormGroup>

      {/* Current Allocation Display (Read-Only) */}
      <FormGroup
        label="Current Allocation"
        helperText="Use Standard Edit for site changes"
      >
        <div style={{
          padding: '12px',
          backgroundColor: '#F5F8FA',
          borderRadius: '4px',
          fontSize: '13px',
        }}>
          {state.opportunity.allocatedSites && state.opportunity.allocatedSites.length > 0 ? (
            <div>
              <strong>Allocated Sites:</strong>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                {state.opportunity.allocatedSites.map((site: Site) => (
                  <li key={site.id}>{site.name}</li>
                ))}
              </ul>
            </div>
          ) : (
            <em style={{ color: '#5C7080' }}>No sites allocated</em>
          )}
        </div>
      </FormGroup>

      {/* Validation Feedback */}
      {editor.validation.warnings.length > 0 && (
        <Callout intent={Intent.WARNING} icon={IconNames.WARNING_SIGN}>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {editor.validation.warnings.map((warning: string, idx: number) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </Callout>
      )}

      {/* Help Text */}
      <div style={{
        marginTop: '20px',
        padding: '12px',
        backgroundColor: '#EBF1F5',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#5C7080',
      }}>
        <strong>💡 Tip:</strong> For site changes or complex edits, use <strong>Standard Edit</strong> mode.
        This quick mode is for priority adjustments only.
      </div>

      {/* Keyboard Shortcuts Help */}
      <div style={{
        marginTop: '12px',
        fontSize: '11px',
        color: '#A7B6C2',
        textAlign: 'center',
      }}>
        <kbd>Ctrl+S</kbd> to save • <kbd>Esc</kbd> to close
      </div>
    </div>
  );
};
