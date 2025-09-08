import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BlueprintProvider, HotkeysProvider } from '@blueprintjs/core';
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import '@blueprintjs/table/lib/css/table.css';
import './App.css';

import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Analytics from './pages/Analytics';
import SCCs from './pages/SCCs';
import AddSCC from './pages/AddSCC';
import CollectionDecks from './pages/CollectionDecks';
import CreateCollectionDeck from './pages/CreateCollectionDeck';
import FieldMappingReview from './pages/FieldMappingReview';
import CollectionOpportunitiesView from './pages/CollectionOpportunitiesView';
import { BackgroundProcessingProvider } from './contexts/BackgroundProcessingContext';
import { NavigationContextProvider } from './contexts/NavigationContext';
import { EnhancedNavigationProvider } from './contexts/EnhancedNavigationContext';
import { WizardSyncProvider } from './contexts/WizardSyncContext';
import { KeyboardNavigationProvider } from './components/KeyboardNavigationProvider';
import { NavigationFAB } from './components/NavigationAids';
import ErrorBoundary from './components/ErrorBoundary';
import { performanceMonitoringService } from './services/performanceMonitoringService';

// Design Assumptions:
// - Using Blueprint v6 theme for consistency (bp6- classes)
// - Implementing a clean, professional layout with proper spacing
// - Using Cards to group related functionality
// - Implementing responsive design principles
// - Using FormGroup for structured form inputs
// - Using Callout for important messages and status updates

function App() {
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
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/history" element={<History />} />
                          <Route path="/history/:collectionId/collection-opportunities" element={<CollectionOpportunitiesView />} />
                          <Route path="/history/:collectionId/field-mapping-review" element={<FieldMappingReview />} />
                          <Route path="/analytics" element={<Analytics />} />
                          <Route path="/sccs" element={<SCCs />} />
                          <Route path="/sccs/new" element={<AddSCC />} />
                          <Route path="/decks" element={<CollectionDecks />} />
                          <Route path="/create-collection-deck/*" element={<CreateCollectionDeck />} />
                          <Route path="*" element={<Dashboard />} />
                        </Routes>
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

export default App;
