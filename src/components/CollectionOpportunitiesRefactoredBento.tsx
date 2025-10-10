import React, { useReducer, useCallback, useMemo, useRef, useEffect, useState, startTransition, memo } from 'react';
import {
    Card,
    Tag,
    Intent,
    Button,
    NonIdealState,
    Spinner,
    Tabs,
    Tab,
    Navbar,
    Callout,
    ControlGroup,
    InputGroup,
    HTMLSelect,
    Classes
} from '@blueprintjs/core';
import { Table2, Column, Cell, RenderMode } from '@blueprintjs/table';
import { Icon } from '../utils/blueprintIconWrapper';

// Import all the existing components we need
import { SmartTooltip } from './shared/SmartTooltip';
import { ContextualBreadcrumbs, BREADCRUMB_PRESETS } from './shared/Breadcrumbs';
import { AllocationEditorPanel } from './AllocationEditorPanel';
import { ManualOverrideModalRefactored } from './ManualOverrideModalRefactored';
import {
    showSuccessToast,
    showProgressToast,
    AllocationProgressIndicator,
    ChunkedSiteDisplay,
    EnhancedHealthIndicator
} from './CollectionOpportunitiesUXImprovements';
import {
    useMemoizedHealthScores,
    useDebouncedSearch,
    useOptimizedFiltering,
    AUTO_SIZED_COLUMNS
} from '../hooks/collections/useCollectionPerformance';

// Types and Context
import { useAllocationContext } from '../contexts/AllocationContext';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { CollectionOpportunity, Site, CollectionDeck, HealthAnalysis, Priority, MatchStatus } from '../types/collectionOpportunities';
import { calculateOpportunityHealth } from '../utils/opportunityHealth';
import { validateOpportunity } from '../utils/opportunityValidation';
import { formatSccNumber } from '../utils/sccFormatting';

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
}

type TableAction =
    | { type: 'SELECT_OPPORTUNITY'; id: string }
    | { type: 'SELECT_MULTIPLE'; ids: string[] }
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
    | { type: 'RESET_STATE' };

// Reducer for complex state management
function tableReducer(state: TableState, action: TableAction): TableState {
    switch (action.type) {
        case 'SELECT_OPPORTUNITY':
            return {
                ...state,
                selectedOpportunities: new Set([...state.selectedOpportunities, action.id])
            };
        
        case 'SELECT_MULTIPLE':
            return {
                ...state,
                selectedOpportunities: new Set(action.ids)
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
                selectedOpportunities: new Set(),
                editingOpportunity: null
            };
            
        case 'SET_EDITING_OPPORTUNITY':
            return {
                ...state,
                editingOpportunity: action.opportunity
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
                editingOpportunity: null,
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

// Styles
// import './CollectionOpportunitiesBento.css'; // File not found - using inline styles
import './CollectionOpportunitiesRefactored.css';
import '@blueprintjs/table/lib/css/table.css';

/**
 * CollectionOpportunitiesRefactoredBento
 * 
 * A seamless integration of Bento layout into the existing CollectionOpportunitiesRefactored component.
 * This preserves ALL existing functionality including the modal while adding the Bento split view option.
 * 
 * Key features:
 * - Feature flag controlled transition between modal and Bento
 * - All existing state management preserved
 * - Smooth animations for UI transitions
 * - Progressive enhancement support
 */

// Memoized Dashboard Panel Component for Bento Layout
const DashboardPanel: React.FC<{ 
  opportunities: CollectionOpportunity[];
  healthScores: Map<string, HealthAnalysis>;
  isLoading?: boolean;
  error?: string | null;
}> = memo(({ 
    opportunities, 
    healthScores,
    isLoading = false,
    error = null
}) => {
    const stats = useMemo(() => {
        if (isLoading || error) {
            return {
                total: 0, allocated: 0, needsReview: 0, unmatched: 0,
                criticalHealth: 0, allocationRate: 0, healthRate: 0
            };
        }
        
        const total = opportunities.length;
        // Use single pass for efficiency
        let allocated = 0, needsReview = 0, unmatched = 0;
        opportunities.forEach(o => {
            switch (o.matchStatus) {
                case 'baseline': allocated++; break;
                case 'suboptimal': needsReview++; break;
                case 'unmatched': unmatched++; break;
            }
        });
        
        const criticalHealth = Array.from(healthScores.values())
            .filter(h => h.level === 'critical').length;
        
        return {
            total,
            allocated,
            needsReview,
            unmatched,
            criticalHealth,
            allocationRate: total > 0 ? Math.round((allocated / total) * 100) : 0,
            healthRate: total > 0 ? Math.round(((total - criticalHealth) / total) * 100) : 0
        };
    }, [opportunities, healthScores, isLoading, error]);

    if (error) {
        return (
            <div className="bento-dashboard-panel error-state">
                <NonIdealState
                    icon="error"
                    title="Dashboard Unavailable"
                    description={error}
                    action={
                        <Button 
                            intent={Intent.PRIMARY}
                            onClick={() => window.location.reload()}
                        >
                            Retry
                        </Button>
                    }
                />
            </div>
        );
    }
    
    return (
        <div className="bento-dashboard-panel" role="complementary" aria-label="Opportunities dashboard">
            <h2 id="dashboard-title">Collection Opportunities Overview</h2>
            
            {/* Enhanced KPI Cards with Loading States */}
            <div className="bento-kpi-grid" role="region" aria-labelledby="dashboard-title">
                {isLoading && (
                    <div className="kpi-loading-overlay">
                        <Spinner size={30} />
                        <span>Loading metrics...</span>
                    </div>
                )}
                <Card className="bento-kpi-card" interactive role="button" tabIndex={0}>
                    <div className="kpi-value" aria-label={`${stats.total} total opportunities`}>
                        {stats.total.toLocaleString()}
                    </div>
                    <div className="kpi-label">Total Opportunities</div>
                    <div className="kpi-trend" aria-hidden="true">📊</div>
                </Card>
                
                <Card className="bento-kpi-card success" interactive role="button" tabIndex={0}>
                    <div className="kpi-value" aria-label={`${stats.allocated} allocated opportunities`}>
                        {stats.allocated.toLocaleString()}
                    </div>
                    <div className="kpi-label">Allocated</div>
                    <div className="kpi-percentage" aria-label={`${stats.allocationRate} percent allocation rate`}>
                        {stats.allocationRate}%
                    </div>
                    <div className="kpi-trend success" aria-hidden="true">✅</div>
                </Card>
                
                <Card className="bento-kpi-card warning" interactive role="button" tabIndex={0}>
                    <div className="kpi-value" aria-label={`${stats.needsReview} opportunities need review`}>
                        {stats.needsReview.toLocaleString()}
                    </div>
                    <div className="kpi-label">Needs Review</div>
                    {stats.needsReview > 0 && (
                        <div className="kpi-alert" role="alert" aria-live="polite">
                            Requires attention
                        </div>
                    )}
                    <div className="kpi-trend warning" aria-hidden="true">⚠️</div>
                </Card>
                
                <Card className="bento-kpi-card danger" interactive role="button" tabIndex={0}>
                    <div className="kpi-value" aria-label={`${stats.unmatched} unmatched opportunities`}>
                        {stats.unmatched.toLocaleString()}
                    </div>
                    <div className="kpi-label">Unmatched</div>
                    {stats.unmatched > 0 && (
                        <div className="kpi-alert critical" role="alert" aria-live="polite">
                            Immediate action needed
                        </div>
                    )}
                    <div className="kpi-trend danger" aria-hidden="true">🚨</div>
                </Card>
                
                <Card className={`bento-kpi-card ${stats.healthRate < 70 ? 'warning' : stats.healthRate > 90 ? 'success' : ''}`} interactive role="button" tabIndex={0}>
                    <div className="kpi-value" aria-label={`${stats.healthRate} percent health score`}>
                        {stats.healthRate}%
                    </div>
                    <div className="kpi-label">Health Score</div>
                    <div className="health-indicator">
                        <div 
                            className="health-bar" 
                            style={{ width: `${stats.healthRate}%` }}
                            aria-hidden="true"
                        />
                    </div>
                    <div className="kpi-trend" aria-hidden="true">
                        {stats.healthRate > 90 ? '💚' : stats.healthRate > 70 ? '💛' : '❤️'}
                    </div>
                </Card>
            </div>

            {/* Reuse existing progress indicator */}
            <Card className="bento-progress-section">
                <h3>Allocation Progress</h3>
                <AllocationProgressIndicator
                    total={stats.total}
                    allocated={stats.allocated}
                    pending={stats.unmatched}
                    needsReview={stats.needsReview}
                />
            </Card>

            {/* Quick Actions */}
            <Card className="bento-quick-actions">
                <h3>Getting Started</h3>
                <p>Select an opportunity from the table to view and edit its details.</p>
                <ul>
                    <li>Click any row to view opportunity details</li>
                    <li>Use Ctrl/Cmd+Click for multiple selections</li>
                    <li>Click "Override Selected" for bulk operations</li>
                </ul>
            </Card>
        </div>
    );
});

// Bulk Operations Panel for multiple selections
const BulkOperationsPanel: React.FC<{ 
    selectedIds: Set<string>, 
    opportunities: CollectionOpportunity[],
    onOverride: () => void,
    onClearSelection: () => void 
}> = ({ 
    selectedIds, 
    opportunities,
    onOverride,
    onClearSelection
}) => {
    const selectedOpportunities = opportunities.filter(o => selectedIds.has(o.id));
    
    return (
        <div className="bento-bulk-panel">
            <h2>Bulk Operations</h2>
            <p>{selectedIds.size} opportunities selected</p>
            
            <Card className="bulk-summary">
                <h3>Selection Summary</h3>
                <ul>
                    <li>Total Capacity: {selectedOpportunities.reduce((sum, o) => sum + o.capacity, 0)}</li>
                    <li>Total Passes: {selectedOpportunities.reduce((sum, o) => sum + o.totalPasses, 0)}</li>
                    <li>Sites Involved: {new Set(selectedOpportunities.flatMap(o => o.allocatedSites.map(s => s.id))).size}</li>
                </ul>
            </Card>
            
            <Card className="bulk-actions">
                <h3>Available Actions</h3>
                <Button 
                    intent={Intent.PRIMARY} 
                    icon="edit"
                    fill
                    onClick={onOverride}
                >
                    Override Selected Allocations
                </Button>
                <Button 
                    fill
                    icon="cross"
                    onClick={onClearSelection}
                    style={{ marginTop: 8 }}
                >
                    Clear Selection
                </Button>
            </Card>
        </div>
    );
};

// Main component
const CollectionOpportunitiesRefactoredBentoBase: React.FC = () => {
    const context = useAllocationContext();
    const { 
        opportunities = [], 
        sites = [], 
        collectionDecks = [],
        updateOpportunity,
        batchUpdateOpportunities,
        isLoading: contextLoading,
        commitChanges,
        rollbackChanges
    } = context;
    
    // Access state properties from context.state
    const isSaving = context.state.isSaving;
    const contextError = context.state.errors.length > 0 ? context.state.errors[0].message : null;
    const capacityThresholds = context.state.capacityThresholds;
    const pendingChanges = context.state.pendingChanges;

    const { enableBentoLayout, bentoTransitionMode } = useFeatureFlags();
    
    // Initialize state using the existing reducer
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
        error: null
    };
    
    const [state, dispatch] = useReducer(tableReducer, initialState);
    
    // Modal state (preserved from original)
    const [overrideModalOpen, setOverrideModalOpen] = useState(false);
    const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
    
    // Bento layout state
    const [bentoSplitRatio, setBentoSplitRatio] = useState(62); // Golden ratio
    const [showBentoTransition, setShowBentoTransition] = useState(false);
    
    // Refs
    const tableRef = useRef<Table2>(null);
    const lastSelectedIndex = useRef<number>(-1);
    
    // Initialize search
    const debouncedSearch = useDebouncedSearch(dispatch);
    
    // Calculate health scores
    const healthScores = useMemoizedHealthScores(opportunities);
    useEffect(() => {
        dispatch({ type: 'BATCH_UPDATE_HEALTH', updates: healthScores });
    }, [healthScores]);
    
    // Filter opportunities based on tab and search (reuse existing logic)
    const filteredOpportunities = useOptimizedFiltering(
        opportunities,
        state.activeTab,
        state.searchQuery,
        state.globalSiteFilter,
        state.sortColumn,
        state.sortDirection,
        state.healthScores
    );
    
    // Handlers (preserved from original)
    const handleOpenOverrideModal = useCallback((deckId?: string | null) => {
        setSelectedDeckId(deckId || null);
        setOverrideModalOpen(true);
        
        // If Bento is enabled and transition mode is animated, show transition
        if (enableBentoLayout && bentoTransitionMode === 'animated') {
            setShowBentoTransition(true);
            setTimeout(() => setShowBentoTransition(false), 300);
        }
    }, [enableBentoLayout, bentoTransitionMode]);
    
    const handleSaveOverride = useCallback(async (changes: Map<string, CollectionOpportunity>) => {
        dispatch({ type: 'SET_LOADING', isLoading: true });
        
        try {
            const changesArray = Array.from(changes.values());
            await batchUpdateOpportunities(changesArray);
            
            showSuccessToast(`Successfully updated ${changes.size} opportunities`, changes.size);
            
            dispatch({ type: 'CLEAR_SELECTION' });
            setOverrideModalOpen(false);
        } catch (error) {
            dispatch({ type: 'SET_ERROR', error: (error as Error).message });
        } finally {
            dispatch({ type: 'SET_LOADING', isLoading: false });
        }
    }, [batchUpdateOpportunities]);
    
    // Handle row selection (preserved from original)
    const handleRowClick = useCallback((oppId: string, index: number, event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey) {
            if (state.selectedOpportunities.has(oppId)) {
                dispatch({ type: 'DESELECT_OPPORTUNITY', id: oppId });
            } else {
                dispatch({ type: 'SELECT_OPPORTUNITY', id: oppId });
            }
            lastSelectedIndex.current = index;
        } else if (event.shiftKey && lastSelectedIndex.current !== -1) {
            const start = Math.min(lastSelectedIndex.current, index);
            const end = Math.max(lastSelectedIndex.current, index);
            const rangeIds = filteredOpportunities
                .slice(start, end + 1)
                .map(opp => opp.id);
            dispatch({ type: 'SELECT_MULTIPLE', ids: rangeIds });
        } else {
            dispatch({ type: 'SELECT_MULTIPLE', ids: [oppId] });
            lastSelectedIndex.current = index;
            
            // In Bento mode, set editing opportunity for detail panel
            if (enableBentoLayout) {
                const opp = opportunities.find(o => o.id === oppId);
                if (opp) {
                    dispatch({ type: 'SET_EDITING_OPPORTUNITY', opportunity: opp });
                }
            }
        }
    }, [state.selectedOpportunities, filteredOpportunities, opportunities, enableBentoLayout]);
    
    // Cell renderers (all preserved from original)
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
    
    // ... (include all other cell renderers from original)
    
    const renderNameCell = (rowIndex: number) => {
        const opp = filteredOpportunities[rowIndex];
        if (!opp) return <Cell />;
        
        const isPending = state.pendingChanges.has(opp.id);
        const isSelected = state.selectedOpportunities.has(opp.id);
        
        return (
            <Cell className={isSelected ? 'selected-row' : ''}>
                <div 
                    className="opportunity-name-wrapper"
                    onClick={(e) => handleRowClick(opp.id, rowIndex, e)}
                >
                    <span className="opportunity-name">{opp.name}</span>
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
                <div className="capacity-visualization">
                    <div 
                        className="capacity-bar"
                        style={{ 
                            width: `${usagePercent}%`,
                            backgroundColor: intent === Intent.DANGER ? '#db3737' :
                                           intent === Intent.WARNING ? '#d9822b' : '#0f9960'
                        }}
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

        return (
            <Cell>
                <div className="action-buttons">
                    <Button
                        icon="edit"
                        small
                        minimal
                        onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            if (enableBentoLayout) {
                                handleRowClick(opp.id, rowIndex, e);
                            } else {
                                dispatch({ type: 'SELECT_MULTIPLE', ids: [opp.id] });
                                handleOpenOverrideModal(opp.collectionDeckId);
                            }
                        }}
                    />
                </div>
            </Cell>
        );
    };

    // Legacy compliance cell renderers (P0-P1 implementation)
    const renderSCCCell = (rowIndex: number) => {
        const opp = filteredOpportunities[rowIndex];
        if (!opp) return <Cell />;
        const sccValue = opp.sccNumber ? formatSccNumber(opp.sccNumber) : (opp.satellite?.name || '-');
        return (
            <Cell>
                <Tag minimal className="scc-number">
                    {sccValue}
                </Tag>
            </Cell>
        );
    };

    const renderFunctionCell = (rowIndex: number) => {
        const opp = filteredOpportunities[rowIndex];
        if (!opp) return <Cell />;
        const functionValue = opp.satellite?.function || '-';
        return (
            <Cell>
                <Tag minimal intent={Intent.PRIMARY} className="satellite-function">
                    {functionValue}
                </Tag>
            </Cell>
        );
    };

    const renderOrbitCell = (rowIndex: number) => {
        const opp = filteredOpportunities[rowIndex];
        if (!opp) return <Cell />;
        const orbitValue = opp.satellite?.orbit || '-';
        const orbitIntent =
            orbitValue === 'LEO' ? Intent.SUCCESS :
            orbitValue === 'MEO' ? Intent.PRIMARY :
            orbitValue === 'GEO' ? Intent.WARNING :
            Intent.NONE;
        return (
            <Cell>
                <Tag minimal intent={orbitIntent} className="orbit-type">
                    {orbitValue}
                </Tag>
            </Cell>
        );
    };

    const renderPeriodicityCell = (rowIndex: number) => {
        const opp = filteredOpportunities[rowIndex];
        if (!opp) return <Cell />;
        const periodicity = opp.periodicity && opp.periodicityUnit
            ? `${opp.periodicity} ${opp.periodicityUnit}`
            : '-';
        return (
            <Cell>
                <Tag minimal className="periodicity">
                    {periodicity}
                </Tag>
            </Cell>
        );
    };

    const renderCollectionTypeCell = (rowIndex: number) => {
        const opp = filteredOpportunities[rowIndex];
        if (!opp) return <Cell />;
        const collectionType = opp.collectionType || '-';
        const typeIntent =
            collectionType === 'optical' ? Intent.PRIMARY :
            collectionType === 'wideband' ? Intent.SUCCESS :
            collectionType === 'narrowband' ? Intent.WARNING :
            Intent.NONE;
        return (
            <Cell>
                <Tag minimal intent={typeIntent} className="collection-type">
                    {collectionType.charAt(0).toUpperCase() + collectionType.slice(1)}
                </Tag>
            </Cell>
        );
    };

    const renderClassificationCell = (rowIndex: number) => {
        const opp = filteredOpportunities[rowIndex];
        if (!opp) return <Cell />;
        const classification = opp.classificationLevel || 'UNCLASSIFIED';
        const classIntent =
            classification === 'TOP_SECRET' ? Intent.DANGER :
            classification === 'SECRET' ? Intent.WARNING :
            classification === 'CONFIDENTIAL' ? Intent.PRIMARY :
            Intent.SUCCESS;
        return (
            <Cell>
                <Tag intent={classIntent} minimal className="classification-tag">
                    {classification.replace(/_/g, ' ')}
                </Tag>
            </Cell>
        );
    };

    const renderMatchStatusCell = (rowIndex: number) => {
        const opp = filteredOpportunities[rowIndex];
        if (!opp) return <Cell />;
        const matchIntent =
            opp.matchStatus === 'baseline' ? Intent.SUCCESS :
            opp.matchStatus === 'suboptimal' ? Intent.WARNING :
            Intent.DANGER;
        return (
            <Cell>
                <Tag intent={matchIntent} minimal className="match-status-tag">
                    {opp.matchStatus ? opp.matchStatus.toUpperCase() : 'UNMATCHED'}
                </Tag>
            </Cell>
        );
    };

    const renderMatchNotesCell = (rowIndex: number) => {
        const opp = filteredOpportunities[rowIndex];
        if (!opp) return <Cell />;
        return (
            <Cell>
                <span className="match-notes">{opp.matchNotes || '-'}</span>
            </Cell>
        );
    };

    const renderSiteAllocationCell = (rowIndex: number) => {
        const opp = filteredOpportunities[rowIndex];
        if (!opp) return <Cell />;
        const allocation = opp.siteAllocationCodes && opp.siteAllocationCodes.length > 0
            ? opp.siteAllocationCodes.join(' ')
            : opp.allocatedSites.map(s => s.name.substring(0, 2).toUpperCase()).join(' ');
        return (
            <Cell>
                <span className="site-allocation">{allocation || '-'}</span>
            </Cell>
        );
    };

    // Render the appropriate right panel content for Bento layout
    const renderBentoRightPanel = () => {
        if (state.selectedOpportunities.size === 0) {
            // Show dashboard when nothing selected
            return <DashboardPanel opportunities={opportunities} healthScores={state.healthScores} />;
        } else if (state.selectedOpportunities.size === 1 && state.editingOpportunity) {
            // Show editor for single selection
            return (
                <AllocationEditorPanel
                    opportunity={state.editingOpportunity}
                    selectedOpportunityIds={Array.from(state.selectedOpportunities)}
                    sites={sites}
                    collectionDecks={collectionDecks}
                    onSave={async (opp) => {
                        await updateOpportunity(opp.id, opp);
                        dispatch({ type: 'SET_EDITING_OPPORTUNITY', opportunity: null });
                        showSuccessToast(`Updated ${opp.name}`, 1);
                    }}
                    onClose={() => dispatch({ type: 'SET_EDITING_OPPORTUNITY', opportunity: null })}
                    isLoading={isSaving}
                />
            );
        } else {
            // Show bulk operations for multiple selections
            return (
                <BulkOperationsPanel
                    selectedIds={state.selectedOpportunities}
                    opportunities={opportunities}
                    onOverride={() => handleOpenOverrideModal()}
                    onClearSelection={() => dispatch({ type: 'CLEAR_SELECTION' })}
                />
            );
        }
    };
    
    // Check if virtual scrolling is enabled in state
    const enableVirtualScrolling = state.healthScores.size > 100; // Simple heuristic
    
    // Table component (extracted for reuse in both layouts)
    const renderTable = () => (
        <Card className="table-card">
            {enableVirtualScrolling && filteredOpportunities.length > 100 ? (
                <VirtualizedOpportunitiesTable
                    filteredOpportunities={filteredOpportunities}
                    columnRenderers={[
                        renderPriorityCell,
                        (rowIndex: number) => <Cell>{filteredOpportunities[rowIndex]?.matchStatus || '-'}</Cell>,
                        (rowIndex: number) => <Cell>{filteredOpportunities[rowIndex]?.matchNotes || '-'}</Cell>,
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
                        60,  // Priority
                        80,  // SCC
                        120, // Function
                        60,  // Orbit
                        100, // Periodicity
                        120, // Collection Type
                        120, // Classification
                        100, // Match
                        150, // Match Notes
                        100, // Site Allocation
                        AUTO_SIZED_COLUMNS.health,
                        AUTO_SIZED_COLUMNS.capacity,
                        AUTO_SIZED_COLUMNS.actions
                    ]}
                    rowHeights={filteredOpportunities.map(() => 40)}
                    enableRowHeader={false}
                    enableColumnResizing={true}
                    enableRowReordering={false}
                    renderMode={RenderMode.BATCH}
                    selectionModes={[]}
                >
                    <Column name="Priority" cellRenderer={renderPriorityCell} />
                    <Column name="SCC" cellRenderer={renderSCCCell} />
                    <Column name="Function" cellRenderer={renderFunctionCell} />
                    <Column name="Orbit" cellRenderer={renderOrbitCell} />
                    <Column name="Periodicity" cellRenderer={renderPeriodicityCell} />
                    <Column name="Collection Type" cellRenderer={renderCollectionTypeCell} />
                    <Column name="Classification" cellRenderer={renderClassificationCell} />
                    <Column name="Match" cellRenderer={renderMatchStatusCell} />
                    <Column name="Match Notes" cellRenderer={renderMatchNotesCell} />
                    <Column name="Site Allocation" cellRenderer={renderSiteAllocationCell} />
                    <Column name="Health" cellRenderer={renderHealthCell} />
                    <Column name="Capacity" cellRenderer={renderCapacityCell} />
                    <Column name="Actions" cellRenderer={renderActionsCell} />
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
    );
    
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
    if (state.error || contextError) {
        return (
            <Card className="collection-opportunities-error">
                <NonIdealState
                    icon="error"
                    title="Error Loading Data"
                    description={state.error || contextError}
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
    
    // Render based on layout mode
    if (enableBentoLayout) {
        return (
            <>
                <div className={`collection-opportunities-bento ${showBentoTransition ? 'transitioning' : ''}`}>
                    {/* Left Panel - Table */}
                    <div className="bento-table-panel" style={{ width: `${bentoSplitRatio}%` }}>
                        {/* Breadcrumbs */}
                        <ContextualBreadcrumbs
                            items={BREADCRUMB_PRESETS.collectionOpportunities}
                            context="allocation"
                            showContextIndicator={true}
                        />
                        
                        {/* Header */}
                        <Navbar className="opportunities-navbar">
                            <Navbar.Group>
                                <h2 className="bp5-heading">
                                    <SmartTooltip term="Collection Opportunities" context="allocation">
                                        Collection Opportunities
                                    </SmartTooltip>
                                </h2>
                                <Navbar.Divider />
                                
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
                                {state.selectedOpportunities.size > 1 && (
                                    <Button
                                        intent={Intent.PRIMARY}
                                        icon="edit"
                                        text="Override Selected"
                                        onClick={() => handleOpenOverrideModal()}
                                    />
                                )}
                            </Navbar.Group>
                        </Navbar>
                        
                        {/* Tabs */}
                        <Tabs
                            id="opportunity-tabs"
                            selectedTabId={state.activeTab}
                            onChange={(tabId) => dispatch({ type: 'SET_ACTIVE_TAB', tab: tabId as any })}
                            className="opportunity-tabs"
                        >
                            <Tab id="all" title={`All (${opportunities.length})`} />
                            <Tab id="needs-review" title="Action Required" />
                            <Tab id="unmatched" title="Pending Allocation" />
                        </Tabs>
                        
                        {/* Table */}
                        {renderTable()}
                    </div>
                    
                    {/* Splitter */}
                    <div 
                        className="bento-splitter"
                        onMouseDown={(e) => {
                            const startX = e.clientX;
                            const startRatio = bentoSplitRatio;
                            
                            const handleMouseMove = (e: MouseEvent) => {
                                const deltaX = e.clientX - startX;
                                const deltaRatio = (deltaX / window.innerWidth) * 100;
                                const newRatio = Math.max(40, Math.min(80, startRatio + deltaRatio));
                                setBentoSplitRatio(newRatio);
                            };
                            
                            const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                            };
                            
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                        }}
                    />
                    
                    {/* Right Panel - Dynamic Content */}
                    <div className="bento-content-panel" style={{ width: `${100 - bentoSplitRatio}%` }}>
                        {renderBentoRightPanel()}
                    </div>
                </div>
                
                {/* Keep the modal for override functionality */}
                {overrideModalOpen && (
                    <ManualOverrideModalRefactored
                        isOpen={overrideModalOpen}
                        onClose={() => setOverrideModalOpen(false)}
                        selectedOpportunityIds={Array.from(state.selectedOpportunities)}
                        collectionDeckId={selectedDeckId}
                        onSave={handleSaveOverride}
                    />
                )}
            </>
        );
    }
    
    // Original layout (preserved for backwards compatibility)
    return (
        <div className="collection-opportunities-refactored">
            {/* Breadcrumbs */}
            <ContextualBreadcrumbs
                items={BREADCRUMB_PRESETS.collectionOpportunities}
                context="allocation"
                showContextIndicator={true}
            />
            
            {/* Header */}
            <Navbar className="opportunities-navbar">
                <Navbar.Group>
                    <h2 className="bp5-heading">
                        <SmartTooltip term="Collection Opportunities" context="allocation">
                            Collection Opportunities
                        </SmartTooltip>
                    </h2>
                    <Navbar.Divider />
                    
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
                    {state.selectedOpportunities.size > 0 && (
                        <Button
                            intent={Intent.PRIMARY}
                            icon="edit"
                            text={`Override ${state.selectedOpportunities.size} Selected`}
                            onClick={() => handleOpenOverrideModal()}
                        />
                    )}
                    
                    {pendingChanges.size > 0 && (
                        <>
                            <Button
                                intent={Intent.SUCCESS}
                                icon="tick"
                                text={`Commit ${pendingChanges.size} Changes`}
                                onClick={commitChanges}
                                disabled={isSaving}
                            />
                            <Button
                                icon="undo"
                                text="Rollback"
                                onClick={() => rollbackChanges()}
                                disabled={isSaving}
                            />
                        </>
                    )}
                </Navbar.Group>
            </Navbar>
            
            {/* Tabs */}
            <Tabs
                id="opportunity-tabs"
                selectedTabId={state.activeTab}
                onChange={(tabId) => dispatch({ type: 'SET_ACTIVE_TAB', tab: tabId as any })}
                className="opportunity-tabs"
            >
                <Tab id="all" title={`All (${opportunities.length})`} />
                <Tab id="needs-review" title="Action Required" />
                <Tab id="unmatched" title="Pending Allocation" />
            </Tabs>
            
            {/* Help Callout */}
            {state.activeTab === 'all' && filteredOpportunities.length > 0 && (
                <Callout className="help-callout" intent={Intent.PRIMARY} icon="info-sign">
                    <h4 className="bp5-heading">Quick Tips</h4>
                    <ul className="help-tips">
                        <li>Click any row to select it, or use Ctrl/Cmd+Click for multiple selections</li>
                        <li>Hold Shift and click to select a range of rows</li>
                        <li>Click "Override Selected" to bulk edit allocations</li>
                        <li>Changes are saved automatically when you commit them</li>
                    </ul>
                </Callout>
            )}
            
            {/* Table */}
            <div className="table-container">
                {renderTable()}
            </div>
            
            {/* Modals */}
            {overrideModalOpen && (
                <ManualOverrideModalRefactored
                    isOpen={overrideModalOpen}
                    onClose={() => setOverrideModalOpen(false)}
                    selectedOpportunityIds={Array.from(state.selectedOpportunities)}
                    collectionDeckId={selectedDeckId}
                    onSave={handleSaveOverride}
                />
            )}
        </div>
    );
};

// Export directly (performance monitoring HOC removed)
export const CollectionOpportunitiesRefactoredBento = CollectionOpportunitiesRefactoredBentoBase;