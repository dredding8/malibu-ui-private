import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Intent } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { NavigationContext as NavTypes } from '../types/navigation';

interface NavigationContextValue extends NavTypes.NavigationState {
  updateContext: (context: Partial<NavTypes.PageContext>) => void;
  setUnsavedChanges: (hasChanges: boolean) => void;
  navigateWithContext: (path: string, context?: Partial<NavTypes.PageContext>) => void;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

export const useNavigationContext = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationContext must be used within NavigationContextProvider');
  }
  return context;
};

/**
 * Determines the page context based on the current route
 */
const determinePageContext = (pathname: string): NavTypes.PageContext => {
  // Collection Opportunity View (from History)
  if (pathname.match(/^\/history\/[^/]+\/collection-opportunities$/)) {
    const collectionId = pathname.split('/')[2];
    return {
      domain: 'collectionOpportunity',
      title: 'Collection Opportunities',
      subtitle: 'Satellite passes included in this collection',
      icon: IconNames.SATELLITE,
      intent: Intent.SUCCESS,
      breadcrumbs: [
        { text: 'History', href: '/history', icon: IconNames.HISTORY },
        { text: `Collection ${collectionId}`, href: `/history/${collectionId}` },
        { text: 'Collection Opportunities', current: true, icon: IconNames.SATELLITE }
      ]
    };
  }

  // Field Mapping Review (from History)
  if (pathname.match(/^\/history\/[^/]+\/field-mapping-review$/)) {
    const collectionId = pathname.split('/')[2];
    return {
      domain: 'fieldMapping',
      title: 'Field Mapping Review',
      subtitle: 'Review data field relationships and transformations',
      icon: IconNames.FLOWS,
      intent: Intent.PRIMARY,
      breadcrumbs: [
        { text: 'History', href: '/history', icon: IconNames.HISTORY },
        { text: `Collection ${collectionId}`, href: `/history/${collectionId}` },
        { text: 'Field Mapping Review', current: true, icon: IconNames.FLOWS }
      ]
    };
  }

  // Create Collection Deck - Step 3
  if (pathname === '/create-collection-deck/collection-opportunities') {
    return {
      domain: 'creation',
      title: 'Select Collection Opportunities',
      subtitle: 'Choose satellite passes for your collection deck',
      icon: IconNames.SATELLITE,
      intent: Intent.SUCCESS,
      breadcrumbs: [
        { text: 'Create Collection', href: '/create-collection-deck', icon: IconNames.ADD },
        { text: 'Step 3: Collection Opportunities', current: true }
      ]
    };
  }

  // History Page
  if (pathname === '/history') {
    return {
      domain: 'history',
      title: 'Collection History',
      subtitle: 'View and manage your collection results',
      icon: IconNames.HISTORY,
      breadcrumbs: [
        { text: 'Home', href: '/', icon: IconNames.HOME },
        { text: 'History', current: true, icon: IconNames.HISTORY }
      ]
    };
  }

  // Create Collection Deck - Other Steps
  if (pathname.startsWith('/create-collection-deck')) {
    const step = pathname.split('/').pop() || 'data';
    const stepMap = {
      data: { num: 1, title: 'Input Data' },
      parameters: { num: 2, title: 'Review Parameters' },
      'collection-opportunities': { num: 3, title: 'Collection Opportunities' },
      instructions: { num: 4, title: 'Special Instructions' }
    };
    const stepInfo = stepMap[step as keyof typeof stepMap] || stepMap.data;

    return {
      domain: 'creation',
      title: `Step ${stepInfo.num}: ${stepInfo.title}`,
      icon: IconNames.ADD,
      breadcrumbs: [
        { text: 'Create Collection', href: '/create-collection-deck', icon: IconNames.ADD },
        { text: `Step ${stepInfo.num}: ${stepInfo.title}`, current: true }
      ]
    };
  }

  // Default/Home
  return {
    domain: 'history',
    title: 'Home',
    icon: IconNames.HOME,
    breadcrumbs: [
      { text: 'Home', current: true, icon: IconNames.HOME }
    ]
  };
};

export const NavigationContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [state, setState] = useState<NavigationContextValue>({
    currentContext: determinePageContext(location.pathname),
    canNavigateAway: true,
    hasUnsavedChanges: false,
    updateContext: () => {},
    setUnsavedChanges: () => {},
    navigateWithContext: () => {}
  });

  // Update context when route changes
  useEffect(() => {
    const newContext = determinePageContext(location.pathname);
    setState(prev => ({
      ...prev,
      previousContext: prev.currentContext,
      currentContext: newContext
    }));
  }, [location.pathname]);

  // Update specific context properties
  const updateContext = useCallback((updates: Partial<NavTypes.PageContext>) => {
    setState(prev => ({
      ...prev,
      currentContext: {
        ...prev.currentContext,
        ...updates
      }
    }));
  }, []);

  // Track unsaved changes
  const setUnsavedChanges = useCallback((hasChanges: boolean) => {
    setState(prev => ({
      ...prev,
      hasUnsavedChanges: hasChanges,
      canNavigateAway: !hasChanges
    }));
  }, []);

  // Navigate with context preservation
  const navigateWithContext = useCallback((path: string, context?: Partial<NavTypes.PageContext>) => {
    if (!state.canNavigateAway && state.hasUnsavedChanges) {
      // TODO: Show confirmation dialog
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }

    // Navigate with state if context provided
    navigate(path, { 
      state: { 
        fromContext: state.currentContext,
        ...context 
      } 
    });
  }, [navigate, state.canNavigateAway, state.hasUnsavedChanges, state.currentContext]);

  const value: NavigationContextValue = {
    ...state,
    updateContext,
    setUnsavedChanges,
    navigateWithContext
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};