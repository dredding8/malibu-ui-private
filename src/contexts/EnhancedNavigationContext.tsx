import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Intent, Position, OverlayToaster } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { NavigationContext as NavTypes } from '../types/navigation';

// Simplified navigation state with core functionality
interface EnhancedNavigationState {
  currentContext: NavTypes.PageContext;
  previousContext: NavTypes.PageContext | null;
  hasUnsavedChanges: boolean;
  navigateWithContext: (path: string, options?: NavigationOptions) => Promise<boolean>;
  setUnsavedChanges: (hasChanges: boolean) => void;
}

interface NavigationOptions {
  skipConfirmation?: boolean;
  replace?: boolean;
  state?: any;
}

const EnhancedNavigationContext = createContext<EnhancedNavigationState | undefined>(undefined);
const toaster = OverlayToaster.create({ position: Position.TOP });

export const useEnhancedNavigation = () => {
  const context = useContext(EnhancedNavigationContext);
  if (!context) {
    throw new Error('useEnhancedNavigation must be used within EnhancedNavigationProvider');
  }
  return context;
};

export const EnhancedNavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State management
  const [currentContext, setCurrentContext] = useState<NavTypes.PageContext>(
    determinePageContext(location.pathname)
  );
  const [previousContext, setPreviousContext] = useState<NavTypes.PageContext | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Update context on route change
  useEffect(() => {
    const newContext = determinePageContext(location.pathname);
    setPreviousContext(currentContext);
    setCurrentContext(newContext);
  }, [location.pathname]);
  
  const navigateWithContext = useCallback(async (
    path: string, 
    options: NavigationOptions = {}
  ): Promise<boolean> => {
    // Check for unsaved changes
    if (hasUnsavedChanges && !options.skipConfirmation) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return false;
    }
    
    navigate(path, {
      replace: options.replace,
      state: options.state
    });
    
    return true;
  }, [hasUnsavedChanges, navigate]);
  
  const value: EnhancedNavigationState = {
    currentContext,
    previousContext,
    hasUnsavedChanges,
    navigateWithContext,
    setUnsavedChanges: setHasUnsavedChanges
  };
  
  return (
    <EnhancedNavigationContext.Provider value={value}>
      {children}
    </EnhancedNavigationContext.Provider>
  );
};

// Helper function to determine page context
function determinePageContext(pathname: string): NavTypes.PageContext {
  // Collection Opportunity View
  if (pathname.match(/^\/history\/[^/]+\/collection-opportunities$/)) {
    const collectionId = pathname.split('/')[2];
    return {
      domain: 'collectionOpportunity',
      title: 'Collection Opportunities',
      subtitle: 'Satellite passes included in this collection',
      icon: IconNames.SATELLITE,
      intent: Intent.SUCCESS,
      breadcrumbs: [
        { text: 'Data Sources', href: '/', icon: IconNames.DATABASE },
        { text: 'History', href: '/history', icon: IconNames.HISTORY },
        { text: `Collection ${collectionId}` },
        { text: 'Collection Opportunities', current: true }
      ]
    };
  }
  
  // Field Mapping Review
  if (pathname.match(/^\/history\/[^/]+\/field-mapping-review$/)) {
    const collectionId = pathname.split('/')[2];
    return {
      domain: 'fieldMapping',
      title: 'Field Mapping Review',
      subtitle: 'Review data field relationships and transformations',
      icon: IconNames.FLOWS,
      intent: Intent.PRIMARY,
      breadcrumbs: [
        { text: 'Data Sources', href: '/', icon: IconNames.DATABASE },
        { text: 'History', href: '/history', icon: IconNames.HISTORY },
        { text: `Collection ${collectionId}` },
        { text: 'Field Mapping Review', current: true }
      ]
    };
  }
  
  // Create Collection Deck Wizard
  if (pathname.startsWith('/create-collection-deck')) {
    const step = pathname.split('/').pop() || 'data';
    const stepTitles: Record<string, string> = {
      data: 'Step 1: Input Data',
      parameters: 'Step 2: Review Parameters',
      'collection-opportunities': 'Step 3: Select Collection Opportunities',
      instructions: 'Step 4: Special Instructions'
    };
    
    return {
      domain: 'creation',
      title: 'Create Collection Deck',
      subtitle: stepTitles[step] || 'Wizard',
      icon: IconNames.PLUS,
      intent: Intent.SUCCESS,
      breadcrumbs: [
        { text: 'Data Sources', href: '/', icon: IconNames.DATABASE },
        { text: 'Create Collection Deck', href: '/create-collection-deck' },
        { text: stepTitles[step] || step, current: true }
      ]
    };
  }
  
  // Default contexts
  const defaultContexts: Record<string, NavTypes.PageContext> = {
    '/': {
      domain: 'history',
      title: 'Data Sources',
      subtitle: 'Manage data sources and collections',
      icon: IconNames.DATABASE,
      intent: Intent.PRIMARY,
      breadcrumbs: [
        { text: 'Data Sources', href: '/', icon: IconNames.DATABASE, current: true }
      ]
    },
    '/history': {
      domain: 'history',
      title: 'History',
      subtitle: 'View processing history',
      icon: IconNames.HISTORY,
      intent: Intent.NONE,
      breadcrumbs: [
        { text: 'Data Sources', href: '/', icon: IconNames.DATABASE },
        { text: 'History', href: '/history', current: true }
      ]
    },
    '/sccs': {
      domain: 'history',
      title: 'SCCs',
      subtitle: 'Manage satellite control centers',
      icon: IconNames.CUBE,
      intent: Intent.NONE,
      breadcrumbs: [
        { text: 'Data Sources', href: '/', icon: IconNames.DATABASE },
        { text: 'SCCs', href: '/sccs', current: true }
      ]
    },
    '/decks': {
      domain: 'history',
      title: 'Collections',
      subtitle: 'Manage collection decks',
      icon: IconNames.NEW_OBJECT,
      intent: Intent.NONE,
      breadcrumbs: [
        { text: 'Data Sources', href: '/', icon: IconNames.DATABASE },
        { text: 'Collections', href: '/decks', current: true }
      ]
    },
    '/analytics': {
      domain: 'history',
      title: 'Analytics',
      subtitle: 'View system analytics',
      icon: IconNames.CHART,
      intent: Intent.NONE,
      breadcrumbs: [
        { text: 'Data Sources', href: '/', icon: IconNames.DATABASE },
        { text: 'Analytics', href: '/analytics', current: true }
      ]
    }
  };
  
  return defaultContexts[pathname] || defaultContexts['/'];
}