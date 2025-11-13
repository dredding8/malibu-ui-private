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
  NumericInput,
  Slider,
  MenuItem,
  Popover,
  PopoverInteractionKind,
  Tabs,
  Tab,
  Tag,
  Text
} from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import { DateInput } from '@blueprintjs/datetime';
import { IconNames } from '@blueprintjs/icons';

interface CollectionParametersFormProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onCancel: () => void;
}

// TLE Data sources
const TLE_SOURCES = [
  { value: 'UDL', label: 'UDL', description: 'Unified Data Library' },
  { value: 'Imported File', label: 'Imported File', description: 'Upload your own TLE file' },
  { value: 'Manual Entry', label: 'Manual Entry', description: 'Enter TLE data manually' }
];

// Unavailable sites sources
const SITES_SOURCES = [
  { value: 'BLUESTAT', label: 'BLUESTAT', description: 'Blue Force Tracking Status System' },
  { value: 'Manual Entry', label: 'Manual Entry', description: 'Enter sites manually' }
];

// Mock sites data
const ALL_SITES = [
  { id: 'THU', name: 'Thule', minElevation: 5 },
  { id: 'FYL', name: 'Fylingdales', minElevation: 5 },
  { id: 'ASC', name: 'Ascension Island', minElevation: 10 },
  { id: 'CLR', name: 'Clear Space Force Station', minElevation: 15 },
  { id: 'HOLT', name: 'Holt', minElevation: 20 },
  { id: 'PPW', name: 'Pine Gap', minElevation: 25 },
  { id: 'PPE', name: 'Pearce', minElevation: 30 },
  { id: 'SVAL', name: 'Svalbard', minElevation: 35 },
  { id: 'DIEG', name: 'Diego Garcia', minElevation: 40 },
  { id: 'KAU', name: 'Kwajalein Atoll', minElevation: 45 },
  { id: 'MAUI', name: 'Maui', minElevation: 50 },
  { id: 'GUAM', name: 'Guam', minElevation: 55 },
];

const CollectionParametersForm: React.FC<CollectionParametersFormProps> = ({
  data,
  onUpdate,
  onNext,
  onCancel
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (section: string, field: string, value: any) => {
    if (section === 'deckName') {
      onUpdate({ deckName: value });
    } else if (section === 'parameters') {
      onUpdate({
        parameters: {
          ...data.parameters,
          [field]: value
        }
      });
    } else {
      onUpdate({
        [section]: {
          ...data[section],
          [field]: value
        }
      });
    }
    // Clear errors
    if (errors[`${section}.${field}`] || errors[section] || errors[field]) {
      setErrors(prev => ({
        ...prev,
        [`${section}.${field}`]: '',
        [section]: '',
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Tasking window validation
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

    // TLE data validation
    if (!data.tleData.source) {
      newErrors['tleData.source'] = 'TLE data source is required';
    }

    // Parameters validation
    if (!data.parameters.hardCapacity || data.parameters.hardCapacity <= 0) {
      newErrors.hardCapacity = 'Hard capacity must be greater than 0';
    }
    if (!data.parameters.minDuration || data.parameters.minDuration <= 0) {
      newErrors.minDuration = 'Minimum duration must be greater than 0';
    }
    if (data.parameters.elevation == null || data.parameters.elevation < 0) {
      newErrors.elevation = 'Elevation must be 0 or greater';
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
    setTimeout(() => {
      handleInputChange('tleData', 'source', 'UDL');
      handleInputChange('tleData', 'data', 'Sample TLE data loaded from UDL...');
      setIsLoading(false);
    }, 2000);
  };

  const handleLoadFromBLUESTAT = () => {
    setIsLoading(true);
    setTimeout(() => {
      handleInputChange('unavailableSites', 'source', 'BLUESTAT');
      handleInputChange('unavailableSites', 'sites', ['Site A', 'Site B', 'Site C']);
      setIsLoading(false);
    }, 2000);
  };

  const handleImportTLE = () => {
    handleInputChange('tleData', 'source', 'Imported File');
    handleInputChange('tleData', 'data', 'Imported TLE data...');
  };

  const handleManualEntry = () => {
    handleInputChange('unavailableSites', 'source', 'Manual Entry');
    handleInputChange('unavailableSites', 'sites', []);
  };

  // Tab 1: Tasking Window
  const TaskingWindowPanel = () => (
    <div style={{ marginTop: '15px' }}>
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
            data-testid="deck-name-input"
          />
        </FormGroup>
      </Card>

      {/* Tasking Window */}
      <Card>
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
              data-testid="start-date-input"
            />
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
              data-testid="end-date-input"
            />
          </FormGroup>
        </div>
      </Card>
    </div>
  );

  // Tab 2: Data Sources
  const DataSourcesPanel = () => (
    <div style={{ marginTop: '15px' }}>
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
      <Card>
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
    </div>
  );

  // Tab 3: Parameters
  const ParametersPanel = () => {
    const currentElevation = data.parameters.elevation || 0;
    const availableSites = ALL_SITES.filter(site => site.minElevation <= currentElevation);

    return (
      <div style={{ marginTop: '15px' }}>
        {/* Elevation */}
        <Card className="bp6-margin-bottom">
          <h4>Minimum Elevation</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            <div>
              <FormGroup
                label="Minimum Elevation (degrees)"
                labelFor="elevation"
                intent={errors.elevation ? Intent.DANGER : Intent.NONE}
                helperText={errors.elevation || "Minimum elevation angle for collections"}
              >
                <div style={{ padding: '10px 20px 10px 10px' }}>
                  <Slider
                    min={0}
                    max={90}
                    stepSize={1}
                    labelStepSize={15}
                    value={currentElevation}
                    onChange={(value) => handleInputChange('parameters', 'elevation', value)}
                    labelRenderer={(value) => `${value}°`}
                  />
                </div>
                <InputGroup
                  value={currentElevation}
                  onChange={(e) => handleInputChange('parameters', 'elevation', parseFloat(e.target.value) || 0)}
                  placeholder="Enter elevation angle..."
                  rightElement={<span>degrees</span>}
                  intent={errors.elevation ? Intent.DANGER : Intent.NONE}
                  aria-label="Elevation angle input"
                  data-testid="elevation-input"
                />
              </FormGroup>
            </div>
            <div>
              <Card elevation={1}>
                <H5>Affected Sites</H5>
                <Text><strong>{availableSites.length} of {ALL_SITES.length}</strong> sites available</Text>
                <Divider style={{ margin: '10px 0' }}/>
                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {ALL_SITES.map(site => (
                    <Tag
                      key={site.id}
                      intent={site.minElevation <= currentElevation ? Intent.SUCCESS : Intent.NONE}
                      minimal={site.minElevation > currentElevation}
                      style={{ opacity: site.minElevation > currentElevation ? 0.5 : 1 }}
                    >
                      {site.name} {site.minElevation > currentElevation ? `(>${currentElevation}°)` : ''}
                    </Tag>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </Card>

        {/* Hard Capacity */}
        <Card className="bp6-margin-bottom">
          <h4>Hard Capacity</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <FormGroup
                label="Hard Capacity"
                labelFor="hard-capacity"
                intent={errors.hardCapacity ? Intent.DANGER : Intent.NONE}
                helperText={errors.hardCapacity || "Maximum number of simultaneous collections"}
              >
                <NumericInput
                  id="hard-capacity"
                  value={data.parameters.hardCapacity}
                  onValueChange={(value) => handleInputChange('parameters', 'hardCapacity', value)}
                  min={1}
                  max={100}
                  intent={errors.hardCapacity ? Intent.DANGER : Intent.NONE}
                  fill
                  data-testid="hard-capacity-input"
                />
              </FormGroup>
            </div>
            <div>
              <Card elevation={1}>
                <H5>Sensor Capacity Information</H5>
                <ul style={{ marginLeft: '20px', fontSize: '14px', lineHeight: '1.6' }}>
                  <li>Wideband Collection: 8 simultaneous channels</li>
                  <li>Narrowband Collection: 16 simultaneous channels</li>
                  <li>Imagery Collection: 4 simultaneous collections</li>
                  <li>Signals Collection: 12 simultaneous collections</li>
                </ul>
              </Card>
            </div>
          </div>
        </Card>

        {/* Min Duration */}
        <Card>
          <h4>Minimum Duration</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <FormGroup
                label="Minimum Duration (minutes)"
                labelFor="min-duration"
                intent={errors.minDuration ? Intent.DANGER : Intent.NONE}
                helperText={errors.minDuration || "Minimum collection duration"}
              >
                <NumericInput
                  id="min-duration"
                  value={data.parameters.minDuration}
                  onValueChange={(value) => handleInputChange('parameters', 'minDuration', value)}
                  min={1}
                  max={1440}
                  intent={errors.minDuration ? Intent.DANGER : Intent.NONE}
                  fill
                  data-testid="min-duration-input"
                />
              </FormGroup>
            </div>
            <div>
              <Card elevation={1}>
                <H5>Duration Guidance</H5>
                <Text>
                  <p><strong>Shorter Durations (&lt; 5 min):</strong><br/>
                  May result in a higher number of total collections, but each may be less complete. Good for rapid, wide-net surveys.</p>
                  <p><strong>Longer Durations (&gt; 15 min):</strong><br/>
                  Results in fewer, but more thorough, collections. Better for detailed analysis of specific targets.</p>
                </Text>
              </Card>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div>
      <h3 id="step-heading">Step 1: Collection Parameters</h3>
      <Divider className="bp6-margin-bottom" />

      <Card>
        <Tabs id="CollectionParametersTabs" defaultSelectedTabId="tasking" renderActiveTabPanelOnly={true}>
          <Tab id="tasking" title="Tasking Window" panel={<TaskingWindowPanel />} />
          <Tab id="data-sources" title="Data Sources" panel={<DataSourcesPanel />} />
          <Tab id="parameters" title="Parameters" panel={<ParametersPanel />} />
        </Tabs>
      </Card>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
        <Button
          text="Cancel"
          onClick={onCancel}
          data-testid="cancel-button"
        />
        <Button
          text="Next"
          intent={Intent.PRIMARY}
          onClick={handleNext}
          rightIcon={IconNames.ARROW_RIGHT}
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

export default CollectionParametersForm;
