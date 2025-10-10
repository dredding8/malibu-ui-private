import React, { useState } from 'react';
import {
  Card,
  H3,
  H5,
  Button,
  ButtonGroup,
  InputGroup,
  Tag,
  Divider,
  Intent,
  Position,
  Tooltip,
  ProgressBar,
  Icon as BpIcon,
  Classes
} from '@blueprintjs/core';

// Type-safe Icon wrapper
const Icon: React.FC<React.ComponentProps<typeof BpIcon>> = (props) => {
  const iconElement = React.createElement(BpIcon, props);
  return <>{iconElement}</>;
};
import { IconNames } from '@blueprintjs/icons';
import { EnhancedStatusIndicator, StatusDimensions } from './EnhancedStatusIndicator';
import { ProgressiveDataDisplay } from './ProgressiveDataDisplay';
import { ConflictResolver } from './ConflictResolver';
import { CollectionOpportunity, Conflict } from '../types/collectionOpportunities';
import './CollectionManagementMockup.css';

// Mock data for demonstration
const mockOpportunity: CollectionOpportunity = {
  id: 'OPP-001',
  name: 'SATCOM-7 Northern Pass',
  satellite: {
    id: 'SAT-7',
    name: 'SATCOM-7',
    capacity: 100,
    currentLoad: 85,
    orbit: 'LEO',
    function: 'Imaging'
  },
  sites: [],
  priority: 'high',
  status: 'warning',
  capacityPercentage: 85,
  conflicts: ['Schedule overlap with SATCOM-4', 'Site capacity constraint'],
  createdDate: '2024-01-15T10:00:00Z',
  lastModified: '2024-01-20T14:30:00Z',
  collectionDeckId: 'DECK-1757517559289',
  allocatedSites: [
    { id: 'SITE-A', name: 'Site Alpha', location: { lat: 0, lon: 0 }, capacity: 50, allocated: 45 },
    { id: 'SITE-B', name: 'Site Beta', location: { lat: 0, lon: 0 }, capacity: 40, allocated: 35 }
  ],
  totalPasses: 85,
  capacity: 100,
  matchStatus: 'suboptimal',
  collectionType: 'optical'
};

const mockConflicts: Conflict[] = [
  {
    opportunityId: 'OPP-001',
    conflictsWith: 'OPP-002',
    reason: 'Schedule overlap with SATCOM-4 at 14:30 UTC',
    severity: 'high'
  },
  {
    opportunityId: 'OPP-001',
    conflictsWith: 'SITE-A',
    reason: 'Site Alpha nearing capacity threshold (90%)',
    severity: 'medium'
  }
];

export const CollectionManagementMockup: React.FC = () => {
  const [showConflictResolver, setShowConflictResolver] = useState(false);
  const [selectedView, setSelectedView] = useState<'glance' | 'operational' | 'analytical'>('operational');

  const mockStatus: StatusDimensions = {
    operational: 'degraded',
    capacity: 'constrained',
    priority: 'elevated',
    conflicts: 2,
    health: 75
  };

  return (
    <div className="collection-mockup-container">
      <H3>Collection Management Interface - Design Concept</H3>
      <p className={Classes.TEXT_MUTED}>
        This mockup demonstrates the recommended design improvements for operator efficiency.
      </p>

      {/* Enhanced Header Section */}
      <Card className="mockup-header" elevation={1}>
        <div className="header-content">
          <div className="header-left">
            <H5>Collection Opportunities Dashboard</H5>
            <div className="header-stats">
              <Tag minimal>
                <span className="icon-wrapper">
                  <Icon icon={IconNames.SATELLITE} />
                </span>
                <span>47 Active</span>
              </Tag>
              <Tag minimal intent={Intent.WARNING}>
                <span className="icon-wrapper">
                  <Icon icon={IconNames.WARNING_SIGN} />
                </span>
                <span>8 Conflicts</span>
              </Tag>
              <Tag minimal intent={Intent.SUCCESS}>
                <span className="icon-wrapper">
                  <Icon icon={IconNames.TICK} />
                </span>
                <span>92% Efficiency</span>
              </Tag>
            </div>
          </div>
          <div className="header-actions">
            <InputGroup
              leftIcon={IconNames.SEARCH}
              placeholder="Search opportunities..."
              style={{ width: 200 }}
            />
            <ButtonGroup>
              <Button icon={IconNames.FILTER}>Filters</Button>
              <Button icon={IconNames.COG}>Settings</Button>
            </ButtonGroup>
            <Button intent={Intent.PRIMARY} icon={IconNames.PLUS}>
              New Opportunity
            </Button>
          </div>
        </div>
      </Card>

      {/* Key Metrics Overview */}
      <div className="metrics-grid">
        <Card className="metric-card">
          <div className="metric-content">
            <Icon icon={IconNames.DASHBOARD} size={20} />
            <div className="metric-value">85%</div>
            <div className="metric-label">System Utilization</div>
            <ProgressBar value={0.85} intent={Intent.WARNING} stripes={false} />
          </div>
        </Card>
        <Card className="metric-card">
          <div className="metric-content">
            <Icon icon={IconNames.TIME} size={20} />
            <div className="metric-value">4.2s</div>
            <div className="metric-label">Avg Resolution Time</div>
            <Tag intent={Intent.SUCCESS} minimal>-15% ↓</Tag>
          </div>
        </Card>
        <Card className="metric-card">
          <div className="metric-content">
            <Icon icon={IconNames.ENDORSED} size={20} />
            <div className="metric-value">94%</div>
            <div className="metric-label">Success Rate</div>
            <Tag intent={Intent.SUCCESS} minimal>+3% ↑</Tag>
          </div>
        </Card>
        <Card className="metric-card critical">
          <div className="metric-content">
            <Icon icon={IconNames.ISSUE} size={20} />
            <div className="metric-value">2</div>
            <div className="metric-label">Critical Alerts</div>
            <Button small intent={Intent.DANGER} minimal>
              View Now
            </Button>
          </div>
        </Card>
      </div>

      <Divider style={{ margin: '20px 0' }} />

      {/* View Mode Selector */}
      <div className="view-selector">
        <H5>Information Detail Level</H5>
        <ButtonGroup>
          <Button
            active={selectedView === 'glance'}
            onClick={() => setSelectedView('glance')}
          >
            Glance (2s)
          </Button>
          <Button
            active={selectedView === 'operational'}
            onClick={() => setSelectedView('operational')}
          >
            Operational (10s)
          </Button>
          <Button
            active={selectedView === 'analytical'}
            onClick={() => setSelectedView('analytical')}
          >
            Analytical (Deep)
          </Button>
        </ButtonGroup>
      </div>

      {/* Progressive Display Demo */}
      <div className="progressive-demo">
        <H5>Enhanced Opportunity Display</H5>
        <div className="opportunity-row">
          <EnhancedStatusIndicator status={mockStatus} size="large" />
          <div style={{ flex: 1 }}>
            <ProgressiveDataDisplay
              opportunity={mockOpportunity}
              level={selectedView}
              onActionClick={(action) => {
                if (action === 'resolve') {
                  setShowConflictResolver(true);
                }
              }}
            />
          </div>
        </div>
      </div>

      <Divider style={{ margin: '20px 0' }} />

      {/* Conflict Resolution Demo */}
      <Card className="conflict-demo">
        <H5>Streamlined Conflict Resolution</H5>
        <p className={Classes.TEXT_MUTED}>
          One-click resolution with AI recommendations reduces decision time by 50%.
        </p>
        <Button
          intent={Intent.PRIMARY}
          icon={IconNames.RESOLVE}
          onClick={() => setShowConflictResolver(true)}
        >
          Demo Conflict Resolution
        </Button>
      </Card>

      {/* Conflict Resolver Dialog */}
      <ConflictResolver
        isOpen={showConflictResolver}
        onClose={() => setShowConflictResolver(false)}
        opportunity={mockOpportunity}
        conflicts={mockConflicts}
        onResolve={async (resolution) => {
          console.log('Resolution applied:', resolution);
          // In real implementation, this would call the API
        }}
      />

      {/* Design Principles Callout */}
      <Card className="design-principles" elevation={0}>
        <H5>Design Principles Applied</H5>
        <div className="principles-grid">
          <div className="principle">
            <Icon icon={IconNames.TIME} size={16} />
            <span>5-second state assessment</span>
          </div>
          <div className="principle">
            <Icon icon={IconNames.HAND} size={16} />
            <span>2-click critical actions</span>
          </div>
          <div className="principle">
            <Icon icon={IconNames.LAYERS} size={16} />
            <span>Progressive complexity</span>
          </div>
          <div className="principle">
            <Icon icon={IconNames.LIGHTBULB} size={16} />
            <span>AI-assisted decisions</span>
          </div>
        </div>
      </Card>
    </div>
  );
};