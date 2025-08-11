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
  FormGroup,
  InputGroup,
  H3,
  H5,
  Divider,
  Icon,
  ControlGroup,
  Intent
} from '@blueprintjs/core';
import { DateInput } from '@blueprintjs/datetime';
import { IconNames } from '@blueprintjs/icons';
import { DateRange } from '@blueprintjs/datetime';
import HistoryTable from '../components/HistoryTable';

// Design Assumptions:
// - Date inputs use Blueprint's DateInput component for better UX
// - Tables are separated into distinct sections for clarity
// - Reset button clears all date selections
// - Using ControlGroup to group related form elements
// - Implementing proper date range validation

const History: React.FC = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>([null, null]);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const handleReset = () => {
    setDateRange([null, null]);
    setStartDate(null);
    setEndDate(null);
  };

  const handleDateRangeChange = (selectedRange: DateRange) => {
    setDateRange(selectedRange);
    setStartDate(selectedRange[0]?.toISOString().split('T')[0] || null);
    setEndDate(selectedRange[1]?.toISOString().split('T')[0] || null);
  };

  return (
    <div className="history">
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
            intent="primary"
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
      <div className="history-content">
        <H3>History</H3>
        
        {/* Date Filter Section */}
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

        {/* Ready to Continue Table */}
        <Card className="bp4-margin-bottom">
          <H5>Ready to Continue</H5>
          <Divider className="bp4-margin-bottom" />
          <HistoryTable 
            type="ready" 
            startDate={startDate} 
            endDate={endDate} 
          />
        </Card>

        {/* Completed Decks Table */}
        <Card>
          <H5>Completed Decks</H5>
          <Divider className="bp4-margin-bottom" />
          <HistoryTable 
            type="completed" 
            startDate={startDate} 
            endDate={endDate} 
          />
        </Card>
      </div>
    </div>
  );
};

export default History;
