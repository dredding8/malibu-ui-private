# Enhanced Override Workflow Components

A comprehensive set of Blueprint-based React components for managing satellite collection pass overrides with advanced features including pass detail comparison, justification workflows, impact analysis, and multi-format data export.

## 🚀 Quick Start

```tsx
import { OverrideWorkflowIntegration } from './components/OverrideWorkflowIntegration';

function App() {
  return (
    <div className="app">
      <OverrideWorkflowIntegration />
    </div>
  );
}
```

## 📦 Components Overview

### PassDetailComparison
Advanced comparison component for baseline and alternative satellite passes.

**Features:**
- ✅ Blueprint Table2 integration with custom cell renderers
- ✅ Card-based view for mobile-friendly layouts
- ✅ Override justification with FormGroup and HTMLSelect
- ✅ Real-time conflict detection and highlighting
- ✅ Sortable columns and filtering capabilities

```tsx
import PassDetailComparison from './components/PassDetailComparison';

<PassDetailComparison
  baselinePasses={baselineData}
  alternativePasses={alternativeData}
  selectedOverrides={selectedSet}
  onOverrideSelect={handleSelection}
  onJustificationChange={handleJustification}
  showAdvancedMetrics={true}
/>
```

### EnhancedOverrideWorkflow
Complete workflow manager with tabbed interface and comprehensive analysis.

**Features:**
- ✅ Multi-tab interface with Blueprint Tabs component
- ✅ Impact analysis with performance projections
- ✅ Conflict resolution with automatic detection
- ✅ Export highlighting with visual effects
- ✅ Multi-format export support (JSON, CSV, Excel, PDF, KML, XML)

```tsx
import EnhancedOverrideWorkflow from './components/EnhancedOverrideWorkflow';

<EnhancedOverrideWorkflow
  isOpen={isWorkflowOpen}
  workflowData={workflowData}
  onClose={handleClose}
  onSave={handleSave}
  onExport={handleExport}
  enableAdvancedAnalysis={true}
  enableExportHighlighting={true}
/>
```

### OverrideWorkflowIntegration
Integration component demonstrating complete usage patterns.

**Features:**
- ✅ Complete working example with mock data
- ✅ Toast notifications for user feedback
- ✅ Statistics dashboard with real-time updates
- ✅ Feature highlights and status tracking

## 🎨 Blueprint Components Used

### Core UI Components
- **Dialog** - Main workflow modal container
- **Card** - Pass detail cards and section containers
- **Button** - Action buttons with intents and icons
- **Tag** - Status indicators and classification labels
- **Callout** - Warnings, errors, and informational messages

### Form Components
- **FormGroup** - Structured form sections with labels
- **HTMLSelect** - Dropdown selections for reasons and priorities
- **TextArea** - Multi-line text input for justifications
- **Switch** - Toggle controls for options and selections
- **Checkbox** - Boolean option selections

### Data Display
- **Table2** - Advanced table with custom cell renderers
- **ProgressBar** - Capacity utilization and quality metrics
- **Tabs** - Multi-section workflow organization
- **Collapse** - Expandable advanced options

### Feedback & Navigation
- **Toast/Toaster** - Success and error notifications
- **Alert** - Security classification warnings
- **Spinner** - Loading states during operations
- **NonIdealState** - Empty states and error conditions

## 🎯 Key Features

### 1. Pass Detail Comparison
- **Table View**: Blueprint Table2 with sortable columns, custom cell renderers
- **Card View**: Mobile-friendly cards with hover effects and selection states
- **Dual Display**: Switch between table and card views seamlessly
- **Advanced Metrics**: Quality scores, capacity utilization, conflict indicators

### 2. Override Justification System
- **Structured Forms**: Blueprint FormGroup components with validation
- **Classification Levels**: Security classification with appropriate warnings
- **Risk Assessment**: Automatic risk level calculation and approval requirements
- **Special Instructions**: Additional operational constraints and requirements

### 3. Export Highlighting Effects
- **Visual Feedback**: Animated highlighting during export operations
- **Element Tracking**: Highlights specific data elements being exported
- **Progressive Enhancement**: Graceful degradation for reduced motion preferences
- **Multi-stage Animation**: Coordinated effects across workflow sections

### 4. Impact Analysis Dashboard
- **Real-time Metrics**: Live calculation of override impacts
- **Performance Projections**: Quality delta and confidence levels
- **Risk Assessment**: Automatic threat level evaluation
- **Resource Allocation**: Capacity reallocation impact analysis

### 5. Conflict Resolution
- **Automatic Detection**: Real-time conflict identification
- **Severity Classification**: Minor, major, and critical conflict levels
- **Resolution Suggestions**: Automated resolution recommendations
- **Manual Override**: Expert review and manual resolution options

### 6. Multi-format Export
- **Format Support**: JSON, CSV, Excel, PDF, KML, XML
- **Configurable Options**: Metadata, timestamps, classification levels
- **Scope Selection**: Selected overrides, all changes, full reports
- **Security Compliance**: Classification-aware export restrictions

## 🔧 Configuration Options

### Export Configuration
```tsx
const exportOptions: ExportOptions = {
  format: 'json' | 'csv' | 'xlsx' | 'pdf' | 'xml' | 'kml',
  scope: 'selected_overrides' | 'all_changes' | 'conflict_analysis' | 'impact_assessment' | 'full_report',
  includeMetadata: boolean,
  includeJustification: boolean,
  includeTimestamps: boolean,
  classificationLevel: 'unclassified' | 'confidential' | 'secret' | 'top_secret',
  customFields: string[]
};
```

### Override Justification
```tsx
const justification: OverrideJustification = {
  reason: 'operational_priority' | 'weather_conditions' | 'equipment_maintenance' | /* ... */,
  priority: 'low' | 'medium' | 'high' | 'critical',
  classification: 'unclassified' | 'confidential' | 'secret' | 'top_secret',
  justificationText: string,
  riskAcceptance: boolean,
  approverRequired: boolean,
  timeConstraints?: { validFrom: string, validUntil: string },
  specialInstructions?: string
};
```

### Pass Detail Structure
```tsx
interface PassDetail {
  id: PassId;
  opportunityId: string;
  siteId: SiteId;
  siteName: string;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  elevation: number; // degrees
  azimuth: number; // degrees
  qualityScore: number; // 0-100
  weatherRisk: 'low' | 'medium' | 'high';
  capacity: number;
  allocated: number;
  isBaseline: boolean;
  isAlternative: boolean;
  conflictLevel: 'none' | 'minor' | 'major' | 'critical';
  impactScore: number; // 0-100
}
```

## 🎨 Styling and Theming

### CSS Custom Properties
```css
.pass-detail-comparison {
  --primary-color: #2b95d6;
  --success-color: #0f9960;
  --warning-color: #d99e0b;
  --danger-color: #db3737;
  --background-color: #f8f9fa;
  --border-color: #e1e8ed;
}
```

### Dark Mode Support
All components include full Blueprint dark theme support:
```css
.bp5-dark .pass-detail-comparison {
  background: #293742;
}
.bp5-dark .comparison-header {
  background: #30404d;
}
```

### Responsive Breakpoints
- **Desktop**: 1024px+ (full feature set)
- **Tablet**: 768px-1023px (adapted layouts)
- **Mobile**: <768px (simplified interfaces)

## ♿ Accessibility Features

### WCAG 2.1 AA Compliance
- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader Support**: ARIA labels and semantic markup
- **Color Contrast**: Meets contrast ratio requirements
- **Focus Management**: Clear focus indicators and logical tab order

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  .export-highlighted {
    animation: none;
  }
}
```

### High Contrast Mode
```css
@media (prefers-contrast: high) {
  .pass-card {
    border-width: 3px;
  }
}
```

## 🚀 Performance Optimizations

### React Optimizations
- **React.memo**: Prevents unnecessary re-renders
- **useMemo**: Memoizes expensive calculations
- **useCallback**: Stabilizes function references
- **Lazy Loading**: Dynamic imports for large components

### Bundle Optimization
- **Tree Shaking**: Only imports used Blueprint components
- **Code Splitting**: Separate chunks for workflow components
- **Asset Optimization**: Optimized CSS and image assets

## 🧪 Testing

### Component Testing
```bash
npm test PassDetailComparison
npm test EnhancedOverrideWorkflow
npm test OverrideWorkflowIntegration
```

### E2E Testing
```bash
npm run test:playwright -- override-workflow
```

### Visual Testing
```bash
npm run test:visual -- override-components
```

## 📱 Mobile Support

### Touch-Friendly Design
- **44px Minimum Touch Targets**: Accessible button and link sizes
- **Swipe Gestures**: Card navigation and selection
- **Responsive Tables**: Horizontal scrolling for data tables
- **Optimized Layouts**: Stack-based layouts for narrow screens

### Performance on Mobile
- **Reduced Animations**: Lighter effects on mobile devices
- **Optimized Rendering**: Efficient re-renders for touch interactions
- **Network Awareness**: Adaptive loading for slower connections

## 🔒 Security Considerations

### Classification Handling
- **Data Sanitization**: Removes sensitive data based on classification
- **Export Restrictions**: Classification-aware export limitations
- **Audit Logging**: Comprehensive action tracking
- **Access Control**: Role-based feature access

### Best Practices
- **Input Validation**: Comprehensive validation for all inputs
- **XSS Prevention**: Sanitized output rendering
- **CSRF Protection**: Token-based request validation
- **Secure Defaults**: Conservative security settings

## 🐛 Troubleshooting

### Common Issues

**Issue**: Export highlighting not working
```tsx
// Ensure enableExportHighlighting is true
<EnhancedOverrideWorkflow enableExportHighlighting={true} />
```

**Issue**: Table not rendering properly
```tsx
// Check Blueprint Table CSS imports
import '@blueprintjs/table/lib/css/table.css';
```

**Issue**: Dark mode styling issues
```tsx
// Ensure Blueprint core CSS is imported
import '@blueprintjs/core/lib/css/blueprint.css';
```

### Debug Mode
```tsx
// Enable debug logging
localStorage.setItem('DEBUG_OVERRIDE_WORKFLOW', 'true');
```

## 📄 License

This project is part of the Malibu satellite collection management system. All rights reserved.

---

**Built with ❤️ using Blueprint UI components and modern React patterns.**