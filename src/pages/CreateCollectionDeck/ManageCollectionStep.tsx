import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Divider,
  Button,
  Intent,
  Callout,
  Tag,
  NonIdealState,
  ButtonGroup,
  H3,
  H5,
  Classes,
  Icon,
  Section,
  SectionCard
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import CollectionOpportunitiesHub from '../CollectionOpportunitiesHub';

const ManageCollectionStep: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const collectionId = searchParams.get('id');

  if (!collectionId) {
    return (
      <div style={{ padding: '40px' }}>
        <NonIdealState
          icon={IconNames.ERROR}
          title="No Collection ID"
          description="Unable to find the collection ID. Please try creating a collection again."
          action={
            <Button
              intent={Intent.PRIMARY}
              icon={IconNames.ARROW_LEFT}
              text="Create Collection"
              onClick={() => navigate('/create-collection-deck')}
              data-testid="create-collection-error-action"
            />
          }
        />
      </div>
    );
  }

  const handleViewHistory = () => {
    navigate('/history');
  };

  const handleCreateAnother = () => {
    navigate('/create-collection-deck');
  };

  return (
    <div>
      {/* Main Heading - Single H3 hierarchy */}
      <H3 id="collection-management-heading" style={{ marginBottom: '20px' }}>
        Collection Management
      </H3>

      {/* Section with 3 SectionCards for clear information grouping (Miller's Law + Gestalt Common Region) */}
      <Section>
        {/* SectionCard 1: Confirmation - Success message and collection ID */}
        <SectionCard style={{ marginBottom: '20px' }}>
          <div
            style={{ textAlign: 'center' }}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <NonIdealState
              icon={IconNames.TICK_CIRCLE}
              title={
                <H5 className={Classes.INTENT_SUCCESS}>
                  Collection Created Successfully!
                </H5>
              }
              description={
                <div>
                  <p>Your collection deck has been created and is now ready to manage.</p>
                  <p style={{ marginTop: '12px' }}>
                    <strong>Collection ID:</strong> <Tag intent={Intent.PRIMARY}>{collectionId}</Tag>
                  </p>
                  <Callout
                    intent={Intent.SUCCESS}
                    icon={IconNames.INFO_SIGN}
                    style={{ marginTop: '16px', textAlign: 'left' }}
                    compact
                  >
                    <strong>Quick Tip:</strong> Focus on opportunities with priority ≥34 (SEQ system) shown at the top of the table below.
                  </Callout>
                </div>
              }
            />
          </div>
        </SectionCard>

        {/* SectionCard 2: Management Interface - Primary work area */}
        <SectionCard
          style={{ marginBottom: '20px' }}
          aria-labelledby="collection-management-heading"
        >
          <CollectionOpportunitiesHub collectionId={collectionId} embedded={true} />
        </SectionCard>

        {/* SectionCard 3: Navigation - Clear next steps with reduced actions (Hick's Law: 2 primary actions) */}
        <SectionCard>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <H5 style={{ marginBottom: '12px' }}>
              <Icon icon={IconNames.TICK_CIRCLE} /> Wizard Complete
            </H5>
            <p style={{ marginBottom: '20px', color: '#5c7080' }}>
              Choose what to do next:
            </p>

            <ButtonGroup style={{ marginBottom: '20px' }}>
              <Button
                intent={Intent.PRIMARY}
                icon={IconNames.HISTORY}
                text="Finish & Go to History"
                onClick={handleViewHistory}
                data-testid="finish-go-to-history"
                size="large"
              />
              <Button
                icon={IconNames.PLUS}
                text="Create Another Collection"
                onClick={handleCreateAnother}
                data-testid="create-another-collection"
                size="large"
              />
            </ButtonGroup>

            <Divider style={{ margin: '20px 0' }} />

            <div style={{ textAlign: 'left' }}>
              <H5 style={{ marginBottom: '12px' }}>
                <Icon icon={IconNames.INFO_SIGN} size={14} /> Management Tips
              </H5>
              <ul style={{ marginLeft: '20px', lineHeight: '1.8', color: '#5c7080', fontSize: '14px' }}>
                <li>
                  <strong>Review Assignments:</strong> Check the table above for all opportunities and match status.
                </li>
                <li>
                  <strong>Site Allocation:</strong> Allocate sites to opportunities directly in the table.
                </li>
                <li>
                  <strong>Future Access:</strong> Return to manage this collection anytime from the History page.
                </li>
              </ul>
            </div>
          </div>
        </SectionCard>
      </Section>
    </div>
  );
};

export default ManageCollectionStep;
