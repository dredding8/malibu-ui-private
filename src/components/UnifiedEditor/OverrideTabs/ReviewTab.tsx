/**
 * Review Tab (Override Mode)
 *
 * Final review before saving override changes
 */

import React from 'react';
import {
  Card,
  Tag,
  Intent,
  H6,
  Divider,
  Callout,
  Button,
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { CollectionOpportunity, Site } from '../../../types/collectionOpportunities';

interface ReviewTabProps {
  editor: any;
  opportunity: CollectionOpportunity;
  availableSites: Site[];
}

export const ReviewTab: React.FC<ReviewTabProps> = ({
  editor,
  opportunity,
  availableSites,
}) => {
  const { state, validation } = editor;

  const selectedSites = availableSites.filter(site =>
    state.selectedSiteIds.includes(site.id)
  );

  return (
    <div className="review-tab">
      <H6>Review Changes</H6>
      <p style={{ color: '#5C7080', marginBottom: '16px' }}>
        Review all changes before saving. Ensure justification is complete and accurate.
      </p>

      {/* Validation Status */}
      {validation.isValid ? (
        <Callout intent={Intent.SUCCESS} icon={IconNames.TICK_CIRCLE}>
          <strong>All validations passed.</strong> Ready to save override.
        </Callout>
      ) : (
        <Callout intent={Intent.DANGER} icon={IconNames.ERROR}>
          <strong>Validation errors detected:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            {Array.from(validation.errors.entries()).map(([field, message]) => (
              <li key={field}>{message}</li>
            ))}
          </ul>
        </Callout>
      )}

      <Divider style={{ margin: '20px 0' }} />

      {/* Changes Summary */}
      <Card elevation={0} style={{ backgroundColor: '#F5F8FA' }}>
        <H6>Change Summary</H6>

        {/* Opportunity Details */}
        <div style={{ marginTop: '12px' }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: '#5C7080', marginBottom: '4px' }}>
              Opportunity
            </div>
            <div style={{ fontWeight: 600 }}>{opportunity.name}</div>
            <div style={{ fontSize: '13px', color: '#5C7080' }}>
              {opportunity.satellite.name}
            </div>
          </div>

          <Divider />

          {/* Site Changes */}
          <div style={{ margin: '12px 0' }}>
            <div style={{ fontSize: '12px', color: '#5C7080', marginBottom: '4px' }}>
              Allocated Sites
            </div>
            {selectedSites.length > 0 ? (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {selectedSites.map(site => (
                  <Tag key={site.id} large>
                    {site.name}
                  </Tag>
                ))}
              </div>
            ) : (
              <em style={{ color: '#5C7080' }}>No sites selected</em>
            )}
          </div>

          <Divider />

          {/* Priority */}
          <div style={{ margin: '12px 0' }}>
            <div style={{ fontSize: '12px', color: '#5C7080', marginBottom: '4px' }}>
              Priority
            </div>
            <Tag
              intent={
                state.opportunity.priority === 'critical' ? Intent.DANGER :
                state.opportunity.priority === 'high' ? Intent.WARNING :
                Intent.NONE
              }
              large
            >
              {state.opportunity.priority.toUpperCase()}
            </Tag>
          </div>

          <Divider />

          {/* Justification */}
          <div style={{ margin: '12px 0' }}>
            <div style={{ fontSize: '12px', color: '#5C7080', marginBottom: '4px' }}>
              Justification
            </div>
            {state.justification ? (
              <div style={{
                padding: '12px',
                backgroundColor: 'white',
                borderRadius: '4px',
                fontSize: '13px',
                whiteSpace: 'pre-wrap',
              }}>
                {state.justification}
              </div>
            ) : (
              <em style={{ color: '#D9822B' }}>No justification provided</em>
            )}
          </div>

          {/* Classification */}
          <Divider />
          <div style={{ margin: '12px 0' }}>
            <div style={{ fontSize: '12px', color: '#5C7080', marginBottom: '4px' }}>
              Classification
            </div>
            <Tag intent={Intent.WARNING}>
              {state.classificationLevel}
            </Tag>
          </div>

          {/* Special Instructions */}
          {state.specialInstructions && (
            <>
              <Divider />
              <div style={{ margin: '12px 0' }}>
                <div style={{ fontSize: '12px', color: '#5C7080', marginBottom: '4px' }}>
                  Special Instructions
                </div>
                <div style={{
                  padding: '12px',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  fontSize: '13px',
                  whiteSpace: 'pre-wrap',
                }}>
                  {state.specialInstructions}
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Warnings */}
      {validation.warnings.length > 0 && (
        <Callout intent={Intent.WARNING} icon={IconNames.WARNING_SIGN} style={{ marginTop: '16px' }}>
          <strong>Warnings:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            {validation.warnings.map((warning: string, idx: number) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </Callout>
      )}

      {/* Suggestions */}
      {validation.suggestions.length > 0 && (
        <Callout intent={Intent.PRIMARY} icon={IconNames.LIGHTBULB} style={{ marginTop: '12px' }}>
          <strong>Suggestions:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            {validation.suggestions.map((suggestion: string, idx: number) => (
              <li key={idx}>{suggestion}</li>
            ))}
          </ul>
        </Callout>
      )}

      {/* Final Confirmation */}
      <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN} style={{ marginTop: '20px' }}>
        <strong>Before Saving:</strong>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '13px' }}>
          <li>Verify all site selections are correct</li>
          <li>Ensure justification is detailed and accurate</li>
          <li>Confirm classification level is appropriate</li>
          <li>Review special instructions for completeness</li>
        </ul>
      </Callout>
    </div>
  );
};
