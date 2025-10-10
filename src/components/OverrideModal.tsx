import React, { useState, useReducer, useEffect, useMemo } from 'react';
import {
  Dialog,
  Classes,
  Button,
  Intent,
  FormGroup,
  TextArea,
  Callout,
  Tag,
  Tooltip,
  Card,
  Collapse,
  Switch,
  NonIdealState,
  Spinner,
  NumericInput,
  Checkbox,
  Tabs,
  Tab,
  TabId,
  Divider,
  ProgressBar,
  HTMLSelect,
  InputGroup,
  Alert,
  AnchorButton,
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { Icon } from '../utils/blueprintIconWrapper';
import {
  CollectionOpportunity,
  Site,
  Satellite,
  Priority,
  CapacityResult,
  ValidationError,
  CapacityThresholds,
} from '../types/collectionOpportunities';
import { validateCapacity } from '../utils/opportunityValidation';
import { calculateOpportunityHealth } from '../utils/opportunityHealth';
import OpportunityStatusIndicatorEnhanced from './OpportunityStatusIndicatorEnhanced';
import './OverrideModal.css';

// Enhanced types for override functionality
export interface OverrideData {
  siteAllocations: SiteAllocation[];
  justification: string;
  priority: Priority;
  timeWindow?: TimeWindow;
  specialInstructions?: string;
  classification: 'unclassified' | 'secret' | 'top_secret';
}

export interface SiteAllocation {
  siteId: string;
  siteName: string;
  passes: number;
  capacity: number;
  allocated: number;
  availableCapacity: number;
  originalPasses?: number;
  isOverridden?: boolean;
}

export interface TimeWindow {
  startTime: string;
  endTime: string;
  timezone: string;
}

export interface OverrideModalProps {
  isOpen: boolean;
  satellite: Satellite;
  opportunity: CollectionOpportunity;
  currentAllocations: SiteAllocation[];
  availableSites: Site[];
  onClose: () => void;
  onSave: (overrides: OverrideData) => Promise<void>;
  capacityThresholds?: CapacityThresholds;
  enableUndoRedo?: boolean;
  maxPasses?: number;
}

// State management types
interface OverrideState {
  allocations: Map<string, SiteAllocation>;
  justification: string;
  classification: 'unclassified' | 'secret' | 'top_secret';
  priority: Priority;
  timeWindow?: TimeWindow;
  specialInstructions?: string;
  validationErrors: ValidationError[];
  isDirty: boolean;
  history: OverrideState[];
  historyIndex: number;
  selectedTab: TabId;
}

type OverrideAction =
  | { type: 'SET_ALLOCATION'; siteId: string; allocation: SiteAllocation }
  | { type: 'UPDATE_PASSES'; siteId: string; passes: number }
  | { type: 'REMOVE_ALLOCATION'; siteId: string }
  | { type: 'SET_JUSTIFICATION'; justification: string }
  | { type: 'SET_CLASSIFICATION'; classification: 'unclassified' | 'secret' | 'top_secret' }
  | { type: 'SET_PRIORITY'; priority: Priority }
  | { type: 'SET_TIME_WINDOW'; timeWindow?: TimeWindow }
  | { type: 'SET_SPECIAL_INSTRUCTIONS'; instructions?: string }
  | { type: 'SET_VALIDATION_ERRORS'; errors: ValidationError[] }
  | { type: 'APPLY_OPTIMIZATION'; allocations: Map<string, SiteAllocation> }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET' }
  | { type: 'SET_TAB'; tabId: TabId };

// Reducer with undo/redo capability
function overrideReducer(state: OverrideState, action: OverrideAction): OverrideState {
  const saveToHistory = (newState: OverrideState): OverrideState => {
    const history = [...state.history.slice(0, state.historyIndex + 1), newState];
    return {
      ...newState,
      history,
      historyIndex: history.length - 1,
    };
  };

  switch (action.type) {
    case 'SET_ALLOCATION': {
      const newAllocations = new Map(state.allocations);
      newAllocations.set(action.siteId, { ...action.allocation, isOverridden: true });
      const newState = {
        ...state,
        allocations: newAllocations,
        isDirty: true,
      };
      return saveToHistory(newState);
    }

    case 'UPDATE_PASSES': {
      const allocation = state.allocations.get(action.siteId);
      if (!allocation) return state;
      
      const newAllocations = new Map(state.allocations);
      newAllocations.set(action.siteId, {
        ...allocation,
        passes: action.passes,
        isOverridden: true,
      });
      const newState = {
        ...state,
        allocations: newAllocations,
        isDirty: true,
      };
      return saveToHistory(newState);
    }

    case 'REMOVE_ALLOCATION': {
      const newAllocations = new Map(state.allocations);
      newAllocations.delete(action.siteId);
      const newState = {
        ...state,
        allocations: newAllocations,
        isDirty: true,
      };
      return saveToHistory(newState);
    }

    case 'SET_JUSTIFICATION':
      return {
        ...state,
        justification: action.justification,
        isDirty: true,
      };

    case 'SET_CLASSIFICATION':
      return {
        ...state,
        classification: action.classification,
        isDirty: true,
      };

    case 'SET_PRIORITY':
      return {
        ...state,
        priority: action.priority,
        isDirty: true,
      };

    case 'SET_TIME_WINDOW':
      return {
        ...state,
        timeWindow: action.timeWindow,
        isDirty: true,
      };

    case 'SET_SPECIAL_INSTRUCTIONS':
      return {
        ...state,
        specialInstructions: action.instructions,
        isDirty: true,
      };

    case 'SET_VALIDATION_ERRORS':
      return {
        ...state,
        validationErrors: action.errors,
      };

    case 'APPLY_OPTIMIZATION': {
      const newState = {
        ...state,
        allocations: action.allocations,
        isDirty: true,
      };
      return saveToHistory(newState);
    }

    case 'UNDO':
      if (state.historyIndex > 0) {
        return {
          ...state.history[state.historyIndex - 1],
          historyIndex: state.historyIndex - 1,
        };
      }
      return state;

    case 'REDO':
      if (state.historyIndex < state.history.length - 1) {
        return {
          ...state.history[state.historyIndex + 1],
          historyIndex: state.historyIndex + 1,
        };
      }
      return state;

    case 'SET_TAB':
      return {
        ...state,
        selectedTab: action.tabId,
      };

    case 'RESET':
      return state.history[0];

    default:
      return state;
  }
}

export const OverrideModal: React.FC<OverrideModalProps> = ({
  isOpen,
  satellite,
  opportunity,
  currentAllocations,
  availableSites,
  onClose,
  onSave,
  capacityThresholds = { critical: 10, warning: 30, optimal: 70 },
  enableUndoRedo = true,
  maxPasses = 10,
}) => {
  // Initialize state from current allocations
  const initialAllocations = new Map<string, SiteAllocation>();
  currentAllocations.forEach(alloc => {
    initialAllocations.set(alloc.siteId, {
      ...alloc,
      originalPasses: alloc.passes,
      isOverridden: false,
    });
  });

  const initialState: OverrideState = {
    allocations: initialAllocations,
    justification: '',
    classification: 'unclassified',
    priority: opportunity.priority,
    timeWindow: undefined,
    specialInstructions: undefined,
    validationErrors: [],
    isDirty: false,
    history: [],
    historyIndex: 0,
    selectedTab: 'allocation',
  };

  const [state, dispatch] = useReducer(overrideReducer, {
    ...initialState,
    history: [initialState],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showClassificationWarning, setShowClassificationWarning] = useState(false);

  // Calculate current capacity and health
  const currentCapacity = useMemo(() => {
    let totalAllocated = 0;
    let totalCapacity = 0;

    state.allocations.forEach(allocation => {
      totalAllocated += allocation.passes;
      totalCapacity += allocation.capacity;
    });

    const percentage = totalCapacity > 0 ? ((totalCapacity - totalAllocated) / totalCapacity) * 100 : 0;
    return {
      allocated: totalAllocated,
      available: totalCapacity - totalAllocated,
      percentage,
      status: percentage < capacityThresholds.critical ? 'critical' as const :
              percentage < capacityThresholds.warning ? 'warning' as const : 
              'optimal' as const,
    };
  }, [state.allocations, capacityThresholds]);

  // Validation
  useEffect(() => {
    const errors: ValidationError[] = [];

    // Check if justification is required
    if (state.isDirty && !state.justification.trim()) {
      errors.push({
        opportunityId: opportunity.id,
        field: 'justification',
        message: 'Justification is required for manual overrides',
        severity: 'error',
      });
    }

    // Check if any allocations exceed capacity
    state.allocations.forEach((allocation, siteId) => {
      if (allocation.passes > allocation.capacity - allocation.allocated + (allocation.originalPasses || 0)) {
        errors.push({
          opportunityId: opportunity.id,
          field: `allocation-${siteId}`,
          message: `${allocation.siteName} exceeds available capacity`,
          severity: 'error',
        });
      }
    });

    // Check total capacity
    if (currentCapacity.status === 'critical') {
      errors.push({
        opportunityId: opportunity.id,
        field: 'capacity',
        message: 'Critical capacity shortage - consider reducing allocations',
        severity: 'warning',
      });
    }

    dispatch({ type: 'SET_VALIDATION_ERRORS', errors });
  }, [state.allocations, state.justification, state.isDirty, currentCapacity, opportunity.id]);

  // Handler functions
  const handleAddSite = (site: Site) => {
    const allocation: SiteAllocation = {
      siteId: site.id,
      siteName: site.name,
      passes: 0,
      capacity: site.capacity,
      allocated: site.allocated,
      availableCapacity: site.capacity - site.allocated,
      isOverridden: true,
    };
    dispatch({ type: 'SET_ALLOCATION', siteId: site.id, allocation });
  };

  const handleUpdatePasses = (siteId: string, passes: number) => {
    if (passes >= 0 && passes <= maxPasses) {
      dispatch({ type: 'UPDATE_PASSES', siteId, passes });
    }
  };

  const handleRemoveSite = (siteId: string) => {
    dispatch({ type: 'REMOVE_ALLOCATION', siteId });
  };

  const handleOptimize = () => {
    // Simple optimization algorithm
    const optimizedAllocations = new Map<string, SiteAllocation>();
    const sortedSites = availableSites
      .sort((a, b) => {
        const aAvailable = (a.capacity - a.allocated) / a.capacity;
        const bAvailable = (b.capacity - b.allocated) / b.capacity;
        return bAvailable - aAvailable;
      })
      .slice(0, 5);

    sortedSites.forEach(site => {
      const availableCapacity = site.capacity - site.allocated;
      const optimalPasses = Math.min(Math.floor(availableCapacity * 0.8), maxPasses);
      
      optimizedAllocations.set(site.id, {
        siteId: site.id,
        siteName: site.name,
        passes: optimalPasses,
        capacity: site.capacity,
        allocated: site.allocated,
        availableCapacity,
        isOverridden: true,
      });
    });

    dispatch({ type: 'APPLY_OPTIMIZATION', allocations: optimizedAllocations });
  };

  const handleSave = async () => {
    const hasErrors = state.validationErrors.some(e => e.severity === 'error');
    if (hasErrors) return;

    setIsSaving(true);
    try {
      const overrideData: OverrideData = {
        siteAllocations: Array.from(state.allocations.values()),
        justification: state.justification,
        priority: state.priority,
        classification: state.classification,
        timeWindow: state.timeWindow,
        specialInstructions: state.specialInstructions,
      };

      await onSave(overrideData);
      onClose();
    } catch (error) {
      console.error('Failed to save overrides:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const hasErrors = state.validationErrors.some(e => e.severity === 'error');
  const canSave = state.isDirty && !hasErrors && state.justification.trim().length > 0;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="override-modal-header">
          <Icon icon={IconNames.MANUALLY_ENTERED_DATA} />
          <span>Manual Override: {satellite.name}</span>
          <div className="header-tags">
            <Tag minimal intent={Intent.PRIMARY}>{satellite.function}</Tag>
            <Tag minimal>{satellite.orbit}</Tag>
            <Tag 
              minimal 
              intent={currentCapacity.status === 'critical' ? Intent.DANGER :
                      currentCapacity.status === 'warning' ? Intent.WARNING :
                      Intent.SUCCESS}
            >
              {currentCapacity.percentage.toFixed(0)}% Available
            </Tag>
          </div>
        </div>
      }
      className="override-modal"
      canEscapeKeyClose={!state.isDirty}
      canOutsideClickClose={!state.isDirty}
      style={{ width: '900px' }}
    >
      <div className={Classes.DIALOG_BODY}>
        {/* Undo/Redo Controls */}
        {enableUndoRedo && (
          <div className="undo-redo-controls">
            <Tooltip content="Undo (Ctrl+Z)">
              <Button
                minimal
                icon={IconNames.UNDO}
                disabled={state.historyIndex === 0}
                onClick={() => dispatch({ type: 'UNDO' })}
              />
            </Tooltip>
            <Tooltip content="Redo (Ctrl+Y)">
              <Button
                minimal
                icon={IconNames.REDO}
                disabled={state.historyIndex === state.history.length - 1}
                onClick={() => dispatch({ type: 'REDO' })}
              />
            </Tooltip>
            <Divider />
            <Tooltip content="Reset to original">
              <Button
                minimal
                icon={IconNames.RESET}
                onClick={() => dispatch({ type: 'RESET' })}
              />
            </Tooltip>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs
          id="override-tabs"
          onChange={(tabId) => dispatch({ type: 'SET_TAB', tabId })}
          selectedTabId={state.selectedTab}
          renderActiveTabPanelOnly
        >
          <Tab id="allocation" title="Site Allocation" panel={
            <div className="allocation-panel">
              {/* Quick Actions */}
              <div className="quick-actions">
                <Button
                  icon={IconNames.LIGHTBULB}
                  intent={Intent.PRIMARY}
                  onClick={handleOptimize}
                >
                  Auto-Optimize Allocation
                </Button>
                <Button
                  icon={IconNames.CLEAN}
                  minimal
                  onClick={() => dispatch({ type: 'RESET' })}
                >
                  Clear Overrides
                </Button>
              </div>

              {/* Current Allocations */}
              <Card className="allocations-card">
                <h4>Current Allocations</h4>
                {state.allocations.size === 0 ? (
                  <NonIdealState
                    icon={IconNames.INBOX}
                    title="No sites allocated"
                    description="Add sites from the available list below"
                  />
                ) : (
                  <div className="allocations-list">
                    {Array.from(state.allocations.entries()).map(([siteId, allocation]) => (
                      <div key={siteId} className={`allocation-row ${allocation.isOverridden ? 'overridden' : ''}`}>
                        <div className="site-info">
                          <strong>{allocation.siteName}</strong>
                          {allocation.isOverridden && (
                            <Tag minimal intent={Intent.PRIMARY}>Modified</Tag>
                          )}
                          <div className="capacity-info">
                            <ProgressBar
                              value={(allocation.allocated + allocation.passes) / allocation.capacity}
                              intent={
                                ((allocation.allocated + allocation.passes) / allocation.capacity) > 0.9 
                                  ? Intent.DANGER 
                                  : ((allocation.allocated + allocation.passes) / allocation.capacity) > 0.7 
                                  ? Intent.WARNING 
                                  : Intent.NONE
                              }
                              animate={false}
                              stripes={false}
                            />
                            <span className={Classes.TEXT_MUTED}>
                              {allocation.allocated + allocation.passes}/{allocation.capacity} passes
                            </span>
                          </div>
                        </div>
                        <div className="allocation-controls">
                          <NumericInput
                            value={allocation.passes}
                            onValueChange={(value) => handleUpdatePasses(siteId, value)}
                            min={0}
                            max={maxPasses}
                            stepSize={1}
                            minorStepSize={1}
                            intent={
                              state.validationErrors.some(e => e.field === `allocation-${siteId}`) 
                                ? Intent.DANGER 
                                : Intent.NONE
                            }
                            leftIcon={IconNames.SATELLITE}
                            placeholder="Passes"
                          />
                          <Tooltip content="Remove site">
                            <Button
                              minimal
                              icon={IconNames.TRASH}
                              intent={Intent.DANGER}
                              onClick={() => handleRemoveSite(siteId)}
                            />
                          </Tooltip>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Available Sites */}
              <Card className="available-sites-card">
                <h4>Available Sites</h4>
                <div className="sites-grid">
                  {availableSites
                    .filter(site => !state.allocations.has(site.id))
                    .map(site => {
                      const availablePercentage = ((site.capacity - site.allocated) / site.capacity) * 100;
                      const isOptimal = availablePercentage > 30;

                      return (
                        <div
                          key={site.id}
                          className={`site-card ${isOptimal ? 'optimal' : 'low-capacity'}`}
                        >
                          <div className="site-header">
                            <strong>{site.name}</strong>
                            <Button
                              small
                              minimal
                              icon={IconNames.ADD}
                              intent={Intent.PRIMARY}
                              onClick={() => handleAddSite(site)}
                            >
                              Add
                            </Button>
                          </div>
                          <div className="site-metrics">
                            <ProgressBar
                              value={site.allocated / site.capacity}
                              intent={availablePercentage < 20 ? Intent.DANGER : 
                                     availablePercentage < 40 ? Intent.WARNING : 
                                     Intent.NONE}
                              animate={false}
                              stripes={false}
                            />
                            <span className={Classes.TEXT_MUTED}>
                              {availablePercentage.toFixed(0)}% available
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </Card>
            </div>
          } />

          <Tab id="justification" title="Justification & Details" panel={
            <div className="justification-panel">
              {/* Priority Selection */}
              <FormGroup
                label="Priority Level"
                helperText="Adjust priority based on operational requirements"
              >
                <div className="priority-selector">
                  {(['low', 'medium', 'high', 'critical'] as Priority[]).map(level => (
                    <Button
                      key={level}
                      className={`priority-button ${state.priority === level ? 'active' : ''}`}
                      intent={state.priority === level ? 
                        (level === 'critical' ? Intent.DANGER :
                         level === 'high' ? Intent.WARNING :
                         level === 'medium' ? Intent.PRIMARY : Intent.NONE) : 
                        Intent.NONE}
                      onClick={() => dispatch({ type: 'SET_PRIORITY', priority: level })}
                    >
                      {level.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </FormGroup>

              {/* Classification */}
              <FormGroup
                label="Classification Level"
                helperText="Select the appropriate classification for this override"
                intent={state.classification !== 'unclassified' ? Intent.WARNING : Intent.NONE}
              >
                <HTMLSelect
                  value={state.classification}
                  onChange={(e) => {
                    const classification = e.target.value as typeof state.classification;
                    dispatch({ type: 'SET_CLASSIFICATION', classification });
                    if (classification !== 'unclassified') {
                      setShowClassificationWarning(true);
                    }
                  }}
                >
                  <option value="unclassified">Unclassified</option>
                  <option value="secret">Secret</option>
                  <option value="top_secret">Top Secret</option>
                </HTMLSelect>
              </FormGroup>

              {/* Justification (Required) */}
              <FormGroup
                label={<span>Justification <span className="required">*</span></span>}
                helperText="Provide detailed justification for this manual override"
                intent={state.validationErrors.some(e => e.field === 'justification') ? Intent.DANGER : Intent.NONE}
              >
                <TextArea
                  fill
                  large
                  value={state.justification}
                  onChange={(e) => dispatch({ type: 'SET_JUSTIFICATION', justification: e.target.value })}
                  placeholder="Enter justification for manual override..."
                  rows={5}
                  intent={state.classification !== 'unclassified' ? Intent.DANGER : Intent.NONE}
                  className={state.classification !== 'unclassified' ? 'classified-input' : ''}
                />
              </FormGroup>

              {/* Advanced Options */}
              <div className="advanced-section">
                <Button
                  minimal
                  rightIcon={showAdvanced ? IconNames.CHEVRON_UP : IconNames.CHEVRON_DOWN}
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  Advanced Options
                </Button>
                
                <Collapse isOpen={showAdvanced}>
                  <div className="advanced-content">
                    {/* Time Window */}
                    <FormGroup
                      label="Time Window"
                      helperText="Specify collection time constraints"
                    >
                      <div className="time-window-inputs">
                        <InputGroup
                          type="datetime-local"
                          placeholder="Start time"
                          onChange={(e) => {
                            const startTime = e.target.value;
                            dispatch({
                              type: 'SET_TIME_WINDOW',
                              timeWindow: {
                                ...state.timeWindow,
                                startTime,
                                endTime: state.timeWindow?.endTime || '',
                                timezone: state.timeWindow?.timezone || 'UTC',
                              } as TimeWindow,
                            });
                          }}
                        />
                        <InputGroup
                          type="datetime-local"
                          placeholder="End time"
                          onChange={(e) => {
                            const endTime = e.target.value;
                            dispatch({
                              type: 'SET_TIME_WINDOW',
                              timeWindow: {
                                startTime: state.timeWindow?.startTime || '',
                                endTime,
                                timezone: state.timeWindow?.timezone || 'UTC',
                              } as TimeWindow,
                            });
                          }}
                        />
                      </div>
                    </FormGroup>

                    {/* Special Instructions */}
                    <FormGroup
                      label="Special Instructions"
                      helperText="Additional operational requirements or constraints"
                    >
                      <TextArea
                        fill
                        value={state.specialInstructions || ''}
                        onChange={(e) => dispatch({ 
                          type: 'SET_SPECIAL_INSTRUCTIONS', 
                          instructions: e.target.value 
                        })}
                        placeholder="Enter any special instructions..."
                        rows={3}
                      />
                    </FormGroup>
                  </div>
                </Collapse>
              </div>
            </div>
          } />

          <Tab id="review" title="Review & Summary" panel={
            <div className="review-panel">
              {/* Summary Card */}
              <Card className="summary-card">
                <h4>Override Summary</h4>
                <div className="summary-content">
                  <div className="summary-section">
                    <strong>Satellite:</strong> {satellite.name}
                    <Tag minimal>{satellite.function}</Tag>
                  </div>
                  <div className="summary-section">
                    <strong>Priority:</strong>
                    <Tag 
                      intent={state.priority === 'critical' ? Intent.DANGER :
                              state.priority === 'high' ? Intent.WARNING :
                              state.priority === 'medium' ? Intent.PRIMARY : 
                              Intent.NONE}
                    >
                      {state.priority.toUpperCase()}
                    </Tag>
                  </div>
                  <div className="summary-section">
                    <strong>Classification:</strong>
                    <Tag 
                      intent={state.classification !== 'unclassified' ? Intent.WARNING : Intent.NONE}
                    >
                      {state.classification.replace('_', ' ').toUpperCase()}
                    </Tag>
                  </div>
                  <div className="summary-section">
                    <strong>Total Sites:</strong> {state.allocations.size}
                  </div>
                  <div className="summary-section">
                    <strong>Total Passes:</strong> {
                      Array.from(state.allocations.values())
                        .reduce((sum, alloc) => sum + alloc.passes, 0)
                    }
                  </div>
                  <div className="summary-section">
                    <strong>Capacity Status:</strong>
                    <Tag 
                      intent={currentCapacity.status === 'critical' ? Intent.DANGER :
                              currentCapacity.status === 'warning' ? Intent.WARNING :
                              Intent.SUCCESS}
                    >
                      {currentCapacity.percentage.toFixed(0)}% Available
                    </Tag>
                  </div>
                </div>
              </Card>

              {/* Changes Summary */}
              <Card className="changes-card">
                <h4>Allocation Changes</h4>
                <div className="changes-list">
                  {Array.from(state.allocations.entries())
                    .filter(([_, alloc]) => alloc.isOverridden)
                    .map(([siteId, allocation]) => (
                      <div key={siteId} className="change-row">
                        <Icon icon={IconNames.CHANGES} intent={Intent.PRIMARY} />
                        <span>
                          <strong>{allocation.siteName}:</strong> {allocation.originalPasses || 0} → {allocation.passes} passes
                        </span>
                      </div>
                    ))}
                </div>
              </Card>

              {/* Justification Preview */}
              <Card className="justification-preview">
                <h4>Justification</h4>
                {state.justification ? (
                  <div className={state.classification !== 'unclassified' ? 'classified-content' : ''}>
                    {state.justification}
                  </div>
                ) : (
                  <NonIdealState
                    icon={IconNames.WARNING_SIGN}
                    title="No justification provided"
                    description="Justification is required to save overrides"
                  />
                )}
              </Card>
            </div>
          } />
        </Tabs>

        {/* Validation Errors */}
        {state.validationErrors.length > 0 && (
          <div className="validation-section">
            {state.validationErrors.map((error, index) => (
              <Callout
                key={index}
                intent={error.severity === 'error' ? Intent.DANGER : Intent.WARNING}
                icon={error.severity === 'error' ? IconNames.ERROR : IconNames.WARNING_SIGN}
              >
                {error.message}
              </Callout>
            ))}
          </div>
        )}

        {/* Classification Warning */}
        <Alert
          isOpen={showClassificationWarning}
          onClose={() => setShowClassificationWarning(false)}
          intent={Intent.WARNING}
          icon={IconNames.WARNING_SIGN}
          confirmButtonText="I understand"
        >
          <p>
            <strong>Classification Notice:</strong> You have selected a classified level. 
            Ensure all entered information adheres to security protocols and classification guidelines.
          </p>
        </Alert>
      </div>

      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          {state.isDirty && (
            <span className={Classes.TEXT_MUTED}>
              {Array.from(state.allocations.values()).filter(a => a.isOverridden).length} sites modified
            </span>
          )}
          <Button 
            onClick={onClose} 
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            intent={Intent.PRIMARY}
            onClick={handleSave}
            disabled={!canSave || isSaving}
            loading={isSaving}
          >
            Save Override
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default OverrideModal;