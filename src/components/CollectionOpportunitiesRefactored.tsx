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
    Dialog,
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
} from '@blueprintjs/core';
import { Table2, Column, Cell, RenderMode } from '@blueprintjs/table';
import { Icon } from '../utils/blueprintIconWrapper';
import { ManualOverrideModalRefactored } from './ManualOverrideModalRefactored';
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
import './CollectionOpportunitiesRefactored.css';

// State management types
interface TableState {
    selectedOpportunities: Set<string>;
    pendingChanges: Map<string, CollectionOpportunity>;
    healthScores: Map<string, HealthAnalysis>;
    activeTab: 'all' | 'needs-review' | 'unmatched';
    globalSiteFilter: string;
    sortColumn: string | null;
    sortDirection: 'asc' | 'desc';
    searchQuery: string;
    isLoading: boolean;
    error: string | null;
}

type TableAction =
    | { type: 'SELECT_OPPORTUNITY'; id: string }
    | { type: 'SELECT_MULTIPLE'; ids: string[]; append?: boolean }
    | { type: 'DESELECT_OPPORTUNITY'; id: string }
    | { type: 'CLEAR_SELECTION' }
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
    | { type: 'RESET_STATE' };

// Reducer for complex state management
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
        
        case 'RESET_STATE':
            return {
                selectedOpportunities: new Set(),
                pendingChanges: new Map(),
                healthScores: new Map(),
                activeTab: 'all',
                globalSiteFilter: '',
                sortColumn: null,
                sortDirection: 'asc',
                searchQuery: '',
                isLoading: false,
                error: null
            };
        
        default:
            return state;
    }
}

// Main component
const CollectionOpportunitiesRefactoredBase: React.FC = () => {
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
        pendingChanges: new Map<string, CollectionOpportunity>(),
        healthScores: new Map<string, HealthAnalysis>(),
        activeTab: 'all' as const,
        globalSiteFilter: '',
        sortColumn: null,
        sortDirection: 'asc' as const,
        searchQuery: '',
        isLoading: false,
        error: null
    };
    
    const [state, dispatch] = useReducer(tableReducer, initialState);
    
    // Initialize debounced search
    const debouncedSearch = useDebouncedSearch(dispatch);
    
    const [overrideModalOpen, setOverrideModalOpen] = useState(false);
    const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
    const tableRef = useRef<Table2>(null);
    const lastSelectedIndex = useRef<number>(-1);
    
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

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + A: Select all visible
            if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !overrideModalOpen) {
                e.preventDefault();
                const visibleIds = filteredOpportunities.map(opp => opp.id);
                dispatch({ type: 'SELECT_MULTIPLE', ids: visibleIds });
            }
            
            // Escape: Clear selection or close modal
            if (e.key === 'Escape') {
                if (overrideModalOpen) {
                    setOverrideModalOpen(false);
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
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [overrideModalOpen, filteredOpportunities]);

    // Calculate health scores for all opportunities with memoization
    const healthScores = useMemoizedHealthScores(opportunities);
    useEffect(() => {
        dispatch({ type: 'BATCH_UPDATE_HEALTH', updates: healthScores });
    }, [healthScores]);

    // Handlers
    const handleRowClick = useCallback((oppId: string, index: number, event: React.MouseEvent) => {
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
            // Regular click: Single selection
            dispatch({ type: 'SELECT_MULTIPLE', ids: [oppId] });
            lastSelectedIndex.current = index;
        }
    }, [state.selectedOpportunities, filteredOpportunities]);

    const handleOpenOverrideModal = useCallback((deckId?: string) => {
        if (deckId) {
            setSelectedDeckId(deckId);
        } else if (state.selectedOpportunities.size > 0) {
            // Get deck from first selected opportunity
            const firstOppId = Array.from(state.selectedOpportunities)[0];
            const firstOpp = opportunities.find(o => o.id === firstOppId);
            if (firstOpp) {
                setSelectedDeckId(firstOpp.collectionDeckId);
            }
        }
        setOverrideModalOpen(true);
    }, [state.selectedOpportunities, opportunities]);

    const handleSaveOverride = useCallback(async (changes: Map<string, CollectionOpportunity>) => {
        dispatch({ type: 'SET_LOADING', isLoading: true });
        try {
            const updates = Array.from(changes.values());
            await batchUpdateOpportunities(updates);
            dispatch({ type: 'CLEAR_SELECTION' });
            setOverrideModalOpen(false);
            // Show success toast
            showSuccessToast(
                `Successfully updated ${updates.length} opportunities`,
                updates.length
            );
        } catch (error) {
            dispatch({ type: 'SET_ERROR', error: (error as Error).message });
        } finally {
            dispatch({ type: 'SET_LOADING', isLoading: false });
        }
    }, [batchUpdateOpportunities]);

    // Column renderers
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

        const getStatusContext = () => {
            const details = opp.matchNotes || 'No additional details available';
            const alternatives = opp.alternativeOptions?.map(alt => ({
                id: alt.siteId,
                name: alt.siteName,
                score: alt.qualityScore
            }));
            
            return {
                status: matchStatus === 'baseline' ? 'confirmed' : 
                        matchStatus === 'suboptimal' ? 'needs-review' : 
                        'not-allocated' as any,
                quality: matchQuality,
                details,
                alternatives
            };
        };
        
        return (
            <Cell>
                <div className="match-status-cell">
                    <Tooltip 
                        content={
                            <AllocationStatusDisclosure 
                                {...getStatusContext()}
                            />
                        }
                        position={Position.TOP}
                        popoverClassName="status-details-popover"
                    >
                        <Tag 
                            intent={getMatchIntent(matchStatus)}
                            icon={getMatchIcon(matchStatus)}
                            className={`match-status match-status-${matchStatus}`}
                            interactive
                        >
                            {getMatchLabel(matchStatus)}
                        </Tag>
                    </Tooltip>
                </div>
            </Cell>
        );
    };

    const renderMatchNotesCell = (rowIndex: number) => {
        const opp = filteredOpportunities[rowIndex];
        if (!opp) return <Cell />;
        
        const notes = opp.matchNotes || '';
        const hasAlternatives = opp.alternativeOptions && opp.alternativeOptions.length > 0;
        
        return (
            <Cell>
                <div className="match-notes-cell">
                    {notes && (
                        <Tooltip content={notes} position={Position.TOP}>
                            <span className="match-note-text">{notes}</span>
                        </Tooltip>
                    )}
                    {hasAlternatives && (
                        <Tag minimal round intent={Intent.PRIMARY} className="alternatives-indicator">
                            {opp.alternativeOptions?.length} alt
                        </Tag>
                    )}
                </div>
            </Cell>
        );
    };

    const renderNameCell = (rowIndex: number) => {
        const opp = filteredOpportunities[rowIndex];
        if (!opp) return <Cell />;
        
        const isPending = state.pendingChanges.has(opp.id);
        const isSelected = state.selectedOpportunities.has(opp.id);
        
        return (
            <Cell 
                className={`${Classes.intentClass(isPending ? Intent.WARNING : Intent.NONE)} ${isSelected ? 'bp5-intent-primary' : ''}`}
            >
                <div 
                    className="opportunity-name-wrapper"
                    onClick={(e) => handleRowClick(opp.id, rowIndex, e)}
                >
                    <Tooltip content={opp.id} position={Position.TOP}>
                        <span className="opportunity-name">{opp.name}</span>
                    </Tooltip>
                    {isPending && <Tag intent={Intent.WARNING} minimal>Modified</Tag>}
                </div>
            </Cell>
        );
    };

    const renderHealthCell = (rowIndex: number) => {
        const opp = filteredOpportunities[rowIndex];
        if (!opp) return <Cell />;
        
        const health = state.healthScores.get(opp.id);
        if (!health) return <Cell>-</Cell>;
        
        const getHealthIntent = (health: string) => {
            switch (health) {
                case 'excellent': return Intent.SUCCESS;
                case 'good': return Intent.PRIMARY;
                case 'fair': return Intent.WARNING;
                case 'poor': return Intent.DANGER;
                default: return Intent.NONE;
            }
        };
        
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
        
        const matchStatus = opp.matchStatus || 'unmatched';
        
        // Context-aware action based on match status
        const getQuickAction = () => {
            switch (matchStatus) {
                case 'suboptimal':
                    return (
                        <Button
                            icon="swap-horizontal"
                            text="View Alts"
                            minimal
                            small
                            intent={Intent.PRIMARY}
                            onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Show alternatives inline
                                console.log('Show alternatives for', opp.id);
                            }}
                            aria-label={`View alternatives for ${opp.name}`}
                        />
                    );
                case 'unmatched':
                    return (
                        <Button
                            icon="add"
                            text="Allocate"
                            minimal
                            small
                            intent={Intent.SUCCESS}
                            onClick={(e) => {
                                e.stopPropagation();
                                dispatch({ type: 'SELECT_MULTIPLE', ids: [opp.id] });
                                handleOpenOverrideModal(opp.collectionDeckId);
                            }}
                            aria-label={`Allocate ${opp.name}`}
                        />
                    );
                case 'baseline':
                default:
                    return (
                        <Button
                            icon="edit"
                            text="Edit"
                            minimal
                            small
                            onClick={(e) => {
                                e.stopPropagation();
                                dispatch({ type: 'SELECT_MULTIPLE', ids: [opp.id] });
                                handleOpenOverrideModal(opp.collectionDeckId);
                            }}
                            aria-label={`Edit ${opp.name}`}
                        />
                    );
            }
        };
        
        return (
            <Cell>
                <div className="actions-cell">
                    {getQuickAction()}
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

    // Setup breadcrumbs based on active tab
    const getBreadcrumbs = () => {
        const base = [...BREADCRUMB_PRESETS.collectionOpportunities];
        if (state.activeTab === 'needs-review') {
            base[base.length - 1] = { 
                text: 'Opportunities', 
                href: '/operations/collections/opportunities',
                onClick: (e: React.MouseEvent<HTMLElement>) => {
                    e.preventDefault();
                    dispatch({ type: 'SET_ACTIVE_TAB', tab: 'all' });
                }
            };
            base.push({ text: 'Action Required', current: true, icon: 'warning-sign' });
        } else if (state.activeTab === 'unmatched') {
            base[base.length - 1] = { 
                text: 'Opportunities', 
                href: '/operations/collections/opportunities',
                onClick: (e: React.MouseEvent<HTMLElement>) => {
                    e.preventDefault();
                    dispatch({ type: 'SET_ACTIVE_TAB', tab: 'all' });
                }
            };
            base.push({ text: 'Pending Allocation', current: true, icon: 'time' });
        }
        return base;
    };

    return (
        <div className="collection-opportunities-refactored">
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
                    
                    {/* Site Filter with Smart Context */}
                    <div className="site-filter-wrapper">
                        <SmartTooltip term="Sites" context="general">
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
                        </SmartTooltip>
                    </div>
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
                                text="Override Selected"
                                onClick={() => handleOpenOverrideModal()}
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
                    
                    {/* Quick Actions */}
                    <Button
                        minimal
                        icon="refresh"
                        text="Refresh"
                        onClick={() => window.location.reload()}
                    />
                    <Button
                        minimal
                        icon="help"
                        text="Help"
                        onClick={() => {/* Show help modal */}}
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

            {/* Enhanced Help System with Progressive Disclosure */}
            {filteredOpportunities.length > 0 && (
                <Card className="help-card bp5-elevation-1">
                    <ProgressiveDisclosure
                        levels={[
                            {
                                id: 'getting-started',
                                label: 'Getting Started with Collection Opportunities',
                                icon: 'learning',
                                intent: Intent.PRIMARY,
                                defaultOpen: state.selectedOpportunities.size === 0,
                                content: (
                                    <div>
                                        <h4>What are Collection Opportunities?</h4>
                                        <p>Collection opportunities represent potential satellite data collection tasks that need to be allocated to available satellites and ground stations.</p>
                                        <h4>Key Concepts:</h4>
                                        <ul>
                                            <li><SmartTooltip term="Allocation Status" context="allocation">Allocation Status</SmartTooltip>: Shows whether a satellite has been assigned</li>
                                            <li><SmartTooltip term="Priority" context="general">Priority</SmartTooltip>: Urgency level (1=Critical to 4=Low)</li>
                                            <li><SmartTooltip term="Health" context="general">Health</SmartTooltip>: Overall assessment of the allocation</li>
                                        </ul>
                                    </div>
                                )
                            },
                            {
                                id: 'workflow',
                                label: 'Common Workflows',
                                icon: 'flows',
                                content: (
                                    <div>
                                        <h4>1. Review Pending Allocations</h4>
                                        <ol>
                                            <li>Click the "Pending Allocation" tab to see unallocated opportunities</li>
                                            <li>Review the priority and requirements</li>
                                            <li>Click "Allocate" to assign a satellite</li>
                                        </ol>
                                        <h4>2. Address Issues</h4>
                                        <ol>
                                            <li>Click "Action Required" tab for items needing attention</li>
                                            <li>Review the allocation details and alternatives</li>
                                            <li>Select better options if available</li>
                                        </ol>
                                    </div>
                                )
                            },
                            {
                                id: 'shortcuts',
                                label: 'Keyboard Shortcuts',
                                icon: 'key',
                                content: (
                                    <div>
                                        <ul className="keyboard-shortcuts-list">
                                            <li><kbd>Ctrl</kbd>+<kbd>A</kbd> - Select all visible items</li>
                                            <li><kbd>Ctrl</kbd>+<kbd>F</kbd> - Focus search box</li>
                                            <li><kbd>Ctrl</kbd>+<kbd>1/2/3</kbd> - Switch between tabs</li>
                                            <li><kbd>Esc</kbd> - Clear selection</li>
                                            <li><kbd>Shift</kbd>+Click - Range selection</li>
                                        </ul>
                                    </div>
                                )
                            }
                        ]}
                        mode="progressive"
                    />
                </Card>
            )}

            {/* Main Table */}
            <Card className="table-container">
                {filteredOpportunities.length > 100 ? (
                    <VirtualizedOpportunitiesTable
                        filteredOpportunities={filteredOpportunities}
                        columnRenderers={[
                            renderPriorityCell,
                            renderMatchStatusCell,
                            renderMatchNotesCell,
                            renderNameCell,
                            renderHealthCell,
                            renderSitesCell,
                            renderCapacityCell,
                            renderActionsCell
                        ]}
                    />
                ) : (
                <Table2
                    ref={tableRef}
                    numRows={filteredOpportunities.length}
                    className="opportunities-table"
                    columnWidths={[
                        AUTO_SIZED_COLUMNS.priority,  // Priority
                        AUTO_SIZED_COLUMNS.status,    // Allocation Status
                        AUTO_SIZED_COLUMNS.details,   // Allocation Details
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
                    {/* Tier 1: Critical Decision Data */}
                    <Column
                        name="Priority"
                        cellRenderer={renderPriorityCell}
                        columnHeaderCellRenderer={() => (
                            <div className="bp5-table-column-header-cell">
                                <span className="bp5-table-column-name">Priority</span>
                            </div>
                        )}
                    />
                    <Column
                        name="Allocation Status"
                        cellRenderer={renderMatchStatusCell}
                        columnHeaderCellRenderer={() => (
                            <div className="bp5-table-column-header-cell">
                                <Tooltip 
                                    content="Current satellite allocation status for this opportunity"
                                    position={Position.TOP}
                                >
                                    <span className="bp5-table-column-name">Allocation Status</span>
                                </Tooltip>
                            </div>
                        )}
                    />
                    <Column
                        name="Allocation Details"
                        cellRenderer={renderMatchNotesCell}
                        columnHeaderCellRenderer={() => (
                            <div className="bp5-table-column-header-cell">
                                <Tooltip 
                                    content="Additional details about the allocation decision"
                                    position={Position.TOP}
                                >
                                    <span className="bp5-table-column-name">Allocation Details</span>
                                </Tooltip>
                            </div>
                        )}
                    />
                    
                    {/* Tier 2: Essential Context */}
                    <Column
                        name="Name"
                        cellRenderer={renderNameCell}
                        columnHeaderCellRenderer={() => (
                            <div className="bp5-table-column-header-cell">
                                <span className="bp5-table-column-name">Name</span>
                            </div>
                        )}
                    />
                    <Column
                        name="Health"
                        cellRenderer={renderHealthCell}
                        columnHeaderCellRenderer={() => (
                            <div className="bp5-table-column-header-cell">
                                <span className="bp5-table-column-name">Health</span>
                            </div>
                        )}
                    />
                    <Column
                        name="Sites"
                        cellRenderer={renderSitesCell}
                        columnHeaderCellRenderer={() => (
                            <div className="bp5-table-column-header-cell">
                                <span className="bp5-table-column-name">Sites</span>
                            </div>
                        )}
                    />
                    <Column
                        name="Capacity"
                        cellRenderer={renderCapacityCell}
                        columnHeaderCellRenderer={() => (
                            <div className="bp5-table-column-header-cell">
                                <span className="bp5-table-column-name">Capacity</span>
                            </div>
                        )}
                    />
                    <Column
                        name="Actions"
                        cellRenderer={renderActionsCell}
                        columnHeaderCellRenderer={() => (
                            <div className="bp5-table-column-header-cell">
                                <span className="bp5-table-column-name">Actions</span>
                            </div>
                        )}
                    />
                </Table2>
                )}
                
                {filteredOpportunities.length === 0 && (
                    <NonIdealState
                        icon="search"
                        title="No opportunities found"
                        description="Try adjusting your filters or search query"
                    />
                )}
            </Card>

            {/* Manual Override Modal */}
            <ManualOverrideModalRefactored
                isOpen={overrideModalOpen}
                onClose={() => setOverrideModalOpen(false)}
                selectedOpportunityIds={Array.from(state.selectedOpportunities)}
                collectionDeckId={selectedDeckId}
                onSave={handleSaveOverride}
            />
        </div>
    );
};

// Export directly (performance monitoring HOC removed)
export const CollectionOpportunitiesRefactored = CollectionOpportunitiesRefactoredBase;