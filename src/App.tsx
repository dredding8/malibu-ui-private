import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BlueprintProvider } from '@blueprintjs/core';
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

// Design Assumptions:
// - Using Blueprint's default theme for consistency
// - Implementing a clean, professional layout with proper spacing
// - Using Cards to group related functionality
// - Implementing responsive design principles
// - Using FormGroup for structured form inputs
// - Using Callout for important messages and status updates

function App() {
  return (
    <BlueprintProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/sccs" element={<SCCs />} />
            <Route path="/sccs/new" element={<AddSCC />} />
            <Route path="/decks" element={<CollectionDecks />} />
            <Route path="/decks/new/*" element={<CreateCollectionDeck />} />
          </Routes>
        </div>
      </Router>
    </BlueprintProvider>
  );
}

export default App;
