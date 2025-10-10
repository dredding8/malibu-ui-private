/**
 * Override Workflow
 *
 * Complex multi-step workflow for manual overrides - shown in large Dialog with tabs
 * Handles: Multi-site selection, pass management, justification, approval workflow
 *
 * Use Case: 5% of editing operations (complex overrides, critical decisions)
 * Presentation: Large centered dialog with tabbed interface
 */

import React, { useState } from 'react';
import {
  Tabs,
  Tab,
  TabId,
  Callout,
  Intent,
  H5,
  NonIdealState,
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { CollectionOpportunity, Site, Pass } from '../../types/collectionOpportunities';

// Import tab components
import { AllocationTab } from './OverrideTabs/AllocationTab';
import { JustificationTab } from './OverrideTabs/JustificationTab';
import { ReviewTab } from './OverrideTabs/ReviewTab';

interface OverrideWorkflowProps {
  editor: any; // ReturnType<typeof useUnifiedEditor>
  opportunity: CollectionOpportunity;
  availableSites: Site[];
  availablePasses: Pass[];
  capacityThresholds: {
    critical: number;
    warning: number;
    optimal: number;
  };
  enableBatchOperations: boolean;
}

export const OverrideWorkflow: React.FC<OverrideWorkflowProps> = ({
  editor,
  opportunity,
  availableSites,
  availablePasses,
  capacityThresholds,
  enableBatchOperations,
}) => {
  const [selectedTab, setSelectedTab] = useState<TabId>('allocation');

  return (
    <div className="override-workflow">
      {/* Warning Banner */}
      <Callout
        intent={Intent.WARNING}
        icon={IconNames.WARNING_SIGN}
        style={{ margin: '0 20px 20px 20px', borderRadius: 0 }}
      >
        <strong>Manual Override Mode:</strong> Changes made here override system recommendations.
        Ensure you provide detailed justification for audit compliance.
      </Callout>

      {/* Tabbed Interface */}
      <Tabs
        id="override-tabs"
        selectedTabId={selectedTab}
        onChange={(newTabId: TabId) => setSelectedTab(newTabId)}
        className="editor-tabs"
        large
      >
        {/* Tab 1: Allocation */}
        <Tab
          id="allocation"
          title="1. Allocation"
          icon={IconNames.FLOWS}
          panel={
            <div className="editor-tab-content">
              <AllocationTab
                editor={editor}
                opportunity={opportunity}
                availableSites={availableSites}
                availablePasses={availablePasses}
                capacityThresholds={capacityThresholds}
                enableBatchOperations={enableBatchOperations}
              />
            </div>
          }
        />

        {/* Tab 2: Justification */}
        <Tab
          id="justification"
          title="2. Justification"
          icon={IconNames.EDIT}
          panel={
            <div className="editor-tab-content">
              <JustificationTab
                editor={editor}
                opportunity={opportunity}
              />
            </div>
          }
        />

        {/* Tab 3: Review */}
        <Tab
          id="review"
          title="3. Review"
          icon={IconNames.ENDORSED}
          panel={
            <div className="editor-tab-content">
              <ReviewTab
                editor={editor}
                opportunity={opportunity}
                availableSites={availableSites}
              />
            </div>
          }
        />

        {/* Optional: History Tab (if undo/redo enabled) */}
        {editor.history && (
          <Tab
            id="history"
            title="History"
            icon={IconNames.HISTORY}
            panel={
              <div className="editor-tab-content">
                <NonIdealState
                  icon={IconNames.HISTORY}
                  title="Change History"
                  description="View all changes made during this editing session"
                >
                  <div style={{ marginTop: '16px', textAlign: 'left', maxWidth: '400px' }}>
                    <p><strong>Past Actions:</strong> {editor.history.past.length}</p>
                    <p><strong>Future Actions:</strong> {editor.history.future.length}</p>
                  </div>
                </NonIdealState>
              </div>
            }
          />
        )}
      </Tabs>

      {/* Progress Indicator */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '4px',
        backgroundColor: '#E1E8ED',
      }}>
        <div
          style={{
            height: '100%',
            width: selectedTab === 'allocation' ? '33%' :
                   selectedTab === 'justification' ? '66%' :
                   '100%',
            backgroundColor: '#137CBD',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
};
