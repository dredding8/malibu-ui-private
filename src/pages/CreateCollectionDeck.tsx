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
import CollectionParametersForm from './CreateCollectionDeck/CollectionParametersForm';
import CreateDeckStep from './CreateCollectionDeck/CreateDeckStep';
import ManageCollectionStep from './CreateCollectionDeck/ManageCollectionStep';
import { useBackgroundProcessing } from '../hooks/useBackgroundProcessing';
import { NAVIGATION_LABELS, NAVIGATION_ROUTES } from '../constants/navigation';

// UX Research: Single Ease Question (SEQ)
import { SingleEaseQuestion, SEQResponse } from '../components/SEQ/SingleEaseQuestion';
import { seqService } from '../services/seqService';

const CreateCollectionDeck: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [showAbandonmentAlert, setShowAbandonmentAlert] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [modalStack, setModalStack] = useState<string[]>([]);
  const { isProcessing } = useBackgroundProcessing();

  // UX Research: SEQ state
  const [showSEQ, setShowSEQ] = useState(false);

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
    { id: 1, name: 'Collection Parameters', path: '/create-collection-deck/parameters' },
    { id: 2, name: 'Create Collection Deck', path: '/create-collection-deck/create' },
    { id: 3, name: 'Manage Collection', path: '/create-collection-deck/manage' }
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

    // Check more specific paths first to avoid substring matching issues
    // (e.g., '/create-collection-deck/manage' contains 'create')
    if (path.includes('/manage')) newStep = 3;
    else if (path.includes('/create')) newStep = 2;
    else if (path.includes('/parameters')) newStep = 1;

    // Update step based on URL (React will skip re-render if value unchanged)
    // Removed currentStep check to avoid race condition with back button
    setCurrentStep(newStep);

    // Handle root path redirect
    if (path === '/create-collection-deck' || path === '/create-collection-deck/') {
      navigate('/create-collection-deck/parameters', { replace: true });
    }
  }, [location.pathname, navigate]);

  const updateDeckData = useCallback((newData: any) => {
    setDeckData(prev => ({ ...prev, ...newData }));
    setHasUnsavedChanges(true);
  }, []);

  // Step validation function
  const canAccessStep = useCallback((stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1: return true;
      case 2: return !!(deckData.taskingWindow?.startDate && deckData.taskingWindow?.endDate && deckData.tleData?.source);
      case 3: return !!(deckData.matches && deckData.matches.length > 0); // Manage step requires deck to be created
      default: return false;
    }
  }, [deckData]);

  // Enhanced navigation with step validation and state management
  const handleNext = useCallback(() => {
    if (currentStep < 3) {
      const nextStep = currentStep + 1;
      if (canAccessStep(nextStep)) {
        setCurrentStep(nextStep);
        // For Step 3, include the deck ID in the URL if available
        const targetPath = nextStep === 3 && deckData.deckId
          ? `${steps[nextStep - 1].path}?id=${deckData.deckId}`
          : steps[nextStep - 1].path;

        navigate(targetPath, {
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

    // UX Research: Show SEQ based on sampling (33% of wizard completions)
    // This measures the complete wizard flow (TASK 6 + TASK 8 + TASK 9 combined)
    if (seqService.shouldShowSEQ('task_6_8_9_collection_deck_wizard')) {
      setShowSEQ(true);
    } else {
      // Navigate immediately if no SEQ
      navigate('/decks', { replace: true });
    }
  }, [deckData, navigate]);

  // UX Research: Handle SEQ response
  const handleSEQResponse = useCallback((response: SEQResponse) => {
    seqService.recordResponse(response);
    setShowSEQ(false);
    // Navigate after SEQ submission
    navigate('/decks', { replace: true });
  }, [navigate]);

  // UX Research: Handle SEQ dismissal
  const handleSEQDismiss = useCallback(() => {
    seqService.recordDismissal(
      'task_6_8_9_collection_deck_wizard',
      'TASK 6+8+9: Initiate Deck, Edit Parameters, Run Matching (Complete Wizard)'
    );
    setShowSEQ(false);
    // Navigate after SEQ dismissal
    navigate('/decks', { replace: true });
  }, [navigate]);

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
              Step {currentStep} of 3
            </Tag>
          </div>
          
          {/* Current Step Context */}
          <Callout
            intent={Intent.PRIMARY}
            icon={currentStep === 1 ? IconNames.COG : IconNames.SELECTION}
            className="bp6-margin-bottom"
            data-testid="current-step-context"
          >
            <strong>{steps[currentStep - 1]?.name}</strong>
            <div style={{ marginTop: '5px', fontSize: '14px' }}>
              {currentStep === 1 && "Configure tasking window, data sources, and collection parameters"}
              {currentStep === 2 && "Generate orbital matches and create collection deck entity"}
              {currentStep === 3 && "Manage collection assignments and allocate sites"}
            </div>
            {currentStep < 3 && (
              <div style={{ marginTop: '8px', fontSize: '13px', color: '#5C7080' }}>
                Estimated time remaining: {currentStep === 1 ? "4-6" : "1-2"} minutes
              </div>
            )}
          </Callout>

          {/* Visual Progress Bar */}
          <ProgressBar
            value={currentStep / 3}
            intent={Intent.PRIMARY}
            className="bp6-margin-bottom"
            aria-label={`Collection creation progress: Step ${currentStep} of 3 - ${steps[currentStep - 1]?.name}`}
            data-testid="progress-bar"
          />

          {/* Step Indicators with Status */}
          {/* P0-3: ARIA attributes for step indicators */}
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}
            data-testid="step-progress-indicators"
            role="list"
            aria-label="Wizard progress steps"
          >
            {steps.map((step, index) => (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px',
                  borderRadius: '3px',
                  backgroundColor: currentStep === step.id ? '#F5F8FA' : 'transparent',
                  border: currentStep === step.id ? '1px solid #137CBD' : '1px solid transparent'
                }}
                data-testid={`step-${step.id}-indicator`}
                role="listitem"
                aria-current={currentStep === step.id ? 'step' : undefined}
                aria-label={`Step ${step.id}: ${step.name}. ${
                  currentStep > step.id ? 'Completed' :
                  currentStep === step.id ? 'Current step' :
                  'Not yet started'
                }`}
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
              path="/parameters"
              element={
                <CollectionParametersForm
                  data={deckData}
                  onUpdate={updateDeckData}
                  onNext={handleNext}
                  onCancel={handleCancel}
                />
              }
            />
            <Route
              path="/create"
              element={
                <CreateDeckStep
                  data={deckData}
                  onUpdate={updateDeckData}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              }
            />
            <Route
              path="/manage"
              element={<ManageCollectionStep />}
            />
            {/* Default route - redirect to step 1 */}
            <Route path="/*" element={<CollectionParametersForm
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

      {/* UX Research: Single Ease Question (SEQ) - Post-wizard survey */}
      {showSEQ && (
        <SingleEaseQuestion
          taskId="task_6_8_9_collection_deck_wizard"
          taskName="TASK 6+8+9: Initiate Deck, Edit Parameters, Run Matching (Complete Wizard)"
          onResponse={handleSEQResponse}
          onDismiss={handleSEQDismiss}
          enableComment={true} // Complex wizard gets optional comment
          sessionId={seqService.getSessionId()}
        />
      )}
    </div>
  );
};

export default CreateCollectionDeck;
