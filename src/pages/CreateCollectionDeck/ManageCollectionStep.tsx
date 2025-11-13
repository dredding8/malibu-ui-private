import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Divider,
  Button,
  Intent,
  Card,
  Callout,
  Tag,
  NonIdealState,
  ButtonGroup
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import CollectionOpportunitiesHub from '../CollectionOpportunitiesHub';

const ManageCollectionStep: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const collectionId = searchParams.get('id');
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  // P0-2: Focus management - Focus success message for accessibility
  useEffect(() => {
    // Focus the success heading so screen readers announce it
    if (successHeadingRef.current) {
      successHeadingRef.current.focus();
    }
  }, []);

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
      {/* Success Header */}
      {/* P0-3: ARIA attributes - Add role and aria-live for screen reader announcements */}
      <div
        style={{ textAlign: 'center', marginBottom: '24px' }}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <NonIdealState
          icon={IconNames.TICK_CIRCLE}
          title={
            <h4 ref={successHeadingRef} tabIndex={-1} style={{ outline: 'none', color: '#0F9960' }}>
              Collection Created Successfully!
            </h4>
          }
          description={
            <div>
              <p>Your collection deck has been created and is now ready to manage.</p>
              <p style={{ marginTop: '16px' }}>
                <strong>Collection ID:</strong> <Tag intent={Intent.PRIMARY}>{collectionId}</Tag>
              </p>
            </div>
          }
        />
      </div>

      <Divider />

      {/* Step Header */}
      <h3 style={{ marginTop: '24px' }} id="step3-heading">Step 3: Manage Collection</h3>
      <Divider style={{ margin: '24px 0' }} />

      {/* Instructions */}
      <div style={{ marginBottom: '24px' }}>
        <Callout intent={Intent.SUCCESS} icon={IconNames.TICK} id="step3-instructions">
          <strong>Your collection is ready!</strong> Use the management interface below to review assignments, allocate sites,
          filter opportunities, and configure your collection. All features from the standalone management page are available here.
        </Callout>
      </div>

      {/* Embedded Collection Management Interface */}
      {/* P0-3: Add section with proper labeling for accessibility context */}
      <section
        aria-labelledby="step3-heading"
        aria-describedby="step3-instructions"
      >
        <Card style={{ padding: '0', marginBottom: '24px' }}>
          <CollectionOpportunitiesHub collectionId={collectionId} embedded={true} />
        </Card>
      </section>

      {/* Navigation Actions */}
      <Card style={{ padding: '24px', textAlign: 'center', backgroundColor: '#f5f8fa' }}>
        <h4 style={{ marginBottom: '16px' }}>✅ Wizard Complete</h4>
        <p style={{ marginBottom: '24px', color: '#666' }}>
          Your collection deck has been created and is ready to use. Choose what to do next:
        </p>

        <ButtonGroup>
          <Button
            intent={Intent.PRIMARY}
            icon={IconNames.HISTORY}
            text="Finish & Go to History"
            onClick={handleViewHistory}
            data-testid="finish-go-to-history"
            style={{ minWidth: '200px', height: '40px', fontSize: '14px' }}
          />
          <Button
            icon={IconNames.PLUS}
            text="Create Another Collection"
            onClick={handleCreateAnother}
            data-testid="create-another-collection"
            style={{ minWidth: '200px', height: '40px', fontSize: '14px' }}
          />
        </ButtonGroup>

        <div style={{ marginTop: '16px' }}>
          <Button
            icon={IconNames.LINK}
            text="Open Standalone Management Page"
            onClick={() => navigate(`/collection/${collectionId}/manage`)}
            data-testid="open-standalone-page"
            style={{ fontSize: '13px' }}
          />
        </div>

        {/* Quick Tips */}
        <div style={{ marginTop: '32px', textAlign: 'left' }}>
          <h4 style={{ marginBottom: '16px' }}>📌 Quick Tips</h4>
          <ul style={{ marginLeft: '24px', lineHeight: '1.8', color: '#666' }}>
            <li>
              <strong>Review Assignments:</strong> Check the assignment table above to review all opportunities and their match status.
            </li>
            <li>
              <strong>Priority Items:</strong> Focus on opportunities with priority ≥34 (SEQ system) shown at the top.
            </li>
            <li>
              <strong>Site Allocation:</strong> Allocate sites to opportunities as needed directly in the table above.
            </li>
            <li>
              <strong>History Page:</strong> You can always return to manage this collection from the History page.
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default ManageCollectionStep;
