import React, { useState } from 'react';
import {
  H5,
  Divider,
  FormGroup,
  InputGroup,
  Button,
  Intent,
  TextArea,
  Card,
  Callout,
  ControlGroup,
  HTMLSelect,
  Tag,
  MenuItem,
  Popover,
  PopoverInteractionKind
} from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import { DateInput } from '@blueprintjs/datetime';
import { IconNames } from '@blueprintjs/icons';

interface Step1InputDataProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onCancel: () => void;
}

// TLE Data sources for Select component
const TLE_SOURCES = [
  { value: 'UDL', label: 'UDL', description: 'Unified Data Library' },
  { value: 'Imported File', label: 'Imported File', description: 'Upload your own TLE file' },
  { value: 'Manual Entry', label: 'Manual Entry', description: 'Enter TLE data manually' }
];

// Unavailable sites sources for Select component  
const SITES_SOURCES = [
  { value: 'BLUESTAT', label: 'BLUESTAT', description: 'Blue Force Tracking Status System' },
  { value: 'Manual Entry', label: 'Manual Entry', description: 'Enter sites manually' }
];

const Step1InputData: React.FC<Step1InputDataProps> = ({ 
  data, 
  onUpdate, 
  onNext, 
  onCancel 
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (section: string, field: string, value: any) => {
    if (section === 'deckName') {
      // Handle deck name as a top-level property
      onUpdate({ deckName: value });
    } else {
      onUpdate({
        [section]: {
          ...data[section],
          [field]: value
        }
      });
    }
    // Clear error when user starts typing
    if (errors[`${section}.${field}`] || errors[section]) {
      setErrors(prev => ({ 
        ...prev, 
        [`${section}.${field}`]: '',
        [section]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!data.taskingWindow.startDate) {
      newErrors['taskingWindow.startDate'] = 'Start date is required';
    }
    if (!data.taskingWindow.endDate) {
      newErrors['taskingWindow.endDate'] = 'End date is required';
    }
    if (data.taskingWindow.startDate && data.taskingWindow.endDate) {
      const start = new Date(data.taskingWindow.startDate);
      const end = new Date(data.taskingWindow.endDate);
      if (start >= end) {
        newErrors['taskingWindow.endDate'] = 'End date must be after start date';
      }
    }
    if (!data.tleData.source) {
      newErrors['tleData.source'] = 'TLE data source is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  const handleLoadFromUDL = () => {
    setIsLoading(true);
    // Simulate loading from UDL
    setTimeout(() => {
      handleInputChange('tleData', 'source', 'UDL');
      handleInputChange('tleData', 'data', 'Sample TLE data loaded from UDL...');
      setIsLoading(false);
    }, 2000);
  };

  const handleLoadFromBLUESTAT = () => {
    setIsLoading(true);
    // Simulate loading from BLUESTAT
    setTimeout(() => {
      handleInputChange('unavailableSites', 'source', 'BLUESTAT');
      handleInputChange('unavailableSites', 'sites', ['Site A', 'Site B', 'Site C']);
      setIsLoading(false);
    }, 2000);
  };

  const handleImportTLE = () => {
    // Simulate file import
    handleInputChange('tleData', 'source', 'Imported File');
    handleInputChange('tleData', 'data', 'Imported TLE data...');
  };

  const handleManualEntry = () => {
    handleInputChange('unavailableSites', 'source', 'Manual Entry');
    handleInputChange('unavailableSites', 'sites', []);
  };

  return (
    <div>
      <h3 id="step-heading">Step 1: Input Data</h3>
      <Divider className="bp6-margin-bottom" />

      {/* Deck Name */}
      <Card className="bp6-margin-bottom">
        <h4>Collection Information</h4>
        <FormGroup 
          label={
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Collection Name
              <Popover
                interactionKind={PopoverInteractionKind.HOVER_TARGET_ONLY}
                placement="top"
                content={
                  <div style={{ padding: '10px', maxWidth: '250px' }}>
                    <strong>Collection Name Tips:</strong>
                    <ul style={{ margin: '8px 0 0 16px', padding: '0' }}>
                      <li>Use descriptive names like "ISR-LEO-Q1-2024"</li>
                      <li>Include orbit type, function, or time period</li>
                      <li>Avoid special characters</li>
                    </ul>
                  </div>
                }
              >
                <Button 
                  icon={IconNames.INFO_SIGN} 
                  minimal 
                  small 
                  style={{ padding: '2px' }}
                />
              </Popover>
            </div>
          }
          labelFor="deck-name"
          intent={errors['deckName'] ? Intent.DANGER : Intent.NONE}
          helperText={errors['deckName']}
        >
          <InputGroup
            id="deck-name"
            value={data.deckName || ''}
            onChange={(e) => handleInputChange('deckName', '', e.target.value)}
            placeholder="e.g., ISR-LEO-January-2024"
            aria-label="Collection deck name"
            aria-describedby="deck-name-help"
            data-testid="deck-name-input"
          />
          <div id="deck-name-help" style={{ display: 'none' }}>
            Enter a descriptive name for your collection deck. Include orbit type, function, or time period for clarity.
          </div>
        </FormGroup>
      </Card>

      {/* Tasking Window */}
      <Card className="bp6-margin-bottom">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
          <h4 style={{ margin: 0 }}>Tasking Window</h4>
          <Popover
            interactionKind={PopoverInteractionKind.HOVER_TARGET_ONLY}
            placement="top"
            content={
              <div style={{ padding: '10px', maxWidth: '280px' }}>
                <strong>Tasking Window Guidelines:</strong>
                <ul style={{ margin: '8px 0 0 16px', padding: '0' }}>
                  <li>Select the time period for your collection</li>
                  <li>Longer windows provide more collection opportunities</li>
                  <li>Consider orbital mechanics - LEO satellites have 90-120 min orbits</li>
                  <li>Minimum recommended window: 24 hours</li>
                </ul>
              </div>
            }
          >
            <Button 
              icon={IconNames.INFO_SIGN} 
              minimal 
              small 
              style={{ padding: '2px' }}
            />
          </Popover>
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '20px' 
        }}>
          <FormGroup 
            label="Start Date" 
            labelFor="start-date"
            intent={errors['taskingWindow.startDate'] ? Intent.DANGER : Intent.NONE}
            helperText={errors['taskingWindow.startDate']}
          >
            <DateInput
              value={data.taskingWindow.startDate}
              onChange={(date) => handleInputChange('taskingWindow', 'startDate', date)}
              placeholder="Select start date..."
              canClearSelection
              aria-label="Collection start date"
              aria-describedby="start-date-help"
              data-testid="start-date-input"
            />
            <div id="start-date-help" style={{ display: 'none' }}>
              Select the beginning date for your collection window. Earlier dates provide more planning time.
            </div>
          </FormGroup>
          <FormGroup 
            label="End Date" 
            labelFor="end-date"
            intent={errors['taskingWindow.endDate'] ? Intent.DANGER : Intent.NONE}
            helperText={errors['taskingWindow.endDate']}
          >
            <DateInput
              value={data.taskingWindow.endDate}
              onChange={(date) => handleInputChange('taskingWindow', 'endDate', date)}
              placeholder="Select end date..."
              canClearSelection
              aria-label="Collection end date"
              aria-describedby="end-date-help"
              data-testid="end-date-input"
            />
            <div id="end-date-help" style={{ display: 'none' }}>
              Select the ending date for your collection window. Longer windows typically provide more collection opportunities.
            </div>
          </FormGroup>
        </div>
      </Card>

      {/* TLE Data */}
      <Card className="bp6-margin-bottom">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
          <h4 style={{ margin: 0 }}>TLE Data</h4>
          <Popover
            interactionKind={PopoverInteractionKind.HOVER_TARGET_ONLY}
            placement="top"
            content={
              <div style={{ padding: '10px', maxWidth: '300px' }}>
                <strong>Two-Line Element (TLE) Data:</strong>
                <ul style={{ margin: '8px 0 0 16px', padding: '0' }}>
                  <li><strong>UDL:</strong> Most current official orbital data</li>
                  <li><strong>Imported File:</strong> Upload your own TLE file</li>
                  <li><strong>Manual Entry:</strong> Paste TLE data directly</li>
                </ul>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#666' }}>
                  TLE data determines satellite positions and collection opportunities
                </p>
              </div>
            }
          >
            <Button 
              icon={IconNames.INFO_SIGN} 
              minimal 
              small 
              style={{ padding: '2px' }}
            />
          </Popover>
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px', 
          marginBottom: '15px' 
        }}>
          <FormGroup 
            label="Data Source" 
            labelFor="tle-source"
            intent={errors['tleData.source'] ? Intent.DANGER : Intent.NONE}
            helperText={errors['tleData.source']}
          >
            <Select<typeof TLE_SOURCES[0]>
              items={TLE_SOURCES}
              activeItem={TLE_SOURCES.find(item => item.value === data.tleData.source)}
              onItemSelect={(item) => handleInputChange('tleData', 'source', item.value)}
              itemRenderer={(item, { handleClick, handleFocus, modifiers }) => (
                <MenuItem
                  key={item.value}
                  text={
                    <div>
                      <div>{item.label}</div>
                      <div style={{ fontSize: '12px', color: '#5C7080', marginTop: '2px' }}>
                        {item.description}
                      </div>
                    </div>
                  }
                  onClick={handleClick}
                  onFocus={handleFocus}
                  active={modifiers.active}
                />
              )}
              filterable={false}
              fill
              data-testid="tle-source-select"
            >
              <Button 
                text={data.tleData.source || "Select source..."}
                rightIcon={IconNames.CARET_DOWN}
                fill
                intent={errors['tleData.source'] ? Intent.DANGER : Intent.NONE}
              />
            </Select>
          </FormGroup>
          <div style={{ display: 'flex', alignItems: 'end', gap: '10px' }}>
            <Button
              icon={IconNames.DOWNLOAD}
              text="Load from UDL"
              onClick={handleLoadFromUDL}
              loading={isLoading}
              disabled={isLoading}
              data-testid="load-udl-button"
            />
            <Button
              icon={IconNames.UPLOAD}
              text="Import File"
              onClick={handleImportTLE}
              disabled={isLoading}
              data-testid="import-tle-button"
            />
          </div>
        </div>
        <FormGroup label="TLE Data" labelFor="tle-data-textarea">
          <TextArea
            id="tle-data-textarea"
            value={data.tleData.data}
            onChange={(e) => handleInputChange('tleData', 'data', e.target.value)}
            placeholder="TLE data will appear here..."
            aria-label="Two-line element data"
            rows={6}
            fill
            data-testid="tle-data-textarea"
          />
        </FormGroup>
      </Card>

      {/* Unavailable Sites */}
      <Card className="bp6-margin-bottom">
        <h4>Unavailable Sites</h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px', 
          marginBottom: '15px' 
        }}>
          <FormGroup label="Data Source">
            <Select<typeof SITES_SOURCES[0]>
              items={SITES_SOURCES}
              activeItem={SITES_SOURCES.find(item => item.value === data.unavailableSites.source)}
              onItemSelect={(item) => handleInputChange('unavailableSites', 'source', item.value)}
              itemRenderer={(item, { handleClick, handleFocus, modifiers }) => (
                <MenuItem
                  key={item.value}
                  text={
                    <div>
                      <div>{item.label}</div>
                      <div style={{ fontSize: '12px', color: '#5C7080', marginTop: '2px' }}>
                        {item.description}
                      </div>
                    </div>
                  }
                  onClick={handleClick}
                  onFocus={handleFocus}
                  active={modifiers.active}
                />
              )}
              filterable={false}
              fill
              data-testid="sites-source-select"
            >
              <Button 
                text={data.unavailableSites.source || "Select source..."}
                rightIcon={IconNames.CARET_DOWN}
                fill
              />
            </Select>
          </FormGroup>
          <div style={{ display: 'flex', alignItems: 'end', gap: '10px' }}>
            <Button
              icon={IconNames.DOWNLOAD}
              text="Load from BLUESTAT"
              onClick={handleLoadFromBLUESTAT}
              loading={isLoading}
              disabled={isLoading}
              data-testid="load-bluestat-button"
            />
            <Button
              icon={IconNames.EDIT}
              text="Manual Entry"
              onClick={handleManualEntry}
              disabled={isLoading}
              data-testid="manual-entry-button"
            />
          </div>
        </div>
        <FormGroup label="Unavailable Sites">
          <div style={{ minHeight: '60px', border: '1px solid #ccc', borderRadius: '3px', padding: '10px' }}>
            {data.unavailableSites.sites.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {data.unavailableSites.sites.map((site: string, index: number) => (
                  <Tag key={index} intent={Intent.WARNING}>
                    {site}
                  </Tag>
                ))}
              </div>
            ) : (
              <span style={{ color: '#666', fontStyle: 'italic' }}>
                No unavailable sites specified
              </span>
            )}
          </div>
        </FormGroup>
      </Card>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <Button
          text="Cancel"
          onClick={onCancel}
          data-testid="cancel-button"
        />
        <Button
          text="Next"
          intent={Intent.PRIMARY}
          onClick={handleNext}
          data-testid="next-button"
        />
      </div>

      {isLoading && (
        <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN} className="bp6-margin-top">
          Loading data...
        </Callout>
      )}
    </div>
  );
};

export default Step1InputData;
