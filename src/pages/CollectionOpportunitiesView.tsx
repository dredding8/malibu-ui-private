import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Intent, Colors, Button, Spinner, Breadcrumbs } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { CollectionOpportunity, ReviewComponent } from '../types/navigation';
import { UnifiedReviewComponent } from '../components/review/UnifiedReviewComponent';
import { ContextualPageHeader } from '../components/navigation/ContextualPageHeader';
import { useNavigationContext } from '../contexts/NavigationContext';
import { NAVIGATION_LABELS, NAVIGATION_ROUTES } from '../constants/navigation';
import AppNavbar from '../components/AppNavbar';

/**
 * Read-only view of collection opportunities for a specific collection
 * Accessed from History page to review which satellite passes were selected
 */
const CollectionOpportunitiesView: React.FC = () => {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { navigateWithContext } = useNavigationContext();
  
  const [opportunities, setOpportunities] = useState<CollectionOpportunity.Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulate fetching collection opportunities
  useEffect(() => {
    const fetchOpportunities = async () => {
      setIsLoading(true);
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Sample data - in real app, fetch from API
        const mockData: CollectionOpportunity.Opportunity[] = [
          {
            id: '1',
            sccNumber: '13113',
            satelliteInfo: {
              priority: 51,
              function: 'ISR',
              orbit: 'LEO',
              periodicity: 6
            },
            collectionDetails: {
              collectionType: 'Wideband',
              classification: 'S//REL FVEY',
              match: 'Optimal',
              matchNotes: ''
            },
            allocation: {
              siteAllocation: ['THU 2', 'FYL 2', 'ASC 2', 'CLR 2', 'HOLT 2'],
              capacityUsage: 80
            },
            status: 'selected',
            selected: true,
            needsReview: false,
            notes: 'Primary collection target'
          },
          {
            id: '2',
            sccNumber: '13162',
            satelliteInfo: {
              priority: 51,
              function: 'ISR',
              orbit: 'LEO',
              periodicity: 6
            },
            collectionDetails: {
              collectionType: 'Wideband',
              classification: 'S//REL FVEY',
              match: 'Optimal',
              matchNotes: ''
            },
            allocation: {
              siteAllocation: ['THU 2', 'FYL 2', 'ASC 2', 'CLR 2', 'HOLT 2'],
              capacityUsage: 75
            },
            status: 'selected',
            selected: true,
            needsReview: false
          },
          {
            id: '3',
            sccNumber: '13777',
            satelliteInfo: {
              priority: 51,
              function: 'ISR',
              orbit: 'LEO',
              periodicity: 6
            },
            collectionDetails: {
              collectionType: 'Wideband',
              classification: 'S//REL FVEY',
              match: 'Baseline',
              matchNotes: 'Secondary target - capacity constraints'
            },
            allocation: {
              siteAllocation: ['CLR 2', 'PPW 1', 'THU 1'],
              capacityUsage: 60
            },
            status: 'selected',
            selected: true,
            needsReview: false
          }
        ];
        
        setOpportunities(mockData);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOpportunities();
  }, [collectionId]);
  
  // Configuration for read-only view
  const reviewConfig: ReviewComponent.Configuration<CollectionOpportunity.Opportunity> = {
    mode: 'collectionOpportunity',
    viewType: 'readonly',
    columns: [
      { 
        key: 'sccNumber', 
        label: 'SCC Number',
        icon: IconNames.CUBE,
        cellRenderer: (value) => <strong>{value}</strong>
      },
      { 
        key: 'satelliteInfo',
        label: 'Priority',
        type: 'metric',
        cellRenderer: (value: CollectionOpportunity.SatelliteInfo) => value.priority
      },
      {
        key: 'satelliteInfo',
        label: 'Function',
        cellRenderer: (value: CollectionOpportunity.SatelliteInfo) => value.function
      },
      {
        key: 'satelliteInfo',
        label: 'Orbit',
        cellRenderer: (value: CollectionOpportunity.SatelliteInfo) => value.orbit
      },
      {
        key: 'collectionDetails',
        label: 'Collection Type',
        cellRenderer: (value: CollectionOpportunity.CollectionDetails) => value.collectionType
      },
      {
        key: 'collectionDetails',
        label: 'Match Quality',
        type: 'tag',
        cellRenderer: (value: CollectionOpportunity.CollectionDetails) => value.match
      },
      {
        key: 'allocation',
        label: 'Site Allocation',
        type: 'multi-tag',
        cellRenderer: (value: CollectionOpportunity.AllocationInfo) => value.siteAllocation
      },
      {
        key: 'allocation',
        label: 'Capacity %',
        type: 'metric',
        cellRenderer: (value: CollectionOpportunity.AllocationInfo) => `${value.capacityUsage}%`
      }
    ],
    actions: [
      {
        id: 'export',
        label: 'Export Data',
        icon: IconNames.DOWNLOAD,
        intent: Intent.NONE,
        handler: async () => {
          console.log('Exporting collection opportunities...');
          // Implement export functionality
        }
      }
    ],
    filters: [
      {
        key: 'function',
        label: 'Function',
        type: 'select',
        options: [
          { label: 'ISR', value: 'ISR' },
          { label: 'Counterspace', value: 'Counterspace' },
          { label: 'Communications', value: 'Communications' }
        ]
      },
      {
        key: 'orbit',
        label: 'Orbit',
        type: 'select',
        options: [
          { label: 'LEO', value: 'LEO' },
          { label: 'MEO', value: 'MEO' },
          { label: 'GEO', value: 'GEO' }
        ]
      }
    ],
    theme: {
      primaryColor: Colors.GREEN3,
      secondaryColor: Colors.GREEN5,
      backgroundColor: Colors.LIGHT_GRAY5,
      surfaceColor: Colors.WHITE,
      accentColor: Colors.GREEN1,
      headerIcon: IconNames.SATELLITE,
      headerGradient: 'linear-gradient(135deg, #0F9960 0%, #3DCC91 100%)'
    },
    contextHelp: {
      title: 'Collection Opportunities',
      content: 'These are the satellite passes that were selected for this collection deck',
      learnMoreUrl: '/help/collection-opportunities'
    }
  };
  
  const handleBack = () => {
    navigate(NAVIGATION_ROUTES.HISTORY, { state: { ...location.state, fromOpportunities: true } });
  };
  
  const handleViewFieldMappings = () => {
    navigate(NAVIGATION_ROUTES.FIELD_MAPPING_REVIEW(collectionId!), { 
      state: { ...location.state, fromOpportunities: true } 
    });
  };
  
  return (
    <div className="collection-opportunities-view">
      <AppNavbar />
      
      <div style={{ 
        padding: '24px',
        backgroundColor: Colors.LIGHT_GRAY5,
        minHeight: 'calc(100vh - 50px)',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Breadcrumbs */}
        <div style={{ marginBottom: '24px' }}>
          <Breadcrumbs
            items={[
              {
                text: NAVIGATION_LABELS.HISTORY,
                icon: IconNames.HISTORY,
                onClick: handleBack
              },
              {
                text: `Collection ${collectionId || 'Unknown'}`,
                icon: IconNames.FOLDER_CLOSE
              },
              {
                text: NAVIGATION_LABELS.COLLECTION_OPPORTUNITIES,
                icon: IconNames.SATELLITE,
                current: true
              }
            ]}
          />
        </div>
        
        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '24px',
          justifyContent: 'flex-end'
        }}>
          <Button
            text={NAVIGATION_LABELS.FIELD_MAPPINGS}
            icon={IconNames.FLOWS}
            intent={Intent.NONE}
            onClick={handleViewFieldMappings}
          />
          <Button
            text={`Back to ${NAVIGATION_LABELS.HISTORY}`}
            icon={IconNames.ARROW_LEFT}
            onClick={handleBack}
          />
        </div>
        
        {/* Review Component */}
        {isLoading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            padding: '60px' 
          }}>
            <Spinner size={50} />
          </div>
        ) : (
          <UnifiedReviewComponent
            mode="collectionOpportunity"
            viewType="readonly"
            data={opportunities}
            config={reviewConfig}
          />
        )}
      </div>
    </div>
  );
};

export default CollectionOpportunitiesView;