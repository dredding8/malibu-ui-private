import React, { useState } from 'react';
import {
  H5,
  Divider,
  FormGroup,
  InputGroup,
  Button,
  Intent,
  Card,
  Callout,
  NumericInput,
  Slider
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

interface Step2ReviewParametersProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

const Step2ReviewParameters: React.FC<Step2ReviewParametersProps> = ({ 
  data, 
  onUpdate, 
  onNext, 
  onBack, 
  onCancel 
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const handleParameterChange = (field: string, value: any) => {
    onUpdate({
      parameters: {
        ...data.parameters,
        [field]: value
      }
    });
    // Clear error when user starts typing
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
    if (!data.parameters.elevation || data.parameters.elevation < 0) {
      newErrors.elevation = 'Elevation must be 0 or greater';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      setIsProcessing(true);
      // Simulate processing parameters
      setTimeout(() => {
        setIsProcessing(false);
        onNext();
      }, 2000);
    }
  };

  return (
    <div>
      <H5>Step 2: Review Parameters</H5>
      <Divider className="bp4-margin-bottom" />

      {/* Summary of Step 1 Data */}
      <Card className="bp4-margin-bottom">
        <H5>Input Data Summary</H5>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '14px' }}>
          <div>
            <strong>Tasking Window:</strong><br />
            Start: {data.taskingWindow.startDate || 'Not set'}<br />
            End: {data.taskingWindow.endDate || 'Not set'}
          </div>
          <div>
            <strong>TLE Data Source:</strong> {data.tleData.source || 'Not set'}<br />
            <strong>Unavailable Sites:</strong> {data.unavailableSites.sites.length} sites
          </div>
        </div>
      </Card>

      {/* Matching Parameters */}
      <Card className="bp4-margin-bottom">
        <H5>Matching Parameters and Sensor Capacity</H5>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
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
            />
          </FormGroup>

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
            />
          </FormGroup>
        </div>

        <FormGroup 
          label="Minimum Elevation (degrees)" 
          labelFor="elevation"
          intent={errors.elevation ? Intent.DANGER : Intent.NONE}
          helperText={errors.elevation || "Minimum elevation angle for collections"}
        >
          <div style={{ padding: '10px 0' }}>
            <Slider
              min={0}
              max={90}
              stepSize={1}
              labelStepSize={15}
              value={data.parameters.elevation || 0}
              onChange={(value) => handleParameterChange('elevation', value)}
              labelRenderer={(value) => `${value}°`}
            />
          </div>
          <InputGroup
            value={data.parameters.elevation || ''}
            onChange={(e) => handleParameterChange('elevation', parseFloat(e.target.value) || 0)}
            placeholder="Enter elevation angle..."
            rightElement={<span>degrees</span>}
            intent={errors.elevation ? Intent.DANGER : Intent.NONE}
          />
        </FormGroup>
      </Card>

      {/* Sensor Capacity Information */}
      <Card className="bp4-margin-bottom">
        <H5>Sensor Capacity Information</H5>
        <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <p><strong>Available Sensors:</strong></p>
          <ul style={{ marginLeft: '20px' }}>
            <li>Wideband Collection: 8 simultaneous channels</li>
            <li>Narrowband Collection: 16 simultaneous channels</li>
            <li>Imagery Collection: 4 simultaneous collections</li>
            <li>Signals Collection: 12 simultaneous collections</li>
          </ul>
          <p><strong>Current Configuration:</strong></p>
          <ul style={{ marginLeft: '20px' }}>
            <li>Hard Capacity: {data.parameters.hardCapacity || 'Not set'} collections</li>
            <li>Minimum Duration: {data.parameters.minDuration || 'Not set'} minutes</li>
            <li>Minimum Elevation: {data.parameters.elevation || 'Not set'} degrees</li>
          </ul>
        </div>
      </Card>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <Button
          text="Cancel"
          onClick={onCancel}
        />
        <Button
          text="Back"
          onClick={onBack}
        />
        <Button
          text="Next"
          intent={Intent.PRIMARY}
          loading={isProcessing}
          onClick={handleNext}
        />
      </div>

      {isProcessing && (
        <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN} className="bp4-margin-top">
          Processing parameters and generating matches... Please wait.
        </Callout>
      )}
    </div>
  );
};

export default Step2ReviewParameters;
