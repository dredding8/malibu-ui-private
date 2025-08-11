import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Navbar,
  NavbarGroup,
  NavbarHeading,
  NavbarDivider,
  Button,
  Alignment,
  Card,
  InputGroup,
  FormGroup,
  Callout,
  Intent,
  H3,
  H5,
  Divider,
  Icon
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import SCCsTable from '../components/SCCsTable';

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

  const handleUpdateMasterList = () => {
    setIsUpdating(true);
    // Simulate API call
    setTimeout(() => {
      setIsUpdating(false);
    }, 2000);
  };

  const handleCreateCollectionDeck = () => {
    navigate('/decks/new/data');
  };

  const handleAddSCC = () => {
    navigate('/sccs/new');
  };

  return (
    <div className="dashboard">
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
            icon={IconNames.CUBE} 
            text="SCCs" 
            onClick={() => navigate('/sccs')}
          />
          <Button 
            className="bp4-minimal" 
            icon={IconNames.NEW_OBJECT} 
            text="Decks" 
            onClick={() => navigate('/decks')}
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
      <div className="dashboard-content">
        {/* Search Section */}
        <Card className="bp4-margin-bottom">
          <H5>Search SCCs</H5>
          <FormGroup>
            <InputGroup
              placeholder="Search SCCs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={IconNames.SEARCH}
              large
            />
          </FormGroup>
        </Card>

        {/* Action Buttons */}
        <Card className="bp4-margin-bottom">
          <H5>Actions</H5>
          <div style={{ display: 'flex', gap: 'var(--button-gap)', flexWrap: 'wrap' }}>
            <Button
              icon={IconNames.REFRESH}
              text="Update Master List"
              intent="primary"
              loading={isUpdating}
              onClick={handleUpdateMasterList}
              large
            />
            <Button
              icon={IconNames.NEW_OBJECT}
              text="Create Collection Deck"
              intent="success"
              onClick={handleCreateCollectionDeck}
              large
            />
            <Button
              icon={IconNames.PLUS}
              text="ADD SCC"
              intent="warning"
              onClick={handleAddSCC}
              large
            />
          </div>
        </Card>

        {/* Status Message */}
        {isUpdating && (
          <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN} className="bp4-margin-bottom">
            Updating master list... Please wait.
          </Callout>
        )}

        {/* SCCs Table */}
        <Card>
          <H5>SCCs Table</H5>
          <Divider className="bp4-margin-bottom" />
          <SCCsTable searchQuery={searchQuery} />
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
