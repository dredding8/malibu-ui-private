import React, { useState } from 'react';
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
  Checkbox
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

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

  const handleInstructionsChange = (value: string) => {
    setInstructions(value);
    onUpdate({ instructions: value });
  };

  const handleFinish = () => {
    if (!confirmSave) {
      setConfirmSave(true);
      return;
    }

    setIsSaving(true);
    // Simulate saving the collection deck
    setTimeout(() => {
      setIsSaving(false);
      onFinish();
    }, 2000);
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
    <div>
      <H5>Step 4: Special Instructions</H5>
      <Divider className="bp4-margin-bottom" />

      {/* Final Summary */}
      <Card className="bp4-margin-bottom">
        <H5>Collection Deck Summary</H5>
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
        }}>
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
      <Card className="bp4-margin-bottom">
        <H5>Special Instructions</H5>
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
            rows={8}
            fill
          />
        </FormGroup>
        
        <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
          <p><strong>Common Instructions:</strong></p>
          <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
            <li>Priority handling for specific SCCs</li>
            <li>Special coordination requirements</li>
            <li>Quality control instructions</li>
            <li>Reporting requirements</li>
            <li>Emergency contact information</li>
          </ul>
        </div>
      </Card>

      {/* Confirmation */}
      {confirmSave && (
        <Card className="bp4-margin-bottom">
          <H5>Confirm Collection Deck Creation</H5>
          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <p>You are about to create a collection deck with the following specifications:</p>
            <ul style={{ marginLeft: '20px' }}>
              <li><strong>{summary.count} collection opportunities</strong> across {summary.uniqueSites} sites</li>
              <li><strong>{summary.totalDuration} total minutes</strong> of collection time</li>
              <li><strong>{summary.uniqueSCCs} unique SCCs</strong> to be collected</li>
              <li>Tasking window: <strong>{data.taskingWindow.startDate} to {data.taskingWindow.endDate}</strong></li>
            </ul>
            <p>This action will create a new collection deck that can be managed from the Collection Decks page.</p>
          </div>
        </Card>
      )}

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
          text={confirmSave ? "Confirm & Create Deck" : "Finish"}
          intent={Intent.SUCCESS}
          loading={isSaving}
          onClick={handleFinish}
        />
      </div>

      {isSaving && (
        <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN} className="bp4-margin-top">
          Creating collection deck... Please wait.
        </Callout>
      )}

      {summary.count === 0 && (
        <Callout intent={Intent.WARNING} icon={IconNames.WARNING_SIGN} className="bp4-margin-top">
          No matches were selected. Please go back to Step 3 and select at least one match.
        </Callout>
      )}
    </div>
  );
};

export default Step4SpecialInstructions;
