import React, { useState, useEffect, useMemo, lazy, Suspense, memo, useCallback, startTransition } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Spinner,
  NonIdealState,
  Button,
  Intent,
  Card,
  Tabs,
  Tab,
  TabId,
  Classes,
  Icon as BpIcon
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

// Import new compound components
import { Collection } from '../components/Collection';
import { useCollections } from '../hooks/collections/useCollections';
import { useCollectionActions } from '../hooks/collections/useCollectionActions';
import { useFeatureFlag } from '../hooks/useFeatureFlag';

// Type-safe Icon wrapper to handle Blueprint.js v6 types
const Icon: React.FC<React.ComponentProps<typeof BpIcon>> = (props) => {
  const iconElement = React.createElement(BpIcon, props);
  return <>{iconElement}</>;
};

// Lazy load tab components for better performance
const CollectionOverview = lazy(() => import('../components/CollectionOverview'));
const CollectionManagement = lazy(() => import('../components/CollectionManagement'));
const CollectionAnalytics = lazy(() => import('../components/CollectionAnalytics'));
const CollectionSettings = lazy(() => import('../components/CollectionSettings'));

interface CollectionOpportunitiesHubMigratedProps {
  // Optional props for testing
  initialTab?: TabId;
  onTabChange?: (tabId: TabId) => void;
}

const CollectionOpportunitiesHubMigrated: React.FC<CollectionOpportunitiesHubMigratedProps> = ({
  initialTab = 'overview',
  onTabChange
}) => {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<TabId>(initialTab);
  
  // Use new compound component system
  const { collections, loading, error } = useCollections({ 
    filter: { ids: collectionId ? [collectionId] : [] }
  });
  const { updateCollection } = useCollectionActions();
  
  // Feature flag for gradual migration
  const useNewComponents = useFeatureFlag('collection-new-components');
  
  const collection = useMemo(() => {
    return collections.find(c => c.id === collectionId);
  }, [collections, collectionId]);

  useEffect(() => {
    if (!loading && !collection && collectionId) {
      // Collection not found, redirect to home
      navigate('/');
    }
  }, [loading, collection, collectionId, navigate]);

  const handleTabChange = useCallback((newTabId: TabId) => {
    startTransition(() => {
      setSelectedTab(newTabId);
      onTabChange?.(newTabId);
    });
  }, [onTabChange]);

  if (loading) {
    return (
      <div className="collection-opportunities-hub-loading">
        <Spinner size={50} />
      </div>
    );
  }

  if (error) {
    return (
      <NonIdealState
        icon={IconNames.ERROR}
        title="Error Loading Collection"
        description={error.message}
        action={
          <Button
            intent={Intent.PRIMARY}
            onClick={() => navigate('/')}
            text="Return to Dashboard"
          />
        }
      />
    );
  }

  if (!collection) {
    return (
      <NonIdealState
        icon={IconNames.SEARCH}
        title="Collection Not Found"
        description="The requested collection could not be found."
        action={
          <Button
            intent={Intent.PRIMARY}
            onClick={() => navigate('/')}
            text="Return to Dashboard"
          />
        }
      />
    );
  }

  return (
    <Collection.Provider value={collection}>
      <div className="collection-opportunities-hub">
        <Card className="hub-header">
          <h1>{collection.name}</h1>
          <p className="text-muted">{collection.description}</p>
        </Card>

        <Tabs
          id="collection-tabs"
          selectedTabId={selectedTab}
          onChange={handleTabChange}
          large={true}
          className="hub-tabs"
        >
          <Tab
            id="overview"
            title={
              <span>
                <Icon icon={IconNames.DASHBOARD} />
                <span className="tab-text">Overview</span>
              </span>
            }
            panel={
              <Suspense fallback={<Spinner />}>
                {useNewComponents ? (
                  <Collection.Overview />
                ) : (
                  <CollectionOverview collection={collection} />
                )}
              </Suspense>
            }
          />
          
          <Tab
            id="manage"
            title={
              <span>
                <Icon icon={IconNames.WRENCH} />
                <span className="tab-text">Manage</span>
              </span>
            }
            panel={
              <Suspense fallback={<Spinner />}>
                {useNewComponents ? (
                  <Collection.Grid>
                    {collection.items.map(item => (
                      <Collection.Item key={item.id} item={item} />
                    ))}
                  </Collection.Grid>
                ) : (
                  <CollectionManagement collection={collection} />
                )}
              </Suspense>
            }
          />
          
          <Tab
            id="analytics"
            title={
              <span>
                <Icon icon={IconNames.CHART} />
                <span className="tab-text">Analytics</span>
              </span>
            }
            panel={
              <Suspense fallback={<Spinner />}>
                {useNewComponents ? (
                  <Collection.Analytics />
                ) : (
                  <CollectionAnalytics collection={collection} />
                )}
              </Suspense>
            }
          />
          
          <Tab
            id="settings"
            title={
              <span>
                <Icon icon={IconNames.COG} />
                <span className="tab-text">Settings</span>
              </span>
            }
            panel={
              <Suspense fallback={<Spinner />}>
                {useNewComponents ? (
                  <Collection.Settings />
                ) : (
                  <CollectionSettings collection={collection} />
                )}
              </Suspense>
            }
          />
        </Tabs>
      </div>
    </Collection.Provider>
  );
};

export default memo(CollectionOpportunitiesHubMigrated);