import React, { useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Intent, Callout } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { useWizardSync } from '../../contexts/WizardSyncContext';
import { useEnhancedNavigation } from '../../contexts/EnhancedNavigationContext';

interface StateTransferBridgeProps {
  children: React.ReactNode;
}

/**
 * StateTransferBridge ensures state consistency when navigating between
 * wizard context (CreateCollectionDeck) and standalone pages
 */
export const StateTransferBridge: React.FC<StateTransferBridgeProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    wizardData, 
    setWizardContext, 
    syncFromStandalone, 
    syncToStandalone,
    isWizardContext 
  } = useWizardSync();
  // const { preserveFormData, getPreservedData, generateDeepLink } = useEnhancedNavigation();
  // TODO: Restore these functions when EnhancedNavigationContext is fully implemented
  
  // Detect context transitions
  useEffect(() => {
    const isInWizard = location.pathname.includes('/create-collection-deck');
    const wasInWizard = isWizardContext;
    
    // Update wizard context
    setWizardContext(isInWizard);
    
    // Handle transitions
    if (!isInWizard && wasInWizard) {
      // Exiting wizard - preserve state
      // TODO: Restore when preserveFormData is available
      // preserveFormData('lastWizardState', {
      //   ...wizardData,
      //   exitPath: location.pathname,
      //   exitTime: new Date()
      // });
    } else if (isInWizard && !wasInWizard) {
      // Entering wizard - check for preserved state
      // TODO: Restore when getPreservedData is available
      // const preservedState = getPreservedData('lastWizardState');
      // if (preservedState && preservedState.exitTime) {
      //   const timeSinceExit = Date.now() - new Date(preservedState.exitTime).getTime();
      //   const thirtyMinutes = 30 * 60 * 1000;
        
      //   if (timeSinceExit < thirtyMinutes) {
      //     // Recent state exists - could offer to resume
      //     console.log('Recent wizard state found:', preservedState);
      //   }
      // }
    }
  }, [location.pathname, isWizardContext, setWizardContext, wizardData]);
  
  // Handle state transfer for specific routes
  useEffect(() => {
    const path = location.pathname;
    
    // Transferring from wizard Step 3 to standalone field mapping review
    if (path.includes('/field-mapping-review') && location.state?.fromWizard) {
      const wizardOpportunities = wizardData.selectedOpportunities;
      if (wizardOpportunities && wizardOpportunities.length > 0) {
        // Transform wizard data to field mapping format
        const fieldMappingData = syncToStandalone('fieldMapping');
        // TODO: Restore when preserveFormData is available
        // preserveFormData('fieldMappingReview', fieldMappingData);
      }
    }
    
    // Transferring from standalone back to wizard
    if (path.includes('/create-collection-deck/step3') && location.state?.fromStandalone) {
      // TODO: Restore when getPreservedData is available
      const standaloneData = null; // getPreservedData('fieldMappingReview');
      if (standaloneData) {
        syncFromStandalone(standaloneData, 'fieldMapping');
      }
    }
  }, [location, wizardData, syncToStandalone, syncFromStandalone]);
  
  // TODO: Restore when generateDeepLink is available
  // const handleGenerateDeepLink = useCallback(() => {
  //   const currentPath = location.pathname;
  //   const stateToShare = {
  //     wizardData,
  //     currentPath,
  //     timestamp: Date.now()
  //   };
  //   
  //   const deepLink = generateDeepLink(currentPath, stateToShare);
  //   
  //   // Copy to clipboard
  //   navigator.clipboard.writeText(deepLink).then(() => {
  //     console.log('Deep link copied to clipboard:', deepLink);
  //   });
  // }, [location.pathname, wizardData, generateDeepLink]);
  
  return (
    <>
      {children}
      
      {/* State Transfer Indicator - shown during transitions */}
      {location.state?.transferringState && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1000
        }}>
          <Callout intent={Intent.PRIMARY} icon={IconNames.EXCHANGE}>
            <strong>State synchronized</strong>
            <p style={{ marginBottom: 0, marginTop: '4px' }}>
              Your data has been transferred successfully.
            </p>
          </Callout>
        </div>
      )}
    </>
  );
};

/**
 * Hook to handle navigation with state transfer
 */
export function useStateTransferNavigation() {
  const navigate = useNavigate();
  const { wizardData, isWizardContext, syncToStandalone } = useWizardSync();
  // const { preserveFormData } = useEnhancedNavigation();
  
  const navigateWithStateTransfer = useCallback((
    to: string,
    options?: {
      transferState?: boolean;
      sourceContext?: 'wizard' | 'standalone';
      targetContext?: 'wizard' | 'standalone';
    }
  ) => {
    const shouldTransfer = options?.transferState ?? true;
    
    if (shouldTransfer) {
      // Determine contexts
      const fromWizard = options?.sourceContext === 'wizard' || isWizardContext;
      const toFieldMapping = to.includes('field-mapping-review');
      const toOpportunities = to.includes('collection-opportunities');
      
      // Prepare state based on navigation
      let navigationState: any = {
        transferringState: true,
        fromWizard,
        fromStandalone: !fromWizard
      };
      
      // Add specific data transformations
      if (fromWizard && toFieldMapping) {
        const fieldMappingData = syncToStandalone('fieldMapping');
        // TODO: Restore when preserveFormData is available
        // preserveFormData('pendingFieldMapping', fieldMappingData);
        navigationState.fieldMappingData = fieldMappingData;
      }
      
      navigate(to, { state: navigationState });
    } else {
      navigate(to);
    }
  }, [navigate, isWizardContext, syncToStandalone]);
  
  return { navigateWithStateTransfer };
}

/**
 * Component to show when navigating between contexts with shared data
 */
export const StateTransferPrompt: React.FC<{
  onAccept: () => void;
  onReject: () => void;
  sourceContext: string;
  targetContext: string;
  itemCount: number;
}> = ({ onAccept, onReject, sourceContext, targetContext, itemCount }) => {
  return (
    <Callout 
      intent={Intent.PRIMARY} 
      icon={IconNames.INFO_SIGN}
      style={{ marginBottom: '16px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong>Continue with existing data?</strong>
          <p style={{ marginBottom: 0, marginTop: '4px' }}>
            You have {itemCount} items from {sourceContext}. 
            Would you like to continue working with this data in {targetContext}?
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
          <Button 
            intent={Intent.PRIMARY} 
            text="Yes, Continue"
            onClick={onAccept}
          />
          <Button 
            text="No, Start Fresh"
            onClick={onReject}
          />
        </div>
      </div>
    </Callout>
  );
};