import React, { useState } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import {
  Navbar,
  NavbarGroup,
  NavbarHeading,
  NavbarDivider,
  Button,
  Alignment,
  Card,
  H3,
  H5,
  Divider,
  ProgressBar,
  Intent
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import Step1InputData from './CreateCollectionDeck/Step1InputData';
import Step2ReviewParameters from './CreateCollectionDeck/Step2ReviewParameters';
import Step3ReviewMatches from './CreateCollectionDeck/Step3ReviewMatches';
import Step4SpecialInstructions from './CreateCollectionDeck/Step4SpecialInstructions';

const CreateCollectionDeck: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
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
    { id: 1, name: 'Input Data', path: '/decks/new/data' },
    { id: 2, name: 'Review Parameters', path: '/decks/new/parameters' },
    { id: 3, name: 'Review Matches', path: '/decks/new/matches' },
    { id: 4, name: 'Special Instructions', path: '/decks/new/instructions' }
  ];

  const updateDeckData = (newData: any) => {
    setDeckData(prev => ({ ...prev, ...newData }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      navigate(steps[nextStep - 1].path);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      navigate(steps[prevStep - 1].path);
    }
  };

  const handleCancel = () => {
    navigate('/decks');
  };

  const handleFinish = () => {
    // Save the collection deck
    console.log('Saving collection deck:', deckData);
    navigate('/decks');
  };

  return (
    <div className="create-collection-deck">
      {/* Header */}
      <Navbar className="bp4-dark">
        <NavbarGroup align={Alignment.START}>
          <NavbarHeading>
            <span className="bp4-icon bp4-icon-cube bp4-margin-right" />
            VUE Dashboard
          </NavbarHeading>
          <NavbarDivider />
          <Button 
            className="bp4-minimal" 
            icon={IconNames.DATABASE} 
            text="Master" 
            onClick={() => navigate('/')}
          />
          <Button 
            className="bp4-minimal" 
            icon={IconNames.HISTORY} 
            text="History" 
            onClick={() => navigate('/history')}
          />
          <Button 
            className="bp4-minimal" 
            icon={IconNames.CHART} 
            text="Analytics" 
            onClick={() => navigate('/analytics')}
          />
        </NavbarGroup>
        <NavbarGroup align={Alignment.END}>
          <Button 
            className="bp4-minimal" 
            icon={IconNames.LOG_OUT} 
            text="Logout"
            intent="danger"
          />
        </NavbarGroup>
      </Navbar>

      {/* Main Content */}
      <div className="create-deck-content" style={{ padding: '20px' }}>
        <H3>Create Collection Deck</H3>
        
        {/* Progress Bar */}
        <Card className="bp4-margin-bottom">
          <H5>Progress</H5>
          <ProgressBar 
            value={currentStep / 4} 
            intent={Intent.PRIMARY}
            className="bp4-margin-bottom"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666' }}>
            {steps.map((step, index) => (
              <span 
                key={step.id}
                style={{ 
                  fontWeight: currentStep >= step.id ? 'bold' : 'normal',
                  color: currentStep >= step.id ? '#137CBD' : '#666'
                }}
              >
                {step.name}
              </span>
            ))}
          </div>
        </Card>

        {/* Step Content */}
        <Card>
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
              path="/matches" 
              element={
                <Step3ReviewMatches 
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
          </Routes>
        </Card>
      </div>
    </div>
  );
};

export default CreateCollectionDeck;
