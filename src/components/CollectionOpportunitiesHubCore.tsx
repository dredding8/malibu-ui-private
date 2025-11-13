import React, { useState, useEffect, useMemo, lazy, Suspense, memo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Breadcrumbs,
  Spinner,
  NonIdealState,
  Button,
  ButtonGroup,
  Intent,
  Card,
  Callout,
  Classes,
  Icon,
  Popover,
  Menu,
  MenuItem,
  MenuDivider,
  Elevation
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

// Helper function to calculate trends with edge case handling
const calculateTrend = (values: number[]): 'increasing' | 'decreasing' | 'stable' => {
  // Edge cases
  if (!values || values.length === 0) return 'stable';
  if (values.length < 2) return 'stable';

  // Get recent and older values
  const recent = values.slice(-3);
  const older = values.slice(-6, -3);

  // Not enough historical data
  if (older.length === 0) return 'stable';

  // Calculate averages
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

  // Prevent division by zero
  if (olderAvg === 0) {
    return recentAvg > 0 ? 'increasing' : 'stable';
  }

  // Calculate percentage change
  const change = (recentAvg - olderAvg) / Math.abs(olderAvg);

  // Determine trend based on thresholds
  if (change > 0.1) return 'increasing';
  if (change < -0.1) return 'decreasing';
  return 'stable';
};

// Legacy imports
import { useAllocationContext } from '../contexts/AllocationContext';
import CollectionOpportunitiesEnhanced from './CollectionOpportunitiesEnhanced';

import { CollectionOpportunity, Pass } from '../types/collectionOpportunities';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import ValidationPanel from './ValidationPanel';
import UnifiedOpportunityEditor from './UnifiedOpportunityEditor';
import '../pages/CollectionOpportunitiesHub.css';
import '../pages/CollectionOpportunitiesHub.enhanced.css';
import '../pages/CollectionOpportunitiesHub.accessible.css';
import { SkipToMain, LiveRegion, KeyboardInstructions } from './CollectionOpportunitiesHubAccessible';
import { usePerformanceMonitor, useDebouncedFilter } from '../utils/performanceOptimizations';
import { useKeyboardNavigation, collectionOpportunitiesShortcuts } from '../hooks/useKeyboardNavigation';

// Lazy load heavy components for performance with error boundaries
const ReallocationWorkspace = lazy(() =>
  import('./ReallocationWorkspace').catch(() =>
    ({ default: () => <NonIdealState icon={IconNames.ERROR} title="Failed to load workspace" /> })
  )
);

export interface CollectionOpportunitiesHubCoreProps {
  embeddedMode?: boolean;
  defaultFilter?: 'all' | 'needsReview' | 'highPriority' | 'unmatched';
  compactMode?: boolean;
  onNavigateToFull?: () => void;
  onWizardNext?: () => void;
  onWizardBack?: () => void;
  onWizardExit?: () => void;
}

// Core component content - extracted for reuse in wizard
const CollectionOpportunitiesHubCore: React.FC<CollectionOpportunitiesHubCoreProps> = memo(({
  embeddedMode = false,
  defaultFilter = 'all',
  compactMode = false,
  onNavigateToFull,
  onWizardNext,
  onWizardBack,
  onWizardExit
}) => {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  const { state, openWorkspace, closeWorkspace, commitChanges, rollbackChanges } = useAllocationContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const [showUnifiedEditor, setShowUnifiedEditor] = useState(false);
  const [editorMode, setEditorMode] = useState<'quick' | 'standard' | 'override' | undefined>(undefined);
  const [userPreferences, setUserPreferences] = useState({
    preferredView: 'enhanced',
    autoRefresh: true,
    compactMode: false,
    showTooltips: true
  });
  const [loadingStates, setLoadingStates] = useState({
    analytics: false,
    workspace: false,
    batch: false
  });
  const [errorStates, setErrorStates] = useState<{
    analytics: string | null;
    workspace: string | null;
    batch: string | null;
  }>({
    analytics: null,
    workspace: null,
    batch: null
  });
  const [showAllQualityTiers, setShowAllQualityTiers] = useState(false); // Legacy: Default to Optimal only

  // Use performance monitoring
  usePerformanceMonitor('CollectionOpportunitiesHubCore');

  // Keyboard navigation
  const { showShortcutsHelp } = useKeyboardNavigation([
    ...collectionOpportunitiesShortcuts,
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      handler: () => showShortcutsHelp()
    }
  ]);

  // Use debounced filter for search and quality tier
  const filteredOpportunities = useDebouncedFilter(
    state.opportunities,
    (opp, query) => {
      try {
        // Quality tier filtering (Legacy feature)
        if (!showAllQualityTiers) {
          // Only show Optimal passes (matchStatus undefined or not baseline/suboptimal/unmatched)
          const matchStatus = opp.matchStatus;
          if (matchStatus === 'baseline' || matchStatus === 'suboptimal' || matchStatus === 'unmatched') {
            return false; // Hide non-optimal passes
          }
        }

        // Search query filtering
        if (!query) return true; // No search query, include if passed quality tier filter

        const lowerQuery = query.toLowerCase();
        return (
          opp.name?.toLowerCase().includes(lowerQuery) ||
          opp.satellite?.name?.toLowerCase().includes(lowerQuery) ||
          opp.status?.toLowerCase().includes(lowerQuery) ||
          opp.allocatedSites?.some(site => site?.toLowerCase().includes(lowerQuery)) ||
          false
        );
      } catch (err) {
        console.error('[Hub] Filter error for opportunity:', opp.id, err);
        return true; // Include on error
      }
    },
    searchQuery,
    300,
    [showAllQualityTiers] // Add quality tier toggle as dependency
  );

  // Debug logging
  React.useEffect(() => {
    console.log('[Hub] state.opportunities:', state.opportunities.length);
    console.log('[Hub] searchQuery:', searchQuery);
    console.log('[Hub] filteredOpportunities:', filteredOpportunities.length);
  }, [state.opportunities, searchQuery, filteredOpportunities]);

  // Feature flags
  const {
    progressiveComplexityUI,
    enableVirtualScrolling,
    enableWorkspaceMode,
    enableBatchOperations,
    enableHealthAnalysis,
    ENABLE_NEW_COLLECTION_SYSTEM,
    ENABLE_UNIFIED_EDITOR,
    LEGACY_MODE,
    LEGACY_HIDE_ANALYTICS_TAB,
    LEGACY_HIDE_SETTINGS_TAB,
    LEGACY_HIDE_MORE_ACTIONS,
    LEGACY_HIDE_SEARCH,
    LEGACY_SHOW_ALL_TOGGLE,
    LEGACY_HIDE_HEALTH_WIDGET
  } = useFeatureFlags();

  // NEW: Determine if we should use the new Collection system
  const useNewCollectionSystem = ENABLE_NEW_COLLECTION_SYSTEM && !showValidationPanel;

  // Handle workspace open/close
  const handleOpenWorkspace = useCallback((opportunityId: string) => {
    if (enableWorkspaceMode) {
      openWorkspace(opportunityId);
    }
  }, [enableWorkspaceMode, openWorkspace]);

  const handleSaveWorkspace = useCallback(async (changes: any[]) => {
    // Convert workspace changes to opportunity changes
    await commitChanges();
    closeWorkspace();
  }, [commitChanges, closeWorkspace]);

  const activeOpportunity = state.opportunities.find(o => o.id === state.activeWorkspaceId);

  // Validation handlers
  const handleOpenValidation = useCallback((opportunityId: string) => {
    setSelectedOpportunityId(opportunityId);
    setShowValidationPanel(true);
  }, []);

  const handleCloseValidation = useCallback(() => {
    setSelectedOpportunityId(null);
    setShowValidationPanel(false);
  }, []);

  const handleValidationComplete = useCallback((results: any) => {
    console.log('Validation completed:', results);
    // Update opportunity status based on validation results
  }, []);

  const handleApprove = useCallback(() => {
    if (selectedOpportunityId) {
      console.log('Plan approved for opportunity:', selectedOpportunityId);
      handleCloseValidation();
    }
  }, [selectedOpportunityId, handleCloseValidation]);

  const handleReject = useCallback((reason: string) => {
    if (selectedOpportunityId) {
      console.log('Plan rejected for opportunity:', selectedOpportunityId, 'Reason:', reason);
      handleCloseValidation();
    }
  }, [selectedOpportunityId, handleCloseValidation]);

  // Unified Editor handlers
  const handleOpenEditor = useCallback((opportunityId: string, mode?: 'quick' | 'standard' | 'override') => {
    setSelectedOpportunityId(opportunityId);
    setEditorMode(mode);
    setShowUnifiedEditor(true);
  }, []);

  const handleCloseEditor = useCallback(() => {
    setSelectedOpportunityId(null);
    setEditorMode(undefined);
    setShowUnifiedEditor(false);
  }, []);

  const handleSaveOpportunity = useCallback(async (opportunityId: string, changes: Partial<CollectionOpportunity>) => {
    console.log('Saving opportunity:', opportunityId, changes);
    // TODO: Implement actual save logic via API
    // For now, just close the editor
    handleCloseEditor();
  }, [handleCloseEditor]);

  // Mock pass data for validation panel
  const mockPasses: Pass[] = useMemo(() => [
    {
      id: 'pass-001',
      name: 'WORLDVIEW-3 - Svalbard Pass',
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 2.5 * 60 * 60 * 1000),
      quality: 5,
      duration: 30, // minutes
      elevation: 75.5,
      azimuth: 90,
      siteCapabilities: state.availableSites.slice(0, 2),
      priority: 'high',
      classificationLevel: 'UNCLASSIFIED',
      metadata: {
        satellite: 'WORLDVIEW-3',
        groundStation: 'Svalbard Ground Station'
      }
    },
    {
      id: 'pass-002',
      name: 'WORLDVIEW-3 - Alaska Pass',
      startTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 4.5 * 60 * 60 * 1000),
      quality: 4,
      duration: 30,
      elevation: 82.3,
      azimuth: 135,
      siteCapabilities: state.availableSites.slice(1, 3),
      priority: 'normal',
      classificationLevel: 'UNCLASSIFIED',
      metadata: {
        satellite: 'WORLDVIEW-3',
        groundStation: 'Alaska Ground Station'
      }
    }
  ], [state.availableSites]);

  // Enhanced statistics with actionable insights - optimized calculation
  const stats = useMemo(() => {
    const total = state.opportunities.length;
    const healthArray = Array.from(state.healthScores.values());

    // Use single pass for efficiency
    let critical = 0;
    let warning = 0;
    healthArray.forEach(h => {
      if (h.level === 'critical') critical++;
      else if (h.level === 'warning') warning++;
    });

    const optimal = total - critical - warning;
    const pendingCount = state.pendingChanges.size;

    // Calculate trends with memoized function
    const criticalTrend = calculateTrend([]); // TODO: Add historical health tracking
    const warningTrend = calculateTrend([]); // TODO: Add historical health tracking

    // Generate actionable insights with performance thresholds
    const insights = {
      critical: critical > 0 ? `${critical} opportunities need immediate attention` : null,
      warning: warning > 5 ? `${warning} opportunities approaching capacity limits` : null,
      pending: pendingCount > 10 ? 'Consider batch committing changes' : null,
      optimization: optimal < total * 0.5 ? 'System operating below optimal capacity' : null,
      performance: total > 1000 ? 'Large dataset detected - consider filtering' : null
    };

    return {
      total,
      critical,
      warning,
      optimal,
      pendingCount,
      trends: { criticalTrend, warningTrend },
      insights,
      sparklines: {
        critical: [], // TODO: Add historical health tracking
        warning: [] // TODO: Add historical health tracking
      },
      healthScore: Math.round((optimal / total) * 100) || 0
    };
  }, [state.opportunities, state.healthScores, state.pendingChanges]);

  // Validation errors for context stats (placeholder for future validation logic)
  const validationErrors: string[] = [];

  return (
    <>
      {!embeddedMode && <SkipToMain />}
      {!embeddedMode && <KeyboardInstructions />}
      <div className="collection-opportunities-hub" role="main" id="main-content">
      {/* Navigation Context - Enterprise Pattern (hidden in embedded mode) */}
      {!embeddedMode && (
        <div className="hub-navigation" role="navigation" aria-label="Breadcrumb navigation">
          <Breadcrumbs
            items={[
              {
                icon: IconNames.TIME,
                text: 'History',
                onClick: () => navigate('/history'),
                href: '/history'
              },
              {
                icon: IconNames.DATABASE,
                text: 'Collection Decks',
                onClick: () => navigate('/decks'),
                href: '/decks'
              },
              {
                text: `Deck ${collectionId}`,
                current: true
              }
            ]}
          />
        </div>
      )}

      {/* Main Content Container - Matches History Page */}
      <div style={{
        padding: '24px',
        backgroundColor: '#F5F8FA',
        minHeight: embeddedMode ? 'auto' : 'calc(100vh - 50px)',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Page Header with Primary Action - Matches History Pattern */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '32px',
          gap: '24px',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
              <h3 style={{
                margin: 0,
                fontSize: '32px',
                fontWeight: '600',
                color: '#182026'
              }}>
                {embeddedMode ? 'Collection Management' : `Collection Management - Deck ${collectionId}`}
              </h3>
              <div className="connection-indicator" role="status" aria-live="polite">
                <Icon
                  icon={IconNames.DOT}
                  size={12}
                  intent={state.webSocketConnected ? Intent.SUCCESS : Intent.DANGER}
                  aria-hidden="true"
                />
                <span className="connection-text">
                  {state.webSocketConnected ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>
            <p style={{
              margin: 0,
              fontSize: '16px',
              lineHeight: '1.5',
              color: '#738694'
            }}>
              Review and allocate satellite pass assignments
            </p>
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            flexShrink: 0,
            flexWrap: 'wrap'
          }}>

          {/* Phase 2: Consolidated Actions Menu */}
          <div role="toolbar" aria-label="Primary actions" className="bp5-toolbar">
            <Popover
              content={
                <Menu>
                  <MenuItem
                    icon={IconNames.REFRESH}
                    text="Refresh Data"
                    onClick={() => {
                      setIsLoading(true);
                      setTimeout(() => setIsLoading(false), 1000);
                      setShowOverflowMenu(false);
                    }}
                    disabled={isLoading}
                    aria-label="Manually refresh assignment data"
                  />
                  <MenuDivider title="Export Options" />
                  <MenuItem
                    icon={IconNames.DOWNLOAD}
                    text="Download CSV Report"
                    onClick={() => {
                      console.log('Exporting CSV:', filteredOpportunities.length, 'opportunities');
                      setShowOverflowMenu(false);
                    }}
                    disabled={filteredOpportunities.length === 0}
                    aria-label="Download assignments as CSV"
                  />
                  <MenuItem
                    icon={IconNames.DOCUMENT}
                    text="Download PDF Report"
                    onClick={() => {
                      console.log('Exporting PDF:', filteredOpportunities.length, 'opportunities');
                      setShowOverflowMenu(false);
                    }}
                    disabled={filteredOpportunities.length === 0}
                    aria-label="Download assignments as PDF"
                  />
                  <MenuItem
                    icon={IconNames.TH}
                    text="Export to Excel"
                    onClick={() => {
                      console.log('Exporting Excel:', filteredOpportunities.length, 'opportunities');
                      setShowOverflowMenu(false);
                    }}
                    disabled={filteredOpportunities.length === 0}
                    aria-label="Export assignments to Excel"
                  />
                  <MenuDivider />
                  <MenuItem
                    icon={IconNames.PRINT}
                    text="Print Preview"
                    onClick={() => {
                      window.print();
                      setShowOverflowMenu(false);
                    }}
                    aria-label="Print current view"
                  />
                </Menu>
              }
              placement="bottom-end"
              isOpen={showOverflowMenu}
              onInteraction={(nextOpenState) => setShowOverflowMenu(nextOpenState)}
            >
              <Button
                icon={IconNames.MORE}
                text="Actions"
                rightIcon={IconNames.CARET_DOWN}
                onClick={() => setShowOverflowMenu(!showOverflowMenu)}
                aria-label="More actions menu"
                aria-haspopup="true"
                aria-expanded={showOverflowMenu}
              />
            </Popover>
          </div>
          </div>
        </div>

        {/* Workshop Pattern: Callout for Pending Changes */}
        {state.pendingChanges.size > 0 && (
          <Callout
            intent={Intent.WARNING}
            icon={IconNames.WARNING_SIGN}
            className="bp5-callout-pending-changes"
            role="alert"
            aria-live="polite"
          >
            <div className="bp5-callout-content">
              <strong>{state.pendingChanges.size} unsaved change{state.pendingChanges.size !== 1 ? 's' : ''}</strong>
              <div className="bp5-callout-description">
                Remember to save your changes before leaving this page
              </div>
            </div>
            <ButtonGroup>
              <Button
                onClick={() => rollbackChanges()}
                outlined
                aria-label={`Discard ${state.pendingChanges.size} changes`}
              >
                Discard
              </Button>
              <Button
                intent={Intent.PRIMARY}
                onClick={commitChanges}
                loading={state.isSaving}
                aria-label={`Save ${state.pendingChanges.size} changes`}
              >
                Save Changes
              </Button>
            </ButtonGroup>
          </Callout>
        )}

      {/* Workshop Pattern: Resource List for System Metrics */}
      {!LEGACY_HIDE_HEALTH_WIDGET && (
        <div className="collection-hub-metrics">
          <h2 className="collection-hub-metrics-title">
            Health & Alerts
          </h2>
          <div className="collection-hub-metrics-grid" role="region" aria-label="Key system metrics">
            {/* System Health Card - Workshop Resource List Pattern */}
            <Card
              elevation={1}
              className="collection-hub-metric-card"
              role="group"
              aria-label={`System health: ${stats.healthScore}%`}
              tabIndex={0}
            >
              <div className="metric-card-content">
                <Icon
                  icon={IconNames.HEART}
                  size={24}
                  intent={
                    stats.healthScore >= 80 ? Intent.SUCCESS :
                    stats.healthScore >= 60 ? Intent.WARNING : Intent.DANGER
                  }
                  aria-hidden="true"
                />
                <div className="metric-card-data">
                  <div className="metric-card-value" aria-live="polite">
                    {stats.healthScore}%
                  </div>
                  <div className="metric-card-label">
                    System Health
                  </div>
                  <div className="metric-card-progress">
                    <div
                      className="metric-card-progress-bar"
                      style={{
                        width: `${stats.healthScore}%`,
                        background: stats.healthScore >= 80 ? 'var(--bp5-intent-success)' :
                                   stats.healthScore >= 60 ? 'var(--bp5-intent-warning)' :
                                   'var(--bp5-intent-danger)'
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Critical Issues Card - Workshop Resource List Pattern */}
            <Card
              elevation={1}
              interactive={stats.critical > 0}
              onClick={() => stats.critical > 0 && setSearchQuery('status:critical')}
              className={`collection-hub-critical-card ${stats.critical > 0 ? 'interactive' : 'static'}`}
              role="group"
              aria-label={`Critical issues: ${stats.critical}`}
              tabIndex={0}
            >
              <div className="critical-card-content">
                <Icon
                  icon={IconNames.ERROR}
                  size={24}
                  intent={Intent.DANGER}
                  aria-hidden="true"
                  style={stats.critical > 0 ? { animation: 'pulse 2s infinite' } : undefined}
                />
                <div className="critical-card-data">
                  <div className="critical-card-value" role="status" aria-live="polite">
                    {stats.critical}
                    {stats.trends.criticalTrend === 'increasing' && (
                      <span className="critical-trend-icon increasing" aria-label="increasing">↑</span>
                    )}
                    {stats.trends.criticalTrend === 'decreasing' && (
                      <span className="critical-trend-icon decreasing" aria-label="decreasing">↓</span>
                    )}
                  </div>
                  <div className="critical-card-label">
                    Critical Issues
                  </div>
                </div>
              </div>
              {stats.critical > 0 && (
                <div className="critical-card-warning">
                  Requires immediate attention. Click to view.
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Live region for announcements */}
      <LiveRegion>
        {stats.critical > 0 && `${stats.critical} items requiring review`}
      </LiveRegion>

      {/* Main Content - Tab wrapper removed (redundant single tab) */}
      <div className="main-content" role="main">
              {/* Enhanced Search and Filter Bar with Smart Suggestions */}
              {!LEGACY_HIDE_SEARCH && (
                <div className="panel-toolbar-enhanced" role="search">
                  <div className="search-box-enhanced">
                    <div className="search-input-container">
                      <Icon icon={IconNames.SEARCH} className="search-icon" aria-hidden="true" />
                      <input
                        type="text"
                        className="bp5-input search-input-enhanced"
                        placeholder="Search by satellite, site, or status..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Search assignments by satellite, site, or status"
                        autoComplete="off"
                        spellCheck={false}
                      />
                      {searchQuery && (
                        <Button
                          minimal
                          small
                          icon={IconNames.CROSS}
                          onClick={() => setSearchQuery('')}
                          aria-label={`Clear search query: ${searchQuery}`}
                          className="search-clear-button"
                        />
                      )}
                    </div>
                    {searchQuery && filteredOpportunities.length === 0 && (
                      <div className="search-no-results" role="status">
                        <Icon icon={IconNames.SEARCH} size={14} />
                        <span>No assignments match "{searchQuery}"</span>
                      </div>
                    )}
                  </div>
                  <div className="toolbar-actions">
                    <div className="result-count" aria-live="polite" role="status">
                      {filteredOpportunities.length === state.opportunities.length
                        ? `${state.opportunities.length} assignments`
                        : `${filteredOpportunities.length} of ${state.opportunities.length} assignments`
                      }
                    </div>
                  </div>
                </div>
              )}

              {/* "Show All" toggle removed - redundant with tab-based filtering (ALL/NEEDS REVIEW/UNMATCHED) */}

              {/* Validation Panel - shows when an opportunity is selected for validation */}
              {showValidationPanel && selectedOpportunityId ? (
                <div className="validation-panel-container">
                  <Button
                    icon={IconNames.ARROW_LEFT}
                    text="Back to Opportunities"
                    onClick={handleCloseValidation}
                    style={{ marginBottom: '1rem' }}
                  />
                  <ValidationPanel
                    opportunity={state.opportunities.find(o => o.id === selectedOpportunityId)!}
                    passes={mockPasses}
                    onValidationComplete={handleValidationComplete}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    capacityThresholds={state.capacityThresholds}
                  />
                </div>
              ) : filteredOpportunities.length === 0 && state.opportunities.length > 0 ? (
                /* Workshop Pattern: Empty State for Search Results */
                <NonIdealState
                  icon={IconNames.SEARCH}
                  title="No assignments match your search"
                  description={`No assignments found for "${searchQuery}". Try adjusting your search terms or filters.`}
                  action={
                    <Button
                      icon={IconNames.CROSS}
                      text="Clear Search"
                      onClick={() => setSearchQuery('')}
                    />
                  }
                />
              ) : filteredOpportunities.length === 0 ? (
                /* Workshop Pattern: Empty State for Zero Data */
                <NonIdealState
                  icon={IconNames.SATELLITE}
                  title="No assignments available"
                  description="There are currently no satellite pass assignments for this collection deck."
                  action={
                    <Button
                      icon={IconNames.REFRESH}
                      text="Refresh Data"
                      onClick={() => {
                        setIsLoading(true);
                        setTimeout(() => setIsLoading(false), 1000);
                      }}
                    />
                  }
                />
              ) : (
                /* Collection Opportunities Table with all legacy columns */
                <CollectionOpportunitiesEnhanced
                  opportunities={filteredOpportunities}
                  availableSites={state.availableSites}
                  onBatchUpdate={async (changes) => {
                    // Handle batch update
                    console.log('Batch update:', changes);
                  }}
                  onOpenWorkspace={handleOpenWorkspace}
                  onValidate={handleOpenValidation}
                  onEdit={ENABLE_UNIFIED_EDITOR ? (id) => handleOpenEditor(id, 'override') : undefined}
                  capacityThresholds={state.capacityThresholds}
                  enableRealTimeValidation={true}
                  enableHealthAnalysis={enableHealthAnalysis}
                  showWorkspaceOption={enableWorkspaceMode}
                  showValidationOption={true}
                />
              )}
      </div>

      {/* Workspace Modal */}
      {state.activeWorkspaceId && activeOpportunity && (
        <Suspense fallback={<Spinner />}>
          <ReallocationWorkspace
            opportunity={activeOpportunity}
            availableSites={state.availableSites}
            onSave={handleSaveWorkspace}
            onClose={closeWorkspace}
          />
        </Suspense>
      )}

      {/* Unified Opportunity Editor */}
      {ENABLE_UNIFIED_EDITOR && showUnifiedEditor && selectedOpportunityId && (() => {
        const selectedOpportunity = state.opportunities.find(o => o.id === selectedOpportunityId);
        if (!selectedOpportunity) return null;

        return (
          <UnifiedOpportunityEditor
            opportunity={selectedOpportunity}
            availableSites={state.availableSites}
            availablePasses={mockPasses}
            mode={editorMode}
            isOpen={showUnifiedEditor}
            onClose={handleCloseEditor}
            onSave={handleSaveOpportunity}
            capacityThresholds={state.capacityThresholds}
            enableRealTimeValidation={true}
            enableUndoRedo={editorMode === 'override'}
            enableBatchOperations={enableBatchOperations}
          />
        );
      })()}

    </div>

    {/* Wizard Navigation - Only shown in embedded mode */}
    {embeddedMode && (
      <Card
        elevation={Elevation.TWO}
        style={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px 24px',
          borderTop: '2px solid #E1E8ED',
          backgroundColor: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          zIndex: 10,
          marginTop: '24px'
        }}
      >
        <Button
          text="View All Collections"
          onClick={onWizardExit}
          icon={IconNames.GRID_VIEW}
        />
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button
            text="Back"
            onClick={onWizardBack}
            icon={IconNames.ARROW_LEFT}
          />
          <Button
            text="Finish"
            intent={Intent.SUCCESS}
            onClick={onWizardNext}
            rightIcon={IconNames.TICK}
          />
        </div>
      </Card>
    )}

    {/* Enhanced Status Bar with Progress Indicator (hidden in embedded mode) */}
    {!embeddedMode && (
      <div className="hub-status-bar enhanced-status" role="contentinfo" aria-label="System status">
        <div className="status-left">
          <div className="status-item sync-status" role="status" aria-live="polite">
            <Icon icon={IconNames.REFRESH} className={state.isSyncing ? 'spinning' : ''} />
            <span>
              {state.isSyncing ? 'Syncing...' : `Last sync: ${state.lastSync ? new Date(state.lastSync).toLocaleTimeString() : 'Never'}`}
            </span>
          </div>
          {state.pendingChanges.size > 0 && (
            <div className="status-item pending-indicator">
              <Icon icon={IconNames.CHANGES} intent={Intent.PRIMARY} />
              <span>{state.pendingChanges.size} unsaved changes</span>
            </div>
          )}
        </div>

        <div className="status-right">
          <div className="status-item">
            <span className={Classes.TEXT_MUTED}>
              v2.0.0 | {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    )}
    </div>
    </>
  );
});

CollectionOpportunitiesHubCore.displayName = 'CollectionOpportunitiesHubCore';

export default CollectionOpportunitiesHubCore;
