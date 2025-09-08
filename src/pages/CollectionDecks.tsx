import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  H3,
  H5,
  Divider,
  Tabs,
  Tab,
  TabId,
  FormGroup,
  ControlGroup,
  Intent,
  Callout,
  Alert,
  Button,
  Breadcrumbs
} from '@blueprintjs/core';
import { DateInput } from '@blueprintjs/datetime';
import { IconNames } from '@blueprintjs/icons';
import CollectionDecksTable from '../components/CollectionDecksTable';
import AppNavbar from '../components/AppNavbar';

const CollectionDecks: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<TabId>('in-progress');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [showIncompleteDeckAlert, setShowIncompleteDeckAlert] = useState(false);
  const [hasIncompleteDeck, setHasIncompleteDeck] = useState(false);

  // Check for incomplete deck on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('vue-deck-draft');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // Check if we have meaningful data (not just empty object)
        const hasData = parsedData.taskingWindow?.startDate || 
                       parsedData.parameters?.hardCapacity ||
                       parsedData.matches?.length > 0;
        
        if (hasData) {
          setHasIncompleteDeck(true);
          setShowIncompleteDeckAlert(true);
        }
      } catch (error) {
        console.warn('Failed to parse saved deck data:', error);
      }
    }
  }, []);

  const getSmartEntryPoint = () => {
    const savedData = localStorage.getItem('vue-deck-draft');
    if (!savedData) return '/create-collection-deck/data';
    
    try {
      const data = JSON.parse(savedData);
      
      // Step 4: Has matches selected
      if (data.matches && data.matches.length > 0) {
        return '/create-collection-deck/instructions';
      }
      
      // Step 3: Has parameters set
      if (data.parameters && data.parameters.hardCapacity) {
        return '/create-collection-deck/matches';
      }
      
      // Step 2: Has basic data
      if (data.taskingWindow && data.taskingWindow.startDate) {
        return '/create-collection-deck/parameters';
      }
      
      // Default to step 1
      return '/create-collection-deck/data';
    } catch {
      return '/create-collection-deck/data';
    }
  };

  const handleCreateNewDeck = () => {
    navigate(getSmartEntryPoint());
  };

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const handleTabChange = (newTabId: TabId) => {
    setSelectedTab(newTabId);
  };

  const handleResumeDeck = () => {
    setShowIncompleteDeckAlert(false);
    navigate('/create-collection-deck/data');
  };

  const handleDismissIncompleteDeck = () => {
    setShowIncompleteDeckAlert(false);
  };

  const handleDiscardIncompleteDeck = () => {
    localStorage.removeItem('vue-deck-draft');
    setHasIncompleteDeck(false);
    setShowIncompleteDeckAlert(false);
  };

  return (
    <div className="collection-decks">
      {/* Header */}
      <AppNavbar />
      
      {/* Breadcrumbs */}
      <div style={{ 
        padding: '16px 24px 0 24px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <Breadcrumbs
          items={[
            {
              text: 'Data Sources',
              icon: IconNames.DATABASE,
              onClick: () => navigate('/')
            },
            {
              text: 'Collection Decks',
              icon: IconNames.LAYERS,
              current: true
            }
          ]}
        />
      </div>

      {/* Main Content */}
      <div className="collection-decks-content" style={{ padding: '20px' }}>
        <H3>Your Collections</H3>
        
        {/* Incomplete Deck Notification */}
        {hasIncompleteDeck && (
          <Callout 
            intent={Intent.WARNING} 
            icon={IconNames.WARNING_SIGN} 
            className="bp4-margin-bottom"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>You have work waiting to be finished</strong>
                <br />
                Your previous progress has been saved and you can continue where you left off.
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button
                  small
                  intent={Intent.PRIMARY}
                  icon={IconNames.PLAY}
                  text="Continue"
                  onClick={handleResumeDeck}
                  data-testid="resume-deck-button"
                />
                <Button
                  small
                  minimal
                  intent={Intent.DANGER}
                  icon={IconNames.TRASH}
                  text="Discard"
                  onClick={handleDiscardIncompleteDeck}
                />
              </div>
            </div>
          </Callout>
        )}
        
        {/* Action Buttons */}
        <Card className="bp4-margin-bottom">
          <H5>Actions</H5>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button
              icon={IconNames.NEW_OBJECT}
              text="Create Collection"
              intent="success"
              onClick={handleCreateNewDeck}
              size="large"
              data-testid="create-collection-button"
            />
          </div>
        </Card>

        {/* Date Filters */}
        <Card className="bp4-margin-bottom">
          <H5>Find Collections by Date</H5>
          <ControlGroup fill>
            <FormGroup label="Start Date">
              <DateInput
                value={startDate}
                onChange={(date) => setStartDate(date)}
                placeholder="Select start date..."
                canClearSelection
              />
            </FormGroup>
            <FormGroup label="End Date">
              <DateInput
                value={endDate}
                onChange={(date) => setEndDate(date)}
                placeholder="Select end date..."
                canClearSelection
              />
            </FormGroup>
            <FormGroup label="&nbsp;">
              <Button
                icon={IconNames.RESET}
                text="Reset"
                onClick={handleReset}
                intent="warning"
              />
            </FormGroup>
          </ControlGroup>
        </Card>

        {/* Tabs for In Progress and Completed */}
        <Card>
          <Tabs
            id="collection-decks-tabs"
            selectedTabId={selectedTab}
            onChange={handleTabChange}
            animate={true}
          >
            <Tab
              id="in-progress"
              title="In Progress"
              panel={
                <div>
                  <H5>Collections We're Working On</H5>
                  <Divider className="bp4-margin-bottom" />
                  <CollectionDecksTable 
                    type="in-progress"
                    startDate={startDate}
                    endDate={endDate}
                  />
                </div>
              }
            />
            <Tab
              id="completed"
              title="Completed"
              panel={
                <div>
                  <H5>Ready Collections</H5>
                  <Divider className="bp4-margin-bottom" />
                  <CollectionDecksTable 
                    type="completed"
                    startDate={endDate}
                    endDate={endDate}
                  />
                </div>
              }
            />
          </Tabs>
        </Card>
      </div>

      {/* Incomplete Deck Alert */}
      <Alert
        isOpen={showIncompleteDeckAlert}
        onClose={handleDismissIncompleteDeck}
        onConfirm={handleResumeDeck}
        onCancel={handleDiscardIncompleteDeck}
        intent={Intent.WARNING}
        icon={IconNames.WARNING_SIGN}
        cancelButtonText="Discard Draft"
        confirmButtonText="Continue Editing"
      >
        <p>
          You have an unfinished collection that we saved automatically. Would you like to continue where you left off?
        </p>
        <p>
          <strong>Note:</strong> Your progress has been kept safe and you can pick up from the last step you were working on.
        </p>
      </Alert>
    </div>
  );
};

export default CollectionDecks;
