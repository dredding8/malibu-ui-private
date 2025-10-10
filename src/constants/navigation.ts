/**
 * Navigation constants to ensure consistency across the application
 * This file maintains unified navigation terminology and routing patterns
 */

export const NAVIGATION_LABELS = {
  // Main navigation items
  DATA_SOURCES: 'Data Sources',
  SCCS: 'SCCs',
  COLLECTIONS: 'Collections',
  COLLECTION_DECKS: 'Collection Decks',
  HISTORY: 'History',
  ANALYTICS: 'Analytics',
  
  // Sub-navigation items
  CREATE_COLLECTION: 'Create Collection',
  FIELD_MAPPING_REVIEW: 'Field Mapping Review',
  COLLECTION_OPPORTUNITIES: 'Collection Opportunities',
  
  // Wizard steps
  WIZARD_STEP_1: 'Set Up Your Data',
  WIZARD_STEP_2: 'Choose Your Settings',
  WIZARD_STEP_3: 'Select Collection Opportunities',
  WIZARD_STEP_4: 'Add Final Details',
  
  // History table actions
  VIEW_COLLECTION: 'View Collection',
  FIELD_MAPPINGS: 'Field Mappings',
  COLLECTION_OPPORTUNITIES_BTN: 'Collection Opportunities',
} as const;

export const NAVIGATION_ROUTES = {
  // Main routes
  ROOT: '/',
  DASHBOARD: '/',
  SCCS: '/sccs',
  SCCS_NEW: '/sccs/new',
  COLLECTIONS: '/decks',
  HISTORY: '/history',
  ANALYTICS: '/analytics',
  
  // Collection creation wizard
  CREATE_COLLECTION_DECK: '/create-collection-deck',
  CREATE_COLLECTION_DATA: '/create-collection-deck/data',
  CREATE_COLLECTION_PARAMETERS: '/create-collection-deck/parameters',
  CREATE_COLLECTION_OPPORTUNITIES: '/create-collection-deck/collection-opportunities',
  CREATE_COLLECTION_INSTRUCTIONS: '/create-collection-deck/instructions',
  
  // History sub-routes
  FIELD_MAPPING_REVIEW: (collectionId: string) => `/history/${collectionId}/field-mapping-review`,
  COLLECTION_OPPORTUNITIES_VIEW: (collectionId: string) => `/collection/${collectionId}/manage`,
} as const;

export const NAVIGATION_DESCRIPTIONS = {
  FIELD_MAPPING_REVIEW: 'Review field mapping relationships and data transformations',
  COLLECTION_OPPORTUNITIES: 'View satellite collection opportunities and passes',
  CREATE_COLLECTION: 'Create a new collection deck with satellite opportunities',
} as const;