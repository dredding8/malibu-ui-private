import React, { useState } from 'react';
import {
  Button,
  Popover,
  FormGroup,
  TextArea,
  Intent,
  Position,
  Classes
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

interface InlineOverrideButtonProps {
  opportunityId: string;
  onOverride: (opportunityId: string, justification: string) => void;
  minimal?: boolean;
  small?: boolean;
}

/**
 * InlineOverrideButton - Quick override with justification capture
 * Addresses JTBD 2: Correct Suboptimal Plans with Expert Knowledge
 * 
 * This is a lightweight alternative to opening the full ManualOverrideModal
 */
export const InlineOverrideButton: React.FC<InlineOverrideButtonProps> = ({
  opportunityId,
  onOverride,
  minimal = false,
  small = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [justification, setJustification] = useState('');

  const handleSubmit = () => {
    if (justification.trim()) {
      onOverride(opportunityId, justification);
      setJustification('');
      setIsOpen(false);
    }
  };

  const popoverContent = (
    <div style={{ padding: 16, width: 400 }}>
      <h4 className={Classes.HEADING}>Override Site Allocation</h4>
      <FormGroup
        label="Comment"
        labelInfo="(required)"
        helperText="Comment required to override site allocation (Secret Data Only)"
      >
        <TextArea
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          placeholder="Weather forecast and priority mission requirements necessitate alternate site..."
          rows={4}
          style={{ width: '100%' }}
          autoFocus
        />
      </FormGroup>
      <div className={Classes.DIALOG_FOOTER_ACTIONS}>
        <Button onClick={() => setIsOpen(false)}>Cancel</Button>
        <Button
          intent={Intent.PRIMARY}
          onClick={handleSubmit}
          disabled={!justification.trim()}
        >
          Allocate
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      content={popoverContent}
      isOpen={isOpen}
      onInteraction={(nextState) => setIsOpen(nextState)}
      position={Position.LEFT}
    >
      <Button
        icon={IconNames.EDIT}
        text={minimal ? undefined : "Override"}
        intent={Intent.WARNING}
        small={small}
        minimal={minimal}
        title="Override site allocation with comment"
      />
    </Popover>
  );
};

export default InlineOverrideButton;