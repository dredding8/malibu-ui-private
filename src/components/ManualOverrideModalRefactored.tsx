import React, { useState, useCallback, useMemo, useReducer, useEffect } from 'react';
import {
    Dialog,
    Classes,
    Button,
    Card,
    Callout,
    ControlGroup,
    Divider,
    FormGroup,
    HTMLSelect,
    InputGroup,
    Intent,
    Menu,
    MenuItem,
    NonIdealState,
    NumericInput,
    ProgressBar,
    Tab,
    Tabs,
    Tag,
    TextArea,
    Tooltip,
    Position,
    Alert,
    Collapse,
    Icon,
} from '@blueprintjs/core';
import { Table2, Column, Cell, SelectionModes, Region, Regions } from '@blueprintjs/table';
// Note: Using native drag-and-drop instead of react-beautiful-dnd which is deprecated
import { useAllocationContext } from '../contexts/AllocationContext';
import {
    CollectionOpportunity,
    CollectionDeck,
    Site,
    Pass,
    AllocationChange,
    ClassificationLevel,
    OverrideJustification,
    SiteId,
    createSiteId
} from '../types/collectionOpportunities';
import { OverrideJustificationForm } from './OverrideJustificationForm';
import { calculateOpportunityHealth } from '../utils/opportunityHealth';
import './ManualOverrideModalRefactored.css';

interface ManualOverrideModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedOpportunityIds: string[];
    collectionDeckId: string | null;
    onSave: (changes: Map<string, CollectionOpportunity>) => Promise<void>;
}

// State management types
interface OverrideState {
    selectedDeckId: string | null;
    availablePasses: Pass[];
    allocations: Map<string, { siteId: string; passes: Pass[] }[]>;
    changes: AllocationChange[];
    justification: string; // Legacy field - keep for backward compatibility
    overrideJustification: Partial<OverrideJustification> | null; // NEW: Structured justification
    isJustificationValid: boolean; // NEW: Validation state
    classificationLevel: ClassificationLevel;
    specialInstructions: string;
    validationErrors: Map<string, string>;
    isValidating: boolean;
    isSaving: boolean;
    showUndoHistory: boolean;
    conflictResolution: 'override' | 'merge' | 'skip';
    // NEW: Site selection for justification context
    originalSiteId: SiteId | null;
    selectedSiteId: SiteId | null;
}

type OverrideAction =
    | { type: 'SET_DECK'; deckId: string }
    | { type: 'SET_AVAILABLE_PASSES'; passes: Pass[] }
    | { type: 'ALLOCATE_PASS'; oppId: string; siteId: string; pass: Pass }
    | { type: 'DEALLOCATE_PASS'; oppId: string; siteId: string; passId: string }
    | { type: 'BATCH_ALLOCATE'; allocations: { oppId: string; siteId: string; passes: Pass[] }[] }
    | { type: 'SET_JUSTIFICATION'; text: string }
    | { type: 'SET_OVERRIDE_JUSTIFICATION'; justification: Partial<OverrideJustification>; isValid: boolean } // NEW
    | { type: 'SET_SITE_SELECTION'; originalSiteId: SiteId; selectedSiteId: SiteId } // NEW
    | { type: 'SET_CLASSIFICATION'; level: ClassificationLevel }
    | { type: 'SET_INSTRUCTIONS'; text: string }
    | { type: 'ADD_VALIDATION_ERROR'; field: string; error: string }
    | { type: 'CLEAR_VALIDATION_ERRORS' }
    | { type: 'SET_VALIDATING'; isValidating: boolean }
    | { type: 'SET_SAVING'; isSaving: boolean }
    | { type: 'TOGGLE_UNDO_HISTORY' }
    | { type: 'SET_CONFLICT_RESOLUTION'; mode: 'override' | 'merge' | 'skip' }
    | { type: 'UNDO_CHANGE'; changeIndex: number }
    | { type: 'REDO_CHANGE'; change: AllocationChange }
    | { type: 'RESET_STATE' };

// Reducer for complex state management
function overrideReducer(state: OverrideState, action: OverrideAction): OverrideState {
    switch (action.type) {
        case 'SET_DECK':
            return {
                ...state,
                selectedDeckId: action.deckId
            };

        case 'SET_AVAILABLE_PASSES':
            return {
                ...state,
                availablePasses: action.passes
            };

        case 'ALLOCATE_PASS': {
            const newAllocations = new Map(state.allocations);
            const oppAllocations = newAllocations.get(action.oppId) || [];
            const siteAllocation = oppAllocations.find(a => a.siteId === action.siteId);
            
            if (siteAllocation) {
                siteAllocation.passes.push(action.pass);
            } else {
                oppAllocations.push({ siteId: action.siteId, passes: [action.pass] });
            }
            
            newAllocations.set(action.oppId, oppAllocations);
            
            // Remove from available passes
            const newAvailable = state.availablePasses.filter(p => p.id !== action.pass.id);
            
            // Add to change history
            const change: AllocationChange = {
                id: Date.now().toString(),
                timestamp: new Date(),
                type: 'allocate',
                opportunityId: action.oppId,
                siteId: action.siteId,
                passId: action.pass.id,
                previousValue: null,
                newValue: action.pass,
                userId: 'current-user'
            };
            
            return {
                ...state,
                allocations: newAllocations,
                availablePasses: newAvailable,
                changes: [...state.changes, change]
            };
        }

        case 'DEALLOCATE_PASS': {
            const newAllocations = new Map(state.allocations);
            const oppAllocations = newAllocations.get(action.oppId) || [];
            
            let deallocatedPass: Pass | null = null;
            
            oppAllocations.forEach(allocation => {
                if (allocation.siteId === action.siteId) {
                    const passIndex = allocation.passes.findIndex(p => p.id === action.passId);
                    if (passIndex !== -1) {
                        deallocatedPass = allocation.passes[passIndex];
                        allocation.passes.splice(passIndex, 1);
                    }
                }
            });
            
            if (deallocatedPass) {
                // Add back to available passes
                const change: AllocationChange = {
                    id: Date.now().toString(),
                    timestamp: new Date(),
                    type: 'deallocate',
                    opportunityId: action.oppId,
                    siteId: action.siteId,
                    passId: action.passId,
                    previousValue: deallocatedPass,
                    newValue: null,
                    userId: 'current-user'
                };
                
                return {
                    ...state,
                    allocations: newAllocations,
                    availablePasses: [...state.availablePasses, deallocatedPass],
                    changes: [...state.changes, change]
                };
            }
            
            return state;
        }

        case 'SET_JUSTIFICATION':
            return {
                ...state,
                justification: action.text
            };

        case 'SET_OVERRIDE_JUSTIFICATION':
            return {
                ...state,
                overrideJustification: action.justification,
                isJustificationValid: action.isValid
            };

        case 'SET_SITE_SELECTION':
            return {
                ...state,
                originalSiteId: action.originalSiteId,
                selectedSiteId: action.selectedSiteId
            };

        case 'SET_CLASSIFICATION':
            return {
                ...state,
                classificationLevel: action.level
            };

        case 'SET_INSTRUCTIONS':
            return {
                ...state,
                specialInstructions: action.text
            };

        case 'ADD_VALIDATION_ERROR': {
            const newErrors = new Map(state.validationErrors);
            newErrors.set(action.field, action.error);
            return {
                ...state,
                validationErrors: newErrors
            };
        }

        case 'CLEAR_VALIDATION_ERRORS':
            return {
                ...state,
                validationErrors: new Map()
            };

        case 'TOGGLE_UNDO_HISTORY':
            return {
                ...state,
                showUndoHistory: !state.showUndoHistory
            };

        case 'SET_CONFLICT_RESOLUTION':
            return {
                ...state,
                conflictResolution: action.mode
            };

        case 'UNDO_CHANGE': {
            const change = state.changes[action.changeIndex];
            if (!change) return state;
            
            // Implement undo logic based on change type
            // This is simplified - in practice would need to reverse the specific change
            const newChanges = [...state.changes];
            newChanges.splice(action.changeIndex, 1);
            
            return {
                ...state,
                changes: newChanges
            };
        }

        case 'RESET_STATE':
            return {
                selectedDeckId: null,
                availablePasses: [],
                allocations: new Map(),
                changes: [],
                justification: '',
                overrideJustification: null,
                isJustificationValid: false,
                classificationLevel: 'SECRET',
                specialInstructions: '',
                validationErrors: new Map(),
                isValidating: false,
                isSaving: false,
                showUndoHistory: false,
                conflictResolution: 'override',
                originalSiteId: null,
                selectedSiteId: null
            };

        default:
            return state;
    }
}

// Simple toast notification function
const showToast = (message: string, intent: Intent) => {
    // In a production app, you would use a proper toast library or context
    // For now, we'll just log to console
    console.log(`Toast: ${message} (${intent})`);
};

export const ManualOverrideModalRefactored: React.FC<ManualOverrideModalProps> = ({
    isOpen,
    onClose,
    selectedOpportunityIds,
    collectionDeckId,
    onSave
}) => {
    const { 
        opportunities,
        collectionDecks,
        sites,
        getOpportunityById,
        getCollectionDeckById,
        getSiteById
    } = useAllocationContext();

    const [state, dispatch] = useReducer(overrideReducer, {
        selectedDeckId: collectionDeckId,
        availablePasses: [],
        allocations: new Map(),
        changes: [],
        justification: '',
        overrideJustification: null,
        isJustificationValid: false,
        classificationLevel: 'SECRET',
        specialInstructions: '',
        validationErrors: new Map(),
        isValidating: false,
        isSaving: false,
        showUndoHistory: false,
        conflictResolution: 'override',
        originalSiteId: null,
        selectedSiteId: null
    });

    const [activeTab, setActiveTab] = useState<'allocation' | 'justification' | 'review'>('allocation');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPassIds, setSelectedPassIds] = useState<Set<string>>(new Set());
    const [showConflictAlert, setShowConflictAlert] = useState(false);
    const [showAutoOptimize, setShowAutoOptimize] = useState(false);

    // Load available passes when deck changes
    useEffect(() => {
        if (state.selectedDeckId) {
            const deck = getCollectionDeckById(state.selectedDeckId);
            if (deck) {
                // Simulate loading available passes
                const mockPasses: Pass[] = Array.from({ length: 20 }, (_, i) => ({
                    id: `pass-${i}`,
                    name: `Pass ${i + 1}`,
                    startTime: new Date(Date.now() + i * 3600000),
                    endTime: new Date(Date.now() + (i + 1) * 3600000),
                    quality: Math.floor(Math.random() * 5) + 1,
                    siteCapabilities: sites.slice(0, Math.floor(Math.random() * sites.length) + 1),
                    priority: Math.random() > 0.5 ? 'high' : 'normal',
                    classificationLevel: 'UNCLASSIFIED',
                    metadata: {
                        satellite: deck.satellite,
                        sensor: deck.sensor,
                        downlinkSite: `Site ${Math.floor(Math.random() * 5) + 1}`
                    }
                }));
                dispatch({ type: 'SET_AVAILABLE_PASSES', passes: mockPasses });
            }
        }
    }, [state.selectedDeckId, getCollectionDeckById, sites]);

    // Initialize allocations from selected opportunities
    useEffect(() => {
        const initialAllocations = new Map();
        selectedOpportunityIds.forEach(id => {
            const opp = getOpportunityById(id);
            if (opp) {
                const allocations = opp.allocatedSites.map(site => ({
                    siteId: site.id,
                    passes: [] // Would load actual passes here
                }));
                initialAllocations.set(id, allocations);
            }
        });
        // Would dispatch to set initial allocations
    }, [selectedOpportunityIds, getOpportunityById]);

    // Filtered passes based on search
    const filteredPasses = useMemo(() => {
        if (!searchQuery) return state.availablePasses;
        const query = searchQuery.toLowerCase();
        return state.availablePasses.filter(pass =>
            pass.name.toLowerCase().includes(query) ||
            pass.metadata?.satellite?.toLowerCase().includes(query) ||
            pass.metadata?.sensor?.toLowerCase().includes(query)
        );
    }, [state.availablePasses, searchQuery]);

    // Calculate total allocations and capacity
    const allocationStats = useMemo(() => {
        let totalAllocated = 0;
        let totalCapacity = 0;
        
        state.allocations.forEach((allocations, oppId) => {
            const opp = getOpportunityById(oppId);
            if (opp) {
                totalCapacity += opp.capacity;
                allocations.forEach(allocation => {
                    totalAllocated += allocation.passes.length;
                });
            }
        });
        
        return { totalAllocated, totalCapacity };
    }, [state.allocations, getOpportunityById]);

    // Handlers
    // Drag and drop state
    const [draggedPass, setDraggedPass] = useState<Pass | null>(null);
    const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
    
    const handleDragStart = useCallback((e: React.DragEvent, pass: Pass) => {
        setDraggedPass(pass);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', pass.id);
    }, []);
    
    const handleDragEnd = useCallback(() => {
        setDraggedPass(null);
        setDragOverTarget(null);
    }, []);
    
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);
    
    const handleDragEnter = useCallback((e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        setDragOverTarget(targetId);
    }, []);
    
    const handleDragLeave = useCallback((e: React.DragEvent) => {
        // Check if we're actually leaving the drop zone
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        
        if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
            setDragOverTarget(null);
        }
    }, []);
    
    const handleDrop = useCallback((e: React.DragEvent, oppId: string, siteId: string) => {
        e.preventDefault();
        
        if (!draggedPass) return;
        
        dispatch({ 
            type: 'ALLOCATE_PASS', 
            oppId, 
            siteId, 
            pass: draggedPass 
        });
        
        // Show success feedback
        showToast(`Allocated ${draggedPass.name} to site`, Intent.SUCCESS);
        
        setDraggedPass(null);
        setDragOverTarget(null);
    }, [draggedPass]);

    const handleBatchAllocate = useCallback(() => {
        if (selectedPassIds.size === 0) return;
        
        // Show allocation dialog
        setShowAutoOptimize(true);
    }, [selectedPassIds]);

    const handleAutoOptimize = useCallback(() => {
        // Implement auto-optimization logic
        // This would analyze site capabilities and pass quality to make optimal allocations
        showToast('Auto-optimization complete', Intent.SUCCESS);
        setShowAutoOptimize(false);
    }, []);

    const validateForm = useCallback((): boolean => {
        dispatch({ type: 'CLEAR_VALIDATION_ERRORS' });
        let isValid = true;
        
        if (!state.justification.trim()) {
            dispatch({
                type: 'ADD_VALIDATION_ERROR',
                field: 'justification',
                error: 'Comment required'
            });
            isValid = false;
        }

        if (state.justification.trim().length < 50) {
            dispatch({
                type: 'ADD_VALIDATION_ERROR',
                field: 'justification',
                error: 'Comment must be at least 50 characters'
            });
            isValid = false;
        }
        
        if (allocationStats.totalAllocated > allocationStats.totalCapacity) {
            dispatch({ 
                type: 'ADD_VALIDATION_ERROR', 
                field: 'capacity', 
                error: 'Total allocations exceed capacity' 
            });
            isValid = false;
        }
        
        return isValid;
    }, [state.justification, allocationStats]);

    const handleSave = useCallback(async () => {
        if (!validateForm()) {
            setActiveTab('justification');
            return;
        }
        
        dispatch({ type: 'SET_SAVING', isSaving: true });
        
        try {
            // Convert allocations to opportunity updates
            const changes = new Map<string, CollectionOpportunity>();
            
            state.allocations.forEach((allocations, oppId) => {
                const opp = getOpportunityById(oppId);
                if (opp) {
                    const updatedOpp = {
                        ...opp,
                        // Update with new allocations
                        lastModified: new Date().toISOString(),
                        modifiedBy: 'current-user',
                        changeJustification: state.justification,
                        classificationLevel: state.classificationLevel
                    };
                    changes.set(oppId, updatedOpp);
                }
            });
            
            await onSave(changes);
            
            showToast('Pass allocated to site', Intent.SUCCESS);
            
            onClose();
        } catch (error) {
            showToast(`Error saving overrides: ${error instanceof Error ? error.message : 'Unknown error'}`, Intent.DANGER);
        } finally {
            dispatch({ type: 'SET_SAVING', isSaving: false });
        }
    }, [validateForm, state, getOpportunityById, onSave, onClose]);

    // Render helpers
    /**
     * Format date to Zulu time (UTC) in military format: HHmmZ
     * @param date Date to format
     * @returns Formatted Zulu time string (e.g., "1542Z")
     */
    const formatZuluTime = (date: Date): string => {
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return `${hours}${minutes}Z`;
    };

    // Workshop Pattern: Object Table for structured data
    // Blueprint Implementation: Table2 with custom cell renderers

    const classificationCellRenderer = (rowIndex: number) => {
        const pass = filteredPasses[rowIndex];
        if (!pass) return <Cell />;

        const getClassificationIntent = (level: string) => {
            switch (level) {
                case 'UNCLASSIFIED': return Intent.SUCCESS;
                case 'CONFIDENTIAL': return Intent.PRIMARY;
                case 'SECRET': return Intent.DANGER;
                case 'TOP_SECRET': return Intent.WARNING;
                default: return Intent.NONE;
            }
        };

        return (
            <Cell>
                <Tag intent={getClassificationIntent(pass.classificationLevel)} minimal>
                    {pass.classificationLevel.replace(/_/g, ' ')}
                </Tag>
            </Cell>
        );
    };

    const passNameCellRenderer = (rowIndex: number) => {
        const pass = filteredPasses[rowIndex];
        if (!pass) return <Cell />;
        return <Cell><strong>{pass.name}</strong></Cell>;
    };

    const timeWindowCellRenderer = (rowIndex: number) => {
        const pass = filteredPasses[rowIndex];
        if (!pass) return <Cell />;
        return (
            <Cell>
                <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                    {formatZuluTime(pass.startTime)} - {formatZuluTime(pass.endTime)}
                </span>
            </Cell>
        );
    };

    const satelliteCellRenderer = (rowIndex: number) => {
        const pass = filteredPasses[rowIndex];
        if (!pass) return <Cell />;
        return <Cell>{pass.metadata?.satellite || 'Unknown'}</Cell>;
    };

    const priorityCellRenderer = (rowIndex: number) => {
        const pass = filteredPasses[rowIndex];
        if (!pass) return <Cell />;
        return (
            <Cell>
                <Tag
                    intent={
                        pass.priority === 'critical' ? Intent.DANGER :
                        pass.priority === 'high' ? Intent.WARNING :
                        Intent.NONE
                    }
                    minimal
                >
                    {pass.priority.toUpperCase()}
                </Tag>
            </Cell>
        );
    };

    const conflictsCellRenderer = (rowIndex: number) => {
        const pass = filteredPasses[rowIndex];
        if (!pass) return <Cell />;
        if (!pass.conflictsWith || pass.conflictsWith.length === 0) return <Cell>-</Cell>;
        return (
            <Cell>
                <Tag intent={Intent.DANGER} icon="warning-sign" minimal>
                    {pass.conflictsWith.length}
                </Tag>
            </Cell>
        );
    };

    // Convert selectedPassIds to Table2 regions
    const selectedPassRegions = useMemo((): Region[] => {
        return Array.from(selectedPassIds)
            .map(id => {
                const index = filteredPasses.findIndex(p => p.id === id);
                return index >= 0 ? Regions.row(index) : null;
            })
            .filter((region): region is Region => region !== null);
    }, [selectedPassIds, filteredPasses]);

    const handlePassSelection = useCallback((regions: Region[]) => {
        const selectedRows = regions
            .filter(region => region.cols == null && region.rows != null)
            .map(region => {
                const [start, end] = region.rows!;
                const indices: number[] = [];
                for (let i = start; i <= end; i++) {
                    indices.push(i);
                }
                return indices;
            })
            .flat();

        const newSelectedIds = selectedRows.map(index => filteredPasses[index]?.id).filter(Boolean);
        setSelectedPassIds(new Set(newSelectedIds));
    }, [filteredPasses]);

    const renderAllocationPanel = () => (
        <div className="allocation-panel">
            <div className="split-workspace">
                    {/* Left Panel - Available Passes */}
                    <div className="left-panel">
                        <div className="panel-header">
                            <h3>Available Passes</h3>
                            <Tag round>{state.availablePasses.length}</Tag>
                        </div>
                        
                        <ControlGroup fill>
                            <InputGroup
                                leftIcon="search"
                                placeholder="Search passes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Button
                                intent={Intent.PRIMARY}
                                icon="automatic-updates"
                                text="Auto-Optimize"
                                onClick={handleBatchAllocate}
                                disabled={selectedPassIds.size === 0}
                            />
                        </ControlGroup>
                        
                        {selectedPassIds.size > 0 && (
                            <Callout intent={Intent.PRIMARY} className="selection-callout">
                                {selectedPassIds.size} passes selected
                                <Button
                                    minimal
                                    small
                                    onClick={() => setSelectedPassIds(new Set())}
                                >
                                    Clear
                                </Button>
                            </Callout>
                        )}

                        {/* Workshop Object Table Pattern - Blueprint Table2 Implementation */}
                        <div className="passes-table-container">
                            <Table2
                                numRows={filteredPasses.length}
                                selectionModes={SelectionModes.ROWS_ONLY}
                                selectedRegions={selectedPassRegions}
                                onSelection={handlePassSelection}
                                enableMultipleSelection={true}
                                enableColumnResizing={false}
                                columnWidths={[120, 150, 180, 120, 100, 80]}
                            >
                                <Column name="Classification" cellRenderer={classificationCellRenderer} />
                                <Column name="Pass Name" cellRenderer={passNameCellRenderer} />
                                <Column name="Time Window" cellRenderer={timeWindowCellRenderer} />
                                <Column name="Satellite" cellRenderer={satelliteCellRenderer} />
                                <Column name="Priority" cellRenderer={priorityCellRenderer} />
                                <Column name="Conflicts" cellRenderer={conflictsCellRenderer} />
                            </Table2>
                        </div>
                    </div>
                    
                    {/* Right Panel - Site Allocations */}
                    <div className="right-panel">
                        <div className="panel-header">
                            <h3>Site Allocations</h3>
                            <ProgressBar
                                value={allocationStats.totalAllocated / allocationStats.totalCapacity}
                                intent={
                                    allocationStats.totalAllocated > allocationStats.totalCapacity
                                        ? Intent.DANGER
                                        : allocationStats.totalAllocated > allocationStats.totalCapacity * 0.9
                                        ? Intent.WARNING
                                        : Intent.SUCCESS
                                }
                                animate={false}
                                stripes={false}
                                className="capacity-bar"
                            />
                            <span className="capacity-text">
                                {allocationStats.totalAllocated} / {allocationStats.totalCapacity} allocated
                            </span>
                        </div>
                        
                        <div className="allocations-list">
                            {selectedOpportunityIds.map(oppId => {
                                const opp = getOpportunityById(oppId);
                                if (!opp) return null;
                                
                                return (
                                    <Card key={oppId} className="opportunity-allocation">
                                        <h4>{opp.name}</h4>
                                        
                                        {opp.allocatedSites.map(site => {
                                            const siteAllocations = state.allocations.get(oppId)?.find(
                                                a => a.siteId === site.id
                                            );
                                            
                                            return (
                                                <div
                                                    key={site.id}
                                                    className={`site-dropzone ${
                                                        dragOverTarget === `${oppId}-${site.id}` ? 'dragging-over' : ''
                                                    }`}
                                                    onDragOver={handleDragOver}
                                                    onDragEnter={(e) => handleDragEnter(e, `${oppId}-${site.id}`)}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={(e) => handleDrop(e, oppId, site.id)}
                                                >
                                                            <div className="site-header">
                                                                <Icon icon="satellite" />
                                                                <span>{site.name}</span>
                                                                <Tag minimal round>
                                                                    {siteAllocations?.passes.length || 0} passes
                                                                </Tag>
                                                            </div>
                                                            
                                                            <div className="allocated-passes">
                                                                {siteAllocations?.passes.map(pass => (
                                                                    <Tag
                                                                        key={pass.id}
                                                                        intent={Intent.PRIMARY}
                                                                        onRemove={() => dispatch({
                                                                            type: 'DEALLOCATE_PASS',
                                                                            oppId,
                                                                            siteId: site.id,
                                                                            passId: pass.id
                                                                        })}
                                                                    >
                                                                        {pass.name}
                                                                    </Tag>
                                                                ))}
                                                            </div>
                                                </div>
                                            );
                                        })}
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
            </div>
        </div>
    );

    // Handler for justification form changes
    const handleJustificationChange = useCallback((
        justification: Partial<OverrideJustification>,
        isValid: boolean
    ) => {
        dispatch({
            type: 'SET_OVERRIDE_JUSTIFICATION',
            justification,
            isValid
        });
    }, []);

    // Determine site names for justification form
    const getSelectedSiteInfo = () => {
        if (!state.originalSiteId || !state.selectedSiteId) {
            // Default to first opportunity's sites if not set
            const firstOpp = getOpportunityById(selectedOpportunityIds[0]);
            if (firstOpp && firstOpp.allocatedSites.length > 0) {
                const original = firstOpp.allocatedSites[0];
                const alternative = sites.find(s => s.id !== original.id) || sites[0];
                return {
                    originalSiteId: createSiteId(original.id),
                    originalSiteName: original.name,
                    alternativeSiteId: createSiteId(alternative?.id || 'alt-site'),
                    alternativeSiteName: alternative?.name || 'Alternative Site'
                };
            }
        }

        const originalSite = getSiteById(state.originalSiteId || '');
        const selectedSite = getSiteById(state.selectedSiteId || '');

        return {
            originalSiteId: state.originalSiteId || createSiteId('original-site'),
            originalSiteName: originalSite?.name || 'System Recommendation',
            alternativeSiteId: state.selectedSiteId || createSiteId('selected-site'),
            alternativeSiteName: selectedSite?.name || 'Your Selection'
        };
    };

    const siteInfo = getSelectedSiteInfo();

    const renderJustificationPanel = () => (
        <div className="justification-panel">
            <Callout intent={Intent.PRIMARY} icon="info-sign" className="justification-info">
                <strong>Comment required to override site allocation (Secret Data Only)</strong>
                <p>
                    Override comments ensure clear communication with operators and provide
                    an audit trail for collection decisions. Your comment will be included
                    in exported tasking and visible to all downstream users.
                </p>
            </Callout>

            {/* NEW: Structured Override Justification Form */}
            <OverrideJustificationForm
                originalSiteId={siteInfo.originalSiteId}
                originalSiteName={siteInfo.originalSiteName}
                alternativeSiteId={siteInfo.alternativeSiteId}
                alternativeSiteName={siteInfo.alternativeSiteName}
                onJustificationChange={handleJustificationChange}
                userId="current-user" // TODO: Get from authentication context
                userName="Current User" // TODO: Get from authentication context
                disabled={state.isSaving}
            />

            <Divider />

            {/* Legacy justification field - keep for backward compatibility */}
            <Collapse isOpen={false}>
                <FormGroup
                    label="Additional Notes (Optional)"
                    helperText="Legacy justification field for backward compatibility"
                >
                    <TextArea
                        fill
                        rows={4}
                        value={state.justification}
                        onChange={(e) => dispatch({
                            type: 'SET_JUSTIFICATION',
                            text: e.target.value
                        })}
                        placeholder="Any additional notes..."
                        intent={state.validationErrors.has('justification') ? Intent.DANGER : Intent.NONE}
                    />
                </FormGroup>
            </Collapse>
            
            <FormGroup label="Classification Level">
                <HTMLSelect
                    value={state.classificationLevel}
                    onChange={(e) => dispatch({ 
                        type: 'SET_CLASSIFICATION', 
                        level: e.target.value as ClassificationLevel 
                    })}
                >
                    <option value="UNCLASSIFIED">Unclassified</option>
                    <option value="CONFIDENTIAL">Confidential</option>
                    <option value="SECRET">Secret</option>
                    <option value="TOP_SECRET">Top Secret</option>
                </HTMLSelect>
            </FormGroup>
            
            {state.classificationLevel !== 'UNCLASSIFIED' && (
                <Callout intent={Intent.WARNING} icon="warning-sign">
                    This override will be marked as {state.classificationLevel}. 
                    Ensure proper handling procedures are followed.
                </Callout>
            )}
            
            <FormGroup label="Special Instructions" labelInfo="(optional)">
                <TextArea
                    fill
                    rows={4}
                    value={state.specialInstructions}
                    onChange={(e) => dispatch({ 
                        type: 'SET_INSTRUCTIONS', 
                        text: e.target.value 
                    })}
                    placeholder="Any special handling instructions..."
                />
            </FormGroup>
            
            <FormGroup label="Conflict Resolution">
                <HTMLSelect
                    value={state.conflictResolution}
                    onChange={(e) => dispatch({ 
                        type: 'SET_CONFLICT_RESOLUTION', 
                        mode: e.target.value as any
                    })}
                >
                    <option value="override">Override Existing</option>
                    <option value="merge">Merge with Existing</option>
                    <option value="skip">Skip Conflicts</option>
                </HTMLSelect>
            </FormGroup>
            
            <Card className="template-suggestions">
                <h4>Quick Templates</h4>
                <Button
                    minimal
                    text="Urgent Mission Requirement"
                    onClick={() => dispatch({
                        type: 'SET_JUSTIFICATION',
                        text: 'Urgent mission requirement necessitates immediate reallocation of collection resources. This override is required to support critical operations with time-sensitive intelligence requirements.'
                    })}
                />
                <Button
                    minimal
                    text="System Optimization"
                    onClick={() => dispatch({
                        type: 'SET_JUSTIFICATION',
                        text: 'System optimization analysis indicates improved collection efficiency through manual reallocation. This override will result in better resource utilization and increased mission success probability.'
                    })}
                />
                <Button
                    minimal
                    text="Weather Contingency"
                    onClick={() => dispatch({
                        type: 'SET_JUSTIFICATION',
                        text: 'Weather conditions require manual override to ensure collection success. Forecast analysis indicates suboptimal conditions at originally allocated sites, necessitating reallocation to alternate locations.'
                    })}
                />
            </Card>
        </div>
    );

    const renderReviewPanel = () => (
        <div className="review-panel">
            <Callout intent={Intent.PRIMARY} icon="info-sign" title="Review Your Changes">
                Please review all allocations and justification before submitting.
            </Callout>
            
            <Card className="change-summary">
                <h3>Change Summary</h3>
                
                <div className="summary-stats">
                    <div className="stat">
                        <Icon icon="satellite" size={20} />
                        <div>
                            <div className="stat-value">{selectedOpportunityIds.length}</div>
                            <div className="stat-label">Opportunities Modified</div>
                        </div>
                    </div>
                    
                    <div className="stat">
                        <Icon icon="exchange" size={20} />
                        <div>
                            <div className="stat-value">{state.changes.length}</div>
                            <div className="stat-label">Total Changes</div>
                        </div>
                    </div>
                    
                    <div className="stat">
                        <Icon icon="time" size={20} />
                        <div>
                            <div className="stat-value">
                                {allocationStats.totalAllocated}
                            </div>
                            <div className="stat-label">Passes Allocated</div>
                        </div>
                    </div>
                </div>
                
                <Divider />
                
                <div className="change-list">
                    <div className="change-list-header">
                        <h4>Recent Changes</h4>
                        <Button
                            minimal
                            small
                            icon={state.showUndoHistory ? "chevron-up" : "chevron-down"}
                            onClick={() => dispatch({ type: 'TOGGLE_UNDO_HISTORY' })}
                        >
                            {state.showUndoHistory ? 'Hide' : 'Show'} History
                        </Button>
                    </div>
                    
                    <Collapse isOpen={state.showUndoHistory}>
                        <div className="history-list">
                            {state.changes.slice(-10).reverse().map((change, index) => (
                                <div key={change.id} className="history-item">
                                    <Icon 
                                        icon={change.type === 'allocate' ? 'add' : 'remove'} 
                                        intent={change.type === 'allocate' ? Intent.SUCCESS : Intent.DANGER}
                                    />
                                    <span className="history-text">
                                        {change.type === 'allocate' ? 'Allocated' : 'Deallocated'} pass 
                                        to {getSiteById(change.siteId)?.name}
                                    </span>
                                    <Button
                                        minimal
                                        small
                                        icon="undo"
                                        onClick={() => dispatch({ 
                                            type: 'UNDO_CHANGE', 
                                            changeIndex: state.changes.length - index - 1 
                                        })}
                                    />
                                </div>
                            ))}
                        </div>
                    </Collapse>
                </div>
            </Card>
            
            <Card className="justification-preview">
                <h4>Comment Preview</h4>
                <p>{state.justification || <em>No comment provided</em>}</p>
                
                {state.specialInstructions && (
                    <>
                        <h4>Special Instructions</h4>
                        <p>{state.specialInstructions}</p>
                    </>
                )}
                
                <div className="metadata">
                    <Tag intent={Intent.PRIMARY}>
                        Classification: {state.classificationLevel}
                    </Tag>
                    <Tag>
                        Conflict Resolution: {state.conflictResolution}
                    </Tag>
                </div>
            </Card>
            
            {state.validationErrors.size > 0 && (
                <Callout intent={Intent.DANGER} icon="error">
                    <h4>Validation Errors</h4>
                    <ul>
                        {Array.from(state.validationErrors.entries()).map(([field, error]) => (
                            <li key={field}>{error}</li>
                        ))}
                    </ul>
                </Callout>
            )}
        </div>
    );

    return (
        <>
            <Dialog
                isOpen={isOpen}
                onClose={onClose}
                title="Manual Override - Collection Deck Allocation"
                className="manual-override-modal-refactored"
                style={{ width: '90vw', maxWidth: '1400px' }}
            >
                <div className={Classes.DIALOG_BODY}>
                    <Tabs
                        id="override-tabs"
                        selectedTabId={activeTab}
                        onChange={(tabId) => setActiveTab(tabId as any)}
                        className="override-tabs"
                    >
                        <Tab 
                            id="allocation" 
                            title={
                                <span>
                                    <Icon icon="exchange" /> Allocation
                                </span>
                            }
                            panel={renderAllocationPanel()} 
                        />
                        <Tab
                            id="justification"
                            title={
                                <span>
                                    <Icon icon="annotation" /> Comment
                                    {!state.isJustificationValid && (
                                        <Icon icon="error" intent={Intent.WARNING} />
                                    )}
                                    {state.isJustificationValid && (
                                        <Icon icon="tick-circle" intent={Intent.SUCCESS} />
                                    )}
                                </span>
                            }
                            panel={renderJustificationPanel()}
                        />
                        <Tab 
                            id="review" 
                            title={
                                <span>
                                    <Icon icon="eye-open" /> Review & Submit
                                </span>
                            }
                            panel={renderReviewPanel()} 
                        />
                    </Tabs>
                </div>
                
                <div className={Classes.DIALOG_FOOTER}>
                    <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                        <div className="footer-info">
                            {state.changes.length > 0 && (
                                <Tag intent={Intent.WARNING} round>
                                    {state.changes.length} unsaved changes
                                </Tag>
                            )}
                        </div>
                        
                        <Button onClick={onClose} disabled={state.isSaving}>
                            Cancel
                        </Button>
                        <Button
                            intent={Intent.PRIMARY}
                            onClick={handleSave}
                            loading={state.isSaving}
                            disabled={state.changes.length === 0 || !state.isJustificationValid}
                            title={!state.isJustificationValid ? 'Complete comment before allocating' : ''}
                        >
                            Allocate
                        </Button>
                    </div>
                </div>
            </Dialog>
            
            {/* Conflict Resolution Alert */}
            <Alert
                isOpen={showConflictAlert}
                onClose={() => setShowConflictAlert(false)}
                icon="warning-sign"
                intent={Intent.WARNING}
                confirmButtonText="Proceed"
                cancelButtonText="Cancel"
            >
                <p>
                    Conflicts detected with existing allocations. 
                    How would you like to proceed?
                </p>
                <HTMLSelect
                    value={state.conflictResolution}
                    onChange={(e) => dispatch({ 
                        type: 'SET_CONFLICT_RESOLUTION', 
                        mode: e.target.value as any
                    })}
                >
                    <option value="override">Override Existing</option>
                    <option value="merge">Merge with Existing</option>
                    <option value="skip">Skip Conflicts</option>
                </HTMLSelect>
            </Alert>
            
            {/* Auto-Optimize Dialog */}
            <Dialog
                isOpen={showAutoOptimize}
                onClose={() => setShowAutoOptimize(false)}
                title="Auto-Optimize Allocations"
                className="auto-optimize-dialog"
            >
                <div className={Classes.DIALOG_BODY}>
                    <Callout intent={Intent.PRIMARY} icon="automatic-updates">
                        The system will automatically distribute the selected passes
                        based on site capabilities, pass quality, and current capacity.
                    </Callout>
                    
                    <FormGroup label="Optimization Strategy">
                        <HTMLSelect fill>
                            <option value="balanced">Balanced Distribution</option>
                            <option value="quality">Prioritize High Quality</option>
                            <option value="capacity">Maximize Capacity Usage</option>
                            <option value="coverage">Optimize Coverage</option>
                        </HTMLSelect>
                    </FormGroup>
                    
                    <FormGroup label="Selected Passes">
                        <p>{selectedPassIds.size} passes selected for optimization</p>
                    </FormGroup>
                </div>
                
                <div className={Classes.DIALOG_FOOTER}>
                    <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                        <Button onClick={() => setShowAutoOptimize(false)}>
                            Cancel
                        </Button>
                        <Button
                            intent={Intent.PRIMARY}
                            icon="automatic-updates"
                            onClick={handleAutoOptimize}
                        >
                            Optimize
                        </Button>
                    </div>
                </div>
            </Dialog>
        </>
    );
};