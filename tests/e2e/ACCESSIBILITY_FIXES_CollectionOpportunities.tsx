/**
 * Accessibility Fixes for CollectionOpportunitiesRefactored Component
 * Addresses WCAG 2.1 AA compliance issues identified in QA testing
 */

import React from 'react';
import { Table2, Column } from '@blueprintjs/table';

// 1. ARIA Live Region for Dynamic Updates
export const SelectionAnnouncer: React.FC<{ count: number }> = ({ count }) => (
  <div 
    className="sr-only" 
    role="status" 
    aria-live="polite" 
    aria-atomic="true"
  >
    {count > 0 ? `${count} opportunities selected` : 'No opportunities selected'}
  </div>
);

// 2. Skip Navigation Link
export const SkipToTable: React.FC = () => (
  <a 
    href="#opportunities-table" 
    className="skip-link"
    onFocus={(e) => e.currentTarget.classList.add('visible')}
    onBlur={(e) => e.currentTarget.classList.remove('visible')}
  >
    Skip to opportunities table
  </a>
);

// 3. Enhanced Table with ARIA Attributes
interface AccessibleTableProps {
  data: any[];
  columns: any[];
}

export const AccessibleTable: React.FC<AccessibleTableProps> = ({ data, columns }) => (
  <div role="region" aria-label="Collection opportunities data">
    <Table2
      id="opportunities-table"
      role="grid"
      aria-label="Collection opportunities with match status and priority"
      aria-rowcount={data.length}
      aria-colcount={columns.length}
      aria-describedby="table-instructions"
      // ... other props
    >
      {/* Columns with proper headers */}
    </Table2>
    
    <div id="table-instructions" className="sr-only">
      Use arrow keys to navigate cells. Press Enter to select a row. 
      Press Space to activate actions. Press Escape to clear selection.
    </div>
  </div>
);

// 4. Accessible Priority Cell
export const AccessiblePriorityCell = (rowIndex: number, data: any[]) => {
  const opp = data[rowIndex];
  const priorityLabels = {
    'critical': 'Critical priority, level 1',
    'high': 'High priority, level 2',
    'medium': 'Medium priority, level 3',
    'low': 'Low priority, level 4'
  };
  
  return (
    <td role="gridcell" aria-describedby={`priority-${opp.id}`}>
      <span 
        id={`priority-${opp.id}`}
        className="priority-tag"
        aria-label={priorityLabels[opp.priority]}
      >
        {getPriorityNumber(opp.priority)}
      </span>
    </td>
  );
};

// 5. Accessible Match Status Cell
export const AccessibleMatchStatusCell = (rowIndex: number, data: any[]) => {
  const opp = data[rowIndex];
  const matchStatus = opp.matchStatus || 'unmatched';
  const matchQuality = opp.matchQuality || 0;
  
  const statusDescriptions = {
    'baseline': 'Baseline match, no action required',
    'suboptimal': 'Suboptimal match, alternatives available',
    'unmatched': 'Unmatched, allocation required'
  };
  
  return (
    <td role="gridcell">
      <div 
        className={`match-status match-status-${matchStatus}`}
        role="status"
        aria-label={`${statusDescriptions[matchStatus]}. Match quality: ${matchQuality}%`}
      >
        <Icon name={getMatchIcon(matchStatus)} aria-hidden="true" />
        <span>{getMatchLabel(matchStatus)}</span>
      </div>
    </td>
  );
};

// 6. Accessible Action Buttons
export const AccessibleActionButton: React.FC<{
  action: string;
  opportunityName: string;
  onClick: () => void;
  intent?: Intent;
}> = ({ action, opportunityName, onClick, intent }) => (
  <Button
    minimal
    small
    intent={intent}
    onClick={onClick}
    aria-label={`${action} ${opportunityName}`}
    aria-describedby={action === 'View Alts' ? 'view-alts-help' : undefined}
  >
    {action}
  </Button>
);

// 7. Enhanced Keyboard Navigation Hook
export const useAccessibleKeyboardNavigation = (
  selectedRows: Set<string>,
  dispatch: React.Dispatch<any>,
  filteredData: any[]
) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      
      // Grid navigation with arrow keys
      if (activeElement?.closest('[role="grid"]')) {
        switch (e.key) {
          case 'ArrowUp':
          case 'ArrowDown':
          case 'ArrowLeft':
          case 'ArrowRight':
            e.preventDefault();
            navigateGrid(e.key, activeElement);
            break;
          
          case 'Enter':
            e.preventDefault();
            toggleRowSelection(activeElement);
            break;
          
          case ' ':
            e.preventDefault();
            activateAction(activeElement);
            break;
        }
      }
      
      // Announce keyboard shortcuts
      if (e.key === '?' && e.shiftKey) {
        announceKeyboardShortcuts();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRows, filteredData]);
};

// 8. Screen Reader Announcements
export const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcer = document.createElement('div');
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('aria-live', priority);
  announcer.className = 'sr-only';
  announcer.textContent = message;
  
  document.body.appendChild(announcer);
  setTimeout(() => document.body.removeChild(announcer), 1000);
};

// 9. Focus Management Utilities
export const focusManagement = {
  // Trap focus within modal
  trapFocus: (modalElement: HTMLElement) => {
    const focusableElements = modalElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    modalElement.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        } else if (!e.shiftKey && document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    });
  },
  
  // Restore focus after modal closes
  restoreFocus: (previouslyFocused: HTMLElement) => {
    previouslyFocused?.focus();
  }
};

// 10. CSS for Accessibility Improvements
export const accessibilityStyles = `
/* Skip link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--bp5-intent-primary);
  color: white;
  padding: 8px 16px;
  text-decoration: none;
  border-radius: 0 0 4px 0;
  z-index: 1000;
  transition: top 0.2s ease-out;
}

.skip-link.visible,
.skip-link:focus {
  top: 0;
}

/* Enhanced focus indicators */
*:focus {
  outline: 3px solid var(--bp5-intent-primary);
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .match-status {
    border-width: 2px;
  }
  
  .priority-tag {
    font-weight: 900;
    text-decoration: underline;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Larger touch targets for mobile */
@media (pointer: coarse) {
  button {
    min-width: 44px;
    min-height: 44px;
  }
  
  .bp5-table-cell {
    padding: 12px;
  }
}

/* Color blind friendly adjustments */
.match-status-baseline {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cpattern id='baseline' patternUnits='userSpaceOnUse' width='4' height='4'%3E%3Cpath d='M 0,4 l 4,-4 M -1,1 l 2,-2 M 3,5 l 2,-2' stroke='%23000000' stroke-width='0.5' opacity='0.2'/%3E%3C/pattern%3E%3Crect width='100%25' height='100%25' fill='url(%23baseline)'/%3E%3C/svg%3E");
}

.match-status-suboptimal {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cpattern id='suboptimal' patternUnits='userSpaceOnUse' width='4' height='4'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23000000' opacity='0.2'/%3E%3C/pattern%3E%3Crect width='100%25' height='100%25' fill='url(%23suboptimal)'/%3E%3C/svg%3E");
}
`;

// 11. Usage Example in Main Component
export const AccessibilityEnhancedComponent: React.FC = () => {
  const [selectedOpportunities, setSelectedOpportunities] = React.useState(new Set<string>());
  const previousFocus = React.useRef<HTMLElement | null>(null);
  
  return (
    <>
      <SkipToTable />
      <SelectionAnnouncer count={selectedOpportunities.size} />
      
      <div className="collection-opportunities-refactored">
        {/* Main content with accessibility enhancements */}
      </div>
      
      <style>{accessibilityStyles}</style>
    </>
  );
};