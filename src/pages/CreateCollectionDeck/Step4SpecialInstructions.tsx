import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  H5,
  Divider,
  Button,
  Intent,
  Card,
  Callout,
  TextArea,
  FormGroup,
  Tag,
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { useBackgroundProcessing } from '../../hooks/useBackgroundProcessing';

interface Step4SpecialInstructionsProps {
  data: any;
  onUpdate: (data: any) => void;
  onFinish: () => void;
  onBack: () => void;
  onCancel: () => void;
}

const Step4SpecialInstructions: React.FC<Step4SpecialInstructionsProps> = ({ 
  data, 
  onUpdate, 
  onFinish, 
  onBack, 
  onCancel 
}) => {
  const [instructions, setInstructions] = useState(data.instructions || '');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const { startProcessing } = useBackgroundProcessing();
  const navigate = useNavigate();

  const handleInstructionsChange = (value: string) => {
    setInstructions(value);
    onUpdate({ instructions: value });
  };

  const handleFinish = async () => {
    if (!confirmSave) {
      setConfirmSave(true);
      return;
    }

    setIsSaving(true);
    try {
      // Start the background processing job
      await startProcessing(data);
    } finally {
      setIsSaving(false);
    }
  };

  const getSelectedMatchesSummary = () => {
    const matches = data.matches || [];
    const totalDuration = matches.reduce((sum: number, match: any) => sum + match.duration, 0);
    const uniqueSCCs = new Set(matches.map((match: any) => match.sccNumber));
    const uniqueSites = new Set(matches.map((match: any) => match.site));

    return {
      count: matches.length,
      totalDuration,
      uniqueSCCs: uniqueSCCs.size,
      uniqueSites: uniqueSites.size
    };
  };

  const summary = getSelectedMatchesSummary();

  return (
    <div data-testid="step4-container">
      <h3 id="step-heading" data-testid="step4-heading">Step 4: Special Instructions & Finish</h3>
      <Divider className="bp4-margin-bottom" data-testid="step4-divider" />

      {/* Final Summary */}
      <Card className="bp4-margin-bottom" data-testid="collection-summary-card">
        <h4 data-testid="collection-summary-heading">Collection Summary</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', fontSize: '14px', marginBottom: '20px' }}>
          <div>
            <strong>Tasking Window:</strong><br />
            {data.taskingWindow.startDate} to {data.taskingWindow.endDate}
          </div>
          <div>
            <strong>Parameters:</strong><br />
            Capacity: {data.parameters.hardCapacity}, Duration: {data.parameters.minDuration}min, Elevation: {data.parameters.elevation}°
          </div>
          <div>
            <strong>Data Sources:</strong><br />
            TLE: {data.tleData.source}, Sites: {data.unavailableSites.sites.length} unavailable
          </div>
        </div>
        
        <div style={{ 
          backgroundColor: '#f5f8fa', 
          padding: '15px', 
          borderRadius: '3px',
          border: '1px solid #d3d8de'
        }} data-testid="selected-matches-summary">
          <strong>Selected Matches:</strong>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', marginTop: '10px' }}>
            <div>
              <Tag intent={Intent.PRIMARY}>{summary.count}</Tag> Total Matches
            </div>
            <div>
              <Tag intent={Intent.SUCCESS}>{summary.totalDuration}</Tag> Total Minutes
            </div>
            <div>
              <Tag intent={Intent.WARNING}>{summary.uniqueSCCs}</Tag> Unique SCCs
            </div>
            <div>
              <Tag intent={Intent.DANGER}>{summary.uniqueSites}</Tag> Collection Sites
            </div>
          </div>
        </div>
      </Card>

      {/* Special Instructions */}
      <Card className="bp4-margin-bottom" data-testid="special-instructions-card">
        <h4 data-testid="special-instructions-heading">Special Instructions</h4>
        <FormGroup 
          label="Instructions for Collection Team"
          labelFor="instructions"
          helperText="Enter any special instructions, notes, or requirements for the collection team"
        >
          <TextArea
            id="instructions"
            value={instructions}
            onChange={(e) => handleInstructionsChange(e.target.value)}
            placeholder="Enter special instructions, notes, or requirements..."
            aria-label="Special instructions for collection team"
            data-testid="special-instructions-textarea"
            rows={8}
            fill
          />
        </FormGroup>
      </Card>

      {/* Confirmation */}
      {confirmSave && (
        <Card className="bp4-margin-bottom" data-testid="confirmation-card">
          <h4 data-testid="confirmation-heading">Confirm & Start Background Processing</h4>
          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <p>You are about to create a collection deck and start the background processing. You will be redirected to the History page to monitor the progress.</p>
          </div>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }} data-testid="step4-navigation-buttons">
        <Button
          text="Cancel"
          onClick={onCancel}
          data-testid="step4-cancel-button"
        />
        <Button
          text="Back"
          onClick={onBack}
          data-testid="step4-back-button"
        />
        <Button
          text={confirmSave ? "Confirm & Start Processing" : "Finish"}
          intent={Intent.SUCCESS}
          loading={isSaving}
          onClick={handleFinish}
          disabled={summary.count === 0}
          data-testid="step4-finish-button"
        />
      </div>

      {summary.count === 0 && (
        <Callout intent={Intent.WARNING} icon={IconNames.WARNING_SIGN} className="bp4-margin-top" data-testid="no-matches-selected-final-warning">
          No matches were selected. Please go back to Step 3 and select at least one match before finishing.
        </Callout>
      )}
    </div>
  );
};

export default Step4SpecialInstructions;
