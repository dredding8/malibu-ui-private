import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
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
    Collapse,
    Switch,
    Classes,
    Icon as BpIcon,
} from '@blueprintjs/core';
import { Icon } from '../utils/blueprintIconWrapper';
import { SmartTooltip } from './shared/SmartTooltip';
import { ChunkedSiteDisplay, EnhancedHealthIndicator } from './CollectionOpportunitiesUXImprovements';
import { 
    CollectionOpportunity,
    CollectionDeck,
    Site,
    Pass,
    AllocationChange,
    ClassificationLevel,
    Priority,
    MatchStatus
} from '../types/collectionOpportunities';
import { calculateOpportunityHealth, convertToHealthAnalysis } from '../utils/opportunityHealth';
import { validateOpportunity } from '../utils/opportunityValidation';
import './AllocationEditorPanel.css';

interface AllocationEditorPanelProps {
    opportunity: CollectionOpportunity | null;
    selectedOpportunityIds: string[];
    sites: Site[];
    collectionDecks: CollectionDeck[];
    onSave: (opportunity: CollectionOpportunity) => Promise<void>;
    onClose: () => void;
    isLoading?: boolean;
}

export const AllocationEditorPanel: React.FC<AllocationEditorPanelProps> = ({
    opportunity,
    selectedOpportunityIds,
    sites,
    collectionDecks,
    onSave,
    onClose,
    isLoading = false
}) => {
    const [editedOpportunity, setEditedOpportunity] = useState<CollectionOpportunity | null>(null);
    const [selectedSiteId, setSelectedSiteId] = useState<string>('');
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
    const [justification, setJustification] = useState('');
    const [classificationLevel, setClassificationLevel] = useState<ClassificationLevel>('UNCLASSIFIED');
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map());
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('allocation');

    // Initialize edited opportunity when prop changes
    useEffect(() => {
        if (opportunity) {
            setEditedOpportunity({ ...opportunity });
            setSelectedSiteId(opportunity.allocatedSites[0]?.id || '');
            setActiveTab('allocation');
            setClassificationLevel(opportunity.classificationLevel || 'UNCLASSIFIED');
            setValidationErrors(new Map());
        }
    }, [opportunity]);

    // Calculate health score for current editing state
    const currentHealth = useMemo(() => {
        if (!editedOpportunity) return null;
        return calculateOpportunityHealth(editedOpportunity);
    }, [editedOpportunity]);

    // Validate current state
    const validateCurrentState = useCallback(() => {
        if (!editedOpportunity) return false;
        
        const errors = new Map<string, string>();
        const validation = validateOpportunity(editedOpportunity, { critical: 10, warning: 30, optimal: 70 });
        
        if (validation.length > 0) {
            validation.forEach(error => {
                errors.set(error.field, error.message);
            });
        }
        
        if (!justification.trim() && editedOpportunity.matchStatus !== 'baseline') {
            errors.set('justification', 'Justification required for non-baseline allocations');
        }
        
        setValidationErrors(errors);
        return errors.size === 0;
    }, [editedOpportunity, justification]);

    // Handle site allocation change
    const handleSiteChange = useCallback((siteId: string) => {
        if (!editedOpportunity) return;
        
        setSelectedSiteId(siteId);
        
        if (siteId) {
            const site = sites.find(s => s.id === siteId);
            if (site) {
                setEditedOpportunity({
                    ...editedOpportunity,
                    allocatedSites: [site],
                    matchStatus: 'baseline' as MatchStatus
                });
            }
        } else {
            setEditedOpportunity({
                ...editedOpportunity,
                allocatedSites: [],
                matchStatus: 'unmatched' as MatchStatus
            });
        }
    }, [editedOpportunity, sites]);

    // Handle priority change
    const handlePriorityChange = useCallback((priority: Priority) => {
        if (!editedOpportunity) return;
        
        setEditedOpportunity({
            ...editedOpportunity,
            priority
        });
    }, [editedOpportunity]);

    // Handle capacity change
    const handleCapacityChange = useCallback((capacity: number) => {
        if (!editedOpportunity || capacity < 0) return;
        
        setEditedOpportunity({
            ...editedOpportunity,
            capacity
        });
    }, [editedOpportunity]);

    // Handle save
    const handleSave = useCallback(async () => {
        if (!editedOpportunity || !validateCurrentState()) return;
        
        setIsSaving(true);
        try {
            // Add metadata
            const opportunityWithMetadata: CollectionOpportunity = {
                ...editedOpportunity,
                lastModified: new Date().toISOString(),
                modifiedBy: 'current-user', // Would come from auth context
                changeJustification: justification,
                classificationLevel
            };
            
            await onSave(opportunityWithMetadata);
            
            // Reset form
            setJustification('');
            setSpecialInstructions('');
            setValidationErrors(new Map());
        } catch (error) {
            console.error('Failed to save opportunity:', error);
            setValidationErrors(new Map([['save', 'Failed to save changes']]));
        } finally {
            setIsSaving(false);
        }
    }, [editedOpportunity, validateCurrentState, justification, classificationLevel, specialInstructions, onSave]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + S: Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's' && editedOpportunity) {
                e.preventDefault();
                handleSave();
            }
            
            // Ctrl/Cmd + Enter: Save
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && editedOpportunity) {
                e.preventDefault();
                handleSave();
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editedOpportunity, handleSave]);

    if (!opportunity || !editedOpportunity) {
        return (
            <div className="allocation-editor-panel">
                <NonIdealState
                    icon="select"
                    title="No Opportunity Selected"
                    description="Select an opportunity from the table to view and edit its allocation"
                />
            </div>
        );
    }

    const isMultiEdit = selectedOpportunityIds.length > 1;
    const hasChanges = JSON.stringify(opportunity) !== JSON.stringify(editedOpportunity);

    return (
        <div className="allocation-editor-panel">
            {/* Header */}
            <div className="panel-header">
                <div className="header-content">
                    <h3 className="bp5-heading">
                        {isMultiEdit ? (
                            <>Edit {selectedOpportunityIds.length} Opportunities</>
                        ) : (
                            <>Edit: {editedOpportunity.name}</>
                        )}
                    </h3>
                    <Button
                        icon="cross"
                        minimal
                        onClick={onClose}
                        title="Close panel (Esc)"
                    />
                </div>
                
                {hasChanges && (
                    <Callout intent={Intent.WARNING} icon="warning-sign" className="unsaved-changes">
                        You have unsaved changes
                    </Callout>
                )}
            </div>

            {/* Quick Info Bar */}
            <Card className="quick-info-bar">
                <div className="info-grid">
                    <div className="info-item">
                        <span className="label">Status:</span>
                        <Tag intent={
                            editedOpportunity.matchStatus === 'baseline' ? Intent.SUCCESS :
                            editedOpportunity.matchStatus === 'suboptimal' ? Intent.WARNING :
                            Intent.DANGER
                        }>
                            {editedOpportunity.matchStatus || 'Unmatched'}
                        </Tag>
                    </div>
                    <div className="info-item">
                        <span className="label">Priority:</span>
                        <Tag intent={
                            editedOpportunity.priority === 'critical' ? Intent.DANGER :
                            editedOpportunity.priority === 'high' ? Intent.WARNING :
                            Intent.NONE
                        }>
                            P{editedOpportunity.priority === 'critical' ? '1' : 
                              editedOpportunity.priority === 'high' ? '2' : 
                              editedOpportunity.priority === 'medium' ? '3' : '4'}
                        </Tag>
                    </div>
                    <div className="info-item">
                        <span className="label">Health:</span>
                        {currentHealth && <EnhancedHealthIndicator health={convertToHealthAnalysis(currentHealth)} />}
                    </div>
                    <div className="info-item">
                        <span className="label">Capacity:</span>
                        <span>{editedOpportunity.totalPasses}/{editedOpportunity.capacity}</span>
                    </div>
                </div>
            </Card>

            {/* Tabs for organized content */}
            <Tabs
                id="editor-tabs"
                selectedTabId={activeTab}
                onChange={(newTabId) => setActiveTab(newTabId as string)}
                className="editor-tabs"
            >
                <Tab id="allocation" title="Allocation" panel={
                    <div className="tab-content">
                        {/* Site Allocation */}
                        <FormGroup
                            label="Allocated Site"
                            labelFor="site-select"
                            intent={validationErrors.has('allocatedSites') ? Intent.DANGER : Intent.NONE}
                            helperText={validationErrors.get('allocatedSites')}
                        >
                            <HTMLSelect
                                id="site-select"
                                fill
                                large
                                value={selectedSiteId}
                                onChange={(e) => handleSiteChange(e.target.value)}
                            >
                                <option value="">-- Select a site --</option>
                                {sites.map(site => (
                                    <option key={site.id} value={site.id}>
                                        {site.name} ({site.location.lat}, {site.location.lon})
                                    </option>
                                ))}
                            </HTMLSelect>
                        </FormGroup>

                        {/* Alternative Sites (if suboptimal) */}
                        {editedOpportunity.matchStatus === 'suboptimal' && 
                         editedOpportunity.alternativeOptions && 
                         editedOpportunity.alternativeOptions.length > 0 && (
                            <FormGroup
                                label="Alternative Sites"
                                labelInfo="Recommended alternatives"
                            >
                                <Card className="alternatives-list">
                                    {editedOpportunity.alternativeOptions.map(alt => (
                                        <div key={alt.siteId} className="alternative-item">
                                            <Button
                                                alignText="left"
                                                rightIcon="arrow-right"
                                                onClick={() => handleSiteChange(alt.siteId)}
                                                intent={Intent.PRIMARY}
                                                minimal
                                            >
                                                {alt.siteName}
                                            </Button>
                                        </div>
                                    ))}
                                </Card>
                            </FormGroup>
                        )}

                        {/* Justification for changes */}
                        <FormGroup
                            label="Change Justification"
                            labelFor="justification"
                            labelInfo={editedOpportunity.matchStatus !== 'baseline' ? "(required)" : "(optional)"}
                            intent={validationErrors.has('justification') ? Intent.DANGER : Intent.NONE}
                            helperText={validationErrors.get('justification')}
                        >
                            <TextArea
                                id="justification"
                                fill
                                rows={3}
                                value={justification}
                                onChange={(e) => setJustification(e.target.value)}
                                placeholder="Explain the reason for this allocation change..."
                            />
                        </FormGroup>
                    </div>
                } />
                
                <Tab id="details" title="Details" panel={
                    <div className="tab-content">
                        {/* Priority */}
                        <FormGroup
                            label="Priority"
                            labelFor="priority-select"
                        >
                            <HTMLSelect
                                id="priority-select"
                                fill
                                value={editedOpportunity.priority}
                                onChange={(e) => handlePriorityChange(e.target.value as Priority)}
                            >
                                <option value="critical">P1 - Critical</option>
                                <option value="high">P2 - High</option>
                                <option value="medium">P3 - Medium</option>
                                <option value="low">P4 - Low</option>
                            </HTMLSelect>
                        </FormGroup>

                        {/* Capacity */}
                        <FormGroup
                            label="Capacity"
                            labelFor="capacity-input"
                            labelInfo="Maximum number of passes"
                            intent={validationErrors.has('capacity') ? Intent.DANGER : Intent.NONE}
                            helperText={validationErrors.get('capacity')}
                        >
                            <NumericInput
                                id="capacity-input"
                                fill
                                min={1}
                                value={editedOpportunity.capacity}
                                onValueChange={handleCapacityChange}
                            />
                        </FormGroup>

                        {/* Collection Deck Info */}
                        <FormGroup
                            label="Collection Deck"
                            labelInfo="(read-only)"
                        >
                            <InputGroup
                                value={editedOpportunity.collectionDeckId}
                                disabled
                                fill
                            />
                        </FormGroup>

                        {/* Advanced Options */}
                        <Collapse isOpen={showAdvancedOptions}>
                            <Divider />
                            
                            {/* Classification Level */}
                            <FormGroup
                                label="Classification Level"
                                labelFor="classification-select"
                            >
                                <HTMLSelect
                                    id="classification-select"
                                    fill
                                    value={classificationLevel}
                                    onChange={(e) => setClassificationLevel(e.target.value as ClassificationLevel)}
                                >
                                    <option value="unclassified">Unclassified</option>
                                    <option value="confidential">Confidential</option>
                                    <option value="secret">Secret</option>
                                    <option value="top-secret">Top Secret</option>
                                </HTMLSelect>
                            </FormGroup>

                            {/* Special Instructions */}
                            <FormGroup
                                label="Special Instructions"
                                labelFor="instructions"
                                labelInfo="(optional)"
                            >
                                <TextArea
                                    id="instructions"
                                    fill
                                    rows={2}
                                    value={specialInstructions}
                                    onChange={(e) => setSpecialInstructions(e.target.value)}
                                    placeholder="Any special handling instructions..."
                                />
                            </FormGroup>
                        </Collapse>
                        
                        <Button
                            minimal
                            icon={showAdvancedOptions ? "chevron-up" : "chevron-down"}
                            text={showAdvancedOptions ? "Hide Advanced Options" : "Show Advanced Options"}
                            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                        />
                    </div>
                } />
                
                <Tab id="history" title="History" panel={
                    <div className="tab-content">
                        <NonIdealState
                            icon="history"
                            title="Change History"
                            description="Change history will be displayed here"
                        />
                    </div>
                } />
            </Tabs>

            {/* Action Buttons */}
            <div className="panel-footer">
                <ControlGroup fill>
                    <Button
                        text="Cancel"
                        onClick={onClose}
                        disabled={isSaving}
                    />
                    <Button
                        intent={Intent.PRIMARY}
                        text={isSaving ? "Saving..." : "Save Changes"}
                        onClick={handleSave}
                        loading={isSaving}
                        disabled={!hasChanges || validationErrors.size > 0}
                        icon="floppy-disk"
                        title="Save changes (Ctrl+S)"
                    />
                </ControlGroup>
                
                {validationErrors.has('save') && (
                    <Callout intent={Intent.DANGER} className="save-error">
                        {validationErrors.get('save')}
                    </Callout>
                )}
            </div>
        </div>
    );
};