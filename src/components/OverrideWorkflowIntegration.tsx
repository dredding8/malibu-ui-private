import React, { useState, useCallback } from 'react';
import {
  Button,
  Intent,
  Toast,
  Toaster,
  Position,
  Card,
  Tag,
  Callout,
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { Icon } from '../utils/blueprintIconWrapper';
import {
  CollectionOpportunity,
  Site,
  Satellite,
  PassId,
  SiteId,
} from '../types/collectionOpportunities';
import EnhancedOverrideWorkflow, {
  OverrideWorkflowData,
  ExportOptions,
} from './EnhancedOverrideWorkflow';
import {
  PassDetail,
  OverrideJustification,
} from './PassDetailComparison';
import './OverrideWorkflowIntegration.css';

// Demo/Example Data for Testing
const createMockPassDetail = (
  id: string,
  siteId: string,
  siteName: string,
  isBaseline: boolean = true,
  conflictLevel: 'none' | 'minor' | 'major' | 'critical' = 'none'
): PassDetail => ({
  id: id as PassId,
  opportunityId: 'opp-123',
  siteId: siteId as SiteId,
  siteName,
  startTime: new Date(Date.now() + Math.random() * 86400000).toISOString(),
  endTime: new Date(Date.now() + Math.random() * 86400000 + 600000).toISOString(),
  duration: 10 + Math.floor(Math.random() * 20),
  elevation: 30 + Math.floor(Math.random() * 60),
  azimuth: Math.floor(Math.random() * 360),
  qualityScore: 60 + Math.floor(Math.random() * 40),
  weatherRisk: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
  capacity: 100,
  allocated: 30 + Math.floor(Math.random() * 50),
  isBaseline,
  isAlternative: !isBaseline,
  conflictLevel,
  impactScore: 20 + Math.floor(Math.random() * 80),
});

const createMockWorkflowData = (): OverrideWorkflowData => {
  const satellite: Satellite = {
    id: 'sat-001' as any,
    name: 'SKYNET-7',
    capacity: 500,
    currentLoad: 320,
    orbit: 'LEO',
    function: 'Imaging',
  };

  const opportunity: CollectionOpportunity = {
    id: 'opp-123' as any,
    name: 'High Priority Target Collection',
    satellite: satellite,
    priority: 'high',
    status: 'warning',
    sites: [],
    currentMatches: [],
    alternativeMatches: [],
    timeWindow: {
      start: new Date().toISOString(),
      end: new Date(Date.now() + 86400000).toISOString(),
    },
    requirements: {
      minPasses: 3,
      maxPasses: 8,
      preferredSites: [],
      qualityThreshold: 70,
    },
    health: {
      overall: 75,
      capacity: 80,
      quality: 70,
      timeline: 75,
    },
  };

  return {
    opportunityId: 'opp-123',
    satellite,
    opportunity,
    baselinePasses: [
      createMockPassDetail('pass-001', 'site-001', 'Ground Station Alpha', true, 'none'),
      createMockPassDetail('pass-002', 'site-002', 'Ground Station Beta', true, 'minor'),
      createMockPassDetail('pass-003', 'site-003', 'Ground Station Gamma', true, 'major'),
    ],
    alternativePasses: [
      createMockPassDetail('pass-004', 'site-004', 'Ground Station Delta', false, 'none'),
      createMockPassDetail('pass-005', 'site-005', 'Ground Station Echo', false, 'minor'),
      createMockPassDetail('pass-006', 'site-006', 'Ground Station Foxtrot', false, 'critical'),
    ],
    selectedOverrides: new Set(['pass-004', 'pass-005'] as PassId[]),
  };
};

const AppToaster = Toaster.create({
  className: "override-integration-toaster",
  position: Position.TOP_RIGHT,
});

export interface OverrideWorkflowIntegrationProps {
  // In a real implementation, these would come from props or context
  workflowData?: OverrideWorkflowData;
  onOverrideSaved?: (
    overrides: Set<PassId>,
    justification: OverrideJustification
  ) => Promise<void>;
  onDataExported?: (options: ExportOptions, data: OverrideWorkflowData) => Promise<void>;
}

export const OverrideWorkflowIntegration: React.FC<OverrideWorkflowIntegrationProps> = ({
  workflowData: providedData,
  onOverrideSaved,
  onDataExported,
}) => {
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
  const [workflowData, setWorkflowData] = useState<OverrideWorkflowData>(
    providedData || createMockWorkflowData()
  );
  const [lastSavedOverrides, setLastSavedOverrides] = useState<Set<PassId>>(new Set());
  const [lastJustification, setLastJustification] = useState<OverrideJustification | undefined>();

  const handleOpenWorkflow = useCallback(() => {
    setIsWorkflowOpen(true);
  }, []);

  const handleCloseWorkflow = useCallback(() => {
    setIsWorkflowOpen(false);
  }, []);

  const handleSaveOverride = useCallback(async (
    overrides: Set<PassId>,
    justification: OverrideJustification,
    exportOptions?: ExportOptions
  ) => {
    try {
      // In a real implementation, this would save to a backend service
      if (onOverrideSaved) {
        await onOverrideSaved(overrides, justification);
      } else {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        console.log('Override saved:', {
          overrides: Array.from(overrides),
          justification,
          exportOptions,
        });
      }

      setLastSavedOverrides(overrides);
      setLastJustification(justification);

      AppToaster.show({
        message: `Successfully saved ${overrides.size} override${overrides.size !== 1 ? 's' : ''}`,
        intent: Intent.SUCCESS,
        icon: IconNames.TICK,
        timeout: 3000,
      });

      // Update workflow data with saved overrides
      setWorkflowData(prev => ({
        ...prev,
        selectedOverrides: overrides,
        justification,
      }));

    } catch (error) {
      console.error('Failed to save override:', error);
      
      AppToaster.show({
        message: 'Failed to save override. Please try again.',
        intent: Intent.DANGER,
        icon: IconNames.ERROR,
        timeout: 5000,
      });

      throw error; // Re-throw to let the workflow component handle the error state
    }
  }, [onOverrideSaved]);

  const handleExportData = useCallback(async (
    options: ExportOptions,
    data: OverrideWorkflowData
  ) => {
    try {
      if (onDataExported) {
        await onDataExported(options, data);
      } else {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const exportData = {
          metadata: {
            exportedAt: new Date().toISOString(),
            format: options.format,
            scope: options.scope,
            classification: options.classificationLevel,
          },
          ...(options.includeMetadata && {
            satellite: data.satellite,
            opportunity: data.opportunity,
          }),
          overrides: Array.from(data.selectedOverrides).map(passId => {
            const pass = [...data.baselinePasses, ...data.alternativePasses]
              .find(p => p.id === passId);
            return pass;
          }).filter(Boolean),
          ...(options.includeJustification && data.justification && {
            justification: data.justification,
          }),
          ...(options.includeTimestamps && {
            timestamps: {
              created: new Date().toISOString(),
              lastModified: new Date().toISOString(),
            },
          }),
        };

        // In a real implementation, this would trigger a file download
        console.log(`Export data (${options.format.toUpperCase()}):`, exportData);
        
        // Create a mock download for demonstration
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `override-export-${Date.now()}.${options.format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      AppToaster.show({
        message: `Export completed successfully (${options.format.toUpperCase()})`,
        intent: Intent.SUCCESS,
        icon: IconNames.EXPORT,
        timeout: 3000,
      });

    } catch (error) {
      console.error('Failed to export data:', error);
      
      AppToaster.show({
        message: 'Export failed. Please try again.',
        intent: Intent.DANGER,
        icon: IconNames.ERROR,
        timeout: 5000,
      });

      throw error;
    }
  }, [onDataExported]);

  const hasActiveOverrides = workflowData.selectedOverrides.size > 0;
  const hasSavedOverrides = lastSavedOverrides.size > 0;

  return (
    <div className="override-workflow-integration">
      <Card className="integration-card">
        <div className="integration-header">
          <div className="header-info">
            <h3>
              <Icon icon={IconNames.SATELLITE} />
              Override Management: {workflowData.satellite.name}
            </h3>
            <div className="status-tags">
              <Tag intent={Intent.PRIMARY}>
                {workflowData.satellite.function}
              </Tag>
              <Tag minimal>
                {workflowData.satellite.orbit}
              </Tag>
              {hasActiveOverrides && (
                <Tag intent={Intent.WARNING}>
                  {workflowData.selectedOverrides.size} pending override{workflowData.selectedOverrides.size !== 1 ? 's' : ''}
                </Tag>
              )}
              {hasSavedOverrides && (
                <Tag intent={Intent.SUCCESS}>
                  {lastSavedOverrides.size} saved override{lastSavedOverrides.size !== 1 ? 's' : ''}
                </Tag>
              )}
            </div>
          </div>
          
          <div className="header-actions">
            <Button
              icon={IconNames.EDIT}
              intent={Intent.PRIMARY}
              onClick={handleOpenWorkflow}
              large
            >
              Open Override Workflow
            </Button>
          </div>
        </div>

        <div className="integration-content">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Baseline Passes</span>
              <span className="stat-value">{workflowData.baselinePasses.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Alternative Passes</span>
              <span className="stat-value">{workflowData.alternativePasses.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active Overrides</span>
              <span className="stat-value">{workflowData.selectedOverrides.size}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Satellite Capacity</span>
              <span className="stat-value">
                {Math.round((workflowData.satellite.currentLoad / workflowData.satellite.capacity) * 100)}%
              </span>
            </div>
          </div>

          {hasSavedOverrides && lastJustification && (
            <div className="last-action-summary">
              <Callout intent={Intent.SUCCESS} icon={IconNames.TICK}>
                <strong>Last Override Saved:</strong> {lastSavedOverrides.size} pass{lastSavedOverrides.size !== 1 ? 'es' : ''} 
                with {lastJustification.reason.replace('_', ' ')} justification 
                (Priority: {lastJustification.priority})
              </Callout>
            </div>
          )}

          <div className="feature-highlights">
            <h4>Enhanced Features:</h4>
            <ul>
              <li>
                <Icon icon={IconNames.COMPARISON} />
                <strong>Pass Detail Comparison:</strong> Side-by-side comparison of baseline and alternative passes using Blueprint Table and Card views
              </li>
              <li>
                <Icon icon={IconNames.FORM} />
                <strong>Override Justification:</strong> Comprehensive justification form with Blueprint FormGroup and HTMLSelect components
              </li>
              <li>
                <Icon icon={IconNames.HIGHLIGHT} />
                <strong>Export Highlighting:</strong> Visual highlighting of exported elements with animation effects
              </li>
              <li>
                <Icon icon={IconNames.TRENDING_UP} />
                <strong>Impact Analysis:</strong> Real-time impact assessment with risk evaluation
              </li>
              <li>
                <Icon icon={IconNames.WARNING_SIGN} />
                <strong>Conflict Resolution:</strong> Automatic conflict detection and resolution suggestions
              </li>
              <li>
                <Icon icon={IconNames.EXPORT} />
                <strong>Multi-format Export:</strong> Support for JSON, CSV, Excel, PDF, KML, and XML exports
              </li>
            </ul>
          </div>
        </div>
      </Card>

      <EnhancedOverrideWorkflow
        isOpen={isWorkflowOpen}
        workflowData={workflowData}
        onClose={handleCloseWorkflow}
        onSave={handleSaveOverride}
        onExport={handleExportData}
        enableAdvancedAnalysis={true}
        enableExportHighlighting={true}
        readOnly={false}
      />
    </div>
  );
};

export default OverrideWorkflowIntegration;