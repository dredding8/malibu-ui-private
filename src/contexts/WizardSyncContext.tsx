import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useEnhancedNavigation } from './EnhancedNavigationContext';

/**
 * Shared state synchronization context for wizard and standalone flows
 * Ensures consistency between CreateCollectionDeck wizard and standalone pages
 */

interface WizardData {
  // Step 1: Input Data
  taskingWindow?: {
    startDate: string;
    endDate: string;
  };
  tleData?: {
    source: string;
    lastUpdated: Date;
  };
  parameters?: {
    hardCapacity: number;
    minDuration: number;
    elevation: number;
  };
  
  // Step 2: Review Parameters
  unavailableSites?: {
    sites: string[];
  };
  
  // Step 3: Select Opportunities (unified with Field Mapping)
  selectedOpportunities?: Array<{
    id: string;
    sccNumber: string;
    sourceField?: string;  // Added for field mapping consistency
    targetField?: string;  // Added for field mapping consistency
    matchScore?: number;   // Added for field mapping consistency
    priority: number;
    function: string;
    orbit: string;
    periodicity: number;
    collectionType: string;
    classification: string;
    match: 'Optimal' | 'Baseline' | 'No matches';
    matchNotes: string;
    siteAllocation: string[];
    notes?: string;
    selected: boolean;
    needsReview: boolean;
    unmatched: boolean;
    // Field mapping specific fields
    confidence?: 'high' | 'medium' | 'low';
    matchType?: 'exact' | 'fuzzy' | 'semantic' | 'manual';
    status?: 'approved' | 'rejected' | 'pending' | 'modified';
    sensorType?: 'wideband' | 'narrowband' | 'imagery' | 'signals';
    calculatedCapacity?: number;
  }>;
  
  // Step 4: Special Instructions
  specialInstructions?: string;
  
  // Metadata
  collectionId?: string;
  createdAt?: Date;
  lastModified?: Date;
  wizardComplete?: boolean;
}

interface WizardSyncState {
  wizardData: WizardData;
  isWizardContext: boolean;
  currentStep: number;
  
  // Methods
  updateWizardData: (updates: Partial<WizardData>) => void;
  syncFromStandalone: (standaloneData: any, sourceType: 'fieldMapping' | 'opportunities') => void;
  syncToStandalone: (targetType: 'fieldMapping' | 'opportunities') => any;
  setWizardContext: (isWizard: boolean) => void;
  setCurrentStep: (step: number) => void;
  clearWizardData: () => void;
  
  // Terminology mapping
  getUnifiedTerminology: () => TerminologyMap;
  translateTerminology: (term: string, context: 'wizard' | 'standalone') => string;
}

interface TerminologyMap {
  wizard: {
    step3Title: string;
    itemName: string;
    reviewAction: string;
    approveAction: string;
  };
  standalone: {
    pageTitle: string;
    itemName: string;
    reviewAction: string;
    approveAction: string;
  };
}

const STORAGE_KEY = 'wizard_sync_data';
const TERMINOLOGY_KEY = 'wizard_terminology_preference';

const WizardSyncContext = createContext<WizardSyncState | undefined>(undefined);

export const useWizardSync = () => {
  const context = useContext(WizardSyncContext);
  if (!context) {
    throw new Error('useWizardSync must be used within WizardSyncProvider');
  }
  return context;
};

export const WizardSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // TODO: Restore when functions are available in EnhancedNavigationContext
  // const { preserveFormData, getPreservedData } = useEnhancedNavigation();
  
  // Initialize state from session storage
  const [wizardData, setWizardData] = useState<WizardData>(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {};
      }
    }
    return {};
  });
  
  const [isWizardContext, setIsWizardContext] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Unified terminology mapping
  const [terminologyPreference, setTerminologyPreference] = useState<'technical' | 'simplified'>(() => {
    const stored = localStorage.getItem(TERMINOLOGY_KEY);
    return (stored as 'technical' | 'simplified') || 'simplified';
  });
  
  // Save wizard data to session storage on changes
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(wizardData));
  }, [wizardData]);
  
  const updateWizardData = useCallback((updates: Partial<WizardData>) => {
    setWizardData(prev => ({
      ...prev,
      ...updates,
      lastModified: new Date()
    }));
    
    // Also preserve in navigation context for deep linking
    // TODO: Restore when preserveFormData is available
    // preserveFormData('wizardData', { ...wizardData, ...updates });
  }, [wizardData]);
  
  const syncFromStandalone = useCallback((standaloneData: any, sourceType: 'fieldMapping' | 'opportunities') => {
    if (sourceType === 'fieldMapping') {
      // Convert field mapping data to opportunities format
      const opportunities = standaloneData.matches?.map((match: any) => ({
        ...match,
        sccNumber: match.sourceField, // Map field name to SCC for consistency
        needsReview: match.status === 'pending',
        unmatched: match.confidence === 'low',
        match: match.confidence === 'high' ? 'Optimal' : 
               match.confidence === 'medium' ? 'Baseline' : 'No matches',
        // Preserve original field mapping data
        sourceField: match.sourceField,
        targetField: match.targetField,
        matchScore: match.matchScore,
        confidence: match.confidence,
        matchType: match.matchType,
        status: match.status
      }));
      
      updateWizardData({ selectedOpportunities: opportunities });
    } else {
      // Direct sync for opportunities data
      updateWizardData({ selectedOpportunities: standaloneData.opportunities });
    }
  }, [updateWizardData]);
  
  const syncToStandalone = useCallback((targetType: 'fieldMapping' | 'opportunities') => {
    const opportunities = wizardData.selectedOpportunities || [];
    
    if (targetType === 'fieldMapping') {
      // Convert opportunities to field mapping format
      return {
        matches: opportunities.map(opp => ({
          id: opp.id,
          sourceField: opp.sourceField || opp.sccNumber,
          targetField: opp.targetField || `target_${opp.sccNumber}`,
          matchScore: opp.matchScore || (opp.match === 'Optimal' ? 0.95 : opp.match === 'Baseline' ? 0.75 : 0.45),
          confidence: opp.confidence || (opp.match === 'Optimal' ? 'high' : opp.match === 'Baseline' ? 'medium' : 'low'),
          matchType: opp.matchType || 'semantic',
          status: opp.status || (opp.selected ? 'approved' : 'pending'),
          lastModified: wizardData.lastModified || new Date(),
          notes: opp.notes || opp.matchNotes,
          category: opp.function,
          sensorType: opp.sensorType || (opp.collectionType === 'Wideband' ? 'wideband' : 
                                         opp.collectionType === 'Narrowband' ? 'narrowband' : 
                                         opp.collectionType === 'Optical' ? 'imagery' : 'signals'),
          calculatedCapacity: opp.calculatedCapacity || calculateCapacity(opp.collectionType),
          // Preserve other opportunity data
          priority: opp.priority,
          orbit: opp.orbit,
          periodicity: opp.periodicity,
          classification: opp.classification,
          siteAllocation: opp.siteAllocation
        }))
      };
    }
    
    // Direct return for opportunities
    return { opportunities };
  }, [wizardData]);
  
  const clearWizardData = useCallback(() => {
    setWizardData({});
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);
  
  const getUnifiedTerminology = useCallback((): TerminologyMap => {
    if (terminologyPreference === 'technical') {
      return {
        wizard: {
          step3Title: 'Select Collection Opportunities',
          itemName: 'opportunity',
          reviewAction: 'Review Matches',
          approveAction: 'Select'
        },
        standalone: {
          pageTitle: 'Field Mapping Review',
          itemName: 'field mapping',
          reviewAction: 'Review Mappings',
          approveAction: 'Approve'
        }
      };
    }
    
    // Simplified/unified terminology
    return {
      wizard: {
        step3Title: 'Review Collection Matches',
        itemName: 'match',
        reviewAction: 'Review Matches',
        approveAction: 'Select'
      },
      standalone: {
        pageTitle: 'Collection Match Review',
        itemName: 'match',
        reviewAction: 'Review Matches',
        approveAction: 'Approve'
      }
    };
  }, [terminologyPreference]);
  
  const translateTerminology = useCallback((term: string, context: 'wizard' | 'standalone'): string => {
    const terminology = getUnifiedTerminology();
    const contextTerms = terminology[context];
    
    // Handle title separately since it has different keys
    if (term === 'title') {
      if (context === 'wizard') {
        return (contextTerms as any).step3Title || term;
      } else {
        return (contextTerms as any).pageTitle || term;
      }
    }
    
    // Map other common terms
    const termMap: Record<string, keyof typeof contextTerms> = {
      'item': 'itemName',
      'review': 'reviewAction',
      'approve': 'approveAction'
    };
    
    const mappedKey = termMap[term];
    return mappedKey ? contextTerms[mappedKey] : term;
  }, [getUnifiedTerminology]);
  
  const setWizardContext = useCallback((isWizard: boolean) => {
    setIsWizardContext(isWizard);
  }, []);
  
  const value: WizardSyncState = {
    wizardData,
    isWizardContext,
    currentStep,
    updateWizardData,
    syncFromStandalone,
    syncToStandalone,
    setWizardContext,
    setCurrentStep,
    clearWizardData,
    getUnifiedTerminology,
    translateTerminology
  };
  
  return (
    <WizardSyncContext.Provider value={value}>
      {children}
    </WizardSyncContext.Provider>
  );
};

// Helper function to calculate capacity based on collection type
function calculateCapacity(collectionType: string): number {
  switch (collectionType.toLowerCase()) {
    case 'wideband':
      return 8;
    case 'narrowband':
      return 16;
    case 'optical':
    case 'imagery':
      return 4;
    case 'signals':
      return 12;
    default:
      return 1;
  }
}