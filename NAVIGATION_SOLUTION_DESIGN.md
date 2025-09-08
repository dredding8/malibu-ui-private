# Navigation Solution Design Specification

## Overview

This document provides detailed technical specifications for resolving the navigation and information architecture incongruencies between field mapping review and satellite collection opportunity selection workflows.

## Component Architecture

### 1. Unified Review Component Framework

```typescript
// Base review component with shared functionality
interface ReviewComponentProps<T> {
  mode: 'fieldMapping' | 'collectionOpportunity';
  data: T[];
  onSelectionChange: (selected: Set<string>) => void;
  onAction: (action: string, items: T[]) => void;
  config: ReviewConfiguration;
}

interface ReviewConfiguration {
  columns: ColumnDefinition[];
  actions: ActionDefinition[];
  filters: FilterDefinition[];
  theme: ThemeConfiguration;
  contextHelp: ContextHelpConfiguration;
}

// Shared review component
export const UnifiedReviewComponent = <T extends BaseReviewItem>({
  mode,
  data,
  onSelectionChange,
  onAction,
  config
}: ReviewComponentProps<T>) => {
  const theme = useReviewTheme(mode);
  const columns = useColumnConfiguration(mode, config.columns);
  const filters = useFilterConfiguration(mode, config.filters);
  
  return (
    <ReviewContainer theme={theme}>
      <ReviewHeader mode={mode} />
      <ReviewFilters filters={filters} />
      <ReviewTable 
        data={data}
        columns={columns}
        onSelectionChange={onSelectionChange}
      />
      <ReviewActions 
        actions={config.actions}
        onAction={onAction}
      />
    </ReviewContainer>
  );
};
```

### 2. Mode-Specific Implementations

#### Field Mapping Review Component
```typescript
// Field mapping specific implementation
export const FieldMappingReview: React.FC = () => {
  const { collectionId, deckId } = useParams();
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  
  const config: ReviewConfiguration = {
    columns: [
      { key: 'sourceField', label: 'Source Field', icon: IconNames.EXPORT },
      { key: 'targetField', label: 'Target Field', icon: IconNames.IMPORT },
      { key: 'confidence', label: 'Confidence', type: 'badge' },
      { key: 'matchType', label: 'Match Type', type: 'tag' },
      { key: 'sensorCapacity', label: 'Capacity', type: 'metric' }
    ],
    actions: [
      { id: 'approve', label: 'Approve Mappings', intent: Intent.SUCCESS },
      { id: 'reject', label: 'Reject Mappings', intent: Intent.DANGER },
      { id: 'modify', label: 'Modify Mappings', intent: Intent.PRIMARY }
    ],
    filters: [
      { key: 'confidence', type: 'select', options: ['high', 'medium', 'low'] },
      { key: 'status', type: 'select', options: ['pending', 'approved', 'rejected'] },
      { key: 'search', type: 'text', placeholder: 'Search field names...' }
    ],
    theme: {
      primaryColor: Colors.BLUE3,
      headerIcon: IconNames.FLOWS,
      accentColor: Colors.BLUE1
    },
    contextHelp: {
      title: 'Field Mapping Review',
      content: 'Review and approve how data fields from your source system map to the target collection format.',
      learnMoreUrl: '/help/field-mappings'
    }
  };
  
  return (
    <PageLayout>
      <NavigationBreadcrumbs items={[
        { text: 'History', href: '/history', icon: IconNames.HISTORY },
        { text: 'Collection Results', href: `/collection/${collectionId}` },
        { text: 'Field Mapping Review', current: true, icon: IconNames.FLOWS }
      ]} />
      
      <UnifiedReviewComponent
        mode="fieldMapping"
        data={mappings}
        onSelectionChange={handleSelectionChange}
        onAction={handleAction}
        config={config}
      />
    </PageLayout>
  );
};
```

#### Collection Opportunity Selection Component
```typescript
// Collection opportunity specific implementation
export const CollectionOpportunitySelection: React.FC = () => {
  const [opportunities, setOpportunities] = useState<CollectionOpportunity[]>([]);
  const { wizardData, updateWizardData } = useWizardContext();
  
  const config: ReviewConfiguration = {
    columns: [
      { key: 'sccNumber', label: 'SCC #', icon: IconNames.NUMERICAL_TEXT },
      { key: 'priority', label: 'Priority', type: 'number', sortable: true },
      { key: 'orbit', label: 'Orbit', icon: IconNames.GLOBE_NETWORK },
      { key: 'collectionType', label: 'Type', type: 'tag' },
      { key: 'siteAllocation', label: 'Sites', type: 'multi-tag' }
    ],
    actions: [
      { id: 'select', label: 'Select Opportunities', intent: Intent.PRIMARY },
      { id: 'filter', label: 'Apply Filters', intent: Intent.NONE },
      { id: 'reset', label: 'Reset Selection', intent: Intent.WARNING }
    ],
    filters: [
      { key: 'orbit', type: 'select', options: ['LEO', 'MEO', 'GEO'] },
      { key: 'priority', type: 'range', min: 1, max: 100 },
      { key: 'collectionType', type: 'multi-select', options: ['Wideband', 'Narrowband', 'Optical'] }
    ],
    theme: {
      primaryColor: Colors.GREEN3,
      headerIcon: IconNames.SATELLITE,
      accentColor: Colors.GREEN1
    },
    contextHelp: {
      title: 'Selecting Collection Opportunities',
      content: 'Choose satellite passes that meet your collection requirements. Selected opportunities will be included in your collection deck.',
      learnMoreUrl: '/help/satellite-selection'
    }
  };
  
  return (
    <WizardStep step={3} title="Select Collection Opportunities">
      <UnifiedReviewComponent
        mode="collectionOpportunity"
        data={opportunities}
        onSelectionChange={handleOpportunitySelection}
        onAction={handleWizardAction}
        config={config}
      />
    </WizardStep>
  );
};
```

### 3. Navigation Context Provider

```typescript
// Context for maintaining navigation state and preventing confusion
interface NavigationContextState {
  currentContext: 'history' | 'creation' | 'review';
  breadcrumbs: BreadcrumbItem[];
  contextualHelp: ContextHelp;
  canNavigateAway: boolean;
}

export const NavigationContextProvider: React.FC = ({ children }) => {
  const [state, setState] = useState<NavigationContextState>({
    currentContext: 'history',
    breadcrumbs: [],
    contextualHelp: null,
    canNavigateAway: true
  });
  
  const location = useLocation();
  
  // Update context based on route
  useEffect(() => {
    const context = determineContext(location.pathname);
    const breadcrumbs = generateBreadcrumbs(location.pathname);
    const help = getContextualHelp(context);
    
    setState(prev => ({
      ...prev,
      currentContext: context,
      breadcrumbs,
      contextualHelp: help
    }));
  }, [location]);
  
  return (
    <NavigationContext.Provider value={state}>
      {children}
    </NavigationContext.Provider>
  );
};
```

### 4. Visual Design System Updates

```typescript
// Theme configuration for different contexts
export const ReviewThemes = {
  fieldMapping: {
    primary: '#2965CC',      // Blueprint Blue
    secondary: '#48AFF0',    // Light Blue
    background: '#F7F8FA',   // Light Gray
    accent: '#0F9960',       // Success Green
    icon: IconNames.FLOWS,
    headerGradient: 'linear-gradient(135deg, #2965CC 0%, #48AFF0 100%)'
  },
  collectionOpportunity: {
    primary: '#0F9960',      // Blueprint Green
    secondary: '#3DCC91',    // Light Green
    background: '#F7FAF5',   // Light Green Tint
    accent: '#2965CC',       // Info Blue
    icon: IconNames.SATELLITE,
    headerGradient: 'linear-gradient(135deg, #0F9960 0%, #3DCC91 100%)'
  }
};

// Styled components for consistent theming
export const ReviewContainer = styled.div<{ theme: typeof ReviewThemes.fieldMapping }>`
  background: ${props => props.theme.background};
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  .review-header {
    background: ${props => props.theme.headerGradient};
    color: white;
    padding: 24px;
    border-radius: 8px 8px 0 0;
  }
  
  .review-icon {
    color: ${props => props.theme.accent};
  }
`;
```

### 5. Route Configuration with Guards

```typescript
// Updated router configuration with context guards
const routes = [
  {
    path: '/history',
    element: <History />,
    context: 'history'
  },
  {
    path: '/history/:collectionId/field-mapping-review',
    element: <FieldMappingReview />,
    context: 'review',
    guard: requireCollectionContext
  },
  {
    path: '/create-collection-deck',
    element: <CreateCollectionDeckWizard />,
    context: 'creation',
    children: [
      {
        path: 'data',
        element: <Step1InputData />
      },
      {
        path: 'parameters', 
        element: <Step2ReviewParameters />
      },
      {
        path: 'collection-opportunities',  // Renamed from 'matches'
        element: <Step3SelectOpportunities />
      },
      {
        path: 'instructions',
        element: <Step4SpecialInstructions />
      }
    ]
  }
];

// Context guard to prevent navigation confusion
function requireCollectionContext(route: Route): boolean {
  const { state } = useLocation();
  return state?.fromCollection === true;
}
```

### 6. User Education Components

```typescript
// Contextual education overlay
export const ContextEducation: React.FC = () => {
  const { currentContext } = useNavigationContext();
  const [showEducation, setShowEducation] = useState(false);
  
  const educationContent = {
    fieldMapping: {
      title: "Understanding Field Mappings",
      steps: [
        "Field mappings connect your source data to the collection format",
        "Review each mapping for accuracy and completeness",
        "Approve mappings to finalize the data transformation"
      ],
      visual: <FieldMappingDiagram />
    },
    collectionOpportunity: {
      title: "Selecting Satellite Passes",
      steps: [
        "Each row represents a potential satellite collection opportunity",
        "Review orbital parameters and site allocations",
        "Select opportunities that meet your requirements"
      ],
      visual: <SatelliteOrbitDiagram />
    }
  };
  
  return (
    <Drawer
      isOpen={showEducation}
      onClose={() => setShowEducation(false)}
      title={educationContent[currentContext]?.title}
    >
      <div className="education-content">
        {educationContent[currentContext]?.visual}
        <ol>
          {educationContent[currentContext]?.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>
    </Drawer>
  );
};
```

## Implementation Guidelines

### 1. Phased Migration Strategy

#### Phase 1: Parallel Implementation (Week 1-2)
- Implement new components alongside existing ones
- Add feature flags for gradual rollout
- Monitor user behavior and feedback

#### Phase 2: User Testing (Week 3)
- A/B test with 10% of users
- Collect metrics on navigation success
- Iterate based on feedback

#### Phase 3: Full Migration (Week 4-5)
- Roll out to all users
- Deprecate old components
- Update documentation

### 2. Testing Strategy

```typescript
// E2E test for navigation clarity
describe('Navigation Context Clarity', () => {
  it('should clearly differentiate between field mapping and collection opportunities', () => {
    // Navigate to field mapping review
    cy.visit('/history/123/field-mapping-review');
    cy.get('[data-testid="page-header"]').should('contain', 'Field Mapping Review');
    cy.get('[data-testid="context-icon"]').should('have.class', 'flows-icon');
    
    // Navigate to collection opportunities
    cy.visit('/create-collection-deck/collection-opportunities');
    cy.get('[data-testid="page-header"]').should('contain', 'Select Collection Opportunities');
    cy.get('[data-testid="context-icon"]').should('have.class', 'satellite-icon');
  });
  
  it('should maintain context during navigation', () => {
    cy.visit('/history');
    cy.get('[data-testid="collection-row"]').first().click();
    cy.get('[data-testid="view-field-mappings"]').click();
    
    // Verify breadcrumbs maintain context
    cy.get('[data-testid="breadcrumbs"]').should('contain', 'History');
    cy.get('[data-testid="breadcrumbs"]').should('contain', 'Collection Results');
    cy.get('[data-testid="breadcrumbs"]').should('contain', 'Field Mapping Review');
  });
});
```

### 3. Performance Considerations

```typescript
// Optimize large dataset handling
const ReviewTable = memo(({ data, columns, onSelectionChange }) => {
  // Virtualize table for large datasets
  const rowVirtualizer = useVirtual({
    size: data.length,
    parentRef,
    estimateSize: useCallback(() => 50, []),
    overscan: 5
  });
  
  // Memoize expensive computations
  const processedData = useMemo(() => 
    processDataForDisplay(data, columns),
    [data, columns]
  );
  
  return (
    <VirtualizedTable
      data={processedData}
      virtualizer={rowVirtualizer}
      onSelectionChange={onSelectionChange}
    />
  );
});
```

## Success Criteria

### Measurable Outcomes
1. **Navigation Success Rate**: >95% users reach intended destination
2. **Context Confusion**: <5% support tickets about "match review" confusion
3. **Task Completion Time**: 40% reduction in average completion time
4. **User Satisfaction**: 4.5/5 stars in post-task surveys

### Technical Metrics
1. **Performance**: Page load <2s, interaction response <100ms
2. **Accessibility**: WCAG 2.1 AA compliance score >95%
3. **Code Coverage**: >85% test coverage for navigation components
4. **Bundle Size**: <50KB increase from refactoring