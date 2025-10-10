/**
 * Justification Tab (Override Mode)
 *
 * Handles detailed justification and classification for overrides
 */

import React from 'react';
import {
  FormGroup,
  TextArea,
  HTMLSelect,
  Intent,
  H6,
  Callout,
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { CollectionOpportunity } from '../../../types/collectionOpportunities';

interface JustificationTabProps {
  editor: any;
  opportunity: CollectionOpportunity;
}

export const JustificationTab: React.FC<JustificationTabProps> = ({
  editor,
  opportunity,
}) => {
  const { state, setJustification, setSpecialInstructions, setClassification } = editor;

  return (
    <div className="justification-tab">
      <H6>Comment required to override site allocation (Secret Data Only)</H6>
      <p style={{ color: '#5C7080', marginBottom: '16px' }}>
        Override comment required for audit trail and operator communication. This information will be
        included in exported tasking and compliance reports.
      </p>

      {/* Required Comment */}
      <FormGroup
        label="Comment"
        labelFor="justification"
        labelInfo="(required)"
        intent={state.validationErrors.has('justification') ? Intent.DANGER : Intent.NONE}
        helperText={
          state.validationErrors.get('justification') ||
          'Comment required to override site allocation'
        }
      >
        <TextArea
          id="justification"
          fill
          growVertically
          rows={5}
          value={state.justification}
          onChange={(e) => setJustification(e.target.value)}
          placeholder="Better elevation angle for target area reduces weather risk by 30%. Historical data shows this site has 95% success rate for similar targets."
        />
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#5C7080' }}>
          {state.justification.length} / 500 characters
          {state.justification.length < 50 && (
            <span style={{ color: '#D9822B', marginLeft: '8px' }}>
              ⚠ Comment must be at least 50 characters
            </span>
          )}
        </div>
      </FormGroup>

      {/* Classification Level */}
      <FormGroup
        label="Classification Level"
        labelFor="classification"
        helperText="Security classification for this allocation"
      >
        <HTMLSelect
          id="classification"
          fill
          value={state.classificationLevel}
          onChange={(e) => setClassification(e.target.value)}
          options={[
            { label: 'Unclassified', value: 'UNCLASSIFIED' },
            { label: 'Confidential', value: 'CONFIDENTIAL' },
            { label: 'Secret', value: 'SECRET' },
            { label: 'Top Secret', value: 'TOP_SECRET' },
          ]}
        />
      </FormGroup>

      {/* Special Instructions (Optional) */}
      <FormGroup
        label="Special Instructions"
        labelFor="special-instructions"
        labelInfo="(optional)"
        helperText="Any special handling or operational notes"
      >
        <TextArea
          id="special-instructions"
          fill
          growVertically
          rows={3}
          value={state.specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          placeholder="e.g., Coordinate with operations team 24h prior, backup power required, etc."
        />
      </FormGroup>

      {/* Guidelines */}
      <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN}>
        <strong>Justification Guidelines:</strong>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '13px' }}>
          <li>Clearly state the reason for the override</li>
          <li>Include quantitative data when possible (e.g., percentages, metrics)</li>
          <li>Reference relevant policies or operational requirements</li>
          <li>Note any risk mitigation strategies</li>
        </ul>
      </Callout>
    </div>
  );
};
