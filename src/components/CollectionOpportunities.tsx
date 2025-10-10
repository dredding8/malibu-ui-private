import React, { useState, useMemo, useCallback, useReducer, useEffect } from 'react';
import {
  Cell,
  Column,
  Table,
  SelectionModes,
} from '@blueprintjs/table';
import {
  Button,
  Tag,
  Intent,
  Checkbox,
  Menu,
  MenuItem,
  Popover,
  Position,
  Tooltip,
  Callout,
  ProgressBar,
  Card,
  Elevation,
  Icon,
  NonIdealState,
  Divider,
  AnchorButton,
  ButtonGroup,
  FormGroup,
  NumericInput,
  Switch,
  HTMLSelect,
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { Classes } from '@blueprintjs/core';
import {
  CollectionOpportunity,
  OpportunityStatus,
  OpportunityManagementState,
  OpportunityChange,
  SortConfig,
  FilterConfig,
  Priority,
} from '../types/collectionOpportunities';
import EditOpportunityModal from './EditOpportunityModal';
import OpportunityStatusIndicator from './OpportunityStatusIndicator';
import OverrideModal, { OverrideData } from './OverrideModal';
import './CollectionOpportunities.css';
import ErrorBoundary from './ErrorBoundary';

interface CollectionOpportunitiesProps {
  opportunities: CollectionOpportunity[];
  onBatchUpdate: (changes: OpportunityChange[]) => Promise<void>;
  capacityThresholds?: {
    critical: number;
    warning: number;
    optimal: number;
  };
  enableRealTimeValidation?: boolean;
  userPreferences?: {
    compactMode?: boolean;
    showGuidance?: boolean;
    autoSave?: boolean;
  };
}

// Action types for reducer
type ActionType =
  | { type: 'SET_DATA'; payload: CollectionOpportunity[] }
  | { type: 'EDIT_OPPORTUNITY'; payload: { id: string; changes: Partial<CollectionOpportunity> } }
  | { type: 'SET_EDITING'; payload: string | undefined }
  | { type: 'SET_SELECTED'; payload: Set<string> }
  | { type: 'SET_SORT'; payload: SortConfig }
  | { type: 'SET_FILTER'; payload: FilterConfig }
  | { type: 'COMMIT_START' }
  | { type: 'COMMIT_SUCCESS'; payload: string[] }
  | { type: 'COMMIT_FAILURE'; payload: Error }
  | { type: 'UNDO_CHANGE'; payload: string }
  | { type: 'CLEAR_CHANGES' };

// Reducer for state management
const opportunityReducer = (
  state: OpportunityManagementState,
  action: ActionType
): OpportunityManagementState => {
  switch (action.type) {
    case 'SET_DATA':
      return {
        ...state,
        originalData: action.payload,
        workingData: action.payload,
      };

    case 'EDIT_OPPORTUNITY': {
      const { id, changes } = action.payload;
      const workingData = state.workingData.map(opp =>
        opp.id === id ? { ...opp, ...changes } : opp
      );

      // Track change
      const change: OpportunityChange = {
        opportunityId: id,
        changes,
        timestamp: new Date().toISOString(),
        previousValues: state.originalData.find(o => o.id === id),
      };

      const pendingChanges = new Map(state.pendingChanges);
      pendingChanges.set(id, change);

      return {
        ...state,
        workingData,
        pendingChanges,
      };
    }

    case 'SET_EDITING':
      return { ...state, editingOpportunityId: action.payload };

    case 'SET_SELECTED':
      return { ...state, selectedRows: action.payload };

    case 'SET_SORT':
      return {
        ...state,
        sortColumn: action.payload.column,
        sortDirection: action.payload.direction,
      };

    case 'SET_FILTER':
      return { ...state, filter: action.payload };

    case 'COMMIT_START':
      return { ...state, isCommitting: true };

    case 'COMMIT_SUCCESS':
      // Update original data with committed changes
      const updatedOriginal = state.workingData.filter(opp =>
        action.payload.includes(opp.id)
      );
      return {
        ...state,
        originalData: updatedOriginal,
        pendingChanges: new Map(),
        isCommitting: false,
      };

    case 'COMMIT_FAILURE':
      return {
        ...state,
        isCommitting: false,
        validationErrors: [],
      };

    case 'UNDO_CHANGE': {
      const pendingChanges = new Map(state.pendingChanges);
      pendingChanges.delete(action.payload);
      
      // Restore original value
      const original = state.originalData.find(o => o.id === action.payload);
      const workingData = state.workingData.map(opp =>
        opp.id === action.payload && original ? original : opp
      );

      return { ...state, workingData, pendingChanges };
    }

    case 'CLEAR_CHANGES':
      return {
        ...state,
        workingData: state.originalData,
        pendingChanges: new Map(),
      };

    default:
      return state;
  }
};

const CollectionOpportunities: React.FC<CollectionOpportunitiesProps> = ({
  opportunities,
  onBatchUpdate,
  capacityThresholds = { critical: 10, warning: 30, optimal: 70 },
  enableRealTimeValidation = true,
  userPreferences = { compactMode: false, showGuidance: true, autoSave: false },
}) => {
  const initialState: OpportunityManagementState = {
    originalData: opportunities,
    workingData: opportunities,
    pendingChanges: new Map(),
    validationErrors: [],
    selectedRows: new Set(),
    isCommitting: false,
  };

  const [state, dispatch] = useReducer(opportunityReducer, initialState);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedOpportunityForOverride, setSelectedOpportunityForOverride] = useState<CollectionOpportunity | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showWelcome, setShowWelcome] = useState(() => {
    const hasSeenWelcome = localStorage.getItem('opportunities_welcome_seen');
    return !hasSeenWelcome && userPreferences.showGuidance;
  });
  const [expandedInfo, setExpandedInfo] = useState<Set<string>>(new Set());
  const [recentActions, setRecentActions] = useState<string[]>([]);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  // Auto-save effect
  useEffect(() => {
    if (userPreferences.autoSave && state.pendingChanges.size > 0) {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      const timer = setTimeout(() => {
        handleCommitChanges();
        addRecentAction('Auto-saved changes');
      }, 30000); // Auto-save after 30 seconds of inactivity
      setAutoSaveTimer(timer);
    }
    return () => {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
    };
  }, [state.pendingChanges, userPreferences.autoSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's': // Save
            e.preventDefault();
            if (state.pendingChanges.size > 0) handleCommitChanges();
            break;
          case 'z': // Undo
            e.preventDefault();
            if (state.pendingChanges.size > 0) {
              const lastChange = Array.from(state.pendingChanges.entries()).pop();
              if (lastChange) dispatch({ type: 'UNDO_CHANGE', payload: lastChange[0] });
            }
            break;
          case '/': // Search/filter
            e.preventDefault();
            setFilterMenuOpen(true);
            break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [state.pendingChanges]);

  const addRecentAction = useCallback((action: string) => {
    setRecentActions(prev => [action, ...prev.slice(0, 4)]);
  }, []);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let data = [...state.workingData];

    // Apply filters
    if (state.filter) {
      data = data.filter(opp => {
        if (state.filter?.status && state.filter.status.length > 0) {
          if (!state.filter.status.includes(opp.status)) return false;
        }
        if (state.filter?.function && state.filter.function.length > 0) {
          if (!state.filter.function.includes(opp.satellite.function)) return false;
        }
        if (state.filter?.orbit && state.filter.orbit.length > 0) {
          if (!state.filter.orbit.includes(opp.satellite.orbit)) return false;
        }
        if (state.filter?.capacityRange) {
          const [min, max] = state.filter.capacityRange;
          if (opp.capacityPercentage < min || opp.capacityPercentage > max) return false;
        }
        if (state.filter?.priority && state.filter.priority.length > 0) {
          if (!state.filter.priority.includes(opp.priority as Priority)) return false;
        }
        return true;
      });
    }

    // Apply sorting
    if (state.sortColumn) {
      data.sort((a, b) => {
        const aVal = a[state.sortColumn as keyof CollectionOpportunity];
        const bVal = b[state.sortColumn as keyof CollectionOpportunity];
        
        if (aVal === undefined || bVal === undefined) return 0;
        if (aVal < bVal) return state.sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return state.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [state.workingData, state.filter, state.sortColumn, state.sortDirection]);

  // Calculate opportunity health score
  const getOpportunityHealth = useCallback((opportunity: CollectionOpportunity) => {
    let score = 100;
    if (opportunity.capacityPercentage < capacityThresholds.critical) score -= 40;
    else if (opportunity.capacityPercentage < capacityThresholds.warning) score -= 20;
    if (opportunity.conflicts.length > 0) score -= opportunity.conflicts.length * 10;
    if (opportunity.priority === 'critical' && opportunity.capacityPercentage < 50) score -= 20;
    return Math.max(0, Math.min(100, score));
  }, [capacityThresholds]);

  // Get contextual guidance
  const getContextualGuidance = useCallback((opportunity: CollectionOpportunity) => {
    const health = getOpportunityHealth(opportunity);
    if (health < 30) return 'Critical: Immediate action required to prevent collection failure';
    if (health < 60) return 'Warning: Consider reallocating resources to improve reliability';
    if (opportunity.alternativeOptions?.length) return 'Tip: Alternative sites available for better coverage';
    return 'Healthy: Operating within normal parameters';
  }, [getOpportunityHealth]);

  // Status cell renderer with indicator
  const statusCellRenderer = (rowIndex: number) => {
    const opportunity = filteredAndSortedData[rowIndex];
    const hasChanges = state.pendingChanges.has(opportunity?.id || '');
    const health = getOpportunityHealth(opportunity);

    return (
      <Cell>
        <div className="status-cell">
          <OpportunityStatusIndicator 
            status={opportunity?.status || 'optimal'} 
            capacity={opportunity?.capacityPercentage || 0}
            conflicts={opportunity?.conflicts || []}
          />
          {hasChanges && (
            <Tooltip content="Modified - changes will be saved">
              <Tag minimal intent={Intent.PRIMARY} icon={IconNames.ASTERISK}>*</Tag>
            </Tooltip>
          )}
          {/* Temporarily commented for design exploration
          {health < 60 && userPreferences.showGuidance && (
            <Tooltip content={getContextualGuidance(opportunity)}>
              <span className="bp5-icon bp5-icon-help" style={{ fontSize: 12, marginLeft: 4, color: health < 30 ? '#DB3737' : '#D9822B' }} />
            </Tooltip>
          )} */}
        </div>
      </Cell>
    );
  };

  // Name cell renderer - clickable for override modal
  const nameCellRenderer = (rowIndex: number) => {
    const opportunity = filteredAndSortedData[rowIndex];
    return (
      <Cell>
        <Tooltip content="Click to open manual override" position="top">
          <div 
            className="opportunity-name-cell"
            onClick={() => handleOpenOverrideModal(opportunity)}
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleOpenOverrideModal(opportunity);
              }
            }}
          >
            <strong>{opportunity?.name}</strong>
          </div>
        </Tooltip>
      </Cell>
    );
  };

  // Satellite info cell renderer
  const satelliteCellRenderer = (rowIndex: number) => {
    const opportunity = filteredAndSortedData[rowIndex];
    return (
      <Cell>
        <div className="satellite-info">
          <div>{opportunity?.satellite.name}</div>
          <small className={Classes.TEXT_MUTED}>
            {opportunity?.satellite.function} | {opportunity?.satellite.orbit}
          </small>
        </div>
      </Cell>
    );
  };

  // Priority cell renderer
  const priorityCellRenderer = (rowIndex: number) => {
    const opportunity = filteredAndSortedData[rowIndex];
    const priorityIntents: Record<Priority, Intent> = {
      low: Intent.NONE,
      medium: Intent.PRIMARY,
      high: Intent.WARNING,
      critical: Intent.DANGER,
    };

    return (
      <Cell>
        <Tag intent={priorityIntents[opportunity?.priority || 'low']}>
          {opportunity?.priority.toUpperCase()}
        </Tag>
      </Cell>
    );
  };

  // Capacity cell renderer
  const capacityCellRenderer = (rowIndex: number) => {
    const opportunity = filteredAndSortedData[rowIndex];
    const capacity = opportunity?.capacityPercentage || 0;
    
    let intentClass = 'SUCCESS';
    let helpText = '';
    if (capacity < capacityThresholds.critical) {
      intentClass = 'DANGER';
      helpText = 'Critical capacity - immediate action required';
    } else if (capacity < capacityThresholds.warning) {
      intentClass = 'WARNING';
      helpText = 'Low capacity - consider reallocating resources';
    } else {
      helpText = 'Healthy capacity';
    }

    return (
      <Cell>
        <Tooltip content={helpText} position={Position.TOP}>
          <div className="capacity-cell">
            <div className="capacity-bar-container">
              <div 
                className={`capacity-bar capacity-${intentClass}`}
                style={{ width: `${capacity}%` }}
              />
            </div>
            <span className={`capacity-text ${Classes.TEXT_MUTED}`}>
              {capacity.toFixed(1)}%
            </span>
          </div>
        </Tooltip>
      </Cell>
    );
  };

  // Sites cell renderer
  const sitesCellRenderer = (rowIndex: number) => {
    const opportunity = filteredAndSortedData[rowIndex];
    const siteCount = opportunity?.sites.length || 0;
    const totalCapacity = opportunity?.sites.reduce((sum, site) => sum + site.capacity, 0) || 0;

    return (
      <Cell>
        <div>
          <div>{siteCount} sites</div>
          <small className={Classes.TEXT_MUTED}>
            {totalCapacity} total capacity
          </small>
        </div>
      </Cell>
    );
  };

  // Actions cell renderer
  const actionsCellRenderer = (rowIndex: number) => {
    const opportunity = filteredAndSortedData[rowIndex];
    if (!opportunity) return <Cell />;

    const actionMenu = (
      <Menu>
        <MenuItem
          icon={IconNames.MANUALLY_ENTERED_DATA}
          text="Manual Override"
          onClick={() => handleOpenOverrideModal(opportunity)}
        />
        <MenuItem
          icon={IconNames.DUPLICATE}
          text="Duplicate"
          onClick={() => handleDuplicate(opportunity.id)}
        />
        <MenuItem
          icon={IconNames.HISTORY}
          text="View History"
          onClick={() => handleViewHistory(opportunity.id)}
        />
        <MenuItem
          icon={IconNames.TRASH}
          text="Delete"
          intent={Intent.DANGER}
          onClick={() => handleDelete(opportunity.id)}
        />
      </Menu>
    );

    return (
      <Cell>
        <div className="actions-cell">
          <Tooltip content="Edit opportunity">
            <Button
              minimal
              small
              icon={IconNames.EDIT}
              onClick={() => handleEdit(opportunity.id)}
              aria-label={`Edit ${opportunity.name}`}
            />
          </Tooltip>
          
          <Popover content={actionMenu} position={Position.LEFT}>
            <Button
              minimal
              small
              icon={IconNames.MORE}
              aria-label={`More actions for ${opportunity.name}`}
            />
          </Popover>
        </div>
      </Cell>
    );
  };

  // Checkbox cell renderer
  const checkboxCellRenderer = (rowIndex: number) => {
    const opportunity = filteredAndSortedData[rowIndex];
    if (!opportunity) return <Cell />;

    return (
      <Cell>
        <Checkbox
          checked={state.selectedRows.has(opportunity.id)}
          onChange={(e) => handleRowSelection(opportunity.id, e.currentTarget.checked)}
          aria-label={`Select ${opportunity.name}`}
        />
      </Cell>
    );
  };

  // Handler functions
  const handleEdit = (opportunityId: string) => {
    dispatch({ type: 'SET_EDITING', payload: opportunityId });
    setShowEditModal(true);
  };

  const handleSaveEdit = (opportunityId: string, changes: Partial<CollectionOpportunity>) => {
    dispatch({ type: 'EDIT_OPPORTUNITY', payload: { id: opportunityId, changes } });
    setShowEditModal(false);
  };

  const handleDuplicate = (opportunityId: string) => {
    console.log('Duplicate opportunity:', opportunityId);
    // Implementation would create a copy of the opportunity
  };

  const handleViewHistory = (opportunityId: string) => {
    console.log('View history for:', opportunityId);
    // Navigate to history view
  };

  const handleDelete = (opportunityId: string) => {
    const opportunity = state.workingData.find(o => o.id === opportunityId);
    if (!opportunity) return;

    // Use a more sophisticated confirmation for critical items
    const message = opportunity.priority === 'critical'
      ? `This is a CRITICAL priority opportunity. Deleting "${opportunity.name}" may impact mission operations. Are you absolutely sure?`
      : `Delete opportunity "${opportunity.name}"? This action cannot be undone.`;

    if (confirm(message)) {
      console.log('Delete opportunity:', opportunityId);
      addRecentAction(`Scheduled deletion: ${opportunity.name}`);
      // Implementation would mark for deletion in next batch update
    }
  };

  const handleRowSelection = (opportunityId: string, checked: boolean) => {
    const newSelection = new Set(state.selectedRows);
    if (checked) {
      newSelection.add(opportunityId);
    } else {
      newSelection.delete(opportunityId);
    }
    dispatch({ type: 'SET_SELECTED', payload: newSelection });
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelection = checked
      ? new Set(filteredAndSortedData.map(o => o.id))
      : new Set<string>();
    dispatch({ type: 'SET_SELECTED', payload: newSelection });
  };

  const handleCommitChanges = async () => {
    if (state.pendingChanges.size === 0) return;

    dispatch({ type: 'COMMIT_START' });
    try {
      const changes = Array.from(state.pendingChanges.values());
      await onBatchUpdate(changes);
      dispatch({ type: 'COMMIT_SUCCESS', payload: changes.map(c => c.opportunityId) });
      addRecentAction(`Successfully updated ${changes.length} opportunities`);
      
      // Show success feedback
      const successToast = document.createElement('div');
      successToast.className = 'bp5-toast bp5-intent-success';
      successToast.innerHTML = `<span class="bp5-icon bp5-icon-tick"></span> ${changes.length} opportunities updated successfully`;
      document.body.appendChild(successToast);
      setTimeout(() => successToast.remove(), 3000);
    } catch (error) {
      dispatch({ type: 'COMMIT_FAILURE', payload: error as Error });
      addRecentAction('Failed to save changes');
    }
  };

  const handleSort = (column: keyof CollectionOpportunity) => {
    const newDirection = 
      state.sortColumn === column && state.sortDirection === 'asc' 
        ? 'desc' 
        : 'asc';
    
    dispatch({ 
      type: 'SET_SORT', 
      payload: { column, direction: newDirection } 
    });
  };

  const handleOpenOverrideModal = (opportunity: CollectionOpportunity) => {
    setSelectedOpportunityForOverride(opportunity);
    setShowOverrideModal(true);
  };

  const handleSaveOverride = async (overrideData: OverrideData) => {
    if (!selectedOpportunityForOverride) return;

    // Convert override data to opportunity changes
    const updatedSites = overrideData.siteAllocations.map(allocation => ({
      id: allocation.siteId,
      name: allocation.siteName,
      location: { lat: 0, lon: 0 }, // Would come from actual site data
      capacity: allocation.capacity,
      allocated: allocation.allocated + allocation.passes,
    }));

    const changes: Partial<CollectionOpportunity> = {
      sites: updatedSites,
      priority: overrideData.priority,
      notes: `Override: ${overrideData.justification}`,
      lastModified: new Date().toISOString(),
      modifiedBy: 'Manual Override',
    };

    await onBatchUpdate([{
      opportunityId: selectedOpportunityForOverride.id,
      changes,
      timestamp: new Date().toISOString(),
    }]);

    setShowOverrideModal(false);
    setSelectedOpportunityForOverride(null);
  };

  const editingOpportunity = state.workingData.find(o => o.id === state.editingOpportunityId);

  return (
    <div className="collection-opportunities">
      {/* Welcome message for first-time users */}
      {showWelcome && (
        <Card elevation={Elevation.TWO} className="welcome-card mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="mb-2">Welcome to Collection Management</h3>
              <p className="mb-3">This interface helps you manage satellite collection resources efficiently. Here are some tips:</p>
              <ul className="list-disc ml-5">
                <li>Click on opportunity names for detailed manual overrides</li>
                <li>Use <kbd>Ctrl+S</kbd> to save changes quickly</li>
                <li>Watch for help indicators for contextual guidance</li>
                <li>Changes are validated in real-time to prevent conflicts</li>
              </ul>
            </div>
            <Button
              minimal
              icon={IconNames.CROSS}
              onClick={() => {
                setShowWelcome(false);
                localStorage.setItem('opportunities_welcome_seen', 'true');
              }}
              aria-label="Dismiss welcome message"
            />
          </div>
        </Card>
      )}

      {/* Quick stats overview */}
      <div className="stats-overview mb-4">
        <Card className="stat-card" elevation={Elevation.ONE}>
          <div className="stat-content">
            <span className="bp5-icon bp5-icon-satellite" style={{ fontSize: 20, marginBottom: 8 }} />
            <div className="stat-value">{filteredAndSortedData.length}</div>
            <div className="stat-label">Total Opportunities</div>
          </div>
        </Card>
        <Card className="stat-card" elevation={Elevation.ONE}>
          <div className="stat-content">
            <span className="bp5-icon bp5-icon-warning-sign" style={{ fontSize: 20, marginBottom: 8, color: '#D9822B' }} />
            <div className="stat-value">
              {filteredAndSortedData.filter(o => o.status === 'warning' || o.status === 'critical').length}
            </div>
            <div className="stat-label">Need Attention</div>
          </div>
        </Card>
        <Card className="stat-card" elevation={Elevation.ONE}>
          <div className="stat-content">
            <span className="bp5-icon bp5-icon-updated" style={{ fontSize: 20, marginBottom: 8, color: '#2B95D6' }} />
            <div className="stat-value">{state.pendingChanges.size}</div>
            <div className="stat-label">Pending Changes</div>
          </div>
        </Card>
        <Card className="stat-card" elevation={Elevation.ONE}>
          <div className="stat-content">
            <ProgressBar
              value={filteredAndSortedData.reduce((acc, o) => acc + o.capacityPercentage, 0) / Math.max(filteredAndSortedData.length, 1) / 100}
              intent={Intent.SUCCESS}
              stripes={false}
              animate={false}
            />
            <div className="stat-label mt-2">Avg. Capacity</div>
          </div>
        </Card>
      </div>

      {/* Header with actions */}
      <div className="opportunities-header">
        <div className="header-left">
          <h2>Collection Opportunities</h2>
          <span className={Classes.TEXT_MUTED}>
            {state.filter ? 'Filtered view • ' : ''}
            {recentActions.length > 0 && (
              <span className="text-green-600">
                <span className="bp5-icon bp5-icon-tick" style={{ fontSize: 12 }} /> {recentActions[0]}
              </span>
            )}
          </span>
        </div>
        
        <div className="header-actions">
          {/* View toggle */}
          <ButtonGroup minimal>
            <Tooltip content="Table view">
              <Button
                icon={IconNames.TH}
                active={viewMode === 'table'}
                onClick={() => setViewMode('table')}
              />
            </Tooltip>
            <Tooltip content="Card view (coming soon)">
              <Button
                icon={IconNames.GRID_VIEW}
                active={viewMode === 'cards'}
                onClick={() => setViewMode('cards')}
                disabled
              />
            </Tooltip>
          </ButtonGroup>

          <Divider />

          {state.pendingChanges.size > 0 && (
            <>
              <Button
                minimal
                onClick={() => {
                  dispatch({ type: 'CLEAR_CHANGES' });
                  addRecentAction('Changes discarded');
                }}
                disabled={state.isCommitting}
              >
                Cancel Changes
              </Button>
              <Button
                intent={Intent.PRIMARY}
                onClick={handleCommitChanges}
                loading={state.isCommitting}
                icon={IconNames.CLOUD_UPLOAD}
              >
                Save Changes ({state.pendingChanges.size})
              </Button>
            </>
          )}
          
          <Popover
            content={
              <Menu>
                <MenuItem
                  text="Select All"
                  onClick={() => handleSelectAll(true)}
                />
                <MenuItem
                  text="Clear Selection"
                  onClick={() => handleSelectAll(false)}
                  disabled={state.selectedRows.size === 0}
                />
              </Menu>
            }
            position={Position.BOTTOM}
          >
            <Button
              minimal
              icon={IconNames.SELECTION}
              rightIcon={IconNames.CARET_DOWN}
            />
          </Popover>
          
          <Popover
            isOpen={filterMenuOpen}
            onInteraction={(state) => setFilterMenuOpen(state)}
            content={
              <div className="filter-menu" style={{ padding: '20px', minWidth: '300px' }}>
                <h4 className="mb-3">Filter Opportunities</h4>
                
                <FormGroup label="Status" className="mb-3">
                  <ButtonGroup fill>
                    <Button
                      outlined
                      active={!state.filter?.status || state.filter.status.length === 0}
                      onClick={() => dispatch({ type: 'SET_FILTER', payload: { ...state.filter, status: [] } })}
                    >
                      All
                    </Button>
                    <Button
                      outlined
                      intent={Intent.SUCCESS}
                      active={state.filter?.status?.includes('optimal')}
                      onClick={() => {
                        const newStatus = state.filter?.status?.includes('optimal')
                          ? state.filter.status.filter(s => s !== 'optimal')
                          : [...(state.filter?.status || []), 'optimal'];
                        dispatch({ type: 'SET_FILTER', payload: { ...state.filter, status: newStatus as OpportunityStatus[] } });
                      }}
                    >
                      Optimal
                    </Button>
                    <Button
                      outlined
                      intent={Intent.WARNING}
                      active={state.filter?.status?.includes('warning')}
                      onClick={() => {
                        const newStatus = state.filter?.status?.includes('warning')
                          ? state.filter.status.filter(s => s !== 'warning')
                          : [...(state.filter?.status || []), 'warning'];
                        dispatch({ type: 'SET_FILTER', payload: { ...state.filter, status: newStatus as OpportunityStatus[] } });
                      }}
                    >
                      Warning
                    </Button>
                    <Button
                      outlined
                      intent={Intent.DANGER}
                      active={state.filter?.status?.includes('critical')}
                      onClick={() => {
                        const newStatus = state.filter?.status?.includes('critical')
                          ? state.filter.status.filter(s => s !== 'critical')
                          : [...(state.filter?.status || []), 'critical'];
                        dispatch({ type: 'SET_FILTER', payload: { ...state.filter, status: newStatus as OpportunityStatus[] } });
                      }}
                    >
                      Critical
                    </Button>
                  </ButtonGroup>
                </FormGroup>

                <FormGroup label="Priority" className="mb-3">
                  <HTMLSelect
                    fill
                    value={state.filter?.priority?.[0] || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      dispatch({
                        type: 'SET_FILTER',
                        payload: {
                          ...state.filter,
                          priority: value ? [value as Priority] : []
                        }
                      });
                    }}
                  >
                    <option value="">All priorities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </HTMLSelect>
                </FormGroup>

                <div className="flex justify-between mt-4">
                  <Button
                    minimal
                    onClick={() => {
                      dispatch({ type: 'SET_FILTER', payload: {} });
                      addRecentAction('Filters cleared');
                    }}
                  >
                    Clear Filters
                  </Button>
                  <Button
                    intent={Intent.PRIMARY}
                    onClick={() => {
                      setFilterMenuOpen(false);
                      addRecentAction('Filters applied');
                    }}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            }
            position={Position.BOTTOM}
          >
            <Button
              minimal
              icon={IconNames.FILTER}
              rightIcon={IconNames.CARET_DOWN}
              onClick={() => setFilterMenuOpen(true)}
              intent={state.filter && Object.keys(state.filter).length > 0 ? Intent.PRIMARY : Intent.NONE}
            />
          </Popover>
        </div>
      </div>

      {/* Changes summary */}
      {state.pendingChanges.size > 0 && (
        <Callout 
          intent={Intent.PRIMARY} 
          icon={IconNames.INFO_SIGN}
          className="changes-summary"
        >
          <div className="flex justify-between items-center">
            <div>
              <strong>{state.pendingChanges.size} changes pending.</strong> Your changes are validated in real-time and will be saved when you click "Save Changes".
              {userPreferences.autoSave && <span className="ml-2 text-green-600">Auto-save enabled</span>}
            </div>
            <div className="flex gap-2">
              <Button
                minimal={true}
                small
                onClick={() => {
                  const changes = Array.from(state.pendingChanges.entries());
                  console.log('Pending changes:', changes);
                }}
              >
                Review Changes
              </Button>
            </div>
          </div>
        </Callout>
      )}

      {/* Data table with error boundary for safety */}
      <ErrorBoundary fallback={
        <Callout intent={Intent.WARNING} icon={IconNames.WARNING_SIGN}>
          Table component error. Please refresh the page.
        </Callout>
      }>
        <Table
          numRows={filteredAndSortedData.length}
          enableRowHeader={false}
          enableColumnHeader={true}
          enableRowReordering={false}
          enableColumnReordering={true}
          enableRowResizing={false}
          enableColumnResizing={true}
          enableFocusedCell={true}
          selectionModes={SelectionModes.ROWS_ONLY}
          className="opportunities-table"
        >
        <Column
          name=""
          cellRenderer={checkboxCellRenderer}
          columnHeaderCellRenderer={() => (
            <Checkbox
              checked={state.selectedRows.size === filteredAndSortedData.length && filteredAndSortedData.length > 0}
              indeterminate={state.selectedRows.size > 0 && state.selectedRows.size < filteredAndSortedData.length}
              onChange={(e) => handleSelectAll(e.currentTarget.checked)}
              aria-label="Select all opportunities"
            />
          )}
        />
        <Column
          name="Status"
          cellRenderer={statusCellRenderer}
          columnHeaderCellRenderer={() => (
            <div 
              className="sortable-header" 
              onClick={() => handleSort('status')}
              role="button"
              tabIndex={0}
            >
              Status {state.sortColumn === 'status' && 
                <span className={`bp5-icon bp5-icon-chevron-${state.sortDirection === 'asc' ? 'up' : 'down'}`} />
              }
            </div>
          )}
        />
        <Column name="Opportunity Name" cellRenderer={nameCellRenderer} />
        <Column name="Satellite" cellRenderer={satelliteCellRenderer} />
        <Column name="Priority" cellRenderer={priorityCellRenderer} />
        <Column name="Capacity" cellRenderer={capacityCellRenderer} />
        <Column name="Sites" cellRenderer={sitesCellRenderer} />
        <Column name="Actions" cellRenderer={actionsCellRenderer} />
        </Table>
      </ErrorBoundary>

      {/* Empty state */}
      {filteredAndSortedData.length === 0 && (
        <NonIdealState
          icon="satellite"
          title="No opportunities found"
          description={state.filter && Object.keys(state.filter).length > 0
            ? "Try adjusting your filters to see more opportunities."
            : "No collection opportunities are currently available."}
          action={
            state.filter && Object.keys(state.filter).length > 0 ? (
              <Button
                outlined
                icon={IconNames.FILTER_REMOVE}
                onClick={() => {
                  dispatch({ type: 'SET_FILTER', payload: {} });
                  addRecentAction('Filters cleared');
                }}
              >
                Clear Filters
              </Button>
            ) : undefined
          }
        />
      )}

      {/* Edit modal */}
      {showEditModal && editingOpportunity && (
        <EditOpportunityModal
          isOpen={showEditModal}
          opportunity={editingOpportunity}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveEdit}
          capacityThresholds={capacityThresholds}
          enableRealTimeValidation={enableRealTimeValidation}
        />
      )}

      {/* Override modal */}
      {showOverrideModal && selectedOpportunityForOverride && (
        <OverrideModal
          isOpen={showOverrideModal}
          satellite={selectedOpportunityForOverride.satellite}
          opportunity={selectedOpportunityForOverride}
          currentAllocations={selectedOpportunityForOverride.sites.map(site => ({
            siteId: site.id,
            siteName: site.name,
            passes: Math.floor((site.allocated / site.capacity) * 10), // Mock calculation
            capacity: site.capacity,
            allocated: site.allocated,
            availableCapacity: site.capacity - site.allocated,
          }))}
          availableSites={[
            // In real implementation, this would come from props or API
            { id: 'site1', name: 'Site Alpha', location: { lat: 0, lon: 0 }, capacity: 100, allocated: 50 },
            { id: 'site2', name: 'Site Beta', location: { lat: 10, lon: 10 }, capacity: 150, allocated: 75 },
            { id: 'site3', name: 'Site Gamma', location: { lat: 20, lon: 20 }, capacity: 200, allocated: 100 },
            { id: 'site4', name: 'Site Delta', location: { lat: 30, lon: 30 }, capacity: 120, allocated: 60 },
            { id: 'site5', name: 'Site Epsilon', location: { lat: 40, lon: 40 }, capacity: 180, allocated: 90 },
            ...selectedOpportunityForOverride.sites,
          ]}
          onClose={() => {
            setShowOverrideModal(false);
            setSelectedOpportunityForOverride(null);
          }}
          onSave={handleSaveOverride}
          capacityThresholds={capacityThresholds}
          enableUndoRedo={true}
          maxPasses={10}
        />
      )}
    </div>
  );
};

export default CollectionOpportunities;