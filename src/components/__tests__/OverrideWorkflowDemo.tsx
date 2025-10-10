import React from 'react';
import { Card, Tag, Callout, Intent } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { Icon } from '../../utils/blueprintIconWrapper';
import OverrideWorkflowIntegration from '../OverrideWorkflowIntegration';
import '../../App.css';

/**
 * Demo component showcasing the enhanced override workflow features
 * 
 * This component demonstrates:
 * 1. Pass detail comparison using Blueprint Table and Cards
 * 2. Override justification with Blueprint FormGroup and Select
 * 3. Export highlighting with visual effects
 * 4. Integration with existing Blueprint patterns
 */
export const OverrideWorkflowDemo: React.FC = () => {
  return (
    <div className="override-workflow-demo" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          margin: '0 0 16px 0',
          color: '#1c2127'
        }}>
          <Icon icon={IconNames.SATELLITE} size={32} />
          Enhanced Override Workflow Demo
        </h1>
        
        <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN}>
          <p>
            This demo showcases the new Blueprint-based override workflow components with enhanced features:
          </p>
          <ul style={{ margin: '8px 0 0 20px' }}>
            <li><strong>Pass Detail Comparison:</strong> Table and Card views for comparing baseline and alternative passes</li>
            <li><strong>Override Justification:</strong> Comprehensive form with classification levels and risk assessment</li>
            <li><strong>Export Highlighting:</strong> Visual effects that highlight exported data elements</li>
            <li><strong>Impact Analysis:</strong> Real-time assessment of override impacts and conflicts</li>
            <li><strong>Multi-format Export:</strong> Support for JSON, CSV, Excel, PDF, KML, and XML formats</li>
          </ul>
        </Callout>
      </div>

      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '1fr', marginBottom: '32px' }}>
        <Card style={{ padding: '24px' }}>
          <h2 style={{ 
            margin: '0 0 16px 0',
            color: '#1c2127',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Icon icon={IconNames.LAYERS} />
            Component Architecture
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #e1e8ed' }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#2b95d6' }}>
                <Icon icon={IconNames.COMPARISON} />
                PassDetailComparison
              </h3>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                Provides side-by-side comparison of baseline and alternative passes using Blueprint Table2 and Card components.
              </p>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                <Tag minimal>Table2</Tag>
                <Tag minimal>Card</Tag>
                <Tag minimal>FormGroup</Tag>
                <Tag minimal>HTMLSelect</Tag>
              </div>
            </div>

            <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #e1e8ed' }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#2b95d6' }}>
                <Icon icon={IconNames.FLOWS} />
                EnhancedOverrideWorkflow
              </h3>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                Complete workflow manager with tabbed interface, impact analysis, conflict resolution, and export capabilities.
              </p>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                <Tag minimal>Dialog</Tag>
                <Tag minimal>Tabs</Tag>
                <Tag minimal>Callout</Tag>
                <Tag minimal>ProgressBar</Tag>
              </div>
            </div>

            <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #e1e8ed' }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#2b95d6' }}>
                <Icon icon={IconNames.WIDGET} />
                OverrideWorkflowIntegration
              </h3>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                Integration component demonstrating usage patterns and providing a complete working example.
              </p>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                <Tag minimal>Button</Tag>
                <Tag minimal>Toast</Tag>
                <Tag minimal>Intent</Tag>
                <Tag minimal>Position</Tag>
              </div>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '24px' }}>
          <h2 style={{ 
            margin: '0 0 16px 0',
            color: '#1c2127',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Icon icon={IconNames.HIGHLIGHT} />
            Key Features Implemented
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '12px', borderLeft: '4px solid #2b95d6', background: '#f8f9fa' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#1c2127' }}>✅ Blueprint Table Integration</h4>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                Pass details displayed in Blueprint Table2 with custom cell renderers for complex data visualization.
              </p>
            </div>

            <div style={{ padding: '12px', borderLeft: '4px solid #2b95d6', background: '#f8f9fa' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#1c2127' }}>✅ Blueprint Card Views</h4>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                Alternative card-based view for mobile-friendly pass comparison with hover effects and selection states.
              </p>
            </div>

            <div style={{ padding: '12px', borderLeft: '4px solid #2b95d6', background: '#f8f9fa' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#1c2127' }}>✅ FormGroup Justification</h4>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                Comprehensive justification form using Blueprint FormGroup, HTMLSelect, and TextArea components.
              </p>
            </div>

            <div style={{ padding: '12px', borderLeft: '4px solid #2b95d6', background: '#f8f9fa' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#1c2127' }}>✅ Export Highlighting</h4>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                Visual highlighting effects that animate during export operations to show which elements are being exported.
              </p>
            </div>

            <div style={{ padding: '12px', borderLeft: '4px solid #2b95d6', background: '#f8f9fa' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#1c2127' }}>✅ Multi-format Export</h4>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                Support for JSON, CSV, Excel, PDF, KML, and XML export formats with configurable options.
              </p>
            </div>

            <div style={{ padding: '12px', borderLeft: '4px solid #2b95d6', background: '#f8f9fa' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#1c2127' }}>✅ Impact Analysis</h4>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                Real-time calculation of override impacts with risk assessment and performance projections.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Live Demo */}
      <Card style={{ padding: '24px' }}>
        <h2 style={{ 
          margin: '0 0 16px 0',
          color: '#1c2127',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Icon icon={IconNames.PLAY} />
          Interactive Demo
        </h2>
        
        <Callout intent={Intent.SUCCESS} icon={IconNames.LIGHTBULB} style={{ marginBottom: '20px' }}>
          Click "Open Override Workflow" below to see the complete workflow in action. The demo includes:
          <ul style={{ margin: '8px 0 0 20px' }}>
            <li>Mock satellite data with realistic pass details</li>
            <li>Interactive override selection and justification</li>
            <li>Real-time impact analysis and conflict detection</li>
            <li>Export functionality with highlighting effects</li>
            <li>Full Blueprint component integration</li>
          </ul>
        </Callout>

        <OverrideWorkflowIntegration />
      </Card>

      <div style={{ marginTop: '32px', padding: '16px', background: '#f8f9fa', borderRadius: '6px' }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#1c2127' }}>
          <Icon icon={IconNames.CODE} />
          Implementation Notes
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', lineHeight: '1.6' }}>
          <li><strong>TypeScript Integration:</strong> All components are fully typed with strict interfaces</li>
          <li><strong>Accessibility:</strong> WCAG 2.1 AA compliance with keyboard navigation and screen reader support</li>
          <li><strong>Responsive Design:</strong> Mobile-first approach with breakpoint-based layouts</li>
          <li><strong>Dark Mode Support:</strong> Full Blueprint dark theme integration</li>
          <li><strong>Performance:</strong> Optimized with React.memo, useMemo, and useCallback</li>
          <li><strong>Error Handling:</strong> Comprehensive error boundaries and validation</li>
        </ul>
      </div>
    </div>
  );
};

export default OverrideWorkflowDemo;