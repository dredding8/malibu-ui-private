import React, { useState, useEffect } from 'react';
import { Card, Button, Collapse, Classes, Colors, Intent, Tag } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

export interface HelpTip {
  id: string;
  title: string;
  content: string;
  action?: {
    text: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}

interface ContextualHelpProps {
  context: 'first-visit' | 'empty-state' | 'filtered-view' | 'bulk-mode' | 'processing' | 'error-state';
  onDismiss?: (tipId: string) => void;
}

const ContextualHelp: React.FC<ContextualHelpProps> = ({ context, onDismiss }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(new Set());

  const helpContent: Record<string, HelpTip[]> = {
    'first-visit': [
      {
        id: 'welcome-tip',
        title: '👋 Welcome to Your Collection Results',
        content: 'This is where you\'ll monitor all your collection progress and access completed results. Collections appear here after you create them.',
        action: {
          text: 'Create Your First Collection',
          onClick: () => window.location.href = '/create-collection-deck/data'
        },
        dismissible: true
      },
      {
        id: 'status-cards-tip',
        title: '📊 Interactive Status Cards',
        content: 'Click on the colored status cards above to quickly filter your collections by status (Ready, Processing, or Need Help).',
        dismissible: true
      }
    ],
    'empty-state': [
      {
        id: 'no-results-tip',
        title: '🔍 No Collections Found',
        content: 'Try adjusting your filters or date range to see more results, or create a new collection to get started.',
        action: {
          text: 'Clear All Filters',
          onClick: () => {} // This would be connected to the parent's filter reset
        },
        dismissible: true
      }
    ],
    'filtered-view': [
      {
        id: 'active-filters-tip',
        title: '🎯 Active Filters',
        content: 'You\'re viewing filtered results. Use the "Clear All" button to see all collections, or adjust individual filters.',
        dismissible: true
      }
    ],
    'bulk-mode': [
      {
        id: 'bulk-actions-tip',
        title: '☑️ Bulk Actions Active',
        content: 'Select multiple collections using the checkboxes, then choose an action from the blue toolbar that appears.',
        action: {
          text: 'Exit Bulk Mode',
          onClick: () => {} // This would be connected to the parent's bulk mode toggle
        },
        dismissible: true
      }
    ],
    'processing': [
      {
        id: 'real-time-tip',
        title: '⚡ Live Updates Active',
        content: 'Your collections are being processed in real-time. You\'ll see notifications when status changes occur.',
        dismissible: true
      }
    ],
    'error-state': [
      {
        id: 'error-help-tip',
        title: '🔧 Need Help with Errors?',
        content: 'Collections that need attention often require additional input or have encountered temporary issues. Click on them for more details.',
        dismissible: true
      }
    ]
  };

  const currentTips = helpContent[context] || [];
  const visibleTips = currentTips.filter(tip => !dismissedTips.has(tip.id));

  const handleDismiss = (tipId: string) => {
    const newDismissed = new Set(dismissedTips);
    newDismissed.add(tipId);
    setDismissedTips(newDismissed);
    onDismiss?.(tipId);
    
    // Store in localStorage for persistence
    const stored = localStorage.getItem('dismissed-help-tips') || '[]';
    const dismissedArray = JSON.parse(stored);
    dismissedArray.push(tipId);
    localStorage.setItem('dismissed-help-tips', JSON.stringify(dismissedArray));
  };

  useEffect(() => {
    // Load previously dismissed tips from localStorage
    const stored = localStorage.getItem('dismissed-help-tips');
    if (stored) {
      try {
        const dismissedArray = JSON.parse(stored);
        setDismissedTips(new Set(dismissedArray));
      } catch (error) {
        console.warn('Failed to parse dismissed help tips from localStorage');
      }
    }
  }, []);

  // Auto-expand on first visit or error states
  useEffect(() => {
    if (context === 'first-visit' || context === 'error-state') {
      setIsExpanded(true);
    }
  }, [context]);

  if (visibleTips.length === 0) {
    return null;
  }

  return (
    <Card 
      style={{ 
        backgroundColor: Colors.LIGHT_GRAY5,
        border: `1px solid ${Colors.LIGHT_GRAY3}`,
        marginBottom: '16px',
        borderRadius: '8px'
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: isExpanded ? '16px' : '0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>💡</span>
          <span style={{ 
            fontWeight: '600', 
            color: Colors.DARK_GRAY1,
            fontSize: '14px'
          }}>
            Helpful Tips
          </span>
          <Tag 
            minimal 
            intent={Intent.PRIMARY}
            style={{ fontSize: '11px' }}
          >
            {visibleTips.length}
          </Tag>
        </div>
        <Button
          minimal
          small
          icon={isExpanded ? IconNames.CHEVRON_UP : IconNames.CHEVRON_DOWN}
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ minWidth: 'auto' }}
        />
      </div>
      
      <Collapse isOpen={isExpanded}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {visibleTips.map((tip) => (
            <div 
              key={tip.id}
              style={{
                padding: '16px',
                backgroundColor: Colors.WHITE,
                borderRadius: '6px',
                border: `1px solid ${Colors.LIGHT_GRAY2}`,
                position: 'relative'
              }}
            >
              {tip.dismissible && (
                <Button
                  minimal
                  small
                  icon={IconNames.CROSS}
                  onClick={() => handleDismiss(tip.id)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    minWidth: 'auto',
                    width: '24px',
                    height: '24px'
                  }}
                />
              )}
              
              <div style={{ 
                fontWeight: '600', 
                color: Colors.DARK_GRAY1,
                fontSize: '14px',
                marginBottom: '8px',
                paddingRight: tip.dismissible ? '32px' : '0'
              }}>
                {tip.title}
              </div>
              
              <div style={{ 
                color: Colors.GRAY1,
                fontSize: '13px',
                lineHeight: '1.5',
                marginBottom: tip.action ? '12px' : '0'
              }}>
                {tip.content}
              </div>
              
              {tip.action && (
                <Button
                  small
                  intent={Intent.PRIMARY}
                  text={tip.action.text}
                  onClick={tip.action.onClick}
                  style={{ fontSize: '12px' }}
                />
              )}
            </div>
          ))}
        </div>
      </Collapse>
    </Card>
  );
};

export default ContextualHelp;