/**
 * Override Justification Form Component
 *
 * Phase 1 Implementation: Story 1.2 - Structured Override Justification
 * Evidence-validated through live Playwright testing and strategic round table
 *
 * Key Features:
 * - Structured category dropdown (5-6 validated categories)
 * - Required justification text (50 character minimum)
 * - Conditional additional context for "Other" category
 * - Real-time validation with helpful error messages
 * - Character counter for user guidance
 *
 * Priority: HIGH - Critical gap (0 justification inputs detected in current app)
 * Complexity: LOW
 * Business Value: HIGHEST (operator communication clarity)
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  FormGroup,
  HTMLSelect,
  TextArea,
  Intent,
  Callout,
  Card,
  Icon,
  ProgressBar,
  Tag
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import {
  OverrideJustificationCategory,
  OverrideJustification,
  SiteId,
  getOverrideCategoryLabel,
  validateOverrideJustification,
  createISODateString
} from '../types/collectionOpportunities';
import './OverrideJustificationForm.css';

export interface OverrideJustificationFormProps {
  originalSiteId: SiteId;
  originalSiteName: string;
  alternativeSiteId: SiteId;
  alternativeSiteName: string;
  onJustificationChange: (justification: Partial<OverrideJustification>, isValid: boolean) => void;
  userId: string;
  userName?: string;
  disabled?: boolean;
}

const MIN_REASON_LENGTH = 50;

export const OverrideJustificationForm: React.FC<OverrideJustificationFormProps> = ({
  originalSiteId,
  originalSiteName,
  alternativeSiteId,
  alternativeSiteName,
  onJustificationChange,
  userId,
  userName,
  disabled = false
}) => {
  const [category, setCategory] = useState<OverrideJustificationCategory | ''>('');
  const [reason, setReason] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');

  // Validation state
  const validation = useMemo(() => {
    if (!category || !reason) {
      return { valid: false, errors: [] };
    }

    const justification: Partial<OverrideJustification> = {
      category,
      reason,
      additionalContext,
      originalSiteId,
      alternativeSiteId,
      userId,
      userName,
      timestamp: createISODateString(new Date())
    };

    return validateOverrideJustification(justification);
  }, [category, reason, additionalContext, originalSiteId, alternativeSiteId, userId, userName]);

  // Character count metrics
  const reasonLength = reason.trim().length;
  const reasonProgress = Math.min((reasonLength / MIN_REASON_LENGTH) * 100, 100);
  const reasonIsValid = reasonLength >= MIN_REASON_LENGTH;

  // Update parent with justification changes
  const updateJustification = useCallback(() => {
    if (!category) return;

    const justification: Partial<OverrideJustification> = {
      category,
      reason,
      additionalContext: category === 'other' ? additionalContext : undefined,
      originalSiteId,
      alternativeSiteId,
      userId,
      userName,
      timestamp: createISODateString(new Date())
    };

    onJustificationChange(justification, validation.valid);
  }, [category, reason, additionalContext, validation.valid, originalSiteId, alternativeSiteId, userId, userName, onJustificationChange]);

  // Handle category change
  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value as OverrideJustificationCategory | '';
    setCategory(newCategory);

    // Auto-clear additional context if switching away from "other"
    if (newCategory !== 'other' && additionalContext) {
      setAdditionalContext('');
    }
  }, [additionalContext]);

  // Handle reason change
  const handleReasonChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReason(e.target.value);
  }, []);

  // Handle additional context change
  const handleAdditionalContextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAdditionalContext(e.target.value);
  }, []);

  // Trigger update whenever validation or inputs change
  React.useEffect(() => {
    updateJustification();
  }, [updateJustification]);

  // Category options
  const categoryOptions: Array<{ value: OverrideJustificationCategory | ''; label: string }> = [
    { value: '', label: 'Select override reason category...' },
    { value: 'weather_environmental', label: getOverrideCategoryLabel('weather_environmental') },
    { value: 'equipment_limitations', label: getOverrideCategoryLabel('equipment_limitations') },
    { value: 'operational_priority', label: getOverrideCategoryLabel('operational_priority') },
    { value: 'schedule_optimization', label: getOverrideCategoryLabel('schedule_optimization') },
    { value: 'customer_request', label: getOverrideCategoryLabel('customer_request') },
    { value: 'other', label: getOverrideCategoryLabel('other') }
  ];

  return (
    <Card className="override-justification-form" elevation={1}>
      <div className="form-header">
        <Icon icon={IconNames.EDIT} size={16} />
        <h4>Override Justification</h4>
        <Tag intent={validation.valid ? Intent.SUCCESS : Intent.WARNING} minimal>
          {validation.valid ? 'Complete' : 'Required'}
        </Tag>
      </div>

      {/* Context: What's being overridden */}
      <Callout intent={Intent.PRIMARY} className="override-context">
        <div className="site-comparison">
          <div className="site-info original">
            <Icon icon={IconNames.ENDORSED} size={12} />
            <span className="site-label">System Recommendation:</span>
            <strong>{originalSiteName}</strong>
          </div>
          <Icon icon={IconNames.ARROW_RIGHT} size={16} className="arrow" />
          <div className="site-info alternative">
            <Icon icon={IconNames.HAND} size={12} />
            <span className="site-label">Your Selection:</span>
            <strong>{alternativeSiteName}</strong>
          </div>
        </div>
      </Callout>

      {/* Category Selection */}
      <FormGroup
        label="Override Category"
        labelInfo="(required)"
        helperText="Select the primary reason for overriding the system recommendation"
        intent={!category && reason ? Intent.WARNING : Intent.NONE}
      >
        <HTMLSelect
          fill
          value={category}
          onChange={handleCategoryChange}
          disabled={disabled}
          options={categoryOptions}
          intent={!category && reason ? Intent.WARNING : Intent.NONE}
        />
      </FormGroup>

      {/* Detailed Explanation */}
      <FormGroup
        label="Detailed Explanation"
        labelInfo="(required, minimum 50 characters)"
        helperText="Provide specific details about why this override is necessary. This will be visible to operators."
        intent={reason && !reasonIsValid ? Intent.WARNING : Intent.NONE}
      >
        <TextArea
          fill
          rows={4}
          value={reason}
          onChange={handleReasonChange}
          disabled={disabled}
          intent={reason && !reasonIsValid ? Intent.WARNING : Intent.NONE}
          placeholder="Example: Heavy precipitation forecast at recommended site would interfere with signal quality. Alternative site has clear weather window and sufficient elevation angle for collection."
          className="justification-textarea"
        />

        {/* Character counter and progress */}
        <div className="character-counter">
          <div className="counter-text">
            <span className={reasonIsValid ? 'text-success' : 'text-muted'}>
              {reasonLength} / {MIN_REASON_LENGTH} characters
            </span>
            {reasonIsValid && <Icon icon={IconNames.TICK} size={12} intent={Intent.SUCCESS} />}
          </div>
          <ProgressBar
            value={reasonProgress / 100}
            intent={reasonIsValid ? Intent.SUCCESS : reasonLength > 0 ? Intent.WARNING : Intent.NONE}
            stripes={!reasonIsValid}
            animate={!reasonIsValid}
          />
        </div>
      </FormGroup>

      {/* Additional Context (conditional for "Other" category) */}
      {category === 'other' && (
        <FormGroup
          label="Additional Context"
          labelInfo="(required for 'Other' category)"
          helperText="Provide more specific information since 'Other' was selected"
          intent={!additionalContext ? Intent.WARNING : Intent.NONE}
        >
          <TextArea
            fill
            rows={3}
            value={additionalContext}
            onChange={handleAdditionalContextChange}
            disabled={disabled}
            intent={!additionalContext ? Intent.WARNING : Intent.NONE}
            placeholder="Describe the specific circumstances that don't fit the standard categories..."
          />
        </FormGroup>
      )}

      {/* Validation Errors */}
      {validation.errors.length > 0 && (
        <Callout intent={Intent.DANGER} icon={IconNames.ERROR} className="validation-errors">
          <strong>Please address the following issues:</strong>
          <ul>
            {validation.errors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </Callout>
      )}

      {/* Success Indicator */}
      {validation.valid && (
        <Callout intent={Intent.SUCCESS} icon={IconNames.TICK_CIRCLE} className="validation-success">
          Override justification is complete and will be included in operator tasking.
        </Callout>
      )}

      {/* Operator Preview */}
      {validation.valid && category && reason && (
        <Callout intent={Intent.PRIMARY} icon={IconNames.EYE_OPEN} className="operator-preview">
          <strong>Operator will see:</strong>
          <div className="preview-text">
            <Tag intent={Intent.WARNING} large>OVERRIDE</Tag>
            {getOverrideCategoryLabel(category)} - {reason.substring(0, 100)}{reason.length > 100 && '...'}
          </div>
        </Callout>
      )}
    </Card>
  );
};

export default OverrideJustificationForm;
