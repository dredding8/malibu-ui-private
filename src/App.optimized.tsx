import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { BlueprintProvider, HotkeysProvider, Spinner } from '@blueprintjs/core';
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import '@blueprintjs/table/lib/css/table.css';
import './App.css';

// Context providers that are always needed
import { BackgroundProcessingProvider } from './contexts/BackgroundProcessingContext';
import { NavigationContextProvider } from './contexts/NavigationContext';
import { EnhancedNavigationProvider } from './contexts/EnhancedNavigationContext';
import { WizardSyncProvider } from './contexts/WizardSyncContext';
import { KeyboardNavigationProvider } from './components/KeyboardNavigationProvider';
import { NavigationFAB } from './components/NavigationAids';
import ErrorBoundary from './components/ErrorBoundary';
import { performanceMonitoringService } from './services/performanceMonitoringService';

// Feature flags
import { FeatureFlaggedRoute } from './components/FeatureFlaggedRoute';
import { useFeatureFlag } from './hooks/useFeatureFlags';

// Lazy load all pages for better code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const History = lazy(() => import('./pages/History'));
const Analytics = lazy(() => import('./pages/Analytics'));
const SCCs = lazy(() => import('./pages/SCCs'));
const AddSCC = lazy(() => import('./pages/AddSCC'));
const CollectionDecks = lazy(() => import('./pages/CollectionDecks'));
const CreateCollectionDeck = lazy(() => import('./pages/CreateCollectionDeck'));
const FieldMappingReview = lazy(() => import('./pages/FieldMappingReview'));

// Collection components - legacy and new
const CollectionOpportunitiesView = lazy(() => import('./pages/CollectionOpportunitiesView'));
const CollectionOpportunitiesHub = lazy(() => import('./pages/CollectionOpportunitiesHub'));
const CollectionOpportunitiesHubMigrated = lazy(() => import('./pages/CollectionOpportunitiesHubMigrated'));
const CollectionOpportunitiesRedirect = lazy(() => import('./components/CollectionOpportunitiesRedirect'));
const TestOpportunities = lazy(() => import('./pages/TestOpportunities'));

// Loading component for lazy loaded routes
const RouteSpinner: React.FC = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh' 
  }}>
    <Spinner size={50} />
  </div>
);

function AppOptimized() {
  // Initialize performance monitoring
  React.useEffect(() => {
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const metrics = performanceMonitoringService.getMetrics();
          console.log('Initial performance metrics:', metrics);
        }, 3000);
      });
    }

    return () => {
      performanceMonitoringService.cleanup();
    };
  }, []);

  const migrateCollectionHub = useFeatureFlag('MIGRATE_COLLECTION_HUB');

  return (
    <ErrorBoundary>
      <BlueprintProvider>
        <HotkeysProvider>
          <BackgroundProcessingProvider>
            <Router>
              <EnhancedNavigationProvider>
                <NavigationContextProvider>
                  <WizardSyncProvider>
                    <KeyboardNavigationProvider>
                      <div className="app">
                        <Suspense fallback={<RouteSpinner />}>
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/history" element={<History />} />
                            <Route 
                              path="/history/:collectionId/collection-opportunities" 
                              element={<CollectionOpportunitiesRedirect />} 
                            />
                            <Route 
                              path="/collection/:collectionId/manage" 
                              element={
                                migrateCollectionHub ? 
                                  <CollectionOpportunitiesHubMigrated /> : 
                                  <CollectionOpportunitiesHub />
                              } 
                            />
                            <Route 
                              path="/history/:collectionId/field-mapping-review" 
                              element={<FieldMappingReview />} 
                            />
                            <Route path="/analytics" element={<Analytics />} />
                            <Route path="/sccs" element={<SCCs />} />
                            <Route path="/sccs/new" element={<AddSCC />} />
                            <Route path="/decks" element={<CollectionDecks />} />
                            <Route path="/create-collection-deck/*" element={<CreateCollectionDeck />} />
                            <Route path="/test-opportunities" element={<TestOpportunities />} />
                            <Route path="*" element={<Dashboard />} />
                          </Routes>
                        </Suspense>
                        <NavigationFAB />
                      </div>
                    </KeyboardNavigationProvider>
                  </WizardSyncProvider>
                </NavigationContextProvider>
              </EnhancedNavigationProvider>
            </Router>
          </BackgroundProcessingProvider>
        </HotkeysProvider>
      </BlueprintProvider>
    </ErrorBoundary>
  );
}

export default AppOptimized;