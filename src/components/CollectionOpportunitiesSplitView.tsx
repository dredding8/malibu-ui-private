import React, { useState, useReducer, useCallback, useMemo, useRef, useEffect } from 'react';
import { debounce } from 'lodash';
import { SmartTooltip, ContextAwareTooltip } from './shared/SmartTooltip';
import { ProgressiveDisclosure, AllocationStatusDisclosure } from './shared/ProgressiveDisclosure';
import { ContextualBreadcrumbs, useBreadcrumbs, BREADCRUMB_PRESETS } from './shared/Breadcrumbs';
import {
    useMemoizedHealthScores,
    useDebouncedSearch,
    useOptimizedFiltering,
    AUTO_SIZED_COLUMNS
} from '../hooks/collections/useCollectionPerformance';
import {
    showSuccessToast,
    showProgressToast,
    AllocationProgressIndicator,
    ImprovedActionButtons,
    ChunkedSiteDisplay,
    EnhancedHealthIndicator
} from './CollectionOpportunitiesUXImprovements';
import {
    Button,
    Card,
    Classes,
    FormGroup,
    HTMLSelect,
    Intent,
    Menu,
    MenuItem,
    Navbar,
    NonIdealState,
    ProgressBar,
    Spinner,
    Tab,
    Tabs,
    Tag,
    Tooltip,
    Position,
    ControlGroup,
    InputGroup,
    Callout,
    Divider,
    Collapse,
    EditableText,
    NumericInput,
    TextArea,
    Switch,
    Icon as BpIcon,
} from '@blueprintjs/core';
import { Table2, Column, Cell, RenderMode } from '@blueprintjs/table';
import { Icon } from '../utils/blueprintIconWrapper';
import { AllocationEditorPanel } from './AllocationEditorPanel';
import { useAllocationContext } from '../contexts/AllocationContext';
import { 
    CollectionOpportunity, 
    OpportunityStatus, 
    HealthAnalysis,
    Site,
    CollectionDeck,
    MatchStatus,
    Priority
} from '../types/collectionOpportunities';
import { calculateOpportunityHealth } from '../utils/opportunityHealth';
import { validateOpportunity } from '../utils/opportunityValidation';

// Helper function to convert OpportunityHealth to HealthAnalysis
const convertToHealthAnalysis = (health: any): HealthAnalysis => {
    return {
        score: health.score || 0,
        overallHealth: health.level === 'optimal' ? 'excellent' : 
                      health.level === 'warning' ? 'fair' : 'poor',
        coverage: health.metrics?.capacityScore ? `${Math.round(health.metrics.capacityScore)}%` : 'N/A',
        efficiency: health.metrics?.utilizationEfficiency ? `${Math.round(health.metrics.utilizationEfficiency)}%` : 'N/A',
        balance: health.metrics?.priorityAlignment ? `${Math.round(health.metrics.priorityAlignment)}%` : 'N/A',
        issues: health.reasons || [],
        level: health.level
    };
};
import '@blueprintjs/table/lib/css/table.css';
import './CollectionOpportunitiesSplitView.css';

// State management types
interface TableState {
    selectedOpportunities: Set<string>;
    editingOpportunity: CollectionOpportunity | null;
    pendingChanges: Map<string, CollectionOpportunity>;
    healthScores: Map<string, HealthAnalysis>;
    activeTab: 'all' | 'needs-review' | 'unmatched';
    globalSiteFilter: string;
    sortColumn: string | null;
    sortDirection: 'asc' | 'desc';
    searchQuery: string;
    isLoading: boolean;
    error: string | null;
    splitViewOpen: boolean;
    splitViewWidth: number;
}

type TableAction =
    | { type: 'SELECT_OPPORTUNITY'; id: string }
    | { type: 'SELECT_MULTIPLE'; ids: string[]; append?: boolean }
    | { type: 'DESELECT_OPPORTUNITY'; id: string }
    | { type: 'CLEAR_SELECTION' }
    | { type: 'SET_EDITING_OPPORTUNITY'; opportunity: CollectionOpportunity | null }
    | { type: 'SET_PENDING_CHANGE'; id: string; opportunity: CollectionOpportunity }
    | { type: 'CLEAR_PENDING_CHANGE'; id: string }
    | { type: 'UPDATE_HEALTH_SCORE'; id: string; health: HealthAnalysis }
    | { type: 'BATCH_UPDATE_HEALTH'; updates: Map<string, HealthAnalysis> }
    | { type: 'SET_ACTIVE_TAB'; tab: 'all' | 'needs-review' | 'unmatched' }
    | { type: 'SET_GLOBAL_FILTER'; site: string }
    | { type: 'SET_SORT'; column: string | null; direction: 'asc' | 'desc' }
    | { type: 'SET_SEARCH'; query: string }
    | { type: 'SET_LOADING'; isLoading: boolean }
    | { type: 'SET_ERROR'; error: string | null }
    | { type: 'TOGGLE_SPLIT_VIEW' }
    | { type: 'SET_SPLIT_VIEW_WIDTH'; width: number }
    | { type: 'RESET_STATE' };

// Enhanced reducer with split view management
function tableReducer(state: TableState, action: TableAction): TableState {
    switch (action.type) {
        case 'SELECT_OPPORTUNITY':
            const currentSelected = Array.from(state.selectedOpportunities);
            return {
                ...state,
                selectedOpportunities: new Set([...currentSelected, action.id])
            };
        
        case 'SELECT_MULTIPLE':
            const currentIds = Array.from(state.selectedOpportunities);
            const newSelection = action.append 
                ? new Set([...currentIds, ...action.ids])
                : new Set(action.ids);
            return {
                ...state,
                selectedOpportunities: newSelection
            };
        
        case 'DESELECT_OPPORTUNITY':
            const updated = new Set(state.selectedOpportunities);
            updated.delete(action.id);
            return {
                ...state,
                selectedOpportunities: updated
            };
        
        case 'CLEAR_SELECTION':
            return {
                ...state,
                selectedOpportunities: new Set()
            };
        
        case 'SET_EDITING_OPPORTUNITY':
            return {
                ...state,
                editingOpportunity: action.opportunity,
                splitViewOpen: action.opportunity !== null
            };
        
        case 'SET_PENDING_CHANGE':
            return {
                ...state,
                pendingChanges: new Map(state.pendingChanges).set(action.id, action.opportunity)
            };
        
        case 'CLEAR_PENDING_CHANGE':
            const changes = new Map(state.pendingChanges);
            changes.delete(action.id);
            return {
                ...state,
                pendingChanges: changes
            };
        
        case 'UPDATE_HEALTH_SCORE':
            return {
                ...state,
                healthScores: new Map(state.healthScores).set(action.id, action.health)
            };
        
        case 'BATCH_UPDATE_HEALTH':
            return {
                ...state,
                healthScores: new Map([...state.healthScores, ...action.updates])
            };
        
        case 'SET_ACTIVE_TAB':
            return {
                ...state,
                activeTab: action.tab,
                selectedOpportunities: new Set() // Clear selection on tab change
            };
        
        case 'SET_GLOBAL_FILTER':
            return {
                ...state,
                globalSiteFilter: action.site
            };
        
        case 'SET_SORT':
            return {
                ...state,
                sortColumn: action.column,
                sortDirection: action.direction
            };
        
        case 'SET_SEARCH':
            return {
                ...state,
                searchQuery: action.query
            };
        
        case 'SET_LOADING':
            return {
                ...state,
                isLoading: action.isLoading
            };
        
        case 'SET_ERROR':
            return {
                ...state,
                error: action.error
            };
        
        case 'TOGGLE_SPLIT_VIEW':
            return {
                ...state,
                splitViewOpen: !state.splitViewOpen
            };
        
        case 'SET_SPLIT_VIEW_WIDTH':
            return {
                ...state,
                splitViewWidth: action.width
            };
        
        case 'RESET_STATE':
            return {
                selectedOpportunities: new Set(),
                editingOpportunity: null,
                pendingChanges: new Map(),
                healthScores: new Map(),
                activeTab: 'all',
                globalSiteFilter: '',
                sortColumn: null,
                sortDirection: 'asc',
                searchQuery: '',
                isLoading: false,
                error: null,
                splitViewOpen: false,
                splitViewWidth: 40
            };
        
        default:
            return state;
    }
}

// Main component with split view
const CollectionOpportunitiesSplitViewBase: React.FC = () => {
    const { 
        opportunities, 
        sites, 
        collectionDecks,
        updateOpportunity,
        batchUpdateOpportunities,
        isLoading: contextLoading 
    } = useAllocationContext();
    
    const initialState: TableState = {
        selectedOpportunities: new Set<string>(),
        editingOpportunity: null,
        pendingChanges: new Map<string, CollectionOpportunity>(),
        healthScores: new Map<string, HealthAnalysis>(),
        activeTab: 'all' as const,
        globalSiteFilter: '',
        sortColumn: null,
        sortDirection: 'asc' as const,
        searchQuery: '',
        isLoading: false,
        error: null,
        splitViewOpen: false,
        splitViewWidth: 40 // percentage
    };
    
    const [state, dispatch] = useReducer(tableReducer, initialState);
    
    // Initialize debounced search
    const debouncedSearch = useDebouncedSearch(dispatch);
    
    const tableRef = useRef<Table2>(null);
    const lastSelectedIndex = useRef<number>(-1);
    const splitViewRef = useRef<HTMLDivElement>(null);
    const resizeHandleRef = useRef<HTMLDivElement>(null);
    
    // Handle split view resizing
    useEffect(() => {
        if (!resizeHandleRef.current) return;
        
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;
        
        const handleMouseDown = (e: MouseEvent) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = state.splitViewWidth;
            document.body.style.cursor = 'ew-resize';
            e.preventDefault();
        };
        
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            
            const containerWidth = window.innerWidth;
            const deltaX = startX - e.clientX;
            const deltaPercent = (deltaX / containerWidth) * 100;
            const newWidth = Math.max(20, Math.min(60, startWidth + deltaPercent));
            
            dispatch({ type: 'SET_SPLIT_VIEW_WIDTH', width: newWidth });
        };
        
        const handleMouseUp = () => {
            isResizing = false;
            document.body.style.cursor = 'default';
        };
        
        const handle = resizeHandleRef.current;
        handle.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        return () => {
            handle.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [state.splitViewWidth]);
    
    // Filter opportunities based on tab and search
    const filteredOpportunities = useMemo(() => {
        let filtered = opportunities;
        
        // Tab filtering
        switch (state.activeTab) {
            case 'needs-review':
                filtered = filtered.filter(opp => 
                    opp.status === 'warning' || 
                    state.healthScores.get(opp.id)?.overallHealth === 'poor'
                );
                break;
            case 'unmatched':
                filtered = filtered.filter(opp => opp.status === 'critical');
                break;
        }
        
        // Global site filter
        if (state.globalSiteFilter) {
            filtered = filtered.filter(opp => 
                opp.allocatedSites.some(site => site.id === state.globalSiteFilter)
            );
        }
        
        // Search query
        if (state.searchQuery) {
            const query = state.searchQuery.toLowerCase();
            filtered = filtered.filter(opp => 
                opp.name.toLowerCase().includes(query) ||
                opp.collectionDeckId.toLowerCase().includes(query) ||
                opp.allocatedSites.some(site => site.name.toLowerCase().includes(query))
            );
        }
        
        // Apply sorting
        if (state.sortColumn) {
            filtered = [...filtered].sort((a, b) => {
                let aVal: any = a[state.sortColumn as keyof CollectionOpportunity];
                let bVal: any = b[state.sortColumn as keyof CollectionOpportunity];
                
                // Special handling for complex fields
                if (state.sortColumn === 'health') {
                    aVal = state.healthScores.get(a.id)?.score || 0;
                    bVal = state.healthScores.get(b.id)?.score || 0;
                }
                
                if (aVal < bVal) return state.sortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return state.sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }
        
        return filtered;
    }, [opportunities, state.activeTab, state.globalSiteFilter, state.searchQuery, 
        state.sortColumn, state.sortDirection, state.healthScores]);

    // Enhanced keyboard shortcuts for split view
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + A: Select all visible
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                const visibleIds = filteredOpportunities.map(opp => opp.id);
                dispatch({ type: 'SELECT_MULTIPLE', ids: visibleIds });
            }
            
            // Escape: Clear selection or close split view
            if (e.key === 'Escape') {
                if (state.splitViewOpen) {
                    dispatch({ type: 'SET_EDITING_OPPORTUNITY', opportunity: null });
                } else if (state.selectedOpportunities.size > 0) {
                    dispatch({ type: 'CLEAR_SELECTION' });
                }
            }
            
            // Ctrl/Cmd + F: Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                document.getElementById('opportunity-search')?.focus();
            }
            
            // Tab navigation between tabs (Ctrl + 1/2/3)
            if (e.ctrlKey && ['1', '2', '3'].includes(e.key)) {
                e.preventDefault();
                const tabs = ['all', 'needs-review', 'unmatched'];
                const tabIndex = parseInt(e.key) - 1;
                if (tabs[tabIndex]) {
                    dispatch({ type: 'SET_ACTIVE_TAB', tab: tabs[tabIndex] as any });
                }
            }
            
            // Ctrl/Cmd + E: Edit selected
            if ((e.ctrlKey || e.metaKey) && e.key === 'e' && state.selectedOpportunities.size === 1) {
                const oppId = Array.from(state.selectedOpportunities)[0];
                const opp = opportunities.find(o => o.id === oppId);
                if (opp) {
                    dispatch({ type: 'SET_EDITING_OPPORTUNITY', opportunity: opp });
                }
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [state.splitViewOpen, filteredOpportunities, state.selectedOpportunities, opportunities]);

    // Calculate health scores for all opportunities with memoization
    const healthScores = useMemoizedHealthScores(opportunities);
    useEffect(() => {
        dispatch({ type: 'BATCH_UPDATE_HEALTH', updates: healthScores });
    }, [healthScores]);

    // Handlers
    const handleRowClick = useCallback((oppId: string, index: number, event: React.MouseEvent) => {
        const opp = opportunities.find(o => o.id === oppId);
        if (!opp) return;
        
        if (event.ctrlKey || event.metaKey) {
            // Ctrl/Cmd click: Toggle selection
            if (state.selectedOpportunities.has(oppId)) {
                dispatch({ type: 'DESELECT_OPPORTUNITY', id: oppId });
            } else {
                dispatch({ type: 'SELECT_OPPORTUNITY', id: oppId });
            }
            lastSelectedIndex.current = index;
        } else if (event.shiftKey && lastSelectedIndex.current !== -1) {
            // Shift click: Range selection
            const start = Math.min(lastSelectedIndex.current, index);
            const end = Math.max(lastSelectedIndex.current, index);
            const rangeIds = filteredOpportunities
                .slice(start, end + 1)
                .map(opp => opp.id);
            dispatch({ type: 'SELECT_MULTIPLE', ids: rangeIds });
        } else {
            // Regular click: Single selection and open in split view
            dispatch({ type: 'SELECT_MULTIPLE', ids: [oppId] });
            dispatch({ type: 'SET_EDITING_OPPORTUNITY', opportunity: opp });
            lastSelectedIndex.current = index;
        }
    }, [state.selectedOpportunities, filteredOpportunities, opportunities]);

    const handleEditOpportunity = useCallback((opp: CollectionOpportunity) => {
        dispatch({ type: 'SET_EDITING_OPPORTUNITY', opportunity: opp });
    }, []);

    const handleSaveChanges = useCallback(async (updatedOpportunity: CollectionOpportunity) => {
        dispatch({ type: 'SET_LOADING', isLoading: true });
        try {
            await updateOpportunity(updatedOpportunity.id, updatedOpportunity);
            dispatch({ type: 'SET_EDITING_OPPORTUNITY', opportunity: null });
            showSuccessToast(`Successfully updated ${updatedOpportunity.name}`, 1);
        } catch (error) {
            dispatch({ type: 'SET_ERROR', error: (error as Error).message });
        } finally {
            dispatch({ type: 'SET_LOADING', isLoading: false });
        }
    }, [updateOpportunity]);

    const handleBatchEdit = useCallback(() => {
        if (state.selectedOpportunities.size === 0) return;
        
        // For batch edit, open the first selected opportunity
        const firstOppId = Array.from(state.selectedOpportunities)[0];
        const firstOpp = opportunities.find(o => o.id === firstOppId);
        if (firstOpp) {
            dispatch({ type: 'SET_EDITING_OPPORTUNITY', opportunity: firstOpp });
        }
    }, [state.selectedOpportunities, opportunities]);

    // Column renderers (same as original but with split view support)
    const renderPriorityCell = (rowIndex: number) => {
        const opp = filteredOpportunities[rowIndex];
        if (!opp) return <Cell />;
        
        const getPriorityIntent = (priority: Priority) => {
            switch (priority) {
                case 'critical': return Intent.DANGER;
                case 'high': return Intent.WARNING;
                case 'medium': return Intent.PRIMARY;
                case 'low': return Intent.NONE;
                default: return Intent.NONE;
            }
        };
        
        const getPriorityNumber = (priority: Priority) => {
            switch (priority) {
                case 'critical': return 1;
                case 'high': return 2;
                case 'medium': return 3;
                case 'low': return 4;
                default: return 5;
            }
        };
        
        return (
            <Cell>
                <Tag 
                    intent={getPriorityIntent(opp.priority)}
                    minimal
                    round
                    className="priority-tag"
                >
                    {getPriorityNumber(opp.priority)}
                </Tag>
            </Cell>
        );
    };

    const renderMatchStatusCell = (rowIndex: number) => {
        const opp = filteredOpportunities[rowIndex];
        if (!opp) return <Cell />;
        
        const matchStatus = opp.matchStatus || 'unmatched';
        const matchQuality = opp.matchQuality || 0;
        
        const getMatchIntent = (status: MatchStatus) => {
            switch (status) {
                case 'baseline': return Intent.SUCCESS;
                case 'suboptimal': return Intent.WARNING;
                case 'unmatched': return Intent.DANGER;
                default: return Intent.NONE;
            }
        };
        
        const getMatchIcon = (status: MatchStatus) => {
            switch (status) {
                case 'baseline': return 'tick-circle';
                case 'suboptimal': return 'warning-sign';
                case 'unmatched': return 'error';
                default: return 'help';
            }
        };
        
        const getMatchLabel = (status: MatchStatus) => {
            switch (status) {
                case 'baseline': return 'Confirmed';
                case 'suboptimal': return 'Needs Review';
                case 'unmatched': return 'Not Allocated';
                default: return 'Unknown';
            }
        };

        return (
            <Cell>
                <div className="match-status-cell">
                    <Tooltip 
                        content={`Match Quality: ${matchQuality}%`}
                        position={Position.TOP}
                    >
                        <Tag 
                            intent={getMatchIntent(matchStatus)}
                            icon={getMatchIcon(matchStatus)}
                            className={`match-status match-status-${matchStatus}`}
                        >
                            {getMatchLabel(matchStatus)}
                        </Tag>
                    </Tooltip>
                </div>
            </Cell>
        );
    };

    const renderNameCell = (rowIndex: number) => {
        const opp = filteredOpportunities[rowIndex];
        if (!opp) return <Cell />;
        
        const isPending = state.pendingChanges.has(opp.id);
        const isSelected = state.selectedOpportunities.has(opp.id);
        const isEditing = state.editingOpportunity?.id === opp.id;
        
        return (
            <Cell 
                className={`
                    ${isSelected ? 'selected-row' : ''}
                    ${isEditing ? 'editing-row' : ''}
                    ${isPending ? 'pending-row' : ''}
                `}
            >
                <div 
                    className="opportunity-name-wrapper"
                    onClick={(e) => handleRowClick(opp.id, rowIndex, e)}
                >
                    <span className="opportunity-name">{opp.name}</span>
                    {isPending && <Tag intent={Intent.WARNING} minimal>Modified</Tag>}
                    {isEditing && <Tag intent={Intent.PRIMARY} minimal>Editing</Tag>}
                </div>
            </Cell>
        );
    };

    const renderHealthCell = (rowIndex: number) => {
        const opp = filteredOpportunities[rowIndex];
        if (!opp) return <Cell />;
        
        const health = state.healthScores.get(opp.id);
        if (!health) return <Cell>-</Cell>;
        
        return (
            <Cell>
                <EnhancedHealthIndicator health={health} />
            </Cell>
        );
    };

    const renderSitesCell = (rowIndex: number) => {
        const opp = filteredOpportunities[rowIndex];
        if (!opp) return <Cell />;
        
        return (
            <Cell>
                <ChunkedSiteDisplay 
                    sites={opp.allocatedSites} 
                    maxVisible={3}
                />
            </Cell>
        );
    };

    const renderCapacityCell = (rowIndex: number) => {
        const opp = filteredOpportunities[rowIndex];
        if (!opp) return <Cell />;
        
        const usagePercent = (opp.totalPasses / opp.capacity) * 100;
        const intent = usagePercent > 90 ? Intent.DANGER : 
                      usagePercent > 75 ? Intent.WARNING : Intent.SUCCESS;
        
        return (
            <Cell>
                <div className="capacity-cell">
                    <ProgressBar 
                        value={usagePercent / 100}
                        intent={intent}
                        animate={false}
                        stripes={false}
                    />
                    <span className="capacity-text">
                        {opp.totalPasses}/{opp.capacity}
                    </span>
                </div>
            </Cell>
        );
    };

    const renderActionsCell = (rowIndex: number) => {
        const opp = filteredOpportunities[rowIndex];
        if (!opp) return <Cell />;
        
        const isEditing = state.editingOpportunity?.id === opp.id;
        
        return (
            <Cell>
                <div className="actions-cell">
                    <Button
                        icon={isEditing ? "eye-open" : "edit"}
                        text={isEditing ? "Viewing" : "Edit"}
                        minimal
                        small
                        intent={isEditing ? Intent.PRIMARY : Intent.NONE}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEditOpportunity(opp);
                        }}
                        aria-label={`${isEditing ? 'Viewing' : 'Edit'} ${opp.name}`}
                    />
                </div>
            </Cell>
        );
    };

    // Loading state
    if (contextLoading || state.isLoading) {
        return (
            <Card className="collection-opportunities-loading">
                <Spinner size={50} />
                <h3>Loading Collection Opportunities...</h3>
            </Card>
        );
    }

    // Error state
    if (state.error) {
        return (
            <Card className="collection-opportunities-error">
                <NonIdealState
                    icon="error"
                    title="Error Loading Data"
                    description={state.error}
                    action={
                        <Button 
                            intent={Intent.PRIMARY}
                            onClick={() => dispatch({ type: 'RESET_STATE' })}
                        >
                            Retry
                        </Button>
                    }
                />
            </Card>
        );
    }

    // Setup breadcrumbs
    const getBreadcrumbs = () => {
        const base = [...BREADCRUMB_PRESETS.collectionOpportunities];
        if (state.activeTab === 'needs-review') {
            base.push({ text: 'Action Required', current: true, icon: 'warning-sign' });
        } else if (state.activeTab === 'unmatched') {
            base.push({ text: 'Pending Allocation', current: true, icon: 'time' });
        }
        return base;
    };

    return (
        <div className={`collection-opportunities-split-view ${state.splitViewOpen ? 'split-view-active' : ''}`}>
            <div 
                className="main-content"
                style={{ width: state.splitViewOpen ? `${100 - state.splitViewWidth}%` : '100%' }}
            >
                {/* Breadcrumb Navigation */}
                <ContextualBreadcrumbs
                    items={getBreadcrumbs()}
                    context="allocation"
                    showContextIndicator={true}
                />
                
                {/* Header Toolbar */}
                <Navbar className="opportunities-navbar">
                    <Navbar.Group align="left">
                        <h2 className="bp5-heading">
                            <SmartTooltip term="Collection Opportunities" context="allocation">
                                Collection Opportunities
                            </SmartTooltip>
                        </h2>
                        <Navbar.Divider />
                        
                        {/* Search */}
                        <ControlGroup>
                            <InputGroup
                                id="opportunity-search"
                                leftIcon="search"
                                placeholder="Search opportunities..."
                                value={state.searchQuery}
                                onChange={(e) => debouncedSearch(e.target.value)}
                                className="search-input"
                            />
                        </ControlGroup>
                        
                        {/* Site Filter */}
                        <HTMLSelect
                            value={state.globalSiteFilter}
                            onChange={(e) => dispatch({ type: 'SET_GLOBAL_FILTER', site: e.target.value })}
                            className="site-filter"
                        >
                            <option value="">All Sites</option>
                            {sites.map(site => (
                                <option key={site.id} value={site.id}>{site.name}</option>
                            ))}
                        </HTMLSelect>
                    </Navbar.Group>
                    
                    <Navbar.Group align="right">
                        {/* Selection Actions */}
                        {state.selectedOpportunities.size > 0 && (
                            <>
                                <Tag round intent={Intent.PRIMARY}>
                                    {state.selectedOpportunities.size} selected
                                </Tag>
                                <Button
                                    intent={Intent.PRIMARY}
                                    icon="edit"
                                    text="Edit Selected"
                                    onClick={handleBatchEdit}
                                    disabled={state.selectedOpportunities.size === 0}
                                />
                                <Button
                                    minimal
                                    icon="cross"
                                    text="Clear"
                                    onClick={() => dispatch({ type: 'CLEAR_SELECTION' })}
                                />
                                <Navbar.Divider />
                            </>
                        )}
                        
                        {/* Split View Toggle */}
                        <Button
                            minimal
                            icon={state.splitViewOpen ? "panel-stats" : "panel-table"}
                            text={state.splitViewOpen ? "Hide Panel" : "Show Panel"}
                            onClick={() => dispatch({ type: 'TOGGLE_SPLIT_VIEW' })}
                        />
                    </Navbar.Group>
                </Navbar>

                {/* Progress Indicator */}
                <AllocationProgressIndicator
                    total={opportunities.length}
                    allocated={opportunities.filter(o => o.matchStatus === 'baseline').length}
                    pending={opportunities.filter(o => o.matchStatus === 'unmatched').length}
                    needsReview={opportunities.filter(o => o.matchStatus === 'suboptimal').length}
                />

                {/* Tabs */}
                <Tabs
                    id="opportunity-tabs"
                    selectedTabId={state.activeTab}
                    onChange={(tabId) => dispatch({ type: 'SET_ACTIVE_TAB', tab: tabId as any })}
                    className="opportunity-tabs"
                >
                    <Tab 
                        id="all" 
                        title={`All (${opportunities.length})`}
                    />
                    <Tab 
                        id="needs-review" 
                        title={
                            <>
                                Action Required
                                <Tag 
                                    round 
                                    intent={Intent.WARNING} 
                                    minimal
                                    className="tab-count"
                                >
                                    {opportunities.filter(o => 
                                        o.status === 'warning' || 
                                        state.healthScores.get(o.id)?.overallHealth === 'poor'
                                    ).length}
                                </Tag>
                            </>
                        }
                    />
                    <Tab 
                        id="unmatched" 
                        title={
                            <>
                                Pending Allocation
                                <Tag 
                                    round 
                                    intent={Intent.DANGER} 
                                    minimal
                                    className="tab-count"
                                >
                                    {opportunities.filter(o => o.status === 'critical').length}
                                </Tag>
                            </>
                        }
                    />
                </Tabs>

                {/* Main Table */}
                <Card className="table-container">
                    <Table2
                        ref={tableRef}
                        numRows={filteredOpportunities.length}
                        className="opportunities-table"
                        columnWidths={[
                            AUTO_SIZED_COLUMNS.priority,  // Priority
                            AUTO_SIZED_COLUMNS.status,    // Allocation Status
                            AUTO_SIZED_COLUMNS.name,      // Name
                            AUTO_SIZED_COLUMNS.health,    // Health
                            AUTO_SIZED_COLUMNS.sites,     // Sites
                            AUTO_SIZED_COLUMNS.capacity,  // Capacity
                            AUTO_SIZED_COLUMNS.actions    // Actions
                        ]}
                        rowHeights={filteredOpportunities.map(() => 40)}
                        enableRowHeader={false}
                        enableColumnResizing={true}
                        enableRowReordering={false}
                        renderMode={RenderMode.BATCH}
                        selectionModes={[]}
                    >
                        <Column name="Priority" cellRenderer={renderPriorityCell} />
                        <Column name="Allocation Status" cellRenderer={renderMatchStatusCell} />
                        <Column name="Name" cellRenderer={renderNameCell} />
                        <Column name="Health" cellRenderer={renderHealthCell} />
                        <Column name="Sites" cellRenderer={renderSitesCell} />
                        <Column name="Capacity" cellRenderer={renderCapacityCell} />
                        <Column name="Actions" cellRenderer={renderActionsCell} />
                    </Table2>
                    
                    {filteredOpportunities.length === 0 && (
                        <NonIdealState
                            icon="search"
                            title="No opportunities found"
                            description="Try adjusting your filters or search query"
                        />
                    )}
                </Card>
            </div>

            {/* Split View Panel */}
            <div 
                ref={splitViewRef}
                className={`split-view-panel ${state.splitViewOpen ? 'open' : ''}`}
                style={{ width: state.splitViewOpen ? `${state.splitViewWidth}%` : '0' }}
            >
                {state.splitViewOpen && (
                    <>
                        <div 
                            ref={resizeHandleRef}
                            className="split-view-resize-handle"
                            title="Drag to resize"
                        >
                            <div className="resize-grip" />
                        </div>
                        <AllocationEditorPanel
                            opportunity={state.editingOpportunity}
                            selectedOpportunityIds={Array.from(state.selectedOpportunities)}
                            sites={sites}
                            collectionDecks={collectionDecks}
                            onSave={handleSaveChanges}
                            onClose={() => dispatch({ type: 'SET_EDITING_OPPORTUNITY', opportunity: null })}
                            isLoading={state.isLoading}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

// Export directly (performance monitoring HOC removed)
export const CollectionOpportunitiesSplitView = CollectionOpportunitiesSplitViewBase;