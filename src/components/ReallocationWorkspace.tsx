import React, { useState, useEffect, useReducer, useMemo, useCallback } from 'react';
import {
  Button,
  Card,
  Classes,
  Dialog,
  Divider,
  FormGroup,
  Icon as BpIcon,
  Intent,
  NonIdealState,
  ProgressBar,
  Slider,
  Spinner,
  Tab,
  Tabs,
  Tag,
  Tooltip,
  ButtonGroup,
  Callout,
  Switch,
  NumericInput,
  HTMLSelect,
  ResizeSensor,
  Position,
  Popover,
  Menu,
  MenuItem
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

// Type-safe Icon wrapper to handle Blueprint.js v6 types
const Icon: React.FC<React.ComponentProps<typeof BpIcon>> = (props) => {
  const iconElement = React.createElement(BpIcon, props);
  return <>{iconElement}</>;
};
import { CollectionOpportunity, Site, Priority, Pass, getPassDuration, parseQualityString } from '../types/collectionOpportunities';
import { OpportunityHealth, calculateOpportunityHealth } from '../utils/opportunityHealth';
import OpportunityStatusIndicatorEnhanced from './OpportunityStatusIndicatorEnhanced';
import './ReallocationWorkspace.css';

export interface Allocation {
  passId: string;
  siteId: string;
  priority: Priority;
  timeSlot: {
    start: Date;
    end: Date;
  };
  resources: string[];
}

export interface AllocationChange {
  type: 'add' | 'remove' | 'modify';
  allocation: Allocation;
  reason: string;
}

export enum WorkspaceMode {
  SIMPLE = 'simple',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

interface WorkspaceState {
  satelliteId: string;
  mode: WorkspaceMode;
  availablePasses: Pass[];
  currentAllocations: Allocation[];
  proposedChanges: AllocationChange[];
  selectedPass?: Pass;
  selectedSite?: Site;
  validationErrors: string[];
  isDirty: boolean;
  isSaving: boolean;
  showTimeline: boolean;
  showConflicts: boolean;
  approvalStatus: Map<string, 'approved' | 'rejected' | 'pending'>;
}

interface ReallocationWorkspaceProps {
  opportunity: CollectionOpportunity;
  availableSites: Site[];
  passes: Pass[];
  onSave: (changes: AllocationChange[]) => Promise<void>;
  onClose: () => void;
}

// Reducer for workspace state
type WorkspaceAction =
  | { type: 'SET_MODE'; payload: WorkspaceMode }
  | { type: 'SET_PASSES'; payload: Pass[] }
  | { type: 'SELECT_PASS'; payload: Pass | undefined }
  | { type: 'SELECT_SITE'; payload: Site | undefined }
  | { type: 'ADD_ALLOCATION'; payload: Allocation }
  | { type: 'REMOVE_ALLOCATION'; payload: string }
  | { type: 'MODIFY_ALLOCATION'; payload: { id: string; changes: Partial<Allocation> } }
  | { type: 'SET_VALIDATION_ERRORS'; payload: string[] }
  | { type: 'TOGGLE_TIMELINE' }
  | { type: 'TOGGLE_CONFLICTS' }
  | { type: 'START_SAVE' }
  | { type: 'SAVE_SUCCESS' }
  | { type: 'SAVE_ERROR' }
  | { type: 'RESET_CHANGES' };

const workspaceReducer = (state: WorkspaceState, action: WorkspaceAction): WorkspaceState => {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    
    case 'SET_PASSES':
      return { ...state, availablePasses: action.payload };
    
    case 'SELECT_PASS':
      return { ...state, selectedPass: action.payload };
    
    case 'SELECT_SITE':
      return { ...state, selectedSite: action.payload };
    
    case 'ADD_ALLOCATION': {
      const change: AllocationChange = {
        type: 'add',
        allocation: action.payload,
        reason: 'Manual allocation'
      };
      return {
        ...state,
        proposedChanges: [...state.proposedChanges, change],
        isDirty: true
      };
    }
    
    case 'REMOVE_ALLOCATION': {
      const allocation = state.currentAllocations.find(a => a.passId === action.payload);
      if (allocation) {
        const change: AllocationChange = {
          type: 'remove',
          allocation,
          reason: 'Manual removal'
        };
        return {
          ...state,
          proposedChanges: [...state.proposedChanges, change],
          isDirty: true
        };
      }
      return state;
    }
    
    case 'MODIFY_ALLOCATION': {
      const existing = state.currentAllocations.find(a => a.passId === action.payload.id);
      if (existing) {
        const modified = { ...existing, ...action.payload.changes };
        const change: AllocationChange = {
          type: 'modify',
          allocation: modified,
          reason: 'Manual modification'
        };
        return {
          ...state,
          proposedChanges: [...state.proposedChanges, change],
          isDirty: true
        };
      }
      return state;
    }
    
    case 'SET_VALIDATION_ERRORS':
      return { ...state, validationErrors: action.payload };
    
    case 'TOGGLE_TIMELINE':
      return { ...state, showTimeline: !state.showTimeline };
    
    case 'TOGGLE_CONFLICTS':
      return { ...state, showConflicts: !state.showConflicts };
    
    case 'START_SAVE':
      return { ...state, isSaving: true };
    
    case 'SAVE_SUCCESS':
      return { 
        ...state, 
        isSaving: false, 
        isDirty: false,
        proposedChanges: []
      };
    
    case 'SAVE_ERROR':
      return { ...state, isSaving: false };
    
    case 'RESET_CHANGES':
      return {
        ...state,
        proposedChanges: [],
        isDirty: false,
        validationErrors: []
      };
    
    default:
      return state;
  }
};

const ReallocationWorkspace: React.FC<ReallocationWorkspaceProps> = ({
  opportunity,
  availableSites,
  onSave,
  onClose
}) => {
  const initialState: WorkspaceState = {
    satelliteId: opportunity.satellite.id,
    mode: WorkspaceMode.SIMPLE,
    availablePasses: [],
    currentAllocations: [],
    proposedChanges: [],
    validationErrors: [],
    isDirty: false,
    isSaving: false,
    showTimeline: false,
    showConflicts: false,
    approvalStatus: new Map()
  };

  const [state, dispatch] = useReducer(workspaceReducer, initialState);
  const [filterQuality, setFilterQuality] = useState<string>('all');
  const [filterTimeWindow, setFilterTimeWindow] = useState<number>(24); // hours
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);

  // Load available passes
  useEffect(() => {
    loadAvailablePasses();
  }, [opportunity.satellite.id]);

  const loadAvailablePasses = async () => {
    // Simulate loading passes
    const mockPasses: Pass[] = generateMockPasses(20);
    dispatch({ type: 'SET_PASSES', payload: mockPasses });
  };

  // Generate mock passes for demonstration
  const generateMockPasses = (count: number): Pass[] => {
    const qualities = [5, 4, 3, 2]; // 5=excellent, 4=good, 3=fair, 2=poor
    const now = new Date();
    
    return Array.from({ length: count }, (_, i) => {
      const startTime = new Date(now.getTime() + i * 90 * 60 * 1000); // 90 min intervals
      const duration = 5 + Math.floor(Math.random() * 10); // 5-15 minutes
      
      return {
        id: `pass-${i}`,
        name: `Pass ${i + 1}`,
        startTime,
        endTime: new Date(startTime.getTime() + duration * 60 * 1000),
        duration,
        elevation: 30 + Math.random() * 60, // 30-90 degrees
        azimuth: Math.random() * 360,
        quality: qualities[Math.floor(Math.random() * qualities.length)],
        conflictsWith: Math.random() > 0.7 ? [`pass-${Math.max(0, i - 1)}`] : undefined,
        requiredResources: ['Antenna', 'Recorder', 'Processor'],
        siteCapabilities: [],
        priority: 'normal' as const,
        classificationLevel: 'UNCLASSIFIED' as const
      };
    });
  };

  // Filter passes based on criteria
  const filteredPasses = useMemo(() => {
    let passes = [...state.availablePasses];

    // Quality filter
    if (filterQuality !== 'all') {
      passes = passes.filter(p => p.quality === parseInt(filterQuality));
    }

    // Time window filter
    const cutoff = new Date(Date.now() + filterTimeWindow * 60 * 60 * 1000);
    passes = passes.filter(p => p.startTime <= cutoff);

    // Available filter
    if (showOnlyAvailable) {
      passes = passes.filter(p => {
        // Check if pass is already allocated
        const isAllocated = state.currentAllocations.some(a => a.passId === p.id);
        const isPendingRemoval = state.proposedChanges.some(c => 
          c.type === 'remove' && c.allocation.passId === p.id
        );
        return !isAllocated || isPendingRemoval;
      });
    }

    return passes;
  }, [state.availablePasses, state.currentAllocations, state.proposedChanges, 
      filterQuality, filterTimeWindow, showOnlyAvailable]);

  // Calculate health impact of proposed changes
  const projectedHealth = useMemo(() => {
    // Apply proposed changes to current state
    let projectedAllocations = [...state.currentAllocations];
    
    state.proposedChanges.forEach(change => {
      switch (change.type) {
        case 'add':
          projectedAllocations.push(change.allocation);
          break;
        case 'remove':
          projectedAllocations = projectedAllocations.filter(
            a => a.passId !== change.allocation.passId
          );
          break;
        case 'modify':
          projectedAllocations = projectedAllocations.map(a =>
            a.passId === change.allocation.passId ? change.allocation : a
          );
          break;
      }
    });

    // Calculate new capacity based on allocations
    const newCapacity = Math.min(100, projectedAllocations.length * 15);
    
    const projectedOpportunity: CollectionOpportunity = {
      ...opportunity,
      capacityPercentage: newCapacity
    };

    return calculateOpportunityHealth(projectedOpportunity);
  }, [opportunity, state.currentAllocations, state.proposedChanges]);

  // Handle pass allocation
  const handleAllocatePass = () => {
    if (!state.selectedPass || !state.selectedSite) {
      dispatch({ 
        type: 'SET_VALIDATION_ERRORS', 
        payload: ['Please select both a pass and a site'] 
      });
      return;
    }

    const allocation: Allocation = {
      passId: state.selectedPass.id,
      siteId: state.selectedSite.id,
      priority: opportunity.priority,
      timeSlot: {
        start: state.selectedPass.startTime,
        end: state.selectedPass.endTime
      },
      resources: state.selectedPass.requiredResources || []
    };

    dispatch({ type: 'ADD_ALLOCATION', payload: allocation });
    dispatch({ type: 'SELECT_PASS', payload: undefined });
    dispatch({ type: 'SET_VALIDATION_ERRORS', payload: [] });
  };

  // Handle save
  const handleSave = async () => {
    dispatch({ type: 'START_SAVE' });
    try {
      await onSave(state.proposedChanges);
      dispatch({ type: 'SAVE_SUCCESS' });
      onClose();
    } catch (error) {
      dispatch({ type: 'SAVE_ERROR' });
      dispatch({ 
        type: 'SET_VALIDATION_ERRORS', 
        payload: ['Failed to save changes. Please try again.'] 
      });
    }
  };

  // Auto-optimize allocations
  const handleAutoOptimize = () => {
    // Simple optimization algorithm
    const optimizedPasses = state.availablePasses
      .filter(p => p.quality >= 4) // 4=good, 5=excellent
      .filter(p => !p.conflictsWith || p.conflictsWith.length === 0)
      .slice(0, 5);

    const newAllocations: Allocation[] = optimizedPasses.map((pass, index) => ({
      passId: pass.id,
      siteId: availableSites[index % availableSites.length].id,
      priority: opportunity.priority,
      timeSlot: {
        start: pass.startTime,
        end: pass.endTime
      },
      resources: pass.requiredResources || []
    }));

    // Create change records
    const changes: AllocationChange[] = newAllocations.map(allocation => ({
      type: 'add' as const,
      allocation,
      reason: 'Auto-optimization'
    }));

    dispatch({ type: 'RESET_CHANGES' });
    changes.forEach(change => {
      dispatch({ type: 'ADD_ALLOCATION', payload: change.allocation });
    });
  };

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title={
        <div className="workspace-header">
          <Icon icon={IconNames.FLOWS} />
          <span>Reallocation Workspace: {opportunity.name}</span>
          <div className="workspace-mode-selector">
            <ButtonGroup>
              {Object.values(WorkspaceMode).map(mode => (
                <Button
                  key={mode}
                  small
                  active={state.mode === mode}
                  onClick={() => dispatch({ type: 'SET_MODE', payload: mode })}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Button>
              ))}
            </ButtonGroup>
          </div>
        </div>
      }
      className="reallocation-workspace"
      canEscapeKeyClose={!state.isDirty}
      canOutsideClickClose={!state.isDirty}
      style={{ width: '90vw', maxWidth: '1400px' }}
    >
      <div className={Classes.DIALOG_BODY}>
        <div className="workspace-layout">
          {/* Left Panel - Available Passes */}
          <div className="workspace-panel passes-panel">
            <div className="panel-header">
              <h3>Available Passes</h3>
              <div className="panel-controls">
                <FormGroup label="Quality" inline>
                  <HTMLSelect
                    value={filterQuality}
                    onChange={e => setFilterQuality(e.target.value)}
                    options={[
                      { value: 'all', label: 'All' },
                      { value: 'excellent', label: 'Excellent' },
                      { value: 'good', label: 'Good' },
                      { value: 'fair', label: 'Fair' },
                      { value: 'poor', label: 'Poor' }
                    ]}
                  />
                </FormGroup>
                <FormGroup label="Time Window" inline>
                  <NumericInput
                    value={filterTimeWindow}
                    onValueChange={setFilterTimeWindow}
                    min={1}
                    max={168}
                    rightElement={<Tag minimal>hrs</Tag>}
                  />
                </FormGroup>
                <Switch
                  checked={showOnlyAvailable}
                  onChange={e => setShowOnlyAvailable(e.currentTarget.checked)}
                  label="Available only"
                />
              </div>
            </div>

            <div className="passes-list">
              {filteredPasses.length === 0 ? (
                <NonIdealState
                  icon={IconNames.SATELLITE}
                  title="No passes available"
                  description="Try adjusting your filters"
                />
              ) : (
                filteredPasses.map(pass => (
                  <Card
                    key={pass.id}
                    className={`pass-card ${state.selectedPass?.id === pass.id ? 'selected' : ''}`}
                    interactive
                    onClick={() => dispatch({ type: 'SELECT_PASS', payload: pass })}
                  >
                    <div className="pass-header">
                      <strong>{pass.name}</strong>
                      <Tag 
                        intent={
                          pass.quality === 5 ? Intent.SUCCESS :    // excellent
                          pass.quality === 4 ? Intent.PRIMARY :    // good
                          pass.quality === 3 ? Intent.WARNING :    // fair
                          Intent.NONE                               // poor (1-2)
                        }
                      >
                        {pass.quality === 5 ? 'Excellent' : 
                         pass.quality === 4 ? 'Good' :
                         pass.quality === 3 ? 'Fair' :
                         pass.quality === 2 ? 'Poor' : 'Unknown'}
                      </Tag>
                    </div>
                    <div className="pass-details">
                      <div className="pass-time">
                        <Icon icon={IconNames.TIME} size={12} />
                        <span>
                          {pass.startTime.toLocaleTimeString()} - {pass.endTime.toLocaleTimeString()}
                        </span>
                        <Tag minimal>{pass.duration} min</Tag>
                      </div>
                      <div className="pass-metrics">
                        <Tooltip content={`Elevation: ${pass.elevation?.toFixed(1) || 'N/A'}°`}>
                          <Tag minimal>
                            <Icon icon={IconNames.TRENDING_UP} size={10} />
                            {pass.elevation?.toFixed(0) || 'N/A'}°
                          </Tag>
                        </Tooltip>
                        <Tooltip content={`Azimuth: ${pass.azimuth?.toFixed(1) || 'N/A'}°`}>
                          <Tag minimal>
                            <Icon icon={IconNames.COMPASS} size={10} />
                            {pass.azimuth?.toFixed(0) || 'N/A'}°
                          </Tag>
                        </Tooltip>
                      </div>
                      {pass.conflictsWith && pass.conflictsWith.length > 0 && (
                        <div className="pass-conflicts">
                          <Icon icon={IconNames.WARNING_SIGN} intent={Intent.WARNING} size={12} />
                          <span>Conflicts with {pass.conflictsWith.length} passes</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>

            {state.mode !== WorkspaceMode.SIMPLE && (
              <div className="panel-footer">
                <Button
                  icon={IconNames.LIGHTBULB}
                  intent={Intent.PRIMARY}
                  onClick={handleAutoOptimize}
                  fill
                >
                  Auto-Optimize Selection
                </Button>
              </div>
            )}
          </div>

          {/* Center Panel - Allocation Controls */}
          <div className="workspace-panel allocation-panel">
            <div className="panel-header">
              <h3>Allocation Configuration</h3>
            </div>

            <div className="allocation-content">
              {/* Health Impact Preview */}
              <Card className="health-preview">
                <h4>Projected Health Impact</h4>
                <OpportunityStatusIndicatorEnhanced
                  health={projectedHealth}
                  showDetails={true}
                />
                <div className="health-comparison">
                  <div className="health-metric">
                    <span>Current Score:</span>
                    <strong>{calculateOpportunityHealth(opportunity).score}</strong>
                  </div>
                  <Icon icon={IconNames.ARROW_RIGHT} />
                  <div className="health-metric">
                    <span>Projected Score:</span>
                    <strong className={
                      projectedHealth.score > calculateOpportunityHealth(opportunity).score 
                        ? 'improvement' 
                        : 'decline'
                    }>
                      {projectedHealth.score}
                    </strong>
                  </div>
                </div>
              </Card>

              {/* Site Selection */}
              {state.selectedPass && (
                <Card className="site-selection">
                  <h4>Select Site for {state.selectedPass.name}</h4>
                  <div className="sites-grid">
                    {availableSites.map(site => {
                      const isSelected = state.selectedSite?.id === site.id;
                      const availableCapacity = ((site.capacity - site.allocated) / site.capacity) * 100;
                      
                      return (
                        <Card
                          key={site.id}
                          className={`site-option ${isSelected ? 'selected' : ''}`}
                          interactive
                          onClick={() => dispatch({ type: 'SELECT_SITE', payload: site })}
                        >
                          <div className="site-name">{site.name}</div>
                          <ProgressBar
                            value={1 - availableCapacity / 100}
                            intent={availableCapacity < 20 ? Intent.DANGER : Intent.NONE}
                          />
                          <div className="site-capacity">{availableCapacity.toFixed(0)}% available</div>
                        </Card>
                      );
                    })}
                  </div>

                  <div className="allocation-actions">
                    <Button
                      intent={Intent.PRIMARY}
                      icon={IconNames.ADD}
                      onClick={handleAllocatePass}
                      disabled={!state.selectedSite}
                      fill
                    >
                      Allocate Pass to Site
                    </Button>
                  </div>
                </Card>
              )}

              {/* Advanced Options */}
              {state.mode === WorkspaceMode.ADVANCED || state.mode === WorkspaceMode.EXPERT && (
                <Card className="advanced-options">
                  <h4>Advanced Configuration</h4>
                  <FormGroup label="Priority Override">
                    <HTMLSelect
                      options={['low', 'medium', 'high', 'critical']}
                      value={opportunity.priority}
                    />
                  </FormGroup>
                  <FormGroup label="Resource Allocation">
                    <Switch label="Automatic resource management" defaultChecked />
                    <Switch label="Allow partial allocations" />
                    <Switch label="Enable conflict resolution" />
                  </FormGroup>
                </Card>
              )}

              {/* Validation Errors */}
              {state.validationErrors.length > 0 && (
                <Callout intent={Intent.DANGER} icon={IconNames.ERROR}>
                  {state.validationErrors.map((error, i) => (
                    <div key={i}>{error}</div>
                  ))}
                </Callout>
              )}
            </div>
          </div>

          {/* Right Panel - Current Allocations */}
          <div className="workspace-panel allocations-panel">
            <div className="panel-header">
              <h3>Current Allocations</h3>
              <ButtonGroup>
                <Tooltip content="Timeline View">
                  <Button
                    icon={IconNames.TIMELINE_EVENTS}
                    active={state.showTimeline}
                    onClick={() => dispatch({ type: 'TOGGLE_TIMELINE' })}
                  />
                </Tooltip>
                <Tooltip content="Show Conflicts">
                  <Button
                    icon={IconNames.WARNING_SIGN}
                    active={state.showConflicts}
                    onClick={() => dispatch({ type: 'TOGGLE_CONFLICTS' })}
                  />
                </Tooltip>
              </ButtonGroup>
            </div>

            <div className="allocations-list">
              {state.proposedChanges.length === 0 && state.currentAllocations.length === 0 ? (
                <NonIdealState
                  icon={IconNames.INBOX}
                  title="No allocations"
                  description="Select passes and sites to create allocations"
                />
              ) : (
                <>
                  {/* Proposed Changes */}
                  {state.proposedChanges.map((change, index) => (
                    <Card 
                      key={index} 
                      className={`allocation-change ${change.type}`}
                    >
                      <div className="change-header">
                        <Icon 
                          icon={
                            change.type === 'add' ? IconNames.ADD :
                            change.type === 'remove' ? IconNames.REMOVE :
                            IconNames.EDIT
                          }
                          intent={
                            change.type === 'add' ? Intent.SUCCESS :
                            change.type === 'remove' ? Intent.DANGER :
                            Intent.PRIMARY
                          }
                        />
                        <span className="change-type">
                          {change.type === 'add' ? 'New Allocation' :
                           change.type === 'remove' ? 'Remove Allocation' :
                           'Modify Allocation'}
                        </span>
                      </div>
                      <div className="change-details">
                        <div>Pass: {state.availablePasses.find(p => p.id === change.allocation.passId)?.name}</div>
                        <div>Site: {availableSites.find(s => s.id === change.allocation.siteId)?.name}</div>
                        <div>Reason: {change.reason}</div>
                      </div>
                    </Card>
                  ))}

                  {/* Current Allocations */}
                  {state.currentAllocations.map(allocation => (
                    <Card key={allocation.passId} className="current-allocation">
                      <div className="allocation-header">
                        <span>{state.availablePasses.find(p => p.id === allocation.passId)?.name}</span>
                        <Button
                          minimal
                          small
                          icon={IconNames.CROSS}
                          intent={Intent.DANGER}
                          onClick={() => dispatch({ 
                            type: 'REMOVE_ALLOCATION', 
                            payload: allocation.passId 
                          })}
                        />
                      </div>
                      <div className="allocation-details">
                        <div>Site: {availableSites.find(s => s.id === allocation.siteId)?.name}</div>
                        <div>Priority: {allocation.priority}</div>
                      </div>
                    </Card>
                  ))}
                </>
              )}
            </div>

            <div className="panel-footer">
              <div className="changes-summary">
                <Tag large intent={Intent.PRIMARY}>
                  {state.proposedChanges.length} pending changes
                </Tag>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button onClick={onClose} disabled={state.isSaving}>
            Cancel
          </Button>
          {state.isDirty && (
            <Button
              onClick={() => dispatch({ type: 'RESET_CHANGES' })}
              disabled={state.isSaving}
            >
              Reset Changes
            </Button>
          )}
          <Button
            intent={Intent.PRIMARY}
            onClick={handleSave}
            disabled={!state.isDirty || state.isSaving}
            loading={state.isSaving}
          >
            Apply Changes ({state.proposedChanges.length})
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default ReallocationWorkspace;