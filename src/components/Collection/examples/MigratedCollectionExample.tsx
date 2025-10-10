/**
 * Migrated Collection Component Example
 * 
 * Example component demonstrating migration from legacy Context to
 * UnifiedCollectionProvider with performance monitoring and fallback handling.
 * 
 * Phase 3: Component Migration Example
 * @version 1.0.0
 * @date 2025-09-30
 */

import React, { useEffect, useState } from 'react';
import { UnifiedCollectionProvider, useUnifiedCollection, MigrationStatus } from '../providers/UnifiedCollectionProvider';
import { LegacyCollectionProvider, useLegacyCollection, MigrationStatusDashboard } from '../providers/LegacyContextWrapper';
import { MigrationMonitor } from '../providers/MigrationMonitor';
import { withCollectionState, CollectionMigrationUtils } from '../../migration/state/withCollectionState';
import { useCollectionBridge } from '../../migration/state/useCollectionBridge';
import { performanceValidator } from '../../migration/performance/PerformanceValidator';

// =============================================================================
// Legacy Component (Before Migration)
// =============================================================================

const LegacyCollectionList: React.FC = () => {
  const {
    collections,
    loading,
    error,
    selectCollection,
    isSelected,
    _migration,
  } = useLegacyCollection({
    componentName: 'LegacyCollectionList',
    showWarnings: true,
    enableAutoMigration: false,
  });

  if (loading.collections) {
    return <div>Loading collections...</div>;
  }

  if (error.hasError) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div style={{ border: '2px solid #ff6b6b', padding: '16px', borderRadius: '8px' }}>
      <h3 style={{ color: '#ff6b6b' }}>🚨 Legacy Collection List</h3>
      {_migration?.migrationRecommended && (
        <div style={{ 
          background: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          padding: '8px', 
          borderRadius: '4px',
          marginBottom: '16px',
          color: '#856404'
        }}>
          ⚠️ Migration recommended - this component is using deprecated context API
        </div>
      )}
      
      <div>
        <p>Total collections: {collections.length}</p>
        <div style={{ display: 'grid', gap: '8px' }}>
          {collections.map(collection => (
            <div
              key={collection.id}
              style={{
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                background: isSelected(collection.id) ? '#e3f2fd' : 'white',
                cursor: 'pointer',
              }}
              onClick={() => selectCollection(collection.id)}
            >
              <strong>{collection.name}</strong>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {collection.type} • Updated: {collection.updatedAt.toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Migrated Component (After Migration)
// =============================================================================

const MigratedCollectionList: React.FC = () => {
  const {
    collections,
    loading,
    error,
    selectCollection,
    isSelected,
    providerConfig,
    providerState,
    migration,
  } = useUnifiedCollection();

  const [performanceData, setPerformanceData] = useState<any>(null);

  useEffect(() => {
    // Monitor performance improvements
    if (providerConfig.enableMonitoring) {
      const metrics = migration.getMetrics();
      setPerformanceData(metrics);
    }
  }, [providerConfig.enableMonitoring, migration]);

  if (loading.collections) {
    return <div>Loading collections...</div>;
  }

  if (error.hasError) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div style={{ border: '2px solid #4CAF50', padding: '16px', borderRadius: '8px' }}>
      <h3 style={{ color: '#4CAF50' }}>✅ Migrated Collection List</h3>
      
      <div style={{ 
        background: '#d4edda', 
        border: '1px solid #c3e6cb', 
        padding: '8px', 
        borderRadius: '4px',
        marginBottom: '16px',
        color: '#155724',
        fontSize: '12px'
      }}>
        🚀 Using UnifiedCollectionProvider • Source: {providerState.activeSource} • 
        Progress: {providerState.migrationStatus.progress}%
        {performanceData && (
          <span> • Render: {performanceData.renderTime.toFixed(1)}ms</span>
        )}
      </div>
      
      <div>
        <p>Total collections: {collections.length}</p>
        <div style={{ display: 'grid', gap: '8px' }}>
          {collections.map(collection => (
            <div
              key={collection.id}
              style={{
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                background: isSelected(collection.id) ? '#e8f5e8' : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => selectCollection(collection.id)}
            >
              <strong>{collection.name}</strong>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {collection.type} • Updated: {collection.updatedAt.toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Bridge Component (Using Bridge Hook)
// =============================================================================

const BridgeCollectionList: React.FC = () => {
  const { state, actions, config, isReady } = useCollectionBridge({
    preferredSource: 'auto',
    enableFallback: true,
    enableMonitoring: true,
    enableSync: true,
  });

  if (!isReady) {
    return <div>Initializing bridge...</div>;
  }

  if (state.isLoading) {
    return <div>Loading collections...</div>;
  }

  if (state.hasErrors) {
    return <div>Error: {state.error.message}</div>;
  }

  return (
    <div style={{ border: '2px solid #2196F3', padding: '16px', borderRadius: '8px' }}>
      <h3 style={{ color: '#2196F3' }}>🌉 Bridge Collection List</h3>
      
      <div style={{ 
        background: '#e3f2fd', 
        border: '1px solid #bbdefb', 
        padding: '8px', 
        borderRadius: '4px',
        marginBottom: '16px',
        color: '#1565c0',
        fontSize: '12px'
      }}>
        🔄 Using Bridge Hook • Source: {state.source} • 
        Last Updated: {state.lastUpdated.toLocaleTimeString()} •
        Access Time: {state.metrics.performance.stateAccessTime.toFixed(1)}ms
      </div>
      
      <div>
        <p>Total collections: {state.totalCount} • Selected: {state.selectedCount}</p>
        <div style={{ marginBottom: '12px' }}>
          <button 
            onClick={() => actions.switchSource(state.source === 'context' ? 'store' : 'context')}
            style={{
              padding: '4px 8px',
              marginRight: '8px',
              background: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Switch to {state.source === 'context' ? 'Store' : 'Context'}
          </button>
          <button 
            onClick={() => actions.syncState()}
            style={{
              padding: '4px 8px',
              background: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Sync State
          </button>
        </div>
        
        <div style={{ display: 'grid', gap: '8px' }}>
          {state.collections.map(collection => (
            <div
              key={collection.id}
              style={{
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                background: actions.isSelected(collection.id) ? '#e3f2fd' : 'white',
                cursor: 'pointer',
              }}
              onClick={() => actions.toggleSelection(collection.id)}
            >
              <strong>{collection.name}</strong>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {collection.type} • Updated: {collection.updatedAt.toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// HOC Enhanced Component
// =============================================================================

interface EnhancedCollectionListProps {
  collectionState: any;
  migrationConfig?: any;
  performanceMetrics?: any;
}

const BaseCollectionList: React.FC<EnhancedCollectionListProps> = ({
  collectionState,
  migrationConfig,
  performanceMetrics,
}) => {
  const {
    collections,
    loading,
    error,
    selectCollection,
    isSelected,
  } = collectionState;

  if (loading.collections) {
    return <div>Loading collections...</div>;
  }

  if (error.hasError) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div style={{ border: '2px solid #9C27B0', padding: '16px', borderRadius: '8px' }}>
      <h3 style={{ color: '#9C27B0' }}>🎯 HOC Enhanced Collection List</h3>
      
      <div style={{ 
        background: '#f3e5f5', 
        border: '1px solid #e1bee7', 
        padding: '8px', 
        borderRadius: '4px',
        marginBottom: '16px',
        color: '#4a148c',
        fontSize: '12px'
      }}>
        🔧 Using withCollectionState HOC • 
        Source: {migrationConfig?.useStore ? 'Store' : 'Context'}
        {performanceMetrics && (
          <span> • Render: {performanceMetrics.renderTime.toFixed(1)}ms</span>
        )}
      </div>
      
      <div>
        <p>Total collections: {collections.length}</p>
        <div style={{ display: 'grid', gap: '8px' }}>
          {collections.map((collection: any) => (
            <div
              key={collection.id}
              style={{
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                background: isSelected(collection.id) ? '#f3e5f5' : 'white',
                cursor: 'pointer',
              }}
              onClick={() => selectCollection(collection.id)}
            >
              <strong>{collection.name}</strong>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {collection.type} • Updated: {collection.updatedAt.toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Create HOC variants
const ContextBasedCollectionList = CollectionMigrationUtils.createFallbackComponent(BaseCollectionList);
const StoreBasedCollectionList = CollectionMigrationUtils.createTestComponent(BaseCollectionList);
const MonitoredCollectionList = CollectionMigrationUtils.createMonitoredComponent(
  BaseCollectionList,
  'example-collection-list'
);

// =============================================================================
// Performance Comparison Component
// =============================================================================

const PerformanceComparison: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<any>(null);

  const runPerformanceTest = async () => {
    setIsRunning(true);
    setReport(null);

    try {
      const contextTest = async () => {
        // Simulate context-based operations
        await new Promise(resolve => setTimeout(resolve, Math.random() * 20 + 10));
        return { rendered: true };
      };

      const storeTest = async () => {
        // Simulate store-based operations
        await new Promise(resolve => setTimeout(resolve, Math.random() * 15 + 5));
        return { rendered: true };
      };

      const testReport = await performanceValidator.runValidation(
        contextTest,
        storeTest,
        5 // 5 iterations
      );

      setReport(testReport);
    } catch (error) {
      console.error('Performance test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ border: '2px solid #FF5722', padding: '16px', borderRadius: '8px' }}>
      <h3 style={{ color: '#FF5722' }}>📊 Performance Comparison</h3>
      
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={runPerformanceTest}
          disabled={isRunning}
          style={{
            padding: '8px 16px',
            background: isRunning ? '#ccc' : '#FF5722',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
          }}
        >
          {isRunning ? 'Running Tests...' : 'Run Performance Test'}
        </button>
      </div>

      {report && (
        <div style={{ 
          background: '#fff3e0', 
          padding: '12px', 
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <div><strong>Performance Report</strong></div>
          <div>Overall Score: {report.summary.overallScore}/100</div>
          <div>Duration: {report.duration.toFixed(2)}ms</div>
          <div>Improved: {report.summary.improved}</div>
          <div>Regressed: {report.summary.regressed}</div>
          
          {report.comparisons.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <strong>Comparisons:</strong>
              {report.comparisons.map((comp: any, i: number) => (
                <div key={i} style={{ marginLeft: '16px' }}>
                  {comp.metric}: {comp.improvement.percentage.toFixed(1)}% ({comp.verdict})
                </div>
              ))}
            </div>
          )}
          
          {report.recommendations.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <strong>Recommendations:</strong>
              {report.recommendations.map((rec: string, i: number) => (
                <div key={i} style={{ marginLeft: '16px' }}>• {rec}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Main Example Component
// =============================================================================

export const MigratedCollectionExample: React.FC = () => {
  const [showLegacy, setShowLegacy] = useState(true);
  const [showMigrated, setShowMigrated] = useState(true);
  const [showBridge, setShowBridge] = useState(true);
  const [showHOC, setShowHOC] = useState(true);
  const [showPerformance, setShowPerformance] = useState(false);

  // Mock collections data
  const mockCollections = [
    {
      id: '1',
      name: 'Test Collection 1',
      type: 'wideband',
      status: 'active',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
      metadata: { customProperties: {} },
      tags: ['test'],
      childIds: [],
    },
    {
      id: '2',
      name: 'Test Collection 2',
      type: 'narrowband',
      status: 'pending',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-16'),
      metadata: { customProperties: {} },
      tags: ['demo'],
      childIds: [],
    },
  ];

  return (
    <div style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
      <h1>Collection Management Migration Example</h1>
      <p>
        This example demonstrates the migration from legacy Context API to the new UnifiedCollectionProvider
        with various implementation approaches and performance monitoring.
      </p>

      {/* Controls */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '16px', 
        background: 'white', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3>Example Controls</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <label>
            <input 
              type="checkbox" 
              checked={showLegacy} 
              onChange={(e) => setShowLegacy(e.target.checked)} 
            />
            Show Legacy Implementation
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={showMigrated} 
              onChange={(e) => setShowMigrated(e.target.checked)} 
            />
            Show Migrated Implementation
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={showBridge} 
              onChange={(e) => setShowBridge(e.target.checked)} 
            />
            Show Bridge Implementation
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={showHOC} 
              onChange={(e) => setShowHOC(e.target.checked)} 
            />
            Show HOC Implementations
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={showPerformance} 
              onChange={(e) => setShowPerformance(e.target.checked)} 
            />
            Show Performance Testing
          </label>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {/* Legacy Implementation */}
        {showLegacy && (
          <LegacyCollectionProvider
            collections={mockCollections}
            componentName="MigratedCollectionExample"
            enableMigration={false}
          >
            <LegacyCollectionList />
          </LegacyCollectionProvider>
        )}

        {/* Migrated Implementation */}
        {showMigrated && (
          <UnifiedCollectionProvider
            collections={mockCollections}
            config={{
              strategy: 'hybrid',
              enableSync: true,
              enableMonitoring: true,
              featureFlags: {
                useZustandStore: true,
                enableOptimizations: true,
                enableCaching: true,
                enableRealtime: true,
              },
            }}
          >
            <MigratedCollectionList />
            <MigrationStatus />
          </UnifiedCollectionProvider>
        )}

        {/* Bridge Implementation */}
        {showBridge && (
          <LegacyCollectionProvider collections={mockCollections}>
            <BridgeCollectionList />
          </LegacyCollectionProvider>
        )}

        {/* HOC Implementations */}
        {showHOC && (
          <LegacyCollectionProvider collections={mockCollections}>
            <div style={{ display: 'grid', gap: '16px' }}>
              <ContextBasedCollectionList />
              <MonitoredCollectionList />
            </div>
          </LegacyCollectionProvider>
        )}

        {/* Performance Testing */}
        {showPerformance && <PerformanceComparison />}
      </div>

      {/* Migration Monitoring */}
      <MigrationMonitor
        showDetails={true}
        enableRealtime={true}
        position="top-right"
        compact={false}
      />

      {/* Development Tools */}
      <MigrationStatusDashboard />
    </div>
  );
};

export default MigratedCollectionExample;