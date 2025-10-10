import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Button,
  Card,
  Classes,
  Dialog,
  Divider,
  FormGroup,
  Icon,
  Intent,
  NonIdealState,
  ProgressBar,
  Tag,
  Tooltip,
  ButtonGroup,
  Callout,
  NumericInput,
  TextArea,
  HTMLSelect,
  Position,
  H3,
  H4,
  Switch,
  AnchorButton,
  InputGroup
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { CollectionOpportunity, Site, MatchStatus, Priority } from '../types/collectionOpportunities';
import './ReallocationWorkspaceAccessible.css';

interface SiteAllocation {
  siteId: string;
  siteName: string;
  siteCode: string;
  passes: number;
  capacity: number;
  allocated: number;
  availableCapacity: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  elevation: number;
  duration: number;
  capacityUsage: number;
  timeDistribution?: string;
  overrideReason?: string;
}

interface AvailablePass {
  id: string;
  siteId: string;
  siteName: string;
  siteCode: string;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  passCount: number;
  totalDuration: number;
  peakElevation: number;
  durationThreshold: number;
  capacityUsage: number;
  capacityTotal: number;
  conflicts?: string[];
  isRecommended?: boolean;
  matchScore?: number;
}

interface ReallocationWorkspaceAccessibleProps {
  opportunity: CollectionOpportunity;
  availableSites: Site[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (changes: any[]) => Promise<void>;
}

// Quick action buttons for common tasks
const QuickActions: React.FC<{
  onAutoAllocate: () => void;
  onOptimizeCapacity: () => void;
  onResolveConflicts: () => void;
  hasConflicts: boolean;
}> = ({ onAutoAllocate, onOptimizeCapacity, onResolveConflicts, hasConflicts }) => (
  <div className="quick-actions" role="toolbar" aria-label="Quick allocation actions">
    <Tooltip content="AI will suggest optimal allocation based on pass quality and capacity">
      <Button
        icon={IconNames.LIGHTBULB}
        intent={Intent.PRIMARY}
        onClick={onAutoAllocate}
        className="quick-action-btn"
      >
        Smart Allocate
      </Button>
    </Tooltip>
    <Tooltip content="Rebalance passes to maximize capacity utilization">
      <Button
        icon={IconNames.DIAGRAM_TREE}
        onClick={onOptimizeCapacity}
        className="quick-action-btn"
      >
        Optimize Capacity
      </Button>
    </Tooltip>
    {hasConflicts && (
      <Tooltip content="Automatically resolve scheduling conflicts">
        <Button
          icon={IconNames.RESOLVE}
          intent={Intent.WARNING}
          onClick={onResolveConflicts}
          className="quick-action-btn"
        >
          Resolve Conflicts
        </Button>
      </Tooltip>
    )}
  </div>
);

// Undo/Redo controls
const HistoryControls: React.FC<{
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  changeCount: number;
}> = ({ canUndo, canRedo, onUndo, onRedo, changeCount }) => (
  <div className="history-controls" role="group" aria-label="History controls">
    <ButtonGroup minimal>
      <Tooltip content="Undo last change (Ctrl+Z)">
        <Button
          icon={IconNames.UNDO}
          disabled={!canUndo}
          onClick={onUndo}
          aria-label="Undo last change"
        />
      </Tooltip>
      <Tooltip content="Redo change (Ctrl+Y)">
        <Button
          icon={IconNames.REDO}
          disabled={!canRedo}
          onClick={onRedo}
          aria-label="Redo change"
        />
      </Tooltip>
    </ButtonGroup>
    {changeCount > 0 && (
      <Tag minimal intent={Intent.PRIMARY} className="change-count">
        {changeCount} unsaved {changeCount === 1 ? 'change' : 'changes'}
      </Tag>
    )}
  </div>
);

const ReallocationWorkspaceAccessible: React.FC<ReallocationWorkspaceAccessibleProps> = ({
  opportunity,
  availableSites,
  isOpen,
  onClose,
  onSave
}) => {
  // State management
  const [allocations, setAllocations] = useState<Map<string, SiteAllocation>>(new Map());
  const [selectedPass, setSelectedPass] = useState<AvailablePass | null>(null);
  const [filterQuality, setFilterQuality] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyRecommended, setShowOnlyRecommended] = useState(false);
  const [changeHistory, setChangeHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [focusTrapRef, setFocusTrapRef] = useState<HTMLElement | null>(null);

  // Refs for focus management
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLElement>(null);
  const lastFocusableRef = useRef<HTMLElement>(null);

  // Generate mock available passes
  const availablePasses = useMemo<AvailablePass[]>(() => {
    const siteCodes = ['DGS', 'CLR', 'FYL', 'BKK', 'GRM', 'NSG', 'MHS'];
    return availableSites.slice(0, 7).map((site, index) => ({
      id: `pass-${site.id}`,
      siteId: site.id,
      siteName: site.name,
      siteCode: siteCodes[index % siteCodes.length],
      quality: index === 0 ? 'excellent' : index < 3 ? 'good' : index < 5 ? 'fair' : 'poor',
      passCount: Math.floor(Math.random() * 15) + 5,
      totalDuration: Math.floor(Math.random() * 120) + 60,
      peakElevation: Math.floor(Math.random() * 60) + 30,
      durationThreshold: Math.random() > 0.7 ? 5 : 3,
      capacityUsage: Math.floor(Math.random() * 80) + 20,
      capacityTotal: 100,
      conflicts: Math.random() > 0.8 ? ['Schedule conflict with ISR-7'] : undefined,
      isRecommended: index < 3,
      matchScore: 100 - (index * 15)
    }));
  }, [availableSites]);

  // Calculate total allocated passes
  const totalAllocatedPasses = useMemo(() => {
    return Array.from(allocations.values()).reduce((sum, alloc) => sum + alloc.passes, 0);
  }, [allocations]);

  // Filter available passes
  const filteredPasses = useMemo(() => {
    let passes = [...availablePasses];

    if (filterQuality !== 'all') {
      passes = passes.filter(p => p.quality === filterQuality);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      passes = passes.filter(p => 
        p.siteName.toLowerCase().includes(query) ||
        p.siteCode.toLowerCase().includes(query)
      );
    }

    if (showOnlyRecommended) {
      passes = passes.filter(p => p.isRecommended);
    }

    return passes.sort((a, b) => {
      // Sort by quality first, then by match score
      const qualityOrder = { excellent: 0, good: 1, fair: 2, poor: 3 };
      const qualityDiff = qualityOrder[a.quality] - qualityOrder[b.quality];
      if (qualityDiff !== 0) return qualityDiff;
      return (b.matchScore || 0) - (a.matchScore || 0);
    });
  }, [availablePasses, filterQuality, searchQuery, showOnlyRecommended]);

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      // Focus first focusable element when dialog opens
      const focusableElements = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }

      // Setup focus trap
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          const focusableElements = dialogRef.current!.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z for redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
      // Escape to close (if no unsaved changes)
      if (e.key === 'Escape' && changeHistory.length === 0) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, changeHistory.length, onClose]);

  // Handle pass allocation
  const handleAllocatePass = useCallback((pass: AvailablePass, passCount: number) => {
    const newAllocation: SiteAllocation = {
      siteId: pass.siteId,
      siteName: pass.siteName,
      siteCode: pass.siteCode,
      passes: passCount,
      capacity: pass.capacityTotal,
      allocated: pass.capacityUsage,
      availableCapacity: pass.capacityTotal - pass.capacityUsage,
      quality: pass.quality,
      elevation: pass.peakElevation,
      duration: pass.totalDuration,
      capacityUsage: pass.capacityUsage,
      timeDistribution: 'Mon Wed Fri',
      overrideReason: ''
    };

    const newAllocations = new Map(allocations);
    newAllocations.set(pass.siteId, newAllocation);
    setAllocations(newAllocations);
    
    // Add to history
    const newHistory = changeHistory.slice(0, historyIndex + 1);
    newHistory.push({ type: 'allocate', pass, allocation: newAllocation });
    setChangeHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [allocations, changeHistory, historyIndex]);

  // Handle pass count adjustment
  const handleAdjustPasses = useCallback((siteId: string, delta: number) => {
    const allocation = allocations.get(siteId);
    if (!allocation) return;

    const newPasses = Math.max(0, Math.min(20, allocation.passes + delta));
    if (newPasses === allocation.passes) return;

    const newAllocations = new Map(allocations);
    newAllocations.set(siteId, { ...allocation, passes: newPasses });
    setAllocations(newAllocations);

    // Add to history
    const newHistory = changeHistory.slice(0, historyIndex + 1);
    newHistory.push({ type: 'adjust', siteId, oldValue: allocation.passes, newValue: newPasses });
    setChangeHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [allocations, changeHistory, historyIndex]);

  // Handle override reason
  const handleOverrideReason = useCallback((siteId: string, reason: string) => {
    const allocation = allocations.get(siteId);
    if (!allocation) return;

    const newAllocations = new Map(allocations);
    newAllocations.set(siteId, { ...allocation, overrideReason: reason });
    setAllocations(newAllocations);
  }, [allocations]);

  // Undo/Redo functionality
  const handleUndo = useCallback(() => {
    if (historyIndex < 0) return;
    
    const change = changeHistory[historyIndex];
    // Implement undo logic based on change type
    setHistoryIndex(historyIndex - 1);
  }, [historyIndex, changeHistory]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= changeHistory.length - 1) return;
    
    const change = changeHistory[historyIndex + 1];
    // Implement redo logic based on change type
    setHistoryIndex(historyIndex + 1);
  }, [historyIndex, changeHistory]);

  // Auto-allocation algorithm
  const handleAutoAllocate = useCallback(() => {
    const newAllocations = new Map<string, SiteAllocation>();
    
    // Select top 3 recommended passes
    const recommendedPasses = filteredPasses
      .filter(p => p.isRecommended)
      .slice(0, 3);

    recommendedPasses.forEach(pass => {
      const allocation: SiteAllocation = {
        siteId: pass.siteId,
        siteName: pass.siteName,
        siteCode: pass.siteCode,
        passes: Math.min(10, pass.passCount),
        capacity: pass.capacityTotal,
        allocated: pass.capacityUsage,
        availableCapacity: pass.capacityTotal - pass.capacityUsage,
        quality: pass.quality,
        elevation: pass.peakElevation,
        duration: pass.totalDuration,
        capacityUsage: pass.capacityUsage,
        timeDistribution: 'Auto-distributed',
        overrideReason: 'AI-optimized allocation'
      };
      newAllocations.set(pass.siteId, allocation);
    });

    setAllocations(newAllocations);
    
    // Add to history
    const newHistory = changeHistory.slice(0, historyIndex + 1);
    newHistory.push({ type: 'auto-allocate', allocations: Array.from(newAllocations.values()) });
    setChangeHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [filteredPasses, changeHistory, historyIndex]);

  // Save handler
  const handleSave = async () => {
    if (allocations.size === 0) {
      setValidationErrors(['Please allocate at least one pass before saving.']);
      return;
    }

    setIsSaving(true);
    setValidationErrors([]);

    try {
      const changes = Array.from(allocations.values()).map(allocation => ({
        opportunityId: opportunity.id,
        siteId: allocation.siteId,
        passes: allocation.passes,
        timeDistribution: allocation.timeDistribution,
        overrideReason: allocation.overrideReason
      }));

      await onSave(changes);
      onClose();
    } catch (error) {
      setValidationErrors(['Failed to save changes. Please try again.']);
    } finally {
      setIsSaving(false);
    }
  };

  // Check for conflicts
  const hasConflicts = useMemo(() => {
    return availablePasses.some(p => p.conflicts && p.conflicts.length > 0);
  }, [availablePasses]);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="workspace-header-accessible">
          <div className="header-main">
            <span className="workspace-icon">
              <Icon icon={IconNames.FLOWS} />
            </span>
            <H3>Allocation Manager</H3>
            <div className="header-metadata" role="region" aria-label="Satellite information">
              <Tag minimal>SCC: {opportunity.sccNumber || 'N/A'}</Tag>
              <Tag minimal>{opportunity.satellite.orbit}</Tag>
              <Tag minimal intent={
                opportunity.priority === 'critical' ? Intent.DANGER :
                opportunity.priority === 'high' ? Intent.WARNING :
                opportunity.priority === 'medium' ? Intent.PRIMARY :
                Intent.NONE
              }>
                Priority: {opportunity.priorityValue || 0}
              </Tag>
              <Tag minimal>Periodicity: {opportunity.periodicity || 0} {opportunity.periodicityUnit || 'hours'}</Tag>
            </div>
          </div>
          <HistoryControls
            canUndo={historyIndex >= 0}
            canRedo={historyIndex < changeHistory.length - 1}
            onUndo={handleUndo}
            onRedo={handleRedo}
            changeCount={changeHistory.length}
          />
        </div>
      }
      className="reallocation-workspace-accessible"
      canEscapeKeyClose={changeHistory.length === 0}
      canOutsideClickClose={changeHistory.length === 0}
      style={{ width: '90vw', maxWidth: '1400px', height: '85vh' }}
      portalContainer={document.body}
    >
      <div className={Classes.DIALOG_BODY} ref={dialogRef}>
        {/* Quick Actions Bar */}
        <div className="workspace-toolbar" role="toolbar">
          <QuickActions
            onAutoAllocate={handleAutoAllocate}
            onOptimizeCapacity={() => console.log('Optimize capacity')}
            onResolveConflicts={() => console.log('Resolve conflicts')}
            hasConflicts={hasConflicts}
          />
          <div className="toolbar-right">
            <InputGroup
              leftIcon={IconNames.SEARCH}
              placeholder="Search sites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search available sites"
            />
            <HTMLSelect
              value={filterQuality}
              onChange={(e) => setFilterQuality(e.target.value)}
              aria-label="Filter by quality"
            >
              <option value="all">All Quality</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </HTMLSelect>
            <Switch
              checked={showOnlyRecommended}
              onChange={(e) => setShowOnlyRecommended(e.currentTarget.checked)}
              label="Recommended only"
              aria-label="Show only recommended passes"
            />
          </div>
        </div>

        <Divider />

        {/* Main Content - Two Panel Layout */}
        <div className="workspace-panels" role="main">
          {/* Left Panel - Available Passes */}
          <div className="panel panel-left" role="region" aria-label="Available passes">
            <div className="panel-header">
              <H4>Available Passes</H4>
              <Tag minimal>{filteredPasses.length} available</Tag>
            </div>
            
            <div className="passes-list" role="list">
              {filteredPasses.length === 0 ? (
                <NonIdealState
                  icon={IconNames.SATELLITE}
                  title="No passes found"
                  description="Try adjusting your filters"
                />
              ) : (
                filteredPasses.map(pass => (
                  <Card
                    key={pass.id}
                    className={`pass-card ${selectedPass?.id === pass.id ? 'selected' : ''} ${pass.isRecommended ? 'recommended' : ''}`}
                    interactive
                    onClick={() => setSelectedPass(pass)}
                    role="listitem"
                    aria-selected={selectedPass?.id === pass.id}
                    aria-label={`${pass.siteName} - ${pass.quality} quality, ${pass.passCount} passes available`}
                  >
                    <div className="pass-header">
                      <div className="pass-title">
                        <Tag large minimal className="site-code">{pass.siteCode}</Tag>
                        <span className="site-name">{pass.siteName}</span>
                        {pass.isRecommended && (
                          <Tooltip content="AI recommends this site based on quality and capacity">
                            <span className="recommended-icon">
                              <Icon icon={IconNames.STAR} intent={Intent.WARNING} />
                            </span>
                          </Tooltip>
                        )}
                      </div>
                      <Tag intent={
                        pass.quality === 'excellent' ? Intent.SUCCESS :
                        pass.quality === 'good' ? Intent.PRIMARY :
                        pass.quality === 'fair' ? Intent.WARNING :
                        Intent.NONE
                      }>
                        {pass.quality}
                      </Tag>
                    </div>
                    
                    <div className="pass-metrics">
                      <div className="metric-row">
                        <span className="metric-label">Passes:</span>
                        <strong>{pass.passCount}</strong>
                      </div>
                      <div className="metric-row">
                        <span className="metric-label">Total:</span>
                        <strong>{pass.totalDuration} min</strong>
                      </div>
                      <div className="metric-row">
                        <span className="metric-label">Elevation:</span>
                        <strong>{pass.peakElevation}°</strong>
                      </div>
                      <div className="metric-row">
                        <span className="metric-label">Duration:</span>
                        <strong>&gt; {pass.durationThreshold}m</strong>
                      </div>
                    </div>

                    <div className="pass-capacity">
                      <div className="capacity-label">
                        Capacity: <strong>{pass.capacityUsage}/{pass.capacityTotal}</strong>
                      </div>
                      <ProgressBar
                        value={pass.capacityUsage / pass.capacityTotal}
                        intent={
                          pass.capacityUsage > 80 ? Intent.DANGER :
                          pass.capacityUsage > 60 ? Intent.WARNING :
                          Intent.SUCCESS
                        }
                        animate={false}
                        stripes={false}
                      />
                    </div>

                    {pass.conflicts && pass.conflicts.length > 0 && (
                      <Callout intent={Intent.WARNING} icon={IconNames.WARNING_SIGN} compact>
                        {pass.conflicts[0]}
                      </Callout>
                    )}

                    <div className="pass-actions">
                      <Button
                        intent={Intent.PRIMARY}
                        fill
                        disabled={allocations.has(pass.siteId)}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleAllocatePass(pass, Math.min(5, pass.passCount));
                        }}
                      >
                        {allocations.has(pass.siteId) ? 'Already Allocated' : 'Quick Allocate (5 passes)'}
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Right Panel - Allocated Sites */}
          <div className="panel panel-right" role="region" aria-label="Allocated sites">
            <div className="panel-header">
              <H4>Allocated Sites</H4>
              <Tag minimal intent={Intent.PRIMARY}>
                {totalAllocatedPasses} passes allocated across {allocations.size} sites
              </Tag>
            </div>

            <div className="allocations-list" role="list">
              {allocations.size === 0 ? (
                <NonIdealState
                  icon={IconNames.INBOX_GEO}
                  title="No allocations yet"
                  description="Select passes from the left panel or use Smart Allocate"
                  action={
                    <Button
                      intent={Intent.PRIMARY}
                      icon={IconNames.LIGHTBULB}
                      onClick={handleAutoAllocate}
                    >
                      Smart Allocate
                    </Button>
                  }
                />
              ) : (
                Array.from(allocations.values()).map(allocation => (
                  <Card
                    key={allocation.siteId}
                    className="allocation-card"
                    role="listitem"
                  >
                    <div className="allocation-header">
                      <div className="allocation-title">
                        <Tag large minimal className="site-code">{allocation.siteCode}</Tag>
                        <span className="site-name">{allocation.siteName}</span>
                      </div>
                      <Button
                        minimal
                        small
                        intent={Intent.DANGER}
                        icon={IconNames.TRASH}
                        onClick={() => {
                          const newAllocations = new Map(allocations);
                          newAllocations.delete(allocation.siteId);
                          setAllocations(newAllocations);
                        }}
                        aria-label={`Remove ${allocation.siteName} allocation`}
                      />
                    </div>

                    <div className="allocation-controls">
                      <FormGroup label="Collects" inline>
                        <div className="pass-adjuster" role="group" aria-label="Adjust pass count">
                          <Button
                            minimal
                            icon={IconNames.MINUS}
                            onClick={() => handleAdjustPasses(allocation.siteId, -1)}
                            disabled={allocation.passes <= 0}
                            aria-label="Decrease pass count"
                          />
                          <NumericInput
                            value={allocation.passes}
                            onValueChange={(value) => handleAdjustPasses(allocation.siteId, value - allocation.passes)}
                            min={0}
                            max={20}
                            className="pass-count-input"
                            aria-label="Pass count"
                          />
                          <Button
                            minimal
                            icon={IconNames.PLUS}
                            onClick={() => handleAdjustPasses(allocation.siteId, 1)}
                            disabled={allocation.passes >= 20}
                            aria-label="Increase pass count"
                          />
                        </div>
                      </FormGroup>

                      <FormGroup label="Time Distribution" inline>
                        <HTMLSelect
                          value={allocation.timeDistribution}
                          onChange={(e) => {
                            const newAllocations = new Map(allocations);
                            newAllocations.set(allocation.siteId, {
                              ...allocation,
                              timeDistribution: e.target.value
                            });
                            setAllocations(newAllocations);
                          }}
                          aria-label="Time distribution pattern"
                        >
                          <option value="Mon Wed Fri">Mon Wed Fri</option>
                          <option value="Tue Thu Sat">Tue Thu Sat</option>
                          <option value="Daily">Daily</option>
                          <option value="Weekdays">Weekdays</option>
                          <option value="Custom">Custom</option>
                        </HTMLSelect>
                      </FormGroup>
                    </div>

                    <FormGroup label="Reason for Override" className="override-reason">
                      <TextArea
                        value={allocation.overrideReason}
                        onChange={(e) => handleOverrideReason(allocation.siteId, e.target.value)}
                        placeholder="Optional: Explain manual changes..."
                        rows={2}
                        fill
                        aria-label="Override reason"
                      />
                    </FormGroup>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Callout intent={Intent.DANGER} icon={IconNames.ERROR} className="validation-errors">
            {validationErrors.map((error, i) => (
              <div key={i}>{error}</div>
            ))}
          </Callout>
        )}
      </div>

      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button
            onClick={onClose}
            disabled={isSaving}
            aria-label="Cancel and close"
          >
            Cancel
          </Button>
          {changeHistory.length > 0 && (
            <Button
              onClick={() => {
                setAllocations(new Map());
                setChangeHistory([]);
                setHistoryIndex(-1);
              }}
              disabled={isSaving}
              aria-label="Clear all changes"
            >
              Clear All
            </Button>
          )}
          <Button
            intent={Intent.PRIMARY}
            onClick={handleSave}
            loading={isSaving}
            disabled={allocations.size === 0}
            aria-label={`Save ${allocations.size} allocation${allocations.size !== 1 ? 's' : ''}`}
          >
            Save Allocations ({allocations.size})
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default ReallocationWorkspaceAccessible;