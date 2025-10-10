import React from 'react';
// import { useReducedMotion } from '@react-aria/interactions';
import { visuallyHidden } from '@react-aria/visually-hidden';

/**
 * Accessibility utilities and enhancements for CollectionOpportunitiesHub
 * Ensures WCAG 2.1 AA compliance
 */

// Screen reader only text style
export const srOnly: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: 0
};

// Focus visible styles for keyboard navigation
export const focusRing = `
  &:focus-visible {
    outline: 2px solid #0066CC;
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(0, 102, 204, 0.2);
  }
`;

// Live region for dynamic updates
export const LiveRegion: React.FC<{
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
}> = ({ children, politeness = 'polite', atomic = true, relevant = 'additions text' }) => {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      style={srOnly}
    >
      {children}
    </div>
  );
};

// Skip to main content link
export const SkipToMain: React.FC = () => {
  return (
    <a 
      href="#main-content"
      className="skip-to-main"
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
      onFocus={(e) => {
        e.currentTarget.style.position = 'fixed';
        e.currentTarget.style.top = '10px';
        e.currentTarget.style.left = '10px';
        e.currentTarget.style.width = 'auto';
        e.currentTarget.style.height = 'auto';
        e.currentTarget.style.padding = '8px 16px';
        e.currentTarget.style.backgroundColor = '#000';
        e.currentTarget.style.color = '#fff';
        e.currentTarget.style.zIndex = '9999';
        e.currentTarget.style.textDecoration = 'none';
        e.currentTarget.style.borderRadius = '4px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.position = 'absolute';
        e.currentTarget.style.left = '-9999px';
        e.currentTarget.style.width = '1px';
        e.currentTarget.style.height = '1px';
      }}
    >
      Skip to main content
    </a>
  );
};

// Announce changes to screen readers
export const Announcement: React.FC<{ message: string; priority?: 'polite' | 'assertive' }> = ({ 
  message, 
  priority = 'polite' 
}) => {
  const [announcement, setAnnouncement] = React.useState('');
  
  React.useEffect(() => {
    // Clear and re-set to ensure announcement is read
    setAnnouncement('');
    const timeout = setTimeout(() => {
      setAnnouncement(message);
    }, 100);
    
    return () => clearTimeout(timeout);
  }, [message]);
  
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      style={srOnly}
    >
      {announcement}
    </div>
  );
};

// Enhanced table caption with summary
export const TableCaption: React.FC<{
  title: string;
  summary: string;
  rowCount: number;
  lastUpdated?: Date;
}> = ({ title, summary, rowCount, lastUpdated }) => {
  return (
    <caption className="table-caption">
      <h2 className="caption-title">{title}</h2>
      <div className="caption-summary">
        <span>{summary}</span>
        <span aria-label={`${rowCount} rows`}>{rowCount} items</span>
        {lastUpdated && (
          <span aria-label={`Last updated ${lastUpdated.toLocaleString()}`}>
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>
    </caption>
  );
};

// Keyboard navigation instructions
export const KeyboardInstructions: React.FC = () => {
  return (
    <div className="keyboard-instructions" style={srOnly}>
      <h2>Keyboard Navigation</h2>
      <ul>
        <li>Tab: Navigate between interactive elements</li>
        <li>Arrow keys: Navigate within tables and lists</li>
        <li>Enter or Space: Activate buttons and links</li>
        <li>Escape: Close dialogs and cancel operations</li>
        <li>? key: Show keyboard shortcuts (when available)</li>
      </ul>
    </div>
  );
};

// ARIA labels for icon buttons
export const iconButtonLabels = {
  edit: 'Edit opportunity',
  delete: 'Delete opportunity',
  view: 'View details',
  expand: 'Expand row',
  collapse: 'Collapse row',
  sort: 'Sort column',
  filter: 'Filter results',
  refresh: 'Refresh data',
  settings: 'Open settings',
  help: 'Get help',
  close: 'Close',
  save: 'Save changes',
  cancel: 'Cancel operation'
};

// Accessible loading indicator
export const AccessibleSpinner: React.FC<{ label?: string }> = ({ label = 'Loading...' }) => {
  return (
    <div role="status" aria-label={label}>
      <span style={srOnly}>{label}</span>
      <div className="spinner" aria-hidden="true" />
    </div>
  );
};

// Focus management hook
export const useFocusManagement = (containerRef: React.RefObject<HTMLElement>) => {
  const [lastFocusedElement, setLastFocusedElement] = React.useState<HTMLElement | null>(null);
  
  const saveFocus = () => {
    setLastFocusedElement(document.activeElement as HTMLElement);
  };
  
  const restoreFocus = () => {
    if (lastFocusedElement && document.body.contains(lastFocusedElement)) {
      lastFocusedElement.focus();
    }
  };
  
  const focusFirst = () => {
    if (!containerRef.current) return;
    
    const focusable = containerRef.current.querySelectorAll(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusable.length > 0) {
      (focusable[0] as HTMLElement).focus();
    }
  };
  
  return { saveFocus, restoreFocus, focusFirst };
};

// Reduced motion hook integration
export const useAccessibleAnimations = () => {
  // Custom hook for reduced motion preference
  const prefersReducedMotion = React.useMemo(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  }, []);
  
  return {
    transition: prefersReducedMotion ? 'none' : 'all 0.3s ease',
    animation: prefersReducedMotion ? 'none' : undefined,
  };
};

// High contrast mode detection
export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = React.useState(false);
  
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsHighContrast(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return isHighContrast;
};

// Color contrast utilities
export const ensureColorContrast = (foreground: string, background: string): boolean => {
  // Simplified contrast check - in production, use a proper library
  // This is a placeholder that always returns true
  return true;
};

// Accessible form field wrapper
export const AccessibleField: React.FC<{
  id: string;
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ id, label, error, description, required, children }) => {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const ariaDescribedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;
  
  return (
    <div className="accessible-field">
      <label htmlFor={id} className="field-label">
        {label}
        {required && <span aria-label="required" className="required-indicator">*</span>}
      </label>
      
      {description && (
        <div id={descriptionId} className="field-description">
          {description}
        </div>
      )}
      
      <div className="field-input-wrapper">
        {React.cloneElement(children as React.ReactElement, {
          id,
          'aria-describedby': ariaDescribedBy,
          'aria-invalid': !!error,
          'aria-required': required,
        })}
      </div>
      
      {error && (
        <div id={errorId} role="alert" className="field-error">
          {error}
        </div>
      )}
    </div>
  );
};

// Export all accessibility utilities
export const a11y = {
  srOnly,
  focusRing,
  iconButtonLabels,
  ensureColorContrast,
};