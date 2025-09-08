import React, { useState, useEffect } from 'react';
import {
  Popover,
  Menu,
  MenuItem,
  Position,
  Button,
  Classes,
  Tag,
  Divider,
  Card,
  Callout,
  Intent,
  NonIdealState,
  AnchorButton,
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEnhancedNavigation } from '../contexts/EnhancedNavigationContext';
import './NavigationAids.css';

/**
 * Context-aware navigation helper that provides quick access to related pages
 * and displays user's current location in the application hierarchy
 */
export const ContextualNavigator: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentContext } = useEnhancedNavigation();
  const [isOpen, setIsOpen] = useState(false);

  // Determine related navigation options based on current context
  const getRelatedPages = () => {
    switch (currentContext.domain) {
      case 'fieldMapping':
        return [
          { 
            text: 'Collection Opportunities', 
            icon: IconNames.SATELLITE,
            path: location.pathname.replace('field-mapping-review', 'collection-opportunities'),
            description: 'View satellite passes for this collection'
          },
          { 
            text: 'Back to History', 
            icon: IconNames.HISTORY,
            path: '/history',
            description: 'Return to collection history'
          }
        ];
      
      case 'collectionOpportunity':
        return [
          { 
            text: 'Field Mappings', 
            icon: IconNames.FLOWS,
            path: location.pathname.replace('collection-opportunities', 'field-mapping-review'),
            description: 'Review field mapping details'
          },
          { 
            text: 'Back to History', 
            icon: IconNames.HISTORY,
            path: '/history',
            description: 'Return to collection history'
          }
        ];
      
      case 'history':
        return [
          { 
            text: 'Create New Collection', 
            icon: IconNames.ADD,
            path: '/create-collection-deck',
            description: 'Start a new collection deck',
            intent: Intent.SUCCESS
          },
          { 
            text: 'View Analytics', 
            icon: IconNames.CHART,
            path: '/analytics',
            description: 'View collection analytics'
          }
        ];
      
      default:
        return [];
    }
  };

  const relatedPages = getRelatedPages();
  // TODO: Restore when navigationHistory is available
  const recentPages: any[] = []; // navigationHistory.slice(-5).reverse();

  return (
    <Popover
      content={
        <Menu className="navigation-aids-menu">
          <MenuItem
            text={
              <div className="current-location">
                <span className="bp5-icon" data-icon={currentContext.icon} style={{ fontSize: 16 }} />
                <div>
                  <div className="location-title">{currentContext.title}</div>
                  {currentContext.subtitle && (
                    <div className="location-subtitle">{currentContext.subtitle}</div>
                  )}
                </div>
              </div>
            }
            disabled
            className="current-location-item"
          />
          
          {relatedPages.length > 0 && (
            <>
              <Divider />
              <MenuItem text="Related Pages" disabled />
              {relatedPages.map((page, index) => (
                <MenuItem
                  key={index}
                  icon={page.icon}
                  text={
                    <div>
                      <div>{page.text}</div>
                      <div className={Classes.TEXT_MUTED} style={{ fontSize: '11px' }}>
                        {page.description}
                      </div>
                    </div>
                  }
                  intent={page.intent}
                  onClick={() => {
                    navigate(page.path);
                    setIsOpen(false);
                  }}
                />
              ))}
            </>
          )}
          
          {recentPages.length > 1 && (
            <>
              <Divider />
              <MenuItem text="Recent Pages" disabled />
              {recentPages.map((page, index) => (
                index > 0 && (
                  <MenuItem
                    key={index}
                    icon={page.icon}
                    text={page.title}
                    onClick={() => {
                      navigate(page.breadcrumbs[page.breadcrumbs.length - 1]?.href || '/');
                      setIsOpen(false);
                    }}
                  />
                )
              ))}
            </>
          )}
        </Menu>
      }
      position={Position.BOTTOM_RIGHT}
      isOpen={isOpen}
      onInteraction={(nextState) => setIsOpen(nextState)}
    >
      <Button
        minimal
        icon={IconNames.COMPASS}
        text="Navigate"
        rightIcon={IconNames.CARET_DOWN}
      />
    </Popover>
  );
};

/**
 * Floating action button for quick navigation help
 */
export const NavigationFAB: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false);
  const { currentContext } = useEnhancedNavigation();

  return (
    <>
      <Button
        className="navigation-fab"
        icon={IconNames.HELP}
        intent={Intent.PRIMARY}
        onClick={() => setShowHelp(!showHelp)}
        large
      />
      
      {showHelp && (
        <Card className="navigation-help-card" elevation={3}>
          <h4>Navigation Help</h4>
          <Callout intent={Intent.NONE} icon={IconNames.INFO_SIGN}>
            You are currently in: <strong>{currentContext.title}</strong>
          </Callout>
          
          <div className="help-shortcuts">
            <h5>Keyboard Shortcuts</h5>
            <div className="shortcut-list">
              <div><kbd>⌘1-5</kbd> Navigate to main sections</div>
              <div><kbd>⌘K</kbd> Focus search</div>
              <div><kbd>?</kbd> Show this help</div>
              <div><kbd>Esc</kbd> Close dialogs</div>
            </div>
          </div>
          
          <Button 
            text="Close" 
            onClick={() => setShowHelp(false)}
            style={{ marginTop: '12px' }}
          />
        </Card>
      )}
    </>
  );
};

/**
 * Navigation error state component
 */
export const NavigationError: React.FC<{
  error?: Error;
  onRetry?: () => void;
}> = ({ error, onRetry }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <NonIdealState
      icon={IconNames.ERROR}
      title="Navigation Error"
      description={
        <div>
          <p>We couldn't load this page. This might be because:</p>
          <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '12px auto' }}>
            <li>The page doesn't exist</li>
            <li>You don't have permission to view it</li>
            <li>There was a network error</li>
          </ul>
          {error?.message && (
            <Callout intent={Intent.DANGER} style={{ marginTop: '16px' }}>
              <strong>Error:</strong> {error.message}
            </Callout>
          )}
        </div>
      }
      action={
        <div className="error-actions">
          <Button
            intent={Intent.PRIMARY}
            icon={IconNames.HOME}
            text="Go to Dashboard"
            onClick={() => navigate('/')}
          />
          <Button
            icon={IconNames.HISTORY}
            text="Go Back"
            onClick={() => window.history.back()}
          />
          {onRetry && (
            <Button
              intent={Intent.SUCCESS}
              icon={IconNames.REFRESH}
              text="Try Again"
              onClick={onRetry}
            />
          )}
        </div>
      }
    />
  );
};

/**
 * Progress tracker for multi-step workflows
 */
interface WorkflowStep {
  id: string;
  label: string;
  status: 'pending' | 'current' | 'completed' | 'error';
  optional?: boolean;
}

export const WorkflowProgress: React.FC<{
  steps: WorkflowStep[];
  onStepClick?: (stepId: string) => void;
}> = ({ steps, onStepClick }) => {
  const currentIndex = steps.findIndex(s => s.status === 'current');
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / steps.length) * 100 : 0;

  return (
    <div className="workflow-progress">
      <div className="progress-bar-container">
        <div 
          className="progress-bar-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="workflow-steps">
        {steps.map((step, index) => {
          const isClickable = onStepClick && 
            (step.status === 'completed' || step.status === 'current');
          
          return (
            <div
              key={step.id}
              className={`workflow-step ${step.status} ${isClickable ? 'clickable' : ''}`}
              onClick={() => isClickable && onStepClick(step.id)}
            >
              <div className="step-indicator">
                {step.status === 'completed' && (
                  <span className="bp5-icon bp5-intent-success" data-icon={IconNames.TICK} style={{ fontSize: 16 }} />
                )}
                {step.status === 'current' && (
                  <div className="current-indicator">{index + 1}</div>
                )}
                {step.status === 'pending' && (
                  <div className="pending-indicator">{index + 1}</div>
                )}
                {step.status === 'error' && (
                  <span className="bp5-icon bp5-intent-danger" data-icon={IconNames.ERROR} style={{ fontSize: 16 }} />
                )}
              </div>
              
              <div className="step-label">
                {step.label}
                {step.optional && (
                  <Tag minimal className="optional-tag">Optional</Tag>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};