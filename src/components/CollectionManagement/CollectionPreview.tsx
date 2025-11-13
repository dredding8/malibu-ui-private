import React from 'react';
import {
  Card,
  H5,
  Button,
  ButtonGroup,
  ProgressBar,
  Intent,
  Icon as BpIcon
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

// Type-safe Icon wrapper
const Icon: React.FC<React.ComponentProps<typeof BpIcon>> = (props) => {
  const iconElement = React.createElement(BpIcon, props);
  return <>{iconElement}</>;
};

interface CollectionPreviewProps {
  collectionId: string;
  embeddedMode?: boolean;
  onOpenFull?: () => void;
}

export const CollectionPreview: React.FC<CollectionPreviewProps> = ({
  collectionId,
  embeddedMode = false,
  onOpenFull
}) => {
  // Simplified view for wizard Step 6
  if (embeddedMode) {
    return (
      <div className="collection-preview-embedded" data-testid="collection-preview-embedded">
        <div style={{ marginBottom: '20px' }}>
          <Callout
            intent={Intent.PRIMARY}
            icon={IconNames.INFO_SIGN}
            style={{ marginBottom: '16px' }}
          >
            Your collection is processing. You can begin preparation or wait for completion.
          </Callout>
        </div>

        {/* Simplified Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '20px'
          }}
          data-testid="metrics-grid"
        >
          <Card
            className="metric-card"
            style={{
              padding: '16px',
              border: '1px solid #D3D8DE',
              borderRadius: '6px'
            }}
          >
            <div className="metric-content">
              <Icon icon={IconNames.DASHBOARD} size={20} />
              <div style={{ fontSize: '32px', fontWeight: '700', margin: '8px 0' }}>0%</div>
              <div style={{ fontSize: '14px', color: '#5C7080' }}>Processing Progress</div>
              <ProgressBar value={0} intent={Intent.PRIMARY} style={{ marginTop: '8px' }} />
            </div>
          </Card>

          <Card
            className="metric-card"
            style={{
              padding: '16px',
              border: '1px solid #D3D8DE',
              borderRadius: '6px'
            }}
          >
            <div className="metric-content">
              <Icon icon={IconNames.TIME} size={20} />
              <div style={{ fontSize: '32px', fontWeight: '700', margin: '8px 0' }}>Queued</div>
              <div style={{ fontSize: '14px', color: '#5C7080' }}>Current Status</div>
            </div>
          </Card>

          <Card
            className="metric-card"
            style={{
              padding: '16px',
              border: '1px solid #D3D8DE',
              borderRadius: '6px'
            }}
          >
            <div className="metric-content">
              <Icon icon={IconNames.NOTIFICATIONS} size={20} />
              <div style={{ fontSize: '32px', fontWeight: '700', margin: '8px 0' }}>--</div>
              <div style={{ fontSize: '14px', color: '#5C7080' }}>Estimated Time</div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card style={{ padding: '16px' }} data-testid="quick-actions-card">
          <H5 style={{ marginBottom: '12px' }}>Quick Actions</H5>
          <ButtonGroup vertical fill>
            <Button
              icon={IconNames.EYE_OPEN}
              text="Open Full Management Dashboard"
              onClick={onOpenFull}
              data-testid="open-full-button"
            />
            <Button
              icon={IconNames.NOTIFICATIONS}
              text="Set Up Progress Alerts"
              data-testid="setup-alerts-button"
            />
          </ButtonGroup>
        </Card>
      </div>
    );
  }

  // Full dashboard view (placeholder for standalone management page)
  return (
    <div className="collection-preview-full" data-testid="collection-preview-full">
      <p>Full management dashboard view (reuse CollectionManagementMockup here)</p>
    </div>
  );
};

// Import Callout from blueprintjs
import { Callout } from '@blueprintjs/core';
