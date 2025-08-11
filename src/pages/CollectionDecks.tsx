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
  H3,
  H5,
  Divider,
  Tabs,
  Tab,
  TabId,
  FormGroup,
  ControlGroup,
  Intent
} from '@blueprintjs/core';
import { DateInput } from '@blueprintjs/datetime';
import { IconNames } from '@blueprintjs/icons';
import CollectionDecksTable from '../components/CollectionDecksTable';

const CollectionDecks: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<TabId>('in-progress');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const handleCreateNewDeck = () => {
    navigate('/decks/new/data');
  };

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const handleTabChange = (newTabId: TabId) => {
    setSelectedTab(newTabId);
  };

  return (
    <div className="collection-decks">
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
            intent="primary"
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
      <div className="collection-decks-content" style={{ padding: '20px' }}>
        <H3>Collection Decks</H3>
        
        {/* Action Buttons */}
        <Card className="bp4-margin-bottom">
          <H5>Actions</H5>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button
              icon={IconNames.NEW_OBJECT}
              text="Create New Deck"
              intent="success"
              onClick={handleCreateNewDeck}
              large
            />
          </div>
        </Card>

        {/* Date Filters */}
        <Card className="bp4-margin-bottom">
          <H5>Date Range Filter</H5>
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
                  <H5>In Progress Collection Decks</H5>
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
                  <H5>Completed Collection Decks</H5>
                  <Divider className="bp4-margin-bottom" />
                  <CollectionDecksTable 
                    type="completed"
                    startDate={startDate}
                    endDate={endDate}
                  />
                </div>
              }
            />
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default CollectionDecks;
