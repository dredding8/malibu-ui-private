/**
 * Single Ease Question (SEQ) Component
 *
 * Post-task usability survey that asks users to rate task difficulty on a 7-point scale.
 * Based on UX research best practices and Laws of UX principles:
 * - Peak-End Rule: Captures user sentiment at task completion
 * - Cognitive Load: Minimal burden (single question)
 * - Aesthetic-Usability Effect: Visually appealing design encourages completion
 *
 * References:
 * - Sauro, J. & Lewis, J. (2016). Quantifying the User Experience
 * - Nielsen Norman Group: Post-Task Usability Questionnaires
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogBody, DialogFooter, RadioGroup, Radio, Button, Intent, Icon, Classes } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import './SingleEaseQuestion.css';

export interface SEQResponse {
  taskId: string;
  taskName: string;
  rating: number; // 1-7 scale
  timestamp: string;
  sessionId: string;
  userAgent: string;
  optionalComment?: string;
}

export interface SEQProps {
  /** Unique identifier for the task being measured */
  taskId: string;

  /** Human-readable task name (e.g., "Edit opportunity allocation") */
  taskName: string;

  /** Callback when user submits response */
  onResponse: (response: SEQResponse) => void;

  /** Callback when user dismisses without responding */
  onDismiss?: () => void;

  /** Auto-dismiss after X milliseconds (default: 30000 / 30s) */
  autoDismissMs?: number;

  /** Show optional comment field */
  enableComment?: boolean;

  /** Custom session identifier */
  sessionId?: string;
}

const SCALE_LABELS = [
  { value: 1, label: 'Very Difficult' },
  { value: 2, label: 'Difficult' },
  { value: 3, label: 'Somewhat Difficult' },
  { value: 4, label: 'Neither' },
  { value: 5, label: 'Somewhat Easy' },
  { value: 6, label: 'Easy' },
  { value: 7, label: 'Very Easy' },
];

export const SingleEaseQuestion: React.FC<SEQProps> = ({
  taskId,
  taskName,
  onResponse,
  onDismiss,
  autoDismissMs = 30000,
  enableComment = false,
  sessionId,
}) => {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  // Auto-dismiss timer - DISABLED (SEQ is now mandatory)
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     if (onDismiss) {
  //       onDismiss();
  //     }
  //     setIsVisible(false);
  //   }, autoDismissMs);

  //   return () => clearTimeout(timer);
  // }, [autoDismissMs, onDismiss]);

  // Keyboard shortcuts (1-7 number keys)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const num = parseInt(e.key);
      if (num >= 1 && num <= 7) {
        setSelectedRating(num);
        // Auto-submit on keyboard selection for speed
        handleSubmit(num);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [comment, sessionId]);

  const handleSubmit = (rating: number = selectedRating!) => {
    if (rating === null) return;

    const response: SEQResponse = {
      taskId,
      taskName,
      rating,
      timestamp: new Date().toISOString(),
      sessionId: sessionId || `session_${Date.now()}`,
      userAgent: navigator.userAgent,
      optionalComment: comment || undefined,
    };

    onResponse(response);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <Dialog
      isOpen={isVisible}
      onClose={handleDismiss}
      title={
        <div className="seq-dialog-header">
          <Icon icon={IconNames.FEEDBACK} size={20} />
          <span>Quick Feedback: How was this task?</span>
        </div>
      }
      icon={IconNames.CHAT}
      canEscapeKeyClose={true}
      canOutsideClickClose={true}
      className="seq-dialog"
    >
      <DialogBody>
        <div className="seq-task-name" aria-label={`Task: ${taskName}`}>
          <strong>Task:</strong> {taskName}
        </div>

        <p className="seq-instruction">
          Overall, how difficult or easy was this task to complete?
        </p>

        <RadioGroup
          onChange={(e) => setSelectedRating(parseInt((e.target as HTMLInputElement).value))}
          selectedValue={selectedRating}
          className="seq-scale"
          aria-label="Task difficulty rating from 1 (Very Difficult) to 7 (Very Easy)"
        >
          {SCALE_LABELS.map((item) => (
            <Radio
              key={item.value}
              label={
                <span>
                  <strong>{item.value}</strong> - {item.label}
                </span>
              }
              value={item.value}
              className="seq-radio-option"
              aria-label={`${item.value} - ${item.label}`}
            />
          ))}
        </RadioGroup>

        {enableComment && (
          <div className="seq-comment-section">
            <label htmlFor="seq-comment" className="seq-comment-label">
              Additional comments (optional):
            </label>
            <textarea
              id="seq-comment"
              className={`${Classes.INPUT} ${Classes.FILL}`}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Any thoughts about this task?"
              rows={2}
              aria-label="Optional comment about task difficulty"
            />
          </div>
        )}

        <div className="seq-help-text" aria-live="polite">
          <Icon icon={IconNames.KEY_COMMAND} size={12} />
          <small>
            Quick response: Press 1-7 on your keyboard | ESC to skip
          </small>
        </div>
      </DialogBody>

      <DialogFooter
        actions={
          <>
            <Button
              variant="minimal"
              onClick={handleDismiss}
              aria-label="Dismiss survey"
              icon={IconNames.CROSS}
            >
              Maybe Later
            </Button>
            <Button
              intent={Intent.SUCCESS}
              onClick={() => handleSubmit()}
              disabled={selectedRating === null}
              aria-label="Submit rating"
              icon={IconNames.TICK}
            >
              Submit Feedback
            </Button>
          </>
        }
      />
    </Dialog>
  );
};

export default SingleEaseQuestion;
