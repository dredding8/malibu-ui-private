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
  Tag
} from '@blueprintjs/core';
import { DateInput } from '@blueprintjs/datetime';
import { IconNames } from '@blueprintjs/icons';

interface Step1InputDataProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onCancel: () => void;
}

const Step1InputData: React.FC<Step1InputDataProps> = ({ 
  data, 
  onUpdate, 
  onNext, 
  onCancel 
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (section: string, field: string, value: any) => {
    onUpdate({
      [section]: {
        ...data[section],
        [field]: value
      }
    });
    // Clear error when user starts typing
    if (errors[`${section}.${field}`]) {
      setErrors(prev => ({ ...prev, [`${section}.${field}`]: '' }));
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
      <H5>Step 1: Input Data</H5>
      <Divider className="bp4-margin-bottom" />

      {/* Tasking Window */}
      <Card className="bp4-margin-bottom">
        <H5>Tasking Window</H5>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
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
            />
          </FormGroup>
        </div>
      </Card>

      {/* TLE Data */}
      <Card className="bp4-margin-bottom">
        <H5>TLE Data</H5>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                      <FormGroup 
              label="Data Source" 
              labelFor="tle-source"
              intent={errors['tleData.source'] ? Intent.DANGER : Intent.NONE}
              helperText={errors['tleData.source']}
            >
              <HTMLSelect
                id="tle-source"
                value={data.tleData.source}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('tleData', 'source', e.currentTarget.value)}
                fill
              >
                <option value="">Select source...</option>
                <option value="UDL">UDL</option>
                <option value="Imported File">Imported File</option>
                <option value="Manual Entry">Manual Entry</option>
              </HTMLSelect>
            </FormGroup>
          <div style={{ display: 'flex', alignItems: 'end', gap: '10px' }}>
            <Button
              icon={IconNames.DOWNLOAD}
              text="Load from UDL"
              onClick={handleLoadFromUDL}
              loading={isLoading}
              disabled={isLoading}
            />
            <Button
              icon={IconNames.UPLOAD}
              text="Import File"
              onClick={handleImportTLE}
              disabled={isLoading}
            />
          </div>
        </div>
        <FormGroup label="TLE Data">
          <TextArea
            value={data.tleData.data}
            onChange={(e) => handleInputChange('tleData', 'data', e.target.value)}
            placeholder="TLE data will appear here..."
            rows={6}
            fill
          />
        </FormGroup>
      </Card>

      {/* Unavailable Sites */}
      <Card className="bp4-margin-bottom">
        <H5>Unavailable Sites</H5>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
          <FormGroup label="Data Source">
            <HTMLSelect
              value={data.unavailableSites.source}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('unavailableSites', 'source', e.currentTarget.value)}
              fill
            >
              <option value="">Select source...</option>
              <option value="BLUESTAT">BLUESTAT</option>
              <option value="Manual Entry">Manual Entry</option>
            </HTMLSelect>
          </FormGroup>
          <div style={{ display: 'flex', alignItems: 'end', gap: '10px' }}>
            <Button
              icon={IconNames.DOWNLOAD}
              text="Load from BLUESTAT"
              onClick={handleLoadFromBLUESTAT}
              loading={isLoading}
              disabled={isLoading}
            />
            <Button
              icon={IconNames.EDIT}
              text="Manual Entry"
              onClick={handleManualEntry}
              disabled={isLoading}
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
        />
        <Button
          text="Next"
          intent={Intent.PRIMARY}
          onClick={handleNext}
        />
      </div>

      {isLoading && (
        <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN} className="bp4-margin-top">
          Loading data... Please wait.
        </Callout>
      )}
    </div>
  );
};

export default Step1InputData;
