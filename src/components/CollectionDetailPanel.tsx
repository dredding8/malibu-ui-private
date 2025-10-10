import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  H5,
  ButtonGroup,
  Button,
  Divider,
  Intent,
  Classes,
  Elevation,
  Colors,
  NonIdealState,
  Tag,
  Tooltip,
  ProgressBar,
  Callout,
  Text
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { useLocalization } from '../hooks/useLocalization';
import { 
  NAVIGATION_LABELS, 
  NAVIGATION_ROUTES, 
  NAVIGATION_DESCRIPTIONS 
} from '../constants/navigation';
import {
  CollectionDeckStatus,
  AlgorithmStatus,
  COLLECTION_STATUS_LABELS,
  ALGORITHM_STATUS_LABELS,
  ALGORITHM_STATUS_INTENTS,
  resolveCollectionStatus
} from '../constants/statusTypes';

interface CollectionDetailPanelProps {
  collection: {
    id: string;
    name: string;
    collectionDeckStatus: CollectionDeckStatus;
    algorithmStatus: AlgorithmStatus;
    progress: number;
    createdDate: Date;
    createdBy: string;
    completionDate?: Date;
  } | null;
  onClose?: () => void;
}

const CollectionDetailPanel: React.FC<CollectionDetailPanelProps> = ({ 
  collection, 
  onClose 
}) => {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const [isDownloading, setIsDownloading] = useState(false);

  if (!collection) {
    return (
      <Card 
        elevation={Elevation.TWO} 
        style={{ 
          width: '320px',
          height: '100%',
          padding: '20px',
          backgroundColor: Colors.LIGHT_GRAY5
        }}
      >
        <NonIdealState
          icon={IconNames.SELECTION}
          title="No Collection Selected"
          description="Select a collection from the table to view available actions."
        />
      </Card>
    );
  }

  // Determine collection status
  const isComplete = collection.algorithmStatus === 'converged';
  const isInProgress = ['running', 'optimizing', 'queued'].includes(collection.algorithmStatus);
  const hasFailed = ['error', 'timeout'].includes(collection.algorithmStatus);
  
  // Status-specific messaging
  const getStatusMessage = () => {
    if (isComplete) return "Collection ready for all actions";
    if (isInProgress) return "Collection still processing...";
    if (hasFailed) return "Collection needs attention";
    return "Collection status unknown";
  };

  // Handle download with loading state
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // TODO: Implement actual download logic
      console.log('Downloading results for collection:', collection.id);
      // Simulate download delay
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      setIsDownloading(false);
    }
  };

  // Get status intent for tag
  const getAlgorithmIntent = (status: AlgorithmStatus): Intent => {
    const intentString = ALGORITHM_STATUS_INTENTS[status];
    return Intent[intentString as keyof typeof Intent] || Intent.NONE;
  };

  // Format dates
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <Card 
      elevation={Elevation.TWO} 
      data-testid="collection-detail-panel"
      style={{ 
        width: '320px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{ 
        padding: '16px 20px',
        borderBottom: `1px solid ${Colors.LIGHT_GRAY3}`,
        backgroundColor: Colors.WHITE
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '12px'
        }}>
          <H5 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
            Collection Details
          </H5>
          {onClose && (
            <Button
              minimal
              icon={IconNames.CROSS}
              onClick={onClose}
              aria-label="Close details panel"
              data-testid="collection-detail-panel-close"
            />
          )}
        </div>
        
        {/* Collection Name */}
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '14px', 
            fontWeight: 600,
            color: Colors.DARK_GRAY1,
            marginBottom: '4px'
          }}>
            {collection.name}
          </h3>
          <Tag 
            intent={getAlgorithmIntent(collection.algorithmStatus)}
            style={{ marginTop: '4px' }}
          >
            {ALGORITHM_STATUS_LABELS[collection.algorithmStatus]}
          </Tag>
        </div>
      </div>

      {/* Status Banner */}
      <div style={{ padding: '16px 20px 0' }}>
        <Callout 
          intent={isComplete ? Intent.SUCCESS : isInProgress ? Intent.PRIMARY : Intent.WARNING}
          icon={isComplete ? IconNames.TICK_CIRCLE : isInProgress ? IconNames.TIME : IconNames.WARNING_SIGN}
          style={{ marginBottom: '16px' }}
        >
          {getStatusMessage()}
        </Callout>

        {/* Progress Indicator for In-Progress */}
        {isInProgress && (
          <ProgressBar 
            value={collection.progress / 100} 
            intent={Intent.PRIMARY}
            style={{ marginBottom: '16px' }}
            animate
            stripes
          />
        )}
      </div>

      {/* Collection Info */}
      <div style={{ 
        padding: '16px 20px',
        borderBottom: `1px solid ${Colors.LIGHT_GRAY3}`,
        backgroundColor: Colors.LIGHT_GRAY5
      }}>
        <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <span style={{ color: Colors.GRAY1 }}>Created:</span>
            <span style={{ fontWeight: 500 }}>{formatDate(collection.createdDate)}</span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <span style={{ color: Colors.GRAY1 }}>Created by:</span>
            <span style={{ fontWeight: 500 }}>{collection.createdBy}</span>
          </div>
          {collection.completionDate && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between'
            }}>
              <span style={{ color: Colors.GRAY1 }}>Completed:</span>
              <span style={{ fontWeight: 500 }}>{formatDate(collection.completionDate)}</span>
            </div>
          )}
          {isInProgress && collection.progress > 0 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between'
            }}>
              <span style={{ color: Colors.GRAY1 }}>Progress:</span>
              <span style={{ fontWeight: 500 }}>{collection.progress}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ 
        padding: '20px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <h6 style={{ 
          margin: '0 0 12px 0', 
          fontSize: '13px', 
          fontWeight: 600,
          color: Colors.GRAY1,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Available Actions
        </h6>

        <ButtonGroup vertical fill>
          <Tooltip 
            content={!isComplete ? "Complete collection to view details" : "View collection details"}
            disabled={isComplete}
            position="left"
          >
            <Button
              icon={IconNames.EYE_OPEN}
              text={NAVIGATION_LABELS.VIEW_COLLECTION}
              intent={isComplete ? Intent.PRIMARY : Intent.NONE}
              disabled={!isComplete}
              onClick={() => navigate(`${NAVIGATION_ROUTES.COLLECTIONS}/${collection.id}`)}
              data-testid="detail-view-collection"
            />
          </Tooltip>

          <Tooltip 
            content={!isComplete ? "Complete collection to view opportunities" : "Explore collection opportunities"}
            disabled={isComplete}
            position="left"
          >
            <Button
              icon={IconNames.SATELLITE}
              text={NAVIGATION_LABELS.COLLECTION_OPPORTUNITIES_BTN}
              intent={Intent.NONE}
              disabled={!isComplete}
              onClick={() => navigate(NAVIGATION_ROUTES.COLLECTION_OPPORTUNITIES_VIEW(collection.id))}
              data-testid="detail-view-opportunities"
            />
          </Tooltip>

          <Tooltip 
            content={!isComplete ? "Complete collection to review mappings" : "Review field mappings"}
            disabled={isComplete}
            position="left"
          >
            <Button
              icon={IconNames.FLOWS}
              text={NAVIGATION_LABELS.FIELD_MAPPINGS}
              intent={Intent.NONE}
              disabled={!isComplete}
              onClick={() => navigate(NAVIGATION_ROUTES.FIELD_MAPPING_REVIEW(collection.id))}
              data-testid="detail-view-mappings"
            />
          </Tooltip>
        </ButtonGroup>

        <Divider style={{ margin: '8px 0' }} />

        <Tooltip 
          content={!isComplete ? "Collection must be complete to download" : "Download collection results"}
          disabled={isComplete}
          position="left"
        >
          <Button
            icon={IconNames.DOWNLOAD}
            text={t('history.actions.downloadResults') || 'Download Results'}
            intent={isComplete ? Intent.SUCCESS : Intent.NONE}
            disabled={!isComplete || isDownloading}
            loading={isDownloading}
            size="large"
            fill
            onClick={handleDownload}
            data-testid="detail-download"
          />
        </Tooltip>

        {/* Retry button for failed collections */}
        {hasFailed && (
          <Button
            icon={IconNames.REFRESH}
            text={t('history.actions.retry') || 'Retry'}
            intent={Intent.WARNING}
            fill
            onClick={() => {
              // TODO: Implement retry logic
              console.log('Retrying collection:', collection.id);
            }}
            data-testid="detail-retry"
          />
        )}

        {/* Help Text */}
        <div style={{ 
          marginTop: 'auto',
          padding: '12px',
          backgroundColor: Colors.LIGHT_GRAY4,
          borderRadius: '4px',
          fontSize: '12px',
          color: Colors.GRAY1,
          lineHeight: 1.5
        }}>
          {isInProgress && (
            <Text className={Classes.TEXT_MUTED}>Check back when processing completes</Text>
          )}
          {hasFailed && (
            <Text className={Classes.TEXT_MUTED}>Review errors in the main table</Text>
          )}
          {isComplete && (
            <>
              <strong>Tip:</strong> Use keyboard shortcuts for quick actions.
              Press <kbd>V</kbd> to view, <kbd>D</kbd> to download. Press <kbd>ESC</kbd> to close.
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CollectionDetailPanel;