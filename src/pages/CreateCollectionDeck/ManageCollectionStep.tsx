import React, { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button,
  Intent,
  Tag,
  NonIdealState,
  Icon,
  Callout,
  HotkeysProvider,
  Hotkeys,
  InputGroup,
  Spinner
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { useCollectionManagement } from '../../hooks/useCollectionManagement';
import CollectionOpportunitiesEnhanced from '../../components/CollectionOpportunitiesEnhanced';
import { AllocationProvider } from '../../contexts/AllocationContext';
import './ManageCollectionStep.css';

const ManageCollectionStep: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const collectionId = searchParams.get('id');

  // Use the collection management hook for ALL business logic
  const {
    opportunities,
    sites,
    stats,
    filters,
    searchQuery,
    setFilter,
    setSearch,
    setSorting,
    updateOpportunity,
    clearFilters,
    isLoading,
    error
  } = useCollectionManagement(collectionId || '', {
    defaultFilter: 'needsReview'
  });

  // Navigation handlers
  const handleFinish = () => navigate('/history');
  const handleOpenFullManagement = () => navigate(`/collection/${collectionId}/manage`);

  // Keyboard shortcuts
  const hotkeys = useMemo(
    () => [
      {
        combo: 'mod+enter',
        global: true,
        label: 'Finish and view collections',
        onKeyDown: handleFinish,
      },
      {
        combo: 'mod+shift+f',
        global: true,
        label: 'Open full management view',
        onKeyDown: handleOpenFullManagement,
      },
    ],
    [handleFinish, handleOpenFullManagement]
  );

  // Error state
  if (error) {
    return (
      <div className="manage-collection-step">
        <div style={{ padding: '40px' }}>
          <NonIdealState
            icon={IconNames.ERROR}
            title="Failed to Load Collection"
            description={error.message}
            action={
              <Button
                intent={Intent.PRIMARY}
                onClick={() => window.location.reload()}
                text="Retry"
              />
            }
          />
        </div>
      </div>
    );
  }

  // No collection ID state
  if (!collectionId) {
    return (
      <div className="manage-collection-step">
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
      </div>
    );
  }

  return (
    <HotkeysProvider>
      <Hotkeys hotkeys={hotkeys} />
      <div className="manage-collection-step">
        {/* Sticky Header - Minimal (5% viewport target) */}
        <div className="manage-step-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Tag intent={Intent.PRIMARY}>{collectionId}</Tag>
            <span className="bp5-text-muted">Step 3 of 3: Review & Manage (Optional)</span>
          </div>
        </div>

        {/* Scrollable Content Area (75% viewport target for table) */}
        <div className="manage-step-content">
          {/* Success Banner - Simplified */}
          <Callout
            intent={Intent.SUCCESS}
            icon={IconNames.TICK_CIRCLE}
            style={{ marginBottom: '24px' }}
          >
            Collection created with <strong>{stats.total} opportunities</strong>.
            {stats.needsReview > 0 && (
              <> <Tag intent={Intent.WARNING} minimal>{stats.needsReview} need review</Tag></>
            )}
          </Callout>

          {/* Native Management Content (NOT embedded app) */}
          <div className="management-content">
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>
              Review Assignments
            </h3>

            {/* Filters Toolbar */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <InputGroup
                leftIcon={IconNames.SEARCH}
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: 1, minWidth: '200px' }}
              />
            </div>

            {/* Filter Chips */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#738694' }}>Filters:</span>

              <Button
                intent={filters.highPriority ? Intent.PRIMARY : Intent.NONE}
                icon={filters.highPriority ? IconNames.FILTER_KEEP : IconNames.FILTER}
                text={`High Priority (${stats.highPriority})`}
                onClick={() => setFilter({ highPriority: !filters.highPriority })}
                small
              />

              <Button
                intent={filters.needsReview ? Intent.WARNING : Intent.NONE}
                icon={filters.needsReview ? IconNames.FILTER_KEEP : IconNames.FILTER}
                text={`Needs Review (${stats.needsReview})`}
                onClick={() => setFilter({ needsReview: !filters.needsReview })}
                small
              />

              <Button
                intent={filters.unmatched ? Intent.DANGER : Intent.NONE}
                icon={filters.unmatched ? IconNames.FILTER_KEEP : IconNames.FILTER}
                text={`Unmatched (${stats.unmatched})`}
                onClick={() => setFilter({ unmatched: !filters.unmatched })}
                small
              />

              {(filters.highPriority || filters.needsReview || filters.unmatched || searchQuery) && (
                <Button
                  text="Clear All"
                  onClick={clearFilters}
                  minimal
                  small
                />
              )}

              <span style={{ marginLeft: 'auto', fontSize: '14px', color: '#738694' }}>
                Showing <strong>{opportunities.length}</strong> of {stats.total}
              </span>
            </div>

            {/* Opportunities Table - Native, not embedded */}
            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <Spinner />
              </div>
            ) : opportunities.length === 0 ? (
              <NonIdealState
                icon={IconNames.SEARCH}
                title="No Opportunities Found"
                description={
                  searchQuery || filters.needsReview || filters.highPriority || filters.unmatched
                    ? 'Try adjusting your filters or search query'
                    : 'No opportunities available for this collection'
                }
                action={
                  (searchQuery || filters.needsReview || filters.highPriority || filters.unmatched) && (
                    <Button
                      icon={IconNames.CROSS}
                      text="Clear Filters"
                      onClick={clearFilters}
                    />
                  )
                }
              />
            ) : (
              <AllocationProvider
                initialOpportunities={opportunities}
                initialSites={sites}
                capacityThresholds={{
                  critical: 10,
                  warning: 30,
                  optimal: 70
                }}
                enableRealTimeUpdates={false}
                onBatchUpdate={async (changes) => {
                  console.log('Batch update:', changes);
                  // TODO: Implement batch update via hook
                  return { success: [], failed: [] };
                }}
              >
                <CollectionOpportunitiesEnhanced
                  opportunities={opportunities}
                  availableSites={sites}
                  onBatchUpdate={async (changes) => {
                    console.log('Batch update:', changes);
                    // TODO: Implement batch update via hook
                  }}
                  capacityThresholds={{
                    critical: 10,
                    warning: 30,
                    optimal: 70
                  }}
                  enableRealTimeValidation={false}
                  enableHealthAnalysis={false}
                  showWorkspaceOption={false}
                  showValidationOption={false}
                />
              </AllocationProvider>
            )}
          </div>
        </div>

        {/* Sticky Footer - SINGLE footer, 3 actions (Hick's Law: 40% reduction from 5) */}
        <div className="manage-step-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon icon={IconNames.SAVED} intent={Intent.SUCCESS} size={12} />
            <span className="bp5-text-muted">Changes saved automatically</span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              text="Back"
              onClick={() => navigate(-1)}
              large
            />
            <Button
              text="Finish & View Collections"
              onClick={handleFinish}
              large
              data-testid="finish-button"
            />
            <Button
              intent={Intent.PRIMARY}
              text="Open Full Management View"
              rightIcon={IconNames.MAXIMIZE}
              onClick={handleOpenFullManagement}
              large
              data-testid="open-full-management-button"
            />
          </div>
        </div>
      </div>
    </HotkeysProvider>
  );
};

export default ManageCollectionStep;
