/**
 * Navigation utilities for consistent state preservation and routing
 */
import { NavigateOptions } from 'react-router-dom';
import { NAVIGATION_ROUTES } from '../constants/navigation';

export interface NavigationState {
  // Context information
  fromHistory?: boolean;
  fromFieldMapping?: boolean;
  fromOpportunities?: boolean;
  fromCreation?: boolean;
  fromBreadcrumb?: boolean;
  
  // Collection information
  collectionId?: string;
  collectionName?: string;
  
  // Wizard state
  wizardData?: any;
  wizardStep?: number;
  
  // Filter state
  filters?: {
    search?: string;
    status?: string;
    confidence?: string;
    category?: string;
  };
  
  // Additional context
  timestamp?: number;
  preserveHistory?: boolean;
}

/**
 * Create navigation options with state preservation
 */
export function createNavigationOptions(
  state?: NavigationState | null,
  additionalState?: Partial<NavigationState>
): NavigateOptions {
  return {
    state: {
      ...state,
      ...additionalState,
      timestamp: Date.now()
    },
    replace: false
  };
}

/**
 * Navigate with proper context preservation
 */
export function navigateWithContext(
  navigate: (to: string, options?: NavigateOptions) => void,
  to: string,
  currentState?: NavigationState | null,
  additionalState?: Partial<NavigationState>
) {
  const options = createNavigationOptions(currentState, additionalState);
  navigate(to, options);
}

/**
 * Get breadcrumb items based on current route and context
 */
export function getBreadcrumbItems(
  pathname: string,
  state?: NavigationState | null,
  params?: Record<string, string | undefined>
) {
  const items = [];
  
  // Parse the current path
  const segments = pathname.split('/').filter(Boolean);
  
  // Build breadcrumb trail based on segments
  if (segments.includes('history')) {
    items.push({
      text: 'History',
      icon: 'history',
      href: NAVIGATION_ROUTES.HISTORY
    });
    
    if (params?.collectionId) {
      items.push({
        text: `Collection ${params.collectionId}`,
        icon: 'folder-close'
      });
      
      if (segments.includes('field-mapping-review')) {
        items.push({
          text: 'Field Mapping Review',
          icon: 'flows',
          current: true
        });
      } else if (segments.includes('collection-opportunities')) {
        items.push({
          text: 'Collection Opportunities',
          icon: 'satellite',
          current: true
        });
      }
    }
  } else if (segments.includes('create-collection-deck')) {
    items.push({
      text: 'Data Sources',
      icon: 'database',
      href: NAVIGATION_ROUTES.ROOT
    });
    
    items.push({
      text: 'Collection Decks',
      icon: 'layers',
      href: NAVIGATION_ROUTES.COLLECTIONS
    });
    
    items.push({
      text: 'Create Collection',
      icon: 'add',
      current: true
    });
  }
  
  return items;
}

/**
 * Preserve filters and search state when navigating
 */
export function preserveFilterState(
  currentFilters: any,
  targetRoute: string
): NavigationState {
  return {
    filters: currentFilters,
    preserveHistory: true
  };
}