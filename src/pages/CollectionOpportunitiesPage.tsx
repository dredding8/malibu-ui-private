/**
 * Collection Opportunities Page
 * Example implementation showing how to use the interactive Collection Opportunities components
 *
 * @migrated Wave 2 Phase 2.2 - Using new Collection system via adapter
 */

import React, { useState } from 'react';
import { Card, H1, Spinner, NonIdealState, Button, Tooltip, Tag } from '@blueprintjs/core';
import { Icon } from '../utils/blueprintIconWrapper';
import { IconNames } from '@blueprintjs/icons';
import { LegacyCollectionOpportunitiesAdapter } from '../components/Collection/adapters/LegacyCollectionOpportunitiesAdapter';
import CollectionOpportunities from '../components/CollectionOpportunities'; // Legacy fallback
import { useCollectionOpportunities } from '../hooks/useCollectionOpportunities';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { OpportunityChange } from '../types/collectionOpportunities';
import './CollectionOpportunitiesPage.css';

interface CollectionOpportunitiesPageProps {
  collectionId: string;
}

const CollectionOpportunitiesPage: React.FC<CollectionOpportunitiesPageProps> = ({
  collectionId,
}) => {
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [lastUpdateCount, setLastUpdateCount] = useState(0);
  const [showQuickStart, setShowQuickStart] = useState(true);

  // Feature flags - Wave 2 migration
  const { ENABLE_NEW_COLLECTION_SYSTEM } = useFeatureFlags();
  const useNewCollectionSystem = ENABLE_NEW_COLLECTION_SYSTEM;

  // Use the custom hook for data management
  const {
    opportunities,
    loading,
    error,
    batchUpdate,
    refresh,
  } = useCollectionOpportunities({
    collectionId,
    enableRealTimeUpdates: true,
    capacityThresholds: {
      critical: 10,
      warning: 30,
      optimal: 70,
    },
  });

  // Handle batch update
  const handleBatchUpdate = async (changes: OpportunityChange[]) => {
    try {
      const result = await batchUpdate(changes);
      
      if (result.success) {
        setLastUpdateCount(result.updated.length);
        setShowSuccessToast(true);
        
        // Hide toast after 3 seconds
        setTimeout(() => setShowSuccessToast(false), 3000);
      }
    } catch (err) {
      console.error('Batch update failed:', err);
      // Error handling would typically show an error toast/notification
    }
  };

  // Loading state with improved messaging
  if (loading) {
    return (
      <div className="opportunities-page-loading">
        <Spinner size={50} />
        <h3>Initializing Pass Scheduler</h3>
        <p>Synchronizing satellite passes and ground station availability...</p>
      </div>
    );
  }

  // Error state with improved messaging
  if (error) {
    return (
      <NonIdealState
        icon={IconNames.SATELLITE}
        title="Connection to Satellite Network Lost"
        description={
          <div>
            <p>{error.message || "Unable to retrieve pass scheduling data from the satellite network."}</p>
            <p style={{ marginTop: '8px', fontSize: '14px', color: '#5C7080' }}>
              This may be due to network connectivity issues or temporary service disruption.
            </p>
          </div>
        }
        action={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <Button
              intent="primary"
              onClick={refresh}
              icon={IconNames.REFRESH}
              text="Reconnect to Network"
            />
            <Button
              onClick={() => window.location.href = '/support'}
              icon={IconNames.HELP}
              text="Contact Support"
              minimal
            />
          </div>
        }
      />
    );
  }

  // Empty state (when no opportunities exist)
  if (!opportunities || opportunities.length === 0) {
    return (
      <div className="collection-opportunities-page">
        <div className="page-header">
          <H1>Satellite Collection Management</H1>
          <p className="page-description">
            Maximize satellite utilization by scheduling passes and optimizing ground station allocations
          </p>
        </div>
        
        <NonIdealState
          icon={IconNames.SATELLITE}
          title="No Active Collection Opportunities"
          description={
            <div>
              <p>There are currently no satellite passes scheduled for collection.</p>
              <p style={{ marginTop: '8px', fontSize: '14px', color: '#5C7080' }}>
                Collection opportunities will appear here when satellites are in range of ground stations.
              </p>
            </div>
          }
          action={
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <Button
                intent="primary"
                icon={IconNames.ADD}
                text="Schedule New Pass"
                onClick={() => window.location.href = '/collections/new'}
              />
              <Button
                icon={IconNames.REFRESH}
                text="Check for Updates"
                onClick={refresh}
                minimal
              />
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="collection-opportunities-page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '12px' }}>
          <H1 style={{ margin: 0 }}>Satellite Collection Management</H1>
          <Tooltip content="Real-time synchronization active" position="bottom">
            <Icon icon={IconNames.FEED} intent="success" />
          </Tooltip>
        </div>
        <p className="page-description">
          Maximize satellite utilization by scheduling passes and optimizing ground station allocations
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
          <Tag intent="primary" icon={IconNames.SATELLITE}>
            {opportunities.length} Active Passes
          </Tag>
          <Tag intent={opportunities.some(o => o.status === 'critical') ? 'danger' : 'success'} icon={IconNames.DASHBOARD}>
            System Health: {opportunities.some(o => o.status === 'critical') ? 'Action Required' : 'Optimal'}
          </Tag>
          <Tag minimal icon={IconNames.TIME}>
            Next Pass: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Tag>
        </div>
      </div>

      {/* Quick Start Guide - Dismissible */}
      {showQuickStart && (
        <Card className="quick-start-card" style={{ marginBottom: '24px', background: '#EBF1F5', border: '1px solid #C5CBD3' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon icon={IconNames.LIGHTBULB} intent="primary" />
                Getting Started with Pass Scheduling
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, marginBottom: '4px' }}>🛰️ Monitor Pass Status</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#5C7080' }}>
                    Color indicators show capacity: Green (optimal), Yellow (warning), Red (critical)
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, marginBottom: '4px' }}>📍 Allocate Ground Stations</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#5C7080' }}>
                    Click edit to assign passes to available ground stations
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, marginBottom: '4px' }}>🚀 Optimize & Deploy</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#5C7080' }}>
                    Review changes, then deploy updates to the satellite network
                  </p>
                </div>
              </div>
            </div>
            <Button
              minimal
              icon={IconNames.CROSS}
              onClick={() => setShowQuickStart(false)}
              aria-label="Dismiss quick start guide"
            />
          </div>
        </Card>
      )}

      <Card className="opportunities-card">
        {useNewCollectionSystem ? (
          <LegacyCollectionOpportunitiesAdapter
            opportunities={opportunities}
            data={opportunities}
            onEdit={(id) => console.log('Edit opportunity:', id)}
            onDelete={(id) => console.log('Delete opportunity:', id)}
            onReallocate={(id) => console.log('Reallocate opportunity:', id)}
            loading={false}
            error={null}
            viewMode="table"
            variant="standard"
            className="opportunities-list"
          />
        ) : (
          <CollectionOpportunities
            opportunities={opportunities}
            onBatchUpdate={handleBatchUpdate}
            capacityThresholds={{
              critical: 10,
              warning: 30,
              optimal: 70,
            }}
            enableRealTimeValidation={true}
          />
        )}
      </Card>

      {/* Success notification with improved copy */}
      {showSuccessToast && (
        <div className="success-toast" role="status" aria-live="polite">
          <Icon icon={IconNames.TICK_CIRCLE} />
          <div>
            <strong>{lastUpdateCount} {lastUpdateCount === 1 ? 'pass' : 'passes'} successfully rescheduled</strong>
            <div style={{ fontSize: '12px', marginTop: '2px' }}>
              Changes deployed to satellite network
            </div>
          </div>
        </div>
      )}

      {/* Enhanced help section with better organization */}
      <Card className="help-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>
            <Icon icon={IconNames.HELP} style={{ marginRight: '8px' }} />
            Reference Guide
          </h3>
          <Button
            minimal
            small
            icon={IconNames.DOCUMENT}
            text="View Full Documentation"
            onClick={() => window.open('/docs/pass-scheduling', '_blank')}
          />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div>
            <h4 style={{ marginTop: 0, marginBottom: '12px' }}>Understanding Pass Status</h4>
            <div style={{ lineHeight: '1.8' }}>
              <div style={{ marginBottom: '8px' }}>
                <Tag intent="success" minimal>Optimal</Tag>
                <span style={{ marginLeft: '8px' }}>70%+ capacity available</span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <Tag intent="warning" minimal>Warning</Tag>
                <span style={{ marginLeft: '8px' }}>30-70% capacity available</span>
              </div>
              <div>
                <Tag intent="danger" minimal>Critical</Tag>
                <span style={{ marginLeft: '8px' }}>Less than 30% capacity</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 style={{ marginTop: 0, marginBottom: '12px' }}>Key Terms</h4>
            <dl style={{ margin: 0 }}>
              <dt style={{ fontWeight: 600, marginBottom: '4px' }}>Pass</dt>
              <dd style={{ margin: '0 0 12px 0', color: '#5C7080' }}>
                Window when satellite is in range of ground station
              </dd>
              <dt style={{ fontWeight: 600, marginBottom: '4px' }}>Collection Deck</dt>
              <dd style={{ margin: '0 0 12px 0', color: '#5C7080' }}>
                Scheduled set of satellite passes for data collection
              </dd>
              <dt style={{ fontWeight: 600, marginBottom: '4px' }}>Downlink Site</dt>
              <dd style={{ margin: '0', color: '#5C7080' }}>
                Ground station receiving satellite data transmission
              </dd>
            </dl>
          </div>
          
          <div>
            <h4 style={{ marginTop: 0, marginBottom: '12px' }}>Keyboard Navigation</h4>
            <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
              <kbd style={{ padding: '2px 6px', background: '#F5F8FA', border: '1px solid #C5CBD3', borderRadius: '3px' }}>Tab</kbd> Navigate between elements<br/>
              <kbd style={{ padding: '2px 6px', background: '#F5F8FA', border: '1px solid #C5CBD3', borderRadius: '3px' }}>Enter</kbd> Select or activate<br/>
              <kbd style={{ padding: '2px 6px', background: '#F5F8FA', border: '1px solid #C5CBD3', borderRadius: '3px' }}>Esc</kbd> Cancel current action<br/>
              <kbd style={{ padding: '2px 6px', background: '#F5F8FA', border: '1px solid #C5CBD3', borderRadius: '3px' }}>Space</kbd> Toggle selection
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CollectionOpportunitiesPage;

// Example usage in App.tsx or router:
/*
import CollectionOpportunitiesPage from './pages/CollectionOpportunitiesPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route 
          path="/collections/:collectionId/opportunities" 
          element={<CollectionOpportunitiesPage collectionId={params.collectionId} />} 
        />
      </Routes>
    </Router>
  );
}
*/