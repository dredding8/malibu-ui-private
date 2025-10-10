/**
 * Accessibility Helpers
 *
 * Systematic approach to WCAG 2.1 AA compliance
 * Addresses: 53 unlabeled inputs (98% non-compliance)
 *
 * WCAG Success Criteria:
 * - 1.3.1: Info and Relationships (Level A)
 * - 4.1.2: Name, Role, Value (Level A)
 */

import React from 'react';
import { InputGroup, NumericInput, TextArea, FormGroup } from '@blueprintjs/core';

/**
 * Accessible Input Group
 *
 * Wraps Blueprint InputGroup with proper ARIA labels
 * Ensures screen readers can identify input purpose
 *
 * USAGE:
 * ```tsx
 * <AccessibleInput
 *   label="Search opportunities"
 *   placeholder="Type to search..."
 *   value={searchTerm}
 *   onChange={handleSearch}
 * />
 * ```
 */

interface AccessibleInputProps {
  label: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: 'text' | 'search' | 'email' | 'tel' | 'url';
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
  intent?: 'none' | 'primary' | 'success' | 'warning' | 'danger';
  leftIcon?: string;
  rightElement?: React.ReactNode;
  className?: string;
  id?: string;
}

export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  disabled = false,
  required = false,
  helperText,
  intent = 'none',
  leftIcon,
  rightElement,
  className = '',
  id
}) => {
  // Generate unique ID if not provided
  const inputId = id || `accessible-input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <FormGroup
      label={label}
      labelFor={inputId}
      helperText={helperText}
      intent={intent as any}
      className={className}
    >
      <InputGroup
        id={inputId}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
        disabled={disabled}
        required={required}
        intent={intent as any}
        leftIcon={leftIcon as any}
        rightElement={rightElement}
        aria-label={label}
        aria-required={required}
        aria-invalid={intent === 'danger'}
      />
    </FormGroup>
  );
};

/**
 * Accessible Numeric Input
 *
 * Wraps Blueprint NumericInput with proper labels
 */

interface AccessibleNumericInputProps {
  label: string;
  value?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
  intent?: 'none' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
  id?: string;
}

export const AccessibleNumericInput: React.FC<AccessibleNumericInputProps> = ({
  label,
  value,
  onValueChange,
  min,
  max,
  step = 1,
  disabled = false,
  required = false,
  helperText,
  intent = 'none',
  className = '',
  id
}) => {
  const inputId = id || `accessible-numeric-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <FormGroup
      label={label}
      labelFor={inputId}
      helperText={helperText}
      intent={intent as any}
      className={className}
    >
      <NumericInput
        id={inputId}
        value={value}
        onValueChange={onValueChange}
        min={min}
        max={max}
        stepSize={step}
        disabled={disabled}
        intent={intent as any}
        aria-label={label}
        aria-required={required}
        aria-invalid={intent === 'danger'}
        aria-valuemin={min}
        aria-valuemax={max}
      />
    </FormGroup>
  );
};

/**
 * Accessible Text Area
 *
 * Wraps Blueprint TextArea with proper labels
 */

interface AccessibleTextAreaProps {
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
  intent?: 'none' | 'primary' | 'success' | 'warning' | 'danger';
  maxLength?: number;
  className?: string;
  id?: string;
}

export const AccessibleTextArea: React.FC<AccessibleTextAreaProps> = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled = false,
  required = false,
  helperText,
  intent = 'none',
  maxLength,
  className = '',
  id
}) => {
  const inputId = id || `accessible-textarea-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const characterCount = value?.length || 0;
  const showCount = maxLength && characterCount > maxLength * 0.8;

  return (
    <FormGroup
      label={label}
      labelFor={inputId}
      helperText={
        showCount
          ? `${characterCount}/${maxLength} characters ${helperText ? `• ${helperText}` : ''}`
          : helperText
      }
      intent={intent as any}
      className={className}
    >
      <TextArea
        id={inputId}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        intent={intent as any}
        maxLength={maxLength}
        aria-label={label}
        aria-required={required}
        aria-invalid={intent === 'danger'}
      />
    </FormGroup>
  );
};

/**
 * ARIA Live Region Hook
 *
 * For dynamic content updates that need to be announced to screen readers
 *
 * USAGE:
 * ```tsx
 * const { announceMessage } = useAriaLiveRegion();
 *
 * // Announce status changes
 * announceMessage('5 opportunities loaded', 'polite');
 * announceMessage('Error: Failed to save', 'assertive');
 * ```
 */

type PolitenessLevel = 'off' | 'polite' | 'assertive';

export const useAriaLiveRegion = () => {
  const [message, setMessage] = React.useState('');
  const [politeness, setPoliteness] = React.useState<PolitenessLevel>('polite');

  const announceMessage = React.useCallback((text: string, level: PolitenessLevel = 'polite') => {
    setPoliteness(level);
    setMessage(text);

    // Clear message after announcement
    setTimeout(() => setMessage(''), 100);
  }, []);

  const LiveRegion = React.useMemo(
    () => () => (
      <div
        role="status"
        aria-live={politeness}
        aria-atomic="true"
        className="sr-only"
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
      >
        {message}
      </div>
    ),
    [message, politeness]
  );

  return { announceMessage, LiveRegion };
};

/**
 * Keyboard Navigation Hook
 *
 * Enhances keyboard accessibility for complex interactions
 *
 * USAGE:
 * ```tsx
 * const { onKeyDown } = useKeyboardNavigation({
 *   onEnter: () => handleSubmit(),
 *   onEscape: () => handleCancel(),
 *   onArrowUp: () => selectPrevious(),
 *   onArrowDown: () => selectNext()
 * });
 *
 * <div onKeyDown={onKeyDown}>...</div>
 * ```
 */

interface KeyboardNavigationOptions {
  onEnter?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onSpace?: () => void;
  onTab?: () => void;
  onShiftTab?: () => void;
}

export const useKeyboardNavigation = (options: KeyboardNavigationOptions) => {
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      const { key, shiftKey } = event;

      switch (key) {
        case 'Enter':
          if (options.onEnter) {
            event.preventDefault();
            options.onEnter();
          }
          break;
        case 'Escape':
          if (options.onEscape) {
            event.preventDefault();
            options.onEscape();
          }
          break;
        case 'ArrowUp':
          if (options.onArrowUp) {
            event.preventDefault();
            options.onArrowUp();
          }
          break;
        case 'ArrowDown':
          if (options.onArrowDown) {
            event.preventDefault();
            options.onArrowDown();
          }
          break;
        case 'ArrowLeft':
          if (options.onArrowLeft) {
            event.preventDefault();
            options.onArrowLeft();
          }
          break;
        case 'ArrowRight':
          if (options.onArrowRight) {
            event.preventDefault();
            options.onArrowRight();
          }
          break;
        case ' ':
          if (options.onSpace) {
            event.preventDefault();
            options.onSpace();
          }
          break;
        case 'Tab':
          if (shiftKey && options.onShiftTab) {
            event.preventDefault();
            options.onShiftTab();
          } else if (!shiftKey && options.onTab) {
            event.preventDefault();
            options.onTab();
          }
          break;
      }
    },
    [options]
  );

  return { onKeyDown: handleKeyDown };
};

/**
 * Focus Management Hook
 *
 * Manages focus for dialogs, modals, and dynamic content
 *
 * USAGE:
 * ```tsx
 * const { containerRef, focusFirst, focusLast, trapFocus } = useFocusManagement();
 *
 * <div ref={containerRef}>
 *   <Button onClick={focusFirst}>Focus First</Button>
 *   {trapFocus && <div onKeyDown={trapFocus}>...</div>}
 * </div>
 * ```
 */

export const useFocusManagement = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const getFocusableElements = React.useCallback(() => {
    if (!containerRef.current) return [];

    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    return Array.from(containerRef.current.querySelectorAll<HTMLElement>(selector));
  }, []);

  const focusFirst = React.useCallback(() => {
    const elements = getFocusableElements();
    elements[0]?.focus();
  }, [getFocusableElements]);

  const focusLast = React.useCallback(() => {
    const elements = getFocusableElements();
    elements[elements.length - 1]?.focus();
  }, [getFocusableElements]);

  const trapFocus = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const elements = getFocusableElements();
      if (elements.length === 0) return;

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    },
    [getFocusableElements]
  );

  return { containerRef, focusFirst, focusLast, trapFocus };
};

/**
 * Screen Reader Only Text Component
 *
 * Provides additional context for screen reader users
 *
 * USAGE:
 * ```tsx
 * <SROnly>This text is only for screen readers</SROnly>
 * ```
 */

export const SROnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    className="sr-only"
    style={{
      position: 'absolute',
      left: '-10000px',
      width: '1px',
      height: '1px',
      overflow: 'hidden'
    }}
  >
    {children}
  </span>
);

export default {
  AccessibleInput,
  AccessibleNumericInput,
  AccessibleTextArea,
  useAriaLiveRegion,
  useKeyboardNavigation,
  useFocusManagement,
  SROnly
};
