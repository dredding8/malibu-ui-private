import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Dialog,
  Classes,
  Button,
  Intent,
  Card,
  Tabs,
  Tab,
  TabId,
  Callout,
  ProgressBar,
  Tag,
  Tooltip,
  Divider,
  Alert,
  Spinner,
  NonIdealState,
  Menu,
  MenuItem,
  Popover,
  Checkbox,
  FormGroup,
  HTMLSelect,
  Toast,
  Toaster,
  Position,
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { Icon } from '../utils/blueprintIconWrapper';
import {
  CollectionOpportunity,
  Site,
  Satellite,
  Priority,
  PassId,
  SiteId,
} from '../types/collectionOpportunities';
import PassDetailComparison, {
  PassDetail,
  OverrideJustification,
  OverrideReason,
} from './PassDetailComparison';
import './EnhancedOverrideWorkflow.css';

// Enhanced Export Formats
export type ExportFormat = 
  | 'json'
  | 'csv'
  | 'xlsx'
  | 'pdf'
  | 'xml'
  | 'kml';

export type ExportScope = 
  | 'selected_overrides'
  | 'all_changes'
  | 'conflict_analysis'
  | 'impact_assessment'
  | 'full_report';

export interface ExportOptions {
  format: ExportFormat;
  scope: ExportScope;
  includeMetadata: boolean;
  includeJustification: boolean;
  includeTimestamps: boolean;
  classificationLevel: 'unclassified' | 'confidential' | 'secret' | 'top_secret';
  customFields: string[];
}

export interface OverrideWorkflowData {
  opportunityId: string;
  satellite: Satellite;
  opportunity: CollectionOpportunity;
  baselinePasses: PassDetail[];
  alternativePasses: PassDetail[];
  selectedOverrides: Set<PassId>;
  justification?: OverrideJustification;
  impactAnalysis?: ImpactAnalysis;
  conflictResolution?: ConflictResolution;
}

export interface ImpactAnalysis {
  totalImpactScore: number;
  affectedSites: SiteId[];
  resourceReallocation: {
    siteId: SiteId;
    currentAllocation: number;
    proposedAllocation: number;
    difference: number;
  }[];
  riskAssessment: {
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
    mitigationRequired: boolean;
  };
  performanceProjection: {
    baselineQuality: number;
    projectedQuality: number;
    qualityDelta: number;
    confidenceLevel: number;
  };
}

export interface ConflictResolution {
  conflicts: {
    id: string;
    type: 'capacity' | 'schedule' | 'priority' | 'resource';
    severity: 'minor' | 'major' | 'critical';
    description: string;
    resolution: string;
    status: 'pending' | 'resolved' | 'deferred';
  }[];
  autoResolvable: number;
  manualReviewRequired: number;
}

export interface EnhancedOverrideWorkflowProps {
  isOpen: boolean;
  workflowData: OverrideWorkflowData;
  onClose: () => void;
  onSave: (
    overrides: Set<PassId>,
    justification: OverrideJustification,
    exportOptions?: ExportOptions
  ) => Promise<void>;
  onExport: (options: ExportOptions, data: OverrideWorkflowData) => Promise<void>;
  readOnly?: boolean;
  enableAdvancedAnalysis?: boolean;
  enableExportHighlighting?: boolean;
}

const AppToaster = Toaster.create({
  className: "app-toaster",
  position: Position.TOP_RIGHT,
});

export const EnhancedOverrideWorkflow: React.FC<EnhancedOverrideWorkflowProps> = ({
  isOpen,
  workflowData,
  onClose,
  onSave,
  onExport,
  readOnly = false,
  enableAdvancedAnalysis = true,
  enableExportHighlighting = true,
}) => {
  const [selectedTab, setSelectedTab] = useState<TabId>('comparison');
  const [selectedOverrides, setSelectedOverrides] = useState<Set<PassId>>(workflowData.selectedOverrides);
  const [justification, setJustification] = useState<OverrideJustification | undefined>(workflowData.justification);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    scope: 'selected_overrides',
    includeMetadata: true,
    includeJustification: true,
    includeTimestamps: true,
    classificationLevel: 'unclassified',
    customFields: [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [highlightedElements, setHighlightedElements] = useState<Set<string>>(new Set());

  // Enhanced Impact Analysis
  const impactAnalysis = useMemo((): ImpactAnalysis => {
    const selectedPasses = [...workflowData.baselinePasses, ...workflowData.alternativePasses]
      .filter(pass => selectedOverrides.has(pass.id));

    const totalImpactScore = selectedPasses.reduce((sum, pass) => sum + pass.impactScore, 0);
    const affectedSites = [...new Set(selectedPasses.map(pass => pass.siteId))];
    
    const baselineQuality = workflowData.baselinePasses
      .filter(pass => selectedOverrides.has(pass.id))
      .reduce((sum, pass) => sum + pass.qualityScore, 0) / workflowData.baselinePasses.length || 0;
    
    const projectedQuality = workflowData.alternativePasses
      .filter(pass => selectedOverrides.has(pass.id))
      .reduce((sum, pass) => sum + pass.qualityScore, 0) / workflowData.alternativePasses.length || 0;

    return {
      totalImpactScore,
      affectedSites,
      resourceReallocation: [], // Would be calculated based on actual allocation changes
      riskAssessment: {
        level: totalImpactScore > 300 ? 'critical' : 
               totalImpactScore > 200 ? 'high' :
               totalImpactScore > 100 ? 'medium' : 'low',
        factors: selectedPasses.filter(p => p.conflictLevel !== 'none').map(p => `${p.siteName}: ${p.conflictLevel} conflict`),
        mitigationRequired: totalImpactScore > 200,
      },
      performanceProjection: {
        baselineQuality,
        projectedQuality,
        qualityDelta: projectedQuality - baselineQuality,
        confidenceLevel: selectedPasses.length > 5 ? 0.8 : 0.6,
      },
    };
  }, [selectedOverrides, workflowData]);

  // Conflict Resolution Analysis
  const conflictResolution = useMemo((): ConflictResolution => {
    const conflicts = [...workflowData.baselinePasses, ...workflowData.alternativePasses]
      .filter(pass => selectedOverrides.has(pass.id) && pass.conflictLevel !== 'none')
      .map((pass, index) => ({
        id: `conflict-${index}`,
        type: 'capacity' as const,
        severity: pass.conflictLevel as 'minor' | 'major' | 'critical',
        description: `${pass.siteName} has ${pass.conflictLevel} conflict`,
        resolution: `Reallocate ${pass.passes} passes to alternative site`,
        status: 'pending' as const,
      }));

    return {
      conflicts,
      autoResolvable: conflicts.filter(c => c.severity === 'minor').length,
      manualReviewRequired: conflicts.filter(c => c.severity !== 'minor').length,
    };
  }, [selectedOverrides, workflowData]);

  // Validation
  useEffect(() => {
    const errors: string[] = [];

    if (selectedOverrides.size === 0) {
      errors.push('No overrides selected');
    }

    if (!justification?.justificationText?.trim()) {
      errors.push('Justification is required');
    }

    if (impactAnalysis.riskAssessment.level === 'critical' && !justification?.riskAcceptance) {
      errors.push('Risk acceptance required for critical impact overrides');
    }

    if (justification?.classification !== 'unclassified' && !justification?.approverRequired) {
      errors.push('Approver required for classified overrides');
    }

    setValidationErrors(errors);
  }, [selectedOverrides, justification, impactAnalysis]);

  // Export Highlighting Effect
  useEffect(() => {
    if (enableExportHighlighting && isExporting) {
      const elementsToHighlight = new Set<string>();
      
      // Highlight selected overrides
      selectedOverrides.forEach(passId => {
        elementsToHighlight.add(`pass-${passId}`);
      });
      
      // Highlight export-relevant sections
      elementsToHighlight.add('justification-section');
      elementsToHighlight.add('impact-analysis');
      elementsToHighlight.add('conflict-resolution');
      
      setHighlightedElements(elementsToHighlight);
      
      // Clear highlighting after export
      const timer = setTimeout(() => {
        setHighlightedElements(new Set());
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isExporting, selectedOverrides, enableExportHighlighting]);

  const handleOverrideSelect = useCallback((passId: PassId, isSelected: boolean) => {
    if (readOnly) return;
    
    setSelectedOverrides(prev => {
      const newSelection = new Set(prev);
      if (isSelected) {
        newSelection.add(passId);
      } else {
        newSelection.delete(passId);
      }
      return newSelection;
    });
  }, [readOnly]);

  const handleJustificationChange = useCallback((newJustification: OverrideJustification) => {
    if (readOnly) return;
    setJustification(newJustification);
  }, [readOnly]);

  const handleSave = async () => {
    if (validationErrors.length > 0 || !justification) {
      AppToaster.show({
        message: "Cannot apply changes: Validation errors detected",
        intent: Intent.DANGER,
        icon: IconNames.ERROR,
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(selectedOverrides, justification, exportOptions);
      AppToaster.show({
        message: "Pass reassignment applied successfully",
        intent: Intent.SUCCESS,
        icon: IconNames.TICK,
      });
      onClose();
    } catch (error) {
      AppToaster.show({
        message: "Failed to apply changes: " + (error as Error).message,
        intent: Intent.DANGER,
        icon: IconNames.ERROR,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async (format: ExportFormat, scope: ExportScope) => {
    setIsExporting(true);
    
    const options: ExportOptions = {
      ...exportOptions,
      format,
      scope,
    };

    try {
      await onExport(options, {
        ...workflowData,
        selectedOverrides,
        justification,
        impactAnalysis,
        conflictResolution,
      });
      
      AppToaster.show({
        message: `Export completed (${format.toUpperCase()})`,
        intent: Intent.SUCCESS,
        icon: IconNames.EXPORT,
      });
    } catch (error) {
      AppToaster.show({
        message: "Export failed",
        intent: Intent.DANGER,
        icon: IconNames.ERROR,
      });
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  const renderExportMenu = () => (
    <Menu>
      <MenuItem
        icon={IconNames.DOCUMENT}
        text="JSON Report"
        onClick={() => handleExport('json', 'full_report')}
      />
      <MenuItem
        icon={IconNames.TH}
        text="CSV Data"
        onClick={() => handleExport('csv', 'selected_overrides')}
      />
      <MenuItem
        icon={IconNames.GRID_VIEW}
        text="Excel Workbook"
        onClick={() => handleExport('xlsx', 'full_report')}
      />
      <MenuItem
        icon={IconNames.DOCUMENT}
        text="PDF Report"
        onClick={() => handleExport('pdf', 'impact_assessment')}
      />
      <Divider />
      <MenuItem
        icon={IconNames.MAP}
        text="Geographic (KML)"
        onClick={() => handleExport('kml', 'selected_overrides')}
      />
      <MenuItem
        icon={IconNames.CODE}
        text="XML Data"
        onClick={() => handleExport('xml', 'all_changes')}
      />
    </Menu>
  );

  const canSave = validationErrors.length === 0 && selectedOverrides.size > 0 && justification?.justificationText?.trim();

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="enhanced-override-header">
          <Icon icon={IconNames.SATELLITE} />
          <span>Reassign Passes: {workflowData.satellite.name}</span>
          <div className="header-tags">
            <Tag minimal intent={Intent.PRIMARY}>
              {workflowData.satellite.function}
            </Tag>
            <Tag minimal>
              {selectedOverrides.size} pass changes
            </Tag>
            {impactAnalysis.riskAssessment.level !== 'low' && (
              <Tag
                intent={
                  impactAnalysis.riskAssessment.level === 'critical' ? Intent.DANGER :
                  impactAnalysis.riskAssessment.level === 'high' ? Intent.WARNING :
                  Intent.NONE
                }
              >
                {impactAnalysis.riskAssessment.level} risk
              </Tag>
            )}
          </div>
        </div>
      }
      className="enhanced-override-workflow"
      canEscapeKeyClose={!isSaving}
      canOutsideClickClose={!isSaving}
      style={{ width: '95vw', maxWidth: '1200px', height: '90vh' }}
    >
      <div className={Classes.DIALOG_BODY}>
        <Tabs
          id="override-workflow-tabs"
          onChange={setSelectedTab}
          selectedTabId={selectedTab}
          renderActiveTabPanelOnly={false}
          className="workflow-tabs"
        >
          <Tab
            id="comparison"
            title={
              <span className={highlightedElements.has('comparison-tab') ? 'export-highlighted' : ''}>
                <Icon icon={IconNames.COMPARISON} />
                Compare Options
              </span>
            }
            panel={
              <div className={`tab-panel ${highlightedElements.has('comparison-section') ? 'export-highlighted' : ''}`}>
                <PassDetailComparison
                  baselinePasses={workflowData.baselinePasses}
                  alternativePasses={workflowData.alternativePasses}
                  selectedOverrides={selectedOverrides}
                  onOverrideSelect={handleOverrideSelect}
                  onJustificationChange={handleJustificationChange}
                  currentJustification={justification}
                  readOnly={readOnly}
                  showAdvancedMetrics={enableAdvancedAnalysis}
                />
              </div>
            }
          />

          {enableAdvancedAnalysis && (
            <Tab
              id="impact"
              title={
                <span className={highlightedElements.has('impact-tab') ? 'export-highlighted' : ''}>
                  <Icon icon={IconNames.TRENDING_UP} />
                  Review Impact
                </span>
              }
              panel={
                <div className={`tab-panel impact-analysis ${highlightedElements.has('impact-analysis') ? 'export-highlighted' : ''}`}>
                  <div className="analysis-grid">
                    <Card className="impact-metrics">
                      <h3>Impact Metrics</h3>
                      <div className="metrics-grid">
                        <div className="metric">
                          <span className="metric-label">Total Impact Score</span>
                          <Tag
                            large
                            intent={
                              impactAnalysis.totalImpactScore > 300 ? Intent.DANGER :
                              impactAnalysis.totalImpactScore > 200 ? Intent.WARNING :
                              Intent.SUCCESS
                            }
                          >
                            {impactAnalysis.totalImpactScore}
                          </Tag>
                        </div>
                        <div className="metric">
                          <span className="metric-label">Affected Sites</span>
                          <Tag large>{impactAnalysis.affectedSites.length}</Tag>
                        </div>
                        <div className="metric">
                          <span className="metric-label">Quality Delta</span>
                          <Tag
                            large
                            intent={
                              impactAnalysis.performanceProjection.qualityDelta > 0 ? Intent.SUCCESS :
                              impactAnalysis.performanceProjection.qualityDelta < -10 ? Intent.DANGER :
                              Intent.WARNING
                            }
                          >
                            {impactAnalysis.performanceProjection.qualityDelta > 0 ? '+' : ''}
                            {impactAnalysis.performanceProjection.qualityDelta.toFixed(1)}%
                          </Tag>
                        </div>
                      </div>
                    </Card>

                    <Card className="risk-assessment">
                      <h3>Risk Assessment</h3>
                      <div className="risk-level">
                        <Tag
                          large
                          intent={
                            impactAnalysis.riskAssessment.level === 'critical' ? Intent.DANGER :
                            impactAnalysis.riskAssessment.level === 'high' ? Intent.WARNING :
                            Intent.NONE
                          }
                        >
                          {impactAnalysis.riskAssessment.level.toUpperCase()} RISK
                        </Tag>
                      </div>
                      
                      {impactAnalysis.riskAssessment.factors.length > 0 && (
                        <div className="risk-factors">
                          <strong>Risk Factors:</strong>
                          <ul>
                            {impactAnalysis.riskAssessment.factors.map((factor, index) => (
                              <li key={index}>{factor}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {impactAnalysis.riskAssessment.mitigationRequired && (
                        <Callout intent={Intent.WARNING} icon={IconNames.WARNING_SIGN}>
                          Mitigation measures required before proceeding
                        </Callout>
                      )}
                    </Card>

                    <Card className="performance-projection">
                      <h3>Performance Projection</h3>
                      <div className="projection-chart">
                        <div className="projection-bar">
                          <span>Baseline Quality</span>
                          <ProgressBar
                            value={impactAnalysis.performanceProjection.baselineQuality / 100}
                            intent={Intent.PRIMARY}
                          />
                          <span>{impactAnalysis.performanceProjection.baselineQuality.toFixed(1)}%</span>
                        </div>
                        <div className="projection-bar">
                          <span>Projected Quality</span>
                          <ProgressBar
                            value={impactAnalysis.performanceProjection.projectedQuality / 100}
                            intent={
                              impactAnalysis.performanceProjection.qualityDelta > 0 ? Intent.SUCCESS :
                              Intent.WARNING
                            }
                          />
                          <span>{impactAnalysis.performanceProjection.projectedQuality.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="confidence-level">
                        <span>Confidence Level: {(impactAnalysis.performanceProjection.confidenceLevel * 100).toFixed(0)}%</span>
                      </div>
                    </Card>
                  </div>
                </div>
              }
            />
          )}

          <Tab
            id="conflicts"
            title={
              <span className={highlightedElements.has('conflicts-tab') ? 'export-highlighted' : ''}>
                <Icon icon={IconNames.WARNING_SIGN} />
                Conflicts ({conflictResolution.conflicts.length})
              </span>
            }
            panel={
              <div className={`tab-panel conflict-resolution ${highlightedElements.has('conflict-resolution') ? 'export-highlighted' : ''}`}>
                <div className="conflicts-summary">
                  <Card>
                    <div className="conflict-stats">
                      <div className="stat">
                        <span>Total Conflicts</span>
                        <Tag large intent={conflictResolution.conflicts.length > 0 ? Intent.WARNING : Intent.SUCCESS}>
                          {conflictResolution.conflicts.length}
                        </Tag>
                      </div>
                      <div className="stat">
                        <span>Auto-Resolvable</span>
                        <Tag large intent={Intent.SUCCESS}>
                          {conflictResolution.autoResolvable}
                        </Tag>
                      </div>
                      <div className="stat">
                        <span>Manual Review</span>
                        <Tag large intent={conflictResolution.manualReviewRequired > 0 ? Intent.DANGER : Intent.SUCCESS}>
                          {conflictResolution.manualReviewRequired}
                        </Tag>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="conflicts-list">
                  {conflictResolution.conflicts.length === 0 ? (
                    <NonIdealState
                      icon={IconNames.TICK}
                      title="No Conflicts Detected"
                      description="All selected overrides are compatible"
                    />
                  ) : (
                    conflictResolution.conflicts.map((conflict) => (
                      <Card key={conflict.id} className="conflict-card">
                        <div className="conflict-header">
                          <Tag
                            intent={
                              conflict.severity === 'critical' ? Intent.DANGER :
                              conflict.severity === 'major' ? Intent.WARNING :
                              Intent.NONE
                            }
                          >
                            {conflict.severity.toUpperCase()}
                          </Tag>
                          <span className="conflict-type">{conflict.type}</span>
                        </div>
                        <div className="conflict-details">
                          <p><strong>Description:</strong> {conflict.description}</p>
                          <p><strong>Resolution:</strong> {conflict.resolution}</p>
                          <p><strong>Status:</strong> {conflict.status}</p>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            }
          />

          <Tab
            id="export"
            title={
              <span className={highlightedElements.has('export-tab') ? 'export-highlighted' : ''}>
                <Icon icon={IconNames.EXPORT} />
                Finalize & Export
              </span>
            }
            panel={
              <div className={`tab-panel export-options ${highlightedElements.has('export-section') ? 'export-highlighted' : ''}`}>
                <div className="export-grid">
                  <Card className="export-settings">
                    <h3>Export Settings</h3>
                    <FormGroup label="Classification Level">
                      <HTMLSelect
                        value={exportOptions.classificationLevel}
                        onChange={(e) => setExportOptions(prev => ({
                          ...prev,
                          classificationLevel: e.target.value as any
                        }))}
                      >
                        <option value="unclassified">Unclassified</option>
                        <option value="confidential">Confidential</option>
                        <option value="secret">Secret</option>
                        <option value="top_secret">Top Secret</option>
                      </HTMLSelect>
                    </FormGroup>

                    <div className="export-checkboxes">
                      <Checkbox
                        label="Include Metadata"
                        checked={exportOptions.includeMetadata}
                        onChange={(e) => setExportOptions(prev => ({
                          ...prev,
                          includeMetadata: e.currentTarget.checked
                        }))}
                      />
                      <Checkbox
                        label="Include Justification"
                        checked={exportOptions.includeJustification}
                        onChange={(e) => setExportOptions(prev => ({
                          ...prev,
                          includeJustification: e.currentTarget.checked
                        }))}
                      />
                      <Checkbox
                        label="Include Timestamps"
                        checked={exportOptions.includeTimestamps}
                        onChange={(e) => setExportOptions(prev => ({
                          ...prev,
                          includeTimestamps: e.currentTarget.checked
                        }))}
                      />
                    </div>
                  </Card>

                  <Card className="export-actions">
                    <h3>Export Formats</h3>
                    <div className="export-buttons">
                      <Popover
                        content={renderExportMenu()}
                        isOpen={showExportMenu}
                        onInteraction={setShowExportMenu}
                        position={Position.BOTTOM_LEFT}
                      >
                        <Button
                          icon={IconNames.EXPORT}
                          intent={Intent.PRIMARY}
                          loading={isExporting}
                          disabled={selectedOverrides.size === 0}
                        >
                          Export Options
                        </Button>
                      </Popover>
                    </div>
                  </Card>

                  <Card className="review-summary">
                    <h3>Review Summary</h3>
                    <div className="summary-items">
                      <div className="summary-item">
                        <span>Selected Overrides:</span>
                        <Tag>{selectedOverrides.size}</Tag>
                      </div>
                      <div className="summary-item">
                        <span>Impact Level:</span>
                        <Tag intent={
                          impactAnalysis.riskAssessment.level === 'critical' ? Intent.DANGER :
                          impactAnalysis.riskAssessment.level === 'high' ? Intent.WARNING :
                          Intent.SUCCESS
                        }>
                          {impactAnalysis.riskAssessment.level}
                        </Tag>
                      </div>
                      <div className="summary-item">
                        <span>Conflicts:</span>
                        <Tag intent={conflictResolution.conflicts.length > 0 ? Intent.WARNING : Intent.SUCCESS}>
                          {conflictResolution.conflicts.length}
                        </Tag>
                      </div>
                      <div className="summary-item">
                        <span>Classification:</span>
                        <Tag intent={justification?.classification !== 'unclassified' ? Intent.WARNING : Intent.NONE}>
                          {justification?.classification || 'unclassified'}
                        </Tag>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            }
          />
        </Tabs>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="validation-errors">
            {validationErrors.map((error, index) => (
              <Callout key={index} intent={Intent.DANGER} icon={IconNames.ERROR}>
                {error}
              </Callout>
            ))}
          </div>
        )}
      </div>

      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <div className="footer-info">
            {selectedOverrides.size > 0 && (
              <span className={Classes.TEXT_MUTED}>
                {selectedOverrides.size} override{selectedOverrides.size !== 1 ? 's' : ''} selected
              </span>
            )}
            {isExporting && (
              <span className={Classes.TEXT_MUTED}>
                <Spinner size={16} />
                Exporting...
              </span>
            )}
          </div>
          
          <Button onClick={onClose} disabled={isSaving || isExporting}>
            Cancel
          </Button>
          
          {!readOnly && (
            <Button
              intent={Intent.PRIMARY}
              onClick={handleSave}
              disabled={!canSave || isSaving || isExporting}
              loading={isSaving}
            >
              Apply Changes
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default EnhancedOverrideWorkflow;