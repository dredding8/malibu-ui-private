import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button,
  Intent,
  Tag,
  NonIdealState,
  Icon,
  Section,
  Callout,
  HotkeysProvider,
  Hotkeys
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import CollectionOpportunitiesHub from '../CollectionOpportunitiesHub';
import './ManageCollectionStep.css';

const ManageCollectionStep: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const collectionId = searchParams.get('id');

  // Calculate summary stats from collection data
  const stats = {
    total: 50,
    highPriority: 0,
    needsReview: 9,
    optimal: 41
  };

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

  const handleOpenFullManagement = () => {
    navigate(`/collection/${collectionId}/manage`);
  };

  const handleFinish = () => {
    navigate('/history');
  };

  // Keyboard shortcuts
  const hotkeys = useMemo(
    () => [
      {
        combo: 'mod+enter',
        global: true,
        label: 'Save and exit wizard',
        onKeyDown: handleFinish,
      },
      {
        combo: 'mod+shift+f',
        global: true,
        label: 'Switch to full view',
        onKeyDown: handleOpenFullManagement,
      },
    ],
    [handleFinish, handleOpenFullManagement]
  );

  return (
    <HotkeysProvider>
      <Hotkeys hotkeys={hotkeys} />
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sticky Header - Collection context */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: '#fff',
          padding: '16px 24px',
          borderBottom: '1px solid #d3d8de',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Tag intent={Intent.PRIMARY}>{collectionId}</Tag>
          <span className="bp5-text-muted">Step 3 of 3</span>
          <Icon icon={IconNames.TICK_CIRCLE} intent={Intent.SUCCESS} />
          <span style={{ color: '#0d8050', fontWeight: 500 }}>Complete</span>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Compact Status Banner */}
        <div style={{ padding: '12px 24px 0 24px' }}>
          <Callout
            intent={Intent.SUCCESS}
            icon={IconNames.TICK_CIRCLE}
            style={{ padding: '8px 12px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <strong>Collection Ready:</strong>
                <span>{stats.total} opportunities loaded</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {stats.needsReview > 0 && (
                    <Tag intent={Intent.WARNING} minimal>
                      {stats.needsReview} need review
                    </Tag>
                  )}
                  <Tag intent={Intent.SUCCESS} minimal>
                    {stats.optimal} optimal
                  </Tag>
                </div>
              </div>
            </div>
          </Callout>
        </div>

        <Section
          title="Collection Management"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '24px',
            minHeight: 0
          }}
        >
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <CollectionOpportunitiesHub
              collectionId={collectionId}
              embedded={true}
              defaultFilter="needsReview"
              compactMode={true}
              onNavigateToFull={handleOpenFullManagement}
            />
          </div>
        </Section>
      </div>

      {/* Sticky Footer - Primary actions */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 10,
          background: '#fff',
          padding: '16px 24px',
          borderTop: '1px solid #d3d8de',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon icon={IconNames.SAVED} intent={Intent.SUCCESS} size={12} />
          <span className="bp5-text-muted">Changes saved automatically</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button
            text="Save & Exit Wizard"
            onClick={handleFinish}
            size="large"
            data-testid="finish-button"
          />
          <Button
            intent={Intent.PRIMARY}
            text="Switch to Full View"
            onClick={handleOpenFullManagement}
            rightIcon={IconNames.MAXIMIZE}
            size="large"
            data-testid="open-full-management-button"
          />
        </div>
      </div>
    </div>
    </HotkeysProvider>
  );
};

export default ManageCollectionStep;
