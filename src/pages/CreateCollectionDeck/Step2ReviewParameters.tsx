import React, { useState } from 'react';
import {
  H5,
  Divider,
  FormGroup,
  InputGroup,
  Button,
  Intent,
  Card,
  NumericInput,
  Slider,
  Alert,
  Tabs,
  Tab,
  Tag,
  Text
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { useBackgroundProcessing } from '../../hooks/useBackgroundProcessing';

interface Step2ReviewParametersProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

// Mock data for sites, assuming a real implementation would fetch this
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


const Step2ReviewParameters: React.FC<Step2ReviewParametersProps> = ({ 
  data, 
  onUpdate, 
  onNext, 
  onBack, 
  onCancel 
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showProcessingAlert, setShowProcessingAlert] = useState(false);
  const { startProcessing, isProcessing } = useBackgroundProcessing();

  const handleParameterChange = (field: string, value: any) => {
    onUpdate({
      parameters: {
        ...data.parameters,
        [field]: value
      }
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!data.parameters.hardCapacity || data.parameters.hardCapacity <= 0) {
      newErrors.hardCapacity = 'Hard capacity must be greater than 0';
    }
    if (!data.parameters.minDuration || data.parameters.minDuration <= 0) {
      newErrors.minDuration = 'Minimum duration must be greater than 0';
    }
    // Elevation can be 0, so we check for non-null/undefined
    if (data.parameters.elevation == null || data.parameters.elevation < 0) {
      newErrors.elevation = 'Elevation must be 0 or greater';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      setShowProcessingAlert(true);
    }
  };

  const handleConfirmProcessing = async () => {
    setShowProcessingAlert(false);
    await startProcessing(data);
  };

  const handleCancelProcessing = () => {
    setShowProcessingAlert(false);
  };

  const ElevationPanel = () => {
    const currentElevation = data.parameters.elevation || 0;
    const availableSites = ALL_SITES.filter(site => site.minElevation <= currentElevation);

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '15px' }}>
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
                onChange={(value) => handleParameterChange('elevation', value)}
                labelRenderer={(value) => `${value}°`}
              />
            </div>
            <InputGroup
              value={currentElevation}
              onChange={(e) => handleParameterChange('elevation', parseFloat(e.target.value) || 0)}
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
    );
  };

  const CapacityPanel = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
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
            onValueChange={(value) => handleParameterChange('hardCapacity', value)}
            min={1}
            max={100}
            intent={errors.hardCapacity ? Intent.DANGER : Intent.NONE}
            fill
            data-testid="hard-capacity-input"
          />
        </FormGroup>
      </div>
      <div data-testid="sensor-capacity-info-container">
        <Card elevation={1} data-testid="sensor-capacity-info-card">
          <H5 data-testid="sensor-capacity-info-heading">Sensor Capacity Information</H5>
          <ul style={{ marginLeft: '20px', fontSize: '14px', lineHeight: '1.6' }}>
            <li>Wideband Collection: 8 simultaneous channels</li>
            <li>Narrowband Collection: 16 simultaneous channels</li>
            <li>Imagery Collection: 4 simultaneous collections</li>
            <li>Signals Collection: 12 simultaneous collections</li>
          </ul>
        </Card>
      </div>
    </div>
  );

  const DurationPanel = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
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
            onValueChange={(value) => handleParameterChange('minDuration', value)}
            min={1}
            max={1440}
            intent={errors.minDuration ? Intent.DANGER : Intent.NONE}
            fill
            data-testid="min-duration-input"
          />
        </FormGroup>
      </div>
      <div data-testid="duration-guidance-container">
        <Card elevation={1} data-testid="duration-guidance-card">
          <H5 data-testid="duration-guidance-heading">Duration Guidance</H5>
          <Text>
            <p><strong>Shorter Durations (&lt; 5 min):</strong><br/>
            May result in a higher number of total collections, but each may be less complete. Good for rapid, wide-net surveys.</p>
            <p><strong>Longer Durations (&gt; 15 min):</strong><br/>
            Results in fewer, but more thorough, collections. Better for detailed analysis of specific targets.</p>
          </Text>
        </Card>
      </div>
    </div>
  );

  return (
    <div data-testid="step2-container">
      <h3 id="step-heading" data-testid="step2-heading">Step 2: Review Parameters</h3>
      <Divider className="bp4-margin-bottom" data-testid="step2-divider" />

      {/* Summary of Step 1 Data */}
      <Card className="bp4-margin-bottom" data-testid="step1-data-summary-card">
        <h4 data-testid="input-data-summary-heading">Input Data Summary</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '14px' }}>
          <div>
            <strong>Tasking Window:</strong><br />
            Start: {new Date(data.taskingWindow.startDate).toLocaleDateString() || 'Not set'}<br />
            End: {new Date(data.taskingWindow.endDate).toLocaleDateString() || 'Not set'}
          </div>
          <div>
            <strong>TLE Data Source:</strong> {data.tleData.source || 'Not set'}<br />
            <strong>Unavailable Sites:</strong> {data.unavailableSites.sites.length} sites
          </div>
        </div>
      </Card>

      {/* New Tabbed Interface */}
      <Card data-testid="parameters-tabs-card">
        <Tabs id="ParameterTabs" defaultSelectedTabId="elevation" renderActiveTabPanelOnly={true} data-testid="parameter-tabs">
          <Tab id="elevation" title="Elevation" panel={<ElevationPanel />} data-testid="elevation-tab" />
          <Tab id="capacity" title="Hard Capacity" panel={<CapacityPanel />} data-testid="capacity-tab" />
          <Tab id="duration" title="Min Duration" panel={<DurationPanel />} data-testid="duration-tab" />
        </Tabs>
      </Card>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }} data-testid="step2-navigation-buttons">
        <Button
          text="Cancel"
          onClick={onCancel}
          data-testid="step2-cancel-button"
        />
        <Button
          text="Back"
          onClick={onBack}
          data-testid="step2-back-button"
        />
        <Button
          text="Next"
          intent={Intent.PRIMARY}
          loading={isProcessing}
          onClick={handleNext}
          data-testid="step2-next-button"
        />
      </div>

      {/* Background Processing Confirmation Alert */}
      <Alert
        isOpen={showProcessingAlert}
        onClose={handleCancelProcessing}
        onConfirm={handleConfirmProcessing}
        onCancel={handleCancelProcessing}
        intent={Intent.PRIMARY}
        icon={IconNames.INFO_SIGN}
        cancelButtonText="Continue Editing"
        confirmButtonText="Start Background Processing"
        data-testid="background-processing-alert"
      >
        <div>
          <p style={{ marginBottom: '16px' }}>
            <strong>Background Processing</strong>
          </p>
          <p style={{ marginBottom: '12px' }}>
            Match generation will run in the background and may take up to 1 hour to complete.
          </p>
          <p style={{ marginBottom: '12px' }}>
            You'll be redirected to the History page where you can:
          </p>
          <ul style={{ marginLeft: '20px', marginBottom: '12px' }}>
            <li>Continue working on other tasks</li>
            <li>Monitor the processing status</li>
            <li>Receive a notification when processing completes</li>
          </ul>
          <p style={{ fontSize: '14px', color: '#666' }}>
            <strong>Note:</strong> Your progress will be automatically saved and you can resume the workflow when processing completes.
          </p>
        </div>
      </Alert>
    </div>
  );
};

export default Step2ReviewParameters;