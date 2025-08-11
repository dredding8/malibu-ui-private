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
  H3,
  H5,
  Divider,
  Callout,
  Intent,
  ControlGroup,
  HTMLSelect
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import SCCsTable from '../components/SCCsTable';

const SCCs: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFunction, setFilterFunction] = useState<string>('');
  const [filterOrbit, setFilterOrbit] = useState<string>('');
  const [filterClassification, setFilterClassification] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshList = () => {
    setIsRefreshing(true);
    // Simulate API call to refresh SCC data
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  const handleAddSCC = () => {
    navigate('/sccs/new');
  };

  return (
    <div className="sccs">
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
            intent="primary"
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
      <div className="sccs-content" style={{ padding: '20px' }}>
        <H3>SCCs Master List</H3>
        
        {/* Search and Filter Section */}
        <Card className="bp4-margin-bottom">
          <H5>Search and Filter</H5>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <FormGroup label="Search SCCs">
              <InputGroup
                placeholder="Search by SCC number, function, etc..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={IconNames.SEARCH}
              />
            </FormGroup>
            <FormGroup label="Function">
              <HTMLSelect
                value={filterFunction}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterFunction(e.currentTarget.value)}
                fill
              >
                <option value="">All Functions</option>
                <option value="ISR">ISR</option>
                <option value="COMM">COMM</option>
                <option value="NAV">NAV</option>
              </HTMLSelect>
            </FormGroup>
            <FormGroup label="Orbit">
              <HTMLSelect
                value={filterOrbit}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterOrbit(e.currentTarget.value)}
                fill
              >
                <option value="">All Orbits</option>
                <option value="LEO">LEO</option>
                <option value="MEO">MEO</option>
                <option value="GEO">GEO</option>
              </HTMLSelect>
            </FormGroup>
            <FormGroup label="Classification">
              <HTMLSelect
                value={filterClassification}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterClassification(e.currentTarget.value)}
                fill
              >
                <option value="">All Classifications</option>
                <option value="S//REL FVEY">S//REL FVEY</option>
                <option value="S//NF">S//NF</option>
                <option value="U">U</option>
              </HTMLSelect>
            </FormGroup>
          </div>
        </Card>

        {/* Action Buttons */}
        <Card className="bp4-margin-bottom">
          <H5>Actions</H5>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button
              icon={IconNames.PLUS}
              text="Add SCC"
              intent="success"
              onClick={handleAddSCC}
              large
            />
            <Button
              icon={IconNames.REFRESH}
              text="Refresh List"
              intent="primary"
              loading={isRefreshing}
              onClick={handleRefreshList}
              large
            />
          </div>
        </Card>

        {/* Status Message */}
        {isRefreshing && (
          <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN} className="bp4-margin-bottom">
            Refreshing SCC data... Please wait.
          </Callout>
        )}

        {/* SCCs Table */}
        <Card>
          <H5>SCCs Master List</H5>
          <Divider className="bp4-margin-bottom" />
          <SCCsTable 
            searchQuery={searchQuery}
            filterFunction={filterFunction}
            filterOrbit={filterOrbit}
            filterClassification={filterClassification}
          />
        </Card>
      </div>
    </div>
  );
};

export default SCCs;
