import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import {
  Card,
  Divider,
  ProgressBar,
  Intent,
  Alert,
  Callout,
  Button,
  Tag,
  Breadcrumbs
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import IconWrapper from '../components/IconWrapper';
import AppNavbar from '../components/AppNavbar';
import Step1InputData from './CreateCollectionDeck/Step1InputData';
import Step2ReviewParameters from './CreateCollectionDeck/Step2ReviewParameters';
import Step3SelectOpportunities from './CreateCollectionDeck/Step3SelectOpportunities';
import Step4SpecialInstructions from './CreateCollectionDeck/Step4SpecialInstructions';
import { useBackgroundProcessing } from '../hooks/useBackgroundProcessing';
import { NAVIGATION_LABELS, NAVIGATION_ROUTES } from '../constants/navigation';

const CreateCollectionDeck: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [showAbandonmentAlert, setShowAbandonmentAlert] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [modalStack, setModalStack] = useState<string[]>([]);
  const { isProcessing } = useBackgroundProcessing();

  // Modal management functions
  const showModal = useCallback((modalId: string) => {
    setModalStack(prev => [...prev, modalId]);
  }, []);

  const hideModal = useCallback((modalId: string) => {
    setModalStack(prev => prev.filter(id => id !== modalId));
  }, []);

  // Check if navigation is allowed
  const canNavigate = modalStack.length === 0;
  const [deckData, setDeckData] = useState({
    // Step 1: Input Data
    taskingWindow: {
      startDate: '',
      endDate: ''
    },
    tleData: {
      source: '',
      data: ''
    },
    unavailableSites: {
      source: '',
      sites: []
    },
    
    // Step 2: Review Parameters
    parameters: {
      hardCapacity: '',
      minDuration: '',
      elevation: ''
    },
    
    // Step 3: Review Matches
    matches: [],
    
    // Step 4: Special Instructions
    instructions: ''
  });

  const steps = [
    { id: 1, name: NAVIGATION_LABELS.WIZARD_STEP_1, path: NAVIGATION_ROUTES.CREATE_COLLECTION_DATA },
    { id: 2, name: NAVIGATION_LABELS.WIZARD_STEP_2, path: NAVIGATION_ROUTES.CREATE_COLLECTION_PARAMETERS },
    { id: 3, name: NAVIGATION_LABELS.WIZARD_STEP_3, path: NAVIGATION_ROUTES.CREATE_COLLECTION_OPPORTUNITIES },
    { id: 4, name: NAVIGATION_LABELS.WIZARD_STEP_4, path: NAVIGATION_ROUTES.CREATE_COLLECTION_INSTRUCTIONS }
  ];

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('vue-deck-draft');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setDeckData(parsedData);
        setHasUnsavedChanges(true);
      } catch (error) {
        console.warn('Failed to load saved deck data:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (hasUnsavedChanges) {
      localStorage.setItem('vue-deck-draft', JSON.stringify(deckData));
    }
  }, [deckData, hasUnsavedChanges]);

  // Restore state from browser history if available
  useEffect(() => {
    const state = location.state as any;
    if (state?.wizardData && !hasUnsavedChanges) {
      setDeckData(state.wizardData);
      setHasUnsavedChanges(true);
    }
  }, [location.state, hasUnsavedChanges]);

  // Enhanced URL-step synchronization
  useEffect(() => {
    const path = location.pathname;
    let newStep = 1;
    
    if (path.includes('/instructions')) newStep = 4;
    else if (path.includes('/collection-opportunities')) newStep = 3;
    else if (path.includes('/parameters')) newStep = 2;
    else if (path.includes('/data')) newStep = 1;
    
    // Only update if step actually changed to prevent loops
    if (newStep !== currentStep) {
      setCurrentStep(newStep);
    }
    
    // Handle root path redirect
    if (path === '/create-collection-deck' || path === '/create-collection-deck/') {
      navigate('/create-collection-deck/data', { replace: true });
    }
  }, [location.pathname, currentStep, navigate]);

  const updateDeckData = useCallback((newData: any) => {
    setDeckData(prev => ({ ...prev, ...newData }));
    setHasUnsavedChanges(true);
  }, []);

  // Step validation function
  const canAccessStep = useCallback((stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1: return true;
      case 2: return !!(deckData.taskingWindow?.startDate && deckData.taskingWindow?.endDate && deckData.tleData?.source);
      case 3: return !!(deckData.parameters?.hardCapacity && deckData.parameters?.minDuration && deckData.parameters?.elevation !== undefined);
      case 4: return !!(deckData.matches && deckData.matches.length > 0);
      default: return false;
    }
  }, [deckData]);

  // Enhanced navigation with step validation and state management
  const handleNext = useCallback(() => {
    if (currentStep < 4) {
      const nextStep = currentStep + 1;
      if (canAccessStep(nextStep)) {
        setCurrentStep(nextStep);
        navigate(steps[nextStep - 1].path, { 
          state: { wizardData: deckData, step: nextStep },
          replace: false
        });
      }
    }
  }, [currentStep, navigate, steps, deckData, canAccessStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      navigate(steps[prevStep - 1].path, { 
        state: { wizardData: deckData, step: prevStep },
        replace: false
      });
    }
  }, [currentStep, navigate, steps, deckData]);

  const handleCancel = useCallback(() => {
    if (!canNavigate) return; // Prevent navigation if modals are open
    
    if (hasUnsavedChanges) {
      showModal('abandonment');
      setShowAbandonmentAlert(true);
    } else {
      navigate('/decks');
    }
  }, [hasUnsavedChanges, navigate, canNavigate, showModal]);

  const handleConfirmAbandonment = useCallback(() => {
    localStorage.removeItem('vue-deck-draft');
    setHasUnsavedChanges(false);
    setShowAbandonmentAlert(false);
    hideModal('abandonment');
    navigate('/decks');
  }, [navigate, hideModal]);

  const handleCancelAbandonment = useCallback(() => {
    setShowAbandonmentAlert(false);
    hideModal('abandonment');
  }, [hideModal]);

  const handleFinish = useCallback(async () => {
    // Save the collection deck
    console.log('Saving collection deck:', deckData);
    localStorage.removeItem('vue-deck-draft');
    setHasUnsavedChanges(false);
    
    // Always go to decks page after completion
    // Background processing hook will redirect to history if needed
    navigate('/decks', { replace: true });
  }, [deckData, navigate]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return (
    <div className="create-collection-deck" data-testid="create-collection-deck-page">
      {/* Header */}
      <AppNavbar />
      
      {/* Breadcrumbs */}
      <div style={{ 
        padding: '16px 24px 0 24px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <Breadcrumbs
          items={[
            {
              text: NAVIGATION_LABELS.DATA_SOURCES,
              icon: IconNames.DATABASE,
              onClick: () => navigate(NAVIGATION_ROUTES.ROOT)
            },
            {
              text: NAVIGATION_LABELS.COLLECTION_DECKS,
              icon: IconNames.LAYERS,
              onClick: () => navigate(NAVIGATION_ROUTES.COLLECTIONS)
            },
            {
              text: NAVIGATION_LABELS.CREATE_COLLECTION,
              icon: IconNames.ADD,
              current: true
            }
          ]}
        />
      </div>

      {/* Main Content */}
      <main className="create-deck-content" role="main" style={{ 
        padding: '20px', 
        maxWidth: '1200px', 
        margin: '0 auto'
      }}>
        <header>
          <h1 data-testid="create-deck-title">Build Your Collection</h1>
        </header>
        
        {/* Background Processing Status */}
        {isProcessing && (
          <Callout 
            intent={Intent.PRIMARY} 
            icon={IconNames.COG} 
            className="bp6-margin-bottom"
            data-testid="background-processing-status"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>We're Working on Your Collection</strong>
                <p style={{ margin: '8px 0 0 0' }}>
                  Your collection is being built in the background.
                </p>
              </div>
              <Button
                text="View Status"
                intent={Intent.PRIMARY}
                minimal
                onClick={() => navigate('/history')}
                data-testid="view-status-button"
              />
            </div>
          </Callout>
        )}
        
        {/* Unsaved Changes Warning */}
        {hasUnsavedChanges && (
          <Callout 
            intent={Intent.WARNING} 
            icon={IconNames.WARNING_SIGN} 
            className="bp6-margin-bottom"
            data-testid="unsaved-changes-warning"
          >
            <strong>Progress Saved:</strong> We've saved your work automatically. You can leave and come back anytime.
          </Callout>
        )}
        
        {/* Enhanced Progress Tracking */}
        <Card className="bp6-margin-bottom" data-testid="progress-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 data-testid="progress-heading">Your Progress</h2>
            <Tag intent={Intent.PRIMARY} large data-testid="progress-summary">
              Step {currentStep} of 4
            </Tag>
          </div>
          
          {/* Current Step Context */}
          <Callout 
            intent={Intent.PRIMARY} 
            icon={currentStep === 1 ? IconNames.DATABASE : 
                  currentStep === 2 ? IconNames.COG : 
                  currentStep === 3 ? IconNames.SEARCH : 
                  IconNames.DOCUMENT}
            className="bp6-margin-bottom"
            data-testid="current-step-context"
          >
            <strong>{steps[currentStep - 1]?.name}</strong>
            <div style={{ marginTop: '5px', fontSize: '14px' }}>
              {currentStep === 1 && "Set up your collection data sources and time window"}
              {currentStep === 2 && "Configure your collection parameters and site requirements"}  
              {currentStep === 3 && "Select satellite collection opportunities for your deck"}
              {currentStep === 4 && "Add final instructions and submit your collection"}
            </div>
            {currentStep < 4 && (
              <div style={{ marginTop: '8px', fontSize: '13px', color: '#5C7080' }}>
                Estimated time remaining: {currentStep === 1 ? "8-10" : currentStep === 2 ? "5-7" : "3-5"} minutes
              </div>
            )}
          </Callout>

          {/* Visual Progress Bar */}
          <ProgressBar 
            value={currentStep / 4} 
            intent={Intent.PRIMARY}
            className="bp6-margin-bottom"
            aria-label={`Collection creation progress: Step ${currentStep} of 4 - ${steps[currentStep - 1]?.name}`}
            data-testid="progress-bar"
          />
          
          {/* Step Indicators with Status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }} data-testid="step-progress-indicators">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px',
                  borderRadius: '3px',
                  backgroundColor: currentStep === step.id ? '#F5F8FA' : 'transparent',
                  border: currentStep === step.id ? '1px solid #137CBD' : '1px solid transparent'
                }}
                data-testid={`step-${step.id}-indicator`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {currentStep > step.id ? (
                    <IconWrapper 
                      icon={IconNames.TICK_CIRCLE} 
                      intent={Intent.SUCCESS} 
                      size={16}
                      data-testid={`step-${step.id}-completed-icon`}
                    />
                  ) : currentStep === step.id ? (
                    <IconWrapper 
                      icon={IconNames.DOT} 
                      intent={Intent.PRIMARY} 
                      size={16}
                      data-testid={`step-${step.id}-current-icon`}
                    />
                  ) : (
                    <IconWrapper 
                      icon={IconNames.CIRCLE} 
                      intent={Intent.NONE} 
                      size={16}
                      data-testid={`step-${step.id}-pending-icon`}
                    />
                  )}
                  <span style={{ fontSize: '12px', fontWeight: '600' }}>{step.id}</span>
                </div>
                <span 
                  style={{ 
                    fontSize: '12px',
                    fontWeight: currentStep >= step.id ? 'bold' : 'normal',
                    color: currentStep >= step.id ? '#137CBD' : '#5C7080',
                    textAlign: 'center',
                    lineHeight: '1.2'
                  }}
                  data-testid={`step-${step.id}-name`}
                >
                  {step.name}
                </span>
                {currentStep > step.id && (
                  <Tag 
                    intent={Intent.SUCCESS} 
                    minimal
                    data-testid={`step-${step.id}-completed-tag`}
                  >
                    Complete
                  </Tag>
                )}
                {currentStep === step.id && (
                  <Tag 
                    intent={Intent.PRIMARY} 
                    minimal
                    data-testid={`step-${step.id}-active-tag`}
                  >
                    Active
                  </Tag>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Step Content */}
        <section aria-labelledby="step-heading" data-testid="step-content-section">
          <Card data-testid="step-content-card">
            <Routes>
            <Route 
              path="/data" 
              element={
                <Step1InputData 
                  data={deckData}
                  onUpdate={updateDeckData}
                  onNext={handleNext}
                  onCancel={handleCancel}
                />
              } 
            />
            <Route 
              path="/parameters" 
              element={
                <Step2ReviewParameters 
                  data={deckData}
                  onUpdate={updateDeckData}
                  onNext={handleNext}
                  onBack={handleBack}
                  onCancel={handleCancel}
                />
              } 
            />
            <Route 
              path="/collection-opportunities" 
              element={
                <Step3SelectOpportunities 
                  data={deckData}
                  onUpdate={updateDeckData}
                  onNext={handleNext}
                  onBack={handleBack}
                  onCancel={handleCancel}
                />
              } 
            />
            <Route 
              path="/instructions" 
              element={
                <Step4SpecialInstructions 
                  data={deckData}
                  onUpdate={updateDeckData}
                  onFinish={handleFinish}
                  onBack={handleBack}
                  onCancel={handleCancel}
                />
              } 
            />
            {/* Default route - redirect to step 1 */}
            <Route path="/*" element={<Step1InputData 
                  data={deckData}
                  onUpdate={updateDeckData}
                  onNext={handleNext}
                  onCancel={handleCancel}
                />} />
            </Routes>
          </Card>
        </section>
      </main>

      {/* Abandonment Confirmation Alert */}
      <Alert
        isOpen={showAbandonmentAlert}
        onClose={handleCancelAbandonment}
        onConfirm={handleConfirmAbandonment}
        onCancel={handleCancelAbandonment}
        intent={Intent.DANGER}
        icon={IconNames.WARNING_SIGN}
        cancelButtonText="Continue Editing"
        confirmButtonText="Discard Changes"
        data-testid="abandonment-alert"
      >
        <p>
          You've made progress on your collection. Are you sure you want to start over?
        </p>
        <p>
          <strong>Note:</strong> We can't restore this work once it's gone. All your entered information will be lost.
        </p>
      </Alert>
    </div>
  );
};

export default CreateCollectionDeck;
