import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  InputGroup,
  FormGroup,
  Callout,
  Intent,
  H3,
  H5,
  Divider,
  Icon,
  OverlayToaster,
  Position,
  Classes,
  Button,
  Breadcrumbs
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import SCCsTable from '../components/SCCsTable';
import AppNavbar from '../components/AppNavbar';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

// Design Assumptions:
// - VUE Logo is represented as a heading with an icon
// - Search functionality is prominently placed for easy access
// - Action buttons are grouped logically with appropriate spacing
// - Table is contained within a Card for visual grouping
// - Using Callout for status messages and important information

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [toaster] = useState(() => OverlayToaster.create({ position: Position.TOP }));
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateMasterList = async () => {
    setIsUpdating(true);
    setUpdateError(null);
    
    try {
      // Simulate API call with potential failure
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate 10% chance of failure
          if (Math.random() < 0.1) {
            reject(new Error('Network error: Unable to connect to server'));
          } else {
            resolve('success');
          }
        }, 2000);
      });
      
      // Show success message
      const toasterInstance = await toaster;
      toasterInstance.show({
        message: 'Master list updated successfully!',
        intent: Intent.SUCCESS,
        icon: IconNames.TICK_CIRCLE,
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setUpdateError(errorMessage);
      
      // Show error toast
      const toasterInstance = await toaster;
      toasterInstance.show({
        message: `Failed to update master list: ${errorMessage}`,
        intent: Intent.DANGER,
        icon: IconNames.ERROR,
      });
    } finally {
      setIsUpdating(false);
    }
  };

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

  const handleCreateCollectionDeck = () => {
    navigate(getSmartEntryPoint());
  };

  const handleAddSCC = () => {
    navigate('/sccs/new');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchClear = () => {
    setSearchQuery('');
  };

  const handleHelpClick = () => {
    const toasterInstance = toaster;
    toasterInstance.then(t => t.show({
      message: (
        <div>
          <strong>Keyboard Shortcuts:</strong><br/>
          ⌘K: Focus search<br/>
          ⌘N: Add new SCC<br/>
          ⌘R: Refresh data sources<br/>
          Escape: Clear search
        </div>
      ),
      intent: Intent.PRIMARY,
      icon: IconNames.INFO_SIGN,
    }));
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSearch: () => searchInputRef.current?.focus(),
    onAddSCC: handleAddSCC,
    onUpdateMaster: handleUpdateMasterList,
    onEscape: () => setSearchQuery(''),
  });

  return (
    <div className="dashboard">
      {/* Header */}
      <AppNavbar 
        showHelpButton={true}
        onHelpClick={handleHelpClick}
      />

      {/* Breadcrumbs */}
      <div style={{ 
        padding: '16px 24px 0 24px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <Breadcrumbs
          items={[
            {
              text: 'Data Sources',
              icon: IconNames.DATABASE,
              current: true
            }
          ]}
        />
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Search Section */}
        <Card className="bp6-margin-bottom">
          <H5>Find Sources</H5>
          <FormGroup>
            <InputGroup
              inputRef={searchInputRef}
              placeholder="Search for data sources... (⌘K to focus)"
              value={searchQuery}
              onChange={handleSearchChange}
              leftIcon={IconNames.SEARCH}
              rightElement={
                searchQuery ? (
                  <Button
                    minimal
                    icon={IconNames.CROSS}
                    onClick={handleSearchClear}
                    title="Clear search"
                    data-testid="clear-search-button"
                  />
                ) : undefined
              }
              large
              data-testid="search-input"
            />
          </FormGroup>
          {searchQuery && (
            <div style={{ marginTop: 'var(--space-1)', fontSize: '12px', color: '#666' }}>
              Search results will update as you type
            </div>
          )}
        </Card>

        {/* Action Buttons */}
        <Card className="bp6-margin-bottom">
          <H5>Actions</H5>
          <div style={{ display: 'flex', gap: 'var(--button-gap)', flexWrap: 'wrap' }}>
            <Button
              icon={IconNames.REFRESH}
              text="Refresh Data Sources"
              intent="primary"
              loading={isUpdating}
              onClick={handleUpdateMasterList}
              large
              disabled={isUpdating}
              data-testid="update-master-button"
            />
            <Button
              icon={IconNames.NEW_OBJECT}
              text="Create Collection"
              intent="success"
              onClick={handleCreateCollectionDeck}
              large
              data-testid="create-deck-button"
            />
            <Button
              icon={IconNames.PLUS}
              text="Add Data Source"
              intent="warning"
              onClick={handleAddSCC}
              large
              data-testid="add-scc-button"
            />
          </div>
        </Card>

        {/* Status Messages */}
        {isUpdating && (
          <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN} className="bp6-margin-bottom">
            <div>
              <strong>Updating master list...</strong>
              <div style={{ marginTop: 'var(--space-1)', fontSize: '12px' }}>
                Please wait while we synchronize with the server. This may take a few moments.
              </div>
            </div>
          </Callout>
        )}

        {updateError && (
          <Callout intent={Intent.DANGER} icon={IconNames.ERROR} className="bp6-margin-bottom">
            <div>
              <strong>Refresh failed</strong>
              <div style={{ marginTop: 'var(--space-1)' }}>
                {updateError}
              </div>
              <Button
                small
                intent={Intent.DANGER}
                text="Try Again"
                onClick={handleUpdateMasterList}
                style={{ marginTop: 'var(--space-2)' }}
                data-testid="retry-update-button"
              />
            </div>
          </Callout>
        )}

        {/* SCCs Table */}
        <Card>
          <H5>Available Data Sources</H5>
          <Divider className="bp6-margin-bottom" />
          <SCCsTable searchQuery={searchQuery} />
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
